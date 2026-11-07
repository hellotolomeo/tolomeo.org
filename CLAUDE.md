# tolomeo.org

Portfolio site for Tolomeo. Static, pre-rendered, hosted on GitHub Pages at tolomeo.org.
The spec is `BRIEF.md` (v2); decisions on the build plan are in `BUILD-PLAN-RESPONSE.md`. Read both before any change to layout, behaviour or content model.

## Stack
- The Zeldman Pattern, vendored in upstream's own `AGENTS.md` layout (`client/lib/`, `lib/vendor/`, `lib/filters.js`, `server/zeldman/`, docs in `lib/zeldman/`). One component = `components/<name>.html` + `.css` + `.js`. `setState()` is the only way the DOM changes. No inline `style=""` in component markup; generated placement goes in `dist/client/covers.css`.
- Node renders everything at build time: `node build.js` → `dist/`. No server in production.
- Content is Markdown + YAML front matter in `content/` (projects, site). Images in `images/projects/<slug>/`; the CMS stores full `/images/…` paths and drops empty keys, so the data layer defaults every field.
- Pages CMS edits content via `.pages.yml`. Keep the field names in `.pages.yml`, `content/` and the templates identical.
- GitHub Actions builds and deploys `dist/` on every push to `main`.

## Commands
- `npm run dev` — local server on http://localhost:3100 with live template reload
- `npm run build` — write `dist/` (resizes images with sharp, cached by hash)
- `npm run images -- <folder-of-originals> <slug>` — optional bulk tool: 2000px web copies in `images/projects/<slug>/`
- `npm run verify` — after a build: Playwright checks for the acceptance points (CI runs it on branches and PRs, not on `main`). Needs Chromium: `npx playwright install chromium`, or `CHROMIUM_PATH`.
- `node scripts/normalize-images.js` — what CI runs before the build: HEIC/TIFF → JPEG, >2000px shrunk, content references rewritten; idempotent.
- `node scripts/import-covers.js <Index.dc.html> <blob-folder> [--dry-run]` — the one-time cover migration from the design canvas (already run; only for re-importing canvas covers).
- `node scripts/import-site-data.js <site-data.json> <kit-folder> [--canvas <blob-folder>] [--dry-run]` — the one-off import of Claude Design's site update (already run). `site-data.json` superseded the spreadsheet; content in `content/` (edited in the CMS) is now the source of truth.
- `scripts/import-projects.py` (the spreadsheet importer) is **superseded: don't run it** — it would bring back the spreadsheet's typos, old titles and publish states.

## Rules
- Never edit `dist/`; it is generated.
- Never invent content: empty descriptions and missing images stay empty. Placeholders only where the design needs an image.
- Design values come from `design/*.html` (inline styles are the measurements) and the token table in `BRIEF.md` §3. Don't restyle.
- Plain JS, plain CSS, no bundler, no framework, no TypeScript. Dependencies stay: `nunjucks`, `gray-matter`, `marked`, `sharp`; `playwright` (pinned to the installed browser's version) is the only dev dependency, for `scripts/verify.js`.
- Every page must be complete HTML before JavaScript; the first browser render must make zero DOM mutations.
- Every `BRIEF.md` §9 assumption is a constant in `site.config.js`.
- Anything Tolomeo edits must be editable alone in Pages CMS. Scripts are for one-off migrations only.

## Conventions introduced by the first build
- Data flows one way: `server/content.js` shapes everything (sorting, defaults, image lookups, Markdown → HTML via `server/markdown.js`); templates only print flat fields. `build.js` and `server.js` share it and `server/routes.js`.
- Components: `project-index` (home: grid + list + filter; props `projects, filter, match, hover-swap`, state `hover`, `swap`) and `thumbnail-tuner` (`/tools/thumbnail/`). Grid-cell markup is the partial `components/project-index/cell.html` + `picture.html`, shared by both; cell CSS selectors are `:is(project-index, thumbnail-tuner) …`.
- Browser-only template variables (`shown`, `hover`, the tuner's state) are guarded with `| default(…)` so the server render and the first browser render are identical. Keep it that way; `npm run verify` measures it.
- Templates are preloaded with `fetch()` by `client/template-env.js` `setup([...])`; list every template (and partial) a page's components use in that page's entry (`client/main.js`, `client/tuner.js`).
- Thumbnails are never cropped: each grid box takes its image's proportions (`--a`, and `--b` for a pair's right image) and the style sets its size, centred in the cell (container units on `.cell`). Those values and the polaroid jitter are generated into `client/covers.css` (`coversCss()` in `server/content.js`), never inline. `cover_focus`/`cover_zoom` are no longer used (hidden in the CMS); the tuner at `/tools/thumbnail/` is a style preview.
- Index layout at ≥720px: each column is a fixed 192px band (its bottom rule drawn inside it) over its own scroller (`.images .scroll`, `.rows`); native scrollbars are hidden and the pink thumbs are a CSS scroll-driven animation (`.track`/`.thumb`, no script; absent where `animation-timeline` isn't supported). No lines on the outer page edges. The middle divider is drawn once, as the list section's left inset shadow (full height), so it is one device pixel at any width; grid cells draw only their internal right/bottom rules (an overlay `::before`, so photos can't cover them).
- The project page (README §4 of the site update): a 192px header band with `<----- back` (to `/`) and `Index` (to `/`), a title row like an Index row, description + role/for columns from about 213px, then the image strip (clamp(240px, 30vw, 400px) tall, no gaps, scrolls sideways). No JS. Its `back` link is plain `/`; the home page restores the filter that was active when the project was opened (sessionStorage, only on a followed link from `/projects/…`, never on reload).
- Lines are hairlines: `--hair` (site.css) is 1px on standard screens, 0.5px at 2x, a third at 3x, drawn as inset box-shadows (Chromium rounds sub-pixel borders up to 1px). Don't switch them back to `border: 0.5px`.
- Hover swap: the hover image is always rendered in its cell (lazy, hidden) and shown only while the pointer is over that cell (`swap` state); rows only show the marker. A `pair` cover's right picture is the hover photo if set, else the first project photo.
