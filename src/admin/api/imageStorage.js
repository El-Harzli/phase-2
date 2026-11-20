import { supabase } from "@/shared/api/supabaseClient";
import { env } from "@/shared/config/env";
import { SUPABASE_IMAGE_MODE, parseSupabaseStorageUrl } from "@/shared/lib/imageUrl";
import { variantName, variantPaths } from "@/shared/lib/imageVariantConfig.mjs";
import { compressImage } from "@/admin/lib/compressImage";
import { generateId } from "@/admin/lib/generateId";
import { canMakeVariants, createVariantBlobs, supportsWebpEncoding } from "@/admin/lib/imageVariants";

// One table for everything that differs per bucket.
//
// maxDimension / quality — compression targets, picked from how large each
// image ever actually renders on the public site — no point storing an
// avatar at 4000px when it never displays bigger than a couple hundred.
// Quality is kept high (0.85) across the board since these are the photos
// selling the property; the size win comes from the dimension cap, not from
// aggressive quality loss.
//
// variants — whether the site shows this bucket's images big enough, and in
// enough different sizes, for stored smaller copies to be worth it. Property
// and neighborhood photos are shown as cards at a few hundred px up to full
// width; an avatar is a small circle, where extra copies would save almost
// nothing. (The widths and file naming of the copies live in
// lib/imageVariantConfig.mjs, shared with lib/imageUrl.js and the backfill
// script — never defined here.) Only used when VITE_SUPABASE_IMAGE_MODE is
// "variants"; in "transform" mode Supabase resizes on the fly and nothing
// extra is stored.
const BUCKET_CONFIG = {
  "property-images": { maxDimension: 2400, quality: 0.85, variants: true },
  "neighborhood-images": { maxDimension: 2000, quality: 0.85, variants: true },
  "agent-avatars": { maxDimension: 800, quality: 0.85, variants: false },
};

const ORIGINAL_CACHE_CONTROL = "3600";
// Variant file names are unique per upload and never change, so browsers can
// keep them for a year (same value the backfill script uses).
const VARIANT_CACHE_CONTROL = "31536000";
const REMOVE_CHUNK_SIZE = 100;

// Only ever delete from our own project — a URL pointing at some other
// Supabase project must never turn into a delete call here.
const OWN_HOST = (() => {
  try {
    return new URL(env.supabaseUrl).host;
  } catch {
    return null;
  }
})();

async function putObject(bucket, path, body, { cacheControl, contentType } = {}) {
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    cacheControl,
    upsert: false,
    ...(contentType ? { contentType } : {}),
  });
  if (error) throw error;
}

// Runs the tasks with at most `limit` in flight at once. Never rejects: every
// task ends up as { status: 'fulfilled', value } or { status: 'rejected',
// reason }, in the original order. After the first failure no NEW task is
// started (the rest come back { status: 'skipped' }) — there's no point
// processing more photos for a save that's already going to be rolled back.
async function runWithConcurrency(tasks, limit) {
  const outcomes = new Array(tasks.length);
  let next = 0;
  let stopped = false;

  async function worker() {
    while (!stopped) {
      const index = next++;
      if (index >= tasks.length) return;
      try {
        outcomes[index] = { status: "fulfilled", value: await tasks[index]() };
      } catch (reason) {
        outcomes[index] = { status: "rejected", reason };
        stopped = true;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return outcomes.map((outcome) => outcome ?? { status: "skipped" });
}

// ---- removing ----------------------------------------------------------------

// Removes exact storage keys. Missing keys are not an error (Storage just
// doesn't report them), which is what lets callers always include every
// possible variant key without checking which ones exist.
export async function removeStoredPaths(bucket, paths) {
  let removed = 0;
  for (let start = 0; start < paths.length; start += REMOVE_CHUNK_SIZE) {
    const { data, error } = await supabase.storage.from(bucket).remove(paths.slice(start, start + REMOVE_CHUNK_SIZE));
    if (error) throw error;
    removed += data?.length ?? 0;
  }
  return removed;
}

/**
 * Deletes the stored files behind a list of image URLs: the original and, for
 * buckets that use them, every generated copy of it. Variant keys are included
 * in EVERY mode, on purpose — if the site was switched from "variants" to
 * "transform" (or the backfill script created copies), they still exist and
 * would otherwise be orphaned.
 *
 * URLs that aren't ours are skipped silently (the seeded Pexels demo photos,
 * other projects, anything unparseable). Throws if Storage reports an error;
 * callers decide whether that's fatal.
 *
 * @param {Array<string|null|undefined>} urls
 * @returns {Promise<number>} how many files Storage reported removing
 */
export async function removeStoredImages(urls) {
  const pathsByBucket = new Map();

  for (const url of urls) {
    const parsed = parseSupabaseStorageUrl(url);
    if (!parsed || (OWN_HOST && parsed.host !== OWN_HOST)) continue;
    const config = BUCKET_CONFIG[parsed.bucket];
    if (!config) continue;

    const paths = pathsByBucket.get(parsed.bucket) ?? new Set();
    paths.add(parsed.path);
    if (config.variants) {
      for (const variantPath of variantPaths(parsed.path)) paths.add(variantPath);
    }
    pathsByBucket.set(parsed.bucket, paths);
  }

  let removed = 0;
  const errors = [];
  for (const [bucket, paths] of pathsByBucket) {
    try {
      removed += await removeStoredPaths(bucket, [...paths]);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) throw errors[0];
  return removed;
}

// ---- uploading ---------------------------------------------------------------

/**
 * The full upload for one image:
 *   compress (existing per-bucket preset) -> upload the compressed original
 *   -> [variants mode, buckets that use them] make the smaller WebP copies
 *   from that compressed image and upload them next to it.
 *
 * All-or-nothing: if any step fails, every file this call already stored is
 * removed again before the error is thrown, so a failed upload never leaves
 * an original without its copies (or copies without an original) behind.
 *
 * `variantsSkipped` is true only when this browser can't encode WebP at all —
 * the original is stored and works fine (the site falls back to it), it just
 * isn't optimized. That's reported rather than treated as a failure.
 *
 * @returns {Promise<{ url: string, paths: string[], variantsSkipped: boolean }>}
 *   `paths` is every storage key created, so a caller can roll them back if a
 *   later step (e.g. the database write) fails.
 */
export async function uploadImage(bucket, path, file) {
  const config = BUCKET_CONFIG[bucket];
  const fileToUpload = config
    ? await compressImage(file, { maxDimension: config.maxDimension, quality: config.quality })
    : file;

  const stored = [];
  try {
    await putObject(bucket, path, fileToUpload, { cacheControl: ORIGINAL_CACHE_CONTROL });
    stored.push(path);

    let variantsSkipped = false;
    if (config?.variants && SUPABASE_IMAGE_MODE === "variants" && canMakeVariants(fileToUpload)) {
      if (await supportsWebpEncoding()) {
        const variants = await createVariantBlobs(fileToUpload);
        // allSettled, not all: after one fails the others are still in flight,
        // and their keys must be recorded before the rollback below runs.
        const outcomes = await Promise.allSettled(
          variants.map(async ({ width, blob }) => {
            const variantPath = variantName(path, width);
            await putObject(bucket, variantPath, blob, {
              cacheControl: VARIANT_CACHE_CONTROL,
              contentType: "image/webp",
            });
            stored.push(variantPath);
          }),
        );
        const failed = outcomes.find((outcome) => outcome.status === "rejected");
        if (failed) throw failed.reason;
      } else {
        variantsSkipped = true;
      }
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, paths: stored, variantsSkipped };
  } catch (error) {
    await removeStoredPaths(bucket, stored).catch((cleanupError) => {
      console.error("Could not clean up after a failed image upload:", cleanupError);
    });
    throw error;
  }
}

// The storage key doubles as part of the public URL, and the site later turns
// that URL back into a key to find the copies and to delete them. Characters
// like "#" or "?" are not escaped by URL encoding the way a space is, so a file
// called "villa #2.jpg" would produce a URL that points at "villa " — it
// wouldn't display, and could never be found again for deletion. Keeping file
// names to plain letters, digits, dot, dash and underscore makes the round trip
// exact (the unique generated id in front already guarantees uniqueness; the
// original name is only there to keep keys readable).
function toSafeFileName(name) {
  const cleaned = String(name ?? "image")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // é -> e
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+/, "");
  return cleaned || "image";
}

/**
 * Uploads several images (e.g. a property's photos), a few at a time rather
 * than all at once so the browser isn't decoding and encoding ten big photos
 * simultaneously. All-or-nothing across the whole batch: if any image fails,
 * the ones that already succeeded are removed too and the error is thrown.
 *
 * @param {string} bucket
 * @param {File[]} files
 * @returns {Promise<Array<{ url, paths, variantsSkipped }>>} same order as `files`
 */
export async function uploadImages(bucket, files, { concurrency = 3 } = {}) {
  const outcomes = await runWithConcurrency(
    files.map((file) => () => uploadImage(bucket, `${generateId()}-${toSafeFileName(file.name)}`, file)),
    concurrency,
  );

  const uploads = outcomes.filter((o) => o.status === "fulfilled").map((o) => o.value);
  const failure = outcomes.find((o) => o.status === "rejected");
  if (failure) {
    await removeStoredPaths(
      bucket,
      uploads.flatMap((upload) => upload.paths),
    ).catch((cleanupError) => {
      console.error("Could not clean up after a failed batch upload:", cleanupError);
    });
    throw failure.reason;
  }
  return outcomes.map((outcome) => outcome.value);
}
