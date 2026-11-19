/**
 * The data layer: content/ → flat, sorted, template-ready data. build.js and
 * server.js both call loadContent(), so the dev server and the built site
 * render from the same shapes. Templates never reach into raw front matter.
 *
 * Pages CMS drops keys that are null, empty or [] when it saves, so every
 * field is defaulted here. Image values may be a full public path
 * (/images/projects/x/a.jpg, what the CMS writes), a path under images/, or a
 * bare file name (resolved under images/projects/<slug>/). `images` entries
 * may be { image, alt, caption, set } objects or bare strings; a caption is one
 * line of Markdown; `set` is the number of the group the photo is shown in (1
 * when it is left out), and a project page shows its sets one under the other.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { markdown, markdownInline, markdownText } from './markdown.js';

// Grid cells offer every size of the cover and say how wide the thumbnail is (coverSizes), so the
// browser takes the smallest file that is sharp enough; a project page shows each set of photos one
// photo at a time, as large as fits (components/project-slides.css).

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
    // The projects either side of each one, in the order the Index lists them (sub-items in
    // their place): what the two arrows of a project page's information lead to. The first
    // has no previous and the last no next; the fields are then ''.
    projects.forEach((p, i) => {
        const before = projects[i - 1];
        const after = projects[i + 1];
        p.prevSlug = before?.slug ?? '';
        p.prevTitle = before?.title ?? '';
        p.prevHref = before?.href ?? '';
        p.nextSlug = after?.slug ?? '';
        p.nextTitle = after?.title ?? '';
        p.nextHref = after?.href ?? '';
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
// A whole number from 1 (a photo's set), or null for anything else.
const whole = (v) => (Number.isInteger(num(v, null)) && num(v, null) >= 1 ? num(v, null) : null);

// The dates as the site prints them (the owner's format of 19 Nov 2026): a year loses its century
// and the first one takes an apostrophe, a range is an en dash with no spaces round it.
// 2026 → ’26, 2023 - 2026 → ’23–26, 2025, 2026 → ’25, 26, 2023 – → ’23–. The content keeps the
// years as typed, in full; text without a four-digit year (one typed short already) is printed as it is.
export function shortYears(value) {
    const typed = str(value);
    let first = true;
    return typed
        .replace(/(\b(?:19|20)\d\d\b)\s*[-–—]\s*/g, '$1–')
        .replace(/\s*[-–—]\s*(\b(?:19|20)\d\d\b)/g, '–$1')
        .replace(/\b(?:19|20)(\d\d)\b/g, (_, yy) => {
            const out = first ? `’${yy}` : yy;
            first = false;
            return out;
        });
}

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
        images: list(data.images).map((entry) => {
            if (typeof entry === 'string') return { image: str(entry), alt: '', caption: '', set: 1 };
            // Left out (the CMS drops an empty field), a photo is in set 1.
            const set = whole(entry?.set);
            if (set === null && str(entry?.set) !== '') warn(`${slug}: photo set "${str(entry?.set)}" is not a whole number from 1; shown in set 1`);
            return { image: str(entry?.image), alt: str(entry?.alt), caption: str(entry?.caption), set: set ?? 1 };
        }).filter(e => e.image),
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
    const photos = p.images
        .map(({ image, alt, caption, set }) => ({ pic: pic(image, alt || p.title), caption: markdownInline(caption), set }))
        .filter(s => s.pic);
    // The sets in ascending number order (the numbers need not be consecutive, nor the list
    // grouped); inside a set the photos keep their order in the list. A set is one
    // <project-slides>: its id is what client/slides.css hangs each photo's proportions on.
    const numbers = [...new Set(photos.map(s => s.set))].sort((a, b) => a - b);
    const sets = numbers.map((n, i) => ({
        id: `slides-${p.slug}-${i + 1}`,
        label: numbers.length > 1 ? `Photos of ${p.title}, set ${i + 1} of ${numbers.length}` : `Photos of ${p.title}`,
        slides: photos.filter(s => s.set === n).map(s => slide(s.pic, s.caption)),
    }));
    return {
        slug: p.slug,
        title: p.title,
        years: shortYears(p.years),
        tags: p.tags,
        role: p.role.join(', '),
        client: p.client,
        child: Boolean(p.parent),
        parent: p.parent,
        href: `/projects/${p.slug}/`,
        body: markdown(p.body),
        cover,
        sets,
        // The page loads its scripts only if some set has a photo to move to.
        scripted: sets.some(s => s.slides.length > 1),
        photoLinks: p.photoLinks,
    };
}

// The fields the index component reads; the cover at grid sizes.
function lean(p) {
    const c = p.cover;
    return {
        slug: p.slug,
        title: p.title,
        years: shortYears(p.years),
        tags: p.tags,
        child: p.child,
        href: p.href,
        cover: c ? { src: c.small, srcset: c.srcset, webp: c.webp || c.smallWebp, sizes: coverSizes(c), width: c.width, height: c.height } : null,
    };
}

// A thumbnail is as large as fits 91% of its cell's width and 49.9733% of that width in height
// (86.5% of a 341.2 : 197.12 cell): the picture itself, which has had no border since 19 Nov 2026
// (components/project-index.css); a cell is a quarter of the page wide, and the whole page below
// 720px, where the grid is one column.
function coverSizes(c) {
    const a = aspect(c) ?? 1.5;
    const fit = (cell) => `min(${Math.round(cell * 91) / 100}vw, calc(${Math.round(cell * 49.9733) / 100}vw * ${a}))`;
    return `(max-width: 719px) ${fit(100)}, ${fit(25)}`;
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

/** An image value as written in content → its path under images/ (the four spellings above). */
export function relPath(value, slug) {
    let v = value.trim().replace(/\\/g, '/');
    try { v = decodeURIComponent(v); } catch { /* not encoded */ }
    if (v.startsWith('/images/')) return v.slice('/images/'.length);
    if (v.startsWith('images/')) return v.slice('images/'.length);
    if (!v.includes('/')) return `projects/${slug}/${v}`;
    return v.replace(/^\/+/, '');
}

const aspect = (pic) => (pic?.width && pic?.height ? Math.round((pic.width / pic.height) * 10000) / 10000 : null);

// A slide is as large as fits its room (components/project-slides.css): the width left between
// the arrows (the page less 2 × 44px of chevron targets below 600px, and less 2 × 74.25px above,
// where each side also has a 14.25px gap and a 16px edge) and the height left between the 79px
// header and the caption's 63px. Every set has the same room: each is one window tall under the header.
function slideSizes(g) {
    const a = aspect(g) ?? 1.5;
    const tall = `calc((100vh - 142px) * ${a})`;
    return `(max-width: 600px) min(calc(100vw - 88px), ${tall}), min(calc(100vw - 148.5px), ${tall})`;
}

// --- Generated stylesheets: proportions never go inline. Each picture's box (`.box` in the grid,
// `.frame` on a project page: names from when it had a border) takes its image's own proportions
// (--a), so no photo is ever cropped and the box, with its shadow, is exactly the picture.

// Text as a CSS string. Letters, digits, spaces and , . - stand as they are; every other character
// is a hex escape with the space that ends it (\22 for a double quote, \5c for a backslash, \a for
// a line break, \2019 for the apostrophe), so nothing typed in the CMS can end the string or the
// rule, and the file is plain ASCII whatever charset it is served with.
const cssString = (text) => `"${[...text].map(ch => (/[A-Za-z0-9 ,.-]/.test(ch) ? ch : `\\${ch.codePointAt(0).toString(16)} `)).join('')}"`;

// Every distinct date the Index list prints (`years` as shaped: short), in list order, one to a
// line. White space is one space, as the browser prints it in the row: a line break typed inside
// a date must not make two short lines of it here.
const dateLines = (projects) => [...new Set(projects.map(p => String(p.years ?? '').replace(/[\t\n\f\r ]+/g, ' ').trim()).filter(Boolean))].join('\n');

/**
 * client/covers.css, the home page's generated rules (components/project-index.css): the tag
 * colour; --dates, the text that makes the list's date column as wide as its widest date (every
 * row prints it, unseen, in its date cell); and one rule per grid cell.
 */
export function coversCss(projects, config) {
    const rules = [`:root{--tag:${config.TAG_COLOR}}`];
    const dates = dateLines(projects);
    if (dates) rules.push(`project-index{--dates:${cssString(dates)}}`);
    for (const p of projects) {
        const a = aspect(p.cover);
        if (a) rules.push(`project-index #cell-${p.slug}{--a:${a}}`);
    }
    return rules.join('\n') + '\n';
}

/** client/slides.css: one rule per project photo, by its set's element and its place in the set (components/project-slides.css). */
export function slidesCss(projects) {
    const rules = [];
    for (const p of projects) {
        for (const set of p.sets) {
            set.slides.forEach((s, i) => {
                const a = aspect(s);
                if (a) rules.push(`#${set.id} .slide:nth-child(${i + 1}){--a:${a}}`);
            });
        }
    }
    return rules.join('\n') + '\n';
}
