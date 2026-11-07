#!/usr/bin/env node
// CI image normalization (BRIEF §6.1). Run from the repo root (or pass the root as the
// first argument): node scripts/normalize-images.js [root]
//
// Walks images/ and:
//   - HEIC/HEIF -> JPEG (decoded by heif-convert, or sips on macOS; sharp cannot decode
//     HEVC), then resized to <= 2000px long edge.
//   - TIFF -> JPEG via sharp (PNG instead if the TIFF has real transparency).
//   - JPEG/PNG/WebP whose long edge > 2000 -> resized in place (JPEG q85 mozjpeg,
//     PNG stays PNG, WebP q85), EXIF orientation applied.
// Files already <= 2000px in an allowed format are never rewritten, so a second run
// changes nothing. When a file's extension changes, every reference to its public path
// ('/images/<rel>') in content/**/*.md is rewritten and the original is deleted; name
// collisions get a -1, -2... suffix.
// Last line of output: "normalized: N". Exit 0 on success, 1 if any file failed.

import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

export const MAX_EDGE = 2000;
const IN_PLACE = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp' };
const TIFF = new Set(['tif', 'tiff']);
const HEIF = new Set(['heic', 'heif']);

const has = (cmd) => spawnSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore' }).status === 0;

export const HEIC_HELP =
  'HEIC/HEIF decoding needs an external tool (sharp cannot decode HEVC):\n' +
  '  macOS: sips (built in)\n' +
  '  Debian/Ubuntu: sudo apt-get install libheif-examples libheif-plugin-libde265  (provides heif-convert)';

// Decodes a HEIC/HEIF file to a JPEG in a fresh temp dir. Returns { file, cleanup }.
export async function heicToJpeg(input) {
  const dir = await mkdtemp(path.join(tmpdir(), 'heic-'));
  const cleanup = () => rm(dir, { recursive: true, force: true });
  const outFile = path.join(dir, 'out.jpg');
  let res;
  if (has('heif-convert')) {
    res = spawnSync('heif-convert', ['-q', '95', input, outFile], { encoding: 'utf8' });
  } else if (has('sips')) {
    res = spawnSync('sips', ['-s', 'format', 'jpeg', input, '--out', outFile], { encoding: 'utf8' });
  } else {
    await cleanup();
    throw new Error(`no HEIC decoder found.\n${HEIC_HELP}`);
  }
  // heif-convert writes out-1.jpg, out-2.jpg... when a file holds several top-level images.
  const produced = (await readdir(dir)).filter((f) => /^out(-\d+)?\.jpe?g$/i.test(f)).sort();
  const pick = produced.includes('out.jpg') ? 'out.jpg' : produced[0];
  if (res.status !== 0 || !pick) {
    await cleanup();
    throw new Error(`HEIC decode failed: ${(res.stderr || res.stdout || '').trim() || 'no output'}`);
  }
  return { file: path.join(dir, pick), cleanup };
}

export async function hasRealTransparency(input) {
  const meta = await sharp(input).metadata();
  if (!meta.hasAlpha) return false;
  return !(await sharp(input).stats()).isOpaque;
}

// Returns an encoded buffer: auto-rotated, fit inside MAX_EDGE x MAX_EDGE, never enlarged.
export async function encode(input, format, quality = 85) {
  const s = sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });
  if (format === 'png') return s.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  if (format === 'webp') return s.webp({ quality }).toBuffer();
  return s.jpeg({ quality, mozjpeg: true }).toBuffer();
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, relDir = '') {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const list = [];
  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    const rel = relDir ? `${relDir}/${ent.name}` : ent.name;
    if (ent.isDirectory()) list.push(...(await walk(path.join(dir, ent.name), rel)));
    else if (ent.isFile()) list.push(rel);
  }
  return list.sort();
}

async function writeAtomic(file, data) {
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.tmp`);
  await writeFile(tmp, data);
  await rename(tmp, file);
}

// First free "<base><suffix>.<ext>" in dir: base.jpg, base-1.jpg, base-2.jpg...
async function freeName(dir, base, ext) {
  for (let i = 0; ; i++) {
    const name = `${base}${i ? `-${i}` : ''}.${ext}`;
    if (!(await exists(path.join(dir, name)))) return name;
  }
}

async function rewriteReferences(contentDir, from, to) {
  const variants = [[from, to]];
  if (encodeURI(from) !== from) variants.push([encodeURI(from), encodeURI(to)]);
  const changed = [];
  for (const rel of await walk(contentDir)) {
    if (!rel.toLowerCase().endsWith('.md')) continue;
    const file = path.join(contentDir, rel);
    const text = await readFile(file, 'utf8');
    let next = text;
    for (const [a, b] of variants) next = next.split(a).join(b);
    if (next !== text) {
      await writeFile(file, next);
      changed.push(`content/${rel}`);
    }
  }
  return changed;
}

export async function normalize(root, log = console.log) {
  const imagesDir = path.join(root, 'images');
  const contentDir = path.join(root, 'content');
  let normalized = 0;
  let failed = 0;

  for (const rel of await walk(imagesDir)) {
    const abs = path.join(imagesDir, rel);
    const ext = path.extname(rel).slice(1).toLowerCase();
    const dirRel = path.posix.dirname(rel);
    const base = path.posix.basename(rel, path.posix.extname(rel));
    try {
      if (HEIF.has(ext) || TIFF.has(ext)) {
        let source = abs;
        let cleanup = async () => {};
        if (HEIF.has(ext)) ({ file: source, cleanup } = await heicToJpeg(abs));
        try {
          const format = TIFF.has(ext) && (await hasRealTransparency(source)) ? 'png' : 'jpeg';
          const outExt = format === 'png' ? 'png' : 'jpg';
          const data = await encode(source, format);
          const name = await freeName(path.dirname(abs), base, outExt);
          await writeAtomic(path.join(path.dirname(abs), name), data);
          const newRel = dirRel === '.' ? name : `${dirRel}/${name}`;
          const refs = await rewriteReferences(contentDir, `/images/${rel}`, `/images/${newRel}`);
          await rm(abs);
          normalized++;
          log(`converted ${rel} -> ${newRel}${refs.length ? ` (updated ${refs.join(', ')})` : ''}`);
        } finally {
          await cleanup();
        }
      } else if (IN_PLACE[ext]) {
        const meta = await sharp(abs).metadata();
        if (Math.max(meta.width || 0, meta.height || 0) <= MAX_EDGE) continue;
        const data = await encode(abs, IN_PLACE[ext]);
        await writeAtomic(abs, data);
        normalized++;
        log(`resized ${rel} (${meta.width}x${meta.height} -> ${MAX_EDGE}px long edge)`);
      }
    } catch (err) {
      failed++;
      log(`error: ${rel}: ${err.message}`);
    }
  }
  return { normalized, failed };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const root = path.resolve(process.argv[2] || process.cwd());
  const { normalized, failed } = await normalize(root);
  console.log(`${normalized} file(s) normalized${failed ? `, ${failed} failed (left untouched)` : ''}`);
  console.log(`normalized: ${normalized}`);
  process.exitCode = failed ? 1 : 0;
}
