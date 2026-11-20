# Before going live

## Set the real production domain

The site doesn't have a live domain yet, so three places currently hold a
placeholder — `https://REPLACE-WITH-PRODUCTION-DOMAIN.example`:

- `public/robots.txt` → the `Sitemap:` line (a plain static file, so it can't read an env var)
- `index.html` → the default `og:image` / `og:url` meta tags
- `netlify/edge-functions/property-og-tags.js` → the fallback image URL used if a property has no photos

The sitemap itself (`netlify/edge-functions/sitemap.js`, served live at
`/sitemap.xml`) needs no domain setting: it builds every URL from the address
it is requested on, so it is right on a deploy preview and on the real domain.

The quickest fix once the domain is live: search the repo for
`REPLACE-WITH-PRODUCTION-DOMAIN.example` and replace every occurrence with
the real domain (e.g. `https://bsiproperties.ma`).

Alternatively, for the property-og-tags edge function only (not `index.html`
or `public/robots.txt` — see note below), set a `VITE_SITE_URL` env var in
Netlify's site settings with the **Edge functions** scope specifically
(build-time env vars aren't automatically available to edge functions)
instead of editing the fallback directly.

`index.html` and `public/robots.txt` are static files with no build-time
templating, so they always need the direct search-and-replace regardless.

After updating, deploy and open `/sitemap.xml` and `/robots.txt` on the live
domain to check them.

## Environment variables for the sitemap

`netlify/edge-functions/sitemap.js` reads the published listings with the
public key, so it needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in
Netlify's site settings with the **Edge functions** scope — the same two
`property-og-tags.js` already needs. If they are missing, `/sitemap.xml`
answers with a temporary error (503) instead of a sitemap without listings.
The sitemap is cached on Netlify's CDN for an hour, so a listing published or
removed shows up there within an hour, with no redeploy.

## Verify Open Graph tags after the domain is live

Once deployed, share a `/property/:id` link through
[Facebook's Sharing Debugger](https://developers.facebook.com/tools/debug/)
or [Twitter's Card Validator](https://cards-dev.twitter.com/validator) to
confirm the edge function is actually injecting that listing's title/photo —
these tools show you the raw HTML a crawler would see, same as WhatsApp or
iMessage would fetch.
