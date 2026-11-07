# tolomeo.org — build brief (v2, 7 Nov 2026)

Portfolio site for Tolomeo, an artist researcher, publisher and educator in the Netherlands.
Read this file completely before writing code. `CLAUDE.md` holds the standing rules;
`BUILD-PLAN-RESPONSE.md` records the decisions taken on the builder's plan of 7 Nov; where that
plan and this brief disagree, the response file wins, then this brief.

## 1. Outcome

A static site, pre-rendered at build time, hosted on GitHub Pages at tolomeo.org, with
content in Markdown files that Pages CMS edits. Three page types: **Index** (the home page,
filterable), **Project** (one template, one page per project), **Info**. All dark. The design is
decided: `design/index-dark.html` and `design/info.html` are exports of the approved artboards
and their inline styles are the measurements. There is no project-page artboard yet (§5.2).

Acceptance, in order of importance:

1. Every page is complete HTML before JavaScript runs (View Source shows the content).
2. Tag filtering on the Index works from the URL and from clicks, touching only what changed.
3. Each project has its own URL and page.
4. Works at 390px wide without horizontal page scroll.
5. Tolomeo can add a project, upload photos, set a thumbnail and edit the two text pages alone
   in Pages CMS, with no terminal, scripts or Claude.

## 2. Stack (decided; do not substitute)

- **The Zeldman Pattern** — https://github.com/erikswedberg/zeldman (docs: https://zeldman.exe.xyz/docs/).
  Vendor it following its own `AGENTS.md` layout (`client/lib/`, `lib/vendor/`, `lib/filters.js`,
  the Node adapter under `server/zeldman/`, docs + `UPSTREAM` hash under `lib/zeldman/`). Follow
  "The contract" and "The dialect" exactly: one component = `components/<name>.html` + `.css` + `.js`;
  `static props` for attributes; `setState()` is the only way the DOM changes; `data-content`
  holds authored content; templates stay in the portable dialect; no inline `style=""` in
  component markup. Preload component templates with `fetch()` so the sync-XHR loader is only a fallback.
- **Pre-render with Node at build time.** `build.js` uses the same `createEnvironment` as the dev
  server, renders every route to `dist/`, copies `components/`, `client/`, `lib/` (not `lib/zeldman/`),
  `fonts/`, and the processed images. No server in production. The browser's first render of a
  pre-rendered page must change nothing (`el.render()` → zero mutations); treat that as a test.
- **Dev loop:** `server.js` with `noCache: true` at `http://localhost:3100`, same templates and data layer.
- **Content:** Markdown + YAML front matter in `content/` (§4), parsed with `gray-matter` (pass `{}`
  options), bodies rendered server-side once with a scoped `Marked` whose renderer keeps `<p>` and
  `<a>` (emails → `mailto:`), degrades everything else to paragraphs/plain text, and escapes raw HTML.
- **Hosting:** GitHub Pages via a GitHub Actions workflow on every push to `main`
  (`npm ci` → image normalize step → `node build.js` → `upload-pages-artifact` → `deploy-pages`),
  `concurrency: pages` without cancel. Custom domain set in Settings → Pages (write `dist/CNAME` too).
- **CMS:** Pages CMS, configured by `.pages.yml` (§7). The only editing UI.
- **Images:** §6.
- Plain JS, plain CSS, ESM throughout, Node ≥ 20.9. Dependencies: `nunjucks`, `gray-matter`,
  `marked`, `sharp`, exact pins; Playwright as a dev dependency for `scripts/verify.js` only.
- Constants for every §9 assumption live in `site.config.js`.

## 3. Visual system (from `design/`)

One colour world, dark.

| Token | Value |
| --- | --- |
| Ground / text | `#000` / `#fff` |
| Grid lines, rules, hover marker, focus ring | `#f28ec1` 1px; focus `2px solid #f28ec1; outline-offset: -2px` |
| Tags | `#b5b7b7`, faux-italic |
| Link hover | `#f28ec1` |
| Scrollbar thumbs | `rgba(242,142,193,0.49)`, 8px, rounded |
| Polaroid frame | 6px `#f5f7eb`, `box-shadow: 2px 2px 5px rgba(255,255,255,0.28)` |

Type: Fluxisch Else **Light only** (300) everywhere, including titles and the `Index` h1; convert
`FluxischElse-Light.otf` to `.woff2` and keep the `.otf` as fallback. The Bold file stays in
`fonts/` but is not loaded. 13px / 19px (Info: 13 / 15.6). No italic exists: tags are faux-italic
with `display:inline-block; transform: skewX(-6deg)`. Links `text-decoration-thickness: 1px;
text-underline-offset: 3px`.

Spacing (Index): two sections `flex: 1 1 360px`, the list section `margin-left: -1px`; 192px top
bands (intro left, right-aligned `Index` h1 right, `padding: 42px 40px 24px 16px`); rows
`min-height: 38px; padding: 9px 16px 9px clamp(16px, 3.1vw, 41px)`; year `flex: 0 0 137px`; title
`flex: 1 1 200px`; tag `margin-left: 14px` after the title (no column); child projects prefixed by
a 15px-wide `•`. Hover marker: a 16px pink triangle `M1 0 L15 8 L1 16 Z` at `left: 121px; top: 10px`
in the row.

## 4. Content model

```
content/
  projects/<slug>.md      one per project (31 imported — see §8)
  site/index.md           intro, contact_line, email (front matter only)
  site/info.md            Info page body
  source/*.xlsx           the original spreadsheet (importer input only)
images/
  projects/<slug>/        photos; the CMS stores full public paths (/images/projects/<slug>/x.jpg)
```

Project front matter. The CMS removes keys that are null, empty or `[]` on save, so the data layer
defaults every missing field; `content.js` also accepts bare file names and bare strings in `images`.

| Field | Type | Meaning |
| --- | --- | --- |
| `title`, `slug` | string | slug = URL segment and the recommended image folder |
| `order` | number | sort key, ascending; `2.1`, `2.2` are children of `2` (use 2.1…2.9, or 2.01…2.10) |
| `years` | string | display string exactly as written: `2026`, `2023–2026`, `2025, 2026`, `2023 –` |
| `year_start`, `year_end` | int or null | sorting only |
| `tags` | list | the filterable categories, closed vocabulary (§7) |
| `role`, `client` | list, string | shown on the project page as `role:` / `for:` |
| `parent` | slug or null | children render as `•` bullets directly under the parent |
| `published` | bool | false = omitted everywhere, including its page |
| `cover` | path or "" | the Index grid image; "" = an empty gridded cell |
| `cover_style` | `polaroid` \| `polaroid-tall` \| `fill` \| `small` \| `pair` \| `none` | §5.1 |
| `cover_focus` | `[x, y]` percent | the point that stays in view (`object-position`), default `[50, 50]` |
| `cover_zoom` | number | 1 = just fills the frame; 1.5 = closer |
| `images` | list of `{image, alt}` | the project page strip, in order; alt falls back to the title |
| `hover_image` | path or "" | optional swap on grid-cell hover |
| `photo_links` | list of `{label, url}` | external photo folders, shown as links until downloaded |

Body = description, Markdown, may be empty. `site/index.md`: `intro`, `contact_line` (Markdown
with the mailto and `[info](/info/)` links), `email`. `site/info.md`: body only.

## 5. Pages

### 5.1 Index — `/`

Reference: `design/index-dark.html`. Half split: left **grid**, right **list**. At ≥720px each
column scrolls independently below its sticky band, with the pink thumb; below 720px normal page
flow, the list under the grid (keep the list; never hide it). `/projects/` is a copy of `/` with
`rel=canonical` to `/`.

**Left column**: the intro block (from `site/index.md`) in the 192px band, then the grid: 2 columns,
cells `aspect-ratio: 331.4 / 191.6`, `overflow: hidden`, 1px `#f28ec1` as `border-right` + `border-bottom`
per cell and `border-top` + `border-left` on the grid: internal lines only, **no outer frame**. One cell
per published project, children included, in list order (content order wins over the canvas's).
Each cell is an `<a href="/projects/<slug>/">` with `aria-label` = title. Treatments, as frame
geometry from the canvas plus `object-fit: cover; object-position: <cover_focus>; scale: <cover_zoom>`:

- `polaroid`: frame 80.18% × 81.42% of the cell at ~10% left / ~8% top, 6px `#f5f7eb` border, the shadow.
- `polaroid-tall`: the portrait frame, 49.28% × 85.23%, centred.
- `fill`: whole cell.
- `small`: 34.31% × 84.81%, centred, no frame (posters).
- `pair`: two images, left 40.34% and right 61.8% (`cover` + the first of `images`).
- `none` or empty `cover`: an empty cell.

**Frame jitter**: the canvas polaroids sit slightly off-grid by design. Reproduce it with a
deterministic offset derived from the slug, bounded to left 8.96–11.65% and top 6.78–9.34%, behind
`FRAME_JITTER` in `site.config.js`. Placement goes into a generated `dist/client/covers.css` with
one `#cell-<slug>` rule each (the dev server serves the same), never inline styles.

Hover on a cell or a row shows the pink triangle in that row; if `hover_image` is set, swap the image.

**Right column**: `Index` h1 in the band, then all published projects in order, children indented,
rows per §3; each row: years · title (link to the project page) · tags as `<button>`s that toggle filters.

**Filtering**: active tags live in the URL as `?filter=program,workshop` and in component state.
No filter = everything. One or more = projects matching **any** active tag (OR); the rest hidden
in both grid and list, the grid re-flowing. Active tags white, inactive `#b5b7b7`. Clicking an
active tag removes it; removing the last restores everything; `/` with no query and a reload
reset. Back/forward work (`pushState` + `popstate`). One `project-index` component with props
`{projects, filter, match, hover-swap}` and state `{hover}`; grid and list both render from it,
so a filter change is one `setState()` and the morph removes only what no longer matches.
Project data goes in as an attribute (`projects="{{ projects | dump | e }}"`). Static pages never
carry `?filter`; a URL filter is applied in `onConnected` after the zero-mutation first render.

### 5.2 Project — `/projects/<slug>/`

No artboard exists yet; build a **provisional** page in Info's frame so the final design can
replace one partial (`components/project-detail/detail.html` + its CSS) and nothing else.
`PROJECT_VIEW: 'page'` in `site.config.js`; keep the `'inline'` (accordion) variant possible but
unbuilt. Content order: `<----- index` back link (keeps the filter), then years · title · tags
(tags link to `/?filter=<tag>`), description paragraphs (7px gap, `hyphens: auto`, max-width 551),
`role:` / `for:`, then the image strip: `images` at full strip height side by side, horizontally
scrollable, pink 8–10px thumb; then `photo_links` as a link list if any; prev / next links at the
foot. Text first, images after. Unpublished projects have no page. No JavaScript on this page.

### 5.3 Info — `/info/`

Reference: `design/info.html`. `padding: 40px 16px 96px 37px`; `<----- back` (to `/`); body
paragraphs `margin: 0 0 7px`, max-width 551px, `hyphens: auto`.

### 5.4 Everything

`<title>` = `Tolomeo — <page>`. One `<h1>` per page. Real `<a href>` for navigation, real
`<button>` for filters, keyboard-operable, visible focus. `lang="en"`. No analytics, no
third-party requests, no cookies. Favicon: a 16px `#f28ec1` dot on black, SVG. `404.html`: dark,
"nothing here", link home.

## 6. Images and thumbnails

Principle: Tolomeo uploads straight from a phone or laptop through the CMS and never resizes
anything. Three parts:

1. **Normalize in CI, before the build.** A workflow step converts HEIC/TIFF → JPEG (`libheif` on the
   runner; `sharp` can't decode HEVC) and shrinks anything over 2000px long edge, then commits the
   web copies back to `main` as a bot with `[skip ci]`. It must be idempotent (never rewrites an
   already-normalized file) and the deploy continues from the normalized tree in the same run. If
   this proves fragile, fall back to resize-at-build only and document "upload JPEGs ≤ 2000px".
2. **Resize at build.** `server/images.js` walks `images/`, hashes each file, writes
   `dist/images/<path>/<name>.<hash8>.{600,1200,2000}.{jpg,webp}` (q80, `withoutEnlargement`,
   auto-rotate, sRGB, metadata stripped), keeps a `manifest.json` with dimensions, prunes orphans;
   SVG/GIF copied through. Grid uses 600w; strip 1200w + 2000w with `sizes`; `<picture>` with a
   WebP source, `width`/`height` set, lazy. CI caches `dist/images` keyed on `images/**`,
   `server/images.js` and the lockfile.
3. **Bulk tool, optional:** `scripts/prepare-images.js <folder> <slug>` → 2000px JPEG q85 copies
   named `<slug>-01.jpg…` into `images/projects/<slug>/`, PNG kept only with real transparency,
   HEIC via `sips`/`heif-convert`, prints the `images:` YAML; never touches the originals.

**Thumbnail tuner:** `/tools/thumbnail/`, static, `noindex`: pick a project, drag and scroll-zoom
the cover inside a real grid cell, read off `cover_style`, `cover_focus`, `cover_zoom` to paste
into the CMS.

**One-time cover migration:** `scripts/import-covers.js <Index.dc.html> <blob folder>` maps each
canvas cell to a project by `aria-label`, copies the cover into `images/projects/<slug>/`, and
writes `cover`, `cover_style`, `cover_focus`, `cover_zoom`; prints matches and skips. The 24
canvas covers are the launch masters; Tolomeo replaces any with originals later through the CMS.

## 7. `.pages.yml` (Pages CMS) — verified against the Pages CMS source

- `media: { input: images, output: /images }`; `settings.content.merge: true`.
- collection `projects` → `content/projects`, `filename: "{fields.slug}.md"`, fields per §4 with
  plain-language labels and descriptions: `tags` as `select` + `multiple` with the current vocabulary
  (adding a tag = a one-line edit here); `role` an open string list; `cover_style` a select of the
  six styles; `cover`, `hover_image` image fields and `images` an object list `{image, alt}`, all
  with `options.path: images/projects` (help text: "New folder → project name"); `cover_focus` a
  number list, `cover_zoom` a number; `order` a number with `options: { step: any }`; `parent` a
  `reference` to projects with `value: "{fields.slug}"`; `published` boolean; body `format: markdown`,
  `media: false`. List view: title, years, published, sorted by `order`.
- single files `index` → `content/site/index.md`, `info` → `content/site/info.md`.
- Verify and document how a same-name upload behaves; prefer a unique suffix if an option exists.
- Link `EDITING.md` from the collection descriptions.

A saved change commits with the user's token, so it triggers the deploy workflow. Twenty photos =
twenty commits; builds queue one at a time and the site catches up after the last.

## 8. Content already in this repo

`content/projects/` came from the spreadsheet via `scripts/import-projects.py` (YAML-aware; keeps
image fields and edited bodies; safe to re-run; `--overwrite-bodies` to take the sheet's text). Known
gaps you must not "fix" by inventing content: many descriptions are empty; no covers or images are
set yet (every cell renders empty until the cover migration or CMS uploads); two published projects
have no cover in the canvas. Build with placeholders only where the design needs an image.

## 9. Assumptions in `site.config.js` (flip each without touching templates)

1. `PROJECT_VIEW: 'page'` — separate project pages (client's words); `'inline'` kept possible.
2. `FILTER_MATCH: 'any'` — OR across active tags.
3. `HOVER_SWAP: true` — only acts when `hover_image` is set.
4. `FRAME_JITTER: true` — deterministic off-grid polaroid offsets.
5. Intro reads "Tolomeo is…".
6. `TAG_COLOR: '#b5b7b7'`.

## 10. Definition of done for the first PR

- `npm run dev`, `npm run build`, `npm run images -- <folder> <slug>`, `npm run verify` documented in `README.md`.
- The Actions workflow is green and `dist/` deploys to Pages.
- `scripts/verify.js` checks the five acceptance points (HTML before JS; filter morph touches only
  non-matching rows/cells; direct project URLs; `scrollWidth <= 390` on every route; `.pages.yml` field
  names diffed against the front matter) plus zero mutations on first render and `el.render()`, and
  zero console errors with JS on and off. The PR description states how each was checked.
- `EDITING.md`: add a project, add photos, set a thumbnail (with the tuner), replace a photo, hide a
  project, add a tag category. Written for Tolomeo.
- `CLAUDE.md` updated with any command or convention introduced.
