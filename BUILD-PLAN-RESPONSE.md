# Response to the build plan of 7 Nov 2026

Decisions on every open item in the builder's plan. `BRIEF.md` is now v2 and already reflects these;
this file is the record of why. Where the plan and the brief still disagree, this file wins.

## §9 questions

1. **Importer fix (C): yes.** Done in the kit: `scripts/import-projects.py` now parses front matter
   with PyYAML, tolerates keys the CMS dropped, writes `images` as `[{image, alt}]` with full
   `/images/projects/<slug>/…` paths, and carries `cover_focus` / `cover_zoom` / `photo_links`.
   Round-trip with a CMS-shaped file is tested. Use the kit version; don't rewrite it.
2. **Tags: closed `select multiple`** of the current vocabulary. **Role: open string list.**
   Filters need stable spellings. Adding a category = one line in `.pages.yml`, on request.
3. **Dark only; Index is `/`.** Home, the light world, workshops and `selected` are gone.
   Info survives, dark. `site/home.md` → `site/index.md`. Landline URL: approved, in the kit.
4. **Column scrolling: yes** at ≥720px, independent, sticky bands, pink thumbs; normal flow below.
   Strip thumb pink on dark. Treatments: see thumbnails.

## Findings A–H

| # | Decision |
| --- | --- |
| A | Approved: follow upstream `AGENTS.md` layout. The brief's vendoring paths were wrong. |
| B | Approved: `fetch()` preload, vendored loader as fallback. Keep it minimal. |
| C | Approved and done (above). |
| D | Approved: sort children by parent then `order`; document `2.1…2.9` / `2.01…2.10`. |
| E | Moot: workshops dropped. |
| F | Content wins: 29 published → 29 rows and cells; tags as stored. |
| G | Done: `contact_line` now carries an explicit `[hello@tolomeo.org](mailto:…)` link. |
| H | Approved as `PROJECT_VIEW: 'page'` (default) / `'inline'` (possible, unbuilt). |

## §10 research

Accept all of it: `media: {input, output}`, full public paths, `merge: true`, `step: any`,
`filename: "{fields.slug}.md"`, `parent` as `reference`, `CNAME` set in Settings (file still
written), `include-hidden-files` if needed, Node ≥ 20.9, ESM throughout, scoped `Marked`.

## §11 project page

Approved: page mode, dark, Info's frame, `<----- index` back link keeping the filter; years ·
title · tags, description, `role:` / `for:`, strip, `photo_links`, prev/next. One partial. No JS.
`photo_links` stays a holding pen; the download step is decided when the spreadsheet arrives.

## §12–13 thumbnails and editing

- **Model: `cover_style` + `cover_focus` + `cover_zoom`**, six styles. The brief's
  `cover_position` is withdrawn. The eight-percentage model is not used.
- **Frame jitter: automatic**, deterministic from the slug, bounded to the canvas ranges,
  behind `FRAME_JITTER`. Nobody types it.
- **Cover masters: the 24 canvas files** at launch; Tolomeo replaces via the CMS later. The
  brief author can extract the blobs from the canvas into `images/projects/<slug>/` for
  `import-covers.js` on request.
- **Grid order follows the list.** Canvas deviations (IWD/Greenfest/IWC) are flagged to the designer.
  Welcome Flynn and Stroomhuis get empty cells until a cover exists.
- **CI normalize-and-commit-back: approved with guards** — idempotent, bot identity, `[skip ci]`,
  deploy continues from the normalized tree in the same run. If fragile, fall back to
  resize-at-build only and document "upload JPEGs ≤ 2000px".
- **`images` as `[{image, alt}]`: yes.** `content.js` also accepts bare strings and bare file names.
- **`/tools/thumbnail/` tuner: yes**, static, `noindex`.
- **`EDITING.md`: yes**, plus "add a tag category", "replace a photo", "hide a project".
- **Open check:** same-name upload behaviour. Prefer a unique-suffix option; else document.

## Still to come from the client

- The spreadsheet with descriptions and photo links (importer handles both).
- Original photos for project pages (CMS, or `npm run images` in bulk).
- A project-page artboard, which replaces `components/project-detail/` only.
