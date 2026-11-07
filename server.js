/**
 * The dev server: http://localhost:3100. Renders every page per request from
 * the same templates, data layer and createEnvironment as build.js (noCache:
 * templates are re-read on every render), and serves components/, client/,
 * lib/ and fonts/ from the repo with Cache-Control: no-cache and an ETag, as
 * the Zeldman adapters do. Images are processed into dist/images (cached by
 * hash) and served from there. Restart after editing a component's .js
 * `static props`; everything else is live.
 *
 *   npm run dev
 */
import nunjucks from 'nunjucks';
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEnvironment } from './server/zeldman/zeldman.js';
import { processImages } from './server/images.js';
import { loadContent } from './server/content.js';
import { routes } from './server/routes.js';
import config from './site.config.js';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'dist');
const site = createEnvironment(nunjucks, { templates: [root], components: join(root, 'components'), noCache: true });

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.otf': 'font/otf',
    '.txt': 'text/plain; charset=utf-8',
};
// URL prefix → directory on disk.
const STATIC = [
    ['/components/', join(root, 'components')],
    ['/client/', join(root, 'client')],
    ['/lib/', join(root, 'lib')],
    ['/fonts/', join(root, 'fonts')],
    ['/images/', join(out, 'images')],
];

async function load() {
    const images = await processImages({ root, out, log: () => {} });
    return loadContent({ root, images, config, log: console.warn });
}

function send(res, status, type, body) {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(body);
}

function serveFile(req, res, path) {
    let stat;
    try { stat = statSync(path); } catch { return false; }
    if (!stat.isFile()) return false;
    const etag = `"${stat.size.toString(36)}-${stat.mtimeMs.toString(36)}"`;
    if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' });
        res.end();
        return true;
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream', ETag: etag, 'Cache-Control': 'no-cache' });
    createReadStream(path).pipe(res);
    return true;
}

const server = createServer(async (req, res) => {
    try {
        const { pathname } = new URL(req.url, 'http://localhost');
        if (pathname === '/client/covers.css') return send(res, 200, TYPES['.css'], (await load()).coversCss);
        for (const [prefix, dir] of STATIC) {
            if (!pathname.startsWith(prefix)) continue;
            if (prefix === '/lib/' && pathname.startsWith('/lib/zeldman/')) break;
            const path = normalize(join(dir, decodeURIComponent(pathname.slice(prefix.length))));
            if (path.startsWith(dir + sep) && serveFile(req, res, path)) return;
            break;
        }
        const data = await load();
        const all = routes(data, config);
        const page = all.find(r => r.path === pathname || r.path === `${pathname}/`);
        if (page && page.path !== '/404.html') return send(res, 200, TYPES['.html'], site.render(page.page, page.context));
        const missing = all.find(r => r.path === '/404.html');
        send(res, 404, TYPES['.html'], site.render(missing.page, missing.context));
    } catch (err) {
        console.error(err);
        send(res, 500, 'text/plain; charset=utf-8', String(err?.stack ?? err));
    }
});

const host = process.env.HOST ?? 'localhost';
const port = Number(process.env.PORT ?? 3100);
server.listen(port, host, () => console.log(`tolomeo.org dev: http://${host}:${port}`));
