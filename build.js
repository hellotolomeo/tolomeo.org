/**
 * Build the site: content/ + images/ → dist/. Every route is rendered with the
 * same createEnvironment the dev server uses, so View Source shows the whole
 * page and the browser's first render changes nothing. dist/images is kept
 * between builds (and cached in CI); processImages resizes only what changed.
 *
 *   node build.js
 */
import nunjucks from 'nunjucks';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEnvironment } from './server/zeldman/zeldman.js';
import { processImages } from './server/images.js';
import { loadContent } from './server/content.js';
import { routes, fileFor } from './server/routes.js';
import config from './site.config.js';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'dist');
const started = Date.now();

// Clear the last build, except the processed images.
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) {
    if (name !== 'images') rmSync(join(out, name), { recursive: true, force: true });
}

const images = await processImages({ root, out, log: console.log });
const data = loadContent({ root, images, config, log: console.warn });
const site = createEnvironment(nunjucks, { templates: [root], components: join(root, 'components') });

const write = (file, text) => {
    const path = join(out, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
};

const pages = routes(data, config);
for (const route of pages) write(fileFor(route.path), site.render(route.page, route.context));

// What the browser loads as files.
const copy = (from, to = from, filter = () => true) => {
    if (existsSync(join(root, from))) cpSync(join(root, from), join(out, to), { recursive: true, filter: src => filter(src) });
};
copy('components');
copy('client');
copy('lib', 'lib', src => !src.includes(`${join(root, 'lib', 'zeldman')}`));
copy('fonts');
// The files that sit at the site's root as they are: the favicons.
copy('public', '.');
write('client/covers.css', data.coversCss);
write('client/slides.css', data.slidesCss);
write('CNAME', 'tolomeo.org\n');
write('.nojekyll', '');
write('robots.txt', 'User-agent: *\nDisallow:\n');

console.log(`build: ${pages.length} pages, ${data.projects.length} projects, ${((Date.now() - started) / 1000).toFixed(1)}s → dist/`);
