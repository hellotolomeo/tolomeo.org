# tolomeo.org

Portfolio site for Tolomeo. Static, pre-rendered, hosted on GitHub Pages at tolomeo.org.
The spec is `BRIEF.md` (v2); decisions on the build plan are in `BUILD-PLAN-RESPONSE.md`. Read both before any change to layout, behaviour or content model. The **look** in `BRIEF.md` §3 and §5 and in `design/*.html` (dark, pink lines) is superseded by the redesign of 11 Nov 2026: its values are the "Design" section below.

## Stack
- The Zeldman Pattern, vendored in upstream's own `AGENTS.md` layout (`client/lib/`, `lib/vendor/`, `lib/filters.js`, `server/zeldman/`, docs in `lib/zeldman/`). One component = `components/<name>.html` + `.css` + `.js`. `setState()` is the only way the DOM changes. No inline `style=""` in component markup; generated proportions go in `dist/client/covers.css` and `dist/client/slides.css`.
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
- `node scripts/import-site-data.js <kit-folder> [--dry-run]` — the one-off import of a Claude Design site kit (a folder with `site-data.json`, `thumbnails/`, `images/`): rewrites `content/projects/`, copies the photos and thumbnails into `images/projects/<slug>/`, deletes photos nothing references. Already run for the redesign of 11 Nov 2026; content in `content/` (edited in the CMS) is now the source of truth.
- `scripts/import-projects.py` (the spreadsheet importer) and `scripts/import-covers.js` (the design-canvas cover migration) are **superseded: don't run them** — the first would bring back the spreadsheet's typos, old titles and publish states, the second writes `cover_style`/`cover_focus`/`cover_zoom`, which no longer exist.

## Rules
- Never edit `dist/`; it is generated.
- Never invent content: empty descriptions and missing images stay empty. Placeholders only where the design needs an image.
- Design values come from the "Design" section below (the redesign of 11 Nov 2026, which replaced `design/*.html` and the token table in `BRIEF.md` §3). Don't restyle.
- Plain JS, plain CSS, no bundler, no framework, no TypeScript. Dependencies stay: `nunjucks`, `gray-matter`, `marked`, `sharp`; `playwright` (pinned to the installed browser's version) is the only dev dependency, for `scripts/verify.js`.
- Every page must be complete HTML before JavaScript; the first browser render must make zero DOM mutations.
- Every `BRIEF.md` §9 assumption that still applies is a constant in `site.config.js` (the redesign removed the hover photo and the frame jitter, and their constants with them).
- Anything Tolomeo edits must be editable alone in Pages CMS. Scripts are for one-off migrations only.

## Design (redesign of 11 Nov 2026)
One light colour world, no visible lines anywhere. Reference width 1366px (project pages: 1366 × 710).

| Token (`client/site.css`) | Value |
| --- | --- |
| Ground / text | `#f2f2f2` / `#412d37` |
| `--link`: link hover, the Index header line, chevrons, focus ring | `#99567a` |
| `--tag`: type labels, `role:` / `for:` (67% of the text colour; `TAG_COLOR`) | `#807279` |
| `--caption` (80%) | `#67575f` |
| `--thumb`: scroll bars (solid), the page's own included (`scrollbar-color` on `html`) | `#ccabbd`, 8px, rounded |
| Frame, on every thumbnail and every project photo | 6px `#f4f3e7`, `box-shadow: 1px 2px 6px rgba(100, 40, 95, 0.55)` |

- Type: Fluxisch Else only. Body Light 13.38px / 16px. Bold (the second `@font-face`, `fonts/FluxischElse-Bold.woff2`) for dates, titles, `Back` and `**bold**` in content. No italic exists: slanted text is Light with `transform: skewX(-6deg)` on an inline-block; Markdown `*italic*` becomes `<em>` with one `<span>` per word (`server/markdown.js`) so it still wraps; punctuation that touches the slanted text is tied to its word in an unskewed `<span class="nb">`, so a line never starts with the comma after a *Title*. Word spans inside a link take the link's underline (`a em, a span { text-decoration: inherit }`), which an inline-block otherwise drops. Links are underlined 0.67px in the text colour and turn `--link` on hover.
- Tab title: the home page is `Tolomeo`; every other page `Tolomeo — <page>`. Favicons are the files in `public/`, which is copied to the site root.
- **Index**: an 88px header (`.site-head`, outside the component): one purple line at 37px / 33px, from `site/index.md` `intro` (Markdown; its link is the name, Bold, text colour, to `/info/`). No "Index" link. Under it two 50% columns. Left: the grid, 2 columns, a cell a quarter of the page wide at 341.2 : 197.12; each thumbnail whole, centred, as large as fits 91% × 86.5% of the cell, frame included. Right: the list; a row is one fifth of a cell tall (`2.8886cqw`), the date at 1.676% of the page from the column's edge, the title at 9.868%, the type 15px after the title, sub-items with a `•`. Pointing at a row or its thumbnail turns the title `--link` and shows a 12.4 × 14.3 chevron (1.5px stroke) 14px left of the title. Thumbnails are static.
- **Project page**: a 79px header (`Back` at 37px / 42px to `/`; the title centred, Bold, text top 43px, a link to `#project-info`). Then the photos one at a time, framed, centred, as large as fits between the header and the caption's room (568px tall at a 710px viewport), never cropped; chevrons 16.5 × 19 (1.5px stroke) 28px either side of the frame in 44 × 44 targets, none before the first photo or after the last; a click on the photo and the left / right keys also move. Caption 16px under the frame, at most 480px wide, 11px / 13.2px, `--caption`. Then `#project-info`: a row like an Index row (date, title, type), the description (at most 433px, 7px between paragraphs) with `role:` / `for:` beside it; empty parts are left out.
- **Info**: `Back` at 37px / 42px; the text from 113px down, at most 420px wide, 7px between paragraphs.

## Conventions
- Data flows one way: `server/content.js` shapes everything (sorting, defaults, image lookups, Markdown → HTML via `server/markdown.js`); templates only print flat fields. `build.js` and `server.js` share it and `server/routes.js`.
- Components: `project-index` (home: grid + list + filter; props `projects, filter, match`, state `hover`) and `project-slides` (a project page's photos; props `images, label`, state `index`). Page-level styles are `client/site.css` (every page, with the Index header and the Info / 404 frame) and `client/project.css` (the project page's header and information).
- Browser-only template variables (`shown`, `hover`, `index`) are guarded with `| default(…)` so the server render and the first browser render are identical. Keep it that way; `npm run verify` measures it.
- Templates are preloaded with `fetch()` by `client/template-env.js` `setup([...])`; list every template (and partial) a page's components use in that page's entry (`client/main.js`, `client/project.js`).
- Measures the design gives as a share of the 1366px page are `cqw` on a page-wide container (`project-index`; `main.project`), so they scale with the page and ignore the scrollbar; at ≥720px the grid's two columns are `25cqw` each for the same reason (where the native scrollbar shows, it lies over the right cells' margin instead of shrinking them). Type stays 13.38px, so two things give way on narrower side-by-side pages, and only there: below about 1270px the date column's 104px floor (the smallest that keeps the hover chevron clear of the longest date) puts the title right of 9.868%; below 1108px a row's `line-height` is the row height, so a row whose type wraps takes exactly two (or three) row slots and five slots are still one cell. From 1108px up a wrapped row's two 16px lines fit inside one slot.
- No comments in CSS (`lib/zeldman/AGENTS.md`); the derivations live here. Grid thumbnail: `49.9733cqw` is 86.5% of the cell's height as a share of its width (197.12 / 341.2 × 86.5), and both limits lose 12px for the frame. Slideshow (`components/project-slides.css`): `--head` 79px is the page header; `--cap` 63px is the caption's room (16px gap, three 13.2px lines, 7.4px), kept on every slide so a photo that fills the height sits directly under the header; `--h` is what is left of the viewport (`svh`); `--w` is the page less, on each side, a 44px chevron target, a 14.25px gap (the 16.5px chevron is centred in its target, so that puts it 28px from the frame) and a 16px edge; at ≤600px the gap and edge are 0. A photo limited by width instead of height is centred in the slide. The caption's limit is 512px because its 16px side padding is inside it: 480px of text.
- Framed boxes are never cropped: each takes its image's proportions from a generated rule, never inline: `--a` per grid cell in `client/covers.css` (`coversCss()`), per project photo in `client/slides.css` (`slidesCss()`, loaded by project pages only), both in `server/content.js`. One thumbnail style for all: `cover_style`, `cover_focus`, `cover_zoom` and `hover_image` are gone from the content, the CMS and the data layer, and so is the thumbnail tuner.
- Index layout at ≥720px: the page does not scroll; each column is its own scroller (`.images .scroll`, `.rows`) under the header; native scrollbars are hidden and the thumbs are a CSS scroll-driven animation (`.track`/`.thumb`, no script; where `animation-timeline` isn't supported the native scrollbar shows, thin, in the thumb colour): the grid's at the right edge of its column, the list's at the right edge of the page. Below 720px: normal page flow, the list under the grid.
- Row highlight: the `hover` state puts class `on` on the row (pointer on the row or its thumbnail, or focus); the chevron is a CSS mask on `.what::before`, drawn at 12.4 × 14.3 inside a whole-pixel box (a mask stretched to a fractional box is snapped to whole pixels). The scroll thumbs have two animations on the column's scroll timeline: one moves the thumb, the other only makes it visible and runs over twice the range so it never finishes (a finished animation keeps its last value when a filter leaves the column with nothing to scroll, which left a thumb behind). Tags are `<button>`s that toggle the filter (`?filter=a,b`, any-match); active ones are in the text colour.
- The slideshow: every photo is in the HTML; `index` puts class `current` on one slide and the stylesheet hides the rest **only when the element is `:defined`**, so with JavaScript off (or not yet loaded) the photos are one under the other, the first exactly where the script shows it. Each slide prints its own chevrons (none on the first's left or the last's right), so they sit beside the frame by layout; when the photo changes while a chevron has focus, focus moves to the same chevron of the new slide (the other one at either end). The next photo is loaded ahead (`loading` follows `index`). A project with one photo loads no script.
- The project page's `Back` link is plain `/`; the home page restores the filter that was active when the project was opened (sessionStorage, only on a followed link from `/projects/…`, never on reload).
- A caption is one line of Markdown in `images[].caption`; `*asterisks*` slant.
