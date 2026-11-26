# Content

- `projects/<slug>.md` — one file per project. Fields are the ones in `.pages.yml` (the list in
  `BRIEF.md` §4, less `cover_style`, `cover_focus`, `cover_zoom` and `hover_image`, plus `details`
  and, on each photo, `caption` and `set`). They are edited in Pages CMS and are the source of
  truth. The importers in `scripts/` are superseded: don't run them (they would bring back old
  photo lists, titles, texts and publish states, and drop the photo sets).
- `site/index.md` — the home page's intro (`intro`, several lines) and the site's description
  (`description`). `site/info.md` — the About page: `title`, `image`, `alt`, `caption`, `note`, and
  the text as its body. `site/collaborations.md` — the Collaborations page, with the same fields.
- `source/` — the original spreadsheet, kept for history only.

Images are not here: they go in `images/projects/<slug>/`, `images/info/` and
`images/collaborations/`, and are referenced by full public path (`/images/projects/<slug>/x.jpg`)
from `cover`, `images` and `image`.
