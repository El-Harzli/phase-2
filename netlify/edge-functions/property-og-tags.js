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

import { buildPropertyUrl } from "../../src/shared/lib/propertyUrl.js";
import { formatPrice } from "../../src/site/lib/formatPrice.js";

const SITE_URL = Deno.env.get("VITE_SITE_URL") || "https://REPLACE-WITH-PRODUCTION-DOMAIN.example";

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// A listing id is always a UUID. Anything else (a typo, a crawler guessing
// addresses, an attempt to smuggle extra query parameters into the request
// below) is not worth a database request — the page is served unchanged.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchProperty(id, supabaseUrl, supabaseAnonKey) {
  const headers = { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` };

  // Same public, anon-role query the app itself runs (see
  // src/site/api/siteData.js) — RLS already scopes this to
  // published listings, so a draft or deleted property's id just comes
  // back empty rather than ever being fetchable here.
  const propertyRes = await fetch(
    `${supabaseUrl}/rest/v1/properties?id=eq.${encodeURIComponent(id)}&status=eq.published&select=id,title,description,location,price,listing_type,beds,baths&limit=1`,
    { headers },
  );
  if (!propertyRes.ok) return null;
  const [property] = await propertyRes.json();
  if (!property) return null;

  const imageRes = await fetch(
    `${supabaseUrl}/rest/v1/property_images?property_id=eq.${encodeURIComponent(id)}&select=url&order=sort_order.asc&limit=1`,
    { headers },
  );
  const [image] = imageRes.ok ? await imageRes.json() : [];

  return { ...property, image: image?.url ?? null };
}

function buildDescription(property) {
  const priceLabel =
    property.listing_type === "rent"
      ? `${formatPrice(Number(property.price))} / month`
      : formatPrice(Number(property.price));

  const fallbackDescription = [
    property.beds ? `${property.beds} bed` : null,
    property.baths ? `${property.baths} bath` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const descriptionSource =
    property.description?.trim() ||
    `${fallbackDescription ? `${fallbackDescription} property` : "Property"} in ${property.location}. ${priceLabel}.`;

  return descriptionSource.length > 200 ? `${descriptionSource.slice(0, 197)}...` : descriptionSource;
}

// Puts `tag` into the document: replaces the tag already there (index.html
// ships a default of each one, and a second copy would leave two in the
// document — crawlers tend to read the first, i.e. the generic default), or
// adds it just before </head> when there is none. Replacements go through a
// function so characters like `$&` in a listing's text are never read as
// replacement patterns.
function setTag(html, existingTagPattern, tag) {
  if (existingTagPattern.test(html)) return html.replace(existingTagPattern, () => tag);
  return html.replace("</head>", () => `    ${tag}\n  </head>`);
}

function metaPattern(attribute, key) {
  return new RegExp(`<meta\\s+${attribute}="${key}"[^>]*>`, "i");
}

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

  let result = html;
  for (const [attribute, key, content] of metaTags) {
    result = setTag(
      result,
      metaPattern(attribute, key),
      `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`,
    );
  }
  return setTag(
    result,
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
  );
}

export default async (request, context) => {
  const response = await context.next();

  // Only ever touch actual HTML documents. The SPA's catch-all rewrite
  // (public/_redirects: /* -> /index.html) means this route pattern could
  // in principle see something other than the document itself; bail out
  // rather than risk mangling a non-HTML response.
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");
  const id = context.params.id;

  if (!supabaseUrl || !supabaseAnonKey || !id || !UUID_PATTERN.test(id)) return response;

  let property;
  try {
    property = await fetchProperty(id, supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("[property-og-tags] Failed to fetch property:", error);
    return response; // Fall back to index.html's default tags.
  }

  // Unpublished, deleted, or a bad id — nothing to inject. The SPA's own
  // client-side handling for a missing property takes over as normal.
  if (!property) return response;

  const html = await response.text();
  const description = buildDescription(property);
  // Always the real canonical URL, regardless of which path pattern the
  // incoming request actually matched (the bare legacy /property/:id, a
  // slug that's since gone stale, or a hand-edited URL) — og:url and the
  // canonical tag should point at the one real URL for this listing, not
  // just echo back whatever was requested.
  const canonicalUrl = `${new URL(request.url).origin}${buildPropertyUrl(property)}`;
  const withTags = injectMetaTags(html, property, description, canonicalUrl);

  // The body length changed, so the original Content-Length header is now
  // wrong — drop it and let the runtime recompute it, or some clients will
  // truncate the response at the old byte count.
  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(withTags, { status: response.status, headers });
};

export const config = { path: ["/property/:id", "/property/:slug/:id"] };
