/**
 * The data layer: content/ → flat, sorted, template-ready data. build.js and
 * server.js both call loadContent(), so the dev server and the built site
 * render from the same shapes. Templates never reach into raw front matter.
 *
 * Pages CMS drops keys that are null, empty or [] when it saves, so every
 * field is defaulted here. Image values may be a full public path
 * (/images/projects/x/a.jpg, what the CMS writes), a path under images/, or a
 * bare file name (resolved under images/projects/<slug>/). `images` entries
 * may be { image, alt, caption } objects or bare strings; a caption is one line
 * of Markdown.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { markdown, markdownInline, markdownText } from './markdown.js';

// Grid cells take the 600px file; a project page shows one photo at a time, as large as fits
// (components/project-slides.css).

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
            // The line at the top of the home page: Markdown, its link the name that opens Info.
            intro: markdownInline(str(index.data.intro)),
            description: markdownText(str(index.data.intro)),
        },
        info: { title: str(info.data.title) || 'Info', body: markdown(info.content) },
        projects,
        // What the index component needs, and nothing more: it rides on the page as JSON.
        indexProjects: projects.map(lean),
        tags,
        coversCss: coversCss(projects, config),
        slidesCss: slidesCss(projects),
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
        images: list(data.images).map(entry => (typeof entry === 'string'
            ? { image: str(entry), alt: '', caption: '' }
            : { image: str(entry?.image), alt: str(entry?.alt), caption: str(entry?.caption) })).filter(e => e.image),
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
    const cover = pic(p.cover, '', true);
    const slides = p.images
        .map(({ image, alt, caption }) => ({ pic: pic(image, alt || p.title), caption: markdownInline(caption) }))
        .filter(s => s.pic)
        .map(s => slide(s.pic, s.caption));
    return {
        slug: p.slug,
        title: p.title,
        years: p.years,
        tags: p.tags,
        role: p.role.join(', '),
        client: p.client,
        child: Boolean(p.parent),
        parent: p.parent,
        href: `/projects/${p.slug}/`,
        body: markdown(p.body),
        cover,
        slides,
        photoLinks: p.photoLinks,
    };
}

const link = (p) => ({ title: p.title, href: p.href });

// The fields the index component reads; the cover at grid size only.
function lean(p) {
    const c = p.cover;
    return {
        slug: p.slug,
        title: p.title,
        years: p.years,
        tags: p.tags,
        child: p.child,
        href: p.href,
        cover: c ? { src: c.small, webp: c.smallWebp, width: c.width, height: c.height } : null,
    };
}

// One photo of a project page, as the project-slides component prints it; `caption` is HTML.
function slide(g, caption) {
    const sizes = slideSizes(g);
    return { src: g.src, srcset: g.srcset, webp: g.webp, sizes, width: g.width, height: g.height, alt: g.alt, caption };
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

const aspect = (pic) => (pic?.width && pic?.height ? Math.round((pic.width / pic.height) * 10000) / 10000 : null);

// A slide is as large as fits its frame's room (components/project-slides.css: the width left
// between the arrows, the height left between the header and the caption), less the 6px frame.
function slideSizes(g) {
    const a = aspect(g) ?? 1.5;
    const tall = `calc((100vh - 154px) * ${a})`;
    return `(max-width: 600px) min(calc(100vw - 100px), ${tall}), min(calc(100vw - 161px), ${tall})`;
}

// --- Generated stylesheets: proportions never go inline. Each framed box takes its image's
// own proportions (--a), so no photo is ever cropped and the frame fits it exactly.

/** client/covers.css: the tag colour, and one rule per grid cell (components/project-index.css). */
export function coversCss(projects, config) {
    const rules = [`:root{--tag:${config.TAG_COLOR}}`];
    for (const p of projects) {
        const a = aspect(p.cover);
        if (a) rules.push(`project-index #cell-${p.slug}{--a:${a}}`);
    }
    return rules.join('\n') + '\n';
}

/** client/slides.css: one rule per project photo (components/project-slides.css). */
export function slidesCss(projects) {
    const rules = [];
    for (const p of projects) {
        p.slides.forEach((s, i) => {
            const a = aspect(s);
            if (a) rules.push(`#slides-${p.slug} .slide:nth-child(${i + 1}){--a:${a}}`);
        });
    }
    return rules.join('\n') + '\n';
}
