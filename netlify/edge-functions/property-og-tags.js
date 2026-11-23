// Injects per-listing Open Graph / Twitter Card meta tags into the HTML for
// a property page — both the canonical /property/:slug/:id and the legacy
// bare /property/:id (old links, anything already shared/indexed before
// slugs existed) — so sharing a listing link (WhatsApp, Facebook, iMessage,
// etc.) shows that property's own title/photo/price instead of the
// site-wide defaults baked into index.html. Link-preview crawlers fetch the
// raw HTML and don't execute JavaScript, so this can't be solved client-side
// the way the tab title is (see src/shared/seo/usePageTitle.js) — the tags have
// to already be in the response before it reaches them.
//
// The same raw HTML also gets the page's <title> (same format as the tab), a plain
// HTML summary of the listing (title, place, price, rooms, description, with links
// back to Home and Browse) and its JSON-LD, both placed inside <div id="root"> —
// React replaces that content when it starts, so the visitor's page and its own
// JSON-LD (PropertyDetailPage) are never doubled. Every visitor gets the same HTML;
// nothing here looks at who is asking.
//
// A listing that doesn't exist (an id that isn't a UUID, or one Supabase says has no
// published property) gets a real 404 status with the normal page, which shows its
// own "doesn't exist" message. Anything short of a clear "no such property" — Supabase
// down, slow or answering with an error — leaves the response untouched (200): a short
// outage during a crawl must not get real listings dropped from search.
//
// The canonical URL and og:url are the production domain (VITE_SITE_URL) plus the
// listing's own path (buildPropertyUrl) — never the request's host (a Deploy Preview),
// query string (tracking parameters) or trailing slash.
//
// Declared inline via `config` below (Netlify's in-source configuration),
// so no netlify.toml entry is needed — this scopes the function to exactly
// this one route; every other request on the site is untouched by it.
//
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be set as
// environment variables with the "Edge functions" scope in Netlify's site
// settings — the build-time env vars used elsewhere in this project aren't
// automatically available to edge functions, which run per-request at
// deploy time, not at build time. Same values already used in
// src/shared/api/supabaseClient.js; the anon key is safe to reuse here since RLS
// (not this file) is what restricts what it can read.
//
// TODO(production): until VITE_SITE_URL is set, the placeholder domain below is
// used — see the go-live checklist.

import { buildPropertyUrl } from "../../src/shared/lib/propertyUrl.js";
import { formatPrice } from "../../src/site/lib/formatPrice.js";
import { formatPageTitle } from "../../src/shared/seo/pageMeta.js";

const SITE_URL = (Deno.env.get("VITE_SITE_URL") || "https://REPLACE-WITH-PRODUCTION-DOMAIN.example").replace(/\/+$/, "");

// How long to wait for Supabase before giving up and serving the page untouched.
const SUPABASE_TIMEOUT_MS = 4000;

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A listing id is always a UUID. Anything else (a typo, a crawler guessing
// addresses, an attempt to smuggle extra query parameters into the request
// below) is not worth a database request — and cannot be a listing, so it gets
// the 404 without asking.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Supabase responded with ${response.status}`);
  return response.json();
}

// The property, or null when Supabase answered and there is no such published
// property. Throws when it could not be asked or did not answer properly (an
// error status, a timeout, no connection): that is not "missing", and the caller
// must not treat it as such.
async function fetchProperty(id, supabaseUrl, supabaseAnonKey) {
  const headers = { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` };

  // Same public, anon-role query the app itself runs (see
  // src/site/api/siteData.js) — RLS already scopes this to
  // published listings, so a draft or deleted property's id just comes
  // back empty rather than ever being fetchable here.
  const [property] = await fetchJson(
    `${supabaseUrl}/rest/v1/properties?id=eq.${encodeURIComponent(id)}&status=eq.published&select=id,title,description,location,price,listing_type,beds,baths,area&limit=1`,
    headers,
  );
  if (!property) return null;

  // The photo is a nice-to-have: without it the listing still gets everything else.
  let image = null;
  try {
    const [cover] = await fetchJson(
      `${supabaseUrl}/rest/v1/property_images?property_id=eq.${encodeURIComponent(id)}&select=url&order=sort_order.asc&limit=1`,
      headers,
    );
    image = cover?.url ?? null;
  } catch (error) {
    console.error("[property-og-tags] Failed to fetch the cover photo:", error);
  }

  return { ...property, image };
}

function buildPriceLabel(property) {
  return property.listing_type === "rent"
    ? `${formatPrice(Number(property.price))} / month`
    : formatPrice(Number(property.price));
}

// The listing's own description, or a sentence built from its basics when it has none.
function buildFullDescription(property) {
  const fallbackDescription = [
    property.beds ? `${property.beds} bed` : null,
    property.baths ? `${property.baths} bath` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    property.description?.trim() ||
    `${fallbackDescription ? `${fallbackDescription} property` : "Property"} in ${property.location}. ${buildPriceLabel(property)}.`
  );
}

function buildDescription(property) {
  const descriptionSource = buildFullDescription(property);

  return descriptionSource.length > 200 ? `${descriptionSource.slice(0, 197)}...` : descriptionSource;
}

// Puts `tag` into the document, leaving exactly one: the first tag matching
// `pattern` is replaced (index.html ships a default of each one, and a second
// copy would leave two in the document — crawlers tend to read the first, i.e.
// the generic default), any further matches are removed, and when there is none
// the tag is added just before </head>. Replacements go through functions so
// characters like `$&` in a listing's text are never read as replacement patterns.
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

function injectMetaTags(html, property, description, canonicalUrl) {
  const title = `${property.title} — BSI Properties`;
  const image = property.image ?? `${SITE_URL}/og-image.jpg`;

  const metaTags = [
    ["name", "description", description],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:image", image],
    ["property", "og:url", canonicalUrl],
    ["property", "og:type", "website"],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
    ["name", "twitter:image", image],
  ];

  // The tab's own title, in the format usePageTitle gives it.
  let result = setTag(html, TITLE_PATTERN(), `<title>${escapeHtml(formatPageTitle(property.title))}</title>`);
  for (const [attribute, key, content] of metaTags) {
    result = setTag(
      result,
      metaPattern(attribute, key),
      `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`,
    );
  }
  return setTag(result, CANONICAL_PATTERN(), `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
}

// Same fields as the RealEstateListing in PropertyDetailPage.jsx (name, description,
// url, image, address, offers). That one is React's, this one is for the raw HTML; it
// is removed from the page when React starts, so there are never two.
function buildListingJsonLd(property, fullDescription, canonicalUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: fullDescription,
    url: canonicalUrl,
    image: property.image ? [property.image] : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressCountry: "MA",
    },
    offers: {
      "@type": "Offer",
      price: Number(property.price),
      priceCurrency: "MAD",
      availability: "https://schema.org/InStock",
    },
  };
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

// Plain HTML, no styling: crawlers read it, and React replaces it on mount.
function buildSummaryHtml(property, fullDescription, listingJsonLd) {
  const listingType = property.listing_type === "sale" ? "sale" : "rent";
  const facts = buildFacts(property);
  const paragraphs = fullDescription
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  return [
    "<article>",
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/properties/${listingType}">${
      listingType === "sale" ? "Buy" : "Rent"
    }</a> / <span>${escapeHtml(property.title)}</span></nav>`,
    `<h1>${escapeHtml(property.title)}</h1>`,
    `<p>${escapeHtml(property.location)}</p>`,
    `<p>${escapeHtml(buildPriceLabel(property))}</p>`,
    facts.length > 0 ? `<ul>${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>` : "",
    paragraphs,
    // `<` is escaped so a value containing "</script>" can never end the tag early (same as JsonLd.jsx).
    `<script type="application/ld+json">${JSON.stringify(listingJsonLd).replace(/</g, "\\u003c")}</script>`,
    "</article>",
  ].join("");
}

// Fills the empty <div id="root"></div>; when the page has none, it is left as it is.
function injectSummary(html, summaryHtml) {
  return html.replace(ROOT_PATTERN, () => `<div id="root">${summaryHtml}</div>`);
}

export default async (request, context) => {
  const response = await context.next();
  // Until the body is read, `response` itself is the untouched original; once it is,
  // the clone made first is.
  let original = response;

  try {
    // Only ever touch actual HTML documents. The SPA's catch-all rewrite
    // (public/_redirects: /* -> /index.html) means this route pattern could
    // in principle see something other than the document itself; bail out
    // rather than risk mangling a non-HTML response.
    const contentType = response.headers.get("content-type") ?? "";
    if (response.status !== 200 || !contentType.includes("text/html")) return response;

    const id = context.params.id;

    // Not a UUID, so not a listing: the same page, with the status that says so. No
    // database request needed for that.
    if (!id || !UUID_PATTERN.test(id)) return notFound(response);

    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) return response;

    let property;
    try {
      property = await fetchProperty(id, supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error("[property-og-tags] Failed to fetch property:", error);
      return response; // Fall back to index.html's default tags, status unchanged.
    }

    // Unpublished, deleted, or never existed — Supabase answered, and there is
    // nothing to show. The SPA's own "doesn't exist" message takes over as normal,
    // now with the 404 status that tells crawlers the same.
    if (!property) return notFound(response);

    // Keep an untouched copy: reading the body consumes it, and we must be able to return the original.
    original = response.clone();
    const html = await response.text();
    if (!html.includes("</head>")) return original;

    const description = buildDescription(property);
    const fullDescription = buildFullDescription(property);
    // Always the real canonical URL, regardless of which path pattern the
    // incoming request actually matched (the bare legacy /property/:id, a
    // slug that's since gone stale, or a hand-edited URL) — og:url and the
    // canonical tag should point at the one real URL for this listing, not
    // just echo back whatever was requested.
    const canonicalUrl = `${SITE_URL}${buildPropertyUrl(property)}`;
    const withTags = injectMetaTags(html, property, description, canonicalUrl);
    const withSummary = injectSummary(
      withTags,
      buildSummaryHtml(property, fullDescription, buildListingJsonLd(property, fullDescription, canonicalUrl)),
    );

    // The body length changed, so the original Content-Length header is now
    // wrong — drop it and let the runtime recompute it, or some clients will
    // truncate the response at the old byte count.
    const headers = new Headers(response.headers);
    headers.delete("content-length");

    return new Response(withSummary, { status: response.status, headers });
  } catch (error) {
    console.error("[property-og-tags] Failed to inject property metadata:", error);
    return original;
  }
};

// The page exactly as it was, with a 404 status: the SPA still loads and shows its
// own "doesn't exist" message, and crawlers see that the address is not a listing.
function notFound(response) {
  return new Response(response.body, { status: 404, statusText: "Not Found", headers: response.headers });
}

// Both the plain and the trailing-slash form of each path are listed, so the two never get different HTML.
// onError: "bypass" serves the static page if the function itself fails.
export const config = {
  path: ["/property/:id", "/property/:id/", "/property/:slug/:id", "/property/:slug/:id/"],
  onError: "bypass",
};