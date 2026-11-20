import { useState } from "react";
import { DEFAULT_WIDTHS, buildSrcSet, optimizedImageUrl } from "@/shared/lib/imageUrl";
import { FALLBACK_IMG } from "@/site/lib/fallbackImage";

// Drop-in replacement for <img> wherever a property / neighborhood photo is
// shown. Give it the *stored* URL plus a `sizes` string describing how wide
// the image actually renders, and it asks the image host for a copy no
// bigger than needed (see lib/imageUrl.js) at every screen density — a
// 300px card on a 3x phone gets a ~900px file, not the 2400px original, and
// a 1x desktop gets ~300px.
//
// Props (everything else — className, style, draggable, width, height… —
// is passed straight through to the <img>):
//   src       stored image URL. Missing/empty shows FALLBACK_IMG.
//   sizes     the `sizes` attribute, e.g. "(min-width: 1024px) 33vw, 100vw".
//             THE one thing worth getting right: too small a value makes
//             the browser pick a file that is too small for the box (soft
//             image), too large only wastes bytes. Defaults to "100vw",
//             which is always safe, just not minimal.
//   widths    ladder of widths to offer (default: lib/imageUrl DEFAULT_WIDTHS).
//             Pass smaller ones for thumbnails, larger ones (up to the
//             upload cap) for a lightbox.
//   quality   encoder quality, default from lib/imageUrl.
//   priority  true for above-the-fold images: loads eagerly at high priority.
//
// Error handling is a three-step ladder, so a resized URL that doesn't work
// (e.g. image transformations not enabled on the Supabase plan) can never
// leave a blank card: resized -> original URL -> FALLBACK_IMG. The first time
// a resized URL fails, a console warning names the URL — the fallback is
// silent otherwise, which would make "resizing isn't actually happening"
// invisible (the page just quietly downloads the full-size originals). The old
// shared onImgError can't be reused here: swapping `src` alone does nothing
// while a srcset is still set, because the browser keeps preferring srcset.
let warnedAboutResizeFailure = false;

function ResponsiveImage({
  src,
  alt = "",
  sizes = "100vw",
  widths = DEFAULT_WIDTHS,
  quality,
  priority = false,
  loading,
  className,
  style,
  ...rest
}) {
  // stage 0 = resized, 1 = original URL, 2 = FALLBACK_IMG. Remembered per
  // `src`, so when the card is handed a different image it starts over at 0.
  const [failure, setFailure] = useState({ src: null, stage: 0 });
  const stage = failure.src === src ? failure.stage : 0;

  const srcSet = buildSrcSet(src, widths, { quality });

  let resolvedSrc;
  let resolvedSrcSet;
  if (!src || stage >= 2) {
    resolvedSrc = FALLBACK_IMG;
  } else if (stage === 1 || !srcSet) {
    resolvedSrc = src;
  } else {
    resolvedSrcSet = srcSet;
    // Plain `src` is only used by browsers without srcset support, and as
    // the base the browser starts from — a mid-size variant is plenty.
    const defaultWidth = widths.filter((w) => w <= 800).pop() ?? widths[0];
    resolvedSrc = optimizedImageUrl(src, { width: defaultWidth, quality });
  }

  function handleError(event) {
    if (!src || stage >= 2) return;
    if (stage === 0 && srcSet && !warnedAboutResizeFailure) {
      warnedAboutResizeFailure = true;
      console.warn(
        "[ResponsiveImage] A resized image failed to load, so the full-size original is being used instead:",
        event.currentTarget.currentSrc,
        "— for a Supabase image this means that image has no pre-made copies yet " +
          "(run scripts/backfill-image-variants.mjs, or it was uploaded before the upload code creates them) " +
          "or, with VITE_SUPABASE_IMAGE_MODE=transform, that Image Transformations isn't enabled for the project.",
      );
    }
    // Only worth trying the original if it's actually a different URL.
    setFailure({ src, stage: stage === 0 && srcSet ? 1 : 2 });
  }

  return (
    <img
      {...rest}
      src={resolvedSrc}
      srcSet={resolvedSrcSet}
      sizes={resolvedSrcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : (loading ?? "lazy")}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={handleError}
      className={className}
      style={style}
    />
  );
}

export default ResponsiveImage;
