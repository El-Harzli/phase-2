// Serves /sitemap.xml live: on each request that isn't answered from Netlify's
// cache (see below) it asks Supabase for the published listings and lists them
// next to the site's fixed pages. It replaces the old build-time script
// (scripts/generate-sitemap.js), whose sitemap only changed on a deploy — a
// listing published or removed now shows up in the sitemap within an hour, with
// no redeploy.
//
// The response is cached on Netlify's CDN for an hour (CACHE_SECONDS), so
// crawlers asking again and again are answered from that copy without waking
// this function or touching the database — Supabase sees at most about one
// request per hour per Netlify location. Netlify only caches an edge function's
// response when the function opts in with `cache: "manual"` in `config` AND sets
// a cache header on the response; one without the other caches nothing. A new
// deploy also discards the cached copy. The error response below is deliberately
// never cached.
//
// Declared inline via `config` below, so no netlify.toml entry is needed (same
// as property-og-tags.js); this scopes the function to exactly /sitemap.xml.
//
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment
// variables with the "Edge functions" scope in Netlify's site settings — the
// same two property-og-tags.js already needs (the build-time variables used
// elsewhere aren't available to edge functions). The anon key is safe here since
// RLS (not this file) is what restricts what it can read: only published
// listings come back. VITE_SITE_URL is NOT used: every URL is built from the
// address the sitemap was requested on, the same way the canonical tags are
// (src/shared/seo/usePageMeta.js), so it is right on a deploy preview and on the
// real domain with nothing to set.

import { buildPropertyUrl } from "../../src/shared/lib/propertyUrl.js";

const CACHE_SECONDS = 3600;

// Every public, non-dynamic route from src/site/SiteApp.jsx. Keep this in sync if
// routes change there — there's no way to introspect React Router's config
// from a standalone script without importing the whole app. (/properties/:listingType
// takes any value but only rent and sale are real; anything else redirects to rent.)
//
// No <lastmod> on these: they have no real "last changed" date, and stamping
// today's date on every request would claim they all change daily — crawlers
// that find a date unreliable start ignoring it for the whole sitemap. The
// listings below do carry a real date.
const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/properties/rent", changefreq: "daily", priority: "0.9" },
  { path: "/properties/sale", changefreq: "daily", priority: "0.9" },
  { path: "/neighborhoods", changefreq: "weekly", priority: "0.7" },
  { path: "/concierge", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
];

// Supabase's API returns at most 1000 rows per request by default (the project's
// "max rows" setting), so a plain select would silently stop at 1000 listings.
// The listings are read page by page instead. The next page starts after the
// rows that actually came back — not after PAGE_SIZE — so a project that lowers
// that limit still gets every row. Not handled: the sitemap format allows at most
// 50,000 URLs per file, so a site beyond that would need a sitemap index.
const PAGE_SIZE = 1000;

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

// Same public, anon-role query the app itself runs (see src/site/api/siteData.js)
// — RLS already scopes this to published listings, so there's no risk of leaking
// a draft's URL. Throws if Supabase can't be read: a sitemap quietly missing
// every listing would be worse than no sitemap for now (see the handler).
async function fetchPublishedProperties(supabaseUrl, supabaseAnonKey) {
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    // Makes the response say how many rows match in total (Content-Range).
    Prefer: "count=exact",
  };

  // Keyed by id so a listing published while the pages are being read can't end
  // up in the sitemap twice. The order makes paging stable (id breaks ties).
  const byId = new Map();
  let total = Number.POSITIVE_INFINITY;

  while (byId.size < total) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/properties?status=eq.published&select=id,title,created_at,updated_at&order=created_at.desc,id.asc&limit=${PAGE_SIZE}&offset=${byId.size}`,
      { headers },
    );
    if (!res.ok) throw new Error(`Supabase responded with ${res.status}`);

    const page = await res.json();
    for (const property of page) byId.set(property.id, property);

    const reportedTotal = Number(res.headers.get("content-range")?.split("/")[1]);
    if (Number.isFinite(reportedTotal)) total = reportedTotal;
    // Nothing more came back (or no total was given and this page wasn't full): done.
    if (page.length === 0 || (!Number.isFinite(reportedTotal) && page.length < PAGE_SIZE)) break;
  }

  return [...byId.values()];
}

// When the listings can't be read: a temporary-error response that is never
// cached. Crawlers retry a 503 later and keep what they already know, whereas a
// sitemap with only the fixed pages would — and, cached for an hour, would for
// an hour — tell them every listing is gone.
function unavailable() {
  return new Response("The sitemap is temporarily unavailable.\n", {
    status: 503,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "retry-after": "300",
      "cache-control": "no-store",
    },
  });
}

export default async (request) => {
  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[sitemap] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set for edge functions.");
    return unavailable();
  }

  let properties;
  try {
    properties = await fetchPublishedProperties(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("[sitemap] Failed to read the published properties:", error);
    return unavailable();
  }

  const origin = new URL(request.url).origin;

  const urls = [
    ...STATIC_ROUTES.map((route) =>
      urlEntry({ loc: origin + route.path, changefreq: route.changefreq, priority: route.priority }),
    ),
    ...properties.map((property) =>
      urlEntry({
        loc: origin + buildPropertyUrl(property),
        // updated_at (kept current by a database trigger) tells crawlers when a
        // listing last changed; created_at is only the fallback.
        lastmod: isoDate(property.updated_at) ?? isoDate(property.created_at),
        changefreq: "weekly",
        priority: "0.8",
      }),
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

  return new Response(sitemap, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": `public, s-maxage=${CACHE_SECONDS}`,
    },
  });
};

export const config = { path: "/sitemap.xml", cache: "manual" };
