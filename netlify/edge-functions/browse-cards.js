// Puts the Browse page's own <title>, description, canonical link and share tags into
// the HTML for /properties/rent and /properties/sale, and fills <div id="root"> with
// the page's heading and one page of plain property cards — real <a href> links to
// each listing, plus links to the other result pages — so a crawler that doesn't run
// JavaScript can read the page and walk from it to every listing. React replaces
// that content when it starts, so the visitor's page is never doubled.
//
// What the raw HTML shows mirrors the unfiltered Browse page (BrowsePage / PropertyList):
// the same heading, the same order ("Popular" first, then newest — see browseSort.js and
// fetchBrowseProperties in src/site/api/properties.js), pages of 12 with the same ?page
// rules as useBrowseFilters (missing, junk, "0" or negative is page 1; one past the last
// page is the last page). The server can't know the screen size, so it always shows the
// 12-per-page layout; phones get 8 per page once React starts (src/site/hooks/usePageSize.js).
// Filters (?q, ?neighborhood) are client-only: the raw HTML is the unfiltered list for
// every visitor, and the canonical link ignores them, like any other parameter besides ?page.
//
// The words come from src/shared/seo/pageMeta.js and src/site/lib/pagination.js — plain
// files (no "@/" shortcuts, no React) so this Deno function can import them.
//
// The canonical URL is the production domain (VITE_SITE_URL) plus the page's own path (and
// ?page=N from page 2 on) — never the request's host (a Deploy Preview) or any other query
// parameter, with or without a trailing slash on the request.
//
// Fail-open by design: only a successful HTML response is touched, and on any failure —
// including Supabase being down, slow or answering with an error — the original response is
// returned untouched.
//
// Requires VITE_SITE_URL, VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment
// variables with the "Edge functions" scope (same ones property-og-tags.js reads). The anon
// key is safe to reuse here since RLS (not this file) is what restricts what it can read.
//
// TODO(production): until VITE_SITE_URL is set, the placeholder domain below is used — see
// the go-live checklist.

import { PAGE_META, PAGE_PATHS, SITE_NAME, formatPageTitle } from "../../src/shared/seo/pageMeta.js";
import { PAGE_SIZE_LARGE, getPageNumbers } from "../../src/site/lib/pagination.js";
import { buildPropertyUrl } from "../../src/shared/lib/propertyUrl.js";
import { formatPrice } from "../../src/site/lib/formatPrice.js";

const SITE_URL = (Deno.env.get("VITE_SITE_URL") || "https://REPLACE-WITH-PRODUCTION-DOMAIN.example").replace(/\/+$/, "");

// How long to wait for Supabase before giving up and serving the page untouched.
const SUPABASE_TIMEOUT_MS = 4000;

// The Browse page is a list of every published property of one type, read in one
// request (Supabase's own cap is 1000 rows; the React page reads in pages beyond that).
const MAX_ROWS = 1000;

// The pages this function handles, found by their canonical path.
const LISTING_KEYS = ["rent", "sale"];
const LISTING_KEY_BY_PATH = new Map(LISTING_KEYS.map((key) => [PAGE_PATHS[key], key]));

// "/properties/rent/" and "/properties/rent" are the same page: drop trailing slashes.
function normalizePath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Same reading of ?page as useBrowseFilters: anything that isn't a whole number above 1 is page 1.
function parsePage(searchParams) {
  const number = Number.parseInt(searchParams.get("page") ?? "", 10);
  return Number.isInteger(number) && number > 1 ? number : 1;
}

// A page's address: the plain path for page 1, ?page=N after that (same as the React page).
function pagePath(path, page) {
  return page > 1 ? `${path}?page=${page}` : path;
}

// Every published property of one type, in the order the React Browse page starts from:
// newest first with the id as tie-breaker (what fetchBrowseProperties asks for), then
// "Popular" ones first — a stable sort, so inside each group the order stays newest first.
async function fetchListings(listingType, supabaseUrl, supabaseAnonKey) {
  const headers = { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` };

  // Same public, anon-role query the app itself runs — RLS already scopes this to
  // published listings; the status filter is the same one the app adds.
  const response = await fetch(
    `${supabaseUrl}/rest/v1/properties?status=eq.published&listing_type=eq.${encodeURIComponent(listingType)}&select=id,title,location,price,beds,baths,area,popular,created_at&order=created_at.desc,id.asc&limit=${MAX_ROWS}`,
    { headers, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) },
  );
  if (!response.ok) throw new Error(`Supabase responded with ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Supabase did not return a list");

  return rows.sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)));
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

// Links to the other result pages: previous, numbered (with "…" for skipped ones) and next.
// Real links, because a crawler can follow those and cannot press the buttons React draws.
function buildPaginationHtml(path, page, totalPages) {
  const items = getPageNumbers(page, totalPages).map((item) => {
    if (item === "…") return "<span>…</span>";
    if (item === page) return `<span aria-current="page">${item}</span>`;
    return `<a href="${escapeHtml(pagePath(path, item))}">${item}</a>`;
  });
  const previous = page > 1 ? `<a href="${escapeHtml(pagePath(path, page - 1))}">Previous page</a>` : "";
  const next = page < totalPages ? `<a href="${escapeHtml(pagePath(path, page + 1))}">Next page</a>` : "";
  return `<nav aria-label="Pagination">${previous}${items.join("")}${next}</nav>`;
}

// Plain HTML, no styling: crawlers read it, and React replaces it on mount.
function buildResultsHtml({ listingType, path, heading, page, totalPages, total, pageRows }) {
  const start = (page - 1) * PAGE_SIZE_LARGE;
  return [
    "<div>",
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>${listingType === "sale" ? "Buy" : "Rent"}</span></nav>`,
    `<h1>${escapeHtml(heading)}</h1>`,
    total > 0 ? `<h2>Search results (${total})</h2>` : "",
    pageRows.length > 0
      ? `<ul>${pageRows.map((property) => buildCardHtml(property, listingType)).join("")}</ul>`
      : "",
    totalPages > 1 ? buildPaginationHtml(path, page, totalPages) : "",
    totalPages > 1 ? `<p>Showing ${start + 1}–${start + pageRows.length} of ${total}</p>` : "",
    "</div>",
  ].join("");
}

// Fills the empty <div id="root"></div>; when the page has none, it is left as it is.
function injectResults(html, resultsHtml) {
  return html.replace(ROOT_PATTERN, () => `<div id="root">${resultsHtml}</div>`);
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

    const url = new URL(request.url);
    const path = normalizePath(url.pathname);
    const listingType = LISTING_KEY_BY_PATH.get(path);
    if (!listingType) return response;

    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) return response;

    let rows;
    try {
      rows = await fetchListings(listingType, supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error("[browse-cards] Failed to fetch properties:", error);
      return response; // Fall back to index.html as it is.
    }

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE_LARGE));
    // A page past the last one shows the last one, like the React page.
    const page = Math.min(parsePage(url.searchParams), totalPages);
    const start = (page - 1) * PAGE_SIZE_LARGE;
    const pageRows = rows.slice(start, start + PAGE_SIZE_LARGE);

    // Keep an untouched copy: reading the body consumes it, and we must be able to return the original.
    original = response.clone();
    const html = await response.text();
    if (!html.includes("</head>")) return original;

    const meta = PAGE_META[listingType];
    const withHead = injectHead(html, {
      title: formatPageTitle(meta.title),
      description: meta.description,
      canonicalUrl: `${SITE_URL}${pagePath(path, page)}`,
    });
    const body = injectResults(
      withHead,
      // The title doubles as the page's main heading (see pageMeta.js).
      buildResultsHtml({ listingType, path, heading: meta.title, page, totalPages, total, pageRows }),
    );

    const headers = new Headers(response.headers);
    // The body length changed, so the old Content-Length (and any validator tied to the old body) is stale.
    headers.delete("content-length");
    headers.delete("etag");
    // Browsers always revalidate; the Netlify CDN may keep this response for five minutes — the same
    // time the React Browse list is kept (useBrowseProperties), so a listing added or changed in the
    // dashboard shows up here within about that long. Each ?page is cached on its own. Atomic deploys
    // invalidate the CDN cache on every deploy.
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    headers.set("Netlify-CDN-Cache-Control", "public, s-maxage=300");

    return new Response(body, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    console.error("[browse-cards] Failed to inject Browse page content:", error);
    return original;
  }
};

// Both the plain and the trailing-slash form of each path are listed, so the two never get different HTML.
// cache: "manual" is required, otherwise edge function responses are never cached and this would add an
// uncached Supabase round trip to every visit of these pages. onError: "bypass" serves the static page if
// the function itself fails.
export const config = {
  path: ["/properties/rent", "/properties/rent/", "/properties/sale", "/properties/sale/"],
  cache: "manual",
  onError: "bypass",
};