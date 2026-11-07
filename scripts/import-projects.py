#!/usr/bin/env python3
"""
SUPERSEDED: don't run this. content/ was re-imported from Claude Design's site-data.json
(scripts/import-site-data.js) and is now edited in Pages CMS; this would bring back the
spreadsheet's typos, old titles and publish states. See CLAUDE.md.

Import the project spreadsheet into content/projects/<slug>.md (one file per project).

Usage:
    python3 scripts/import-projects.py content/source/Tolomeo_org_Project_List.xlsx [--overwrite-bodies]

Required sheet columns (matched by a substring of the header, case-insensitive):
    publish, order, date, title, tags, role, client, description
Optional columns (any header starting with these names):
    slug, cover, cover_style, cover_focus, cover_zoom, images, hover_image, photo_links
A value present in the sheet wins over the file; an empty cell leaves the file's value alone.

Re-running is safe. For a row whose .md already exists, front matter is refreshed and the
image fields (cover, cover_style, cover_focus, cover_zoom, images, hover_image, photo_links)
are kept from the file unless the sheet supplies them. A body that was edited in the file or
in the CMS is kept unless --overwrite-bodies is passed. Front matter is parsed with PyYAML, so
files saved by Pages CMS (block lists, dropped empty keys) read back correctly.

Requires: openpyxl, pyyaml   (pip install openpyxl pyyaml)
"""
import re, sys, unicodedata, pathlib
import yaml
from openpyxl import load_workbook

args = [a for a in sys.argv[1:] if not a.startswith("--")]
SRC = pathlib.Path(args[0] if args else "content/source/Tolomeo_org_Project_List.xlsx")
OUT = pathlib.Path("content/projects")
OVERWRITE_BODIES = "--overwrite-bodies" in sys.argv
IMAGE_KEYS = ("cover", "cover_style", "cover_focus", "cover_zoom", "images", "hover_image", "photo_links")
STYLES = ("polaroid", "polaroid-tall", "fill", "small", "pair", "none")

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()

def years(datecell):
    """'‘23.02 - ‘26.11' -> ('2023–2026', 2023, 2026); '‘23.08 –' -> ('2023 –', 2023, None)"""
    s = str(datecell or "").strip()
    yy = [2000 + int(y) for y in re.findall(r"[‘'’](\d{2})", s)]
    if not yy:
        return ("", None, None)
    if re.search(r"[–-]\s*$", s):
        return (f"{yy[0]} –", yy[0], None)
    if len(yy) == 1:
        return (str(yy[0]), yy[0], yy[0])
    if re.search(r"\d\s*[–-]\s*[‘'’]", s):
        return (f"{yy[0]}–{yy[-1]}", yy[0], yy[-1])
    return (", ".join(str(y) for y in sorted(set(yy))), min(yy), max(yy))

def split_front_matter(text):
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not m:
        return {}, text
    try:
        fm = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError as e:
        sys.exit(f"cannot parse front matter: {e}")
    return (fm if isinstance(fm, dict) else {}), m.group(2)

def image_path(slug, name):
    """A bare file name becomes the full public path Pages CMS writes; a path or URL is kept."""
    name = (name or "").strip()
    if not name or name.startswith("/") or re.match(r"https?://", name):
        return name
    return f"/images/projects/{slug}/{name}"

def image_list(slug, value):
    """Normalise images to [{image, alt}] from a string, a list of strings or a list of dicts."""
    if not value:
        return []
    if isinstance(value, str):
        value = [x for x in re.split(r"[,\n]", value) if x.strip()]
    out = []
    for item in value:
        if isinstance(item, dict):
            img = image_path(slug, str(item.get("image") or ""))
            if img:
                out.append({"image": img, "alt": str(item.get("alt") or "")})
        else:
            img = image_path(slug, str(item))
            if img:
                out.append({"image": img, "alt": ""})
    return out

def url_label(url):
    return re.sub(r"^https?://(www\.)?", "", url).split("/")[0]

def link_list(value):
    """photo_links: 'label|url' items separated by commas or newlines, or a list of dicts."""
    if not value:
        return []
    if isinstance(value, str):
        out = []
        for part in [x.strip() for x in re.split(r"[,\n]", value) if x.strip()]:
            label, _, url = part.partition("|")
            if not url:
                label, url = url_label(part), part
            out.append({"label": label.strip(), "url": url.strip()})
        return out
    return [{"label": str(d.get("label") or ""), "url": str(d.get("url") or "")}
            for d in value if isinstance(d, dict)]

wb = load_workbook(SRC, read_only=True)
ws = wb["projects"] if "projects" in wb.sheetnames else wb.active
rows = list(ws.iter_rows(values_only=True))
header = [str(h or "").strip().lower() for h in rows[0]]

def col(name_part):
    for i, h in enumerate(header):
        if name_part in h:
            return i
    sys.exit(f"column containing '{name_part}' not found in {header}")

def optcol(name):
    for i, h in enumerate(header):
        if h == name or h.startswith(name):
            return i
    return None

C = dict(publish=col("publish"), order=col("order"), date=col("date"), title=col("title"),
         tags=col("tags"), role=col("role"), client=col("client"), desc=col("description"))
OPT = {k: optcol(k) for k in ("slug",) + IMAGE_KEYS}

def cell(r, key):
    i = OPT.get(key)
    return str(r[i]).strip() if i is not None and r[i] is not None else ""

class Dumper(yaml.SafeDumper):
    pass

def _str(d, s):
    quoted = s == "" or ":" in s or s[:1] in "[{&*!|>'\"%@`#" or s.strip() != s
    return d.represent_scalar("tag:yaml.org,2002:str", s, style='"' if quoted else None)
Dumper.add_representer(str, _str)

OUT.mkdir(parents=True, exist_ok=True)
parents = {}
written = 0
for r in rows[1:]:
    title = str(r[C["title"]] or "").strip()
    if not title:
        continue
    order = round(float(r[C["order"]] or 0), 2)
    is_sub = abs(order - round(order)) > 1e-9
    slug = slugify(cell(r, "slug") or title)
    if not is_sub:
        parents[int(round(order))] = slug
    parent = parents.get(int(order)) if is_sub else None
    display, y0, y1 = years(r[C["date"]])
    tags = [t.strip() for t in str(r[C["tags"]] or "").split(",") if t.strip()]
    roles = [t.strip() for t in str(r[C["role"]] or "").split(",") if t.strip()]
    desc = str(r[C["desc"]] or "").replace("\u2028", "\n").strip()
    desc = "\n\n".join(p.strip() for p in desc.split("\n") if p.strip())
    published = str(r[C["publish"]] or "").strip().upper() == "Y"

    path = OUT / f"{slug}.md"
    old_fm, old_body = ({}, "")
    if path.exists():
        old_fm, old_body = split_front_matter(path.read_text(encoding="utf-8"))

    fm = {
        "title": title,
        "slug": slug,
        "order": order if is_sub else int(round(order)),
        "years": display,
        "year_start": y0,
        "year_end": y1,
        "tags": tags,
        "role": roles,
        "client": str(r[C["client"]] or "").strip(),
        "parent": parent,
        "published": published,
        "cover": image_path(slug, old_fm.get("cover")),
        "cover_style": str(old_fm.get("cover_style") or "polaroid"),
        "cover_focus": old_fm.get("cover_focus") or [50, 50],
        "cover_zoom": old_fm.get("cover_zoom") or 1,
        "images": image_list(slug, old_fm.get("images")),
        "hover_image": image_path(slug, old_fm.get("hover_image")),
        "photo_links": link_list(old_fm.get("photo_links")),
    }
    # values in the sheet win
    if cell(r, "cover"):
        fm["cover"] = image_path(slug, cell(r, "cover"))
    if cell(r, "cover_style"):
        st = cell(r, "cover_style").lower()
        fm["cover_style"] = st if st in STYLES else "polaroid"
    if cell(r, "cover_focus"):
        nums = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", cell(r, "cover_focus"))][:2]
        if len(nums) == 2:
            fm["cover_focus"] = [int(n) if n.is_integer() else n for n in nums]
    if cell(r, "cover_zoom"):
        try:
            fm["cover_zoom"] = float(cell(r, "cover_zoom"))
        except ValueError:
            pass
    if cell(r, "hover_image"):
        fm["hover_image"] = image_path(slug, cell(r, "hover_image"))
    if cell(r, "images"):
        fm["images"] = image_list(slug, cell(r, "images"))
    if cell(r, "photo_links"):
        fm["photo_links"] = link_list(cell(r, "photo_links"))

    body = old_body.strip() if (old_body.strip() and not OVERWRITE_BODIES) else desc
    text = "---\n" + yaml.dump(fm, Dumper=Dumper, sort_keys=False, allow_unicode=True, width=1000) + "---\n"
    path.write_text(text + ("\n" + body + "\n" if body else ""), encoding="utf-8")
    written += 1

print(f"wrote {written} files to {OUT}/")
