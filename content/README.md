# Content

- `projects/<slug>.md` — one file per project. Fields are the ones in `.pages.yml` (the list in
  `BRIEF.md` §4, less `cover_style`, `cover_focus`, `cover_zoom` and `hover_image`, plus a
  `caption` on each photo). Imported from Claude Design's site kit by
  `scripts/import-site-data.js`; they are edited in Pages CMS and are the source of truth. The old
  spreadsheet importer, `scripts/import-projects.py`, is superseded: don't run it (it would bring
  back the spreadsheet's typos, old titles and publish states).
- `site/index.md` — the line at the top of the home page. `site/info.md` — the Info page text.
- `source/` — the original spreadsheet, kept for history only.

Images are not here: they go in `images/projects/<slug>/` and are referenced by full public path
(`/images/projects/<slug>/x.jpg`) from `cover` and `images`.
