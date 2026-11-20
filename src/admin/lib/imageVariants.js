import { VARIANT_QUALITY, VARIANT_WIDTHS } from "@/shared/lib/imageVariantConfig.mjs";

// Browser-side creation of the smaller WebP copies that "variants" mode serves
// (see lib/imageVariantConfig.mjs for the widths and naming — this file only
// does the pixel work and never defines either). Runs on the image that
// compressImage() already produced, never on the raw camera file.
//
// Everything keeps the original's aspect ratio: only the width is chosen (from
// the shared ladder) and the height follows from it, so a 2000×1200 photo
// becomes 1280×768 / 800×480 / 480×288 and a 1200×1800 portrait becomes
// 1200×1800 / 800×1200 / 480×720. Nothing is ever enlarged — a source narrower
// than a step just gets a same-size WebP copy, so every file the site asks for
// exists (a missing one would mean a 404 and a fallback to the original).

let webpEncodingSupport = null;

// Not every browser can encode WebP from a canvas (some silently hand back a
// PNG instead). Checked once with a 1×1 canvas and remembered.
export function supportsWebpEncoding() {
  if (!webpEncodingSupport) {
    webpEncodingSupport = new Promise((resolve) => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        canvas.toBlob((blob) => resolve(blob?.type === "image/webp"), "image/webp", 0.8);
      } catch {
        resolve(false);
      }
    });
  }
  return webpEncodingSupport;
}

// Same exclusions as compressImage: an SVG is vector and a GIF may be
// animated, and a canvas copy would destroy either.
export function canMakeVariants(file) {
  const type = (file?.type || "").toLowerCase();
  const name = file?.name || "";
  if (type === "image/svg+xml" || /\.svg$/i.test(name)) return false;
  if (type === "image/gif" || /\.gif$/i.test(name)) return false;
  return type.startsWith("image/");
}

function toWebpBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.type === "image/webp") resolve(blob);
        else reject(new Error("The browser could not encode a WebP image."));
      },
      "image/webp",
      VARIANT_QUALITY / 100,
    );
  });
}

/**
 * @param {File|Blob} file - the already-compressed image
 * @returns {Promise<Array<{ width: number, blob: Blob }>>} one entry per width
 *   in VARIANT_WIDTHS; `width` is the ladder step (it names the file), the
 *   blob's real pixel width is that or the source's width if that's smaller.
 */
export async function createVariantBlobs(file) {
  let bitmap;
  try {
    // 'from-image' bakes EXIF rotation in, so copies match how the original
    // is displayed.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (error) {
    throw new Error(
      `Could not read "${file?.name ?? "this image"}" to create resized copies: ${error?.message ?? error}`,
      {
        cause: error,
      },
    );
  }

  try {
    // Largest first, each step drawn from the previous one: every resize is a
    // single moderate reduction (e.g. 1280 -> 800 -> 480) rather than one
    // huge jump from the full-size image, which is what causes jagged,
    // aliased results in canvas downscaling.
    const widths = [...VARIANT_WIDTHS].sort((a, b) => b - a);
    const variants = [];
    let source = bitmap;

    for (const width of widths) {
      const targetWidth = Math.min(width, bitmap.width);
      const targetHeight = Math.max(1, Math.round((bitmap.height * targetWidth) / bitmap.width));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(source, 0, 0, targetWidth, targetHeight);

      variants.push({ width, blob: await toWebpBlob(canvas) });
      source = canvas;
    }
    return variants;
  } finally {
    bitmap.close?.();
  }
}
