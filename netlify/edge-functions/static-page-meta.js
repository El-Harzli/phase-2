// Puts each static public page's own <title>, description, canonical link and
// share (Open Graph / Twitter) tags into the HTML for /about, /contact,
// /concierge and /neighborhoods. Every SPA route is served from the same
// index.html, so without this a crawler that doesn't run JavaScript sees the
// homepage's title and description on all of them. React still sets the same
// words in the browser (usePageTitle / usePageMeta) once it starts.
//
// The words come from src/shared/seo/pageMeta.js — the same file the pages read —
// so the two can't drift apart. That file is plain on purpose (no "@/" shortcuts,
// no React), which is what lets this Deno function import it.
//
// The same HTML goes to every visitor: nothing here looks at who is asking. The
// canonical URL is the production domain (VITE_SITE_URL) plus the page's own path —
// never the request's host (a Deploy Preview) and never its query string (tracking
// parameters), with or without a trailing slash on the request.
//
// Fail-open by design: only a successful HTML response is touched, and on any
// failure the original response is returned untouched.
//
// Requires VITE_SITE_URL as an environment variable with the "Edge functions"
// scope (same variable property-og-tags.js reads).
//
// TODO(production): until VITE_SITE_URL is set, the placeholder domain below is
// used — see the go-live checklist.

import { PAGE_META, PAGE_PATHS, SITE_NAME, formatPageTitle } from "../../src/shared/seo/pageMeta.js";

const SITE_URL = (Deno.env.get("VITE_SITE_URL") || "https://REPLACE-WITH-PRODUCTION-DOMAIN.example").replace(/\/+$/, "");

// The pages this function handles, found by their canonical path.
const STATIC_PAGE_KEYS = ["about", "contact", "concierge", "neighborhoods"];
const PAGE_KEY_BY_PATH = new Map(STATIC_PAGE_KEYS.map((key) => [PAGE_PATHS[key], key]));

// "/about/" and "/about" are the same page: drop trailing slashes.
function normalizePath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

export default async (request, context) => {
  if (request.method !== "GET") return context.next();

  const response = await context.next();
  // Until the body is read, `response` itself is the untouched original; once it is,
  // the clone made first is.
  let original = response;

  try {
    const contentType = response.headers.get("content-type") || "";
    if (response.status !== 200 || !contentType.includes("text/html")) return response;

    const path = normalizePath(new URL(request.url).pathname);
    const pageKey = PAGE_KEY_BY_PATH.get(path);
    if (!pageKey) return response;

    // Keep an untouched copy: reading the body consumes it, and we must be able to return the original.
    original = response.clone();
    const html = await response.text();
    if (!html.includes("</head>")) return original;

    const meta = PAGE_META[pageKey];
    const body = injectHead(html, {
      title: formatPageTitle(meta.title),
      description: meta.description,
      canonicalUrl: `${SITE_URL}${path}`,
    });

    const headers = new Headers(response.headers);
    // The body length changed, so the old Content-Length (and any validator tied to the old body) is stale.
    headers.delete("content-length");
    headers.delete("etag");
    // Same caching as the homepage hero function: browsers always revalidate; the Netlify CDN may keep this
    // response for one hour. Atomic deploys invalidate the CDN cache on every deploy, and nothing here depends
    // on anything but the deployed files and environment variables.
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    headers.set("Netlify-CDN-Cache-Control", "public, s-maxage=3600");

    return new Response(body, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    console.error("[static-page-meta] Failed to inject page metadata:", error);
    return original;
  }
};

// Both the plain and the trailing-slash form of each path are listed, so the two never get different HTML.
// cache: "manual" is required, otherwise edge function responses are never cached and this would add an
// uncached hop to each of these pages. onError: "bypass" serves the static page if the function itself fails.
export const config = {
  path: [
    "/about",
    "/about/",
    "/contact",
    "/contact/",
    "/concierge",
    "/concierge/",
    "/neighborhoods",
    "/neighborhoods/",
  ],
  cache: "manual",
  onError: "bypass",
};