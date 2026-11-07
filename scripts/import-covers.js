#!/usr/bin/env node
// One-time cover migration from the approved Index canvas export.
//
//   node scripts/import-covers.js <Index.dc.html> <blob-folder> [--dry-run]
//
// Reads the first <section aria-label="Project images"> of the canvas export, maps each grid
// cell to content/projects/<slug>.md by its aria-label (= project title), copies the cell's
// image blob(s) from <blob-folder>/<id>.jpg to images/projects/<slug>/<slug>-cover.jpg (a pair's
// second image to <slug>-02.jpg, prepended to `images`), and writes cover, cover_style,
// cover_focus and cover_zoom. No other field and no body is touched: the front matter is edited
// key by key in place, in the same YAML style scripts/import-projects.py (PyYAML) writes.
//
// The geometry inverts the site's cover model (cell 331.4 × 191.6 px; a box per style; inside it
// `object-fit: cover; object-position: X% Y%; scale: Z` with transform-origin at the same point).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS = path.join(ROOT, 'content/projects');
const IMAGES = path.join(ROOT, 'images/projects');

const CELL_W = 331.4;
const CELL_H = 191.6;
const FRAME = 6; // polaroid border, px
const COVER_KEYS = ['cover', 'cover_style', 'cover_focus', 'cover_zoom'];
// canonical key order, used only to place a key the file lacks (the CMS drops empty keys)
const KEY_ORDER = ['title', 'slug', 'order', 'years', 'year_start', 'year_end', 'tags', 'role',
  'client', 'parent', 'published', 'cover', 'cover_style', 'cover_focus', 'cover_zoom', 'images',
  'hover_image', 'photo_links'];

// Site boxes in % of the cell. `pos: 'own'` = the jittered polaroid: the site computes left/top
// from the slug, so the image is measured against the canvas's own box, not a fixed position.
const STYLES = {
  polaroid:        { w: 80.18, h: 81.42, framed: true, pos: 'own' },
  'polaroid-tall': { w: 49.28, h: 85.23, framed: true, pos: 'centre' },
  fill:            { w: 100,   h: 100,   framed: false, left: 0, top: 0 },
  small:           { w: 34.31, h: 84.81, framed: false, pos: 'centre' },
  pairA:           { w: 40.34, h: 100,   framed: false, left: 0, top: 0 },
  pairB:           { w: 61.8,  h: 100,   framed: false, left: 38.2, top: 0 },
};

// ---------------------------------------------------------------------------------------------
// CLI

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const [htmlPath, blobDir] = argv.filter((a) => !a.startsWith('--'));
if (!htmlPath || !blobDir) {
  console.error('usage: node scripts/import-covers.js <Index.dc.html> <blob-folder> [--dry-run]');
  process.exit(2);
}

// ---------------------------------------------------------------------------------------------
// Parsing the canvas export

function decodeEntities(s) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘',
    rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…' };
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return named[e.toLowerCase()] ?? m;
  });
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'));
  return m ? decodeEntities(m[1]) : null;
};

function styleOf(tag) {
  const out = {};
  for (const part of (attr(tag, 'style') || '').split(';')) {
    const i = part.indexOf(':');
    if (i > 0) out[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
  }
  return out;
}
const pct = (v) => (v == null ? null : parseFloat(v));

function parseCells(html) {
  const start = html.search(/<section[^>]*aria-label="Project images"/i);
  if (start < 0) throw new Error('no <section aria-label="Project images"> in the export');
  const end = html.indexOf('</section>', start);
  const section = html.slice(start, end);
  const marker = /<div[^>]*aspect-ratio:\s*331\.4\s*\/\s*191\.6[^>]*>/gi;
  const starts = [];
  let m;
  while ((m = marker.exec(section))) starts.push({ index: m.index, open: m[0] });
  const cells = [];
  starts.forEach((s, n) => {
    const chunk = section.slice(s.index + s.open.length, n + 1 < starts.length ? starts[n + 1].index : section.length);
    const a = chunk.match(/<a\b[^>]*>/i);
    const cell = { n: n + 1, label: a ? attr(a[0], 'aria-label') : null, href: a ? attr(a[0], 'href') : null, images: [] };
    if (a) {
      // walk tags in order, tracking the innermost open positioned box div
      const tagRe = /<(\/?)(div|img)\b[^>]*>/gi;
      const stack = [];
      let t;
      const inner = chunk.slice(chunk.indexOf(a[0]) + a[0].length);
      while ((t = tagRe.exec(inner))) {
        const [tag, close, name] = t;
        if (name.toLowerCase() === 'div') {
          if (close) stack.pop();
          else stack.push(styleOf(tag));
          continue;
        }
        const st = styleOf(tag);
        const src = attr(tag, 'src') || '';
        const box = stack.length ? stack[stack.length - 1] : null;
        cell.images.push({
          id: (src.match(/\/_blob\/([0-9a-f]+)/i) || [])[1] || null,
          alt: attr(tag, 'alt') || '',
          img: { l: pct(st.left), t: pct(st.top), w: pct(st.width), h: pct(st.height) },
          box: box && {
            l: pct(box.left), t: pct(box.top), w: pct(box.width), h: pct(box.height),
            framed: /6px\s+solid/i.test(box.border || ''),
          },
        });
      }
    }
    cells.push(cell);
  });
  return cells;
}

// ---------------------------------------------------------------------------------------------
// Geometry

const near = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;

// Content rect of a site box, in cell px. `own` = a canvas box rect to anchor to (for jitter).
function siteBox(styleName, own) {
  const s = STYLES[styleName];
  const w = (s.w / 100) * CELL_W;
  const h = (s.h / 100) * CELL_H;
  let x;
  let y;
  if (s.pos === 'own' || (own && s.pos === 'centre' && own.sameSize)) {
    // measured against the canvas's own box of the same size; position differences are reported
    x = own ? own.x : ((100 - s.w) / 200) * CELL_W;
    y = own ? own.y : ((100 - s.h) / 200) * CELL_H;
  } else if (s.pos === 'centre') {
    x = ((100 - s.w) / 200) * CELL_W;
    y = ((100 - s.h) / 200) * CELL_H;
  } else {
    x = (s.left / 100) * CELL_W;
    y = (s.top / 100) * CELL_H;
  }
  const b = s.framed ? FRAME : 0;
  return { x: x + b, y: y + b, w: w - 2 * b, h: h - 2 * b };
}

// The canvas image's rendered rect in cell px, and its box's content rect (or the cell).
function canvasRects(image) {
  let bx = 0;
  let by = 0;
  let bw = CELL_W;
  let bh = CELL_H;
  if (image.box) {
    const b = image.box.framed ? FRAME : 0;
    bx = (image.box.l / 100) * CELL_W + b;
    by = (image.box.t / 100) * CELL_H + b;
    bw = (image.box.w / 100) * CELL_W - 2 * b;
    bh = (image.box.h / 100) * CELL_H - 2 * b;
  }
  const { l, t, w, h } = image.img;
  return {
    box: { x: bx, y: by, w: bw, h: bh },
    img: { x: bx + (l / 100) * bw, y: by + (t / 100) * bh, w: (w / 100) * bw, h: (h / 100) * bh },
  };
}

// Invert object-fit: cover + object-position + scale for one image in one site box.
function invert(imgRect, box, iw, ih) {
  const s = Math.max(box.w / iw, box.h / ih);
  const cw = iw * s;
  const ch = ih * s;
  const zw = imgRect.w / cw;
  const zh = imgRect.h / ch;
  const Z = Math.max(1, (zw + zh) / 2);
  const L = imgRect.x - box.x;
  const T = imgRect.y - box.y;
  const axis = (off, bsize, csize) => {
    const d = bsize - Z * csize;
    if (Math.abs(d) < 0.5) return 50;
    return Math.min(100, Math.max(0, (100 * off) / d));
  };
  const X = axis(L, box.w, cw);
  const Y = axis(T, box.h, ch);
  return { focus: [Math.round(X), Math.round(Y)], zoom: Math.round(Z * 100) / 100, zw, zh, rawX: X, rawY: Y };
}

// For a cell whose canvas layout matches no site style (a whole poster floating in the cell),
// the pixel inversion above keeps the canvas's pixel scale and so crops a fully visible poster
// to ~60%. Instead match what is visible: the zoom makes the visible share of the image (by area)
// as close as Z >= 1 allows to the canvas's, and the focus puts the visible region's centre where
// the canvas's visible centre is.
function invertVisible(imgRect, box, iw, ih) {
  const u0 = Math.max(0, -imgRect.x / imgRect.w);
  const u1 = Math.min(1, (CELL_W - imgRect.x) / imgRect.w);
  const v0 = Math.max(0, -imgRect.y / imgRect.h);
  const v1 = Math.min(1, (CELL_H - imgRect.y) / imgRect.h);
  const canvasArea = (u1 - u0) * (v1 - v0);
  const s = Math.max(box.w / iw, box.h / ih);
  const fw1 = box.w / (iw * s);
  const fh1 = box.h / (ih * s);
  const Z = Math.max(1, Math.sqrt((fw1 * fh1) / canvasArea));
  const fw = fw1 / Z;
  const fh = fh1 / Z;
  const axis = (c, f) => (1 - f < 0.005 ? 50 : Math.min(100, Math.max(0, (100 * (c - f / 2)) / (1 - f))));
  const X = axis((u0 + u1) / 2, fw);
  const Y = axis((v0 + v1) / 2, fh);
  return {
    focus: [Math.round(X), Math.round(Y)], zoom: Math.round(Z * 100) / 100,
    canvasShown: [u1 - u0, v1 - v0], siteShown: [fw, fh],
  };
}

function detect(cell) {
  const imgs = cell.images;
  if (imgs.length >= 2) return { style: 'pair', exact: imgs.length === 2 };
  const im = imgs[0];
  if (im.box && im.box.framed) {
    if (near(im.box.w, STYLES.polaroid.w)) return { style: 'polaroid', exact: true };
    if (near(im.box.w, STYLES['polaroid-tall'].w)) return { style: 'polaroid-tall', exact: true };
    return { style: im.box.w > 65 ? 'polaroid' : 'polaroid-tall', exact: false, why: `framed box ${im.box.w}% wide` };
  }
  if (im.box) {
    if (near(im.box.w, STYLES.small.w)) return { style: 'small', exact: true };
    return { style: im.box.w > 70 ? 'fill' : 'small', exact: false, why: `bare box ${im.box.w}% × ${im.box.h}%` };
  }
  // bare <img> in the cell: fill only if it covers the cell (within 1%)
  const { l, t, w, h } = im.img;
  const covers = l <= 1 && t <= 1 && l + w >= 99 && t + h >= 99;
  if (covers) return { style: 'fill', exact: true };
  return { style: 'small', exact: false, why: `not full-bleed: img left ${l}% top ${t}% ${w}% × ${h}% of the cell` };
}

// ---------------------------------------------------------------------------------------------
// Front matter editing (in place, PyYAML-compatible style)

function scalar(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const s = String(v);
  let plain = s !== '' && s.trim() === s && !/[:#\n]/.test(s) && !/^[-?\[\]{}&*!|>'"%@`,]/.test(s);
  if (plain) {
    try { plain = (yaml.safeLoad || yaml.load)(s) === s; } catch { plain = false; }
  }
  return plain ? s : JSON.stringify(s);
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
  const lines = fmText.split('\n');
  const blocks = [];
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][\w-]*):(\s|$)/);
    if (m) blocks.push({ key: m[1], lines: [line] });
    else if (blocks.length) blocks[blocks.length - 1].lines.push(line);
    else blocks.push({ key: null, lines: [line] });
  }
  return blocks;
}

function setKeys(raw, updates) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!m) throw new Error('no front matter');
  const blocks = keyBlocks(m[1]);
  for (const [key, value] of Object.entries(updates)) {
    const text = block(key, value);
    const found = blocks.find((b) => b.key === key);
    if (found) {
      found.lines = text.split('\n');
      continue;
    }
    // insert after the nearest preceding canonical key present, else at the end
    const want = KEY_ORDER.indexOf(key);
    let at = blocks.length;
    for (let i = want - 1; i >= 0 && at === blocks.length; i--) {
      const idx = blocks.findIndex((b) => b.key === KEY_ORDER[i]);
      if (idx >= 0) at = idx + 1;
    }
    blocks.splice(at, 0, { key, lines: text.split('\n') });
  }
  const fm = blocks.map((b) => b.lines.join('\n')).join('\n');
  return `---\n${fm}\n---${m[2]}${raw.slice(m[0].length)}`;
}

// ---------------------------------------------------------------------------------------------
// Matching

const norm = (s) => decodeEntities(String(s || ''))
  .normalize('NFKC')
  .replace(/[‘’ʼ´`]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

function loadProjects() {
  return fs.readdirSync(PROJECTS).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const file = path.join(PROJECTS, f);
    const raw = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(raw, {});
    return { file, raw, data, content, slug: data.slug || f.replace(/\.md$/, '') };
  });
}

// ---------------------------------------------------------------------------------------------
// Main

const html = fs.readFileSync(htmlPath, 'utf8');
const cells = parseCells(html);
const projects = loadProjects();
const byTitle = new Map(projects.map((p) => [norm(p.data.title), p]));

const rows = [];
const unmatched = [];
const approximations = [];
const dims = new Map();
const touched = new Set();

async function dimsOf(id) {
  if (!dims.has(id)) {
    const file = path.join(blobDir, `${id}.jpg`);
    const meta = await sharp(file).metadata();
    if (meta.format !== 'jpeg') throw new Error(`${file} is ${meta.format}, not jpeg`);
    dims.set(id, { file, w: meta.width, h: meta.height });
  }
  return dims.get(id);
}

const fmtNum = (n) => (Math.round(n * 100) / 100).toString();

for (const cell of cells) {
  if (!cell.label) {
    rows.push({ cell: cell.n, label: '(empty cell)', slug: '', style: '', focus: '', zoom: '', notes: '' });
    continue;
  }
  const project = byTitle.get(norm(cell.label));
  if (!project) {
    unmatched.push(cell);
    rows.push({ cell: cell.n, label: cell.label, slug: 'UNMATCHED', style: '', focus: '', zoom: '', notes: '' });
    continue;
  }
  const { slug } = project;
  const det = detect(cell);
  const notes = [];
  if (!det.exact) {
    notes.push(`APPROX ${det.style} (${det.why})`);
  }

  const results = [];
  const plan = det.style === 'pair'
    ? [['pairA', cell.images[0]], ['pairB', cell.images[1]]]
    : [[det.style, cell.images[0]]];
  for (const [boxStyle, image] of plan) {
    const d = await dimsOf(image.id);
    const cr = canvasRects(image);
    const s = STYLES[boxStyle];
    const sameSize = image.box && near(image.box.w, s.w) && near(image.box.h, s.h, 1);
    let own = null;
    if (image.box && (s.pos === 'own' || (s.pos === 'centre' && sameSize))) {
      const b = image.box.framed ? FRAME : 0;
      own = { x: cr.box.x - b, y: cr.box.y - b, sameSize };
    }
    // pair boxes: measure against the canvas's own box (it differs from the site's by < 1px)
    let box;
    if ((boxStyle === 'pairA' || boxStyle === 'pairB') && image.box) {
      const site = siteBox(boxStyle);
      box = { x: cr.box.x, y: cr.box.y, w: site.w, h: site.h };
      const dx = cr.box.x - site.x;
      const dy = cr.box.y - site.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || !near(image.box.h, s.h, 0.5)) {
        notes.push(`${boxStyle} canvas box ${image.box.l}%/${image.box.t}% ${image.box.w}%×${image.box.h}% vs site ${s.left}%/${s.top}% ${s.w}%×${s.h}%`);
      }
    } else {
      box = siteBox(boxStyle, own);
    }
    if (image.box && s.pos === 'centre' && sameSize) {
      const cl = (100 - s.w) / 2;
      const ct = (100 - s.h) / 2;
      if (Math.abs(image.box.l - cl) > 0.5 || Math.abs(image.box.t - ct) > 0.5) {
        notes.push(`canvas box at ${image.box.l}%/${image.box.t}%, site centres it at ${fmtNum(cl)}%/${fmtNum(ct)}%`);
      }
    }
    let inv = invert(cr.img, box, d.w, d.h);
    if (!det.exact) {
      const px = inv;
      inv = { ...invertVisible(cr.img, box, d.w, d.h), zw: 1, zh: 1, rawX: 50, rawY: 50 };
      const pc = (a) => a.map((x) => `${Math.round(x * 100)}%`).join('×');
      notes.push(`visible-area match: canvas shows ${pc(inv.canvasShown)} of the image, site ${pc(inv.siteShown)}`
        + ` (pixel inversion would give [${px.focus}] zoom ${px.zoom})`);
    }
    if (Math.abs(inv.zw - inv.zh) > 0.03) notes.push(`${boxStyle === det.style ? '' : boxStyle + ' '}canvas stretch w/h ratio ${fmtNum(inv.zw)}/${fmtNum(inv.zh)}`);
    if (inv.zw < 0.97 && inv.zh < 0.97) notes.push(`canvas image smaller than the box (${fmtNum(inv.zw)}×), zoom clamped to 1`);
    if (inv.rawX < -0.5 || inv.rawX > 100.5 || inv.rawY < -0.5 || inv.rawY > 100.5) {
      notes.push(`focus clamped from ${fmtNum(inv.rawX)}, ${fmtNum(inv.rawY)}`);
    }
    results.push({ boxStyle, image, d, inv });
  }

  const main = results[0];
  const coverPath = `/images/projects/${slug}/${slug}-cover.jpg`;
  const updates = {
    cover: coverPath,
    cover_style: det.style,
    cover_focus: main.inv.focus,
    cover_zoom: main.inv.zoom,
  };
  const copies = [[main.d.file, path.join(IMAGES, slug, `${slug}-cover.jpg`)]];
  if (det.style === 'pair') {
    const second = results[1];
    const p2 = `/images/projects/${slug}/${slug}-02.jpg`;
    copies.push([second.d.file, path.join(IMAGES, slug, `${slug}-02.jpg`)]);
    const images = Array.isArray(project.data.images) ? project.data.images : [];
    const has = images.some((x) => (typeof x === 'string' ? x : x && x.image) === p2);
    if (!has) updates.images = [{ image: p2, alt: second.image.alt }, ...images];
    notes.push(`B ${slug}-02.jpg focus [${second.inv.focus}] zoom ${second.inv.zoom} (site uses A's focus/zoom for both)`);
  }

  const next = setKeys(project.raw, updates);
  // guard: nothing but the cover keys (and images for a pair) changed, body byte-identical
  const parsed = matter(next, {});
  for (const k of new Set([...Object.keys(project.data), ...Object.keys(parsed.data)])) {
    if (k in updates) continue;
    if (JSON.stringify(project.data[k]) !== JSON.stringify(parsed.data[k])) throw new Error(`${slug}: ${k} would change`);
  }
  for (const [k, v] of Object.entries(updates)) {
    if (JSON.stringify(parsed.data[k]) !== JSON.stringify(v)) throw new Error(`${slug}: ${k} did not round-trip`);
  }
  if (parsed.content !== project.content) throw new Error(`${slug}: body would change`);
  if (Object.keys(parsed.data).filter((k) => k in project.data).join() !== Object.keys(project.data).join()) {
    throw new Error(`${slug}: key order would change`);
  }

  if (!DRY) {
    for (const [from, to] of copies) {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
    if (next !== project.raw) fs.writeFileSync(project.file, next);
  }
  project.data = parsed.data;
  touched.add(slug);
  if (!det.exact) approximations.push(slug);
  rows.push({
    cell: cell.n,
    label: cell.label,
    slug,
    style: det.style,
    focus: `[${main.inv.focus.join(', ')}]`,
    zoom: String(main.inv.zoom),
    notes: [`${main.d.w}×${main.d.h}`, ...notes].join('; '),
  });
}

// ---------------------------------------------------------------------------------------------
// Report

const cols = ['cell', 'slug', 'style', 'focus', 'zoom', 'notes'];
const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c === 'slug' && !r.slug ? 'label' : c]).length)));
const line = (r) => cols.map((c, i) => String(c === 'slug' && !r.slug ? r.label : r[c]).padEnd(c === 'notes' ? 0 : widths[i])).join('  ');
console.log(DRY ? '[dry run: nothing written]\n' : '');
console.log(line(Object.fromEntries(cols.map((c) => [c, c]))));
for (const r of rows) console.log(line(r));

console.log(`\nunmatched cells: ${unmatched.length ? unmatched.map((c) => `#${c.n} "${c.label}"`).join(', ') : 'none'}`);
const missing = projects.filter((p) => p.data.published !== false && !p.data.cover);
console.log(`published projects without a cover: ${missing.length ? missing.map((p) => p.slug).join(', ') : 'none'}`);
console.log(`approximated styles: ${approximations.length ? approximations.join(', ') : 'none'}`);
console.log(`${DRY ? 'would update' : 'updated'} ${touched.size} project files; ${dims.size} blobs read`);
