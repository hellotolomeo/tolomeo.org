# Content

- `projects/<slug>.md` — one file per project. Fields are listed in `BRIEF.md` §4. Imported once
  from Claude Design's `site-data.json` by `scripts/import-site-data.js`; they are edited in Pages
  CMS and are the source of truth. The old spreadsheet importer, `scripts/import-projects.py`, is
  superseded: don't run it (it would bring back the spreadsheet's typos, old titles and publish
  states).
- `site/index.md` — the intro and contact line. `site/info.md` — the Info page text.
- `source/` — the original spreadsheet, kept for history only.

Images are not here: they go in `images/projects/<slug>/` and are referenced by full public path
(`/images/projects/<slug>/x.jpg`) from `cover`, `images` and `hover_image`.
