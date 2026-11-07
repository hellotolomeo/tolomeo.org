// Build-time image pipeline (BRIEF §6.2).
//
// processImages({ root, out, log }) walks `${root}/images` and writes responsive,
// content-addressed variants under `${out}/images/`:
//
//   /images/<dir>/<name>.<hash8>.<w>.jpg   and   .webp
//
// hash8 = first 8 hex chars of sha256(source bytes); <w> = the actual output width.
// Widths: every target in [600, 1200, 2000] below the (auto-rotated) source width,
// plus min(width, 2000) as the largest; deduped, ascending.
//
// Encoding: auto-orient (EXIF), resize withoutEnlargement, sRGB, metadata stripped,
// JPEG q80 mozjpeg, WebP q80.
//
// Transparency: a raster source with real transparency (hasAlpha and stats().isOpaque
// is false) gets PNG variants in the `jpg` slot (the key stays `jpg`, the file ends in
// .png) plus WebP with alpha, because JPEG would flatten the transparent area. This is
// checked for every raster format, not only PNG (a transparent WebP/TIFF/AVIF behaves
// the same way). Opaque sources that merely carry an alpha channel drop it.
//
// SVG and GIF are copied byte-for-byte to `${out}/images/<rel>` (type 'copy', no variants).
// HEIC/HEIF are skipped with a warning: CI (scripts/normalize-images.js) converts them,
// sharp cannot decode HEVC. Dotfiles and non-image files are ignored. A file that fails
// to decode is skipped with a warning, so the returned Map can lack keys: callers must
// treat a missing key as "no processed image".
//
// Incremental: `${out}/images/manifest.json` = { version: 1, entries: { <rel>: {hash,
// width, height, type, variants} } }. An entry whose hash matches and whose outputs all
// exist is reused without running sharp. Afterwards every file under `${out}/images/` that
// is not a current output (or the manifest) is pruned, and empty dirs removed; the dir
// itself is never deleted (CI restores it from a cache).
//
// Concurrent calls (the dev server calls this per request) are serialized.

import { createHash } from 'node:crypto';
import { availableParallelism } from 'node:os';
import { mkdir, readFile, readdir, rename, rm, rmdir, stat, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const TARGET_WIDTHS = [600, 1200, 2000];
const MAX_WIDTH = 2000;
const RASTER_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff', 'avif']);
const COPY_EXT = new Set(['gif', 'svg']);
const HEIF_EXT = new Set(['heic', 'heif']);
const MANIFEST = 'manifest.json';
const MANIFEST_VERSION = 1;
// What the outputs depend on besides the source bytes: change any of it and every image is
// re-encoded (a cache restored in CI from an older key included).
const SETTINGS = JSON.stringify({ widths: TARGET_WIDTHS, max: MAX_WIDTH, jpeg: 80, webp: 80, vips: sharp.versions.vips });
const CONCURRENCY = Math.max(1, Math.min(4, availableParallelism()));

let chain = Promise.resolve();

/**
 * @param {{ root: string, out: string, log?: (line: string) => void }} opts
 * @returns {Promise<Map<string, {src: string, type: 'raster'|'copy', width: number|null,
 *   height: number|null, variants: {width: number, jpg: string, webp: string}[]}>>}
 */
export function processImages(opts) {
  const run = chain.then(() => run_(opts));
  chain = run.catch(() => {});
  return run;
}

async function run_({ root, out, log = () => {} }) {
  const srcDir = path.join(root, 'images');
  const outDir = path.join(out, 'images');
  await mkdir(outDir, { recursive: true });

  const previous = await readManifest(outDir);
  const files = (await walk(srcDir)).sort();
  const jobs = [];
  for (const rel of files) {
    const ext = extOf(rel);
    if (HEIF_EXT.has(ext)) {
      log(`images: warning: skipped ${rel} (HEIC/HEIF; CI normalization should have converted it to JPEG)`);
    } else if (RASTER_EXT.has(ext) || COPY_EXT.has(ext)) {
      jobs.push(rel);
    }
  }

  const entries = {};
  let processed = 0;
  let cached = 0;
  await pool(jobs, CONCURRENCY, async (rel) => {
    try {
      const bytes = await readFile(path.join(srcDir, rel));
      const hash = createHash('sha256').update(bytes).digest('hex');
      const old = previous[rel];
      if (old && old.hash === hash && (await outputsExist(out, rel, old))) {
        entries[rel] = old;
        cached++;
        return;
      }
      entries[rel] = COPY_EXT.has(extOf(rel))
        ? await copyThrough(bytes, rel, hash, outDir)
        : await rasterize(bytes, rel, hash, outDir);
      processed++;
    } catch (err) {
      log(`images: warning: skipped ${rel} (${err.message})`);
    }
  });

  const keep = new Set([MANIFEST]);
  const map = new Map();
  for (const rel of Object.keys(entries).sort()) {
    const e = entries[rel];
    for (const p of outputsOf(rel, e)) keep.add(p.replace(/^\/images\//, ''));
    map.set(rel, {
      src: `/images/${rel}`,
      type: e.type,
      width: e.width,
      height: e.height,
      variants: e.variants.map((v) => ({ ...v })),
    });
  }

  await writeManifest(outDir, entries);
  const pruned = await prune(outDir, keep);
  log(`images: ${map.size} total, ${processed} processed, ${cached} cached, ${pruned} pruned`);
  return map;
}

function widthsFor(w) {
  const list = TARGET_WIDTHS.filter((t) => t < w);
  list.push(Math.min(w, MAX_WIDTH));
  return [...new Set(list)].sort((a, b) => a - b);
}

async function rasterize(bytes, rel, hash, outDir) {
  const meta = await sharp(bytes).metadata();
  const oriented = meta.autoOrient ?? (meta.orientation >= 5
    ? { width: meta.height, height: meta.width }
    : { width: meta.width, height: meta.height });
  const { width, height } = oriented;
  if (!width || !height) throw new Error('no dimensions');

  let transparent = false;
  if (meta.hasAlpha) transparent = !(await sharp(bytes).stats()).isOpaque;

  const dir = path.posix.dirname(rel);
  const base = path.posix.basename(rel, path.posix.extname(rel));
  const stem = `${dir === '.' ? '' : dir + '/'}${base}.${hash.slice(0, 8)}`;
  const fallbackExt = transparent ? 'png' : 'jpg';
  await mkdir(path.join(outDir, dir), { recursive: true });

  const variants = [];
  for (const w of widthsFor(width)) {
    const pipeline = () => {
      let s = sharp(bytes).rotate().resize({ width: w, withoutEnlargement: true }).toColourspace('srgb');
      if (meta.hasAlpha && !transparent) s = s.removeAlpha();
      return s;
    };
    const fb = transparent
      ? pipeline().png({ compressionLevel: 9, adaptiveFiltering: true })
      : pipeline().jpeg({ quality: 80, mozjpeg: true });
    const { data: fbData, info } = await fb.toBuffer({ resolveWithObject: true });
    const webpData = await pipeline().webp({ quality: 80 }).toBuffer();
    const actual = info.width;
    const jpg = `/images/${stem}.${actual}.${fallbackExt}`;
    const webp = `/images/${stem}.${actual}.webp`;
    await writeAtomic(path.join(outDir, jpg.slice('/images/'.length)), fbData);
    await writeAtomic(path.join(outDir, webp.slice('/images/'.length)), webpData);
    if (!variants.some((v) => v.width === actual)) variants.push({ width: actual, jpg, webp });
  }
  variants.sort((a, b) => a.width - b.width);
  return { hash, width, height, type: 'raster', variants };
}

async function copyThrough(bytes, rel, hash, outDir) {
  let width = null;
  let height = null;
  try {
    const meta = await sharp(bytes).metadata();
    width = meta.width ?? null;
    height = meta.pageHeight ?? meta.height ?? null;
  } catch {
    // dimensions are optional for copied files
  }
  const dest = path.join(outDir, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeAtomic(dest, bytes);
  return { hash, width, height, type: 'copy', variants: [] };
}

function outputsOf(rel, entry) {
  if (entry.type === 'copy') return [`/images/${rel}`];
  return entry.variants.flatMap((v) => [v.jpg, v.webp]);
}

async function outputsExist(out, rel, entry) {
  if (!Array.isArray(entry.variants) || (entry.type === 'raster' && entry.variants.length === 0)) return false;
  for (const p of outputsOf(rel, entry)) {
    try {
      await stat(path.join(out, p));
    } catch {
      return false;
    }
  }
  return true;
}

async function readManifest(outDir) {
  try {
    const data = JSON.parse(await readFile(path.join(outDir, MANIFEST), 'utf8'));
    if (data && data.version === MANIFEST_VERSION && data.settings === SETTINGS && data.entries && typeof data.entries === 'object') {
      return data.entries;
    }
  } catch {
    // missing or corrupt manifest: rebuild everything
  }
  return {};
}

async function writeManifest(outDir, entries) {
  const sorted = {};
  for (const k of Object.keys(entries).sort()) sorted[k] = entries[k];
  const json = JSON.stringify({ version: MANIFEST_VERSION, settings: SETTINGS, entries: sorted }, null, 2) + '\n';
  await writeAtomic(path.join(outDir, MANIFEST), json);
}

async function writeAtomic(file, data) {
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, file);
}

// Removes every file under outDir whose relative path is not in `keep`, then empty dirs.
// Returns the number of files removed.
async function prune(outDir, keep) {
  let count = 0;
  async function visit(dir, relDir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const rel = relDir ? `${relDir}/${ent.name}` : ent.name;
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await visit(abs, rel);
        try {
          await rmdir(abs);
        } catch {
          // not empty
        }
      } else if (!keep.has(rel)) {
        await rm(abs, { force: true });
        count++;
      }
    }
  }
  await visit(outDir, '');
  return count;
}

// Recursive list of files under dir, relative with forward slashes; skips dotfiles/dirs.
async function walk(dir, relDir = '') {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const outList = [];
  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    const rel = relDir ? `${relDir}/${ent.name}` : ent.name;
    if (ent.isDirectory()) outList.push(...(await walk(path.join(dir, ent.name), rel)));
    else if (ent.isFile()) outList.push(rel);
  }
  return outList;
}

function extOf(rel) {
  return path.posix.extname(rel).slice(1).toLowerCase();
}

async function pool(items, limit, fn) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await fn(items[next++]);
  });
  await Promise.all(workers);
}
