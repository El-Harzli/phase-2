// The one definition of how the homepage hero's responsive image is described:
// the `sizes` the browser is told, how a generated copy's width is read from its
// file name, how a list of copies becomes a srcSet, and how the early preload for
// the AVIF copies is written. HeroSection.jsx uses it in the browser and
// vite.config.js at build time; it has no imports and touches nothing specific to
// either (like imageVariantConfig.mjs), so both can load it as-is.
//
// The copies themselves are made by scripts/optimize-local-images.mjs, and which
// of them exist is found by the import.meta.glob calls in HeroSection.jsx — those
// have to stay written inline in that file, because only Vite understands them.

// Same `sizes` for both formats: the column is ~50% of the width from lg up;
// below that the image is the full width minus the wrapper's side padding
// (Lighthouse measured 364px on a 412px phone, i.e. 24px a side), so the
// mobile size is calc(100vw - 48px) rather than 100vw — on a phone 100vw was
// just enough to tip the browser up a whole size.
export const HERO_SIZES = "(min-width: 1024px) 50vw, calc(100vw - 48px)";

/**
 * An import.meta.glob result ({ "<file path>": url }) -> [{ width, url }] sorted
 * by width, where the width is the "-<n>w" in the file name. Files without one
 * are dropped. Built files work too: Vite adds an 8-character content hash after
 * the width (hero_transparent-480w-CN9avHWI.avif), and that's allowed for here.
 */
export function toVariants(files) {
  return Object.entries(files)
    .map(([filePath, url]) => ({ width: Number(filePath.match(/-(\d+)w(?:-[\w-]{8})?\.\w+$/)?.[1]), url }))
    .filter((variant) => variant.width > 0)
    .sort((a, b) => a.width - b.width);
}

/** [{ width, url }] -> "url1 480w, url2 640w, ..." (a srcSet value). */
export const toSrcSet = (variants) => variants.map(({ width, url }) => `${url} ${width}w`).join(", ");

/**
 * The early preload for the hero's AVIF copies, as an HTML string ("" when there
 * are none).
 *  - imagesrcset and imagesizes make the browser choose among the copies by the
 *    same rules it uses for the <img>, so it fetches the very file the <picture>
 *    will want; a plain href couldn't know which one that is.
 *  - There's no href on purpose: the spec's own advice, since a browser that
 *    doesn't understand imagesrcset would use it to preload a possibly wrong copy.
 *    Such a browser just doesn't preload, which is how it behaves today.
 *  - type="image/avif": a browser without AVIF skips the preload and the <picture>
 *    falls back to WebP, so nothing is downloaded twice.
 *  - fetchpriority="high" matches the <img>'s own, so the preload isn't queued
 *    behind it.
 */
export function heroPreloadTag(avifVariants) {
  if (avifVariants.length === 0) return "";
  const attributes = [
    'rel="preload"',
    'as="image"',
    'type="image/avif"',
    'fetchpriority="high"',
    `imagesrcset="${toSrcSet(avifVariants)}"`,
    `imagesizes="${HERO_SIZES}"`,
  ];
  return `<link ${attributes.join(" ")}>`;
}
