/**
 * The data layer: content/ → flat, sorted, template-ready data. build.js and
 * server.js both call loadContent(), so the dev server and the built site
 * render from the same shapes. Templates never reach into raw front matter.
 *
 * Pages CMS drops keys that are null, empty or [] when it saves, so every
 * field is defaulted here. Image values may be a full public path
 * (/images/projects/x/a.jpg, what the CMS writes), a path under images/, or a
 * bare file name (resolved under images/projects/<slug>/). `images` entries
 * may be { image, alt } objects or bare strings.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { markdown, markdownInline } from './markdown.js';

const STYLES = ['polaroid', 'polaroid-tall', 'fill', 'small', 'pair', 'none'];
// Grid cells take the 600px file; the strip is this tall (CSS: min(560px, 70vh)).
const STRIP_HEIGHT = 560;
const STRIP_VH = 70;

/**
 * @param {{ root: string, images: Map<string, object>, config: object, log?: Function }} options
 */
export function loadContent({ root, images, config, log = () => {} }) {
    const warn = (msg) => log(`content: ${msg}`);
    const index = readFront(join(root, 'content/site/index.md'));
    const info = readFront(join(root, 'content/site/info.md'));

    const seen = new Set();
    const raw = readdirSync(join(root, 'content/projects'))
        .filter(name => name.endsWith('.md') && !name.startsWith('.'))
        .sort()
        .map(name => normalize(readFront(join(root, 'content/projects', name)), name, warn))
        .filter(p => {
            if (seen.has(p.slug)) { warn(`${p.slug}: another file already uses this slug; ignoring the later file`); return false; }
            seen.add(p.slug);
            return true;
        });

    const projects = order(raw.filter(p => p.published), warn)
        .map(p => shape(p, { images, warn }));
    projects.forEach((p, i) => {
        p.prev = i > 0 ? link(projects[i - 1]) : null;
        p.next = i < projects.length - 1 ? link(projects[i + 1]) : null;
    });

    const tags = [...new Set(projects.flatMap(p => p.tags))].sort((a, b) => a.localeCompare(b));
    return {
        site: {
            intro: str(index.data.intro),
            contactLine: markdownInline(str(index.data.contact_line)),
            email: str(index.data.email),
        },
        info: { title: str(info.data.title) || 'Info', body: markdown(info.content) },
        projects,
        // What the index component needs, and nothing more: it rides on the page as JSON.
        indexProjects: projects.map(lean),
        tags,
        coversCss: coversCss(projects, config),
    };
}

function readFront(path) {
    // gray-matter caches by input string unless options are passed; {} keeps edits live in dev.
    return matter(readFileSync(path, 'utf8'), {});
}

// js-yaml reads date-like text (2024-05-01) as a Date; the site wants the text as written.
const str = (v) => (v === null || v === undefined ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v)).trim();
const list = (v) => (Array.isArray(v) ? v : v === null || v === undefined || v === '' ? [] : [v]);
const num = (v, fallback) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : fallback);

// Front matter with every field present and typed.
function normalize({ data, content }, file, warn) {
    const slug = str(data.slug) || file.replace(/\.md$/, '');
    let style = str(data.cover_style) || 'polaroid';
    if (!STYLES.includes(style)) { warn(`${slug}: unknown cover_style "${style}", using polaroid`); style = 'polaroid'; }
    const focus = list(data.cover_focus).map(n => clamp(num(n, 50), 0, 100));
    return {
        slug,
        title: str(data.title) || slug,
        order: num(data.order, Infinity),
        years: str(data.years),
        yearStart: num(data.year_start, null),
        yearEnd: num(data.year_end, null),
        tags: list(data.tags).map(str).filter(Boolean),
        role: list(data.role).map(str).filter(Boolean),
        client: str(data.client),
        parent: str(data.parent) || null,
        published: data.published === true,
        cover: str(data.cover),
        coverStyle: style,
        coverFocus: [focus[0] ?? 50, focus[1] ?? 50],
        coverZoom: Math.max(1, num(data.cover_zoom, 1)),
        images: list(data.images).map(entry => (typeof entry === 'string'
            ? { image: str(entry), alt: '' }
            : { image: str(entry?.image), alt: str(entry?.alt) })).filter(e => e.image),
        hoverImage: str(data.hover_image),
        photoLinks: list(data.photo_links)
            .map(l => ({ label: str(l?.label) || str(l?.url), url: str(l?.url) }))
            .filter(l => /^https?:\/\//i.test(l.url)),
        body: content ?? '',
    };
}

// Top-level projects by `order`; each followed directly by its children, by `order`.
// A child whose parent is missing or unpublished stands on its own, with a warning.
function order(published, warn) {
    const bySlug = new Map(published.map(p => [p.slug, p]));
    const byOrder = (a, b) => a.order - b.order || a.title.localeCompare(b.title);
    const children = new Map();
    const top = [];
    // Only one level of nesting: a child's parent must itself be top-level. A grandchild,
    // a project that is its own parent and every member of a cycle stand on their own.
    const topLevel = (q) => !q.parent || !bySlug.has(q.parent) || q.parent === q.slug;
    for (const p of published) {
        const parent = p.parent ? bySlug.get(p.parent) : null;
        if (parent && parent !== p && topLevel(parent)) {
            if (!children.has(p.parent)) children.set(p.parent, []);
            children.get(p.parent).push(p);
        } else {
            if (p.parent) warn(`${p.slug}: parent "${p.parent}" is not a published top-level project; listed on its own`);
            p.parent = null;
            top.push(p);
        }
    }
    const out = [];
    for (const p of top.sort(byOrder)) {
        out.push(p);
        for (const c of (children.get(p.slug) ?? []).sort(byOrder)) out.push(c);
    }
    return out;
}

function shape(p, { images, warn }) {
    const pic = (value, alt = '', placeholder = false) => picture(value, p.slug, alt, images, warn, placeholder);
    // Only the grid needs an image where one is missing; elsewhere a missing photo is left out.
    const cover = p.coverStyle === 'none' ? null : pic(p.cover, '', true);
    const gallery = p.images.map(({ image, alt }) => pic(image, alt || p.title)).filter(Boolean);
    // pair: the cover on the left, the first of `images` on the right.
    const pairWith = p.coverStyle === 'pair' ? (gallery.find(g => g.key !== cover?.key) ?? null) : null;
    const style = !cover ? 'none' : p.coverStyle === 'pair' && !pairWith ? 'polaroid' : p.coverStyle;
    return {
        slug: p.slug,
        title: p.title,
        years: p.years,
        tags: p.tags,
        tagLinks: p.tags.map(t => ({ label: t, href: `/?filter=${encodeURIComponent(t)}` })),
        role: p.role.join(', '),
        client: p.client,
        child: Boolean(p.parent),
        parent: p.parent,
        href: `/projects/${p.slug}/`,
        body: markdown(p.body),
        style,
        cover,
        pair: pairWith,
        hover: cover && p.hoverImage ? pic(p.hoverImage) : null,
        focus: p.coverFocus,
        zoom: p.coverZoom,
        images: gallery.map(g => ({ ...g, sizes: stripSizes(g) })),
        photoLinks: p.photoLinks,
    };
}

const link = (p) => ({ title: p.title, href: p.href });

// The fields the index component reads (BRIEF §5.1); images at grid size only.
function lean(p) {
    const grid = (g) => (g ? { src: g.small, webp: g.smallWebp, width: g.width, height: g.height } : null);
    return {
        slug: p.slug,
        title: p.title,
        years: p.years,
        tags: p.tags,
        child: p.child,
        href: p.href,
        style: p.style,
        cover: grid(p.cover),
        pair: grid(p.pair),
        hover: grid(p.hover),
    };
}

// An image value → { key, src, srcset, webp, small, smallWebp, width, height, alt }, or null.
function picture(value, slug, alt, images, warn, placeholder) {
    if (!value) return null;
    const rel = relPath(value, slug);
    let info = images.get(rel);
    if (!info) {
        warn(`${slug}: image not found: ${value}`);
        info = placeholder ? images.get('placeholder.png') : null;
        if (!info) return null;
    }
    if (info.type !== 'raster' || !info.variants?.length) {
        const src = encodeURI(info.src);
        return { key: rel, src, srcset: '', webp: '', small: src, smallWebp: '', width: info.width ?? '', height: info.height ?? '', alt };
    }
    // Encoded, so a file name with a space or a comma can't break a srcset.
    const v = info.variants.map(x => ({ width: x.width, jpg: encodeURI(x.jpg), webp: encodeURI(x.webp) }));
    const smallest = v[0];
    return {
        key: rel,
        src: v[v.length - 1].jpg,
        srcset: v.map(x => `${x.jpg} ${x.width}w`).join(', '),
        webp: v.map(x => `${x.webp} ${x.width}w`).join(', '),
        small: smallest.jpg,
        smallWebp: smallest.webp,
        width: info.width,
        height: info.height,
        alt,
    };
}

function relPath(value, slug) {
    let v = value.trim().replace(/\\/g, '/');
    try { v = decodeURIComponent(v); } catch { /* not encoded */ }
    if (v.startsWith('/images/')) return v.slice('/images/'.length);
    if (v.startsWith('images/')) return v.slice('images/'.length);
    if (!v.includes('/')) return `projects/${slug}/${v}`;
    return v.replace(/^\/+/, '');
}

// The strip shows each image at the strip's height, so its width is height × aspect.
function stripSizes(g) {
    const aspect = g.width && g.height ? g.width / g.height : 1.5;
    return `(min-height: ${Math.round(STRIP_HEIGHT / (STRIP_VH / 100))}px) ${Math.round(STRIP_HEIGHT * aspect)}px, ${Math.round(STRIP_VH * aspect)}vh`;
}

// --- Cover placement: one rule per cover, in a generated stylesheet, never inline.
// Each box takes its image's own proportions (--a; --b for a pair's right image), so no
// thumbnail is ever cropped; the style sets its size (components/project-index.css).

const JITTER = { dx: [-1.35, 1.35], dy: [-2.5, 0] };

/** The polaroid frame's offset from centre for a slug, in % of the cell: deterministic. */
export function jitter(slug) {
    let h = 0x811c9dc5;
    for (const ch of slug) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    const a = (h & 0xffff) / 0xffff;
    const b = (h >>> 16) / 0xffff;
    const at = ([lo, hi], f) => Math.round((lo + f * (hi - lo)) * 100) / 100;
    return { dx: at(JITTER.dx, a), dy: at(JITTER.dy, b) };
}

const aspect = (pic) => (pic?.width && pic?.height ? Math.round((pic.width / pic.height) * 10000) / 10000 : null);

export function coversCss(projects, config) {
    const rules = [`:root{--tag:${config.TAG_COLOR}}`];
    for (const p of projects) {
        if (p.style === 'none') continue;
        const decl = [];
        const a = aspect(p.cover);
        if (a) decl.push(`--a:${a}`);
        const b = p.style === 'pair' ? aspect(p.pair) : null;
        if (b) decl.push(`--b:${b}`);
        if (config.FRAME_JITTER && p.style === 'polaroid') {
            const { dx, dy } = jitter(p.slug);
            // The cell is 331.4 × 191.6, so a % of its height is that × 0.578 in container-width units.
            decl.push(`--dx:${dx}cqw`, `--dy:${Math.round(dy * (191.6 / 331.4) * 100) / 100}cqw`);
        }
        if (decl.length) rules.push(`:is(project-index, thumbnail-tuner) #cell-${p.slug}{${decl.join(';')}}`);
    }
    return rules.join('\n') + '\n';
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

