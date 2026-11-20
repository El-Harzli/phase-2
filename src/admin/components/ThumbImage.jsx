import { optimizedImageUrl } from "@/shared/lib/imageUrl";

// The resized copy may not exist for an image uploaded before copies were
// created and never backfilled. In that case, show the stored original —
// once only, so a broken original can't loop.
function showOriginalOnce(event, originalUrl) {
  const image = event.currentTarget;
  if (image.dataset.fellBack) return;
  image.dataset.fellBack = "true";
  image.src = originalUrl;
}

// A list or grid thumbnail. Asks for a small copy of the image instead of the
// full-size original (see shared/lib/imageUrl.js) and lets the browser defer
// the ones that are off-screen. The default width of 240 is comfortably above
// 3x screen density for the 44–56px thumbnails; Supabase images resolve to
// their smallest stored copy at or above `width`. Local (blob:) previews pass
// through untouched.
export default function ThumbImage({ url, width = 240, className, style }) {
  return (
    <img
      key={url}
      src={optimizedImageUrl(url, { width })}
      alt=""
      loading="lazy"
      decoding="async"
      onError={(event) => showOriginalOnce(event, url)}
      className={className}
      style={style}
    />
  );
}
