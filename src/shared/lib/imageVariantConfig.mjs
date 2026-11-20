// The one definition of "which pre-made sizes exist for an uploaded image and
// what they're called". Shared by the browser (lib/imageUrl.js reads it to
// build URLs) and by the Node scripts/backfill-image-variants.mjs (which
// creates the files) — which is why it's a plain .mjs with no imports: both
// Vite and Node load it as-is, so the two sides can never disagree on a name.
//
// Why this exists: Supabase's on-the-fly image resizing is a paid-plan
// feature. On the free plan the same result is achieved by storing a few
// smaller WebP copies next to each original at upload time:
//
//   neighborhoods/mt28z59b-abc.jpg          <- original (kept, used for the
//   neighborhoods/mt28z59b-abc_w480.webp       largest displays / lightbox)
//   neighborhoods/mt28z59b-abc_w800.webp
//   neighborhoods/mt28z59b-abc_w1280.webp
//
// Only three sizes, on purpose: free-plan storage and bandwidth are limited,
// and three steps already cover phone thumbnails (480), cards on high-density
// screens (800), and large cards / desktop (1280). Anything wider than the
// biggest variant falls back to the original.

export const VARIANT_WIDTHS = [480, 800, 1280];
export const VARIANT_QUALITY = 80; // same as the resize quality used elsewhere

const VARIANT_NAME_PATTERN = /_w\d+\.webp$/i;

/** True if `name` is itself one of the generated copies (never re-processed). */
export function isVariantName(name) {
  return VARIANT_NAME_PATTERN.test(name);
}

/** "folder/photo.jpg" + 800 -> "folder/photo_w800.webp" (works on a bare file name too). */
export function variantName(name, width) {
  return `${name.replace(/\.[^./]+$/, "")}_w${width}.webp`;
}

/**
 * Every generated copy's storage key for one original key:
 * "folder/photo.jpg" -> ["folder/photo_w480.webp", "folder/photo_w800.webp", ...].
 * Used by the dashboard to know exactly which files to delete along with an image.
 */
export function variantPaths(path) {
  return VARIANT_WIDTHS.map((width) => variantName(path, width));
}
