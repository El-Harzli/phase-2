import { removeStoredImages, removeStoredPaths, uploadImages } from "@/admin/api/imageStorage";

/**
 * The whole image lifecycle for one save, in the only safe order:
 *
 *   1. upload the NEW images (compressed + variants) — nothing in the database
 *      points at them yet;
 *   2. commit() — the caller's database write(s), given the final image list
 *      with real URLs;
 *   3. only after that succeeds, delete the files of images that were
 *      removed or replaced.
 *
 * If step 1 fails, nothing is left behind. If step 2 fails, the new uploads are
 * deleted again and the old images are untouched (the database still points at
 * them). Files are never deleted before the database no longer needs them.
 * Unchanged images (items that already have a url and no file) are never
 * touched or re-processed.
 *
 * Works for one image (neighborhood, agent) or many (property photos).
 *
 * @param {object} args
 * @param {string} args.bucket
 * @param {Array<{ url?: string, file?: File }>} args.images
 *   the final list from the form, in order: existing images carry `url`, new
 *   ones carry `file` (any other fields, like focal points, are preserved).
 * @param {string[]} [args.previousUrls] the image URLs stored before this save
 *   (empty when creating)
 * @param {(finalImages: Array<{ url: string }>) => Promise<any>} args.commit
 *   writes the database; throw to abort
 * @returns {Promise<{ result: any, variantsSkipped: boolean, cleanupFailed: boolean }>}
 *   `cleanupFailed` means the save worked but some replaced files could not be
 *   deleted from Storage (they're orphaned until removed by hand).
 */
export async function syncImages({ bucket, images, previousUrls = [], commit }) {
  const newItems = images.filter((image) => image.file);
  const uploads =
    newItems.length > 0
      ? await uploadImages(
          bucket,
          newItems.map((image) => image.file),
        )
      : [];

  let uploadIndex = 0;
  const finalImages = images.map((image) => {
    if (!image.file) return image;
    const { file, ...rest } = image;
    return { ...rest, url: uploads[uploadIndex++].url };
  });

  let result;
  try {
    result = await commit(finalImages);
  } catch (error) {
    await removeStoredPaths(
      bucket,
      uploads.flatMap((upload) => upload.paths),
    ).catch((cleanupError) => {
      console.error("Could not remove uploaded images after a failed save:", cleanupError);
    });
    throw error;
  }

  const keptUrls = new Set(finalImages.map((image) => image.url));
  const removedUrls = previousUrls.filter((url) => url && !keptUrls.has(url));

  let cleanupFailed = false;
  if (removedUrls.length > 0) {
    try {
      await removeStoredImages(removedUrls);
    } catch (error) {
      console.error("Saved, but could not remove replaced image files from storage:", error);
      cleanupFailed = true;
    }
  }

  return {
    result,
    variantsSkipped: uploads.some((upload) => upload.variantsSkipped),
    cleanupFailed,
  };
}
