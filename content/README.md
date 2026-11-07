# Content

- `projects/<slug>.md` — one file per project. Fields are listed in `BRIEF.md` §4. Generated from
  `source/Tolomeo_org_Project_List.xlsx` by `scripts/import-projects.py`; once the CMS is set up,
  edit these through Pages CMS. The importer can still be re-run for bulk additions without losing
  CMS edits.
- `site/index.md` — the intro and contact line. `site/info.md` — the Info page text.
- `source/` — the original spreadsheet, kept only as the importer's input.

Images are not here: they go in `images/projects/<slug>/` and are referenced by full public path
(`/images/projects/<slug>/x.jpg`) from `cover`, `images` and `hover_image`.
