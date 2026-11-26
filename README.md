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
After a build: Playwright checks for the acceptance points and the design's measures (HTML before
JavaScript, tag filtering, every address a built page points at, project URLs and their photo sets
(one slideshow each, the header that stays; from 900px the photos in the left half and the project's
information in place on the right, nothing snapping, the words "previous" and "next" in the window's
corners; below 900px one column that snaps from set to set and then to the information), the double
click that opens a picture, the About and Collaborations pages, 390px width, the CMS fields, the home
page (its intro, the index that fills the window from 720px, the list's three one-line columns, where
text too long for a column is cut with a fade and slides while its row is pointed at, the one-column
layout below 720px), zero DOM mutations on first render, no console errors). About 3 minutes.
Needs Chromium for Playwright (`npx playwright install chromium`, or set `CHROMIUM_PATH`).

```bash
npm run images -- ~/Pictures/riso-salon the-riso-salon
```
Optional bulk tool for many photos at once: makes 2000px web copies named `the-riso-salon-01.jpg`…
in `images/projects/the-riso-salon/` and prints the `images:` list to paste. Never touches the
originals. Uploading through the CMS works too; CI resizes and converts anything large or HEIC.

The project text, thumbnails and photos were first imported from Claude Design's site kit with
`scripts/import-site-data.js` (for the redesign of 11 Nov 2026) and then replaced by the owner's
own list, captions and photos on 18 Nov 2026; since then `content/` (edited in Pages CMS) is the
source of truth. That importer, the old spreadsheet importer `scripts/import-projects.py` and the
design-canvas cover migration `scripts/import-covers.js` are all superseded: don't run them (the
first would put the kit's photos and texts back and drop the photo sets).

## How it fits together

```
content/            Markdown + YAML front matter: projects/, site/index.md (the home page's intro),
                    site/info.md (the About page), site/collaborations.md
images/projects/    photos, one folder per project (the CMS writes full /images/… paths)
images/info/, images/collaborations/   the picture of the About and of the Collaborations page
public/             files copied to the site root as they are (the favicons)
fonts/              Fluxisch Else Light and Bold (.woff2, .otf as fallback)
site.config.js      the BRIEF §9 assumptions, one constant each
build.js            content + images → dist/          server.js   the dev server
server/             build-time only: content.js (data layer), markdown.js, images.js, routes.js,
                    zeldman/ (the vendored Node adapter)
shared/pages/       page templates (index, project, sheet: About and Collaborations, 404)
components/         project-index (the home page: grid + list + filter),
                    project-slides (one set of a project page's photos, one at a time)
client/             browser only: main.js and project.js (page entries), zoom.js (a double click
                    opens a picture), template-env.js, lib/ (BaseComponent), site.css, project.css,
                    sheet.css; the build adds covers.css, slides.css and figures.css (proportions)
lib/                vendor/ (nunjucks, idiomorph), filters.js, zeldman/ (upstream docs + UPSTREAM hash)
scripts/            prepare-images, normalize-images (CI), verify; import-site-data,
                    import-covers and import-projects (superseded: don't run)
```

Built with [the Zeldman Pattern](https://github.com/erikswedberg/zeldman): a component is a Nunjucks
template, a stylesheet and a small class. The build renders each component's template inside its
tag; in the browser the class renders the same template from its state and morphs the DOM, so the
first render changes nothing. On the home page, `<project-index>` carries the published projects as
JSON; a tag click is one `setState()` that removes only the rows and cells that stop matching. On a
project page there is one `<project-slides>` per set of photos (`images[].set`), one under the
other, each carrying its photos; every one is in the HTML, and the chevrons, a click on the photo
or the arrow keys change which one shows in the set on screen. The header stays at the top of the
window. From 900px wide the sets are the left half of the page and the project's information (plain
HTML: description, type, role, client, years, more details) stays in place on the right; below
900px the information comes after the sets, and with a mouse or trackpad the page snaps from set to
set, then to it. The words "previous" and "next" link to the project before and the project after
in the Index's order. The About and Collaborations pages are one template: a text with one picture.
`client/zoom.js` opens a photo or picture to the full window on a double click; it is the one
script outside the components, and it touches nothing until then.

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
