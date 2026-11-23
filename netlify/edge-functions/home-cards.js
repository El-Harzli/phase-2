// Puts the homepage's own <title>, description, canonical link and share tags into the HTML
// for "/", and fills <div id="root"> with its heading, links to the site's main pages and the
// plain featured property cards — real <a href> links to each listing — so a crawler that
// doesn't run JavaScript can read the page and walk from it to every featured listing and every
// main page. React replaces that content when it starts, so the visitor's page is never doubled.
//
// The featured cards are the ones HomePage's FeaturedPropertiesSection shows: published listings
// with a featured_order, in that order (fetchFeaturedProperties in src/site/api/properties.js),
// both the For Rent and the For Sale tab. The Home page has no ?page, so neither does this.
//
// The words in the title and description come from src/shared/seo/pageMeta.js, a plain file (no
// "@/" shortcuts, no React) so this Deno function can import it. The heading, intro and
// "Featured Properties" text below are written out here and have to be kept in step with
// HeroSection.jsx and FeaturedPropertiesSection.jsx by hand.
//
// The canonical URL is the production domain (VITE_SITE_URL) plus "/" — never the request's host
// (a Deploy Preview) or its query string (tracking parameters).
//
// Runs on the same path as hero-preload (the homepage hero image preload), and each one only
// edits its own part of the page, so the order they run in doesn't matter for the HTML. The
// response is cached exactly like that function's — browsers revalidate, the Netlify CDN keeps it
// for one hour — so the headers are the same whichever of the two answers last.
//
// Fail-open by design: only a successful HTML response is touched, and on any failure —
// including Supabase being down, slow or answering with an error — the original response is
// returned untouched.
//
// Requires VITE_SITE_URL, VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables
// with the "Edge functions" scope (same ones browse-cards.js and property-og-tags.js read). The anon
// key is safe to reuse here since RLS (not this file) is what restricts what it can read.
//
// TODO(production): until VITE_SITE_URL is set, the placeholder domain below is used — see
// the go-live checklist.

import { PAGE_META, PAGE_PATHS, SITE_NAME, formatPageTitle } from "../../src/shared/seo/pageMeta.js";
import { buildPropertyUrl } from "../../src/shared/lib/propertyUrl.js";
import { formatPrice } from "../../src/site/lib/formatPrice.js";

const SITE_URL = (Deno.env.get("VITE_SITE_URL") || "https://REPLACE-WITH-PRODUCTION-DOMAIN.example").replace(/\/+$/, "");

// How long to wait for Supabase before giving up and serving the page untouched.
const SUPABASE_TIMEOUT_MS = 4000;

// Supabase's own cap per request is 1000 rows; far more featured listings than that is not realistic.
const MAX_ROWS = 1000;

// Copy of the texts in HeroSection.jsx and FeaturedPropertiesSection.jsx.
const HEADING = "Find a Place you’ll Call Home";
const INTRO = "Curated villas and apartments to rent or buy in Tangier’s finest neighborhoods.";
const FEATURED_TITLE = "Featured Properties";
const FEATURED_DESCRIPTION = "Discover handpicked residences that embody sophistication and timeless elegance in Tangier.";

// The site's main pages, as plain links.
const MAIN_LINKS = [
  [PAGE_PATHS.rent, "Rent"],
  [PAGE_PATHS.sale, "Buy"],
  [PAGE_PATHS.neighborhoods, "Neighborhoods"],
  [PAGE_PATHS.concierge, "Concierge"],
  [PAGE_PATHS.about, "About"],
  [PAGE_PATHS.contact, "Contact"],
];

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The listings the admin chose to show on Home (Dashboard → Featured): published ones with a
// featured_order, in that order (the id breaks ties), for both rent and sale.
async function fetchFeatured(supabaseUrl, supabaseAnonKey) {
  const headers = { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` };

  // Same public, anon-role query the app itself runs — RLS already scopes this to
  // published listings; the status filter is the same one the app adds.
  const response = await fetch(
    `${supabaseUrl}/rest/v1/properties?status=eq.published&featured_order=not.is.null&select=id,title,location,price,beds,baths,area,listing_type,featured_order&order=featured_order.asc,id.asc&limit=${MAX_ROWS}`,
    { headers, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) },
  );
  if (!response.ok) throw new Error(`Supabase responded with ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Supabase did not return a list");
  return rows;
}

// Puts `tag` into the document, leaving exactly one: the first tag matching
// `pattern` is replaced, any further matches are removed, and when there is none
// the tag is added just before </head>. Replacements go through functions so
// characters like `$&` in a page's text are never read as replacement patterns.
function setTag(html, pattern, tag) {
  let replaced = false;
  const result = html.replace(pattern, () => {
    if (replaced) return "";
    replaced = true;
    return tag;
  });
  if (replaced) return result;
  return result.replace("</head>", () => `    ${tag}\n  </head>`);
}

// Written to match whatever attribute order or line breaks the built index.html has.
function metaPattern(attribute, key) {
  return new RegExp(`<meta\\b[^>]*?\\b${attribute}=["']${escapeRegExp(key)}["'][^>]*>`, "gi");
}

const TITLE_PATTERN = () => /<title\b[^>]*>[\s\S]*?<\/title>/gi;
const CANONICAL_PATTERN = () => /<link\b[^>]*?\brel=["']canonical["'][^>]*>/gi;
const ROOT_PATTERN = /<div\s+id=["']root["'][^>]*>\s*<\/div>/i;

function injectHead(html, { title, description, canonicalUrl }) {
  const image = `${SITE_URL}/og-image.jpg`;

  const metaTags = [
    ["name", "description", description],
    ["property", "og:site_name", SITE_NAME],
    ["property", "og:type", "website"],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:image", image],
    ["property", "og:url", canonicalUrl],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
    ["name", "twitter:image", image],
  ];

  let result = setTag(html, TITLE_PATTERN(), `<title>${escapeHtml(title)}</title>`);
  for (const [attribute, key, content] of metaTags) {
    result = setTag(
      result,
      metaPattern(attribute, key),
      `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`,
    );
  }
  return setTag(result, CANONICAL_PATTERN(), `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
}

// Beds, size, baths — a fact that doesn't apply (a studio has no bedrooms, a plot
// has no baths) is left out rather than shown as "0". Same rule as the Browse map's
// preview card (PropertyMap.jsx).
function buildFacts(property) {
  const beds = Number(property.beds);
  const area = Number(property.area);
  const baths = Number(property.baths);
  return [
    beds > 0 && `${beds} ${beds === 1 ? "Bed" : "Beds"}`,
    area > 0 && `${area}m²`,
    baths > 0 && `${baths} ${baths === 1 ? "Bath" : "Baths"}`,
  ].filter(Boolean);
}

function buildCardHtml(property, listingType) {
  const price = formatPrice(Number(property.price));
  const facts = buildFacts(property);
  return [
    "<li>",
    `<a href="${escapeHtml(buildPropertyUrl(property))}">${escapeHtml(property.title)}</a>`,
    `<p>${escapeHtml(property.location)}</p>`,
    `<p>${escapeHtml(listingType === "rent" ? `${price} / month` : price)}</p>`,
    facts.length > 0 ? `<ul>${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>` : "",
    "</li>",
  ].join("");
}

// One tab of the Featured Properties section: its heading, its cards, and the link to all of that type.
function buildFeaturedGroupHtml(listingType, label, rows) {
  if (rows.length === 0) return "";
  return [
    `<h3>${label}</h3>`,
    `<ul>${rows.map((property) => buildCardHtml(property, listingType)).join("")}</ul>`,
    `<p><a href="${PAGE_PATHS[listingType]}">View All Properties</a></p>`,
  ].join("");
}

// Plain HTML, no styling: crawlers read it, and React replaces it on mount.
function buildHomeHtml(rows) {
  const rent = rows.filter((property) => property.listing_type === "rent");
  const sale = rows.filter((property) => property.listing_type === "sale");
  return [
    "<div>",
    `<nav aria-label="Main">${MAIN_LINKS.map(([path, label]) => `<a href="${path}">${label}</a>`).join(" ")}</nav>`,
    `<h1>${escapeHtml(HEADING)}</h1>`,
    `<p>${escapeHtml(INTRO)}</p>`,
    "<section>",
    `<h2>${escapeHtml(FEATURED_TITLE)}</h2>`,
    `<p>${escapeHtml(FEATURED_DESCRIPTION)}</p>`,
    buildFeaturedGroupHtml("rent", "For Rent", rent),
    buildFeaturedGroupHtml("sale", "For Sale", sale),
    "</section>",
    "</div>",
  ].join("");
}

// Fills the empty <div id="root"></div>; when the page has none, it is left as it is.
function injectHome(html, homeHtml) {
  return html.replace(ROOT_PATTERN, () => `<div id="root">${homeHtml}</div>`);
}

export default async (request, context) => {
  if (request.method !== "GET") return context.next();

  const response = await context.next();
  // Until the body is read, `response` itself is the untouched original; once it is,
  // the clone made first is.
  let original = response;

  try {
    const contentType = response.headers.get("content-type") || "";
    if (response.status !== 200 || !contentType.includes("text/html")) return response;

    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) return response;

    let rows;
    try {
      rows = await fetchFeatured(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error("[home-cards] Failed to fetch featured properties:", error);
      return response; // Fall back to index.html as it is.
    }

    // Keep an untouched copy: reading the body consumes it, and we must be able to return the original.
    original = response.clone();
    const html = await response.text();
    if (!html.includes("</head>")) return original;

    const meta = PAGE_META.home;
    const withHead = injectHead(html, {
      title: formatPageTitle(meta.title),
      description: meta.description,
      canonicalUrl: `${SITE_URL}${PAGE_PATHS.home}`,
    });
    const body = injectHome(withHead, buildHomeHtml(rows));

    const headers = new Headers(response.headers);
    // The body length changed, so the old Content-Length (and any validator tied to the old body) is stale.
    headers.delete("content-length");
    headers.delete("etag");
    // Same as the hero-preload function on this path: browsers always revalidate; the Netlify CDN may keep
    // this response for one hour. Atomic deploys invalidate the CDN cache on every deploy.
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    headers.set("Netlify-CDN-Cache-Control", "public, s-maxage=3600");

    return new Response(body, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    console.error("[home-cards] Failed to inject homepage content:", error);
    return original;
  }
};

// cache: "manual" is required, otherwise edge function responses are never cached and this would add an
// uncached Supabase round trip to every visit of the homepage. onError: "bypass" serves the static page if
// the function itself fails.
export const config = {
  path: "/",
  cache: "manual",
  onError: "bypass",
};