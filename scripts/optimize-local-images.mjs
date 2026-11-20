// Generates smaller copies of the *local* (bundled) images — the logo and
// the hero — so the browser can pick one that matches how big it's actually
// drawn. Photos uploaded through the dashboard don't need this: those get their
// smaller copies at upload time (see src/shared/lib/imageVariantConfig.mjs and
// src/shared/lib/imageUrl.js). This is only for the handful of
// files that live in src/assets.
//
// Run once, and again only if one of the source images is replaced or a job
// below changes:
//   npm i -D sharp
//   node scripts/optimize-local-images.mjs
//
// Output goes to src/assets/responsive/<name>-<width>w.<format>, where <width>
// is the copy's real width in pixels: a width asked for beyond the source's own
// is capped at the source's, and one that would only repeat a copy already
// written is skipped, so a file name never promises more pixels than the file
// has (the "w" numbers in a srcset have to be true). Copies are only ever
// scaled DOWN. The logo is written lossless WebP (it's a
// flat-colour mark, so that stays tiny and stays razor sharp). The hero is a
// photo, so it gets lossy WebP at quality 80 (Lighthouse flagged 88 as ~20%
// heavier than it needed to be; 80 isn't visibly different at the sizes it's
// drawn) plus an AVIF copy of every width — AVIF is typically a good deal
// smaller than WebP at the same visual quality, and Hero serves it to every
// browser that supports it, falling back to the WebP. Transparency is kept
// in both at full alpha quality. If re-encoding a WebP that is the same size
// as the source would come out *bigger* than the source, the source file is
// copied instead — this script can only make files smaller, never heavier.

import sharp from "sharp";
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = "src/assets/responsive";

const JOBS = [
  // Drawn at 28–36 CSS px (Header). 56/84/112 cover 2x–3x screens.
  { src: "src/assets/logo_nt.webp", widths: [56, 84, 112, 144], lossless: true },
  // Drawn up to ~50% of the content width on desktop (Hero). The ladder is
  // dense in the 480–960 range because that's where phones land (a 364px
  // slot needs ~640px at 1.75x, ~730px at 2x); avifQuality 60 is roughly
  // equivalent to WebP 80 for photos. The source is 1280px wide, so the 1600
  // rung is capped at 1280 and skipped as a duplicate of it; it stays in the
  // list so that a wider source picks it up on its own.
  {
    src: "src/assets/hero_transparent.webp",
    widths: [480, 640, 720, 800, 960, 1280, 1600],
    quality: 80,
    avifQuality: 60,
  },
];

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

await mkdir(OUT_DIR, { recursive: true });

for (const job of JOBS) {
  const name = path.basename(job.src, path.extname(job.src));
  const meta = await sharp(job.src).metadata();
  const originalBytes = (await stat(job.src)).size;
  console.log(`\n${job.src}: ${meta.width}×${meta.height}, ${kb(originalBytes)}`);

  // The real widths already written for this job. Two asked-for widths that both
  // end up capped at the source's width would be the same file under two names,
  // so the second one is skipped instead of being written again.
  const written = new Set();

  for (const width of job.widths) {
    const targetWidth = Math.min(width, meta.width); // never enlarge
    // What the log calls this copy: its width, or "asked -> real" when capped.
    const label = width === targetWidth ? `${width}w` : `${width}w → ${targetWidth}w`;

    if (written.has(targetWidth)) {
      console.log(`  ${label}  skipped: same file as the ${targetWidth}w copy already written`);
      continue;
    }
    written.add(targetWidth);

    const resized = () => sharp(job.src).resize({ width: targetWidth, withoutEnlargement: true });

    const webpPath = path.join(OUT_DIR, `${name}-${targetWidth}w.webp`);
    const webp = await resized()
      .webp({
        lossless: job.lossless ?? false,
        quality: job.quality ?? 90,
        alphaQuality: 100,
        effort: 6,
      })
      .toBuffer();

    let line;
    if (targetWidth === meta.width && webp.length >= originalBytes) {
      await copyFile(job.src, webpPath);
      line = `  ${label}  webp: kept source file (re-encode would be larger)`;
    } else {
      await writeFile(webpPath, webp);
      line = `  ${label}  webp: ${targetWidth}px wide, ${kb(webp.length)}`;
    }

    if (job.avifQuality) {
      const avif = await resized().avif({ quality: job.avifQuality, effort: 6 }).toBuffer();
      await writeFile(path.join(OUT_DIR, `${name}-${targetWidth}w.avif`), avif);
      line += `  |  avif: ${kb(avif.length)}`;
    }
    console.log(line);
  }
}

console.log("\nDone. Variants are in", OUT_DIR);
