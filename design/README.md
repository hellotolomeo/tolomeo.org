# Design references

**Superseded.** These are the references for the first, dark design. The site was redesigned on
11 Nov 2026 (light ground, no lines, one framed thumbnail style, a one-photo-at-a-time project
page); the current values are in `CLAUDE.md`, "Design". Nothing here is current any more except
as history.

| File | What it is |
| --- | --- |
| `index-dark.html` | **The Home page.** Export of the approved Index artboard: dark, half split, image grid left, index list right, 28 cells for 28 rows. Inline styles are the measurements. The hover prototype (pink ▶ marker next to the hovered row, lit from the row or its grid cell) is in the markup as `{{ hover.* }}` / `<sc-if>` fragments — read the behaviour, don't copy that syntax. |
| `info.html` | Export of the approved Info artboard (dark). |
| `project-open-superseded.html` | An earlier, now withdrawn, layout where a project opened inline in a light list. Keep only its content order for the project page: description → role / for → images. Nothing about its colours or placement is current. |
| `placeholder.png` | Stands in for the artboards' images. |
| `sketch-2026.pdf` | The original hand-made sketch of the dark index; superseded by `index-dark.html`. |
| `edlewis-filter-*.jpg` | Three screenshots of edlewis.co showing the tag-filter behaviour we want: all, hover on a tag, filtered by `installation`. Behaviour reference only, not look. |
| `info-page-example.png` | Early layout reference for Info (colours not relevant). |

There is **no project-page artboard yet**. `BRIEF.md` §5.2 gives a provisional layout; build it as one template so it can be restyled when the design arrives.
