#!/usr/bin/env node
// One-time content migration from the design team's site kit (site-data.json), which supersedes
// the project spreadsheet (scripts/import-projects.py would undo its typo fixes; don't run it).
//
//   node scripts/import-site-data.js <site-data.json> <kit-folder> [--canvas <blob-folder>] [--dry-run]
//
// For every project in site-data.json, in its order, the matching content/projects/<slug>.md
// (matched by title, apostrophes and case ignored, plus the two renames in RENAMED) gets:
// title, years (the JSON date as written), year_start/year_end, tags, role, client, parent,
// order (1, 2, 3 … for top-level projects, <parent>.<n> for sub-items), published: true,
// images (copied from the kit to images/projects/<slug>/, with their alt text), hover_image,
// and the description paragraphs as its body. cover, cover_style, cover_focus, cover_zoom and
// photo_links are kept, except for the new covers in NEW_COVERS (a kit `newThumbnail`, or a
// design-canvas blob when --canvas is given). Files the JSON doesn't list get published: false
// and nothing else. File names and slugs never change, so URLs stay the same.
//
// The front matter is edited key by key in place: a key whose value is unchanged keeps its
// lines; a changed one is written in the YAML style scripts/import-projects.py (PyYAML) writes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import matter from 'gray-matter';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS = path.join(ROOT, 'content/projects');
const IMAGES = path.join(ROOT, 'images/projects');

// JSON slug -> content file slug, where the title changed.
const RENAMED = {
  greenfest: 'jet-rebels-greenfest',
  iwc: 'international-workers-collective',
};

// New Index thumbnails: content slug -> source and style. `kit` is a path in the kit folder
// (the JSON's newThumbnail); `canvas` is a blob in the design canvas export (--canvas).
const NEW_COVERS = {
  'print-for-palestine': { kit: 'thumbnails/print-for-palestine.jpg', style: 'small' },
  'living-in-the-in-between': { canvas: 'aebd4d6ee0ba3453a6156eb456362005.jpg', style: 'polaroid' },
  misslightenment: { canvas: '5b79ea10e97f49309e5eaa03134432ca.jpg', style: 'small' },
  'story-of-the-eye-a-visual-reinterpretation': { canvas: 'ce03cb434132f9a3c1c3381e718ffb21.jpg', style: 'polaroid' },
  'pleasure-systems-archive': { canvas: '43df66ec06daea55e2260820dd1dcfc4.jpg', style: 'polaroid' },
  'partner-toys-18': { canvas: '2d8b93f15b186aae545d1eaa0aac0b2a.jpg', style: 'fill' },
};

// canonical key order, used only to place a key the file lacks (the CMS drops empty keys)
const KEY_ORDER = ['title', 'slug', 'order', 'years', 'year_start', 'year_end', 'tags', 'role',
  'client', 'parent', 'published', 'cover', 'cover_style', 'cover_focus', 'cover_zoom', 'images',
  'hover_image', 'photo_links'];

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const canvasAt = args.indexOf('--canvas');
const canvasDir = canvasAt >= 0 ? args[canvasAt + 1] : null;
const positional = args.filter((a, i) => !a.startsWith('--') && (canvasAt < 0 || i !== canvasAt + 1));
const [jsonPath, kitDir] = positional;
if (!jsonPath || !kitDir || (canvasAt >= 0 && !canvasDir)) {
  console.error('usage: node scripts/import-site-data.js <site-data.json> <kit-folder> [--canvas <blob-folder>] [--dry-run]');
  process.exit(2);
}

// ---------------------------------------------------------------------------------------------
// YAML, in the style of import-projects.py: PyYAML safe_dump, sort_keys=False,
// allow_unicode=True, width=1000, with its _str representer (double quotes for '', ':', a
// leading indicator or edge whitespace; otherwise plain, or single quotes where PyYAML's own
// resolver would read the plain text as something other than that string).

const PY_BOOL = /^(yes|Yes|YES|no|No|NO|true|True|TRUE|false|False|FALSE|on|On|ON|off|Off|OFF)$/;
const PY_NULL = /^(~|null|Null|NULL)$/;
const PY_NUM = /^[-+]?(\.[0-9]+|[0-9][0-9_]*)(\.[0-9_]*)?([eE][-+][0-9]+)?$|^[-+]?0b[0-1_]+$|^[-+]?0x[0-9a-fA-F_]+$|^[-+]?\.(inf|Inf|INF)$|^\.(nan|NaN|NAN)$/;
const PY_DATE = /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}/;

function scalar(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const s = String(v);
  if (s === '' || s.includes(':') || "[{&*!|>'\"%@`#".includes(s[0]) || s.trim() !== s) {
    return JSON.stringify(s);
  }
  const plain = !PY_BOOL.test(s) && !PY_NULL.test(s) && !PY_NUM.test(s) && !PY_DATE.test(s)
    && !/^[-?,\]}]/.test(s) && !/ #/.test(s) && !/[\n\t]/.test(s) && (() => {
      try { return matter.engines.yaml.parse(s) === s; } catch { return false; }
    })();
  return plain ? s : `'${s.replace(/'/g, "''")}'`;
}

function block(key, value) {
  if (Array.isArray(value)) {
    if (!value.length) return `${key}: []`;
    const lines = [`${key}:`];
    for (const item of value) {
      if (item && typeof item === 'object') {
        Object.entries(item).forEach(([k, v], i) => lines.push(`${i ? '  ' : '- '}${k}: ${scalar(v)}`));
      } else lines.push(`- ${scalar(item)}`);
    }
    return lines.join('\n');
  }
  return `${key}: ${scalar(value)}`;
}

// Split front matter text into top-level key blocks (a key line plus its indented/`- ` lines).
function keyBlocks(fmText) {
  const blocks = [];
  for (const line of fmText.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*):(\s|$)/);
    if (m) blocks.push({ key: m[1], lines: [line] });
    else if (blocks.length) blocks[blocks.length - 1].lines.push(line);
    else blocks.push({ key: null, lines: [line] });
  }
  return blocks;
}

// Rewrite the changed keys in place; returns the new file text.
function rewrite(raw, updates, body) {
  const m = raw.match(/^---\n([\s\S]*?)\n---(\n|$)/);
  if (!m) throw new Error('no front matter');
  const blocks = keyBlocks(m[1]);
  for (const [key, value] of Object.entries(updates)) {
    const lines = block(key, value).split('\n');
    const found = blocks.find((b) => b.key === key);
    if (found) {
      found.lines = lines;
      continue;
    }
    const want = KEY_ORDER.indexOf(key);
    let at = blocks.length;
    for (let i = want - 1; i >= 0 && at === blocks.length; i--) {
      const idx = blocks.findIndex((b) => b.key === KEY_ORDER[i]);
      if (idx >= 0) at = idx + 1;
    }
    blocks.splice(at, 0, { key, lines });
  }
  const fm = blocks.map((b) => b.lines.join('\n')).join('\n');
  const rest = body === undefined ? raw.slice(m[0].length) : (body ? `\n${body}\n` : '');
  return `---\n${fm}\n---\n${rest}`;
}

// ---------------------------------------------------------------------------------------------
// Matching

const norm = (s) => String(s || '')
  .normalize('NFKC')
  .replace(/[‘’ʼ´`]/g, "'")
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

function loadProjects() {
  return fs.readdirSync(PROJECTS).filter((f) => f.endsWith('.md') && !f.startsWith('.')).sort().map((f) => {
    const file = path.join(PROJECTS, f);
    const raw = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(raw, {});
    return { file, raw, data, body: content.trim(), slug: f.replace(/\.md$/, '') };
  });
}

function yearsOf(date) {
  const yy = (String(date).match(/\d{4}/g) || []).map(Number);
  if (!yy.length) return [null, null];
  const open = /[–-]\s*$/.test(String(date).trim());
  return [yy[0], open ? null : yy[yy.length - 1]];
}

const split = (s) => String(s ?? '').split(', ').map((x) => x.trim()).filter(Boolean);
const publicPath = (slug, file) => `/images/projects/${slug}/${path.basename(file)}`;

// ---------------------------------------------------------------------------------------------
// Main

const site = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const list = Array.isArray(site) ? site : site.projects;
const projects = loadProjects();
const byTitle = new Map(projects.map((p) => [norm(p.data.title), p]));
const bySlug = new Map(projects.map((p) => [p.slug, p]));

const copies = []; // [from, to]
const report = [];
const unmatched = [];
const matched = new Set();
let top = 0;
let parent = null;
let children = 0;
const childCount = new Map();
{
  let cur = null;
  for (const j of list) {
    if (!j.subItem) cur = j;
    else if (cur) childCount.set(cur, (childCount.get(cur) || 0) + 1);
  }
}

for (const j of list) {
  const project = RENAMED[j.slug] ? bySlug.get(RENAMED[j.slug]) : byTitle.get(norm(j.title));
  if (!project) {
    unmatched.push(`${j.slug} (${j.title})`);
    continue;
  }
  if (matched.has(project.slug)) throw new Error(`${project.slug} matched twice`);
  matched.add(project.slug);
  const slug = project.slug;
  const old = project.data;

  let order;
  if (!j.subItem || !parent) {
    top += 1;
    children = 0;
    parent = { slug, order: top, width: (childCount.get(j) || 0) >= 10 ? 2 : 1 };
    order = top;
  } else {
    children += 1;
    order = Number(`${parent.order}.${String(children).padStart(parent.width, '0')}`);
  }
  if (j.subItem && parent.slug === slug) throw new Error(`${j.slug}: sub-item with no parent`);

  const [yearStart, yearEnd] = yearsOf(j.date);
  const images = (j.images || []).map((im) => {
    copies.push([path.join(kitDir, im.file), path.join(IMAGES, slug, path.basename(im.file))]);
    return { image: publicPath(slug, im.file), alt: String(im.alt ?? '') };
  });
  const want = {
    title: String(j.title),
    order,
    years: String(j.date ?? ''),
    year_start: yearStart,
    year_end: yearEnd,
    tags: split(j.type),
    role: split(j.role),
    client: String(j.for ?? ''),
    parent: j.subItem ? parent.slug : null,
    published: true,
    images,
    hover_image: j.hoverImage ? publicPath(slug, j.hoverImage) : '',
  };

  const nc = NEW_COVERS[slug];
  let coverNote = '';
  if (nc) {
    const src = nc.kit ? path.join(kitDir, j.newThumbnail || nc.kit)
      : canvasDir ? path.join(canvasDir, nc.canvas) : null;
    if (src) {
      const dest = `${slug}-cover${path.extname(src).toLowerCase() || '.jpg'}`;
      copies.push([src, path.join(IMAGES, slug, dest)]);
      want.cover = `/images/projects/${slug}/${dest}`;
      want.cover_style = nc.style;
      coverNote = `${nc.style} cover`;
    } else coverNote = 'cover skipped (no --canvas)';
  } else if (j.newThumbnail) {
    coverNote = `newThumbnail ${j.newThumbnail} has no NEW_COVERS entry: skipped`;
  }

  const updates = {};
  for (const [k, v] of Object.entries(want)) {
    if (!(k in old) || !isDeepStrictEqual(old[k], v)) updates[k] = v;
  }
  const body = (j.description || []).map((p) => String(p).trim()).filter(Boolean).join('\n\n');
  const bodyChanged = body !== project.body;
  report.push({
    slug,
    json: j.slug,
    changes: [
      ...Object.keys(updates).map((k) => (k === 'images' ? `images ${(old.images || []).length}→${images.length}`
        : k === 'title' ? `title "${old.title}"→"${want.title}"`
          : ['years', 'tags', 'role', 'client', 'order', 'parent', 'published', 'hover_image', 'cover_style']
            .includes(k) ? `${k} ${JSON.stringify(old[k])}→${JSON.stringify(want[k])}` : k)),
      ...(bodyChanged ? [`body ${project.body ? (body ? 'changed' : 'REMOVED') : 'added'}`] : []),
      ...(coverNote ? [coverNote] : []),
    ],
  });
  project.updates = updates;
  project.body = body;
  project.next = Object.keys(updates).length || bodyChanged
    ? rewrite(project.raw, updates, bodyChanged ? body : undefined) : project.raw;
}

for (const p of projects) {
  if (matched.has(p.slug)) continue;
  const changed = p.data.published !== false;
  p.updates = { published: false };
  p.body = undefined;
  p.next = changed ? rewrite(p.raw, p.updates) : p.raw;
  report.push({ slug: p.slug, json: '—', changes: [changed ? 'published true→false (not in site-data.json)' : 'not in site-data.json'] });
}

// Check every source before writing anything.
const missing = copies.filter(([from]) => !fs.existsSync(from)).map(([from]) => from);
if (missing.length) {
  console.error(`missing source files:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
// Every rewritten file must parse to what was intended.
for (const p of projects) {
  if (p.next === p.raw) continue;
  const parsed = matter(p.next, {});
  const expect = { ...p.data, ...p.updates };
  for (const [k, v] of Object.entries(expect)) {
    if (!isDeepStrictEqual(parsed.data[k], v)) throw new Error(`${p.slug}: ${k} does not read back as written`);
  }
  if (p.body !== undefined && parsed.content.trim() !== p.body) throw new Error(`${p.slug}: body does not read back`);
}

for (const r of report) console.log(`${r.slug.padEnd(44)} ${r.json.padEnd(24)} ${r.changes.join('; ') || 'unchanged'}`);
if (unmatched.length) console.log(`\nnot matched to a content file: ${unmatched.join(', ')}`);

let copied = 0;
let same = 0;
for (const [from, to] of copies) {
  if (fs.existsSync(to) && fs.readFileSync(to).equals(fs.readFileSync(from))) { same++; continue; }
  copied++;
  if (!DRY) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}
let written = 0;
for (const p of projects) {
  if (p.next === p.raw) continue;
  written++;
  if (!DRY) fs.writeFileSync(p.file, p.next);
}
console.log(`\n${DRY ? 'would write' : 'wrote'} ${written} file(s); ${DRY ? 'would copy' : 'copied'} ${copied} image(s), ${same} already identical`);
if (unmatched.length) process.exitCode = 1;
