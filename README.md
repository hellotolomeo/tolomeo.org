# tolomeo.org

Portfolio site for Tolomeo, an artist researcher, publisher and educator in the Netherlands.
A static site: every page is rendered to HTML at build time, served by GitHub Pages, and edited in
[Pages CMS](https://pagescms.org). **Editing the site? Read [`EDITING.md`](EDITING.md).**

The spec is [`BRIEF.md`](BRIEF.md); decisions on the build plan are in
[`BUILD-PLAN-RESPONSE.md`](BUILD-PLAN-RESPONSE.md); standing rules for Claude Code are in [`CLAUDE.md`](CLAUDE.md).

## Commands

Node 20.9 or later.

```bash
npm ci
```

```bash
npm run dev
```
Dev server on http://localhost:3100. Pages render on every request from the same templates and
data as the build, so edits to `content/`, templates and CSS show on reload. Restart it after
changing a component's `static props`.

```bash
npm run build
```
Writes `dist/`: every page, the processed images (600/1200/2000px JPEG + WebP, cached by content
hash in `dist/images/`, so a rebuild only resizes new photos), and the files the browser loads.

```bash
npm run verify
```
After a build: Playwright checks for the acceptance points (HTML before JavaScript, tag filtering,
project URLs, 390px width, the CMS fields, zero DOM mutations on first render, no console errors).
Needs Chromium for Playwright (`npx playwright install chromium`, or set `CHROMIUM_PATH`).

```bash
npm run images -- ~/Pictures/riso-salon the-riso-salon
```
Optional bulk tool for many photos at once: makes 2000px web copies named `the-riso-salon-01.jpg`…
in `images/projects/the-riso-salon/` and prints the `images:` list to paste. Never touches the
originals. Uploading through the CMS works too; CI resizes and converts anything large or HEIC.

The project text and photos were imported once from Claude Design's site update
(`site-data.json`) with `scripts/import-site-data.js`; since then `content/` (edited in Pages CMS)
is the source of truth. The old spreadsheet importer, `scripts/import-projects.py`, is superseded:
don't run it, it would bring back the spreadsheet's typos and old titles.

```
content/            Markdown + YAML front matter: projects/, site/index.md, site/info.md
images/projects/    photos, one folder per project (the CMS writes full /images/… paths)
site.config.js      the BRIEF §9 assumptions, one constant each
build.js            content + images → dist/          server.js   the dev server
server/             build-time only: content.js (data layer), markdown.js, images.js, routes.js,
                    zeldman/ (the vendored Node adapter)
shared/pages/       page templates (index, project, info, 404, tools/thumbnail)
components/         project-index (the home page: grid + list + filter), thumbnail-tuner,
                    project-detail/ (the project page partial — the one file a final design replaces)
client/             browser only: main.js, tuner.js, template-env.js, lib/ (BaseComponent), site.css
lib/                vendor/ (nunjucks, idiomorph), filters.js, zeldman/ (upstream docs + UPSTREAM hash)
scripts/            prepare-images, normalize-images (CI), import-covers and import-site-data (one-off), import-projects (superseded), verify
```

Built with [the Zeldman Pattern](https://github.com/erikswedberg/zeldman): a component is a Nunjucks
template, a stylesheet and a small class. The build renders each component's template inside its
tag; in the browser the class renders the same template from its state and morphs the DOM, so the
first render changes nothing. On the home page, `<project-index>` carries the published projects as
JSON; a tag click is one `setState()` that removes only the rows and cells that stop matching.

## Deploying

`.github/workflows/deploy.yml` runs on every push to `main` (a save in Pages CMS is one): `npm ci`, then
`scripts/normalize-images.js` (HEIC/TIFF → JPEG, anything over 2000px shrunk; changes are committed back
by the Actions bot with `[skip ci]`), then `npm run build` with `dist/images` restored from the cache,
then upload and deploy to GitHub Pages. Pull requests build without deploying.

One-time settings on GitHub (repository owner):

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Settings → Pages → Custom domain: `tolomeo.org`, then DNS at the registrar (apex `A` records to
   GitHub Pages' addresses, `www` `CNAME` to `hellotolomeo.github.io`), then **Enforce HTTPS**. With an
   Actions deploy the `CNAME` file in `dist/` is ignored; the setting is what counts.
3. `main` must accept direct pushes from Pages CMS and from the Actions bot (no rule requiring pull
   requests), or saves and the image commit-back are refused.
4. Pages CMS: install its GitHub app on this repository and invite Tolomeo (see `EDITING.md`).
