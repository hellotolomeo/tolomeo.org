#!/usr/bin/env node
// Optional bulk tool (BRIEF §6.3). Run from the repo root:
//   npm run images -- <folder-of-originals> <slug>
//
// Reads the JPEG/PNG/TIFF/HEIC/HEIF/WebP files directly in <folder> (not subfolders),
// sorted by name, and writes 2000px-long-edge web copies into images/projects/<slug>/ as
// <slug>-01.jpg, <slug>-02.jpg... (JPEG q85 mozjpeg; PNG only for real transparency),
// numbering on after any copies already there. The originals are only read, never changed.
// Prints the `images:` YAML to paste into the project. Exit 0 ok, 1 failure, 2 usage.

import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { encode, hasRealTransparency, heicToJpeg } from './normalize-images.js';

const INPUT_EXT = new Set(['jpg', 'jpeg', 'png', 'tif', 'tiff', 'heic', 'heif', 'webp']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`);
  console.error('usage: npm run images -- <folder-of-originals> <slug>');
  console.error('   or: node scripts/prepare-images.js <folder-of-originals> <slug>');
  console.error('Writes images/projects/<slug>/<slug>-01.jpg... (2000px long edge) and prints the YAML.');
  process.exit(2);
}

const [folderArg, slug, ...extra] = process.argv.slice(2);
if (!folderArg || !slug || extra.length) usage();
if (!SLUG.test(slug)) usage(`"${slug}" is not a slug (lowercase letters, digits and hyphens)`);

const folder = path.resolve(folderArg);
try {
  if (!(await stat(folder)).isDirectory()) usage(`${folderArg} is not a folder`);
} catch {
  usage(`${folderArg} does not exist`);
}

const root = process.cwd();
const destDir = path.join(root, 'images', 'projects', slug);

const inputs = (await readdir(folder, { withFileTypes: true }))
  .filter((e) => e.isFile() && !e.name.startsWith('.'))
  .map((e) => e.name)
  .filter((n) => INPUT_EXT.has(path.extname(n).slice(1).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

if (!inputs.length) {
  console.error(`error: no JPEG, PNG, TIFF, HEIC or WebP files in ${folderArg}`);
  process.exit(1);
}

await mkdir(destDir, { recursive: true });
const numbered = new RegExp(`^${slug}-(\\d+)\\.[a-z0-9]+$`, 'i');
let n = 0;
for (const name of await readdir(destDir)) {
  const m = numbered.exec(name);
  if (m) n = Math.max(n, Number(m[1]));
}

const written = [];
let failed = 0;
for (const name of inputs) {
  const abs = path.join(folder, name);
  const ext = path.extname(name).slice(1).toLowerCase();
  let source = abs;
  let cleanup = async () => {};
  try {
    if (ext === 'heic' || ext === 'heif') ({ file: source, cleanup } = await heicToJpeg(abs));
    const png = (await hasRealTransparency(source)) && ext !== 'heic' && ext !== 'heif';
    const data = await encode(source, png ? 'png' : 'jpeg');
    n++;
    const outName = `${slug}-${String(n).padStart(2, '0')}.${png ? 'png' : 'jpg'}`;
    await writeFile(path.join(destDir, outName), data, { flag: 'wx' });
    written.push(outName);
    console.error(`${name} -> images/projects/${slug}/${outName}`);
  } catch (err) {
    failed++;
    console.error(`error: ${name}: ${err.message}`);
  } finally {
    await cleanup();
  }
}

if (written.length) {
  console.error(`\n${written.length} file(s) written. Paste into content/projects/${slug}.md front matter:\n`);
  const yaml = ['images:'];
  for (const f of written) yaml.push(`  - image: /images/projects/${slug}/${f}`, '    alt: ""');
  console.log(yaml.join('\n'));
}
process.exit(failed ? 1 : 0);
