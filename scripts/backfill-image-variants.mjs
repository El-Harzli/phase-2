// One-time (and safe to re-run) script: creates the smaller WebP copies for
// images that are ALREADY in Supabase Storage, following the naming in
// src/shared/lib/imageVariantConfig.mjs (photo.jpg -> photo_w480.webp, _w800.webp,
// _w1280.webp, stored next to the original). New uploads should get their
// copies from the dashboard's upload code; this covers everything uploaded
// before that existed.
//
// It only ever ADDS files. Originals are never touched or deleted, nothing is
// overwritten, and a file that already exists is skipped — so running it twice
// is harmless. It does a DRY RUN by default (lists what it would create);
// add --write to actually upload.
//
// Usage (from the project root):
//   npm i -D sharp @supabase/supabase-js        (supabase-js is already a dependency)
//   SUPABASE_URL=https://<project>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service role key> \
//   node scripts/backfill-image-variants.mjs <bucket> [<bucket> ...] [--write]
//
// e.g.  node scripts/backfill-image-variants.mjs neighborhoods property-images
//
// The SERVICE ROLE key bypasses all security rules. Use it only here, on your
// own machine: never put it in a VITE_ variable, never commit it, never ship
// it to the browser.

import sharp from "sharp";
import { pathToFileURL } from "node:url";
import { VARIANT_QUALITY, VARIANT_WIDTHS, isVariantName, variantName } from "../src/shared/lib/imageVariantConfig.mjs";

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|avif|gif)$/i;
const PAGE_SIZE = 100;
const ONE_YEAR_SECONDS = "31536000"; // file names are unique per upload, so they never change

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

// Every file in the bucket, walking into folders (Supabase lists a folder as
// an entry with a null id).
export async function listFiles(storage, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await storage.list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...(await listFiles(storage, itemPath)));
      else files.push(itemPath);
    }
    if (data.length < PAGE_SIZE) break;
  }
  return files;
}

export async function processBucket(client, bucket, { write }) {
  const storage = client.storage.from(bucket);
  const allPaths = await listFiles(storage);
  const existing = new Set(allPaths);
  const originals = allPaths.filter((filePath) => IMAGE_EXTENSION.test(filePath) && !isVariantName(filePath));

  const stats = { originals: originals.length, upToDate: 0, created: 0, wouldCreate: 0, failed: 0 };
  console.log(`\n[${bucket}] ${originals.length} original image(s) found`);

  for (const filePath of originals) {
    const slash = filePath.lastIndexOf("/");
    const dir = filePath.slice(0, slash + 1);
    const file = filePath.slice(slash + 1);
    const missing = VARIANT_WIDTHS.filter((width) => !existing.has(dir + variantName(file, width)));

    if (missing.length === 0) {
      stats.upToDate += 1;
      continue;
    }
    if (!write) {
      stats.wouldCreate += missing.length;
      console.log(`  would create ${missing.map((w) => `_w${w}`).join(", ")}  <-  ${filePath}`);
      continue;
    }

    try {
      const { data: blob, error } = await storage.download(filePath);
      if (error) throw error;
      const source = Buffer.from(await blob.arrayBuffer());

      for (const width of missing) {
        // Always produce every size, never enlarging: an original narrower than
        // a size just gets a re-encoded copy at its own width, so the file the
        // page asks for always exists (a missing one would mean a 404 + fallback).
        const buffer = await sharp(source)
          .rotate() // honour EXIF orientation, if any
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: VARIANT_QUALITY, effort: 5 })
          .toBuffer();
        const variantPath = dir + variantName(file, width);
        const { error: uploadError } = await storage.upload(variantPath, buffer, {
          contentType: "image/webp",
          cacheControl: ONE_YEAR_SECONDS,
          upsert: false,
        });
        if (uploadError) throw uploadError;
        existing.add(variantPath);
        stats.created += 1;
        console.log(`  created ${variantPath} (${kb(buffer.length)})  [original ${kb(source.length)}]`);
      }
    } catch (error) {
      stats.failed += 1;
      console.error(`  FAILED ${filePath}: ${error?.message ?? error}`);
    }
  }

  console.log(
    `[${bucket}] ${stats.upToDate} already complete` +
      (write ? `, ${stats.created} file(s) created` : `, ${stats.wouldCreate} file(s) would be created`) +
      (stats.failed ? `, ${stats.failed} FAILED` : ""),
  );
  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const buckets = args.filter((arg) => !arg.startsWith("--"));
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

  if (buckets.length === 0 || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/backfill-image-variants.mjs <bucket> [<bucket> …] [--write]",
    );
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log(
    write ? "WRITE mode — uploading missing copies." : "DRY RUN — nothing will be uploaded. Add --write to apply.",
  );
  let failed = 0;
  for (const bucket of buckets) {
    failed += (await processBucket(client, bucket, { write })).failed;
  }
  if (failed) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
