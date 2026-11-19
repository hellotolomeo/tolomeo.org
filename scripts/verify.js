/**
 * The acceptance checks of BRIEF.md §1 and §10, against the built site in dist/.
 *
 *   npm run build && npm run verify
 *
 * Serves dist/ on a local port (404.html for unknown paths, as GitHub Pages
 * does) and drives Chromium with Playwright:
 *   1. HTML before JS: every route's raw HTML carries its content.
 *   2. Filtering: from the URL and from clicks; the morph only removes what
 *      stops matching (surviving rows and cells are the same nodes) and touches
 *      nothing else but the tag buttons' state; back/forward restore.
 *   3. Project pages: every published project's URL answers with its page, with
 *      every photo in the HTML, one slideshow per set of photos; a set's photos
 *      show one at a time (chevrons, a click on the photo, the arrow keys, which
 *      move the set on screen and no other), and all of them with JavaScript
 *      off; the header stays at the top of the window, the page snaps from set
 *      to set and then to the information, and each set at rest sits under the
 *      header as the design's one slideshow does. The information: type, role,
 *      client and years on the left of the page's centreline and the description
 *      on the right, at the design's measures, the title only in the header;
 *      what is empty leaves no line (the page template is also rendered here
 *      with each field emptied in turn); an arrow to the project before and one
 *      to the project after in the Index's order, none at either end; one
 *      column with the arrows under the text below 760px. Where the information
 *      rests: after a turn of the wheel, after the title link and on a page
 *      opened at #project-info alike; clear of a header whose title wraps; a
 *      project with no photos does not scroll for it.
 *   4. 390px: no horizontal scroll on any route; on a touch screen a project
 *      page scrolls freely.
 *   5. CMS: every front-matter key in content/ is a field in .pages.yml, and every
 *      tag in use is in the tags select.
 *   6. The Index's proportions at 1366px: a cell is a quarter of the page, a list
 *      row is 23px tall, thumbnails are whole, centred, without a border, with
 *      the shadow, and as large as fits (the limiting side reaches its limit).
 *      The list at 720, 800, 1024, 1366 and 1920px: every row one line and 23px
 *      tall, whatever the width; the date, the title and the type each in a column
 *      of its own, the date's as wide as the widest date printed plus 32.2px (at
 *      390px as well), by a text the build writes into client/covers.css and every
 *      row prints unseen: the same with a filter on, wider for a longer date, never
 *      more than 40% of the list; the dates Light and the titles Bold; text that
 *      fits its column is not faded and does
 *      not move; text that does not is cut with a fade, and while its row or its
 *      thumbnail is pointed at it slides left at 100px a second until its end is
 *      clear of the fade, moving nothing else, and is back 0.2s after the pointer
 *      leaves (a pointer that comes back sooner sees no jump); the types stand
 *      still while the pointer is on them, so a click with the mouse filters by
 *      the tag it was aimed at; a tag that is cut is reached with Tab, is then
 *      whole in its column with its focus ring, and filters on Enter. The mask
 *      takes nothing off text that fits; a date too long for its column is cut,
 *      not printed over the title; on a touch screen a column is dragged, and
 *      only one whose text is cut.
 *   7. The Index below 720px: one thumbnail to a row, each whole, centred, without
 *      a border, with the shadow, and as large as fits, its title 10px under its
 *      picture and 32px before the next one, in the list titles' type; the dates
 *      Light, the titles Bold; the same projects in the grid and the
 *      list when a tag is clicked; the list without columns, a row's types
 *      following its title and wrapping. From 720px up the titles are not
 *      displayed and the cells keep their fixed proportion.
 *   + the type: 13px on a 16px line, Light, on every route (captions 11px / 13.2px);
 *   + no picture's box has a border, every one has the shadow and its picture is stretched
 *     over all of it (object-fit: fill), on every route; a thumbnail's and a photo's `sizes`
 *     attribute gives the width it is shown at;
 *   + zero mutations on the first render and on a forced el.render();
 *   + zero console errors and page errors on every route, JS on and off.
 * Exits 1 if anything fails.
 */
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { extname, join, normalize, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import nunjucks from 'nunjucks';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { markdown, markdownText } from '../server/markdown.js';
import { coversCss, shortYears } from '../server/content.js';
import { createEnvironment } from '../server/zeldman/zeldman.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
    console.error('verify: dist/ is missing; run npm run build first');
    process.exit(1);
}

const results = [];
const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// The shadow around every picture, as the browser gives it back (--frame-shadow in client/site.css).
// It is all that is left of the frame: since 19 Nov 2026 no picture has a border.
const SHADOW = 'rgba(100, 40, 95, 0.55) 1px 2px 6px 0px';
// The body type: 13px on a 16px line, Light (font-size / line-height / font-weight).
const BODY = '13px / 16px / 300';
// How far the limiting side of a picture may be from its limit: layout works in 64ths of a pixel,
// and the side that follows from the proportions is rounded once more (0.04px at most, measured).
const EXACT = 0.1;
// The width in px that a `sizes` attribute promises the browser in a window of vw × vh: the first entry
// whose media condition holds (the site writes only max-width / min-width in px), its length worked out
// (vw, vh, px, calc, min). NaN for anything else, so a check that compares it fails.
const sizesPx = (sizes, vw, vh) => {
    const entries = [];
    for (let i = 0, depth = 0, from = 0; i <= sizes.length; i++) {
        if (sizes[i] === '(') depth++;
        else if (sizes[i] === ')') depth--;
        if (i === sizes.length || (sizes[i] === ',' && depth === 0)) { entries.push(sizes.slice(from, i).trim()); from = i + 1; }
    }
    for (const entry of entries) {
        const m = entry.match(/^\((max|min)-width:\s*([\d.]+)px\)\s+(.+)$/);
        if (m && !(m[1] === 'max' ? vw <= Number(m[2]) : vw >= Number(m[2]))) continue;
        const sum = (m ? m[3] : entry).replace(/([\d.]+)vw/g, (_, n) => `(${n} * ${vw / 100})`).replace(/([\d.]+)vh/g, (_, n) => `(${n} * ${vh / 100})`)
            .replace(/([\d.]+)px/g, '$1').replace(/calc/g, '').replace(/min\(/g, 'Math.min(');
        if (!sum.trim() || !/^[\d\s.+\-*/(),]*$/.test(sum.replace(/Math\.min/g, ''))) return NaN;
        try { return Number(new Function(`return ${sum};`)()); } catch { return NaN; }
    }
    return NaN;
};
// Pictures as { name, width, sizes: [the <img>'s, its <source>'s or null] } in a window of vw × vh: those whose
// `sizes` does not give the width the picture is shown at, to the pixel (the browser chooses the file by it,
// before any stylesheet; it lost the border's 12px with the picture, 19 Nov 2026). A picture with one file
// has no `srcset` and needs no `sizes`.
const sizesOff = (pictures, vw, vh) => pictures.map(({ name, width, sizes: [img, source] }) => {
    if (img === null && source === null) return '';
    if (source !== null && source !== img) return `${name}: <source> says ${source}, <img> ${img}`;
    const px = sizesPx(img ?? '', vw, vh);
    return Math.abs(px - width) <= 1 ? '' : `${name}: sizes gives ${Number.isNaN(px) ? 'nothing this check can read' : `${Math.round(px * 100) / 100}px`}, the picture is ${Math.round(width * 100) / 100}px wide (${img})`;
}).filter(Boolean);

// --- what the site should contain, from content/ directly

const projectsDir = join(root, 'content/projects');
const fronts = readdirSync(projectsDir).filter(f => f.endsWith('.md'))
    .map(f => ({ file: f, ...matter(readFileSync(join(projectsDir, f), 'utf8'), {}) }));
const published = fronts.filter(f => f.data.published === true);
const html = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// One line of Markdown as the words a reader sees, by the site's own renderer.
const words = (md) => markdownText(String(md));
// HTML as its text, still escaped as html() escapes.
const textOf = (h) => String(h).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
// The first words of a Markdown body as the site prints them (escaped, like textOf).
const opening = (md) => textOf(markdown(String(md))).trim().split(' ').slice(0, 4).join(' ');
const photos = (p) => (p.data.images ?? []).map(im => (typeof im === 'string' ? { image: im } : im)).filter(im => im?.image);
// A project's photos by set, as the page shows them: a photo's set is its `set` (a whole number
// from 1; 1 when it is left out), the sets are in ascending number order, and the photos of a
// set keep their order in the list.
const setOf = (im) => (typeof im.set === 'number' || typeof im.set === 'string') && im.set !== '' && Number.isInteger(Number(im.set)) && Number(im.set) >= 1 ? Number(im.set) : 1;
const setsOf = (p) => [...new Set(photos(p).map(setOf))].sort((a, b) => a - b).map(n => photos(p).filter(im => setOf(im) === n));
const firstSet = (p) => setsOf(p)[0] ?? [];
// A front-matter value as text, and as a list of texts (the CMS drops what is empty; a role may be one line or several).
const text = (v) => (v === null || v === undefined ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v)).trim();
const texts = (v) => (Array.isArray(v) ? v : v === null || v === undefined || v === '' ? [] : [v]).map(text).filter(Boolean);
// Text as a browser prints it: white space (two spaces typed for one, a tab, a line break) is one space.
// The same white space as the build's when it writes the dates into --dates; a no-break space is not part of it.
const spaced = (t) => String(t).replace(/[\t\n\f\r ]+/g, ' ').trim();
// The lines of a project's information beside its description, as the page prints them: type, role, for, then the years; an empty one is left out.
// White space is one space, as textOf reads it from the page (a date typed with two spaces is still one line of the same words).
const factsOf = (p) => [
    texts(p.data.tags).length ? `type: ${texts(p.data.tags).join(', ')}` : '',
    texts(p.data.role).length ? `role: ${texts(p.data.role).join(', ')}` : '',
    text(p.data.client) ? `for: ${text(p.data.client)}` : '',
    shortYears(text(p.data.years)),
].filter(Boolean).map(line => line.replace(/\s+/g, ' '));
// The information section of a project page's HTML, the lines of its left column, and one of its two arrows.
const sectionOf = (body) => body.match(/<section class="project-info"[\s\S]*?<\/section>/)?.[0] ?? '';
const linesOf = (section) => [...(section.match(/<div class="facts">[\s\S]*?<\/div>/)?.[0] ?? '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => textOf(m[1]).trim());
const arrowOf = (section, side) => { const m = section.match(new RegExp(`<a\\s+class="${side}"\\s+href="([^"]*)"\\s+aria-label="([^"]*)"`)); return m ? { href: m[1], name: m[2] } : null; };
// A photo's file name without its extension: the built file's name starts with it.
const stem = (im) => decodeURIComponent(String(im.image)).split('/').pop().replace(/\.[^.]+$/, '');
// Two tags to filter by, taken from the content: the most used, and the most used of the rest.
const counts = new Map();
for (const p of published) for (const t of p.data.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
const [tagA, tagB] = [...counts].sort((a, b) => b[1] - a[1]).map(([t]) => t);

// The dates: the content keeps them as typed, in full; the site prints them short, everywhere.
{
    const table = [['2026', '’26'], ['2023 - 2026', '’23–26'], ['2023–2026', '’23–26'], ['2025, 2026', '’25, 26'], ['2023 –', '’23–'], ['’23–26', '’23–26'], ['', '']];
    const off = table.filter(([typed, printed]) => shortYears(typed) !== printed).map(([typed]) => `${typed} → ${shortYears(typed)}`);
    check('1. the short date format: 2026 → ’26, 2023 - 2026 → ’23–26, 2025, 2026 → ’25, 26, 2023 – → ’23–, and one typed short already stays as it is', off.length === 0, off.join('; '));
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    const wrong = [];
    for (const p of published) {
        const want = shortYears(text(p.data.years));
        const row = home.match(new RegExp(`id="row-${p.data.slug}"[^>]*><span class="years">([^<]*)</span>`))?.[1];
        const page = readFileSync(join(dist, 'projects', p.data.slug, 'index.html'), 'utf8').match(/<p class="years">([^<]*)<\/p>/)?.[1] ?? '';
        if (row !== want || page !== want || /\d{4}/.test(row ?? '')) wrong.push(`${p.data.slug}: the list has "${row}", its page "${page}", wanted "${want}"`);
    }
    check(`1. every project's date is printed short, in the Index list and on its own page alike (${published.length} projects)`, wrong.length === 0, wrong.slice(0, 5).join('; '));
}

// The list's date column is as wide as its widest date: client/covers.css carries every distinct date
// as printed, a date to a line, in one CSS string (--dates on project-index), and every row prints it,
// unseen, in its date cell. The dates are text typed in the CMS: in the string, letters, digits,
// spaces and , . - stand as they are and everything else is a hex escape, so no date can end the
// string or the rule. A CSS string as written, back to its text (the escapes a browser writes too):
const cssText = (string) => string.slice(1, -1).replace(/\\(?:([0-9a-fA-F]{1,6})[ \t\n]?|([^]))/g, (_, hex, ch) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : ch));
const datesRule = (css) => css.split('\n').filter(line => line.startsWith('project-index{--dates:'));
// Made-up projects: a date with a double quote, a backslash and a line break in it; the same date
// with a space where the line break was (one line for the two: a line break prints as a space);
// one that would end a rule, a declaration or a style element; none; and an ordinary one.
const madeUp = [
    { slug: 'a', years: '’19 "x" \\ y\nz' }, { slug: 'b', years: '’19 "x" \\ y z' }, { slug: 'c', years: '}</style>;{' }, { slug: 'd', years: '' }, { slug: 'e', years: '’26' },
];
const madeUpDates = ['’19 "x" \\ y z', '}</style>;{', '’26'];
const madeUpCss = coversCss(madeUp, { TAG_COLOR: '#000' });
{
    const rules = datesRule(madeUpCss);
    const safe = /^project-index\{--dates:"(?:[A-Za-z0-9 ,.-]|\\[0-9a-f]{1,6} )*"\}$/;
    const back = rules.length === 1 ? cssText(rules[0].slice('project-index{--dates:'.length, -1)).split('\n') : [];
    check('6. the generated rule for the date column escapes what a date may hold: a double quote, a backslash and a line break (which prints as a space) leave one rule on one line, with nothing between its quotes but letters, digits, spaces, , . - and hex escapes, and it reads back as the dates',
        madeUpCss.trimEnd().split('\n').length === 2 && rules.length === 1 && safe.test(rules[0]) && JSON.stringify(back) === JSON.stringify(madeUpDates), `${JSON.stringify(madeUpCss)} reads back as ${JSON.stringify(back)}`);
    const none = datesRule(coversCss([{ slug: 'a', years: '' }], { TAG_COLOR: '#000' }));
    check('6. with no date at all the build writes no rule for the date column', none.length === 0, none.join(' '));
    // The built file: every date the list prints, once, in the list's order.
    const built = datesRule(readFileSync(join(dist, 'client/covers.css'), 'utf8'));
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    const unescape = (t) => t.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[e]));
    const printed = [...new Set([...home.matchAll(/<span class="years">([^<]*)<\/span>/g)].map(m => spaced(unescape(m[1]))).filter(Boolean))];
    const lines = built.length === 1 ? cssText(built[0].slice('project-index{--dates:'.length, -1)).split('\n') : [];
    check(`6. client/covers.css carries every date the list prints, each once, a date to a line (${printed.length} dates)`, built.length === 1 && safe.test(built[0]) && JSON.stringify(lines) === JSON.stringify(printed), `${built[0]} against ${JSON.stringify(printed)}`);
}

// --- a static server for dist/, like GitHub Pages

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.otf': 'font/otf', '.json': 'application/json', '.txt': 'text/plain', '.ico': 'image/x-icon' };
const server = createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://x');
    let path = normalize(join(dist, decodeURIComponent(pathname)));
    if (!path.startsWith(dist)) { res.writeHead(403); return res.end(); }
    try { if (statSync(path).isDirectory()) path = join(path, 'index.html'); } catch { /* falls through */ }
    if (!path.startsWith(dist + sep) || !existsSync(path) || statSync(path).isDirectory()) {
        res.writeHead(404, { 'Content-Type': TYPES['.html'] });
        return res.end(readFileSync(join(dist, '404.html')));
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(readFileSync(path));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const routes = ['/', '/projects/', '/info/', '/404.html', ...published.map(p => `/projects/${p.data.slug}/`)];
// The Index's order: the projects as the home page's list has them, sub-items in their place.
const listed = [...(await (await fetch(`${base}/`)).text()).matchAll(/id="row-([^"]+)"/g)].map(m => m[1]);
// The project pages the slideshow checks use: the one whose first set has the most photos, one with a single photo, one with captions.
const many = [...published].sort((a, b) => firstSet(b).length - firstSet(a).length)[0];
const single = published.find(p => photos(p).length === 1);
const captioned = published.find(p => firstSet(p).length > 1 && firstSet(p).some(im => im.caption));
// A project with more than one set, if the content has one (rather one where a later set has
// photos to move through), and one with a single set of several photos.
const multis = published.filter(p => setsOf(p).length > 1);
const multi = multis.find(p => setsOf(p).slice(1).some(s => s.length > 1)) ?? multis[0];
const oneSet = [...published].filter(p => setsOf(p).length === 1).sort((a, b) => photos(b).length - photos(a).length)[0];
// The project with the most to read: its information is the tallest.
const longest = [...published].filter(p => photos(p).length).sort((a, b) => b.content.length - a.content.length)[0];
// A page's scripts load only if some set has a photo to move to.
const scripted = (p) => setsOf(p).some(s => s.length > 1);

// The page has come to rest: its scroll position has stopped changing (a snap, or a smooth scroll, is over).
const rest = async (page) => {
    let last = NaN;
    for (let i = 0, same = 0; i < 120; i++) {
        await page.waitForTimeout(50);
        const y = await page.evaluate(() => scrollY);
        if (y !== last) same = 0;
        else if (++same >= 3) break;
        last = y;
    }
    return last;
};
// Every slideshow of a project page has rendered (a page whose sets all hold one photo loads no script).
const slidesReady = (page) => page.waitForFunction(() => !document.scripts.length || [...document.querySelectorAll('project-slides')].every(el => el.rendered));
// A project page as it lies in the window: the header, each set with its current photo's box (`.frame`, a name from when it had a border), chevrons and caption, the information.
const lie = (page) => page.evaluate(() => {
    const box = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
    const seen = (el) => Boolean(el) && el.getClientRects().length > 0;
    // The element itself is what is at its middle: nothing lies over it.
    const onTop = (el) => { const b = el.getBoundingClientRect(); const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return Boolean(at) && (at === el || el.contains(at)); };
    return {
        y: scrollY,
        max: document.documentElement.scrollHeight - innerHeight,
        vw: document.documentElement.clientWidth,
        vh: innerHeight,
        iw: innerWidth,
        wide: document.documentElement.scrollWidth,
        mouse: matchMedia('(hover: hover) and (pointer: fine)').matches,
        snap: getComputedStyle(document.documentElement).scrollSnapType,
        head: box(document.querySelector('.project-head')),
        headOnTop: onTop(document.querySelector('.back a')) && onTop(document.querySelector('.project-head h1 a')),
        sets: [...document.querySelectorAll('project-slides')].map((el) => {
            const slides = [...el.querySelectorAll('.slide')];
            const shown = slides.filter(seen);
            const now = shown[0];
            const img = now?.querySelector('img');
            return {
                ...box(el),
                label: el.querySelector('.slides')?.getAttribute('aria-label') ?? '',
                count: slides.length,
                shown: shown.length,
                current: slides.indexOf(now),
                index: el.state?.index ?? 0,
                files: slides.map(sl => decodeURIComponent(sl.querySelector('img').getAttribute('src')).split('/').pop()),
                a: img ? Math.round((img.getAttribute('width') / img.getAttribute('height')) * 10000) / 10000 : null,
                frame: box(now?.querySelector('.frame')),
                image: box(img),
                fit: img ? getComputedStyle(img).objectFit : '',
                sizes: [img?.getAttribute('sizes') ?? null, now?.querySelector('source')?.getAttribute('sizes') ?? null],
                border: now ? ['Top', 'Right', 'Bottom', 'Left'].map(k => getComputedStyle(now.querySelector('.frame'))[`border${k}Width`]).join(' ') : '',
                shadow: now ? getComputedStyle(now.querySelector('.frame')).boxShadow : '',
                prev: seen(now?.querySelector('.prev')) ? box(now.querySelector('.prev')) : null,
                next: seen(now?.querySelector('.next')) ? box(now.querySelector('.next')) : null,
                caption: seen(now?.querySelector('.caption')) ? box(now.querySelector('.caption')) : null,
            };
        }),
        info: box(document.querySelector('#project-info')),
        desc: box(document.querySelector('#project-info .description')),
    };
});
// The information at rest (CLAUDE.md, "The project page's scroll"). In two columns (from 760px): the
// section's top 72px from the top of the window, 7px above the header's lower edge, which puts the
// first line box of the description at 74px. In one column (below 760px): 16px lower, at 88px, clear
// of a header whose title has wrapped onto a second line. Returns what is off, or ''.
const restAt = (at) => (at.vw >= 760 ? 72 : 88);
const infoOff = (at) => {
    const off = [];
    if (Math.abs(at.info.top - restAt(at)) > 0.5) off.push(`the information's top at ${at.info.top}, not ${restAt(at)}`);
    if (at.desc && at.vw >= 760 && Math.abs(at.desc.top - 74) > 0.5) off.push(`the description's first line at ${at.desc.top}, not 74`);
    return off.join('; ');
};
// What the design gives the current photo of a set (CLAUDE.md, "Slideshow"): the set is the window
// less the 79px header; the photo is the largest that fits the page less, on each side, a 44px
// chevron target, a 14.25px gap and a 16px edge (below 600px: the chevron targets only), and the
// set's height less the 63px caption room: its limiting side reaches that limit exactly. It has no
// border, the picture fills its box (stretched over it, `object-fit: fill`, so no pixel of the box is left
// to the ground colour), the shadow lies directly around it, and its `sizes` says that width. It is centred in the
// page, the caption room under it, a chevron 14.25px from either side (0 below 600px). For a photo
// of 1.4995 at 1366 × 710 that is 851.7 × 567.98 at 257.14, 79: the outer edge of the 845.72 ×
// 567.98 frame the slideshow had while photos had a 6px border, and 3px more on either side.
// Returns what is off, or ''.
const offDesign = (set, at) => {
    const near = (a, b) => Math.abs(a - b) <= 0.5;
    const off = [];
    if (!set.frame) return 'no photo shown';
    const room = Math.max(63, set.caption ? set.caption.height + 23.4 : 0);
    const gap = at.vw <= 600 ? 0 : 14.25;
    const limit = { width: at.vw - 2 * (44 + gap + (at.vw <= 600 ? 0 : 16)), height: Math.max(160, at.vh - 79 - 63) };
    const width = Math.min(limit.width, limit.height * set.a);
    const frame = { width, height: width / set.a };
    if (!near(set.width, at.vw) || !near(set.height, Math.max(at.vh - 79, frame.height + room))) off.push(`set ${set.width}×${set.height}`);
    if (!near(set.frame.width, frame.width) || !near(set.frame.height, frame.height)) off.push(`photo ${set.frame.width}×${set.frame.height}, not ${frame.width}×${frame.height}`);
    if (Math.abs(set.frame.width - limit.width) > EXACT && Math.abs(set.frame.height - limit.height) > EXACT) off.push(`photo ${set.frame.width}×${set.frame.height} reaches neither limit of ${limit.width}×${limit.height}`);
    if (set.frame.width > limit.width + EXACT || set.frame.height > limit.height + EXACT) off.push(`photo ${set.frame.width}×${set.frame.height} larger than ${limit.width}×${limit.height}`);
    if (set.border !== '0px 0px 0px 0px') off.push(`a border (${set.border})`);
    if (set.shadow !== SHADOW) off.push(`shadow ${set.shadow}`);
    if (!['left', 'top', 'width', 'height'].every(k => near(set.image[k], set.frame[k]))) off.push(`the picture (${set.image.width}×${set.image.height}) does not fill its box`);
    if (set.fit !== 'fill') off.push(`the picture is object-fit: ${set.fit}, which can leave a line of the ground between it and its shadow`);
    off.push(...sizesOff([{ name: 'photo', width: set.frame.width, sizes: set.sizes }], at.iw, at.vh));
    if (!near(set.frame.left, (at.vw - frame.width) / 2)) off.push(`photo left ${set.frame.left}`);
    if (!near(set.frame.top - set.top, (set.height - frame.height - room) / 2)) off.push(`photo ${set.frame.top - set.top} under the set's top`);
    if (set.caption && !near(set.caption.top - set.frame.bottom, 16)) off.push(`caption ${set.caption.top - set.frame.bottom} under the photo, not 16`);
    if (set.count > 1 && !set.prev && !set.next) off.push('no chevron');
    for (const arrow of [set.prev, set.next]) {
        if (!arrow) continue;
        const space = arrow === set.prev ? set.frame.left - arrow.right : arrow.left - set.frame.right;
        if (!near(space, gap) || !near(arrow.width, 44) || !near(arrow.height, 44) || !near(arrow.top + 22, set.frame.top + set.frame.height / 2)) off.push(`chevron ${space} from the photo`);
    }
    return off.join('; ');
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
    // 1. HTML before JS
    {
        const index = await (await fetch(`${base}/`)).text();
        const missingRows = published.filter(p => !index.includes(`id="row-${p.data.slug}"`) || !index.includes(`id="cell-${p.data.slug}"`));
        check('1. index HTML has every published project as a row and a cell', missingRows.length === 0, missingRows.map(p => p.data.slug).join(', '));
        const site = matter(readFileSync(join(root, 'content/site/index.md'), 'utf8'), {}).data;
        check('1. index HTML has the intro', textOf(index).includes(html(words(site.intro))), words(site.intro));
        check('1. the home page\'s tab title is the name alone', index.includes('<title>Tolomeo</title>'));
        const unpublished = fronts.filter(f => f.data.published !== true && index.includes(`id="row-${f.data.slug}"`));
        check('1. unpublished projects are absent', unpublished.length === 0, unpublished.map(f => f.data.slug).join(', '));
        let pageMisses = [];
        let photoMisses = [];
        const infoMisses = [];
        const arrowMisses = [];
        const titleOf = Object.fromEntries(published.map(p => [p.data.slug, text(p.data.title)]));
        for (const p of published) {
            const res = await fetch(`${base}/projects/${p.data.slug}/`);
            const firstWords = opening(p.content);
            const body = await res.text();
            // The information: the lines of the left column are the project's own and no others; the
            // description is there only if there is one; and the section prints nothing else (no row,
            // no heading: the title is in the page header only). A client, a tag or a photo link may
            // well hold the title's words, so this looks for text outside the three parts, not for the title.
            const section = sectionOf(body);
            const lines = linesOf(section);
            const want = factsOf(p).map(html);
            const others = section.replace(/<div class="description">[\s\S]*?<\/div>/, '').replace(/<ul class="links">[\s\S]*?<\/ul>/, '').replace(/<div class="facts">[\s\S]*?<\/div>/, '');
            const wrong = [];
            if (lines.join(' | ') !== want.join(' | ')) wrong.push(`lines "${lines.join(' | ')}", not "${want.join(' | ')}"`);
            if (/<div class="description">/.test(section) !== Boolean(p.content.trim())) wrong.push('description');
            if (textOf(others).trim() || /<h\d|class="(row|title)"/.test(others)) wrong.push(`the section prints more than its lines, its description and its photo links: "${textOf(others).trim().slice(0, 40)}"`);
            if (wrong.length) infoMisses.push(`${p.data.slug}: ${wrong.join(', ')}`);
            // The arrows: to the project before and the one after in the home page's list, none at either end.
            const at = listed.indexOf(p.data.slug);
            for (const [side, word, to] of [['prev', 'Previous', listed[at - 1]], ['next', 'Next', listed[at + 1]]]) {
                const arrow = arrowOf(section, side);
                const wanted = at >= 0 && to ? { href: `/projects/${to}/`, name: `${word} project: ${html(titleOf[to])}` } : null;
                if (JSON.stringify(arrow) !== JSON.stringify(wanted)) arrowMisses.push(`${p.data.slug} ${side}: ${arrow ? `${arrow.href} "${arrow.name}"` : 'none'}, not ${wanted ? `${wanted.href} "${wanted.name}"` : 'none'}`);
            }
            if (res.status !== 200 || !body.includes(`<h1><a href="#project-info">${html(p.data.title)}</a></h1>`) || !body.includes('id="project-info"') || (firstWords && !textOf(body).includes(firstWords))) pageMisses.push(p.data.slug);
            const shown = body.match(/<li class="slide[ "]/g)?.length ?? 0;
            const captions = photos(p).filter(im => im.caption && !textOf(body).includes(html(words(im.caption))));
            // One slideshow per set, in set order, each with its set's photos.
            const perSet = (body.match(/<project-slides\b[\s\S]*?<\/project-slides>/g) ?? []).map(el => el.match(/<li class="slide[ "]/g)?.length ?? 0);
            const wantSets = setsOf(p).map(set => set.length);
            if (shown !== photos(p).length || captions.length || perSet.join() !== wantSets.join()) photoMisses.push(`${p.data.slug} (${shown}/${photos(p).length} photos, ${captions.length} captions missing, sets of ${perSet.join('+') || 0} not ${wantSets.join('+') || 0})`);
        }
        check('1+3. every project page answers 200 with its title and description in the HTML', pageMisses.length === 0, pageMisses.join(', '));
        check('1+3. every project page has every photo and caption in the HTML, one slideshow per set', photoMisses.length === 0, photoMisses.join(', '));
        check('3. every project\'s information prints its own type, role, client and years, each on a line and none for what is empty, its description if it has one, and nothing else: not its title', infoMisses.length === 0, infoMisses.slice(0, 4).join('; '));
        check(`3. every project page's arrows lead to the project before and the one after in the Index's order, by name, with none before the first or after the last (${listed.length} projects)`, listed.length === published.length && arrowMisses.length === 0, arrowMisses.slice(0, 4).join('; '));

        // The page template with each field emptied in turn (the content need not have such a project).
        {
            const site = createEnvironment(nunjucks, { templates: [root], components: join(root, 'components') });
            const full = { slug: 'x', title: 'A title', href: '/projects/x/', years: '2020', tags: ['one', 'two'], role: 'maker', client: 'someone', body: '<p>Words.</p>', sets: [], scripted: false, photoLinks: [], prevHref: '/projects/w/', prevTitle: 'Before', nextHref: '/projects/y/', nextTitle: 'After' };
            const render = (over) => sectionOf(site.render('shared/pages/project.html', { pageTitle: full.title, project: { ...full, ...over } }));
            const all = ['type: one, two', 'role: maker', 'for: someone', '2020'];
            const wrong = [];
            const expect = (name, over, lines, has = {}) => {
                const section = render(over);
                const got = linesOf(section);
                const parts = { facts: lines.length > 0, about: true, description: true, links: false, neighbours: true, prev: true, next: true, ...has };
                if (got.join(' | ') !== lines.join(' | ')) wrong.push(`${name}: lines "${got.join(' | ')}"`);
                if (/<p[^>]*>\s*<\/p>|<span class="label">[^<]*<\/span>\s*<\/p>/.test(section)) wrong.push(`${name}: an empty line or a label with nothing after it`);
                for (const [part, there] of Object.entries(parts)) if (new RegExp(`class="${part}"`).test(section) !== there) wrong.push(`${name}: ${part} ${there ? 'missing' : 'printed'}`);
            };
            expect('everything filled in', {}, all);
            expect('no tags', { tags: [] }, all.filter(l => !l.startsWith('type')));
            expect('no role', { role: '' }, all.filter(l => !l.startsWith('role')));
            expect('no client', { client: '' }, all.filter(l => !l.startsWith('for')));
            expect('no years', { years: '' }, all.slice(0, 3));
            expect('years only', { tags: [], role: '', client: '' }, ['2020']);
            expect('no description', { body: '' }, all, { about: false, description: false });
            expect('nothing at all', { tags: [], role: '', client: '', years: '', body: '' }, [], { about: false, description: false });
            expect('photo links and no description', { body: '', photoLinks: [{ label: 'Photos', url: 'https://example.com/' }] }, all, { description: false, links: true });
            expect('the first project', { prevHref: '', prevTitle: '' }, all, { prev: false });
            expect('the last project', { nextHref: '', nextTitle: '' }, all, { next: false });
            expect('the only project', { prevHref: '', prevTitle: '', nextHref: '', nextTitle: '' }, all, { neighbours: false, prev: false, next: false });
            check('3. the information leaves out what is empty: no line or label for missing tags, role, client or years, no column for a missing description (the photo links alone if there are any), no arrow where there is no neighbour (the page template, each field emptied in turn)', wrong.length === 0, wrong.slice(0, 4).join('; '));
        }
        const info = await (await fetch(`${base}/info/`)).text();
        const infoWords = opening(matter(readFileSync(join(root, 'content/site/info.md'), 'utf8'), {}).content);
        check('1. info HTML has its body', Boolean(infoWords) && textOf(info).includes(infoWords), infoWords);
        const hidden = fronts.find(f => f.data.published !== true);
        if (hidden) {
            const gone = await fetch(`${base}/projects/${hidden.data.slug}/`);
            check('3. an unpublished project has no page (404)', gone.status === 404, hidden.data.slug);
        }
    }

    // zero mutations, console errors with JS on
    const errorsOn = [];
    {
        const page = await browser.newPage();
        page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errorsOn.push(`${page.url()} ${m.type()}: ${m.text()}`); });
        page.on('pageerror', e => errorsOn.push(`${page.url()} pageerror: ${e.message}`));
        await page.addInitScript(() => {
            const records = [];
            const watch = new MutationObserver(r => records.push(...r));
            const define = customElements.define.bind(customElements);
            // Watch from the first class definition on: what the parser built is the server's HTML.
            customElements.define = (...args) => {
                watch.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
                watch.takeRecords();
                return define(...args);
            };
            window.__mutations = () => {
                records.push(...watch.takeRecords());
                const inside = records.filter(m => {
                    const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
                    return el?.closest('project-index, project-slides');
                }).map(m => `${m.type} ${m.target.nodeName}${m.attributeName ? ` [${m.attributeName}]` : ''}`);
                records.length = 0;
                return inside;
            };
        });
        // Every component on the page: a project page has one <project-slides> per set.
        const slideshows = published.filter(scripted).map(p => [`/projects/${p.data.slug}/`, 'project-slides']);
        for (const [path, tag] of [['/', 'project-index'], ['/projects/', 'project-index'], ...slideshows]) {
            await page.goto(base + path);
            await page.waitForFunction((t) => { const els = [...document.querySelectorAll(t)]; return els.length > 0 && els.every(el => el.rendered); }, tag);
            const first = await page.evaluate(() => window.__mutations());
            check(`zero mutations on first render: ${path}`, first.length === 0, first.slice(0, 5).join('; '));
            const forced = await page.evaluate((t) => { for (const el of document.querySelectorAll(t)) el.render(); return window.__mutations(); }, tag);
            check(`zero mutations on el.render(): ${path}`, forced.length === 0, forced.slice(0, 5).join('; '));
        }

        // 2. filtering
        await page.goto(base + '/');
        await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
        const tagged = (t) => published.filter(p => (p.data.tags ?? []).includes(t)).map(p => p.data.slug).sort();
        const click = await page.evaluate(async (tag) => {
            const before = new Map([...document.querySelectorAll('project-index .row, project-index .cell')].map(e => [e.id, e]));
            window.__mutations();
            document.querySelector(`project-index .tag[data-tag="${CSS.escape(tag)}"]`).click();
            await new Promise(r => setTimeout(r, 50));
            const rows = [...document.querySelectorAll('project-index .row')];
            const cells = [...document.querySelectorAll('project-index .cell')];
            const muts = window.__mutations();
            return {
                url: location.search,
                rows: rows.map(r => r.dataset.slug).sort(),
                cells: cells.map(c => c.dataset.slug).sort(),
                same: [...rows, ...cells].every(e => before.get(e.id) === e),
                other: muts.filter(m => !m.startsWith('childList') && !/\[(class|aria-pressed)\]$/.test(m)),
                buttons: muts.filter(m => m.startsWith('attributes')).every(m => m.startsWith('attributes BUTTON')),
                active: [...document.querySelectorAll('project-index .tag.on')].every(b => b.dataset.tag === tag),
            };
        }, tagA);
        const want = tagged(tagA);
        check(`2. clicking a tag filters rows and cells (OR) and writes ?filter= (${tagA})`, click.url === `?filter=${encodeURIComponent(tagA)}` && JSON.stringify(click.rows) === JSON.stringify(want) && JSON.stringify(click.cells) === JSON.stringify(want), `${click.url} rows=${click.rows.length} want=${want.length}`);
        check('2. the morph keeps surviving rows/cells as the same nodes and touches only tag state', click.same && click.other.length === 0 && click.buttons, click.other.slice(0, 5).join('; '));
        check('2. active tags are marked', click.active);
        const either = [...new Set([...tagged(tagA), ...tagged(tagB)])].sort();
        const both = `${encodeURIComponent(tagA)},${encodeURIComponent(tagB)}`;
        await page.goto(`${base}/?filter=${both}`);
        await page.waitForTimeout(100);
        const fromUrl = await page.evaluate(() => [...document.querySelectorAll('project-index .row')].map(r => r.dataset.slug).sort());
        check(`2. ?filter=${tagA},${tagB} shows projects with either tag`, JSON.stringify(fromUrl) === JSON.stringify(either), `${fromUrl.length} vs ${either.length}`);
        await page.evaluate(async (tags) => {
            for (const t of tags) document.querySelector(`project-index .tag.on[data-tag="${CSS.escape(t)}"]`)?.click();
            await new Promise(r => setTimeout(r, 50));
        }, [tagA, tagB]);
        const cleared = await page.evaluate(() => ({ url: location.search, rows: document.querySelectorAll('project-index .row').length }));
        check('2. removing the last active tag restores everything', cleared.url === '' && cleared.rows === published.length, JSON.stringify(cleared));
        // Turning off a tag with the keyboard while its row is about to drop out: no error,
        // and focus stays in the list. The filter in the address is applied by the script, so wait for
        // it (a fixed pause was too short on a busy machine, and the check was then silently left out).
        await page.goto(`${base}/?filter=${both}`);
        await page.waitForFunction(() => document.querySelector('project-index .tag.on') !== null, null, { timeout: 10000 }).catch(() => {});
        const lone = await page.evaluate((t) => {
            const btn = [...document.querySelectorAll(`project-index .tag.on[data-tag="${CSS.escape(t)}"]`)]
                .find(b => b.closest('.row').querySelectorAll('.tag.on').length === 1);
            if (!btn) return false;
            btn.focus();
            return true;
        }, tagA);
        if (lone) {
            await page.keyboard.press('Enter');
            await page.waitForTimeout(100);
            const focus = await page.evaluate(() => document.activeElement?.closest('project-index .index') !== null);
            check('2. removing a focused row keeps keyboard focus in the list (errors are checked below)', focus);
        } else {
            check(`2. removing a focused row: ok (no row has "${tagA}" as its only active tag; the check was skipped)`, true);
        }
        await page.goto(`${base}/?filter=${both}`);
        await page.waitForTimeout(100);
        await page.evaluate(async (tags) => {
            for (const t of tags) document.querySelector(`project-index .tag.on[data-tag="${CSS.escape(t)}"]`)?.click();
            await new Promise(r => setTimeout(r, 50));
        }, [tagA, tagB]);
        await page.goBack();
        await page.waitForTimeout(100);
        const back = await page.evaluate(() => ({ url: location.search, rows: document.querySelectorAll('project-index .row').length }));
        check('2. back restores the previous filter', back.url !== '' && back.rows < published.length, JSON.stringify(back));
        await page.goto(`${base}/`);
        const reset = await page.evaluate(() => document.querySelectorAll('project-index .row').length);
        check('2. / with no query shows everything', reset === published.length);

        // pointing at a thumbnail highlights its row, and changes nothing else
        {
            await page.goto(`${base}/`);
            await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
            const slug = published[1].data.slug;
            await page.evaluate(() => window.__mutations());
            await page.hover(`#cell-${slug}`);
            await page.waitForTimeout(50);
            const hover = await page.evaluate(() => ({
                on: [...document.querySelectorAll('project-index .row.on')].map(r => r.dataset.slug),
                muts: window.__mutations(),
            }));
            check('pointing at a thumbnail highlights its row and touches nothing else', hover.on.length === 1 && hover.on[0] === slug && hover.muts.every(m => m === 'attributes LI [class]'), `${hover.on.join(',')} ${hover.muts.slice(0, 5).join('; ')}`);
        }

        // the project page's Back link brings the filter back
        await page.goto(`${base}/?filter=${encodeURIComponent(tagA)}`);
        await page.waitForTimeout(100);
        await page.click('project-index .row .title');
        await page.waitForURL(/\/projects\/.+\//);
        await page.click('.back a');
        await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
        await page.waitForTimeout(100);
        check('2. the project page\'s Back link keeps the filter', await page.evaluate(q => location.search === q, `?filter=${encodeURIComponent(tagA)}`));

        // 3. a project from the grid
        await page.goto(`${base}/`);
        const first = published.find(p => !p.data.parent) ?? published[0];
        await page.click(`#cell-${first.data.slug}`);
        await page.waitForURL(`**/projects/${first.data.slug}/`);
        check('3. a grid cell opens its project page', (await page.textContent('h1')).trim() === String(first.data.title).trim());

        // 3. the photos of a set, one at a time (the first set: the one on screen when the page opens)
        const top = 'project-slides:first-of-type';
        if (many && firstSet(many).length > 2) {
            const count = firstSet(many).length;
            await page.goto(`${base}/projects/${many.data.slug}/`);
            await slidesReady(page);
            const look = () => page.evaluate(() => {
                const seen = (el) => Boolean(el) && el.getClientRects().length > 0;
                const slides = [...document.querySelectorAll('project-slides:first-of-type .slide')];
                const shown = slides.filter(seen);
                return {
                    shown: shown.length,
                    current: slides.indexOf(shown[0]),
                    prev: seen(shown[0]?.querySelector('.prev')),
                    next: seen(shown[0]?.querySelector('.next')),
                    focus: document.activeElement?.className ?? '',
                };
            });
            const start = await look();
            check('3. a project page shows its first photo only, with no "previous"', start.shown === 1 && start.current === 0 && !start.prev && start.next, JSON.stringify(start));
            await page.evaluate(() => window.__mutations());
            await page.click(`${top} .current .next`);
            const second = await look();
            const muts = await page.evaluate(() => window.__mutations());
            const other = muts.filter(m => !['attributes LI [class]', 'attributes IMG [loading]', 'characterData #text'].includes(m));
            check('3. the "next" chevron shows the second photo, between two chevrons, and keeps focus', second.shown === 1 && second.current === 1 && second.prev && second.next && second.focus.includes('next'), JSON.stringify(second));
            check('3. changing photo touches only the current class, the next photo\'s loading and the status line', other.length === 0, other.slice(0, 5).join('; '));
            await page.click(`${top} .current .frame`);
            const third = await look();
            await page.keyboard.press('ArrowLeft');
            const left = await look();
            check('3. a click on the photo goes on, the left arrow key goes back', third.current === 2 && left.current === 1, `${third.current}, ${left.current}`);
            await page.focus(`${top} .current .next`);
            await page.keyboard.press('ArrowRight');
            const kept = await page.evaluate(() => document.activeElement?.closest('project-slides:first-of-type .slide.current') !== null && document.activeElement?.classList.contains('arrow'));
            check('3. an arrow key pressed while a chevron has focus keeps focus on a chevron of the new photo', kept);
            for (let i = 0; i < count + 1; i++) await page.keyboard.press('ArrowRight');
            const end = await look();
            await page.click(`${top} .current .frame`);
            const still = await look();
            check('3. the last photo has no "next", and a click on it stays', end.current === count - 1 && end.prev && !end.next && still.current === count - 1, JSON.stringify(end));
            await page.click('.project-head h1 a');
            await page.waitForFunction(() => location.hash === '#project-info');
            await rest(page);
            const info = await lie(page);
            check('3. the title link brings the project information to rest with its top 72px from the top of the window (the description\'s first line at 74px), the header in place', infoOff(info) === '' && info.head.top === 0, infoOff(info) || `header top ${info.head.top}`);
        }
        if (captioned) {
            const at = firstSet(captioned).findIndex(im => im.caption);
            await page.goto(`${base}/projects/${captioned.data.slug}/`);
            await slidesReady(page);
            for (let i = 0; i < at; i++) await page.keyboard.press('ArrowRight');
            const shown = await page.evaluate(() => [...document.querySelectorAll('project-slides:first-of-type .caption')].filter(c => c.getClientRects().length).map(c => c.textContent.replace(/\s+/g, ' ').trim()));
            check('3. a photo\'s caption shows under it, and only its own', shown.length === 1 && shown[0] === words(firstSet(captioned)[at].caption), shown.join(' | '));
        }
        if (single) {
            await page.goto(`${base}/projects/${single.data.slug}/`);
            const lone = await page.evaluate(() => ({ arrows: document.querySelectorAll('project-slides .arrow').length, slides: document.querySelectorAll('project-slides .slide').length, scripts: document.scripts.length }));
            check('3. a project with one photo has no chevrons and no script', lone.arrows === 0 && lone.slides === 1 && lone.scripts === 0, JSON.stringify(lone));
        }

        // 3. sets: every set is a slideshow of its own, one window tall under a header that stays
        // put; with a mouse or trackpad the page snaps from set to set, then to the information.
        {
            await page.setViewportSize({ width: 1366, height: 710 });
            const open = async (p) => {
                await page.goto(`${base}/projects/${p.data.slug}/`);
                await slidesReady(page);
                await page.mouse.move(683, 400);
                return lie(page);
            };
            // One turn of the wheel, more than half a set: the page goes on to the next stop.
            const wheel = async (down = true) => {
                await page.mouse.wheel(0, (down ? 1 : -1) * Math.round((await page.evaluate(() => innerHeight) - 79) * 0.6));
                await rest(page);
                return lie(page);
            };

            // A one-set project is the design's one slideshow: its photo is where the slideshow's was before there were sets.
            if (oneSet) {
                const at = await open(oneSet);
                const off = offDesign(at.sets[0], at);
                check(`3. a one-set project opens as the design's one slideshow: the set fills the window under the header, the photo as large as fits (its limiting side on the limit), without a border, the shadow around it (${oneSet.data.slug})`, at.sets.length === 1 && off === '' && Math.abs(at.sets[0].top - 79) <= 0.5 && at.y === 0, off || `${at.sets.length} set, its top at ${at.sets[0].top}, the page at ${at.y}`);
            }

            // The widest photo of any first set (its proportions are in the generated client/slides.css): where
            // the room is wider than it needs, the height limits it; where it is not, the width does, and
            // then it is the photo's sides that are on the limit, exactly. On a desk and on a phone.
            {
                const widest = [...readFileSync(join(dist, 'client/slides.css'), 'utf8').matchAll(/#slides-(.+)-1 \.slide:nth-child\((\d+)\)\{--a:([\d.]+)\}/g)]
                    .map(m => ({ slug: m[1], n: Number(m[2]), a: Number(m[3]) })).sort((x, y) => y.a - x.a)[0];
                const told = [];
                const wrong = [];
                for (const [width, height] of [[1366, 710], [390, 844]]) {
                    if (!widest) break;
                    await page.setViewportSize({ width, height });
                    await page.goto(`${base}/projects/${widest.slug}/`);
                    await slidesReady(page);
                    for (let i = 1; i < widest.n; i++) await page.keyboard.press('ArrowRight');
                    const at = await lie(page);
                    const set = at.sets[0];
                    const room = { width: width - 2 * (44 + (width <= 600 ? 0 : 30.25)), height: height - 79 - 63 };
                    const by = Math.abs(set.frame.width - room.width) <= EXACT ? 'width' : Math.abs(set.frame.height - room.height) <= EXACT ? 'height' : 'neither side';
                    told.push(`${width} × ${height}: ${set.frame.width.toFixed(2)} × ${set.frame.height.toFixed(2)} in ${room.width} × ${room.height}, limited by its ${by}`);
                    const off = set.current !== widest.n - 1 ? `photo ${set.current + 1} shows, not ${widest.n}` : Math.abs(set.a - widest.a) > 0.0001 ? `a photo of ${set.a}` : offDesign(set, at);
                    if (off || by !== (widest.a > room.width / room.height ? 'width' : 'height')) wrong.push(`${width} × ${height}: ${off || `limited by its ${by}`}`);
                }
                if (!widest) check('3. the widest photo: ok (client/slides.css names no photo; the check was skipped)', true);
                else check(`3. the widest photo is as large as fits, the side that limits it exactly on the limit, centred, without a border, the shadow around it, the chevrons beside it (${widest.slug}, ${widest.a} : 1; ${told.join('; ')})`, wrong.length === 0, wrong.join('; '));
                await page.setViewportSize({ width: 1366, height: 710 });
            }

            // Set by set, then the information: where the page rests, and what the header does meanwhile.
            const walked = multi ?? oneSet;
            if (walked) {
                const start = await open(walked);
                const stops = [];
                const header = [];
                const frames = [];
                const early = [];
                const note = (at, i) => {
                    if (at.head.top !== 0 || !at.headOnTop) header.push(`at ${at.y}: header top ${at.head.top}, Back and title ${at.headOnTop ? 'on top' : 'covered'}`);
                    if (i < at.sets.length) {
                        if (Math.abs(at.sets[i].top - at.head.bottom) > 1) stops.push(`set ${i + 1} rests at ${at.sets[i].top}, header to ${at.head.bottom}`);
                        const off = offDesign(at.sets[i], at);
                        if (off) frames.push(`set ${i + 1}: ${off}`);
                        if (at.info.top < at.vh - 0.5) early.push(`set ${i + 1} at rest: the information starts at ${at.info.top} in a window ${at.vh} tall`);
                    } else if (infoOff(at)) stops.push(infoOff(at));
                };
                note(start, 0);
                for (let i = 1; i <= start.sets.length; i++) note(await wheel(), i);
                const end = await lie(page);
                const back = await wheel(false);
                if (Math.abs(back.sets.at(-1).top - back.head.bottom) > 1) stops.push(`back up: the last set rests at ${back.sets.at(-1).top}`);
                check(`3. after a turn of the wheel the page rests with the next set directly under the header, and after the last set with the information: its top at 72px, the description's first line at 74px (${walked.data.slug}, ${start.sets.length} set${start.sets.length > 1 ? 's' : ''})`, start.mouse && start.snap.includes('mandatory') && stops.length === 0, start.mouse ? stops.join('; ') : 'this browser has no fine pointer: the page does not snap');
                check('3. nothing of the information is in the window while a set of photos is at rest', early.length === 0, early.join('; '));
                check('3. the header stays at the top of the window while the page scrolls, Back and the title on top', header.length === 0 && end.y > 0, header.join('; '));
                check('3. each set at rest fills the window under the header as the one slideshow does: the photo as large as fits, in the same place, without a border, the shadow around it, chevrons 28px either side, the caption 16px under it', frames.length === 0, frames.join('; '));
                // The header's own links are always in the window: reaching them with the keyboard must not move the
                // page (they lie in the band that html's scroll-padding calls out of view), and the browser's Back
                // after the title link returns to the set the visitor was on.
                await open(walked);
                await page.keyboard.press('End');
                await rest(page);
                const stood = await page.evaluate(() => scrollY);
                const tabbed = [];
                for (let i = 0; i < 2; i++) {
                    await page.keyboard.press('Tab');
                    await rest(page);
                    tabbed.push(await page.evaluate(() => `${document.activeElement?.closest('.project-head') ? 'a header link' : 'elsewhere'} at ${scrollY}`));
                }
                check('3. the keyboard reaching Back and the title in the header does not move the page', stood > 0 && tabbed.every(t => t === `a header link at ${stood}`), `at ${stood}; then ${tabbed.join(', ')}`);
                if (start.sets.length > 1) {
                    await open(walked);
                    const second = await wheel();
                    await page.click('.project-head h1 a');
                    await rest(page);
                    const there = await page.evaluate(() => scrollY);
                    await page.goBack();
                    await rest(page);
                    const returned = await page.evaluate(() => scrollY);
                    check('3. the browser\'s Back after the title link returns to the set the visitor was on', there > second.y && Math.abs(returned - second.y) <= 1, `on set 2 at ${second.y}, the title link to ${there}, Back to ${returned}`);
                }
            }

            if (!multi) check('3. sets: ok (no multi-set project in content; the checks that need two sets were skipped)', true);
            else {
                const want = setsOf(multi);
                const title = String(multi.data.title).trim();
                const start = await open(multi);
                const wrong = [];
                if (start.sets.length !== want.length) wrong.push(`${start.sets.length} slideshows for ${want.length} sets`);
                start.sets.forEach((set, i) => {
                    const files = want[i] ?? [];
                    if (set.count !== files.length || set.files.some((f, n) => !f.startsWith(`${stem(files[n] ?? { image: '?' })}.`))) wrong.push(`set ${i + 1} holds ${set.files.join(', ')}`);
                    if (set.shown !== 1 || set.current !== 0) wrong.push(`set ${i + 1} shows ${set.shown} photos, the current one number ${set.current + 1}`);
                    if (set.label !== `Photos of ${title}, set ${i + 1} of ${want.length}`) wrong.push(`set ${i + 1} is named "${set.label}"`);
                    if (i > 0 && set.top < start.sets[i - 1].bottom - 0.5) wrong.push(`set ${i + 1} overlaps the one before`);
                });
                check(`3. one slideshow per set, in set order, each with its own photos and showing its first (${multi.data.slug}: ${want.map(set => set.length).join(' + ')})`, wrong.length === 0, wrong.slice(0, 4).join('; '));

                const indexes = async () => (await lie(page)).sets.map(set => set.current);
                const only = (i, n) => want.map((_, k) => (k === i ? n : 0)).join();
                // A later set with photos to move through, if there is one.
                const later = want.findIndex((set, i) => i > 0 && set.length > 1);
                if (later < 0) check('3. sets: ok (no later set with more than one photo in content; its chevron check was skipped)', true);
                else {
                    await page.evaluate(i => document.querySelectorAll('project-slides')[i].scrollIntoView({ behavior: 'instant' }), later);
                    await rest(page);
                    await page.click(`project-slides:nth-of-type(${later + 1}) .current .next`);
                    const moved = (await indexes()).join();
                    const focus = await page.evaluate(i => document.activeElement?.closest('project-slides') === document.querySelectorAll('project-slides')[i] && document.activeElement.classList.contains('arrow'), later);
                    check(`3. the "next" chevron of set ${later + 1} moves set ${later + 1} only, and keeps focus on a chevron of that set`, moved === only(later, 1) && focus, moved);
                }

                // The arrow keys: the set in the middle of the window, and no other.
                const keyed = later > 0 ? later : 1;
                await open(multi);
                await page.evaluate(i => document.querySelectorAll('project-slides')[i].scrollIntoView({ behavior: 'instant' }), keyed);
                await rest(page);
                await page.keyboard.press('ArrowRight');
                const right = (await indexes()).join();
                await page.keyboard.press('ArrowLeft');
                const left = (await indexes()).join();
                check(`3. with set ${keyed + 1} in the window the arrow keys move that set and no other`, right === only(keyed, Math.min(1, want[keyed].length - 1)) && left === only(-1, 0), `${right} then ${left}`);
                await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
                await rest(page);
                await page.keyboard.press('ArrowRight');
                const first = (await indexes()).join();
                await page.click('.project-head h1 a');
                await rest(page);
                const there = await lie(page);
                const address = page.url();
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowLeft');
                await page.waitForTimeout(100);
                const after = (await indexes()).join();
                check('3. back at the top the keys move the first set; with the information in the window they move nothing and lead nowhere', first === only(0, Math.min(1, want[0].length - 1)) && infoOff(there) === '' && after === first && page.url() === address, `${first} then ${after}; ${infoOff(there)}; ${page.url()}`);
            }

            // A long information section is taller than a small window: all of it can be reached.
            if (longest) {
                await page.setViewportSize({ width: 720, height: 500 });
                await open(longest);
                // Here the page could scroll further than the section's top, so the link has to stop there itself.
                await page.click('.project-head h1 a');
                await rest(page);
                const linked = await lie(page);
                check('3. the title lands a long information section at rest, in one column with its top 88px from the top of the window (720 × 500)', infoOff(linked) === '' && linked.y > 0, `the information's top at ${linked.info.top}, ${Math.round(linked.max - linked.y)}px left to scroll`);
                await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
                await rest(page);
                let at = await lie(page);
                for (let i = 0, last = -1; i < 60 && at.y !== last; i++) { last = at.y; at = await wheel(); }
                const taller = at.info.height > at.vh - restAt(at) + 1;
                const reached = at.y >= at.max - 1 && at.info.bottom <= at.vh + 1;
                // Inside a section taller than the window the page scrolls freely: a small turn back stays where it stops.
                let free = true;
                if (taller && at.info.height - (at.vh - restAt(at)) > 90) {
                    await page.mouse.wheel(0, -60);
                    await rest(page);
                    const inside = await lie(page);
                    free = Math.abs(inside.y - (at.y - 60)) <= 1;
                }
                check(`3. the bottom of the longest information section can be reached by wheel at 720 × 500, and it scrolls freely inside (${longest.data.slug}: ${Math.round(at.info.height)}px${taller ? '' : ', not taller than the window'})`, reached && free, `rests at ${at.y} of ${at.max}, the section ends at ${at.info.bottom}`);
                // Page Up from the bottom of a section taller than the window stops at the section's top, as the
                // wheel does, instead of passing it and landing on the photos.
                if (taller) {
                    let up = at;
                    for (let i = 0; i < 8 && (i === 0 || up.info.top < restAt(up) - 1); i++) { await page.keyboard.press('PageUp'); await rest(page); up = await lie(page); }
                    check('3. Page Up through a long information section stops with its top at rest, not on the photos (720 × 500)', infoOff(up) === '', `the information's top at ${up.info.top}`);
                }
                await page.setViewportSize({ width: 1366, height: 710 });
            }

            // The information's layout (CLAUDE.md, "Project page"), on a project that has every part of it
            // and a neighbour on both sides: the one with the most to read.
            const whole = [...published]
                .filter(p => photos(p).length && factsOf(p).length === 4 && p.content.trim() && listed.indexOf(p.data.slug) > 0 && listed.indexOf(p.data.slug) < listed.length - 1)
                .sort((a, b) => b.content.length - a.content.length)[0];
            if (!whole) check('3. the information\'s layout: ok (no project in content has tags, a role, a client, years, a description and a neighbour on both sides; its checks were skipped)', true);
            else {
                const measure = () => page.evaluate(() => {
                    const box = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
                    const q = (sel) => document.querySelector(`#project-info ${sel}`);
                    const all = (sel) => [...document.querySelectorAll(sel.split(',').map(one => `#project-info ${one}`).join(','))];
                    // The baseline of an element's first line: where an empty inline-block at its start sits.
                    const baseline = (el) => { if (!el) return null; const probe = document.createElement('span'); probe.style.cssText = 'display:inline-block;width:0;height:0'; el.prepend(probe); const y = probe.getBoundingClientRect().bottom; probe.remove(); return y; };
                    const arrow = (side) => {
                        const a = q(`.neighbours .${side}`);
                        return a ? { ...box(a), svg: box(a.querySelector('svg')), href: a.getAttribute('href'), colour: getComputedStyle(a.querySelector('path')).stroke, parent: a.offsetParent?.id ?? '', position: getComputedStyle(a).position } : null;
                    };
                    const lines = all('.facts p');
                    return {
                        y: scrollY,
                        vw: document.documentElement.clientWidth,
                        vh: innerHeight,
                        wide: document.documentElement.scrollWidth,
                        centre: document.documentElement.clientWidth / 2,
                        info: box(document.querySelector('#project-info')),
                        facts: box(q('.facts')),
                        about: box(q('.about')),
                        desc: box(q('.description')),
                        first: box(q('.description p')),
                        lines: lines.map(p => ({ top: box(p).top, height: box(p).height })),
                        bases: [baseline(lines[0]), baseline(q('.description p'))],
                        labels: all('.label').map(l => `${l.textContent} ${getComputedStyle(l).fontWeight}`).join(', '),
                        heavy: all('.facts p, .description p').filter(p => getComputedStyle(p).fontWeight !== '300').length,
                        colours: [...new Set(all('.facts, .facts *, .about, .about *').map(el => getComputedStyle(el).color))].join(' / '),
                        ink: getComputedStyle(document.body).color,
                        slanted: all('.facts, .facts *').filter(el => getComputedStyle(el).transform !== 'none').length,
                        titles: all('h1, h2, h3, .row, .title').length,
                        prev: arrow('prev'),
                        next: arrow('next'),
                    };
                });
                const near = (a, b, by = 0.5) => Math.abs(a - b) <= by;
                const slug = whole.data.slug;
                const at = listed.indexOf(slug);

                // After the wheel, and after the title link: the same place.
                const start = await open(whole);
                for (let i = 0; i < start.sets.length; i++) await wheel();
                const m = await measure();
                await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
                await rest(page);
                await page.click('.project-head h1 a');
                await rest(page);
                const linked = await measure();
                check(`3. at 1366 × 710 the information is two columns from the page's centreline: the left one from 318px left of it, the description from 8px right of it and at most 312px wide (${slug})`,
                    near(m.facts.left, m.centre - 318) && m.facts.right <= m.centre + 0.5 && near(m.about.left, m.centre + 8) && near(m.desc.left, m.centre + 8) && m.desc.width <= 312.5 && m.desc.width > 300,
                    `left column ${m.centre - m.facts.left}px left of the centreline to ${m.facts.right - m.centre}px past it; description ${m.desc.left - m.centre}px right of it, ${m.desc.width}px wide`);
                check('3. at rest the description\'s first line box is 74px from the top of the window, after a turn of the wheel and after the title link alike, and the two columns\' first lines share a baseline',
                    near(m.first.top, 74) && near(linked.first.top, 74) && near(m.info.top, 72) && near(linked.info.top, 72) && near(m.bases[0], m.bases[1], 0.25) && m.facts.top >= m.info.top,
                    `after the wheel ${m.first.top}, after the link ${linked.first.top}; baselines at ${m.bases.join(' and ')}; the left column's top at ${m.facts.top}, the section's at ${m.info.top}`);
                // In line steps of 18.73px (the step in the owner's image; 1.4 × the 13.38px it was drawn at): how many each entry takes (one, or more where a long role
                // wraps) and how many are left empty before the next entry (none; one before the years).
                const step = 18.73;
                const takes = m.lines.map(l => l.height / step);
                const gaps = m.lines.slice(1).map((l, i) => (l.top - m.lines[i].top - m.lines[i].height) / step);
                check('3. the left column: "type:", "role:" and "for:" in Bold, colon and all, everything else Light, all of it and the description in the text colour, nothing slanted; lines 18.73px apart (an entry that wraps takes whole lines), the years one empty line under the rest',
                    m.labels === 'type: 700, role: 700, for: 700' && m.heavy === 0 && m.colours === m.ink && m.slanted === 0
                    && takes.length === 4 && takes.every(n => n > 0.99 && near(n, Math.round(n), 0.01)) && near(gaps[0], 0, 0.01) && near(gaps[1], 0, 0.01) && near(gaps[2], 1, 0.01),
                    `labels ${m.labels}; ${m.heavy} lines not Light; colours ${m.colours} (text ${m.ink}); ${m.slanted} slanted; entries of ${takes.map(n => n.toFixed(3)).join(', ')} lines, ${gaps.map(n => n.toFixed(3)).join(', ')} empty between them`);
                check('3. the project\'s title is in the page header only: the information has no heading and no title row', m.titles === 0 && await page.evaluate(() => document.querySelectorAll('h1').length) === 1, `${m.titles} in the information`);
                const placed = (a, side) => {
                    const off = [];
                    if (!a) return [`no ${side} arrow`];
                    if (!near(a.width, 44) || !near(a.height, 44)) off.push(`${side}: target ${a.width}×${a.height}`);
                    if (!near(a.svg.width, 16.5) || !near(a.svg.height, 19) || !near(a.svg.left - a.left, 13.75) || !near(a.svg.top - a.top, 12.5)) off.push(`${side}: chevron ${a.svg.width}×${a.svg.height}, ${a.svg.left - a.left} and ${a.svg.top - a.top} into its target`);
                    if (side === 'prev' && !near(m.centre - a.svg.right, 329)) off.push(`prev: its right edge ${m.centre - a.svg.right}px left of the centreline, not 329`);
                    if (side === 'next' && !near(a.svg.left - m.centre, 337)) off.push(`next: its left edge ${a.svg.left - m.centre}px right of the centreline, not 337`);
                    if (!near(a.svg.top + a.svg.height / 2, m.vh * 0.745)) off.push(`${side}: its middle at ${a.svg.top + a.svg.height / 2}, not ${m.vh * 0.745} (74.5% of the window)`);
                    if (a.colour !== 'rgb(153, 86, 122)') off.push(`${side}: colour ${a.colour}`);
                    if (a.parent !== 'project-info' || a.position !== 'absolute') off.push(`${side}: not placed in the section (${a.position}, in "${a.parent}")`);
                    return off;
                };
                const arrows = [...placed(m.prev, 'prev'), ...placed(m.next, 'next')];
                check('3. the two arrows: the photos\' 16.5 × 19 chevron in the link colour, centred in a 44 × 44 target, its edge 329px left and 337px right of the centreline, its middle at 74.5% of the window\'s height, scrolling with the section', arrows.length === 0, arrows.join('; '));

                // By keyboard: the arrow shows its focus; Enter follows it; the page it opens points back.
                let tabs = 0;
                while (tabs++ < 60 && !await page.evaluate(() => document.activeElement?.matches('.neighbours .next'))) await page.keyboard.press('Tab');
                const focus = await page.evaluate(() => { const a = document.activeElement; const s = getComputedStyle(a); return { on: a.matches('.neighbours .next:focus-visible'), outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}`, shown: a.getBoundingClientRect().top >= 0 && a.getBoundingClientRect().bottom <= innerHeight }; });
                await page.keyboard.press('Enter');
                await page.waitForURL(`**/projects/${listed[at + 1]}/`).catch(() => {});
                const went = new URL(page.url()).pathname;
                const backTo = await page.evaluate(() => document.querySelector('#project-info .neighbours .prev')?.getAttribute('href') ?? '');
                await page.click('#project-info .neighbours .prev');
                await page.waitForURL(`**/projects/${slug}/`).catch(() => {});
                const home = new URL(page.url()).pathname;
                check('3. the "next" arrow takes keyboard focus inside the window with the chevrons\' outline, Enter opens the next project in the Index\'s order, and that page\'s "previous" arrow leads back',
                    focus.on && focus.shown && focus.outline === 'solid 2px rgb(153, 86, 122) -6px' && went === `/projects/${listed[at + 1]}/` && backTo === `/projects/${slug}/` && home === `/projects/${slug}/`,
                    `${JSON.stringify(focus)}; opened ${went}; its previous arrow ${backTo}; then ${home}`);

                // Narrower: two columns from 760px, one below, and never a horizontal scroll.
                const widths = [];
                const shape = {};
                for (const width of [320, 360, 390, 600, 719, 720, 759, 760]) {
                    await page.setViewportSize({ width, height: 700 });
                    for (const p of [whole, published.find(q => q.data.slug === listed[0]), published.find(q => q.data.slug === listed.at(-1))]) {
                        await page.goto(`${base}/projects/${p.data.slug}/#project-info`);
                        await page.waitForTimeout(30);
                        const n = await measure();
                        if (n.wide > width) widths.push(`${p.data.slug} at ${width}px: ${n.wide}px wide`);
                        for (const a of [n.prev, n.next]) if (a && (a.left < 0 || a.right > width)) widths.push(`${p.data.slug} at ${width}px: an arrow outside the page`);
                        if (p === whole) shape[width] = n;
                    }
                }
                check('3. no horizontal scroll on a project page at 320, 360, 390, 600, 719, 720, 759 or 760px, the arrows inside the page (a project with both arrows, the first and the last)', widths.length === 0, widths.slice(0, 4).join('; '));
                const one = (n) => n.about.top >= n.facts.bottom && near(n.about.left, n.facts.left);
                const two = (n) => near(n.about.left, n.centre + 8) && near(n.facts.left, n.centre - 318) && near(n.about.top - n.facts.top, 1);
                check('3. the information is two columns from 760px and one column below, its text under Back: 37px from the page\'s edge from 720px, 16px below that',
                    two(shape[760]) && [759, 720, 719, 390].every(w => one(shape[w])) && near(shape[759].facts.left, 37) && near(shape[720].facts.left, 37) && near(shape[719].facts.left, 16),
                    [760, 759, 720, 719, 390].map(w => `${w}: left column at ${shape[w].facts.left}, description at ${shape[w].about.left} and ${shape[w].about.top - shape[w].facts.bottom} under it`).join('; '));
                const n = shape[390];
                check('3. at 390px the information is one column inside the page\'s 16px padding: type, role, for and years, then the description 24px under them, then the two arrows in a row under the text, previous at the left and next at the right, 44 × 44 each',
                    near(n.facts.left, 16) && near(n.about.left, 16) && n.about.right <= 390 - 16 + 0.5 && near(n.about.top - n.facts.bottom, 24)
                    && near(n.prev.top - n.about.bottom, 24) && near(n.prev.top, n.next.top) && near(n.prev.left, 16) && near(n.next.right, 390 - 16) && [n.prev, n.next].every(a => near(a.width, 44) && near(a.height, 44) && a.position !== 'absolute'),
                    JSON.stringify({ facts: n.facts.left, about: [n.about.left, n.about.right], gap: n.about.top - n.facts.bottom, prev: [n.prev.left, n.prev.top - n.about.bottom], next: [n.next.right, n.next.top - n.about.bottom] }));
                await page.setViewportSize({ width: 1366, height: 710 });
            }

            // A page opened at #project-info (a link from elsewhere, an address): the browser sets off
            // for the information before the sets are defined, the page then gets shorter, and the page's
            // script lands it again. On the project with the most to read, whose information is taller
            // than the window: a scroll that only stopped at the end of the page would leave its first
            // lines under the header.
            if (longest) {
                const landed = [];
                for (const height of [710, 650]) {
                    await page.setViewportSize({ width: 1366, height });
                    await page.goto('about:blank');
                    await page.goto(`${base}/projects/${longest.data.slug}/#project-info`);
                    await slidesReady(page);
                    await rest(page);
                    const at = await lie(page);
                    landed.push({ height, off: infoOff(at), over: Math.round(at.info.height - (at.vh - restAt(at))) });
                }
                check(`3. a project page opened at #project-info comes to rest as after the title link, the information's top at 72px and the description's first line at 74px (1366 × 710 and 1366 × 650; ${longest.data.slug}, its information ${landed.map(l => `${Math.max(0, l.over)}px`).join(' and ')} taller than the window allows)`,
                    landed.every(l => l.off === ''), landed.filter(l => l.off).map(l => `at 1366 × ${l.height}: ${l.off}`).join('; '));
            }

            // A project with no photos: the information is all there is under the header. It lies where
            // it rests after the photos, and the page is no taller for it than the window: nothing to
            // scroll. (If every project has photos, one of them with its sets taken out of the page.)
            {
                const bare = published.find(p => !photos(p).length && (factsOf(p).length || p.content.trim()));
                const stand = bare ?? longest;
                if (stand) {
                    const wrong = [];
                    for (const [width, height] of [[1366, 710], [390, 844]]) {
                        await page.setViewportSize({ width, height });
                        await page.goto('about:blank');
                        await page.goto(`${base}/projects/${stand.data.slug}/`);
                        if (!bare) {
                            await slidesReady(page);
                            await page.evaluate(() => { for (const el of document.querySelectorAll('project-slides')) el.remove(); scrollTo({ top: 0, behavior: 'instant' }); });
                        }
                        await page.mouse.move(width / 2, 400);
                        await rest(page);
                        const at = await lie(page);
                        const tall = at.max + at.vh;
                        const end = at.y + at.info.bottom;
                        if (at.y !== 0) wrong.push(`${width} × ${height}: the page comes to rest ${at.y}px down`);
                        if (Math.abs(tall - Math.max(at.vh, end)) > 1) wrong.push(`${width} × ${height}: the page is ${tall}px tall, the window ${at.vh}px, and the information ends at ${end}`);
                        if (width >= 760 ? infoOff(at) : Math.abs(at.info.top - at.head.bottom) > 0.5) wrong.push(`${width} × ${height}: ${width >= 760 ? infoOff(at) : `the information's top at ${at.info.top}, the header to ${at.head.bottom}`}`);
                        // In one column it is as tall as its text and no taller: under a header of two lines a
                        // screen's worth of minimum height would be more than the window has left.
                        const least = await page.evaluate(() => getComputedStyle(document.querySelector('#project-info')).minHeight);
                        if (width < 760 && least !== '0px') wrong.push(`${width} × ${height}: the information is at least ${least} tall, whatever its text`);
                    }
                    check(`3. a project with no photos does not scroll for its information: at 1366 × 710 it lies at rest, its top at 72px, in a page no taller than the window or than its text; at 390 × 844 it follows the header, as tall as its text and no taller, and the page ends with it (${bare ? bare.data.slug : `${stand.data.slug}, its sets taken out`})`, wrong.length === 0, wrong.join('; '));
                }
            }

            // Where a title wraps (the longest one, at 320px) the header is a line taller. The information
            // still rests clear of the header's ground colour, which ends 8px above its lower edge.
            {
                const wordy = published.filter(p => photos(p).length && factsOf(p).length).sort((a, b) => text(b.data.title).length - text(a.data.title).length)[0];
                if (wordy) {
                    await page.setViewportSize({ width: 320, height: 568 });
                    await page.goto('about:blank');
                    await page.goto(`${base}/projects/${wordy.data.slug}/`);
                    await slidesReady(page);
                    await page.click('.project-head h1 a');
                    await rest(page);
                    const at = await lie(page);
                    const first = await page.evaluate(() => document.querySelector('#project-info .facts p').getBoundingClientRect().top);
                    check(`3. at 320px the title link leaves the information's first line clear of the header, also where the title takes two lines (${wordy.data.slug}: the header is ${at.head.bottom}px tall, its ground colour ends at ${at.head.bottom - 8}px, the first line starts at ${first}px)`,
                        infoOff(at) === '' && first >= at.head.bottom - 8, infoOff(at));
                }
            }
            await page.setViewportSize({ width: 1366, height: 710 });
        }

        // 6. the Index's proportions at the design's width
        {
            await page.setViewportSize({ width: 1366, height: 710 });
            await page.goto(`${base}/`);
            await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
            const m = await page.evaluate(({ shadow, exact }) => {
                const box = (el) => el.getBoundingClientRect();
                const cells = [...document.querySelectorAll('project-index .cell')];
                const rows = [...document.querySelectorAll('project-index .row')];
                const page = document.documentElement.clientWidth;
                const cell = box(cells[0]);
                // Nothing has a border, the pictures' boxes included; a shadow is the pictures' alone.
                const lines = [...document.querySelectorAll('.site-head, .site-head *, project-index, project-index *')].filter((el) => {
                    const s = getComputedStyle(el);
                    return parseFloat(s.borderTopWidth) + parseFloat(s.borderRightWidth) + parseFloat(s.borderBottomWidth) + parseFloat(s.borderLeftWidth) > 0 || (!el.classList.contains('box') && s.boxShadow !== 'none');
                }).length;
                // A thumbnail's box (`.box`, a name from when it had a border) is the picture: as large as fits 91%
                // of the cell's width and 86.5% of its height (49.9733% of its width), one of the two exactly.
                const thumbs = cells.filter(c => c.querySelector('.box')).map((c) => {
                    const a = box(c);
                    const b = box(c.querySelector('.box'));
                    const img = c.querySelector('img');
                    const im = box(img);
                    const s = getComputedStyle(c.querySelector('.box'));
                    const wrong = [];
                    if (b.width > a.width * 0.91 + exact || b.height > a.width * 0.499733 + exact) wrong.push(`larger than fits (${b.width} × ${b.height})`);
                    if (Math.abs(b.width - a.width * 0.91) > exact && Math.abs(b.height - a.width * 0.499733) > exact) wrong.push(`neither side on its limit (${b.width} × ${b.height} in ${a.width * 0.91} × ${a.width * 0.499733})`);
                    if (Math.abs((b.x + b.width / 2) - (a.x + a.width / 2)) >= 0.5 || Math.abs((b.y + b.height / 2) - (a.y + a.height / 2)) >= 0.5) wrong.push('not centred');
                    if (Math.abs(b.width / b.height - img.getAttribute('width') / img.getAttribute('height')) >= 0.01 || Math.abs(im.width - b.width) > 0.5 || Math.abs(im.height - b.height) > 0.5) wrong.push('cropped, or not filling its box');
                    if (getComputedStyle(img).objectFit !== 'fill') wrong.push(`object-fit: ${getComputedStyle(img).objectFit}`);
                    if (!['Top', 'Right', 'Bottom', 'Left'].every(k => s[`border${k}Width`] === '0px')) wrong.push(`a border (${s.borderTopWidth})`);
                    if (s.boxShadow !== shadow) wrong.push(`shadow ${s.boxShadow}`);
                    return wrong.length ? `${c.dataset.slug}: ${wrong.join(', ')}` : '';
                }).filter(Boolean);
                const body = getComputedStyle(document.body);
                return {
                    quarter: Math.abs(cell.width - page / 4) < 0.5,
                    ratio: Math.abs(cell.width / cell.height - 341.2 / 197.12) < 0.005,
                    row: rows.every(r => Math.abs(box(r).height - 23) < 0.1),
                    columns: Math.abs(box(cells[1]).x - cell.width) < 0.5 && Math.abs(box(cells[2]).y - cell.y - cell.height) < 0.5,
                    count: cells.filter(c => c.querySelector('.box')).length,
                    thumbs,
                    sized: cells.filter(c => c.querySelector('.box')).map(c => ({ name: c.dataset.slug, width: box(c.querySelector('.box')).width, sizes: [c.querySelector('img').getAttribute('sizes'), c.querySelector('source')?.getAttribute('sizes') ?? null] })),
                    vw: innerWidth,
                    vh: innerHeight,
                    scrolls: document.documentElement.scrollHeight <= innerHeight,
                    lines,
                    body: [body.fontSize, body.lineHeight, body.fontWeight].join(' / '),
                    rows: [...new Set(rows.map(r => [getComputedStyle(r).fontSize, getComputedStyle(r).lineHeight].join(' / ')))].join(', '),
                };
            }, { shadow: SHADOW, exact: EXACT });
            check('6. at 1366px a cell is a quarter of the page, two to a row, and every list row is 23px tall', m.quarter && m.ratio && m.row && m.columns, JSON.stringify(m));
            check(`6. every thumbnail is whole, centred, without a border, with the shadow, filling its box edge to edge, and as large as its cell allows: the side that limits it is exactly on its limit (${m.count} thumbnails)`, m.count > 0 && m.thumbs.length === 0, m.thumbs.slice(0, 5).join(' | '));
            {
                const off = sizesOff(m.sized, m.vw, m.vh);
                check(`6. every thumbnail's sizes attribute gives the width it is shown at, to the pixel (${m.sized.length} thumbnails)`, m.sized.length > 0 && off.length === 0, off.slice(0, 3).join(' | '));
            }
            check('6. the two columns scroll on their own, and nothing draws a line: no element has a border, and only the pictures have a shadow', m.scrolls && m.lines === 0, JSON.stringify({ scrolls: m.scrolls, lines: m.lines }));
            check('6. the type is 13px on a 16px line, Light, in the list\'s rows as on the page', m.body === BODY && m.rows === '13px / 16px', `body ${m.body}; rows ${m.rows}`);

            // A column scrolled to its end, then filtered down to something that no longer scrolls: no thumb left behind.
            await page.setViewportSize({ width: 1366, height: 710 });
            const rare = [...counts].filter(([, n]) => n <= 2).map(([t]) => t)[0];
            if (rare && await page.evaluate(() => CSS.supports('animation-timeline: scroll()'))) {
                const thumbs = () => page.evaluate(() => [...document.querySelectorAll('project-index .thumb')].map(t => getComputedStyle(t).visibility));
                await page.evaluate(() => { for (const el of document.querySelectorAll('project-index .scroll, project-index .rows')) el.scrollTop = el.scrollHeight; });
                await page.waitForTimeout(100);
                const atEnd = await thumbs();
                await page.evaluate((t) => document.querySelector(`project-index .tag[data-tag="${CSS.escape(t)}"]`).click(), rare);
                await page.waitForTimeout(150);
                const after = await thumbs();
                check('6. the scroll thumbs show while a column scrolls and go when a filter leaves nothing to scroll', atEnd.every(v => v === 'visible') && after.every(v => v === 'hidden'), `${atEnd.join(',')} → ${after.join(',')}`);
            }

            // The list from 720px up: three rigid columns, every row one line. CLAUDE.md, "Index": the date starts
            // 1.676% of the page (at least 12px) from the list's edge, in a column as wide as the widest date
            // printed plus 32.2px (5px of air and the 27.2px the hover chevron takes), never more than 40% of
            // the list; what is left before the 16px right padding is the title's column and the type's,
            // 11 : 10, 15px apart. A column cuts its text and fades it out over its last 1em (13px); text that
            // ends before the fade is left alone, text that reaches it slides left at 100px a second while its
            // row is pointed at, until its end is clear of the fade, and goes back in 0.2s. The dates are
            // Light and the titles Bold, in the text colour both.
            const FADE = 13;
            const show = async (width, height) => {
                await page.setViewportSize({ width, height });
                await page.mouse.move(1, 1);
                await page.goto(`${base}/`);
                await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
                await page.evaluate(() => document.fonts.ready.then(() => true));
            };
            // The list as it lies: every row with its date, its chevron and its columns. A column's `start`
            // is where its text begins against the column's left edge: 0 at rest, negative once it has slid
            // (or been scrolled). The slanted types' box is wider than their layout by the lean on each side.
            const list = () => page.evaluate(() => {
                const px = (v) => parseFloat(v) || 0;
                const index = document.querySelector('project-index .index').getBoundingClientRect();
                return {
                    page: document.documentElement.clientWidth,
                    left: index.left,
                    width: index.width,
                    slot: 23,
                    ground: getComputedStyle(document.body).backgroundColor.match(/\d+/g).slice(0, 3).map(Number),
                    rows: [...document.querySelectorAll('project-index .row')].map((r) => {
                        const b = r.getBoundingClientRect();
                        const years = r.querySelector('.years').getBoundingClientRect();
                        const what = r.querySelector('.what');
                        const before = getComputedStyle(what, '::before');
                        const dateText = document.createRange();
                        dateText.selectNodeContents(r.querySelector('.years'));
                        return {
                            slug: r.dataset.slug,
                            top: b.top,
                            bottom: b.bottom,
                            height: b.height,
                            on: r.classList.contains('on'),
                            date: years.left,
                            type: [r.querySelector('.years'), r.querySelector('.title')].map(el => `${getComputedStyle(el).fontWeight} ${getComputedStyle(el).fontSize} ${getComputedStyle(el).color}`).join(' | '),
                            dateWidth: dateText.getBoundingClientRect().width,
                            dateLines: years.height / px(getComputedStyle(r).lineHeight),
                            // The chevron's box: from the title column's left edge, and its middle from the row's.
                            chevron: before.content === 'none' ? null : {
                                left: px(before.left),
                                width: px(before.width),
                                height: px(before.height),
                                middle: what.getBoundingClientRect().top + px(before.top) + px(before.height) / 2 - (b.top + b.height / 2),
                                colour: before.backgroundColor,
                            },
                            cells: [...r.querySelectorAll('.clip')].map((c) => {
                                const line = c.querySelector('.line');
                                const cs = getComputedStyle(c);
                                const ls = getComputedStyle(line);
                                const cb = c.getBoundingClientRect();
                                const lb = line.getBoundingClientRect();
                                const text = px(ls.width);
                                const lean = (lb.width - text - px(ls.paddingRight)) / 2;
                                const left = cb.left + px(cs.paddingLeft);
                                return {
                                    left,
                                    room: px(cs.paddingLeft),
                                    right: cb.right,
                                    width: cb.right - left,
                                    text,
                                    start: lb.left + lean - left,
                                    lines: px(ls.height) / px(ls.lineHeight),
                                    middle: lb.top + lb.height / 2 - (b.top + b.height / 2),
                                    cut: cs.overflowX,
                                    mask: cs.maskImage,
                                    colour: ls.color.match(/\d+/g).slice(0, 3).map(Number),
                                    tags: [...c.querySelectorAll('.tag')].map((t) => { const tb = t.getBoundingClientRect(); return { tag: t.dataset.tag, left: tb.left - left, right: tb.right - left, top: tb.top - cb.top, bottom: cb.bottom - tb.bottom }; }),
                                };
                            }),
                        };
                    }),
                };
            });
            const row = async (slug) => (await list()).rows.find(r => r.slug === slug);
            // The pointer on a row (on its date, so on no link and no tag), the row brought into its column's window first.
            const spot = (slug) => page.evaluate((slug) => {
                const r = document.querySelector(`#row-${slug}`);
                r.scrollIntoView({ block: 'center', behavior: 'instant' });
                const b = r.querySelector('.years').getBoundingClientRect();
                return { x: b.left + 4, y: b.top + b.height / 2 };
            }, slug);
            const pointAt = async (slug) => {
                const at = await spot(slug);
                await page.mouse.move(at.x, at.y);
            };
            // The middle of a tag of a row as it lies now (of what shows of it at rest, for one longer than its column).
            const tagSpot = (slug, n) => page.evaluate(({ slug, n, FADE }) => {
                const r = document.querySelector(`#row-${slug}`);
                r.scrollIntoView({ block: 'center', behavior: 'instant' });
                const tag = r.querySelectorAll('.tag')[n];
                const b = tag.getBoundingClientRect();
                const right = Math.min(b.right, tag.closest('.clip').getBoundingClientRect().right - FADE);
                return { tag: tag.dataset.tag, x: (b.left + right) / 2, y: b.top + b.height / 2 };
            }, { slug, n, FADE });
            const filteredBy = (tag) => page.waitForFunction((t) => new URLSearchParams(location.search).get('filter') === t, tag, { timeout: 5000 }).then(() => true, () => false);
            const travelled = (slug, i) => page.evaluate(({ slug, i }) => parseFloat(getComputedStyle(document.querySelectorAll(`#row-${slug} .clip`)[i].querySelector('.line')).getPropertyValue('--index-slid')) || 0, { slug, i });
            // One column of a row, frame by frame from now on: [the page's animation clock, the column's `start`].
            // Until the text has moved and then stood still for 20 frames ('stopped'), or until a text
            // would have travelled `until` px (the registered length that drives the slide); 15s at most.
            const follow = (slug, i, until) => page.evaluate(({ slug, i, until }) => new Promise((resolve) => {
                const px = (v) => parseFloat(v) || 0;
                const cell = document.querySelectorAll(`#row-${slug} .clip`)[i];
                const line = cell.querySelector('.line');
                const samples = [];
                const from = performance.now();
                let still = 0;
                const frame = () => {
                    const ls = getComputedStyle(line);
                    const lb = line.getBoundingClientRect();
                    const lean = (lb.width - px(ls.width) - px(ls.paddingRight)) / 2;
                    const start = lb.left + lean - cell.getBoundingClientRect().left - px(getComputedStyle(cell).paddingLeft);
                    still = samples.length && Math.abs(samples.at(-1)[1] - start) < 0.01 ? still + 1 : 0;
                    samples.push([document.timeline.currentTime, start]);
                    const done = until === 'stopped' ? Math.abs(start) > 0.5 && still >= 20 : px(ls.getPropertyValue('--index-slid')) >= until;
                    if (done || performance.now() - from > 15000) resolve(samples);
                    else requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            }), { slug, i, until });
            // The way back, by its own event: how long the transition that takes the text home ran.
            const home = (slug, i) => page.evaluate(({ slug, i }) => new Promise((resolve) => {
                const line = document.querySelectorAll(`#row-${slug} .clip`)[i].querySelector('.line');
                const give = setTimeout(() => resolve(-1), 10000);
                line.addEventListener('transitionend', (e) => {
                    if (e.target !== line || e.propertyName !== '--index-keep') return;
                    clearTimeout(give);
                    resolve(e.elapsedTime);
                });
            }), { slug, i });
            // One column of a row on tape, frame by frame, until taken off: [the animation clock, `start`, the share
            // of the slide that shows (1 while the row is pointed at, down to 0 on the way home)].
            const tape = (slug, i) => page.evaluate(({ slug, i }) => {
                const px = (v) => parseFloat(v) || 0;
                const cell = document.querySelectorAll(`#row-${slug} .clip`)[i];
                const line = cell.querySelector('.line');
                const samples = [];
                window.__tape = { on: true, samples };
                const frame = () => {
                    if (!window.__tape.on) return;
                    const ls = getComputedStyle(line);
                    const lb = line.getBoundingClientRect();
                    const lean = (lb.width - px(ls.width) - px(ls.paddingRight)) / 2;
                    samples.push([document.timeline.currentTime, lb.left + lean - cell.getBoundingClientRect().left - px(getComputedStyle(cell).paddingLeft), px(ls.getPropertyValue('--index-keep'))]);
                    requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            }, { slug, i });
            const untape = () => page.evaluate(() => { window.__tape.on = false; return window.__tape.samples; });
            // On the way home: resolves once less than three quarters of the slide show (5s at most).
            const partWay = (slug, i) => page.evaluate(({ slug, i }) => new Promise((resolve) => {
                const line = document.querySelectorAll(`#row-${slug} .clip`)[i].querySelector('.line');
                const from = performance.now();
                const frame = () => {
                    const keep = parseFloat(getComputedStyle(line).getPropertyValue('--index-keep'));
                    if (keep < 0.75 || performance.now() - from > 5000) resolve(keep);
                    else requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            }), { slug, i });
            // The ink in three strips of a column of a row at rest, each as the furthest any pixel is from the
            // ground colour (0 to 255): the 17px of text before the fade, the last 5px of the fade (at most
            // 5/13 of the ink left there), and the 7px after the column's edge.
            const inkAt = async (r, cell, ground) => {
                const edge = Math.floor(cell.right);
                const clip = { x: edge - 30, y: Math.ceil(r.top), width: 38, height: Math.floor(r.bottom) - Math.ceil(r.top) };
                const { data, info } = await sharp(await page.screenshot({ clip })).raw().toBuffer({ resolveWithObject: true });
                const most = (x0, x1) => {
                    let ink = 0;
                    for (let y = 0; y < info.height; y++) for (let x = x0; x < x1; x++) for (let c = 0; c < 3; c++) ink = Math.max(ink, Math.abs(data[(y * info.width + x) * info.channels + c] - ground[c]));
                    return ink;
                };
                return { text: most(0, 17), fade: most(25, 30), after: most(31, 38) };
            };

            // The mask takes nothing off text that is not cut. Its opaque part starts 1px before the column:
            // a column starts on a fraction of a pixel, and a hard stop on that very edge erased the pixels
            // in which a bullet or a first letter begins (most at 1536px). Every row is in the window; each
            // column, from its ring room to its end (to where its fade begins when its text is cut), is
            // the same picture with the mask and with a mask that hides nothing put in its place for the
            // test. (Not with no mask at all: on some systems a browser smooths text under a mask in another
            // way than text on the plain ground, GitHub's runners among them, and then every letter differs.)
            for (const width of [1366, 1536]) {
                await show(width, 88 + published.length * 23 + 40);
                const m = await list();
                const shot = async () => sharp(await page.screenshot()).raw().toBuffer({ resolveWithObject: true });
                const masked = await shot();
                const bared = await page.addStyleTag({ content: 'project-index .clip { -webkit-mask: linear-gradient(#000, #000) !important; mask: linear-gradient(#000, #000) !important; }' });
                const bare = await shot();
                await bared.evaluate(el => el.remove());
                const at = (img, x, y) => [0, 1, 2].map(c => img.data[(y * img.info.width + x) * img.info.channels + c]);
                const apart = (a, b) => Math.max(...a.map((v, c) => Math.abs(v - b[c])));
                let differ = 0;
                let ink = 0;
                const where = new Set();
                for (const r of m.rows) {
                    for (const c of r.cells) {
                        const x0 = Math.floor(c.left - c.room) - 1;
                        const x1 = c.text <= c.width - FADE + 0.01 ? Math.ceil(c.right) : Math.floor(c.right - FADE) - 1;
                        for (let y = Math.ceil(r.top); y < Math.floor(r.bottom); y++) {
                            for (let x = x0; x < x1; x++) {
                                if (apart(at(masked, x, y), at(bare, x, y)) > 2) { differ++; where.add(r.slug); }
                                if (x >= Math.floor(c.left) && x < Math.floor(c.left) + 3 && apart(at(bare, x, y), m.ground) > 24) ink++;
                            }
                        }
                    }
                }
                check(`6. at ${width}px the columns' mask takes nothing off text that is not cut: not a pixel of a bullet or of a first letter on a column's left edge`,
                    m.rows.length === published.length && m.rows.at(-1).bottom <= masked.info.height && ink > 0 && differ === 0, `${differ} pixels differ in ${[...where].slice(0, 5).join(', ')}; ${ink} inked pixels on the columns' first 3px`);
            }

            // The date column, at every width, the phone's one column included: as wide as the widest date
            // the list prints plus 32.2px (5px of air, then the 27.2px the hover chevron takes), the same in
            // every row. The width comes from a text the build writes (--dates, every date a line) and each
            // row prints unseen after its own date, so it follows the content with no script and does not
            // depend on the rows a filter leaves.
            const dateCells = () => page.evaluate(() => {
                const px = (v) => parseFloat(v) || 0;
                const index = document.querySelector('project-index .index').getBoundingClientRect();
                const scroller = document.querySelector('project-index .rows');
                return {
                    page: document.documentElement.clientWidth,
                    left: index.left,
                    width: index.width,
                    sizer: getComputedStyle(document.querySelector('project-index .years'), '::after').content,
                    // What the list scrolls over, against its rows (side by side); the page's end against the list's (below 720px).
                    scrolls: scroller.scrollHeight - Math.max(scroller.clientHeight, [...scroller.children].reduce((sum, r) => sum + r.getBoundingClientRect().height, 0)),
                    under: document.documentElement.scrollHeight - (document.querySelector('project-index .index').getBoundingClientRect().bottom + scrollY),
                    sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                    rows: [...document.querySelectorAll('project-index .row')].map((r) => {
                        const years = r.querySelector('.years');
                        const box = years.getBoundingClientRect();
                        const text = document.createRange();
                        text.selectNodeContents(years);
                        const tb = text.getBoundingClientRect();
                        const after = getComputedStyle(years, '::after');
                        const what = r.querySelector('.what');
                        const before = getComputedStyle(what, '::before');
                        return {
                            slug: r.dataset.slug,
                            height: r.getBoundingClientRect().height,
                            date: box.left,
                            boxRight: box.right,
                            boxLines: box.height / px(getComputedStyle(years).lineHeight),
                            text: tb.width,
                            textRight: tb.right,
                            textLines: new Set([...text.getClientRects()].map(c => Math.round(c.top))).size,
                            // How far the date's line is under the first line of its title: they are one line.
                            level: tb.height ? tb.top - r.querySelector('.title').getClientRects()[0].top : 0,
                            title: what.getBoundingClientRect().left,
                            chevron: before.content === 'none' ? null : what.getBoundingClientRect().left + px(before.left),
                            tags: [...r.querySelectorAll('.tag')].map(t => t.dataset.tag),
                            // The unseen text: generated, so no node; no height; hidden, so not read out.
                            unseen: `${after.height} ${after.visibility} ${after.whiteSpace}`,
                            nodes: years.childNodes.length === 0 ? '' : years.childNodes.length === 1 && years.firstChild.nodeType === 3 ? years.textContent : `${years.childNodes.length} nodes`,
                            read: years.innerText,
                        };
                    }),
                };
            });
            const inset = (m) => (m.page >= 720 ? Math.max(m.page * 0.01676, 12) : 16);
            // The rows whose title's column is not `column` px after the date, or whose date is not at the row's inset.
            const strays = (m, column) => m.rows.filter(r => Math.abs(r.title - r.date - column) > 0.5 || Math.abs(r.date - (m.left + inset(m))) > 0.5);
            const say = (rows) => rows.slice(0, 3).map(r => `${r.slug}: date at ${r.date}, title ${(r.title - r.date).toFixed(2)}px after it`).join('; ');
            // Every project's date as the list prints it: short, and white space one space (a date typed with two
            // spaces between its years prints with one, and --dates carries it with one).
            const printedDates = Object.fromEntries(published.map(p => [p.data.slug, spaced(shortYears(text(p.data.years)))]));
            // The made-up rule of the escaping check again, now read by the browser: put in the page in place
            // of the built one, the unseen text of a date cell is the made-up dates as they were given, and
            // the rule written after it still holds (the string ended where it should).
            {
                await show(1366, 710);
                const style = await page.addStyleTag({ content: `${madeUpCss}project-index{--after:ok}` });
                const read = await page.evaluate(() => ({
                    content: getComputedStyle(document.querySelector('project-index .years'), '::after').content,
                    after: getComputedStyle(document.querySelector('project-index')).getPropertyValue('--after').trim(),
                }));
                await style.evaluate(el => el.remove());
                const lines = cssText(read.content).split('\n');
                check('6. the browser reads that rule as the dates it was made from (the double quote, the backslash, the line break as a space, the text that would end a rule), and the rule after it still holds',
                    JSON.stringify(lines) === JSON.stringify(madeUpDates) && read.after === 'ok', `${read.content} reads as ${JSON.stringify(lines)}; the rule after it: ${read.after || 'lost'}`);
            }
            const ax = await page.context().newCDPSession(page);
            for (const [width, height] of [[390, 844], [720, 800], [1024, 768], [1366, 710], [1920, 1080]]) {
                await show(width, height);
                const m = await dateCells();
                const widest = Math.max(...m.rows.map(r => r.text));
                const column = widest + 32.2;
                const off = strays(m, column);
                check(`6. at ${width}px every row's date column is the widest date printed (${widest.toFixed(2)}px) plus 32.2px: the date at ${(m.left + inset(m)).toFixed(1)}, the title's column ${column.toFixed(2)}px after it, in all ${m.rows.length} rows`,
                    m.rows.length === published.length && widest > 0 && off.length === 0, say(off));

                // The text that sizes the column: every date the list prints, each once; it takes no height (a
                // date cell is one line tall, its date on the first line of its title as ever, and nothing is
                // added to what the list or the page scrolls over),
                // it is no node of the page (a date cell holds its own date and nothing else), and it is not
                // read out: the accessibility tree has each row's date once and the sizing text nowhere.
                const lines = cssText(m.sizer).split('\n');
                const want = [...new Set(m.rows.map(r => printedDates[r.slug]).filter(Boolean))];
                const high = m.rows.filter(r => r.unseen !== '0px hidden pre' || Math.abs(r.boxLines - 1) > 0.01 || Math.abs(r.level) > 1 || (width >= 720 && Math.abs(r.height - 23) > 0.05));
                const overflow = width >= 720 ? m.scrolls : m.under;
                check(`6. at ${width}px the text that sizes the date column is every date the list prints (${want.length}), a date to a line, and takes no height: a date cell is one line tall, its date level with its title, and neither the list nor the page scrolls over more than its rows`,
                    JSON.stringify(lines) === JSON.stringify(want) && high.length === 0 && Math.abs(overflow) <= 1 && m.sideways <= 0,
                    `${JSON.stringify(lines)}; ${high.slice(0, 3).map(r => `${r.slug}: ${r.unseen}, ${r.boxLines} lines, the date ${r.level}px under its title's line, row ${r.height}px`).join('; ')}; ${overflow}px more to scroll over, ${m.sideways}px sideways`);
                const inDom = m.rows.filter(r => spaced(r.nodes) !== printedDates[r.slug] || spaced(r.read) !== printedDates[r.slug]);
                const { nodes } = await ax.send('Accessibility.getFullAXTree');
                const said = nodes.filter(n => !n.ignored && n.role?.value === 'StaticText').map(n => spaced(n.name?.value ?? ''));
                const count = (list, d) => list.filter(t => t === d).length;
                const dates = m.rows.map(r => printedDates[r.slug]).filter(Boolean);
                const extra = want.filter(d => count(said, d) !== count(dates, d)).map(d => `${d}: ${count(said, d)} times for ${count(dates, d)} rows`);
                const whole = nodes.filter(n => !n.ignored && want.length > 1 && spaced(n.name?.value ?? '').includes(spaced(lines.join(' ')))).length;
                check(`6. at ${width}px that text is not in the DOM (every date cell holds its own date, one text node, and reads as it) and is not read out: the accessibility tree has each date once per row that prints it and the sizing text nowhere`,
                    inDom.length === 0 && said.length > dates.length && extra.length === 0 && whole === 0,
                    `${inDom.slice(0, 3).map(r => `${r.slug}: ${r.nodes} / ${r.read}`).join('; ')} ${extra.slice(0, 4).join('; ')}; the whole text in ${whole} nodes`);

                // Pointed at, the row with the widest date: its chevron starts 5px after the date's end, 27.2px
                // (its 14px box, then 13.2px) before the title's column.
                const longest = m.rows.find(r => r.text === widest);
                await pointAt(longest.slug);
                await page.waitForFunction((slug) => getComputedStyle(document.querySelector(`#row-${slug} .what`), '::before').content !== 'none', longest.slug, { timeout: 5000 }).catch(() => {});
                const pointed = (await dateCells()).rows.find(r => r.slug === longest.slug);
                check(`6. at ${width}px the chevron of the row with the widest date is 5px clear of that date and 14px before the title's column (${longest.slug})`,
                    pointed.chevron !== null && Math.abs(pointed.chevron - pointed.textRight - 5) <= 0.5 && Math.abs(pointed.title - pointed.chevron - 27.2) <= 0.01,
                    `the date ends at ${pointed.textRight}, the chevron's box starts at ${pointed.chevron}, the title's column at ${pointed.title}`);
                await page.mouse.move(1, 1);

                // A filter that hides every row with the widest date: the rows it leaves keep their columns.
                const narrow = (t) => m.rows.filter(r => r.tags.includes(t)).every(r => r.text < widest - 1);
                const hiding = [...counts].sort((a, b) => b[1] - a[1]).map(([t]) => t).find(narrow);
                if (!hiding) check(`6. at ${width}px: ok (every tag has a row with the widest date; the check of a filter that hides it was skipped)`, true);
                else {
                    await page.evaluate((t) => document.querySelector(`project-index .tag[data-tag="${CSS.escape(t)}"]`).click(), hiding);
                    const applied = await filteredBy(hiding);
                    const left = await dateCells();
                    const was = new Map(m.rows.map(r => [r.slug, r]));
                    const moved = left.rows.filter(r => Math.abs(r.date - was.get(r.slug).date) > 0.01 || Math.abs(r.title - was.get(r.slug).title) > 0.01);
                    const now = Math.max(...left.rows.map(r => r.text));
                    check(`6. at ${width}px the columns do not move when a filter hides every row with the widest date (${hiding}: ${left.rows.length} of ${m.rows.length} rows left, their widest date ${now.toFixed(2)}px): the column is still ${column.toFixed(2)}px`,
                        applied && left.rows.length > 0 && left.rows.length < m.rows.length && now < widest - 1 && moved.length === 0 && strays(left, column).length === 0, `${say(moved)} ${say(strays(left, column))}`);
                    await show(width, height);
                }

                // A longer date, as the next build would have it: the first row prints it (through the
                // component's own state) and --dates carries it (set in the page for the test). Every row's
                // column is then that date's width plus 32.2px; with both taken back, it is as it was.
                const withDate = async (date) => {
                    const style = await page.addStyleTag({ content: `project-index { --dates: "${date}"; }` });
                    await page.evaluate((date) => {
                        const el = document.querySelector('project-index');
                        window.__projects = el.state.projects;
                        el.setState({ projects: el.state.projects.map((p, k) => (k === 0 ? { ...p, years: date } : p)) });
                    }, date);
                    return async () => {
                        await style.evaluate(el => el.remove());
                        await page.evaluate(() => document.querySelector('project-index').setState({ projects: window.__projects }));
                    };
                };
                const takeBack = await withDate('2019, 2020, 2021');
                const longer = await dateCells();
                const wide = longer.rows[0].text;
                check(`6. at ${width}px a longer date (${wide.toFixed(2)}px for ${widest.toFixed(2)}px) makes the date column wider in every row: the title's column ${(wide + 32.2).toFixed(2)}px after the date`,
                    wide > widest + 5 && strays(longer, wide + 32.2).length === 0 && longer.rows[0].textLines === 1 && longer.sideways <= 0, say(strays(longer, wide + 32.2)));
                await takeBack();
                const again = await dateCells();
                check(`6. at ${width}px with that date gone the column is ${column.toFixed(2)}px again`, strays(again, column).length === 0, say(strays(again, column)));

                // A date typed as a whole sentence: the date column stops at 40% of the list in every row. Side by
                // side the date is cut at its cell's edge (the cell ends where the chevron's 27.2px begin), on
                // one line, in a row as tall as the others, and nothing of it is printed between its cell and
                // the title's column (that strip is the ground colour and nothing else); below 720px, where a
                // row wraps, it wraps inside its cell.
                const sentence = 'from the spring of 2019 until some day and perhaps still going on today, as far as anyone can tell, or longer';
                const undo = await withDate(sentence);
                const most = await dateCells();
                const first = most.rows[0];
                const limit = most.width * 0.4;
                const capped = strays(most, limit);
                let said2 = '';
                let held;
                if (width >= 720) {
                    await page.evaluate(() => document.querySelector('project-index .row').scrollIntoView({ block: 'center', behavior: 'instant' }));
                    const r = await page.evaluate(() => { const b = document.querySelector('project-index .row').getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; });
                    // The strip stops 2px before the title's column: a first letter may begin a pixel before its column.
                    const clip = { x: Math.ceil(first.boxRight), y: Math.ceil(r.top), width: Math.floor(first.title) - 2 - Math.ceil(first.boxRight), height: Math.floor(r.bottom) - Math.ceil(r.top) };
                    const ground = (await list()).ground;
                    // No strip to look at (the column was not stopped, and the title's column is off the page): that is a failure, not a crash.
                    let ink = 255;
                    if (clip.width > 0 && clip.height > 0 && clip.x + clip.width <= width) {
                        const { data, info } = await sharp(await page.screenshot({ clip })).raw().toBuffer({ resolveWithObject: true });
                        ink = 0;
                        for (let i = 0; i < info.width * info.height; i++) for (let c = 0; c < 3; c++) ink = Math.max(ink, Math.abs(data[i * info.channels + c] - ground[c]));
                    }
                    held = first.text > limit && first.textRight > first.boxRight + 20 && first.textLines === 1 && most.rows.every(row => Math.abs(row.height - 23) < 0.05) && clip.width >= 23 && ink <= 2;
                    said2 = `the date's text ends ${(first.textRight - first.boxRight).toFixed(1)}px after its cell, ${first.textLines} line(s); the ${clip.width}px before the title's column are at most ${ink} from the ground colour`;
                } else {
                    held = first.textLines > 1 && first.textRight <= first.boxRight - 5 + 0.5;
                    said2 = `the date takes ${first.textLines} lines and ends ${(first.boxRight - 5 - first.textRight).toFixed(1)}px before its cell's 5px of air`;
                }
                check(`6. at ${width}px a date as long as a sentence stops the date column at 40% of the list (${limit.toFixed(1)}px) in every row, and is ${width >= 720 ? 'cut at its cell\'s edge, 27.2px before the title\'s column: one line, nothing of it printed after the cell, no row taller' : 'wrapped inside its cell'}`,
                    capped.length === 0 && Math.abs(first.title - first.boxRight - 27.2) <= 0.5 && held && most.sideways <= 0, `${say(capped)} ${said2}`);
                await undo();
            }
            await ax.detach();

            for (const [width, height] of [[720, 800], [800, 600], [1024, 768], [1366, 710], [1920, 1080]]) {
                await show(width, height);
                const first = await page.evaluate(() => window.__mutations());
                check(`6. zero mutations on first render at ${width}px: /`, first.length === 0, first.slice(0, 5).join('; '));
                const m = await list();
                const padding = Math.max(m.page * 0.01676, 12);
                // The date column: the widest date printed, 5px of air and the 27.2px the hover chevron takes.
                const widest = Math.max(...m.rows.map(r => r.dateWidth));
                const dates = widest + 32.2;
                const shared = m.width - padding - dates - 16 - 15;
                const want = { date: m.left + padding, title: m.left + padding + dates, titleWidth: shared * 11 / 21, type: m.left + padding + dates + shared * 11 / 21 + 15, typeWidth: shared * 10 / 21 };
                const near = (a, b) => Math.abs(a - b) <= 0.5;
                const fits = (c) => c.text <= c.width - FADE + 0.01;

                const tall = m.rows.filter(r => Math.abs(r.height - m.slot) > 0.05 || Math.abs(r.dateLines - 1) > 0.01 || r.cells.some(c => Math.abs(c.lines - 1) > 0.01 || Math.abs(c.middle) > 0.5));
                const span = m.rows.at(-1).bottom - m.rows[0].top;
                check(`6. at ${width}px every row of the list is one line, in the middle of a row ${m.slot}px tall, the same at every width`, m.rows.length === published.length && tall.length === 0 && Math.abs(span - m.rows.length * m.slot) <= 0.02 * m.rows.length + 0.05, `${tall.slice(0, 5).map(r => `${r.slug} ${r.height}px`).join(', ')}; ${m.rows.length} rows in ${span}px`);

                const off = m.rows.filter(r => !near(r.date, want.date) || !near(r.cells[0].left, want.title) || !near(r.cells[0].width, want.titleWidth) || (r.cells[1] && (!near(r.cells[1].left, want.type) || !near(r.cells[1].width, want.typeWidth))));
                const types = m.rows.filter(r => r.cells[1]).map(r => r.cells[1].left);
                check(`6. at ${width}px the list's three columns are where the design puts them in every row: the date at ${want.date.toFixed(1)}, the title at ${want.title.toFixed(1)} (the widest date, ${widest.toFixed(1)}px, and 32.2px after the date's start), ${want.titleWidth.toFixed(1)} wide, the type at ${want.type.toFixed(1)}, ${want.typeWidth.toFixed(1)} wide, lined up`,
                    off.length === 0 && (types.length === 0 || Math.max(...types) - Math.min(...types) < 0.01),
                    off.slice(0, 3).map(r => `${r.slug}: date ${r.date}, title ${r.cells[0].left} + ${r.cells[0].width}, type ${r.cells[1]?.left} + ${r.cells[1]?.width}`).join('; '));

                // The dates are Fluxisch Else Light and the titles Bold, at the body's 13px, in the text colour.
                const set = `13px rgb(${m.rows[0].cells[0].colour.join(', ')})`;
                const weights = [...new Set(m.rows.map(r => r.type))];
                check(`6. at ${width}px every row's date is Light (300) and its title Bold (700), both 13px in the text colour`, weights.length === 1 && weights[0] === `300 ${set} | 700 ${set}`, weights.slice(0, 3).join(' ; '));

                // Every column is a box that cuts (not a scroller: nothing to drag with a mouse), with the fade over its
                // last 1em (13px), and at rest its text starts at its left edge.
                const fade = new RegExp(`^linear-gradient\\(to right, .*rgb\\(0, 0, 0\\) calc\\(100% - ${FADE}px\\), rgba\\(0, 0, 0, 0\\)\\)$`);
                const loose = m.rows.flatMap(r => r.cells.filter(c => c.cut !== 'clip' || !fade.test(c.mask) || Math.abs(c.start) > 0.01).map(c => `${r.slug}: ${c.cut}, start ${c.start}, ${c.mask}`));
                const cells = m.rows.flatMap(r => r.cells.map((c, i) => ({ slug: r.slug, i, over: c.text - (c.width - FADE), r, c })));
                const long = cells.filter(x => !fits(x.c));
                check(`6. at ${width}px every column cuts its text at its right edge, fades it out over the last ${FADE}px and shows it from its start (${long.length} of ${cells.length} texts reach the fade)`, loose.length === 0, loose.slice(0, 3).join('; '));

                // A row whose texts both fit, the one that ends closest to a fade: nothing of it is under the
                // fade, and it does not move while it is pointed at for as long as a text takes to travel 60px.
                const whole = m.rows.filter(r => r.cells.every(fits)).sort((a, b) => Math.min(...a.cells.map(c => c.width - FADE - c.text)) - Math.min(...b.cells.map(c => c.width - FADE - c.text)))[0];
                if (!whole) check(`6. at ${width}px: ok (no row whose title and types both fit; that check was skipped)`, true);
                else {
                    const spare = Math.min(...whole.cells.map(c => c.width - FADE - c.text));
                    const tight = whole.cells.findIndex(c => c.width - FADE - c.text === spare);
                    const watch = follow(whole.slug, tight, 60);
                    await pointAt(whole.slug);
                    const samples = await watch;
                    const pointed = await row(whole.slug);
                    const moved = Math.max(...samples.map(([, start]) => Math.abs(start)), ...pointed.cells.map(c => Math.abs(c.start)));
                    const arrow = pointed.chevron;
                    check(`6. at ${width}px a row whose texts fit is not faded (its longest ends ${spare.toFixed(1)}px before the fade) and does not move when pointed at; the chevron is 14px left of the title's column, in the row's middle (${whole.slug})`,
                        spare >= -0.01 && pointed.on && samples.length > 3 && moved < 0.01
                        && Boolean(arrow) && near(arrow.left, -27.2) && arrow.width === 14 && arrow.height === 16 && near(arrow.middle, 0) && near(pointed.cells[0].left, want.title) && near(pointed.date, want.date),
                        `on=${pointed.on}, ${samples.length} frames, moved ${moved}px, chevron ${JSON.stringify(arrow)}`);
                    await page.mouse.move(1, 1);
                }

                if (!long.length) { check(`6. at ${width}px: ok (every title and every type list fits its column; the checks of a text that is cut were skipped)`, true); continue; }
                // The title that is cut the most and the type list that is cut the most.
                for (const i of [0, 1]) {
                    const worst = long.filter(x => x.i === i).sort((a, b) => b.over - a.over)[0];
                    const what = i === 0 ? 'title' : 'type list';
                    if (!worst) { check(`6. at ${width}px: ok (no ${what} is cut; its checks were skipped)`, true); continue; }
                    const { slug } = worst;
                    await page.evaluate((slug) => document.querySelector(`#row-${slug}`).scrollIntoView({ block: 'center', behavior: 'instant' }), slug);
                    const rest = await row(slug);
                    const cell = rest.cells[i];
                    const ink = await inkAt(rest, cell, m.ground);
                    const full = Math.max(...cell.colour.map((v, c) => Math.abs(v - m.ground[c])));
                    check(`6. at ${width}px a ${what} too long for its column (by ${worst.over.toFixed(1)}px) is cut at the column's edge and faded before it: nothing after the edge, less than half the ink left in the fade's last 5px (${slug})`,
                        ink.text > full * 0.6 && ink.after <= 6 && ink.fade <= full * 0.5, `${JSON.stringify(ink)} of ${full}`);

                    // Pointed at: it slides left at 100px a second until its end is at the fade's start, and stays there.
                    const watch = follow(slug, i, 'stopped');
                    await pointAt(slug);
                    const samples = await watch;
                    const slid = await row(slug);
                    const end = slid.cells[i].start + cell.text;
                    // The frames on the way, clear of both ends: after the first 0.2s (20px), in which the text sets
                    // off from up to 5px behind the straight line and is level with it at the end, and before the
                    // stop. A way too short to hold three of them is not timed. No frame is a jump: the text is
                    // never faster than at the end of that start (200px a second).
                    const moving = samples.filter(([, start]) => start < -23 && start > -worst.over + 3);
                    const fastest = Math.max(0, ...samples.slice(1).map(([t, start], k) => (samples[k][1] - start) / Math.max(t - samples[k][0], 1) * 1000));
                    const speed = moving.length >= 3 ? (moving[0][1] - moving.at(-1)[1]) / (moving.at(-1)[0] - moving[0][0]) * 1000 : NaN;
                    const drift = moving.length >= 3 ? Math.max(...moving.map(([t, start]) => Math.abs(start - (moving[0][1] - speed * (t - moving[0][0]) / 1000)))) : 0;
                    // The lean of the slanted types puts the top of their last letter up to 1px further right.
                    check(`6. at ${width}px pointing at its row slides the ${what} left until its end is inside the column and clear of the fade, and it stays there`,
                        slid.on && Math.abs(slid.cells[i].start + worst.over) <= 1 && end <= cell.width - FADE + 1 && end > cell.width - FADE - 1, `starts ${slid.cells[i].start}px left of its column, ends ${(cell.width - end).toFixed(2)}px before the edge`);
                    check(`6. at ${width}px the ${what} slides at a steady 100px a second after a 0.2s start (${Number.isNaN(speed) ? 'too short a way to time' : `${speed.toFixed(1)}px/s over ${moving.length} frames, never more than ${drift.toFixed(2)}px off the line`}; no frame faster than ${fastest.toFixed(0)}px/s)`,
                        (Number.isNaN(speed) ? worst.over < 60 : Math.abs(speed - 100) <= 10 && drift <= 1.5) && fastest <= 260, `${samples.length} frames`);
                    const arrow = slid.chevron;
                    check(`6. at ${width}px the slide moves nothing else: the date, both columns and the chevron (14px left of the title's column) are where they were`,
                        near(slid.date, rest.date) && slid.cells.every((c, k) => Math.abs(c.left - rest.cells[k].left) < 0.01 && Math.abs(c.right - rest.cells[k].right) < 0.01)
                        && Boolean(arrow) && near(arrow.left, -27.2) && arrow.width === 14 && arrow.height === 16 && near(arrow.middle, 0) && Math.abs(slid.height - rest.height) < 0.01,
                        `date ${rest.date} → ${slid.date}, chevron ${JSON.stringify(arrow)}`);
                    const gone = home(slug, i);
                    await page.mouse.move(1, 1);
                    const took = await gone;
                    const back = await row(slug);
                    check(`6. at ${width}px when the pointer leaves the ${what} is back at its start in 0.2s`, Math.abs(took - 0.2) < 0.005 && Math.abs(back.cells[i].start) < 0.01 && !back.on, `${took}s, start ${back.cells[i].start}`);

                    // The same from the grid: the pointer on the project's thumbnail.
                    await page.evaluate((slug) => document.querySelector(`#cell-${slug}`).scrollIntoView({ block: 'center', behavior: 'instant' }), slug);
                    const fromGrid = follow(slug, i, 'stopped');
                    await page.hover(`#cell-${slug}`);
                    await fromGrid;
                    const byThumb = await row(slug);
                    const leaving = home(slug, i);
                    await page.mouse.move(1, 1);
                    const left = await leaving;
                    const after = await row(slug);
                    check(`6. at ${width}px pointing at the project's thumbnail slides the ${what} the same way, and it goes back when the pointer leaves`,
                        byThumb.on && Math.abs(byThumb.cells[i].start + worst.over) <= 1 && Math.abs(left - 0.2) < 0.005 && Math.abs(after.cells[i].start) < 0.01, `start ${byThumb.cells[i].start}, wanted ${-worst.over}; back in ${left}s to ${after.cells[i].start}`);

                    // A pointer that leaves and is back before the 0.2s are over (it wobbles between two rows): the
                    // text turns round and glides to where the slide stands, no faster than it was going home
                    // (its way in 0.2s) plus the slide's own speed; it does not jump there in one frame. A way
                    // too short to tell a glide from a jump is not tried.
                    if (worst.over < 40) { check(`6. at ${width}px: ok (the ${what} is cut by too little to time a pointer that comes back; skipped)`, true); continue; }
                    const at = await spot(slug);
                    const there = follow(slug, i, 'stopped');
                    await page.mouse.move(at.x, at.y);
                    await there;
                    await tape(slug, i);
                    const turning = partWay(slug, i);
                    await page.mouse.move(1, 1);
                    await turning;
                    const again = follow(slug, i, 'stopped');
                    await page.mouse.move(at.x, at.y);
                    await again;
                    const taped = await untape();
                    const low = taped.reduce((a, b) => (b[2] < a[2] ? b : a));
                    const rush = Math.max(0, ...taped.slice(1).map(([t, start], k) => (taped[k][1] - start) / Math.max(t - taped[k][0], 1) * 1000));
                    const limit = worst.over / 0.2 * 1.3 + 150;
                    const ended = await row(slug);
                    // Home before the pointer was back (a machine too busy to be back in 0.2s): nothing to judge.
                    if (low[2] < 0.02) check(`6. at ${width}px: ok (the pointer was not back on the ${what}'s row within 0.2s; the check of a pointer that comes back was skipped)`, true);
                    else check(`6. at ${width}px a pointer back on the row before the ${what} is home (${Math.round(low[2] * 100)}% of its slide still showing) sees it glide back to its end, not jump (${rush.toFixed(0)}px/s at most; a jump is over ${limit.toFixed(0)})`,
                        rush <= limit && Math.abs(ended.cells[i].start + worst.over) <= 1 && ended.on, `${taped.length} frames, turned at ${low[1].toFixed(1)}px, ends at ${ended.cells[i].start}`);
                    const settle = home(slug, i);
                    await page.mouse.move(1, 1);
                    await settle;
                }

                // The mouse on a type list that is cut. The list stands still while the pointer is on it, or a
                // tag would slide away from under the pointer before the click. (1) The pointer comes down
                // onto the list's first tag and waits there as long as the slide would have needed to carry
                // that tag out of sight (the title of the same row, which does slide, is the clock): the list
                // has not moved, and the click filters by that tag. (2) The row is pointed at on its date
                // until the list is at its end, then the pointer goes to the last tag: the list stays at its
                // end, and the click filters by that tag. (3) Leaving from there, the list is home in 0.2s and
                // its travel is back at 0, so the next slide starts at the start.
                const reach = long.filter(x => x.i === 1).sort((a, b) => b.over - a.over)[0];
                if (!reach) check(`6. at ${width}px: ok (no type list is cut; the checks of a click with the mouse were skipped)`, true);
                else {
                    const { slug } = reach;
                    const lastTag = reach.c.tags.length - 1;
                    const first = await tagSpot(slug, 0);
                    const clock = follow(slug, 0, Math.max(reach.c.tags[0].right, 0) + 30);
                    await page.mouse.move(first.x, first.y - 2 * m.slot);
                    await page.mouse.move(first.x, first.y, { steps: 3 });
                    await clock;
                    const held = await row(slug);
                    await page.mouse.down();
                    await page.mouse.up();
                    const byFirst = await filteredBy(first.tag);
                    check(`6. at ${width}px the types stand still under the pointer: the mouse on the first tag of the type list that is cut the most, a click once a slide would have carried it away, filters by that tag (${slug}: ${first.tag})`,
                        held.on && Math.abs(held.cells[1].start) < 0.01 && byFirst, `on=${held.on}, the list at ${held.cells[1].start}, ${await page.evaluate(() => decodeURIComponent(location.search))}`);

                    await show(width, height);
                    let slid = follow(slug, 1, 'stopped');
                    await pointAt(slug);
                    await slid;
                    const atEnd = await row(slug);
                    const last = await tagSpot(slug, lastTag);
                    const more = follow(slug, 0, await travelled(slug, 0) + 60);
                    await page.mouse.move(last.x, last.y);
                    await more;
                    const stayed = await row(slug);
                    await page.mouse.down();
                    await page.mouse.up();
                    const byLast = await filteredBy(last.tag);
                    check(`6. at ${width}px once the row's slide has brought the last tag into the column, the pointer on that tag keeps the list at its end and a click filters by it (${slug}: ${last.tag})`,
                        Math.abs(atEnd.cells[1].start + reach.over) <= 1 && stayed.on && Math.abs(stayed.cells[1].start - atEnd.cells[1].start) < 0.01 && byLast, `the list at ${atEnd.cells[1].start} → ${stayed.cells[1].start}, wanted ${-reach.over}; ${await page.evaluate(() => decodeURIComponent(location.search))}`);

                    await show(width, height);
                    slid = follow(slug, 1, 'stopped');
                    await pointAt(slug);
                    await slid;
                    const end = await tagSpot(slug, lastTag);
                    const pause = follow(slug, 0, await travelled(slug, 0) + 30);
                    await page.mouse.move(end.x, end.y);
                    await pause;
                    const leaving = home(slug, 1);
                    await page.mouse.move(1, 1);
                    const took = await leaving;
                    const reset = await page.waitForFunction((slug) => getComputedStyle(document.querySelectorAll(`#row-${slug} .clip`)[1].querySelector('.line')).getPropertyValue('--index-slid') === '0px', slug, { timeout: 3000 }).then(() => true, () => false);
                    const gone = await row(slug);
                    check(`6. at ${width}px leaving the row from a tag sends the list home in 0.2s, and its next slide starts at the start`,
                        Math.abs(took - 0.2) < 0.005 && reset && Math.abs(gone.cells[1].start) < 0.01 && !gone.on, `${took}s, travel reset: ${reset}, the list at ${gone.cells[1].start}`);
                    await show(width, height);
                }

                // The keyboard: a tag that is cut at rest is reached with Tab, is then whole inside its column
                // before the fade with room for its focus ring, stays there while the row is pointed at as
                // well, and filters on Enter. When focus leaves, the column shows its start again. Rather a
                // tag of which 32px or more show at rest: Chromium does not scroll to such a one by itself.
                const showing = (x) => x.width - x.t.left;
                const hidden = long.filter(x => x.i === 1).flatMap(x => x.c.tags.map((t, n) => ({ slug: x.slug, n, t, width: x.c.width, text: x.c.text })))
                    .filter(x => x.t.right > x.width - FADE && x.t.right - x.t.left <= x.width - FADE - 5)
                    .sort((a, b) => (showing(b) >= 32) - (showing(a) >= 32) || b.t.left - a.t.left)[0];
                if (!hidden) { check(`6. at ${width}px: ok (no tag is cut at rest that would fit its column whole; the keyboard check was skipped)`, true); continue; }
                const { slug, n } = hidden;
                await page.evaluate((slug) => document.querySelector(`#row-${slug} .title`).focus(), slug);
                for (let k = 0; k <= n; k++) await page.keyboard.press('Tab');
                const focused = () => page.evaluate(({ slug, n }) => {
                    const tag = document.querySelectorAll(`#row-${slug} .tag`)[n];
                    return document.activeElement === tag && tag.matches(':focus-visible');
                }, { slug, n });
                const inside = (r) => { const t = r.cells[1].tags[n]; return t.left >= -1 && t.right <= r.cells[1].width - FADE + 1; };
                await page.waitForFunction(({ slug, n, FADE }) => {
                    const cell = document.querySelectorAll(`#row-${slug} .clip`)[1];
                    const tag = cell.querySelectorAll('.tag')[n].getBoundingClientRect();
                    return tag.right <= cell.getBoundingClientRect().right - FADE + 1;
                }, { slug, n, FADE }, { timeout: 5000 }).catch(() => {});
                const onTag = await focused();
                const seen = await row(slug);
                const tag = seen.cells[1].tags[n];
                // The ring is 2px, 2px from the tag: 4px on every side must be inside the column's box and before the fade.
                const ring = tag.left - 4 >= -seen.cells[1].room - 1 && tag.top >= 4 && tag.bottom >= 4 && tag.right + 4 <= seen.cells[1].width - FADE + 1;
                check(`6. at ${width}px a tag cut at rest (${Math.max(0, showing(hidden)).toFixed(1)}px of its ${(hidden.t.right - hidden.t.left).toFixed(1)}px inside a ${hidden.width.toFixed(1)}px column) is reached with Tab and is then whole inside its column, clear of the fade, its focus ring uncut (${slug}: ${hidden.t.tag})`,
                    onTag && inside(seen) && ring, `focused=${onTag}, tag ${tag.left.toFixed(2)} to ${tag.right.toFixed(2)} of ${seen.cells[1].width.toFixed(2)}, ${tag.top} / ${tag.bottom} above and below`);
                // The row is pointed at as well (focus has already highlighted it): once its title would have travelled 60px, the tag has not moved.
                const meanwhile = follow(slug, 0, 60);
                await pointAt(slug);
                await meanwhile;
                const both = await row(slug);
                check(`6. at ${width}px pointing at the row of the focused tag does not move the tag`, await focused() && Math.abs(both.cells[1].tags[n].left - tag.left) < 0.01 && Math.abs(both.cells[1].start - seen.cells[1].start) < 0.01, `${tag.left} → ${both.cells[1].tags[n].left}`);
                await page.mouse.move(1, 1);
                await page.keyboard.press('Enter');
                const filtered = await page.waitForFunction((t) => new URLSearchParams(location.search).get('filter') === t && [...document.querySelectorAll('project-index .row')].every(r => r.querySelector(`.tag[data-tag="${CSS.escape(t)}"]`)), hidden.t.tag, { timeout: 5000 }).then(() => true, () => false);
                const kept = await focused();
                const shown = await row(slug);
                check(`6. at ${width}px Enter on that tag filters by it, and it keeps focus, still whole inside its column`, filtered && kept && inside(shown), `${await page.evaluate(() => location.search)} focused=${kept}`);
                await page.evaluate(() => document.activeElement.blur());
                await page.waitForFunction((slug) => !document.querySelector(`#row-${slug}`).classList.contains('on'), slug, { timeout: 5000 }).catch(() => {});
                const released = await row(slug);
                check(`6. at ${width}px when focus has left, the type column shows its start again`, !released.on && Math.abs(released.cells[1].start) < 0.01 && released.cells[1].cut === 'clip', `start ${released.cells[1].start}, ${released.cells[1].cut}`);
            }
        }

        // 7. the Index on a phone: one column of thumbnails, each with its title under it
        {
            const titles = Object.fromEntries(published.map(p => [p.data.slug, String(p.data.title).trim()]));
            // The pointer rests on the header, before the page loads and after: below 720px a cell is as wide
            // as the page, so a pointer left anywhere over the grid would highlight a row.
            const away = async () => {
                await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
                await page.mouse.move(1, 1);
                await page.waitForTimeout(50);
            };
            const open = async (width, height) => {
                await page.setViewportSize({ width, height });
                await page.mouse.move(1, 1);
                await page.goto(`${base}/`);
                await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
                await page.evaluate(() => document.fonts.ready.then(() => true));
            };

            // From 720px up nothing shows of the titles, and every cell keeps its fixed proportion.
            const fixed = () => page.evaluate(() => {
                const names = [...document.querySelectorAll('project-index .name')];
                const cells = [...document.querySelectorAll('project-index .cell')];
                const quarter = document.documentElement.clientWidth / 4;
                return {
                    names: names.length,
                    shown: names.filter(n => n.getClientRects().length > 0 || getComputedStyle(n).display !== 'none').length,
                    off: cells.filter((c) => {
                        const r = c.getBoundingClientRect();
                        return Math.abs(r.width - quarter) > 0.5 || Math.abs(r.width / r.height - 341.2 / 197.12) > 0.005;
                    }).length,
                    pair: cells.length < 2 || Math.abs(cells[0].getBoundingClientRect().top - cells[1].getBoundingClientRect().top) < 0.5,
                };
            });
            for (const [width, height] of [[1366, 710], [720, 800]]) {
                await open(width, height);
                const m = await fixed();
                check(`7. at ${width}×${height} the titles under the thumbnails are not displayed and take no space: a cell is still a quarter of the page at 341.2 : 197.12, two to a row`, m.names === published.length && m.shown === 0 && m.off === 0 && m.pair, JSON.stringify(m));
            }

            // Below 720px: what is wrong with each cell, by slug.
            const phone = () => page.evaluate(({ titles, shadow, exact }) => {
                const page = document.documentElement.clientWidth;
                const box = (el) => el.getBoundingClientRect();
                const cells = [...document.querySelectorAll('project-index .cell')];
                const rows = [...document.querySelectorAll('project-index .row')];
                const bad = { rows: [], titles: [], thumbs: [], sized: [] };
                cells.forEach((c, i) => {
                    const slug = c.dataset.slug;
                    const a = box(c);
                    const frame = c.querySelector('.box');
                    const name = c.querySelector('.name');
                    const next = cells[i + 1];
                    const f = frame ? box(frame) : null;

                    // one cell to a row, as wide as the page
                    if (Math.abs(a.left) > 0.5 || Math.abs(a.width - page) > 0.5 || (i > 0 && a.top < box(cells[i - 1]).bottom - 0.5)) bad.rows.push(slug);

                    // the title: shown, the project's own, under its picture and nearer to it than to the next one
                    const n = name ? box(name) : null;
                    const first = next ? next.querySelector('.box') ?? next.querySelector('.name') : null;
                    const after = first ? box(first).top - n?.bottom : null;
                    const under = f ? n?.top - f.bottom : null;
                    const why = [];
                    if (!name || name.getClientRects().length === 0 || getComputedStyle(name).visibility !== 'visible' || n.height < 16) why.push('not shown');
                    else {
                        if (name.textContent !== titles[slug]) why.push(`reads "${name.textContent}"`);
                        if (n.top < a.top - 0.5 || n.bottom > a.bottom + 0.5) why.push('outside its cell');
                        if (under !== null && !(under > 0 && Math.abs(under - 10) < 0.5)) why.push(`${under.toFixed(2)}px under its picture, not 10`);
                        if (after !== null && !(after > 0 && Math.abs(after - 32) < 0.5)) why.push(`${after.toFixed(2)}px before the next, not 32`);
                        if (under !== null && after !== null && !(under < after)) why.push('nearer to the next picture than to its own');
                        if (n.width > page * 0.91 + 0.5 || Math.abs((n.left + n.right) / 2 - page / 2) > 0.5) why.push('not centred within 91% of the page');
                    }
                    if (why.length) bad.titles.push(`${slug}: ${why.join(', ')}`);

                    // the thumbnail: whole, centred, without a border, with the shadow, as large as fits 91% of the
                    // page's width and 49.9733% of it in height: one of the two exactly
                    if (frame) {
                        const s = getComputedStyle(frame);
                        const img = frame.querySelector('img');
                        const im = box(img);
                        const wrong = [];
                        if (Math.abs(f.width / f.height - img.getAttribute('width') / img.getAttribute('height')) > 0.01
                            || Math.abs(im.width - f.width) > 0.5 || Math.abs(im.height - f.height) > 0.5) wrong.push('cropped, or not filling its box');
                        if (getComputedStyle(img).objectFit !== 'fill') wrong.push(`object-fit: ${getComputedStyle(img).objectFit}`);
                        bad.sized.push({ name: slug, width: f.width, sizes: [img.getAttribute('sizes'), frame.querySelector('source')?.getAttribute('sizes') ?? null] });
                        if (!['Top', 'Right', 'Bottom', 'Left'].every(k => s[`border${k}Width`] === '0px')) wrong.push(`a border (${s.borderTopWidth})`);
                        if (s.boxShadow !== shadow) wrong.push(`shadow ${s.boxShadow}`);
                        if (Math.abs((f.left + f.right) / 2 - page / 2) > 0.5) wrong.push('not centred');
                        if (f.width > page * 0.91 + exact || f.height > page * 0.499733 + exact) wrong.push('too large');
                        if (Math.abs(f.width - page * 0.91) > exact && Math.abs(f.height - page * 0.499733) > exact) wrong.push(`neither side on its limit (${f.width} × ${f.height} in ${page * 0.91} × ${page * 0.499733})`);
                        if (f.top < a.top - 0.5 || f.bottom > a.bottom + 0.5) wrong.push('outside its cell');
                        if (wrong.length) bad.thumbs.push(`${slug}: ${wrong.join(', ')}`);
                    }
                });
                const list = box(document.querySelector('project-index .index'));
                const last = cells.length ? box(cells[cells.length - 1]) : null;
                return {
                    ...bad,
                    cells: cells.map(c => c.dataset.slug),
                    list: rows.map(r => r.dataset.slug),
                    under: !last || list.top >= last.bottom - 0.5,
                    scroll: document.documentElement.scrollWidth - page,
                    vw: innerWidth,
                    vh: innerHeight,
                    // every row's date and title, and the page's own type
                    type: [...new Set(rows.map(r => [r.querySelector('.years'), r.querySelector('.title')].map(el => `${getComputedStyle(el).fontWeight} ${getComputedStyle(el).fontSize}`).join(' | ')))],
                    body: [getComputedStyle(document.body).fontSize, getComputedStyle(document.body).lineHeight, getComputedStyle(document.body).fontWeight].join(' / '),
                };
            }, { titles, shadow: SHADOW, exact: EXACT });
            const want = JSON.stringify(published.map(p => p.data.slug).sort());
            for (const [width, height] of [[390, 844], [360, 740], [719, 900]]) {
                await open(width, height);
                if (width === 390) {
                    const first = await page.evaluate(() => window.__mutations());
                    check('7. zero mutations on first render at 390px: /', first.length === 0, first.slice(0, 5).join('; '));
                    const forced = await page.evaluate(() => { document.querySelector('project-index').render(); return window.__mutations(); });
                    check('7. zero mutations on el.render() at 390px: /', forced.length === 0, forced.slice(0, 5).join('; '));
                }
                const m = await phone();
                const at = `at ${width}×${height}`;
                check(`7. ${at} one cell to a row, each as wide as the page, the list under the grid, no horizontal scroll`, m.rows.length === 0 && m.under && m.scroll <= 0 && JSON.stringify([...m.cells].sort()) === want, `${m.rows.slice(0, 5).join(', ')} under=${m.under} scroll=${m.scroll} cells=${m.cells.length}`);
                check(`7. ${at} every project's title shows under its thumbnail: 10px under its own picture, 32px before the next`, m.titles.length === 0 && m.cells.length === published.length, m.titles.slice(0, 5).join(' | '));
                check(`7. ${at} every thumbnail is whole, centred, without a border, with the shadow, filling its box edge to edge, and as large as fits: the side that limits it is exactly on its limit`, m.thumbs.length === 0, m.thumbs.slice(0, 5).join(' | '));
                {
                    const off = sizesOff(m.sized, m.vw, m.vh);
                    check(`7. ${at} every thumbnail's sizes attribute gives the width it is shown at, to the pixel`, m.sized.length > 0 && off.length === 0, off.slice(0, 3).join(' | '));
                }
                check(`7. ${at} the type is 13px on a 16px line, Light; in the list every date is Light (300) and every title Bold (700)`, m.body === BODY && m.type.length === 1 && m.type[0] === '300 13px | 700 13px', `body ${m.body}; rows ${m.type.slice(0, 3).join(' ; ')}`);
            }

            // The title's type is the list titles'; pointing at the thumbnail or focusing it turns it the link colour.
            // The first cell: it is on screen, so neither pointing at it nor focusing it scrolls the page under the pointer.
            await open(390, 844);
            const slug = await page.evaluate(() => document.querySelector('project-index .cell').dataset.slug);
            const type = await page.evaluate((slug) => {
                const pick = (el) => { const s = getComputedStyle(el); return [s.fontFamily, s.fontWeight, s.fontSize, s.lineHeight, s.color].join(' / '); };
                const cell = document.querySelector(`#cell-${slug}`);
                return {
                    name: pick(cell.querySelector('.name')),
                    title: pick(document.querySelector(`#row-${slug} .title`)),
                    align: getComputedStyle(cell.querySelector('.name')).textAlign,
                    line: getComputedStyle(cell).textDecorationLine,
                };
            }, slug);
            check('7. the title under a thumbnail is set like the list\'s titles, centred, not underlined', type.name === type.title && type.align === 'center' && type.line === 'none', JSON.stringify(type));
            const colours = () => page.evaluate((slug) => ({
                name: getComputedStyle(document.querySelector(`#cell-${slug} .name`)).color,
                title: getComputedStyle(document.querySelector(`#row-${slug} .title`)).color,
                on: [...document.querySelectorAll('project-index .row.on')].map(r => r.dataset.slug).join(','),
                muts: window.__mutations(),
            }), slug);
            const rest = await colours();
            await page.hover(`#cell-${slug}`);
            await page.waitForTimeout(50);
            const pointed = await colours();
            await away();
            const left = await colours();
            await page.evaluate((slug) => document.querySelector(`#cell-${slug}`).focus({ preventScroll: true }), slug);
            await page.waitForTimeout(50);
            const focused = await colours();
            await page.evaluate(() => document.activeElement.blur());
            check('7. pointing at a thumbnail or focusing it turns its title the link colour, highlights its row and touches nothing else',
                rest.name === rest.title && rest.on === ''
                && pointed.name !== rest.name && pointed.name === pointed.title && pointed.on === slug
                && left.name === rest.name && left.on === ''
                && focused.name === pointed.name && focused.on === slug
                && [...pointed.muts, ...left.muts, ...focused.muts].every(m => m === 'attributes LI [class]'),
                JSON.stringify({ rest: rest.name, pointed: pointed.name, left: left.name, focused: focused.name, on: [pointed.on, focused.on] }));

            // A tag clicked on a phone: the grid and the list show the same projects, and the survivors are the same nodes.
            await open(390, 844);
            await page.evaluate(() => {
                window.__before = new Map([...document.querySelectorAll('project-index .row, project-index .cell')].map(e => [e.id, e]));
                window.__mutations();
            });
            await page.click(`project-index .tag[data-tag=${JSON.stringify(tagA)}]`);
            await page.waitForTimeout(50);
            const kept = await page.evaluate(() => {
                const all = [...document.querySelectorAll('project-index .row, project-index .cell')];
                const muts = window.__mutations();
                return {
                    url: location.search,
                    same: all.every(e => window.__before.get(e.id) === e),
                    other: muts.filter(m => !m.startsWith('childList') && !/\[(class|aria-pressed)\]$/.test(m)),
                };
            });
            await away();
            const some = await phone();
            const tag = JSON.stringify(tagged(tagA));
            check(`7. at 390px clicking a tag filters the grid and the list alike (${tagA}), and the morph only removes`,
                kept.url === `?filter=${encodeURIComponent(tagA)}` && JSON.stringify([...some.cells].sort()) === tag && JSON.stringify([...some.list].sort()) === tag && kept.same && kept.other.length === 0,
                `${kept.url} cells=${some.cells.length} rows=${some.list.length} want=${tagged(tagA).length} ${kept.other.slice(0, 5).join('; ')}`);
            check('7. at 390px the filtered grid keeps its layout: one cell to a row, titles under their thumbnails', some.rows.length === 0 && some.titles.length === 0 && some.thumbs.length === 0 && some.under && some.scroll <= 0, [...some.rows, ...some.titles, ...some.thumbs].slice(0, 5).join(' | '));
            await page.click('project-index .tag.on');
            await page.waitForTimeout(50);
            const again = await page.evaluate(() => ({ url: location.search, cells: document.querySelectorAll('project-index .cell').length, rows: document.querySelectorAll('project-index .row').length }));
            check('7. at 390px clicking the tag again brings every thumbnail and row back', again.url === '' && again.cells === published.length && again.rows === published.length, JSON.stringify(again));

            // Below 720px the grid is above the list, so a filter turned off puts thousands of pixels back above
            // the tag that was tapped: the page follows, and the tag is still where the finger is.
            const stay = await page.evaluate((t) => {
                const tag = [...document.querySelectorAll('project-index .tag')].find(x => x.dataset.tag === t);
                tag.scrollIntoView({ block: 'center', behavior: 'instant' });
                const start = tag.getBoundingClientRect().top;
                tag.click();
                const on = tag.getBoundingClientRect().top;
                tag.click();
                const off = tag.getBoundingClientRect().top;
                return { start: Math.round(start), on: Math.round(on), off: Math.round(off), window: innerHeight, page: document.documentElement.scrollHeight, filter: location.search };
            }, tagA);
            check('7. at 390px a tag tapped on and then off again is still where it was tapped, not a grid\'s height away',
                stay.filter === '' && stay.on >= 0 && stay.on < stay.window && stay.off >= 0 && stay.off < stay.window && (Math.abs(stay.off - stay.on) <= 1 || Math.abs(stay.off - stay.start) <= 1), JSON.stringify(stay));

            // Below 720px the list is as it was before it had columns: a row's title and types are one flow
            // that wraps, the types 15px after the title (or 15px in on a line of their own); the two
            // columns make no box, so nothing is cut or faded, and nothing moves when a row is pointed at.
            for (const [width, height] of [[390, 844], [719, 900]]) {
                await open(width, height);
                const flow = () => page.evaluate(() => {
                    const px = (v) => parseFloat(v) || 0;
                    return [...document.querySelectorAll('project-index .row')].map((r) => {
                        const what = r.querySelector('.what').getBoundingClientRect();
                        const last = [...r.querySelector('.title').getClientRects()].at(-1);
                        const tags = r.querySelector('.tags');
                        const tb = tags?.getBoundingClientRect();
                        const ts = tags ? getComputedStyle(tags) : null;
                        // The slanted types' box is wider than their layout by the lean on each side.
                        const lean = tags ? (tb.width - px(ts.width)) / 2 : 0;
                        const beside = tags && tb.top < last.bottom - 1 && tb.bottom > last.top + 1 && tb.left > last.left;
                        return {
                            slug: r.dataset.slug,
                            on: r.classList.contains('on'),
                            height: r.getBoundingClientRect().height,
                            boxes: [...r.querySelectorAll('.clip')].filter(c => getComputedStyle(c).display !== 'contents').length,
                            lines: [...r.querySelectorAll('.line')].map(l => { const s = getComputedStyle(l); return `${s.display} ${s.translate} ${px(s.paddingRight)}`; }).join(', '),
                            gap: tags ? tb.left + lean - (beside ? last.right : what.left) : 15,
                            beside,
                            tags: tags ? [tb.left, tb.top, tb.width, tb.height].join(' ') : '',
                        };
                    });
                });
                const rows = await flow();
                const boxed = rows.filter(r => r.boxes > 0 || !/^inline none 0(, inline-block none 0)?$/.test(r.lines) || Math.abs(r.gap - 15) > 0.5);
                const wrapped = rows.filter(r => r.height > 26.5).length;
                const pointed = rows.find(r => r.tags) ?? rows[0];
                await page.evaluate((slug) => document.querySelector(`#row-${slug}`).scrollIntoView({ block: 'center', behavior: 'instant' }), pointed.slug);
                const before = (await flow()).find(r => r.slug === pointed.slug);
                await page.hover(`#row-${pointed.slug} .years`);
                await page.waitForFunction((slug) => document.querySelector(`#row-${slug}`).classList.contains('on'), pointed.slug, { timeout: 5000 }).catch(() => {});
                await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
                const during = (await flow()).find(r => r.slug === pointed.slug);
                await away();
                check(`7. at ${width}×${height} the list has no columns: a row's types follow its title in the same flow, 15px after it, wrapping as they need (${wrapped} of ${rows.length} rows take more than one line); nothing is cut, and nothing moves when a row is pointed at`,
                    rows.length === published.length && boxed.length === 0 && during.on && during.tags === before.tags,
                    `${boxed.slice(0, 3).map(r => `${r.slug}: ${r.boxes} boxes, ${r.lines}, gap ${r.gap}`).join('; ')} pointed: ${before.tags} → ${during.tags}`);
            }
        }

        // 4. 390px, and on the way through every route: the type, and the pictures' boxes (the grid's `.box`,
        // a project page's `.frame`; every one in the HTML, shown or not): no border, the shadow.
        await page.setViewportSize({ width: 390, height: 844 });
        const wide = [];
        const type = [];
        const boxes = [];
        let pictures = 0;
        let captions = 0;
        for (const path of routes) {
            await page.goto(base + path);
            await page.waitForTimeout(30);
            const w = await page.evaluate(() => document.documentElement.scrollWidth);
            if (w > 390) wide.push(`${path} (${w}px)`);
            const look = await page.evaluate((shadow) => {
                const set = (el) => { const s = getComputedStyle(el); return [s.fontSize, s.lineHeight, s.fontWeight].join(' / '); };
                const all = [...document.querySelectorAll('picture, project-index .box, project-slides .frame')];
                return {
                    body: set(document.body),
                    // Text that is not the body's size: a photo's caption, and a caption is no other size than its own
                    // (one that followed the body to 13px / 16px is as wrong as body text that is not).
                    other: [...new Set([...document.querySelectorAll('body *')].filter(el => el.getClientRects().length && [...el.childNodes].some(n => n.nodeType === 3 && n.data.trim()) && !el.closest('.visually-hidden'))
                        .map(el => `${el.matches('.caption, .caption *') ? 'caption' : el.localName} ${getComputedStyle(el).fontSize} / ${getComputedStyle(el).lineHeight}`))]
                        .filter(t => (t.startsWith('caption ') ? t !== 'caption 11px / 13.2px' : !/ 13px \/ (16|18\.73)px$/.test(t))),
                    captions: [...document.querySelectorAll('.caption')].filter(el => el.getClientRects().length && el.textContent.trim()).length,
                    count: new Set(all).size,
                    wrong: [...new Set(all)].map((el) => {
                        const s = getComputedStyle(el);
                        const border = ['Top', 'Right', 'Bottom', 'Left'].map(k => s[`border${k}Width`]).join(' ');
                        // A box has its picture's proportions, and the picture is stretched over all of it (`fill`): a resized
                        // file is a fraction of a pixel off those proportions, and `contain` then left a line of the ground
                        // colour between the picture and its shadow. Only a picture whose size the build could not read
                        // (no `width`; none today) is `contain` in a 3 : 2 box.
                        const img = el.querySelector('img');
                        const fit = img ? getComputedStyle(img).objectFit : '';
                        return border !== '0px 0px 0px 0px' ? `a border (${border})` : s.boxShadow !== shadow ? `shadow ${s.boxShadow}`
                            : fit !== (img?.getAttribute('width') ? 'fill' : 'contain') ? `object-fit: ${fit}` : '';
                    }).filter(Boolean),
                };
            }, SHADOW);
            if (look.body !== BODY || look.other.length) type.push(`${path}: body ${look.body}${look.other.length ? `; ${look.other.slice(0, 3).join(', ')}` : ''}`);
            pictures += look.count;
            captions += look.captions;
            if (look.wrong.length) boxes.push(`${path}: ${look.wrong.length} of ${look.count}, ${look.wrong[0]}`);
        }
        check('4. no horizontal scroll at 390px on any route', wide.length === 0, wide.join(', '));
        check(`the type on every route is 13px on a 16px line, Light (a project's type, role and client on an 18.73px line); a caption is 11px / 13.2px and nothing else (${captions} captions on screen)`, type.length === 0 && captions > 0, type.slice(0, 4).join(' | ') || (captions ? '' : 'no caption on screen on any route'));
        check(`no picture on any route has a border, every one has the shadow and is stretched over its whole box (object-fit: fill): the ${pictures} thumbnails and project photos`, pictures > 0 && boxes.length === 0, boxes.slice(0, 4).join(' | '));

        // 6. the intro line stays on the grid's side of the page: side by side (from 720px) it wraps before the
        // middle, 16px short of it, and the header keeps its 88px, so the columns under it do not move.
        const intro = [];
        for (const width of [720, 807, 1024, 1366, 1920]) {
            await page.setViewportSize({ width, height: 800 });
            await page.goto(base + '/');
            await page.evaluate(() => document.fonts.ready);
            const m = await page.evaluate(() => {
                const p = document.querySelector('.site-head p');
                const range = document.createRange();
                range.selectNodeContents(p);
                const rects = [...range.getClientRects()].filter(r => r.width > 0);
                return {
                    right: Math.max(...rects.map(r => r.right)),
                    lines: new Set(rects.map(r => Math.round(r.top))).size,
                    head: document.querySelector('.site-head').getBoundingClientRect().height,
                    middle: document.documentElement.clientWidth / 2,
                };
            });
            if (m.right > m.middle - 16 + 0.5 || Math.abs(m.head - 88) > 0.5) intro.push(`${width}px: text to ${m.right.toFixed(1)}, middle ${m.middle}, ${m.lines} line(s), header ${m.head}`);
        }
        check('6. side by side, the intro line ends at least 16px before the middle of the page and the header stays 88px (720 to 1920px)', intro.length === 0, intro.join(' | '));

        // console errors on every route
        await page.setViewportSize({ width: 1328, height: 900 });
        for (const path of routes) { await page.goto(base + path); await page.waitForTimeout(30); }
        const real = errorsOn.filter(e => !e.includes('/404.html') || !e.includes('404'));
        check('no console errors or warnings with JavaScript on', real.length === 0, real.slice(0, 5).join(' | '));
        await page.close();
    }

    // JS off
    {
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();
        const errs = [];
        page.on('console', m => { if (m.type() === 'error') errs.push(`${page.url()}: ${m.text()}`); });
        page.on('pageerror', e => errs.push(`${page.url()}: ${e.message}`));
        let rowsShown = 0;
        let photosShown = -1;
        let setsShown = [];
        const snaps = {};
        const snap = () => page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType);
        // The photos that show, set by set, and whether each lies under the one before.
        const stacked = () => page.evaluate(() => [...document.querySelectorAll('project-slides')].map((el) => {
            const frames = [...el.querySelectorAll('.slide')].filter(sl => sl.getClientRects().length).map(sl => sl.querySelector('.frame').getBoundingClientRect());
            return { shown: frames.length, under: frames.every((f, i) => i === 0 || f.top >= frames[i - 1].bottom), top: frames[0]?.top ?? 0, bottom: frames.at(-1)?.bottom ?? 0 };
        }));
        for (const path of routes) {
            await page.goto(base + path);
            if (path === '/') rowsShown = await page.evaluate(() => document.querySelectorAll('project-index .row').length);
            if (many && path === `/projects/${many.data.slug}/`) { photosShown = await page.evaluate(() => [...document.querySelectorAll('project-slides .slide')].filter(s => s.getClientRects().length).length); snaps.many = await snap(); }
            if (multi && path === `/projects/${multi.data.slug}/`) setsShown = await stacked();
            if (single && path === `/projects/${single.data.slug}/`) snaps.single = await snap();
        }
        check('no console errors with JavaScript off', errs.length === 0, errs.slice(0, 5).join(' | '));
        check('1. with JavaScript off the index shows every row', rowsShown === published.length);
        if (many) check('1. with JavaScript off a project page shows every photo', photosShown === photos(many).length, `${photosShown}/${photos(many).length}`);
        // Photos one under the other are a state the page must not snap in (it scrolls freely); a page whose sets hold one photo each is in its final state without a script, and snaps.
        if (many && firstSet(many).length > 1) check('3. with JavaScript off a page whose photos are one under the other does not snap', snaps.many === 'none', snaps.many);
        if (single) check('3. a page with one photo snaps without a script', String(snaps.single).includes('mandatory'), snaps.single);
        if (multi) {
            const want = setsOf(multi).map(set => set.length);
            const inOrder = setsShown.every((set, i) => set.under && (i === 0 || set.top >= setsShown[i - 1].bottom));
            check('1. with JavaScript off every photo of every set shows, one under the other, in set order', setsShown.map(set => set.shown).join() === want.join() && inOrder, `${setsShown.map(set => set.shown).join(' + ')} of ${want.join(' + ')}`);
        }
        await context.close();
    }

    // 6. a touch screen 820px wide (it cannot hover, and the list still has its columns): nothing
    // slides; a column whose text is cut is dragged sideways, by exactly what is cut, so that its end
    // stops where the fade begins, and shows no scrollbar; a column whose text fits cannot be dragged
    // at all (the slanted types lean 0.84px over their own end, which a scroller counts and rounds up,
    // so their way is up to 2px longer and one that just fits may give 1px); a tap on a tag filters.
    // The fade is the last 1em of a column, 13px: a list dragged to its end has its last tag clear of it.
    {
        const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, hasTouch: true });
        const page = await context.newPage();
        await page.goto(`${base}/`);
        await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
        await page.evaluate(() => document.fonts.ready.then(() => true));
        if (!await page.evaluate(() => matchMedia('(hover: none)').matches)) check('6. on a touch screen at 820px: ok (this browser says it can hover; the check was skipped)', true);
        else {
            const cells = await page.evaluate(() => [...document.querySelectorAll('project-index .clip')].map((c, k) => {
                const px = (v) => parseFloat(v) || 0;
                const line = c.querySelector('.line');
                const cs = getComputedStyle(c);
                const ls = getComputedStyle(line);
                c.scrollLeft = 10000;
                const tag = [...c.querySelectorAll('.tag')].at(-1)?.getBoundingClientRect();
                const at = { k, slug: c.closest('.row').dataset.slug, over: px(ls.width) - (c.getBoundingClientRect().width - px(cs.paddingLeft) - 13), drag: c.scrollLeft, cut: cs.overflowX, bar: c.offsetHeight - c.clientHeight, moved: ls.translate, tags: Boolean(tag), last: tag ? c.getBoundingClientRect().right - tag.right : 13 };
                c.scrollLeft = 0;
                return at;
            }));
            const wrong = cells.filter(c => c.cut !== 'auto' || c.bar !== 0 || c.moved !== 'none' || (c.over <= 0.01 ? c.drag > 1 : c.drag < c.over - 1 || c.drag > c.over + 2.5 || c.last < 11.5));
            const most = cells.filter(c => c.over > 0.01 && c.tags).sort((a, b) => b.over - a.over)[0];
            let tapped = 'no type list is cut';
            if (most) {
                const spot = await page.evaluate((k) => {
                    const c = document.querySelectorAll('project-index .clip')[k];
                    c.scrollIntoView({ block: 'center', behavior: 'instant' });
                    c.scrollLeft = 10000;
                    const tag = [...c.querySelectorAll('.tag')].at(-1);
                    const b = tag.getBoundingClientRect();
                    return { tag: tag.dataset.tag, x: b.left + b.width / 2, y: b.top + b.height / 2 };
                }, most.k);
                await page.touchscreen.tap(spot.x, spot.y);
                tapped = await page.waitForFunction((t) => new URLSearchParams(location.search).get('filter') === t, spot.tag, { timeout: 5000 }).then(() => spot.tag, () => '');
            }
            check(`6. on a touch screen at 820px nothing slides: the ${cells.filter(c => c.over > 0.01).length} columns whose text is cut are dragged sideways to their end and no further, the ${cells.filter(c => c.over <= 0.01).length} whose text fits cannot be dragged, none shows a scrollbar, and a tap on a tag dragged into view filters (${tapped})`,
                cells.length > 0 && wrong.length === 0 && Boolean(tapped), wrong.slice(0, 4).map(c => `${c.slug}: ${c.cut}, cut by ${c.over.toFixed(1)}, drags ${c.drag}, last tag ${c.last.toFixed(1)} before the edge, ${c.moved}, bar ${c.bar}`).join('; '));
        }
        await context.close();
    }

    // 4. a touch screen, 390px wide: a project page scrolls freely (no snapping), its sets one
    // under the other, and no photo shows through the header it passes under.
    {
        const shownOn = multi ?? oneSet ?? many;
        const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
        const page = await context.newPage();
        if (shownOn) {
            await page.goto(`${base}/projects/${shownOn.data.slug}/`);
            await slidesReady(page);
            await page.waitForFunction(() => { const img = document.querySelector('project-slides .slide.current img'); return img.complete && img.naturalWidth > 0; });
            await page.evaluate(() => document.fonts.ready);
            const start = await lie(page);
            // The header as it is with nothing under it; its last 8px are left clear for the shadow of a photo at rest under it.
            const clip = { x: 0, y: 0, width: 390, height: Math.round(start.head.bottom) - 8 };
            const pixels = async () => sharp(await page.screenshot({ clip })).raw().toBuffer();
            const clear = await pixels();
            // A place between two stops, with the first photo half under the header.
            const y = Math.round(start.sets[0].frame.top + start.sets[0].frame.height / 2 - start.head.bottom / 2);
            await page.evaluate(to => scrollTo({ top: to, behavior: 'instant' }), y);
            await rest(page);
            const at = await lie(page);
            const under = at.sets[0].frame.top < 0 && at.sets[0].frame.bottom > at.head.bottom;
            const covered = await pixels();
            let differ = 0;
            for (let i = 0; i < clear.length; i++) if (clear[i] !== covered[i]) differ++;
            const stack = at.sets.every((set, i) => i === 0 || set.top >= at.sets[i - 1].bottom - 0.5);
            check(`4. on a touch screen at 390px a project page scrolls freely, its sets one under the other, with no horizontal scroll (${shownOn.data.slug})`, !at.mouse && at.snap === 'none' && Math.abs(at.y - y) <= 1 && stack && at.wide <= 390, `asked for ${y}, rests at ${at.y}; snap ${at.snap}; ${at.wide}px wide`);
            check('3. the header keeps its place and nothing of a photo passing under it shows through', under && at.head.top === 0 && at.headOnTop && differ === 0, under ? `${differ} of ${clear.length} colour values changed` : 'no photo was under the header');
        }
        await context.close();
    }

    // 5. CMS fields
    {
        const config = matter(`---\n${readFileSync(join(root, '.pages.yml'), 'utf8')}\n---\n`, {}).data;
        const collection = (config.content ?? []).find(c => c.name === 'projects');
        const fields = new Map((collection?.fields ?? []).map(f => [f.name, f]));
        const keys = new Set(fronts.flatMap(f => Object.keys(f.data)));
        const unknown = [...keys].filter(k => !fields.has(k));
        check('5. every project front-matter key is a field in .pages.yml', unknown.length === 0, unknown.join(', '));
        const vocab = new Set((fields.get('tags')?.options?.values ?? []).map(v => (typeof v === 'object' ? v.value ?? v.name : v)));
        const used = [...new Set(fronts.flatMap(f => f.data.tags ?? []))].filter(t => !vocab.has(t));
        check('5. every tag in use is in the tags select', used.length === 0, used.join(', '));
        const photoFields = new Map((fields.get('images')?.fields ?? []).map(f => [f.name, f]));
        const photoKeys = [...new Set(fronts.flatMap(f => photos(f).flatMap(im => Object.keys(im))))].filter(k => !photoFields.has(k));
        check('5. every key of a project photo (image, alt, caption, set) is a field in .pages.yml', photoKeys.length === 0, photoKeys.join(', '));
        const set = photoFields.get('set');
        check('5. a photo\'s set is a number field in .pages.yml, whole numbers from 1', set?.type === 'number' && set?.options?.min === 1 && set?.options?.step === 1, JSON.stringify(set ?? null));
        const files = (config.content ?? []).filter(c => c.type === 'file').map(c => c.path).sort();
        check('5. the two text pages are editable', JSON.stringify(files) === JSON.stringify(['content/site/index.md', 'content/site/info.md']), files.join(', '));
    }
} finally {
    await browser.close();
    server.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\nverify: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
