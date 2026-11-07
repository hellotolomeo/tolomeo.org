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
- `npm run verify` — Playwright checks for the acceptance points
- `python3 scripts/import-projects.py content/source/<file>.xlsx` — re-import the spreadsheet (keeps image fields and edited bodies)

## Rules
- Never edit `dist/`; it is generated.
- Never invent content: empty descriptions and missing images stay empty. Placeholders only where the design needs an image.
- Design values come from `design/*.html` (inline styles are the measurements) and the token table in `BRIEF.md` §3. Don't restyle.
- Plain JS, plain CSS, no bundler, no framework, no TypeScript. Dependencies stay: `nunjucks`, `gray-matter`, `marked`, `sharp`.
- Every page must be complete HTML before JavaScript; the first browser render must make zero DOM mutations.
- Every `BRIEF.md` §9 assumption is a constant in `site.config.js`.
- Anything Tolomeo edits must be editable alone in Pages CMS. Scripts are for one-off migrations only.
