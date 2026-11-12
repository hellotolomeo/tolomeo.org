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
 *      every photo in the HTML; the photos show one at a time (chevrons, a click
 *      on the photo, the arrow keys), and all of them with JavaScript off.
 *   4. 390px: no horizontal scroll on any route.
 *   5. CMS: every front-matter key in content/ is a field in .pages.yml, and every
 *      tag in use is in the tags select.
 *   6. The Index's proportions at 1366px: a cell is a quarter of the page, five
 *      list rows are one cell tall, thumbnails are whole, centred and framed.
 *   + zero mutations on the first render and on a forced el.render();
 *   + zero console errors and page errors on every route, JS on and off.
 * Exits 1 if anything fails.
 */
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { extname, join, normalize, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
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
// The project pages the slideshow checks use: the one with the most photos, one with a single photo, one with captions.
const many = [...published].sort((a, b) => photos(b).length - photos(a).length)[0];
const single = published.find(p => photos(p).length === 1);
const captioned = published.find(p => photos(p).length > 1 && photos(p).some(im => im.caption));

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
            if (shown !== photos(p).length || captions.length) photoMisses.push(`${p.data.slug} (${shown}/${photos(p).length} photos, ${captions.length} captions missing)`);
        }
        check('1+3. every project page answers 200 with its title and description in the HTML', pageMisses.length === 0, pageMisses.join(', '));
        check('1+3. every project page has every photo and caption in the HTML', photoMisses.length === 0, photoMisses.join(', '));
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
        const slideshows = published.filter(p => photos(p).length > 1).map(p => [`/projects/${p.data.slug}/`, 'project-slides']);
        for (const [path, tag] of [['/', 'project-index'], ['/projects/', 'project-index'], ...slideshows]) {
            await page.goto(base + path);
            await page.waitForFunction(t => document.querySelector(t)?.rendered, tag);
            const first = await page.evaluate(() => window.__mutations());
            check(`zero mutations on first render: ${path}`, first.length === 0, first.slice(0, 5).join('; '));
            const forced = await page.evaluate(t => { document.querySelector(t).render(); return window.__mutations(); }, tag);
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

        // 3. the photos, one at a time
        if (many && photos(many).length > 2) {
            const count = photos(many).length;
            await page.goto(`${base}/projects/${many.data.slug}/`);
            await page.waitForFunction(() => document.querySelector('project-slides')?.rendered);
            const look = () => page.evaluate(() => {
                const seen = (el) => Boolean(el) && el.getClientRects().length > 0;
                const slides = [...document.querySelectorAll('project-slides .slide')];
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
            await page.click('project-slides .current .next');
            const second = await look();
            const muts = await page.evaluate(() => window.__mutations());
            const other = muts.filter(m => !['attributes LI [class]', 'attributes IMG [loading]', 'characterData #text'].includes(m));
            check('3. the "next" chevron shows the second photo, between two chevrons, and keeps focus', second.shown === 1 && second.current === 1 && second.prev && second.next && second.focus.includes('next'), JSON.stringify(second));
            check('3. changing photo touches only the current class, the next photo\'s loading and the status line', other.length === 0, other.slice(0, 5).join('; '));
            await page.click('project-slides .current .frame');
            const third = await look();
            await page.keyboard.press('ArrowLeft');
            const left = await look();
            check('3. a click on the photo goes on, the left arrow key goes back', third.current === 2 && left.current === 1, `${third.current}, ${left.current}`);
            await page.focus('project-slides .current .next');
            await page.keyboard.press('ArrowRight');
            const kept = await page.evaluate(() => document.activeElement?.closest('project-slides .slide.current') !== null && document.activeElement?.classList.contains('arrow'));
            check('3. an arrow key pressed while a chevron has focus keeps focus on a chevron of the new photo', kept);
            for (let i = 0; i < count + 1; i++) await page.keyboard.press('ArrowRight');
            const end = await look();
            await page.click('project-slides .current .frame');
            const still = await look();
            check('3. the last photo has no "next", and a click on it stays', end.current === count - 1 && end.prev && !end.next && still.current === count - 1, JSON.stringify(end));
            await page.click('.project-head h1 a');
            await page.waitForFunction(() => location.hash === '#project-info');
            await page.waitForTimeout(700);
            const info = await page.evaluate(() => { const top = document.querySelector('#project-info').getBoundingClientRect().top; return top < innerHeight; });
            check('3. the title scrolls to the project information', info);
        }
        if (captioned) {
            const at = photos(captioned).findIndex(im => im.caption);
            await page.goto(`${base}/projects/${captioned.data.slug}/`);
            await page.waitForFunction(() => document.querySelector('project-slides')?.rendered);
            for (let i = 0; i < at; i++) await page.keyboard.press('ArrowRight');
            const shown = await page.evaluate(() => [...document.querySelectorAll('project-slides .caption')].filter(c => c.getClientRects().length).map(c => c.textContent.replace(/\s+/g, ' ').trim()));
            check('3. a photo\'s caption shows under it, and only its own', shown.length === 1 && shown[0] === words(photos(captioned)[at].caption), shown.join(' | '));
        }
        if (single) {
            await page.goto(`${base}/projects/${single.data.slug}/`);
            const lone = await page.evaluate(() => ({ arrows: document.querySelectorAll('project-slides .arrow').length, slides: document.querySelectorAll('project-slides .slide').length, scripts: document.scripts.length }));
            check('3. a project with one photo has no chevrons and no script', lone.arrows === 0 && lone.slides === 1 && lone.scripts === 0, JSON.stringify(lone));
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
        for (const path of routes) {
            await page.goto(base + path);
            if (path === '/') rowsShown = await page.evaluate(() => document.querySelectorAll('project-index .row').length);
            if (many && path === `/projects/${many.data.slug}/`) photosShown = await page.evaluate(() => [...document.querySelectorAll('project-slides .slide')].filter(s => s.getClientRects().length).length);
        }
        check('no console errors with JavaScript off', errs.length === 0, errs.slice(0, 5).join(' | '));
        check('1. with JavaScript off the index shows every row', rowsShown === published.length);
        if (many) check('1. with JavaScript off a project page shows every photo', photosShown === photos(many).length, `${photosShown}/${photos(many).length}`);
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
        const photoFields = new Set((fields.get('images')?.fields ?? []).map(f => f.name));
        const photoKeys = [...new Set(fronts.flatMap(f => photos(f).flatMap(im => Object.keys(im))))].filter(k => !photoFields.has(k));
        check('5. every key of a project photo (image, alt, caption) is a field in .pages.yml', photoKeys.length === 0, photoKeys.join(', '));
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
