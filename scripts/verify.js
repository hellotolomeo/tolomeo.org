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
 *      header as the design's one slideshow does.
 *   4. 390px: no horizontal scroll on any route; on a touch screen a project
 *      page scrolls freely.
 *   5. CMS: every front-matter key in content/ is a field in .pages.yml, and every
 *      tag in use is in the tags select.
 *   6. The Index's proportions at 1366px: a cell is a quarter of the page, five
 *      list rows are one cell tall, thumbnails are whole, centred and framed.
 *   7. The Index below 720px: one thumbnail to a row, each whole, framed, centred
 *      and as large as fits, its title 10px under its frame and 32px before the
 *      next one, in the list titles' type; the same projects in the grid and the
 *      list when a tag is clicked. From 720px up the titles are not displayed
 *      and the cells keep their fixed proportion.
 *   + zero mutations on the first render and on a forced el.render();
 *   + zero console errors and page errors on every route, JS on and off.
 * Exits 1 if anything fails.
 */
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { extname, join, normalize, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { markdown, markdownText } from '../server/markdown.js';

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
// A photo's file name without its extension: the built file's name starts with it.
const stem = (im) => decodeURIComponent(String(im.image)).split('/').pop().replace(/\.[^.]+$/, '');
// Two tags to filter by, taken from the content: the most used, and the most used of the rest.
const counts = new Map();
for (const p of published) for (const t of p.data.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
const [tagA, tagB] = [...counts].sort((a, b) => b[1] - a[1]).map(([t]) => t);

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
// A project page as it lies in the window: the header, each set with its current photo's frame, chevrons and caption, the information.
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
                prev: seen(now?.querySelector('.prev')) ? box(now.querySelector('.prev')) : null,
                next: seen(now?.querySelector('.next')) ? box(now.querySelector('.next')) : null,
                caption: seen(now?.querySelector('.caption')) ? box(now.querySelector('.caption')) : null,
            };
        }),
        info: box(document.querySelector('#project-info')),
        row: box(document.querySelector('#project-info .row')),
    };
});
// What the design gives the current photo of a set (CLAUDE.md, "Slideshow"): the set is the window
// less the 79px header; the frame is the largest that fits the page less, on each side, a 44px
// chevron target, a 14.25px gap and a 16px edge, and the set's height less the 63px caption room,
// its 6px border included; it is centred in the page, the caption room under it, a chevron 14.25px
// from either side. For a photo of 1.4995 at 1366 × 710 that is the 845.72 × 567.98 frame at
// 260.14, 79 the one slideshow had before there were sets. Returns what is off, or ''.
const offDesign = (set, at) => {
    const near = (a, b) => Math.abs(a - b) <= 0.5;
    const off = [];
    if (!set.frame) return 'no photo shown';
    const room = Math.max(63, set.caption ? set.caption.height + 23.4 : 0);
    const width = Math.min(at.vw - 2 * (44 + 14.25 + 16) - 12, (Math.max(160, at.vh - 79 - 63) - 12) * set.a);
    const frame = { width: width + 12, height: width / set.a + 12 };
    if (!near(set.width, at.vw) || !near(set.height, Math.max(at.vh - 79, frame.height + room))) off.push(`set ${set.width}×${set.height}`);
    if (!near(set.frame.width, frame.width) || !near(set.frame.height, frame.height)) off.push(`frame ${set.frame.width}×${set.frame.height}, not ${frame.width}×${frame.height}`);
    if (!near(set.frame.left, (at.vw - frame.width) / 2)) off.push(`frame left ${set.frame.left}`);
    if (!near(set.frame.top - set.top, (set.height - frame.height - room) / 2)) off.push(`frame ${set.frame.top - set.top} under the set's top`);
    if (set.count > 1 && !set.prev && !set.next) off.push('no chevron');
    for (const arrow of [set.prev, set.next]) {
        if (!arrow) continue;
        const gap = arrow === set.prev ? set.frame.left - arrow.right : arrow.left - set.frame.right;
        if (!near(gap, 14.25) || !near(arrow.width, 44) || !near(arrow.height, 44) || !near(arrow.top + 22, set.frame.top + set.frame.height / 2)) off.push(`chevron ${gap} from the frame`);
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
        for (const p of published) {
            const res = await fetch(`${base}/projects/${p.data.slug}/`);
            const firstWords = opening(p.content);
            const body = await res.text();
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
        // and focus stays in the list.
        await page.goto(`${base}/?filter=${both}`);
        await page.waitForTimeout(100);
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
            check('3. the title scrolls the project information to directly under the header', Math.abs(info.row.top - info.head.bottom) <= 1 && info.head.top === 0, `first row at ${info.row.top}, header to ${info.head.bottom}`);
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

            // A one-set project is the design's one slideshow: its frame is where it was before there were sets.
            if (oneSet) {
                const at = await open(oneSet);
                const off = offDesign(at.sets[0], at);
                check(`3. a one-set project opens as the design's one slideshow: the set fills the window under the header, the frame as large as fits (${oneSet.data.slug})`, at.sets.length === 1 && off === '' && Math.abs(at.sets[0].top - 79) <= 0.5 && at.y === 0, off || `${at.sets.length} set, its top at ${at.sets[0].top}, the page at ${at.y}`);
            }

            // Set by set, then the information: where the page rests, and what the header does meanwhile.
            const walked = multi ?? oneSet;
            if (walked) {
                const start = await open(walked);
                const stops = [];
                const header = [];
                const frames = [];
                const note = (at, i) => {
                    if (at.head.top !== 0 || !at.headOnTop) header.push(`at ${at.y}: header top ${at.head.top}, Back and title ${at.headOnTop ? 'on top' : 'covered'}`);
                    if (i < at.sets.length) {
                        if (Math.abs(at.sets[i].top - at.head.bottom) > 1) stops.push(`set ${i + 1} rests at ${at.sets[i].top}, header to ${at.head.bottom}`);
                        const off = offDesign(at.sets[i], at);
                        if (off) frames.push(`set ${i + 1}: ${off}`);
                    } else if (Math.abs(at.row.top - at.head.bottom) > 1) stops.push(`the information rests at ${at.row.top}, header to ${at.head.bottom}`);
                };
                note(start, 0);
                for (let i = 1; i <= start.sets.length; i++) note(await wheel(), i);
                const end = await lie(page);
                const back = await wheel(false);
                if (Math.abs(back.sets.at(-1).top - back.head.bottom) > 1) stops.push(`back up: the last set rests at ${back.sets.at(-1).top}`);
                check(`3. after a turn of the wheel the page rests with the next set, and after the last set the information, directly under the header (${walked.data.slug}, ${start.sets.length} set${start.sets.length > 1 ? 's' : ''})`, start.mouse && start.snap.includes('mandatory') && stops.length === 0, start.mouse ? stops.join('; ') : 'this browser has no fine pointer: the page does not snap');
                check('3. the header stays at the top of the window while the page scrolls, Back and the title on top', header.length === 0 && end.y > 0, header.join('; '));
                check('3. each set at rest fills the window under the header as the one slideshow does: same frame, same place, chevrons 28px either side', frames.length === 0, frames.join('; '));
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
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowLeft');
                const after = (await indexes()).join();
                check('3. back at the top the keys move the first set; with the information in the window they move nothing', first === only(0, Math.min(1, want[0].length - 1)) && Math.abs(there.row.top - there.head.bottom) <= 1 && after === first, `${first} then ${after}`);
            }

            // A long information section is taller than a small window: all of it can be reached.
            if (longest) {
                await page.setViewportSize({ width: 720, height: 500 });
                await open(longest);
                // Here the page could scroll further than the section's top, so the link has to stop there itself.
                await page.click('.project-head h1 a');
                await rest(page);
                const linked = await lie(page);
                check('3. the title lands a long information section\'s first row directly under the header (720 × 500)', Math.abs(linked.row.top - linked.head.bottom) <= 1 && linked.y > 0, `first row at ${linked.row.top}, header to ${linked.head.bottom}, ${Math.round(linked.max - linked.y)}px left to scroll`);
                await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
                await rest(page);
                let at = await lie(page);
                for (let i = 0, last = -1; i < 60 && at.y !== last; i++) { last = at.y; at = await wheel(); }
                const taller = at.info.height > at.vh - at.head.bottom + 1;
                const reached = at.y >= at.max - 1 && at.info.bottom <= at.vh + 1;
                // Inside a section taller than the window the page scrolls freely: a small turn back stays where it stops.
                let free = true;
                if (taller && at.info.height - (at.vh - at.head.bottom) > 90) {
                    await page.mouse.wheel(0, -60);
                    await rest(page);
                    const inside = await lie(page);
                    free = Math.abs(inside.y - (at.y - 60)) <= 1;
                }
                check(`3. the bottom of the longest information section can be reached by wheel at 720 × 500, and it scrolls freely inside (${longest.data.slug}: ${Math.round(at.info.height)}px${taller ? '' : ', not taller than the window'})`, reached && free, `rests at ${at.y} of ${at.max}, the section ends at ${at.info.bottom}`);
                await page.setViewportSize({ width: 1366, height: 710 });
            }
        }

        // 6. the Index's proportions at the design's width
        {
            await page.setViewportSize({ width: 1366, height: 710 });
            await page.goto(`${base}/`);
            await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
            const m = await page.evaluate(() => {
                const box = (el) => el.getBoundingClientRect();
                const cells = [...document.querySelectorAll('project-index .cell')];
                const rows = [...document.querySelectorAll('project-index .row')];
                const page = document.documentElement.clientWidth;
                const cell = box(cells[0]);
                const lines = [...document.querySelectorAll('.site-head, .site-head *, project-index, project-index *')].filter((el) => {
                    const s = getComputedStyle(el);
                    return !el.classList.contains('box') && (parseFloat(s.borderTopWidth) + parseFloat(s.borderRightWidth) + parseFloat(s.borderBottomWidth) + parseFloat(s.borderLeftWidth) > 0 || s.boxShadow !== 'none');
                }).length;
                const thumbs = cells.filter(c => c.querySelector('.box')).map((c) => {
                    const a = box(c);
                    const b = box(c.querySelector('.box'));
                    const img = c.querySelector('img');
                    return {
                        fits: b.width <= a.width * 0.91 + 0.5 && b.height <= a.height * 0.865 + 0.5,
                        full: b.width >= a.width * 0.91 - 0.5 || b.height >= a.height * 0.865 - 0.5,
                        centred: Math.abs((b.x + b.width / 2) - (a.x + a.width / 2)) < 0.5 && Math.abs((b.y + b.height / 2) - (a.y + a.height / 2)) < 0.5,
                        whole: Math.abs((b.width - 12) / (b.height - 12) - img.getAttribute('width') / img.getAttribute('height')) < 0.01,
                    };
                });
                return {
                    quarter: Math.abs(cell.width - page / 4) < 0.5,
                    ratio: Math.abs(cell.width / cell.height - 341.2 / 197.12) < 0.005,
                    fifth: rows.every(r => Math.abs(box(r).height - cell.height / 5) < 0.1),
                    columns: Math.abs(box(cells[1]).x - cell.width) < 0.5 && Math.abs(box(cells[2]).y - cell.y - cell.height) < 0.5,
                    thumbs: thumbs.every(t => t.fits && t.full && t.centred && t.whole),
                    scrolls: document.documentElement.scrollHeight <= innerHeight,
                    lines,
                };
            });
            check('6. at 1366px a cell is a quarter of the page, two to a row, and five list rows are one cell tall', m.quarter && m.ratio && m.fifth && m.columns, JSON.stringify(m));
            check('6. every thumbnail is whole, centred, framed and as large as its cell allows', m.thumbs);
            check('6. the two columns scroll on their own, and nothing draws a line', m.scrolls && m.lines === 0, JSON.stringify(m));

            // Narrower, still side by side: a row whose text wraps takes whole row slots, so five slots are still one cell.
            await page.setViewportSize({ width: 1024, height: 768 });
            await page.waitForTimeout(50);
            const narrow = await page.evaluate(() => {
                const slot = document.querySelector('project-index .cell').getBoundingClientRect().height / 5;
                const off = [...document.querySelectorAll('project-index .row')].filter((r) => {
                    const n = r.getBoundingClientRect().height / slot;
                    return Math.abs(n - Math.round(n)) > 0.01 || Math.round(n) < 1;
                }).map(r => r.dataset.slug);
                const quarter = Math.abs(document.querySelector('project-index .cell').getBoundingClientRect().width - document.documentElement.clientWidth / 4) < 0.5;
                return { off, quarter };
            });
            check('6. at 1024px a cell is still a quarter of the page and every row is a whole number of fifths of a cell', narrow.quarter && narrow.off.length === 0, narrow.off.join(', '));

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
            const phone = () => page.evaluate((titles) => {
                const page = document.documentElement.clientWidth;
                const box = (el) => el.getBoundingClientRect();
                const cells = [...document.querySelectorAll('project-index .cell')];
                const rows = [...document.querySelectorAll('project-index .row')];
                const bad = { rows: [], titles: [], thumbs: [] };
                cells.forEach((c, i) => {
                    const slug = c.dataset.slug;
                    const a = box(c);
                    const frame = c.querySelector('.box');
                    const name = c.querySelector('.name');
                    const next = cells[i + 1];
                    const f = frame ? box(frame) : null;

                    // one cell to a row, as wide as the page
                    if (Math.abs(a.left) > 0.5 || Math.abs(a.width - page) > 0.5 || (i > 0 && a.top < box(cells[i - 1]).bottom - 0.5)) bad.rows.push(slug);

                    // the title: shown, the project's own, under its frame and nearer to it than to the next one
                    const n = name ? box(name) : null;
                    const first = next ? next.querySelector('.box') ?? next.querySelector('.name') : null;
                    const after = first ? box(first).top - n?.bottom : null;
                    const under = f ? n?.top - f.bottom : null;
                    const why = [];
                    if (!name || name.getClientRects().length === 0 || getComputedStyle(name).visibility !== 'visible' || n.height < 16) why.push('not shown');
                    else {
                        if (name.textContent !== titles[slug]) why.push(`reads "${name.textContent}"`);
                        if (n.top < a.top - 0.5 || n.bottom > a.bottom + 0.5) why.push('outside its cell');
                        if (under !== null && !(under > 0 && Math.abs(under - 10) < 0.5)) why.push(`${under.toFixed(2)}px under its frame, not 10`);
                        if (after !== null && !(after > 0 && Math.abs(after - 32) < 0.5)) why.push(`${after.toFixed(2)}px before the next, not 32`);
                        if (under !== null && after !== null && !(under < after)) why.push('nearer to the next frame than to its own');
                        if (n.width > page * 0.91 + 0.5 || Math.abs((n.left + n.right) / 2 - page / 2) > 0.5) why.push('not centred within 91% of the page');
                    }
                    if (why.length) bad.titles.push(`${slug}: ${why.join(', ')}`);

                    // the thumbnail: whole, framed, centred, as large as fits 91% of the page's width and 49.9733% of it in height
                    if (frame) {
                        const s = getComputedStyle(frame);
                        const img = frame.querySelector('img');
                        const im = box(img);
                        const wrong = [];
                        if (Math.abs((f.width - 12) / (f.height - 12) - img.getAttribute('width') / img.getAttribute('height')) > 0.01
                            || Math.abs(im.width - (f.width - 12)) > 0.5 || Math.abs(im.height - (f.height - 12)) > 0.5) wrong.push('cropped');
                        if (!['Top', 'Right', 'Bottom', 'Left'].every(k => s[`border${k}Width`] === '6px') || s.boxShadow === 'none') wrong.push('not framed');
                        if (Math.abs((f.left + f.right) / 2 - page / 2) > 0.5) wrong.push('not centred');
                        if (f.width > page * 0.91 + 0.5 || f.height > page * 0.499733 + 0.5) wrong.push('too large');
                        if (f.width < page * 0.91 - 0.5 && f.height < page * 0.499733 - 0.5) wrong.push('smaller than fits');
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
                };
            }, titles);
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
                check(`7. ${at} every project's title shows under its thumbnail: 10px under its own frame, 32px before the next`, m.titles.length === 0 && m.cells.length === published.length, m.titles.slice(0, 5).join(' | '));
                check(`7. ${at} every thumbnail is whole, framed, centred and as large as fits`, m.thumbs.length === 0, m.thumbs.slice(0, 5).join(' | '));
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
        }

        // 4. 390px
        await page.setViewportSize({ width: 390, height: 844 });
        const wide = [];
        for (const path of routes) {
            await page.goto(base + path);
            await page.waitForTimeout(30);
            const w = await page.evaluate(() => document.documentElement.scrollWidth);
            if (w > 390) wide.push(`${path} (${w}px)`);
        }
        check('4. no horizontal scroll at 390px on any route', wide.length === 0, wide.join(', '));

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
            // The header as it is with nothing under it; its last 8px are left clear for the shadow of a frame at rest under it.
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
