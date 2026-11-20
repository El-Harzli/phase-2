// Homepage-only hero image preload.
//
// The Vite build (vite.config.js, heroPreloadMarker) writes the preload <link> into dist/index.html as an HTML
// comment: <!--hero-preload <link ...>-->. Every SPA route is served from that same index.html, so a static tag
// would load the hero image on every page. This function runs on "/" only and swaps the comment for the real tag.
//
// Fail-open by design: on any failure, or when the marker is missing, the original response is returned untouched.

const MARKER_RE = /<!--hero-preload\s+([\s\S]*?)\s*-->/;

export default async (request, context) => {
  if (request.method !== "GET") return context.next();

  const response = await context.next();

  try {
    const contentType = response.headers.get("content-type") || "";
    if (response.status !== 200 || !contentType.includes("text/html")) return response;

    // Keep an untouched copy: reading the body consumes it, and we must be able to return the original.
    const original = response.clone();
    const html = await response.text();

    const match = MARKER_RE.exec(html);
    if (!match) return original;

    // Function replacer so "$" sequences inside the tag are never interpreted as replacement patterns.
    const body = html.replace(MARKER_RE, () => match[1]);

    const headers = new Headers(response.headers);
    // The body length changed, so the old Content-Length (and any validator tied to the old body) is stale.
    headers.delete("content-length");
    headers.delete("etag");
    // Browsers always revalidate; the Netlify CDN may keep this response for one hour.
    // Atomic deploys invalidate the CDN cache on every deploy.
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    headers.set("Netlify-CDN-Cache-Control", "public, s-maxage=3600");

    return new Response(body, { status: response.status, statusText: response.statusText, headers });
  } catch {
    return response;
  }
};

// cache: "manual" is required, otherwise edge function responses are never cached and this would add an
// uncached hop to the homepage. onError: "bypass" serves the static page if the function itself fails.
export const config = {
  path: "/",
  cache: "manual",
  onError: "bypass",
};
