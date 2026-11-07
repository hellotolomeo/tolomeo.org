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
 *   3. Project pages: every published project's URL answers with its page.
 *   4. 390px: no horizontal scroll on any route.
 *   5. CMS: every front-matter key in content/ is a field in .pages.yml, and every
 *      tag in use is in the tags select.
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
// Two tags to filter by, taken from the content: the most used, and the most used of the rest.
const counts = new Map();
for (const p of published) for (const t of p.data.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
const [tagA, tagB] = [...counts].sort((a, b) => b[1] - a[1]).map(([t]) => t);

// --- a static server for dist/, like GitHub Pages

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.otf': 'font/otf', '.json': 'application/json', '.txt': 'text/plain' };
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

const routes = ['/', '/projects/', '/info/', '/tools/thumbnail/', '/404.html', ...published.map(p => `/projects/${p.data.slug}/`)];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
    // 1. HTML before JS
    {
        const index = await (await fetch(`${base}/`)).text();
        const missingRows = published.filter(p => !index.includes(`id="row-${p.data.slug}"`) || !index.includes(`id="cell-${p.data.slug}"`));
        check('1. index HTML has every published project as a row and a cell', missingRows.length === 0, missingRows.map(p => p.data.slug).join(', '));
        const site = matter(readFileSync(join(root, 'content/site/index.md'), 'utf8'), {}).data;
        check('1. index HTML has the intro', index.includes(site.intro));
        const unpublished = fronts.filter(f => f.data.published !== true && index.includes(`id="row-${f.data.slug}"`));
        check('1. unpublished projects are absent', unpublished.length === 0, unpublished.map(f => f.data.slug).join(', '));
        let pageMisses = [];
        for (const p of published) {
            const res = await fetch(`${base}/projects/${p.data.slug}/`);
            const firstWords = p.content.trim().split('\n')[0]?.replace(/[*_`[\]()#>]/g, '').trim().split(/\s+/).slice(0, 4).join(' ') ?? '';
            const body = await res.text();
            if (res.status !== 200 || !body.includes(`<h1>${html(p.data.title)}</h1>`) || (firstWords && !body.includes(html(firstWords)))) pageMisses.push(p.data.slug);
        }
        check('1+3. every project page answers 200 with its title and description in the HTML', pageMisses.length === 0, pageMisses.join(', '));
        const info = await (await fetch(`${base}/info/`)).text();
        const infoWords = matter(readFileSync(join(root, 'content/site/info.md'), 'utf8'), {}).content.trim().split(/\s+/).slice(0, 3).join(' ');
        check('1. info HTML has its body', info.includes(html(infoWords)), infoWords);
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
                    return el?.closest('project-index, thumbnail-tuner');
                }).map(m => `${m.type} ${m.target.nodeName}${m.attributeName ? ` [${m.attributeName}]` : ''}`);
                records.length = 0;
                return inside;
            };
        });
        for (const [path, tag] of [['/', 'project-index'], ['/projects/', 'project-index'], ['/tools/thumbnail/', 'thumbnail-tuner']]) {
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

        // the project page's index link brings the filter back
        await page.goto(`${base}/?filter=${encodeURIComponent(tagA)}`);
        await page.waitForTimeout(100);
        await page.click('project-index .row .title');
        await page.waitForURL(/\/projects\/.+\//);
        await page.click('.back a');
        await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
        await page.waitForTimeout(100);
        check('2. the project page\'s index link keeps the filter', await page.evaluate(q => location.search === q, `?filter=${encodeURIComponent(tagA)}`));

        // 3. a project from the grid
        await page.goto(`${base}/`);
        const first = published.find(p => !p.data.parent) ?? published[0];
        await page.click(`#cell-${first.data.slug}`);
        await page.waitForURL(`**/projects/${first.data.slug}/`);
        check('3. a grid cell opens its project page', (await page.textContent('h1')).trim() === String(first.data.title).trim());

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
        for (const path of routes) {
            await page.goto(base + path);
            if (path === '/') rowsShown = await page.evaluate(() => document.querySelectorAll('project-index .row').length);
        }
        check('no console errors with JavaScript off', errs.length === 0, errs.slice(0, 5).join(' | '));
        check('1. with JavaScript off the index shows every row', rowsShown === published.length);
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
        const styles = new Set((fields.get('cover_style')?.options?.values ?? []).map(v => (typeof v === 'object' ? v.value ?? v.name : v)));
        check('5. cover_style offers the six styles', ['polaroid', 'polaroid-tall', 'fill', 'small', 'pair', 'none'].every(s => styles.has(s)));
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
