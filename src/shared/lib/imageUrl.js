// Single place that knows how to ask each image host for a *smaller copy*
// of an image. Nothing here touches the database: stored URLs stay exactly
// as the dashboard saved them (full-size originals), and a sized variant is
// derived from them at render time. That's what makes this automatic for
// anything uploaded later — there's no per-image step to remember.
//
// Two hosts are supported today:
//
//  • Supabase Storage — three modes, picked with VITE_SUPABASE_IMAGE_MODE:
//      "variants" (default) — for the free plan. Looks for the pre-made WebP
//        copies stored next to each original (see imageVariantConfig.mjs:
//        photo.jpg -> photo_w480.webp / _w800.webp / _w1280.webp). Widths
//        bigger than the largest copy use the original. If an image doesn't
//        have its copies yet (uploaded before they existed and not
//        backfilled), the component falls back to the original.
//      "transform" — Supabase's on-the-fly render endpoint. Paid plans only;
//        only `width` is sent (never `height`), so the browser still crops
//        with object-fit/object-position and admin-set focal points keep
//        working. Format is left to Supabase, which negotiates WebP.
//      "off" — Supabase URLs are used as-is.
//    (The first version of this file used VITE_SUPABASE_IMAGE_TRANSFORMS=false
//    for "off"; that still works.)
//
//  • Pexels — `w` is set to the requested width. Pexels takes any `w`, so
//    the old fixed `w=1260` no longer applies to a 300px card.
//
// Any other URL (local imports, data:/blob: URLs, other hosts) is returned
// untouched, so it's always safe to run an image through here.

import { env } from "@/shared/config/env";
import { VARIANT_WIDTHS, isVariantName, variantName } from "./imageVariantConfig.mjs";

// Ladder of widths a srcset can offer. Dense enough that the browser never
// has to download much more than it needs, short enough to keep the number
// of cached variants per image small. Anything that displays larger than
// 1600 CSS px (e.g. a full-screen lightbox) can pass its own list.
export const DEFAULT_WIDTHS = [160, 240, 320, 480, 640, 800, 1024, 1280, 1600];

// 80 is Supabase's own default and visually indistinguishable from the
// original at these sizes; high enough that photos don't look soft.
export const DEFAULT_QUALITY = 80;

const SUPABASE_OBJECT_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PATH = "/storage/v1/render/image/public/";

function resolveSupabaseMode() {
  const mode = env.supabaseImageMode;
  if (mode === "variants" || mode === "transform" || mode === "off") return mode;
  return "variants";
}

const SUPABASE_MODE = resolveSupabaseMode();

// The dashboard's upload code reads the same value, so "which mode are we in"
// is decided in exactly one place: only "variants" mode stores extra copies at
// upload time (transform mode resizes on the fly, "off" does neither).
export const SUPABASE_IMAGE_MODE = SUPABASE_MODE;

function parseHttpUrl(url) {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function clampQuality(quality) {
  // Supabase accepts 20–100.
  return Math.min(100, Math.max(20, Math.round(quality)));
}

// ---- Supabase: "transform" mode (paid plans) --------------------------------

function transformSupabase(parsed, width, quality) {
  let pathname = parsed.pathname;
  if (pathname.includes(SUPABASE_OBJECT_PATH)) {
    pathname = pathname.replace(SUPABASE_OBJECT_PATH, SUPABASE_RENDER_PATH);
  } else if (!pathname.includes(SUPABASE_RENDER_PATH)) {
    return null; // a Supabase host, but not a public storage object
  }

  const out = new URL(parsed.href);
  out.pathname = pathname;
  out.searchParams.set("width", String(width));
  out.searchParams.set("quality", String(clampQuality(quality)));
  out.searchParams.delete("height"); // width only — see the note at the top
  return out.href;
}

function supabaseTransformEntries(parsed, widths, quality) {
  const entries = widths.map((width) => ({
    url: transformSupabase(parsed, width, quality),
    width,
  }));
  return entries.some((entry) => entry.url === null) ? null : entries;
}

// ---- Supabase: "variants" mode (free plan) -----------------------------------

function supabaseVariantEntries(parsed, widths) {
  const objectIndex = parsed.pathname.indexOf(SUPABASE_OBJECT_PATH);
  if (objectIndex === -1) return null; // not a public storage object
  const prefix = parsed.pathname.slice(0, objectIndex + SUPABASE_OBJECT_PATH.length);
  const keyPath = parsed.pathname.slice(prefix.length); // "bucket/folder/photo.jpg"
  const slash = keyPath.lastIndexOf("/");
  const dir = keyPath.slice(0, slash + 1);
  const file = keyPath.slice(slash + 1);
  if (!file || isVariantName(file)) return null;

  const entries = [];
  const seen = new Set();
  for (const width of widths) {
    // Smallest pre-made copy that's at least as wide as asked for; wider than
    // all of them -> the original.
    const variantWidth = VARIANT_WIDTHS.find((candidate) => candidate >= width);
    let entry;
    if (variantWidth) {
      const out = new URL(parsed.href);
      out.pathname = `${prefix}${dir}${variantName(file, variantWidth)}`;
      out.search = "";
      entry = { url: out.href, width: variantWidth };
    } else {
      entry = { url: parsed.href, width };
    }
    if (!seen.has(entry.url)) {
      seen.add(entry.url);
      entries.push(entry);
    }
  }
  return entries;
}

function supabaseEntries(parsed, widths, quality) {
  if (!parsed.pathname.includes("/storage/v1/")) return null;
  if (SUPABASE_MODE === "off") return null;
  return SUPABASE_MODE === "transform"
    ? supabaseTransformEntries(parsed, widths, quality)
    : supabaseVariantEntries(parsed, widths);
}

// ---- Pexels ---------------------------------------------------------------------

function transformPexels(parsed, width) {
  const out = new URL(parsed.href);
  const params = out.searchParams;

  // If the URL asked for an explicit crop (both w and h), keep that shape
  // by scaling h along with w. Otherwise drop any h so the photo keeps its
  // natural proportions. `dpr` is dropped because srcset width descriptors
  // already cover high-density screens.
  const oldWidth = Number(params.get("w"));
  const oldHeight = Number(params.get("h"));
  if (oldWidth > 0 && oldHeight > 0) {
    params.set("h", String(Math.round((oldHeight * width) / oldWidth)));
  } else {
    params.delete("h");
  }
  params.delete("dpr");
  params.set("w", String(width));
  if (!params.has("auto")) params.set("auto", "compress");
  if (!params.has("cs")) params.set("cs", "tinysrgb");
  return out.href;
}

function pexelsEntries(parsed, widths) {
  if (parsed.hostname !== "images.pexels.com") return null;
  return widths.map((width) => ({ url: transformPexels(parsed, width), width }));
}

// ---- Public API -------------------------------------------------------------------

// [{ url, width }, ...] — one candidate per distinct file — or null if this
// URL isn't one we know how to resize.
function entriesFor(url, widths, quality) {
  const parsed = parseHttpUrl(url);
  if (!parsed || widths.length === 0) return null;
  const rounded = widths.map((width) => Math.round(width));
  return supabaseEntries(parsed, rounded, quality) ?? pexelsEntries(parsed, rounded);
}

/**
 * Splits a public Supabase Storage object URL into { host, bucket, path } with
 * the path DECODED back to the real storage key (a file called "IMG 1 (a).jpg"
 * appears in the URL as "IMG%201%20(a).jpg", but Storage's remove() needs the
 * literal name). Returns null for anything that isn't a public storage object
 * URL — e.g. the seeded Pexels photos — so callers can safely skip those.
 */
export function parseSupabaseStorageUrl(url) {
  const parsed = parseHttpUrl(url);
  if (!parsed) return null;
  const markerIndex = parsed.pathname.indexOf(SUPABASE_OBJECT_PATH);
  if (markerIndex === -1) return null;
  const rest = parsed.pathname.slice(markerIndex + SUPABASE_OBJECT_PATH.length);
  const slash = rest.indexOf("/");
  if (slash <= 0 || slash === rest.length - 1) return null;
  try {
    return {
      host: parsed.host,
      bucket: decodeURIComponent(rest.slice(0, slash)),
      path: decodeURIComponent(rest.slice(slash + 1)),
    };
  } catch {
    return null; // malformed percent-encoding
  }
}

/** Whether `url` can be served at a smaller size. */
export function isResizable(url) {
  return entriesFor(url, [DEFAULT_WIDTHS[0]], DEFAULT_QUALITY) !== null;
}

/** One sized URL — falls back to the original `url` if it can't be resized. */
export function optimizedImageUrl(url, { width, quality = DEFAULT_QUALITY } = {}) {
  if (!width) return url;
  return entriesFor(url, [width], quality)?.[0].url ?? url;
}

/**
 * A ready-to-use `srcset` string ("url 320w, url 480w, …"), or null when the
 * URL can't be resized (callers then just use a plain `src`).
 */
export function buildSrcSet(url, widths = DEFAULT_WIDTHS, { quality = DEFAULT_QUALITY } = {}) {
  const entries = entriesFor(url, widths, quality);
  if (!entries) return null;
  return entries.map((entry) => `${entry.url} ${entry.width}w`).join(", ");
}
