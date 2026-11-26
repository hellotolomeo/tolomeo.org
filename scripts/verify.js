/**
 * The acceptance checks of BRIEF.md §1 and §10, against the built site in dist/.
 *
 *   npm run build && npm run verify
 *
 * Serves dist/ on a local port (404.html for unknown paths, as GitHub Pages
 * does) and drives Chromium with Playwright:
 *   1. HTML before JS: every route's raw HTML carries its content.
 *   2. Filtering: from the URL and from clicks; the morph only removes what
 *      stops matching (surviving rows and cells are the same nodes) and touches
 *      nothing else but the tag buttons' state; back/forward restore.
 *   3. Project pages: every published project's URL answers with its page, with
 *      every photo in the HTML, one slideshow per set of photos; a set's photos
 *      show one at a time (chevrons, a click on the photo, the arrow keys, which
 *      move the set on screen and no other), and all of them with JavaScript
 *      off. A double click opens a photo to the full window (client/zoom.js),
 *      which holds a single click back for a moment, keeps the page behind an
 *      open photo still and touches nothing until a photo is opened. From 900px
 *      the sets are the left half of the page, each photo right-aligned to the
 *      centre with its caption and chevrons in a row under it; the information
 *      (the description, then type, role, client, years and any details) stays
 *      in place on the right while the sets pass; nothing snaps; "previous" and
 *      "next" are fixed in the window's lower corners and lie over no caption,
 *      no text and no chevron. Below 900px the page opens on the photo and its
 *      caption, the chevrons at the page's edges; with a mouse or trackpad the
 *      page snaps from set to set and then to the information, which is one
 *      column. Every photo of every project is measured in both layouts: as
 *      large as fits, nothing of it over anything else, its `sizes` right to
 *      the pixel. What is empty leaves no line (the page template is also
 *      rendered here with each field emptied in turn); the two words lead to
 *      the project before and the one after in the Index's order, none at
 *      either end. Where the information rests below 900px: after a turn of
 *      the wheel, after the title link and on a page opened at #project-info
 *      alike; clear of a header whose title wraps. An information taller than
 *      the window can be read to its end; a project with no photos does not
 *      scroll for it. The 404 page keeps its layout.
 *      About and Collaborations, the pages of text with one picture (/info/ and
 *      /collaborations/): each prints its content file's words and no others,
 *      under the project pages' header, its title not a link; the picture is
 *      the one the content names, with the description the content gives it,
 *      whole, without a border, with the shadow, its proportions from a
 *      generated rule and its `sizes` right to the pixel. From 900px the
 *      picture is the left half, as large as fits it and the window less the
 *      header less 76px, the text the right half with the footnote under it;
 *      below 900px the text, the picture and its caption, then the footnote.
 *      Nothing touches the document on load; a click on the picture does
 *      nothing and a double click opens it; with JavaScript off the page is
 *      the same. Both are editable in the CMS, field for field.
 *   4. 390px: no horizontal scroll on any route; on a touch screen a project
 *      page scrolls freely.
 *   5. CMS: every front-matter key in content/ is a field in .pages.yml, and every
 *      tag in use is in the tags select.
 *   6. The home page (the redesign of 26 Nov 2026). The intro: every line of the
 *      field a part of its own, in Fluxisch Else Light in the link colour, its links
 *      underlined in the text colour; from 720px one running paragraph across the
 *      page, below that a block to a line, centred. What the intro says is the
 *      owner's: its lines, its links and how many lines it takes at a width are
 *      read from the field and the page, never expected (an intro of one line,
 *      one without a link and an empty one all pass), and each rule is tried once
 *      more on a made-up text set in its place. From 720px the page does not
 *      scroll: under the intro, however many lines it takes, the index fills what
 *      is left of the window, 20px from either edge, its two columns 29px apart,
 *      each under a 29px strip that ends in a thin line and each scrolling on its
 *      own, the thumb under the strip; in the list's strip the words "Projects"
 *      and "tags" start on the left edge of the titles' and the types' column, at
 *      every width and with a filter on. A cell is a quarter of what the columns
 *      have, a list row is 23px tall, thumbnails are whole, centred, without a
 *      border, with the shadow, and as large as fits (the limiting side reaches
 *      its limit).
 *      The list at 720, 800, 1024, 1366 and 1920px: every row one line and 23px
 *      tall, whatever the width; the date, the title and the type each in a column
 *      of its own, the date's as wide as the widest date printed plus 32.2px (at
 *      390px as well), by a text the build writes into client/covers.css and every
 *      row prints unseen: the same with a filter on, wider for a longer date, never
 *      more than 40% of the list; the dates Light and the titles Bold; a sub-project's
 *      row (at 390px as well) with no bullet, no date, and its title Light, 20px in
 *      from the title column's start, the indent part of what
 *      is cut and slides; text that fits its column is not faded and does
 *      not move; text that does not is cut with a fade, and while its row or its
 *      thumbnail is pointed at it slides left at 100px a second until its end is
 *      clear of the fade, moving nothing else, and is back 0.2s after the pointer
 *      leaves (a pointer that comes back sooner sees no jump); the types stand
 *      still while the pointer is on them, so a click with the mouse filters by
 *      the tag it was aimed at; a tag that is cut is reached with Tab, is then
 *      whole in its column with its focus ring, and filters on Enter. The mask
 *      takes nothing off text that fits; a date too long for its column is cut,
 *      not printed over the title; on a touch screen a column is dragged, and
 *      only one whose text is cut.
 *   7. The Index below 720px: one thumbnail to a row, each whole, centred, without
 *      a border, with the shadow, and as large as fits, its title 16px under its
 *      picture and 44px before the next one, Light, in the caption colour, at most
 *      88% of the page wide (tried on a made-up title of three lines); the list
 *      under a thin line, 16px from either edge of the page; in the list the dates
 *      Light, the titles Bold and a sub-project's Light; the same projects in the grid
 *      and the list when a tag is clicked; the list without columns (at 320px as well), a
 *      row's types following its title and wrapping, on a line of their own 15px in
 *      from where the title starts (a sub-project's, 20px in, included). From
 *      720px up the titles are not
 *      displayed and the cells keep their fixed proportion.
 *   + the type: 13px on a 16px line, Light, on every route (captions 11px / 13.2px);
 *   + no picture's box has a border, every one has the shadow and its picture is stretched
 *     over all of it (object-fit: fill), on every route; a thumbnail's and a photo's `sizes`
 *     attribute gives the width it is shown at;
 *   + zero mutations on the first render and on a forced el.render();
 *   + zero console errors and page errors on every route, JS on and off.
 * Exits 1 if anything fails.
 */
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { extname, join, normalize, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import nunjucks from 'nunjucks';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { markdown, markdownText } from '../server/markdown.js';
import { coversCss, coverSizes, homeText, order, shortYears } from '../server/content.js';
import { createEnvironment } from '../server/zeldman/zeldman.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
    console.error('verify: dist/ is missing; run npm run build first');
    process.exit(1);
}

const results = [];
const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// The shadow around every picture, as the browser gives it back (--frame-shadow in client/site.css).
// It is all that is left of the frame: since 19 Nov 2026 no picture has a border.
const SHADOW = 'rgba(100, 40, 95, 0.55) 1px 2px 6px 0px';
// The body type: 13px on a 16px line, Light (font-size / line-height / font-weight).
const BODY = '13px / 16px / 300';
// How far the limiting side of a picture may be from its limit: layout works in 64ths of a pixel,
// and the side that follows from the proportions is rounded once more (0.04px at most, measured).
const EXACT = 0.1;
// The home page (the redesign of 26 Nov 2026), its own constants. The type: 12.5px on a 15.2px
// line from 720px, 14.5px on an 18px line below, Light (font-size / line-height / font-weight);
// the intro 15px and 17.5px, on a 21px line both.
const HOME_BODY = { wide: '12.5px / 15.2px / 300', narrow: '14.5px / 18px / 300' };
const HOME_TYPE = { wide: '12.5px', narrow: '14.5px' };
const HOME_INTRO = { wide: '15px / 21px / 300', narrow: '17.5px / 21px / 300' };
// The two addresses of the home page.
const HOME_ROUTES = ['/', '/projects/'];
// From 720px: the index is 20px from either edge of the page and its two columns are 29px apart,
// so the columns have the page less 69px between them and a grid cell is a quarter of that; each
// column starts with a 29px strip. A thumbnail is as large as fits 88% of its cell's width and
// 49.9733% of that width in height (86.5% of a 341.2 : 197.12 cell).
const HOME_EDGE = 20;
const HOME_GAP = 29;
const HOME_STRIP = 29;
const homeCell = (page) => (page - 2 * HOME_EDGE - HOME_GAP) / 4;
const HOME_THUMB = { width: 0.88, height: 0.499733 };
// Below 720px: a thumbnail is as large as fits the page less 124px and 132% of the page's width
// in height; its title is 16px under it and a cell has 22px above and below, so 44px to the next.
const HOME_PHONE = { side: 124, height: 1.32, under: 16, pad: 22, name: 0.88 };
// A grid cell's thumbnail with other proportions than its own, as client/covers.css would give them
// (--a, set in the page for the test): its box and its cell, and what `sizes` the build writes for a
// picture of those proportions. For the limits no cover of the content reaches today: a picture wide
// enough to be limited by its cell's width from 720px, one tall enough to be limited in height below.
const reshaped = async (page, a) => {
    const slug = await page.evaluate(() => document.querySelector('project-index .cell:has(.box)').dataset.slug);
    const style = await page.addStyleTag({ content: `project-index #cell-${slug} { --a: ${a}; }` });
    const got = await page.evaluate((slug) => {
        const cell = document.querySelector(`#cell-${slug}`);
        const c = cell.getBoundingClientRect();
        const b = cell.querySelector('.box').getBoundingClientRect();
        return { cell: c.width, width: b.width, height: b.height, off: Math.abs((b.left + b.right) / 2 - (c.left + c.right) / 2), page: document.documentElement.clientWidth, vw: innerWidth, vh: innerHeight };
    }, slug);
    await style.evaluate(el => el.remove());
    return { ...got, a, sizes: sizesPx(coverSizes({ width: Math.round(a * 1000), height: 1000 }), got.vw, got.vh) };
};
// The list: a sub-project's title is 20px in; a column fades over its last 1em, 12.5px.
const HOME_INDENT = 20;
const HOME_FADE = 12.5;
// The home page's text as typed (the front matter of content/site/index.md), and the intro's lines: the
// lines of the field that print something (an empty line does not, nor does a line of nothing but an
// image, which the site's Markdown leaves out). The field is the owner's to edit in the CMS: it may be
// one line or many, with links or without, or empty, so the checks take from it what the page should
// hold and never expect today's four lines.
const homeFront = matter(readFileSync(join(root, 'content/site/index.md'), 'utf8'), {}).data;
const homeIntro = String(homeFront.intro ?? '').split(/\r\n?|\n/).map(l => l.trim()).filter(l => l && homeText({ intro: l }).intro.length > 0);
// The links typed in a line in the form the CMS's help gives, [words](address), by the checks' own
// reading of the line: their addresses, of those the site prints as links (web, mail, phone, a path
// on this site). A round bracket inside an address is taken with it; an image, ![words](file), is
// no link (the site prints its words).
const homeLinks = (line) => [...line.matchAll(/(!?)\[[^\]]*\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g)].filter(m => !m[1]).map(m => m[2]).filter(a => /^(https?:|mailto:|tel:|\/|#|\.\.?\/)/i.test(a));
// What the site makes of the field (homeText in server/content.js): the HTML of each part, and the
// addresses of the links in a part. The site's Markdown also makes a link of an address typed bare
// (https://…, www.…, a mail address), so a part can hold more links than were typed in brackets.
const homeParts = homeText(homeFront).intro;
const homePartLinks = (part) => [...part.matchAll(/<a href="([^"]*)">/g)].map(m => m[1]);
// What the stylesheet does with an intro is checked on a made-up one as well, set in the page in place
// of its own, so that every rule is tried whatever the owner's text is. Four lines of a field, read as
// the site reads the field (homeText), so each is the HTML of one part as the template gets it: the
// first begins with a slanted word and has a link with the full stop that follows it, the third a
// link of two words. Its second part is made longer in the page, a word at a time, until the text
// takes the lines a case asks for. It is never printed on the site.
const HOME_MADE_INTRO = homeText({ intro: '*one* [two](/info/).\nthree four five\nsix [seven eight](/info/), nine.\nten:' }).intro;
// The width in px that a `sizes` attribute promises the browser in a window of vw × vh: the first entry
// whose media condition holds (the site writes only max-width / min-width in px), its length worked out
// (vw, vh, px, calc, min). NaN for anything else, so a check that compares it fails.
const sizesPx = (sizes, vw, vh) => {
    const entries = [];
    for (let i = 0, depth = 0, from = 0; i <= sizes.length; i++) {
        if (sizes[i] === '(') depth++;
        else if (sizes[i] === ')') depth--;
        if (i === sizes.length || (sizes[i] === ',' && depth === 0)) { entries.push(sizes.slice(from, i).trim()); from = i + 1; }
    }
    for (const entry of entries) {
        const m = entry.match(/^\((max|min)-width:\s*([\d.]+)px\)\s+(.+)$/);
        if (m && !(m[1] === 'max' ? vw <= Number(m[2]) : vw >= Number(m[2]))) continue;
        const sum = (m ? m[3] : entry).replace(/([\d.]+)vw/g, (_, n) => `(${n} * ${vw / 100})`).replace(/([\d.]+)vh/g, (_, n) => `(${n} * ${vh / 100})`)
            .replace(/([\d.]+)px/g, '$1').replace(/calc/g, '').replace(/min\(/g, 'Math.min(');
        if (!sum.trim() || !/^[\d\s.+\-*/(),]*$/.test(sum.replace(/Math\.min/g, ''))) return NaN;
        try { return Number(new Function(`return ${sum};`)()); } catch { return NaN; }
    }
    return NaN;
};
// Pictures as { name, width, sizes: [the <img>'s, its <source>'s or null] } in a window of vw × vh: those whose
// `sizes` does not give the width the picture is shown at, to the pixel (the browser chooses the file by it,
// before any stylesheet; it lost the border's 12px with the picture, 19 Nov 2026). A picture with one file
// has no `srcset` and needs no `sizes`.
const sizesOff = (pictures, vw, vh) => pictures.map(({ name, width, sizes: [img, source] }) => {
    if (img === null && source === null) return '';
    if (source !== null && source !== img) return `${name}: <source> says ${source}, <img> ${img}`;
    const px = sizesPx(img ?? '', vw, vh);
    return Math.abs(px - width) <= 1 ? '' : `${name}: sizes gives ${Number.isNaN(px) ? 'nothing this check can read' : `${Math.round(px * 100) / 100}px`}, the picture is ${Math.round(width * 100) / 100}px wide (${img})`;
}).filter(Boolean);

// --- The project pages and the 404 page (the redesign of 26 Nov 2026): their own measures, apart from the
// constants above, which the home page's checks share. All of them are in client/site.css (the header),
// client/project.css (the page and the information) and components/project-slides.css (a set of photos).
// (An import of its own, so that the import above, which the home page's checks share, stays as it is.)
import { markdownLines } from '../server/markdown.js';

// From this width the sets of photos are the left half of the page and the information stays in place on
// the right; below it the information comes after the sets.
const WIDE = 900;
// What the pages are held to at a window `vw` wide.
const pageOf = (vw) => (vw >= WIDE ? {
    wide: true,
    head: 71, // --head: the header while the title is one line (39px + a 16px line + 16px)
    cap: 70, // --cap: the room kept under a photo for its caption
    chevron: 36, // --arrow: a chevron's column at either end of the caption row
    side: 34, // the page's side padding
    between: 17, // between the two halves
    under: 12, // from the photo to its caption
    title: '12.5px / 16px / 700', // the header's title; `back` is the same size, Light
    back: '12.5px / 16px / 300',
    text: '12.5px / 15.2px / 300', // the description
    facts: '12.5px / 17.75px / 300', // type, role, for, the years, the details: a line of 1.42
    caption: '11.5px / 13.5px / 300',
} : {
    wide: false,
    head: 95, // 50px + a 20px line + 22px is 92px; `min-height` makes it 95px
    cap: 76,
    chevron: 26,
    side: 24,
    between: 0,
    under: 14,
    title: '16.5px / 20px / 700',
    back: '16.5px / 20px / 300',
    text: '16.5px / 20px / 300',
    facts: '16.5px / 23.43px / 300',
    caption: '14.5px / 17.5px / 300',
});
// The 404 page, which keeps the layout it had: the body's own type.
const plainType = (vw) => (vw >= 720 ? '12.5px / 15.2px / 300' : '14.5px / 18px / 300');
// The room a photo has: from 900px the left half of the page (the page less its 34px paddings and the 17px
// between the halves, halved) and the window's height less the header and the caption's room; below 900px
// the page less 24px on either side, and the same of the height.
const roomOf = (vw, vh) => { const d = pageOf(vw); return { width: d.wide ? (vw - 2 * d.side - d.between) / 2 : vw - 2 * d.side, height: Math.max(160, vh - d.head - d.cap) }; };
// The words "previous" and "next" are fixed in the window's lower corners from 900px. A photo with others in
// its set may have a chevron at its lower left corner, where "previous" is on every page but the first
// project's: such a photo (`cornered`) ends at least CLEAR px before the half's left edge or is at least
// LOWER px less tall than the room, whichever leaves it larger. A photo alone in its set has no chevron,
// the first project no "previous": those are simply as large as fits.
const CLEAR = 60;
const LOWER = 48;
const photoWidth = (a, vw, vh, cornered) => {
    const room = roomOf(vw, vh);
    if (vw >= WIDE && cornered) return Math.min(room.width, Math.max(Math.min(room.height * a, room.width - CLEAR), (room.height - LOWER) * a));
    return Math.min(room.width, room.height * a);
};
// The width a project photo's `sizes` promises (as sizesPx above, which does not read max()).
const slideSizesPx = (sizes, vw, vh) => {
    const entries = [];
    for (let i = 0, depth = 0, from = 0; i <= sizes.length; i++) {
        if (sizes[i] === '(') depth++;
        else if (sizes[i] === ')') depth--;
        if (i === sizes.length || (sizes[i] === ',' && depth === 0)) { entries.push(sizes.slice(from, i).trim()); from = i + 1; }
    }
    for (const entry of entries) {
        const m = entry.match(/^\((max|min)-width:\s*([\d.]+)px\)\s+(.+)$/);
        if (m && !(m[1] === 'max' ? vw <= Number(m[2]) : vw >= Number(m[2]))) continue;
        const sum = (m ? m[3] : entry).replace(/([\d.]+)vw/g, (_, n) => `(${n} * ${vw / 100})`).replace(/([\d.]+)vh/g, (_, n) => `(${n} * ${vh / 100})`)
            .replace(/([\d.]+)px/g, '$1').replace(/calc/g, '');
        if (!sum.trim() || !/^[\d\s.+\-*/(),]*$/.test(sum.replace(/min|max/g, ''))) return NaN;
        try { return Number(new Function(`return ${sum.replace(/(min|max)\(/g, 'Math.$1(')};`)()); } catch { return NaN; }
    }
    return NaN;
};
// How long zoom.js holds a click on a photo back, to see whether a second follows (client/zoom.js, WAIT).
const ZOOM_WAIT = 260;

// --- The pages of text with one picture, About (/info/) and Collaborations (the redesign of 26 Nov 2026):
// shared/pages/sheet.html, client/sheet.css, and the header they share with the project pages (pageOf above).
// (Imports of their own, so that the imports the other checks share stay as they are.)
import { markdownInline } from '../server/markdown.js';
import { sheet as shapeSheet, figuresCss } from '../server/content.js';
import siteConfig from '../site.config.js';

// The pages, by content file (content/site/<name>.md), which is also the address (/<name>/) and the folder of
// the page's picture (images/<name>/); `title` is what the page is called when its own title is left empty.
const SHEET_PAGES = [{ name: 'info', title: 'About' }, { name: 'collaborations', title: 'Collaborations' }];
// Their content files, as typed.
const sheetFronts = SHEET_PAGES.map(s => ({ ...s, ...matter(readFileSync(join(root, 'content/site', `${s.name}.md`), 'utf8'), {}) }));
// What such a page prints, worked out from its content file: its title; its text as the site's renderer
// prints it; its picture's path under images/ ('' when the content names none, or one that is not there: the
// CMS writes the public path, and a bare file name is looked for in the page's own folder); the picture's
// description; its caption (a picture's, so none without one); its footnotes, a paragraph each, as typed and
// as their words.
const sheetWants = (s) => {
    const typed = decodeURIComponent(text(s.data.image)).replace(/\\/g, '/');
    let image = typed && !typed.includes('/') ? `${s.name}/${typed}` : typed.replace(/^\/?images\//, '').replace(/^\/+/, '');
    if (image && !existsSync(join(root, 'images', image))) image = '';
    const typedNotes = text(s.data.note).split(/\n\s*\n/).map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
    return { title: text(s.data.title) || s.title, body: markdown(s.content), image, alt: text(s.data.alt), caption: image ? markdownInline(text(s.data.caption)) : '', typedNotes, notes: typedNotes.map(t => words(t)) };
};
// What such a page is held to at a window `vw` wide. From 900px the picture is the left half of the page and
// the text the right, the footnote under the text; below 900px the text comes first, then the picture with
// its caption, then the footnote.
const sheetOf = (vw) => (vw >= WIDE ? {
    wide: true,
    side: 34, // the page's side padding
    between: 17, // between the two halves
    column: 292, // the text and the footnote are at most this wide
    first: 4, // from the header to the text's first line
    apart: 7, // between two paragraphs
    under: 12, // from the picture to its caption
    note: 29, // from the text, which ends with a paragraph's 7px, to the footnote
    hang: 0.8, // the lines of a footnote after its first start this many em further in
    end: 60, // under the lowest thing on the page
    text: '12.5px / 15.2px / 300',
    caption: '11.5px / 13.5px / 300',
} : {
    wide: false,
    side: 24,
    first: 30,
    apart: 15,
    picture: 28, // from the text to the picture
    under: 14,
    note: 34, // from the picture, or its caption, to the footnote
    hang: 1.1,
    end: 96,
    text: '16.5px / 20px / 300',
    caption: '14.5px / 17.5px / 300',
});
// From 900px the picture leaves this much of the window's height free, besides the header: it is as large as
// fits its half of the page and the window less the header less this, and its room is never less tall than SHEET_LEAST.
const SHEET_KEEP = 76;
const SHEET_LEAST = 160;
// A caption is at most this wide, at every width.
const SHEET_CAPTION = 420;
// The room the picture has in a window of vw × vh, and the width it is shown at with proportions a : 1.
const sheetRoom = (vw, vh) => {
    const d = sheetOf(vw);
    return d.wide ? { width: (vw - 2 * d.side - d.between) / 2, height: Math.max(SHEET_LEAST, vh - pageOf(vw).head - SHEET_KEEP) } : { width: vw - 2 * d.side, height: Infinity };
};
const sheetWidth = (a, vw, vh) => { const room = sheetRoom(vw, vh); return Math.min(room.width, room.height * a); };
// Such a page as it lies in the window: the header, the text and its paragraphs, the picture's box and its
// image, the caption, the footnote and its lines.
const sheetLie = (page) => page.evaluate(() => {
    const box = (el) => { if (!el || !el.getClientRects().length) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
    const type = (el) => { const s = getComputedStyle(el); return [s.fontSize, s.lineHeight, s.fontWeight].join(' / '); };
    // The lines of a piece of text as the browser laid them out, from the text itself: each { top, left, right }.
    const linesOf = (el) => {
        const rects = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.data.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(n);
            rects.push(...[...range.getClientRects()].filter(r => r.width > 0 && r.height > 0));
        }
        const lines = [];
        for (const r of rects.sort((a, b) => a.top - b.top || a.left - b.left)) {
            const line = lines.find(l => Math.abs(l.top - r.top) < r.height / 2);
            if (line) { line.left = Math.min(line.left, r.left); line.right = Math.max(line.right, r.right); } else lines.push({ top: r.top, left: r.left, right: r.right });
        }
        return lines;
    };
    const para = (p) => ({ ...box(p), type: type(p), step: parseFloat(getComputedStyle(p).lineHeight), lines: linesOf(p) });
    const head = document.querySelector('.project-head');
    const h1 = head?.querySelector('h1');
    const back = document.querySelector('.back');
    const link = back?.querySelector('a');
    const main = document.querySelector('main.sheet');
    const textEl = main.querySelector(':scope > .text');
    const figure = main.querySelector(':scope > figure');
    const picture = figure?.querySelector('picture');
    const img = picture?.querySelector('img');
    const caption = figure?.querySelector('figcaption');
    const note = main.querySelector(':scope > .note');
    const vw = document.documentElement.clientWidth;
    const at = document.elementFromPoint(vw / 2, 10);
    const ps = picture ? getComputedStyle(picture) : null;
    return {
        y: scrollY,
        vw,
        vh: innerHeight,
        wide: document.documentElement.scrollWidth,
        tall: document.documentElement.scrollHeight,
        ground: getComputedStyle(document.body).backgroundColor,
        head: head ? { ...box(head), position: getComputedStyle(head).position, ground: getComputedStyle(head).backgroundColor, image: getComputedStyle(head).backgroundImage, onTop: Boolean(at) && head.contains(at) } : null,
        title: h1 ? { ...box(h1), type: type(h1), text: h1.textContent.trim(), link: Boolean(h1.querySelector('a')), lines: linesOf(h1) } : null,
        back: link ? { ...box(back), type: type(link), word: link.textContent, href: link.getAttribute('href'), colour: getComputedStyle(link).color, lean: getComputedStyle(link).transform } : null,
        main: box(main),
        order: [...main.children].map(el => el.className || el.localName),
        text: box(textEl),
        paras: textEl ? [...textEl.querySelectorAll(':scope > p')].map(para) : [],
        figure: box(figure),
        id: figure?.id ?? '',
        a: figure ? Number(getComputedStyle(figure).getPropertyValue('--a')) || null : null,
        picture: picture ? {
            ...box(picture),
            border: ['Top', 'Right', 'Bottom', 'Left'].map(k => ps[`border${k}Width`]).join(' '),
            padding: ['Top', 'Right', 'Bottom', 'Left'].map(k => ps[`padding${k}`]).join(' '),
            shadow: ps.boxShadow,
            clip: ps.overflow,
            cursor: ps.cursor,
            touch: ps.touchAction,
            zoom: picture.hasAttribute('data-zoom'),
        } : null,
        img: img ? {
            ...box(img),
            fit: getComputedStyle(img).objectFit,
            alt: img.getAttribute('alt'),
            loaded: img.complete && img.naturalWidth > 0,
            attrs: [Number(img.getAttribute('width')), Number(img.getAttribute('height'))],
            current: decodeURIComponent(img.currentSrc).split('/').pop(),
            sizes: [img.getAttribute('sizes'), picture.querySelector('source')?.getAttribute('sizes') ?? null],
            // The files the browser chooses from (the WebP ones where it takes those): [width, file name].
            files: (picture.querySelector('source')?.getAttribute('srcset') || img.getAttribute('srcset') || '').split(',').map(c => c.trim().split(/\s+/)).filter(c => c.length === 2).map(([url, w]) => [parseFloat(w), decodeURIComponent(url).split('/').pop()]),
        } : null,
        caption: caption ? { ...box(caption), type: type(caption), colour: getComputedStyle(caption).color, align: getComputedStyle(caption).textAlign, text: caption.textContent.replace(/\s+/g, ' ').trim(), lines: linesOf(caption) } : null,
        // The caption colour as the stylesheet names it (--caption, a hex colour), as the browser gives a colour back.
        captionInk: getComputedStyle(document.documentElement).getPropertyValue('--caption').trim().replace(/^#(..)(..)(..)$/, (_, r, g, b) => `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`),
        note: note ? { ...box(note), paras: [...note.querySelectorAll(':scope > p')].map(p => ({ ...para(p), pad: parseFloat(getComputedStyle(p).paddingLeft), indent: parseFloat(getComputedStyle(p).textIndent), size: parseFloat(getComputedStyle(p).fontSize) })) } : null,
    };
});
// What of such a page is not as the design has it in its window, or '' (the page at its top).
const sheetOff = (m) => {
    const d = sheetOf(m.vw);
    const h = pageOf(m.vw);
    const off = [];
    const near = (a, b, by = 0.5) => Math.abs(a - b) <= by;
    const centre = m.vw / 2;
    // The header: the project pages', its title not a link.
    if (!m.head || !near(m.head.top, 0) || !near(m.head.height, h.head) || m.head.position !== 'sticky' || m.head.ground !== m.ground || m.head.image !== 'none' || !m.head.onTop) off.push(`the header: ${JSON.stringify(m.head)}`);
    if (!m.title || m.title.link || m.title.type !== h.title || m.title.lines.length !== 1 || !near((m.title.lines[0].left + m.title.lines[0].right) / 2, centre, 1) || !near(m.title.top, h.wide ? 39 : 50)) off.push(`the title: ${JSON.stringify(m.title)}`);
    if (!m.back || m.back.word !== 'back' || m.back.href !== '/' || m.back.type !== h.back || m.back.colour !== 'rgb(128, 114, 121)' || !/^matrix\(1, 0, 0\.105\d*, 1, 0, 0\)$/.test(m.back.lean) || !near(m.back.left, d.side) || !near(m.back.top, h.wide ? 39 : 50)) off.push(`back: ${JSON.stringify(m.back)}`);
    // The text: its place, its type, its paragraphs each whole lines and the same distance apart.
    const room = sheetRoom(m.vw, m.vh);
    const column = d.wide ? Math.min(d.column, room.width) : m.vw - 2 * d.side;
    const left = d.wide ? centre + d.between / 2 : d.side;
    if (m.text) {
        if (!near(m.text.left, left) || !near(m.text.width, column)) off.push(`the text from ${m.text.left}, ${m.text.width} wide, not from ${left}, ${column} wide`);
        if (!m.paras.length || !near(m.paras[0].top, h.head + d.first)) off.push(`the text's first line at ${m.paras[0]?.top}, not ${h.head + d.first}`);
        m.paras.forEach((p, i) => {
            if (p.type !== d.text) off.push(`paragraph ${i + 1} in ${p.type}`);
            if (!near(p.height / p.step, Math.round(p.height / p.step), 0.02) || p.lines.length !== Math.round(p.height / p.step)) off.push(`paragraph ${i + 1} is ${p.height} tall with ${p.lines.length} lines of ${p.step}`);
            if (i > 0 && !near(p.top - m.paras[i - 1].bottom, d.apart, 0.1)) off.push(`paragraph ${i + 1} is ${p.top - m.paras[i - 1].bottom} under the one before, not ${d.apart}`);
            if (!near(p.left, left) || p.right > left + column + 0.5) off.push(`paragraph ${i + 1} from ${p.left} to ${p.right}`);
        });
    }
    const last = m.paras.at(-1);
    // The picture: whole, as large as fits its room, the side that limits it on its limit; no border, the shadow.
    if (m.figure) {
        const want = sheetWidth(m.a ?? 1.5, m.vw, m.vh);
        const p = m.picture;
        if (!p || !m.img) off.push('a figure without a picture');
        else {
            if (!near(p.width, want, EXACT) || !near(p.height, want / (m.a ?? 1.5), EXACT)) off.push(`the picture is ${p.width} × ${p.height}, not ${want} × ${want / (m.a ?? 1.5)}`);
            if (!(near(p.width, room.width, EXACT) || near(p.height, room.height, EXACT))) off.push(`neither side of the picture is on its limit (${p.width} × ${p.height} in ${room.width} × ${room.height})`);
            if (p.width > room.width + EXACT || p.height > room.height + EXACT) off.push(`the picture is larger than its room (${p.width} × ${p.height} in ${room.width} × ${room.height})`);
            if (d.wide ? !near(p.right, centre - d.between / 2, EXACT) || !near(p.top, h.head, EXACT) : !near(p.left, d.side, EXACT) || !near(p.right, m.vw - d.side, EXACT)) off.push(`the picture from ${p.left} to ${p.right}, its top at ${p.top}`);
            if (!d.wide && last && !near(p.top - last.bottom, d.picture, 0.1)) off.push(`the picture is ${p.top - last.bottom} under the text, not ${d.picture}`);
            if (p.border !== '0px 0px 0px 0px' || p.padding !== '0px 0px 0px 0px' || p.shadow !== SHADOW || p.clip !== 'visible') off.push(`the picture's box: border ${p.border}, padding ${p.padding}, shadow ${p.shadow}, overflow ${p.clip}`);
            if (!near(m.figure.left, p.left, EXACT) || !near(m.figure.width, p.width, EXACT) || !near(m.figure.top, p.top, EXACT)) off.push(`the figure is not its picture's width (${m.figure.left}, ${m.figure.width})`);
            // The image is stretched over the whole box, which has the picture's proportions: nothing is cut off, nothing shows beside it.
            // (That the files themselves have those proportions, within the half pixel a resized file is rounded by, is checked from dist/.)
            if (['left', 'top', 'width', 'height'].some(k => !near(m.img[k], p[k], 0.02)) || m.img.fit !== (m.img.attrs[0] ? 'fill' : 'contain')) off.push(`the image does not cover its box (${m.img.fit}; ${m.img.width} × ${m.img.height} in ${p.width} × ${p.height})`);
            if (m.a !== null && Math.abs(m.a - Math.round((m.img.attrs[0] / m.img.attrs[1]) * 10000) / 10000) > 1e-9) off.push(`--a is ${m.a}, the image ${m.img.attrs.join(' × ')}`);
            if (!p.zoom || p.touch !== 'manipulation') off.push(`the picture is not marked to open (data-zoom: ${p.zoom}, touch-action: ${p.touch})`);
        }
        const c = m.caption;
        if (c && p) {
            if (!near(c.top - p.bottom, d.under, 0.1)) off.push(`the caption is ${c.top - p.bottom} under the picture, not ${d.under}`);
            if (c.type !== d.caption || c.colour !== m.captionInk || c.align !== 'center') off.push(`the caption in ${c.type}, ${c.colour}, ${c.align}`);
            if (c.width > SHEET_CAPTION + 0.01 || c.left < m.figure.left - 0.5 || c.right > m.figure.right + 0.5 || !near((c.left + c.right) / 2, (p.left + p.right) / 2)) off.push(`the caption from ${c.left} to ${c.right} under a picture from ${p.left} to ${p.right}`);
            if (!near(c.width, Math.min(SHEET_CAPTION, p.width), 0.1)) off.push(`the caption is ${c.width} wide, not ${Math.min(SHEET_CAPTION, p.width)}`);
            if (c.lines.some(l => l.left < c.left - 1 || l.right > c.right + 1)) off.push('a line of the caption reaches outside its box');
        }
        if (d.wide && m.text && m.figure.right > m.text.left - d.between + 0.5) off.push(`the picture reaches to ${m.figure.right}, the text starts at ${m.text.left}`);
    }
    // The footnote: under the text from 900px, after the picture and its caption below; its first line at the edge, the others hung.
    if (m.note) {
        const above = d.wide ? (last ? last.bottom + d.apart : null) : (m.caption ?? m.picture ?? last)?.bottom ?? null;
        if (above !== null && !near(m.note.top - above, d.note, 0.1)) off.push(`the footnote is ${m.note.top - above} under ${d.wide ? 'the text' : m.caption ? 'the caption' : m.picture ? 'the picture' : 'the text'}, not ${d.note}`);
        if (!near(m.note.left, left) || !near(m.note.width, column)) off.push(`the footnote from ${m.note.left}, ${m.note.width} wide, not from ${left}, ${column} wide`);
        m.note.paras.forEach((p, i) => {
            if (p.type !== d.text) off.push(`footnote ${i + 1} in ${p.type}`);
            if (!near(p.pad, d.hang * p.size, 0.01) || !near(p.indent, -p.pad, 0.01)) off.push(`footnote ${i + 1} hangs by ${p.pad} and ${p.indent}, not ${d.hang * p.size}`);
            if (!p.lines.length || !near(p.lines[0].left, m.note.left) || p.lines.slice(1).some(l => !near(l.left, m.note.left + p.pad)) || p.lines.some(l => l.right > m.note.right + 0.5)) off.push(`footnote ${i + 1}: its lines start at ${p.lines.map(l => Math.round(l.left * 100) / 100).slice(0, 3).join(', ')} in a box from ${m.note.left}`);
            if (i > 0 && !near(p.top - m.note.paras[i - 1].bottom, d.apart, 0.1)) off.push(`footnote ${i + 1} is ${p.top - m.note.paras[i - 1].bottom} under the one before`);
        });
    }
    // The order on the page, and its end: the page's bottom padding under the lowest thing on it.
    const tops = [m.text, d.wide ? null : m.figure, d.wide ? null : m.caption, m.note].filter(Boolean).map(b => b.top);
    if (tops.some((t, i) => i > 0 && t < tops[i - 1])) off.push(`the parts are not one under the other (${tops.join(', ')})`);
    if (d.wide && m.note && m.figure && m.note.left < m.figure.right) off.push('the footnote is under the picture, not under the text');
    // From 900px a caption does not count for that padding: it stands in the room the picture keeps free under itself (76px of
    // the window's height), so the page ends 60px under the text and its footnote, or where the caption ends, whichever is
    // lower. (With the 60px under the caption as well, as the design had it, the Collaborations page scrolled by 23px with
    // everything on it in the window.) A picture without a caption has the 60px under it, as it always had.
    const written = Math.max(...[m.note?.bottom, m.text ? m.text.bottom + (!d.wide && !m.note && !m.figure ? d.apart : 0) : null].filter(v => typeof v === 'number'), h.head);
    const end = d.wide && m.figure && m.caption ? Math.max(m.figure.bottom, written + d.end) : Math.max(written, m.figure?.bottom ?? 0) + d.end;
    if (!near(m.main.bottom, end, 0.1)) off.push(`the page ends at ${m.main.bottom}, not at ${end}: ${d.end}px under its lowest part${d.wide && m.caption ? ', for which a caption does not count' : ''}`);
    if (Math.abs(m.tall - Math.max(m.vh, m.main.bottom + m.y)) > 1) off.push(`the page is ${m.tall} tall, its content ends at ${m.main.bottom + m.y}`);
    if (m.wide > m.vw) off.push(`the page is ${m.wide}px wide`);
    return off.join('; ');
};

// --- what the site should contain, from content/ directly

const projectsDir = join(root, 'content/projects');
const fronts = readdirSync(projectsDir).filter(f => f.endsWith('.md'))
    .map(f => ({ file: f, ...matter(readFileSync(join(projectsDir, f), 'utf8'), {}) }));
const published = fronts.filter(f => f.data.published === true);
const html = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// One line of Markdown as the words a reader sees, by the site's own renderer.
const words = (md) => markdownText(String(md));
// HTML as its text, still escaped as html() escapes.
const textOf = (h) => String(h).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
// The first words of a Markdown body as the site prints them (escaped, like textOf).
const opening = (md) => textOf(markdown(String(md))).trim().split(' ').slice(0, 4).join(' ');
const photos = (p) => (p.data.images ?? []).map(im => (typeof im === 'string' ? { image: im } : im)).filter(im => im?.image);
// A project's photos by set, as the page shows them: a photo's set is its `set` (a whole number
// from 1; 1 when it is left out), the sets are in ascending number order, and the photos of a
// set keep their order in the list.
const setOf = (im) => (typeof im.set === 'number' || typeof im.set === 'string') && im.set !== '' && Number.isInteger(Number(im.set)) && Number(im.set) >= 1 ? Number(im.set) : 1;
const setsOf = (p) => [...new Set(photos(p).map(setOf))].sort((a, b) => a - b).map(n => photos(p).filter(im => setOf(im) === n));
const firstSet = (p) => setsOf(p)[0] ?? [];
// A front-matter value as text, and as a list of texts (the CMS drops what is empty; a role may be one line or several).
const text = (v) => (v === null || v === undefined ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v)).trim();
const texts = (v) => (Array.isArray(v) ? v : v === null || v === undefined || v === '' ? [] : [v]).map(text).filter(Boolean);
// Text as a browser prints it: white space (two spaces typed for one, a tab, a line break) is one space.
// The same white space as the build's when it writes the dates into --dates; a no-break space is not part of it.
const spaced = (t) => String(t).replace(/[\t\n\f\r ]+/g, ' ').trim();
// A project's "More details" as its page prints them, worked out here from the text as typed: blocks of lines (an empty line
// between two blocks), every line its words (one line of Markdown; the mark of a list line is dropped), nothing for what is empty.
const detailsOf = (p) => text(p.data.details).split(/\r\n?|\n/).map(line => line.trim()).join('\n').split(/\n{2,}/)
    .map(block => block.split('\n').map(line => words(line.replace(/^[-*]\s+/, ''))).filter(Boolean)).filter(block => block.length);
// The lines of a project's information beside its description, as the page prints them: type, role, for, the years, then every
// line of its details; an empty one is left out.
// White space is one space, as textOf reads it from the page (a date typed with two spaces is still one line of the same words).
const factsOf = (p) => [
    texts(p.data.tags).length ? `type: ${texts(p.data.tags).join(', ')}` : '',
    texts(p.data.role).length ? `role: ${texts(p.data.role).join(', ')}` : '',
    text(p.data.client) ? `for: ${text(p.data.client)}` : '',
    shortYears(text(p.data.years)),
    ...detailsOf(p).flat(),
].filter(Boolean).map(line => line.replace(/\s+/g, ' '));
// The information section of a project page's HTML; its facts (everything from `.facts` to the description, the links to the
// neighbours or the section's end, whichever comes first); the lines of the facts; the blocks of details among them, each a
// list of lines; and one of the two links to the neighbours.
const sectionOf = (body) => body.match(/<section class="project-info"[\s\S]*?<\/section>/)?.[0] ?? '';
const factsHtml = (section) => { const from = section.indexOf('<div class="facts">'); if (from < 0) return ''; const to = section.slice(from).search(/<div class="about">|<nav class="neighbours"|<\/section>/); return section.slice(from, from + to); };
const linesOf = (section) => [...factsHtml(section).matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => textOf(m[1]).trim());
const blocksOf = (section) => [...factsHtml(section).matchAll(/<div class="extra">([\s\S]*?)<\/div>/g)].map(m => [...m[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map(l => textOf(l[1]).trim()));
const arrowOf = (section, side) => { const m = section.match(new RegExp(`<a\\s+class="${side}"\\s+href="([^"]*)"\\s+aria-label="([^"]*)"\\s*>([\\s\\S]*?)</a>`)); return m ? { href: m[1], name: m[2], word: m[3] } : null; };
// A photo's file name without its extension: the built file's name starts with it.
const stem = (im) => decodeURIComponent(String(im.image)).split('/').pop().replace(/\.[^.]+$/, '');
// The sub-projects, from the content: a project whose parent is another published project that is
// itself a main project (one level of nesting, as order() in server/content.js sorts the list; a
// project whose parent is missing, unpublished, itself or a sub-project is a main project). In the
// Index list a sub-project's row prints no bullet and no date, and its title is Light and indented
// (20 Nov 2026); its own page prints its years like any other.
const parentOf = (p) => { const q = published.find(x => x.data.slug === text(p.data.parent)); return q && q !== p ? q : null; };
const subs = new Set(published.filter(p => parentOf(p) && !parentOf(parentOf(p))).map(p => p.data.slug));
// What a project's row prints in the list's date cell: its years, short; nothing for a sub-project.
const listDate = (p) => (subs.has(p.data.slug) ? '' : shortYears(text(p.data.years)));
// Two tags to filter by, taken from the content: the most used, and the most used of the rest.
const counts = new Map();
for (const p of published) for (const t of p.data.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
const [tagA, tagB] = [...counts].sort((a, b) => b[1] - a[1]).map(([t]) => t);

// The dates: the content keeps them as typed, in full; the site prints them short, everywhere.
{
    const table = [['2026', '’26'], ['2023 - 2026', '’23–26'], ['2023–2026', '’23–26'], ['2025, 2026', '’25, 26'], ['2023 –', '’23–'], ['’23–26', '’23–26'], ['', '']];
    const off = table.filter(([typed, printed]) => shortYears(typed) !== printed).map(([typed]) => `${typed} → ${shortYears(typed)}`);
    check('1. the short date format: 2026 → ’26, 2023 - 2026 → ’23–26, 2025, 2026 → ’25, 26, 2023 – → ’23–, and one typed short already stays as it is', off.length === 0, off.join('; '));
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    const wrong = [];
    const lost = [];
    for (const p of published) {
        const want = shortYears(text(p.data.years));
        const row = home.match(new RegExp(`id="row-${p.data.slug}"[^>]*><span class="years">([^<]*)</span>`))?.[1];
        const page = readFileSync(join(dist, 'projects', p.data.slug, 'index.html'), 'utf8').match(/<p class="years">([^<]*)<\/p>/)?.[1] ?? '';
        if (row !== listDate(p) || page !== want || /\d{4}/.test(row ?? '')) wrong.push(`${p.data.slug}: the list has "${row}", wanted "${listDate(p)}"; its page "${page}", wanted "${want}"`);
        if (subs.has(p.data.slug) && want && page !== want) lost.push(`${p.data.slug}: its page prints "${page}", not "${want}"`);
    }
    check(`1. every project's date is printed short on its own page, and in the Index list in the row of every main project; a sub-project's row prints none (${published.length} projects, ${subs.size} of them sub-projects)`, wrong.length === 0, wrong.slice(0, 5).join('; '));
    const dated = published.filter(p => subs.has(p.data.slug) && text(p.data.years)).length;
    if (!dated) check('1+3. a sub-project\'s own page still prints its years: ok (no sub-project in content has years; the check was skipped)', true);
    else check(`1+3. a sub-project's own page still prints its years, though its row in the list prints none (${dated} sub-projects with years)`, lost.length === 0, lost.slice(0, 5).join('; '));
    // The rows of the sub-projects, and no others, are marked `child`; no row prints a bullet, which
    // the sub-projects' titles had until 20 Nov 2026, and nothing stands between a row's `.line` and its title.
    const marked = [...home.matchAll(/id="row-([^"]+)"\s+class="row([^"]*)"/g)].filter(m => /(^| )child( |$)/.test(m[2])).map(m => m[1]).sort();
    const list = home.match(/<section class="index"[\s\S]*?<\/section>/)?.[0] ?? '';
    const titled = list.match(/<span class="line"><a class="title"/g)?.length ?? 0;
    check(`1. in the Index's HTML the rows of the sub-projects, and no others, are marked as such, and no row prints a bullet: every title is the first thing in its column (${subs.size} sub-projects)`,
        JSON.stringify(marked) === JSON.stringify([...subs].sort()) && Boolean(list) && !/class="bullet"|•|&bull;|&#8226;|&#x2022;/i.test(list) && titled === published.length,
        `marked: ${marked.join(', ') || 'none'}; wanted: ${[...subs].sort().join(', ') || 'none'}; ${titled} of ${published.length} titles first in their column; a bullet: ${/class="bullet"|•|&bull;|&#8226;|&#x2022;/i.test(list)}`);
    // The row data that rides on the page: `listYears` is what the row prints, and `years` is still
    // there, the project's date as its own page prints it. Nothing in today's template reads `years`;
    // the template from before 20 Nov 2026 printed it, and a browser that still has that one in its
    // cache when the new page arrives printed an empty date in every row without it.
    const unescaped = (t) => t.replace(/&(amp|lt|gt|quot|#(\d+));/g, (_, e, n) => (n ? String.fromCodePoint(Number(n)) : { amp: '&', lt: '<', gt: '>', quot: '"' }[e]));
    let rowData = [];
    try { rowData = JSON.parse(unescaped(home.match(/<project-index projects="([^"]*)"/)?.[1] ?? '[]')); } catch { rowData = []; }
    const bare = published.map((p) => {
        const d = rowData.find(r => r.slug === p.data.slug);
        return d && d.listYears === listDate(p) && d.years === shortYears(text(p.data.years)) ? '' : `${p.data.slug}: ${JSON.stringify({ years: d?.years, listYears: d?.listYears })}`;
    }).filter(Boolean);
    check(`1. the row data on the home page has, for every project, the date its row prints (listYears; none for a sub-project) and still its years, which a template cached from before 20 Nov 2026 prints (${rowData.length} rows)`,
        rowData.length === published.length && bare.length === 0, bare.slice(0, 5).join('; '));
}

// Which projects are sub-projects (order() in server/content.js, on made-up projects): one level of
// nesting, decided from the parents as typed, whatever the order of the files. A project whose
// parent is missing, itself, or a sub-project is a main project; so is every one of two or three
// that name each other in a ring, and a project whose parent is one of those. (Until 20 Nov 2026
// the second of two that named each other became the first one's sub-project.)
{
    const listed = (...items) => order(items.map(([slug, parent], i) => ({ slug, title: slug, order: i + 1, parent: parent ?? null })), () => {})
        .map(p => (p.parent ? `${p.parent}/${p.slug}` : p.slug)).join(' ');
    const cases = [
        ['a main project and its sub-project', listed(['a'], ['b', 'a'], ['c']), 'a a/b c'],
        ['a sub-project that comes before its main project', listed(['b', 'a'], ['a'], ['c']), 'a a/b c'],
        ['a parent that does not exist', listed(['a', 'z'], ['b', 'a']), 'a a/b'],
        ['a project that is its own parent', listed(['a', 'a'], ['b', 'a']), 'a a/b'],
        ['a sub-project of a sub-project', listed(['a'], ['b', 'a'], ['c', 'b']), 'a a/b c'],
        ['two that name each other', listed(['a', 'b'], ['b', 'a']), 'a b'],
        ['two that name each other, the other way round', listed(['b', 'a'], ['a', 'b']), 'b a'],
        ['three in a ring', listed(['a', 'b'], ['b', 'c'], ['c', 'a']), 'a b c'],
        ['a project under one of two that name each other', listed(['a', 'b'], ['b', 'a'], ['c', 'a']), 'a b c'],
    ];
    const off = cases.filter(([, got, want]) => got !== want).map(([name, got, want]) => `${name}: "${got}", wanted "${want}"`);
    check(`1. a sub-project is a project whose parent is a published main project, and nothing else: a missing parent, a project that is its own, a sub-project's sub-project and projects that name each other in a ring all stand on their own (${cases.length} cases)`, off.length === 0, off.join('; '));
}

// The list's date column is as wide as the widest date a row prints: client/covers.css carries every
// distinct date as printed (`listYears`: none for a sub-project, whose row prints no date), a date
// to a line, in one CSS string (--dates on project-index), and every row prints it, unseen, in its
// date cell. The dates are text typed in the CMS: in the string, letters, digits,
// spaces and , . - stand as they are and everything else is a hex escape, so no date can end the
// string or the rule. A CSS string as written, back to its text (the escapes a browser writes too):
const cssText = (string) => string.slice(1, -1).replace(/\\(?:([0-9a-fA-F]{1,6})[ \t\n]?|([^]))/g, (_, hex, ch) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : ch));
const datesRule = (css) => css.split('\n').filter(line => line.startsWith('project-index{--dates:'));
// Made-up projects: a date with a double quote, a backslash and a line break in it; the same date
// with a space where the line break was (one line for the two: a line break prints as a space);
// one that would end a rule, a declaration or a style element; none; and an ordinary one.
const madeUp = [
    { slug: 'a', listYears: '’19 "x" \\ y\nz' }, { slug: 'b', listYears: '’19 "x" \\ y z' }, { slug: 'c', listYears: '}</style>;{' }, { slug: 'd', listYears: '' }, { slug: 'e', listYears: '’26' },
];
const madeUpDates = ['’19 "x" \\ y z', '}</style>;{', '’26'];
const madeUpCss = coversCss(madeUp, { TAG_COLOR: '#000' });
{
    const rules = datesRule(madeUpCss);
    const safe = /^project-index\{--dates:"(?:[A-Za-z0-9 ,.-]|\\[0-9a-f]{1,6} )*"\}$/;
    const back = rules.length === 1 ? cssText(rules[0].slice('project-index{--dates:'.length, -1)).split('\n') : [];
    check('6. the generated rule for the date column escapes what a date may hold: a double quote, a backslash and a line break (which prints as a space) leave one rule on one line, with nothing between its quotes but letters, digits, spaces, , . - and hex escapes, and it reads back as the dates',
        madeUpCss.trimEnd().split('\n').length === 2 && rules.length === 1 && safe.test(rules[0]) && JSON.stringify(back) === JSON.stringify(madeUpDates), `${JSON.stringify(madeUpCss)} reads back as ${JSON.stringify(back)}`);
    const none = datesRule(coversCss([{ slug: 'a', years: '’26', listYears: '' }], { TAG_COLOR: '#000' }));
    check('6. with no date at all in the list (the only project a sub-project, whose own page has years) the build writes no rule for the date column', none.length === 0, none.join(' '));
    // A date no row prints is not in the rule: a sub-project's years are on its own page only.
    const mixed = datesRule(coversCss([{ slug: 'a', years: '’23–26', listYears: '’23–26' }, { slug: 'b', years: '’25, 26', listYears: '' }, { slug: 'c', years: '’24', listYears: '’24' }], { TAG_COLOR: '#000' }));
    const kept = mixed.length === 1 ? cssText(mixed[0].slice('project-index{--dates:'.length, -1)).split('\n') : [];
    check('6. the generated rule for the date column holds the dates the rows print and no others: a sub-project\'s years, which only its own page prints, are not in it', JSON.stringify(kept) === JSON.stringify(['’23–26', '’24']), JSON.stringify(kept));
    // The built file: every date the list prints, once, in the list's order.
    const built = datesRule(readFileSync(join(dist, 'client/covers.css'), 'utf8'));
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    const unescape = (t) => t.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[e]));
    const printed = [...new Set([...home.matchAll(/<span class="years">([^<]*)<\/span>/g)].map(m => spaced(unescape(m[1]))).filter(Boolean))];
    const lines = built.length === 1 ? cssText(built[0].slice('project-index{--dates:'.length, -1)).split('\n') : [];
    // What the rows print, from the content: the main projects' dates in the list's order (the home page's rows give the order).
    const order = [...home.matchAll(/id="row-([^"]+)"/g)].map(m => m[1]);
    const wanted = [...new Set(order.map(slug => published.find(p => p.data.slug === slug)).filter(Boolean).map(p => spaced(listDate(p))).filter(Boolean))];
    check(`6. client/covers.css carries every date the list prints and no other (no sub-project's: its row prints none), each once, a date to a line (${printed.length} dates)`,
        built.length === 1 && safe.test(built[0]) && JSON.stringify(lines) === JSON.stringify(printed) && JSON.stringify(lines) === JSON.stringify(wanted), `${built[0]} against ${JSON.stringify(printed)} in the page and ${JSON.stringify(wanted)} from the content`);
}

// --- a static server for dist/, like GitHub Pages

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.otf': 'font/otf', '.json': 'application/json', '.txt': 'text/plain', '.ico': 'image/x-icon' };
const server = createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://x');
    let path = normalize(join(dist, decodeURIComponent(pathname)));
    if (!path.startsWith(dist)) { res.writeHead(403); return res.end(); }
    try { if (statSync(path).isDirectory()) path = join(path, 'index.html'); } catch { /* falls through */ }
    if (!path.startsWith(dist + sep) || !existsSync(path) || statSync(path).isDirectory()) {
        res.writeHead(404, { 'Content-Type': TYPES['.html'] });
        return res.end(readFileSync(join(dist, '404.html')));
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(readFileSync(path));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const routes = ['/', '/projects/', '/info/', '/collaborations/', '/404.html', ...published.map(p => `/projects/${p.data.slug}/`)];
// The Index's order: the projects as the home page's list has them, sub-items in their place.
const listed = [...(await (await fetch(`${base}/`)).text()).matchAll(/id="row-([^"]+)"/g)].map(m => m[1]);
// The project pages the slideshow checks use: the one whose first set has the most photos, one with a single photo, one with captions.
const many = [...published].sort((a, b) => firstSet(b).length - firstSet(a).length)[0];
const single = published.find(p => photos(p).length === 1);
const captioned = published.find(p => firstSet(p).length > 1 && firstSet(p).some(im => im.caption));
// A project with more than one set, if the content has one (rather one where a later set has
// photos to move through), and one with a single set of several photos.
const multis = published.filter(p => setsOf(p).length > 1);
const multi = multis.find(p => setsOf(p).slice(1).some(s => s.length > 1)) ?? multis[0];
const oneSet = [...published].filter(p => setsOf(p).length === 1).sort((a, b) => photos(b).length - photos(a).length)[0];
// The project with the most to read: its information is the tallest.
const longest = [...published].filter(p => photos(p).length).sort((a, b) => b.content.length - a.content.length)[0];
// A page's scripts load only if some set has a photo to move to.
const scripted = (p) => setsOf(p).some(s => s.length > 1);

// The page has come to rest: its scroll position has stopped changing (a snap, or a smooth scroll, is over).
const rest = async (page) => {
    let last = NaN;
    for (let i = 0, same = 0; i < 120; i++) {
        await page.waitForTimeout(50);
        const y = await page.evaluate(() => scrollY);
        if (y !== last) same = 0;
        else if (++same >= 3) break;
        last = y;
    }
    return last;
};
// Every slideshow of a project page has rendered (a page whose sets all hold one photo loads no slideshow script: nothing to wait for).
const slidesReady = (page) => page.waitForFunction(() => !document.querySelector('script[src$="/client/project.js"]') || [...document.querySelectorAll('project-slides')].every(el => el.rendered));
// A project page as it lies in the window: the header; each set with its current photo's box (`.frame`, a name from when it
// had a border), the slide that holds it, its chevrons and its caption; the information and its parts; the two words that
// lead to the neighbours.
const lie = (page) => page.evaluate(() => {
    const box = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
    const seen = (el) => Boolean(el) && el.getClientRects().length > 0;
    const part = (el) => (seen(el) ? box(el) : null);
    const type = (el) => { const s = getComputedStyle(el); return [s.fontSize, s.lineHeight, s.fontWeight].join(' / '); };
    // The element itself is what is at its middle: nothing lies over it.
    const onTop = (el) => { const b = el.getBoundingClientRect(); const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return Boolean(at) && (at === el || el.contains(at)); };
    const chevron = (el) => (seen(el) ? { ...box(el), drawing: box(el.querySelector('svg')), colour: getComputedStyle(el).color } : null);
    const word = (side) => {
        const a = document.querySelector(`#project-info .neighbours .${side}`);
        if (!a) return null;
        const s = getComputedStyle(a);
        const span = a.querySelector('span');
        return { ...box(a), word: box(span), text: a.textContent.trim(), href: a.getAttribute('href'), position: s.position, colour: s.color, underline: s.textDecorationLine, type: type(a), lean: span ? getComputedStyle(span).transform : '', inline: span ? getComputedStyle(span).display : '' };
    };
    const info = document.querySelector('#project-info');
    const all = [...document.querySelectorAll('project-slides')];
    return {
        y: scrollY,
        max: document.documentElement.scrollHeight - innerHeight,
        vw: document.documentElement.clientWidth,
        vh: innerHeight,
        iw: innerWidth,
        wide: document.documentElement.scrollWidth,
        mouse: matchMedia('(hover: hover) and (pointer: fine)').matches,
        snap: getComputedStyle(document.documentElement).scrollSnapType,
        head: box(document.querySelector('.project-head')),
        headOnTop: onTop(document.querySelector('.back a')) && onTop(document.querySelector('.project-head h1 a')),
        sets: all.map((el, n) => {
            const slides = [...el.querySelectorAll('.slide')];
            const shown = slides.filter(seen);
            const now = shown[0];
            const img = now?.querySelector('img');
            const caption = now?.querySelector('.caption');
            return {
                ...box(el),
                label: el.querySelector('.slides')?.getAttribute('aria-label') ?? '',
                count: slides.length,
                // The last of several sets: it has more room under it (client/project.css).
                last: all.length > 1 && n === all.length - 1,
                shown: shown.length,
                current: slides.indexOf(now),
                index: el.state?.index ?? 0,
                files: slides.map(sl => decodeURIComponent(sl.querySelector('img').getAttribute('src')).split('/').pop()),
                a: img ? Math.round((img.getAttribute('width') / img.getAttribute('height')) * 10000) / 10000 : null,
                slide: box(now),
                frame: box(now?.querySelector('.frame')),
                image: box(img),
                fit: img ? getComputedStyle(img).objectFit : '',
                sizes: [img?.getAttribute('sizes') ?? null, now?.querySelector('source')?.getAttribute('sizes') ?? null],
                border: now ? ['Top', 'Right', 'Bottom', 'Left'].map(k => getComputedStyle(now.querySelector('.frame'))[`border${k}Width`]).join(' ') : '',
                shadow: now ? getComputedStyle(now.querySelector('.frame')).boxShadow : '',
                prev: chevron(now?.querySelector('.prev')),
                next: chevron(now?.querySelector('.next')),
                caption: seen(caption) ? { ...box(caption), type: type(caption), colour: getComputedStyle(caption).color } : null,
            };
        }),
        info: box(info),
        position: info ? getComputedStyle(info).position : '',
        facts: part(info?.querySelector('.facts')),
        about: part(info?.querySelector('.about')),
        desc: part(info?.querySelector('.description')),
        first: part(info?.querySelector('.description p')),
        line: part(info?.querySelector('.facts p')),
        prev: word('prev'),
        next: word('next'),
    };
});
// The information at rest (client/project.css). From 900px it does not move: it stays under the header
// (its top at the header's 71px, its first lines 4px lower) while the sets scroll by on the left.
// Below 900px it comes to rest after the sets, 9px under a header of one line (95px), so that its first
// line is clear of a header whose title has wrapped onto a second line. Returns what is off, or ''.
const restAt = (at) => (at.vw >= WIDE ? 71 : 104);
const infoOff = (at) => {
    const off = [];
    if (Math.abs(at.info.top - restAt(at)) > 0.5) off.push(`the information's top at ${at.info.top}, not ${restAt(at)}`);
    if (at.vw >= WIDE && at.first && Math.abs(at.first.top - 75) > 0.5) off.push(`the description's first line at ${at.first.top}, not 75`);
    if (at.vw >= WIDE && at.line && Math.abs(at.line.top - 75) > 0.5) off.push(`the facts' first line at ${at.line.top}, not 75`);
    return off.join('; ');
};
// What the design gives the current photo of a set, and the row under it (components/project-slides.css).
// The photo is as large as fits its room (roomOf, photoWidth): the side that limits it is exactly on its
// limit. It has no border, its picture fills its box (stretched over it, `object-fit: fill`), the shadow
// lies directly around it, and its `sizes` says its width. It stands at the top of its set: from 900px
// with its right edge at the page's centre less half the 17px between the halves, below 900px in the
// middle of the page. Under it one row: the caption (12px under the photo from 900px, 14px below), and
// at either end of the row a chevron in a column of its own (36px from 900px, 26px below): from 900px the
// row is as wide as the photo, below 900px as the page less 24px on either side, so there the chevrons are
// at the page's edges whatever the photo. The chevron's drawing is 12.4 × 14.3 at the row's very end.
// A chevron is 44px tall, in the middle of the row's height, so its drawing is beside the middle of the
// caption. From 900px on a page that has "previous" in its corner it starts 8px under the photo and is as
// tall as the row (its drawing still beside the caption's middle), and beside a photo that reaches into
// that corner (within 59px of the half's left edge) it is 52.5px at most: its drawing is then no lower
// than beside a caption of three lines, however long the caption.
// A set is as tall as its photo and that row, and at least the window less the header below 900px. From
// 900px a set that is alone on its page ends where the row ends, so that nothing under the row makes the
// page longer than what is on it (the design's 20px under the row made a page scroll by 2px with all of it
// in the window); one of several sets ends 20px under its row, which is what parts it from the next (the
// last of them 52px more, on a page with "previous").
// Returns what is off, or ''.
const offDesign = (set, at) => {
    const d = pageOf(at.vw);
    const near = (a, b, by = 0.5) => Math.abs(a - b) <= by;
    const off = [];
    if (!set.frame) return 'no photo shown';
    const room = roomOf(at.vw, at.vh);
    const cornered = set.count > 1 && Boolean(at.prev);
    const width = photoWidth(set.a, at.vw, at.vh, cornered);
    const frame = { width, height: width / set.a };
    if (!near(set.frame.width, frame.width) || !near(set.frame.height, frame.height)) off.push(`photo ${set.frame.width}×${set.frame.height}, not ${frame.width}×${frame.height}`);
    const limits = [[set.frame.width, room.width], [set.frame.height, room.height], ...(d.wide && cornered ? [[set.frame.width, room.width - CLEAR], [set.frame.height, room.height - LOWER]] : [])];
    if (!limits.some(([side, limit]) => Math.abs(side - limit) <= EXACT)) off.push(`photo ${set.frame.width}×${set.frame.height} reaches none of its limits in ${room.width}×${room.height}`);
    if (set.frame.width > room.width + EXACT || set.frame.height > room.height + EXACT) off.push(`photo ${set.frame.width}×${set.frame.height} larger than ${room.width}×${room.height}`);
    if (set.border !== '0px 0px 0px 0px') off.push(`a border (${set.border})`);
    if (set.shadow !== SHADOW) off.push(`shadow ${set.shadow}`);
    if (!['left', 'top', 'width', 'height'].every(k => near(set.image[k], set.frame[k]))) off.push(`the picture (${set.image.width}×${set.image.height}) does not fill its box`);
    if (set.fit !== 'fill') off.push(`the picture is object-fit: ${set.fit}, which can leave a line of the ground between it and its shadow`);
    const [img, source] = set.sizes;
    if (img !== null || source !== null) {
        const px = slideSizesPx(img ?? '', at.iw, at.vh);
        if (source !== null && source !== img) off.push(`<source> says ${source}, <img> ${img}`);
        else if (!(Math.abs(px - set.frame.width) <= 1)) off.push(`sizes gives ${Number.isNaN(px) ? 'nothing this check can read' : `${Math.round(px * 100) / 100}px`}, the photo is ${Math.round(set.frame.width * 100) / 100}px wide (${img})`);
    }
    if (d.wide ? !near(set.frame.right, at.vw / 2 - d.between / 2) : !near(set.frame.left, (at.vw - frame.width) / 2)) off.push(`photo from ${set.frame.left} to ${set.frame.right} in a page ${at.vw} wide`);
    if (!near(set.frame.top, set.top)) off.push(`photo ${set.frame.top - set.top} under the set's top`);
    const row = d.wide ? { left: set.frame.left, right: set.frame.right } : { left: d.side, right: at.vw - d.side };
    if (!near(set.slide.left, row.left) || !near(set.slide.right, row.right)) off.push(`the row under the photo from ${set.slide.left} to ${set.slide.right}, not ${row.left} to ${row.right}`);
    if (!near(set.left, d.wide ? d.side : 0) || !near(set.width, d.wide ? room.width : at.vw)) off.push(`set from ${set.left}, ${set.width} wide`);
    const tall = Math.max(set.prev || set.next ? 52 : 0, set.caption ? set.caption.height + d.under + 8 : 0);
    if (set.caption) {
        if (!near(set.caption.top - set.frame.bottom, d.under)) off.push(`caption ${set.caption.top - set.frame.bottom} under the photo, not ${d.under}`);
        if (!near(set.caption.left, row.left + d.chevron) || !near(set.caption.right, row.right - d.chevron)) off.push(`caption from ${set.caption.left} to ${set.caption.right}, not between the chevrons' columns (${row.left + d.chevron} to ${row.right - d.chevron})`);
        if (set.caption.type !== d.caption) off.push(`caption ${set.caption.type}`);
    }
    if (set.count > 1 && !set.prev && !set.next) off.push('no chevron');
    for (const arrow of [set.prev, set.next]) {
        if (!arrow) continue;
        const name = arrow === set.prev ? 'left' : 'right';
        if (!near(arrow.width, d.chevron) || (arrow === set.prev ? !near(arrow.left, row.left) : !near(arrow.right, row.right))) off.push(`${name} chevron from ${arrow.left} to ${arrow.right}, not at the row's end`);
        // A chevron is 44px tall in the middle of the row's height. From 900px on a page with "previous" it is as tall as the row
        // instead (its drawing in the same place), and beside a photo that comes within 59px of the half's left edge 52.5px at most.
        const most = room.width - set.frame.width < 59 ? 52.5 : Infinity;
        const want = d.wide && at.prev ? { top: set.frame.bottom + 8, height: Math.min(most, Math.max(44, tall - 8)) } : { top: set.frame.bottom + (tall - 52) / 2 + 8, height: 44 };
        if (!near(arrow.top, want.top) || !near(arrow.height, want.height)) off.push(`${name} chevron ${arrow.top - set.frame.bottom} under the photo and ${arrow.height} tall, not ${want.top - set.frame.bottom} and ${want.height}`);
        const g = arrow.drawing;
        if (!near(g.width, 12.4, 0.05) || !near(g.height, 14.3, 0.05) || (arrow === set.prev ? !near(g.left, arrow.left, 0.05) : !near(g.right, arrow.right, 0.05)) || !near(g.top + g.height / 2, arrow.top + arrow.height / 2, 0.05)) off.push(`${name} chevron's drawing ${g.width}×${g.height} at ${g.left - arrow.left}, ${g.top - arrow.top} in its column`);
        if (arrow.colour !== 'rgb(153, 86, 122)') off.push(`${name} chevron ${arrow.colour}`);
    }
    const height = d.wide ? frame.height + tall + (at.sets.length === 1 ? 0 : 20) + (set.last && at.prev ? 52 : 0) : Math.max(at.vh - d.head, frame.height + tall);
    if (!near(set.height, height)) off.push(`set ${set.height} tall, not ${height}`);
    return off.join('; ');
};
// Nothing of a set's current photo, its caption and its chevrons lies over another of them or outside the page,
// and the row under the photo ends before whatever follows the set. Returns what is off, or ''.
const overlapping = (set, at) => {
    const off = [];
    const over = (a, b) => a && b && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
    const parts = [['photo', set.frame], ['caption', set.caption], ['left chevron', set.prev], ['right chevron', set.next]].filter(([, b]) => b);
    for (let i = 0; i < parts.length; i++) for (let k = i + 1; k < parts.length; k++) if (over(parts[i][1], parts[k][1])) off.push(`the ${parts[i][0]} and the ${parts[k][0]} overlap`);
    for (const [name, b] of parts) {
        if (b.left < -0.5 || b.right > at.vw + 0.5) off.push(`the ${name} reaches outside the page (${b.left} to ${b.right})`);
        if (b.bottom > set.bottom + 0.5 || b.top < set.top - 0.5) off.push(`the ${name} reaches outside its set`);
    }
    return off.join('; ');
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
    // 1. HTML before JS
    {
        const index = await (await fetch(`${base}/`)).text();
        const missingRows = published.filter(p => !index.includes(`id="row-${p.data.slug}"`) || !index.includes(`id="cell-${p.data.slug}"`));
        check('1. index HTML has every published project as a row and a cell', missingRows.length === 0, missingRows.map(p => p.data.slug).join(', '));
        // The intro is one field of several lines. Every line that is not empty is a line of Markdown and
        // one <span class="l"> of the header's one paragraph, in the field's order, a space between two
        // of them; a link typed in a line is a link in its span, to the address typed. At both addresses
        // of the home page. The lines are the field's own, however many: one is one part, and with the
        // field left empty the header has no paragraph at all (the template leaves it out).
        const introOff = [];
        const homeBodies = {};
        for (const path of HOME_ROUTES) homeBodies[path] = path === '/' ? index : await (await fetch(base + path)).text();
        for (const path of HOME_ROUTES) {
            const body = homeBodies[path];
            const header = body.match(/<header class="site-head">([\s\S]*?)<\/header>/)?.[1];
            if (header === undefined) { introOff.push(`${path}: no header`); continue; }
            if (!homeIntro.length) {
                if (/<p[\s>]/.test(header)) introOff.push(`${path}: the header has a paragraph though the intro is empty`);
                continue;
            }
            const para = header.match(/<p>([\s\S]*?)<\/p>\s*$/)?.[1] ?? '';
            const parts = /^<span class="l">[\s\S]*<\/span>$/.test(para) ? para.slice('<span class="l">'.length, -'</span>'.length).split('</span> <span class="l">') : [];
            if (parts.length !== homeIntro.length || homeParts.length !== homeIntro.length) { introOff.push(`${path}: ${parts.length} parts on the page, ${homeParts.length} from the data layer, for ${homeIntro.length} lines`); continue; }
            homeIntro.forEach((line, i) => {
                // The part is what the site's Markdown makes of the line, to the letter (whatever the line holds:
                // a bare address is a link too). And by the checks' own reading of the line: it reads as the
                // line's words, and every link typed as [words](address) is a link to that address, in the
                // order typed.
                const hrefs = homePartLinks(parts[i]);
                const typed = homeLinks(line).map(html);
                let found = 0;
                for (const href of hrefs) if (href === typed[found]) found++;
                if (parts[i] !== homeParts[i]) introOff.push(`${path}: part ${i + 1} is ${parts[i]}, not ${homeParts[i]}`);
                if (textOf(parts[i]) !== html(words(line))) introOff.push(`${path}: part ${i + 1} reads "${textOf(parts[i])}", not "${html(words(line))}"`);
                if (found !== typed.length) introOff.push(`${path}: part ${i + 1} links to ${hrefs.join(', ') || 'nothing'}; typed, in this order: ${typed.join(', ')}`);
            });
        }
        check(`1. index HTML has the intro: every line of the field a part of its own, in order, with its links (${homeIntro.length} lines, ${homeParts.flatMap(homePartLinks).length} links${homeIntro.length ? '' : ': the field is empty and the header has no paragraph'}; / and /projects/)`,
            introOff.length === 0, introOff.slice(0, 4).join('; '));
        // The meta description is the site's own description field, as plain text; the intro's words when that is
        // empty; and with both empty the page has no such tag (shared/pages/base.html prints it only for a text).
        const described = text(homeFront.description).replace(/\s+/g, ' ') || words(homeIntro.join(' '));
        const metaOff = HOME_ROUTES.filter(path => (described ? !homeBodies[path].includes(`<meta name="description" content="${html(described)}">`) : /<meta\s+name="description"/.test(homeBodies[path])));
        check(`1. the home page's meta description is the description field of content/site/index.md${described ? '' : ', and there is no such tag, the field and the intro being empty'} (/ and /projects/)`, metaOff.length === 0, `${described}${metaOff.length ? `; not so at ${metaOff.join(', ')}` : ''}`);
        // How the field is read (homeText in server/content.js), on made-up text: Windows line ends, lines
        // that are empty or blank, white space round a line; a description of its own, and none.
        {
            const made = homeText({ intro: '  one [two](/three/).  \r\n\r\n   \nfour *five*\n', description: '' });
            const own = homeText({ intro: 'one\ntwo', description: ' six\n seven ' });
            const none = homeText({});
            check('1. the intro field is read a line at a time: empty lines dropped, each line one line of Markdown; the description is its own field, and the intro\'s words when it is empty',
                JSON.stringify(made.intro) === JSON.stringify(['one <a href="/three/">two</a>.', 'four <em><span>five</span></em>']) && made.description === 'one two. four five'
                && own.description === 'six seven' && JSON.stringify(own.intro) === JSON.stringify(['one', 'two'])
                && JSON.stringify(none) === JSON.stringify({ intro: [], description: '' }), JSON.stringify([made, own, none]));
        }
        // The owner's answer of 26 Nov 2026: the intro is set in Fluxisch Else until there is a licence for
        // Schwabacher Grotesk. No stylesheet of the built site names another family for it, and no such font file is built.
        {
            const sheets = ['client/site.css', 'components/project-index.css'].map(f => readFileSync(join(dist, f), 'utf8')).join('\n');
            const families = [...new Set([...sheets.matchAll(/font-family:\s*([^;}]+)/g)].map(m => m[1].trim()))];
            const fontFiles = readdirSync(join(dist, 'fonts'));
            const strange = fontFiles.filter(f => !/^FluxischElse-(Light|Bold)\.(woff2|otf)$/.test(f));
            check('1. the home page\'s stylesheets name no font family but Fluxisch Else (and the system fallbacks), and the built site has no font file but Fluxisch Else Light and Bold',
                families.length > 0 && families.every(f => /^("Fluxisch Else"(, Helvetica, Arial, sans-serif)?|inherit)$/.test(f)) && !/schwabacher|katsu/i.test(sheets) && strange.length === 0,
                `${families.join(' | ')}; fonts: ${fontFiles.join(', ')}`);
        }
        check('1. the home page\'s tab title is the name alone', index.includes('<title>Tolomeo</title>'));
        const unpublished = fronts.filter(f => f.data.published !== true && index.includes(`id="row-${f.data.slug}"`));
        check('1. unpublished projects are absent', unpublished.length === 0, unpublished.map(f => f.data.slug).join(', '));
        let pageMisses = [];
        let photoMisses = [];
        const infoMisses = [];
        const scriptMisses = [];
        const arrowMisses = [];
        const titleOf = Object.fromEntries(published.map(p => [p.data.slug, text(p.data.title)]));
        for (const p of published) {
            const res = await fetch(`${base}/projects/${p.data.slug}/`);
            const firstWords = opening(p.content);
            const body = await res.text();
            // The information: the lines of the facts are the project's own and no others (type, role, for,
            // the years, then its details, block by block); the description is there only if there is one;
            // and the section prints nothing else but the two words that lead to its neighbours (no row,
            // no heading: the title is in the page header only). A client, a tag or a photo link may
            // well hold the title's words, so this looks for text outside the parts, not for the title.
            const section = sectionOf(body);
            const lines = linesOf(section);
            const want = factsOf(p).map(html);
            const others = section.replace(/<div class="description">[\s\S]*?<\/div>/, '').replace(/<ul class="links">[\s\S]*?<\/ul>/, '').replace(factsHtml(section), '').replace(/<nav class="neighbours"[\s\S]*?<\/nav>/, '');
            const wrong = [];
            if (lines.join(' | ') !== want.join(' | ')) wrong.push(`lines "${lines.join(' | ')}", not "${want.join(' | ')}"`);
            if (JSON.stringify(blocksOf(section)) !== JSON.stringify(detailsOf(p).map(block => block.map(html)))) wrong.push(`details in blocks of ${blocksOf(section).map(b => b.length).join(' + ') || 0} lines, not ${detailsOf(p).map(b => b.length).join(' + ') || 0}`);
            if (/<div class="description">/.test(section) !== Boolean(p.content.trim())) wrong.push('description');
            if (textOf(others).trim() || /<h\d|class="(row|title)"/.test(others)) wrong.push(`the section prints more than its lines, its description, its photo links and the links to its neighbours: "${textOf(others).trim().slice(0, 40)}"`);
            if (wrong.length) infoMisses.push(`${p.data.slug}: ${wrong.join(', ')}`);
            // A page with a photo loads client/zoom.js, which opens a photo on a double click; a page
            // without one loads no script at all. The slideshow's own scripts only where a set has a photo to move to.
            const loads = [...body.matchAll(/<script[^>]*\ssrc="([^"]*)"/g)].map(m => m[1].split('/').pop());
            const wantLoads = [...(photos(p).length ? ['zoom.js'] : []), ...(scripted(p) ? ['nunjucks.min.js', 'idiomorph.min.js', 'project.js'] : [])];
            if (loads.join() !== wantLoads.join()) scriptMisses.push(`${p.data.slug}: ${loads.join(', ') || 'none'}, not ${wantLoads.join(', ') || 'none'}`);
            // The arrows: to the project before and the one after in the home page's list, none at either end.
            const at = listed.indexOf(p.data.slug);
            for (const [side, word, to] of [['prev', 'Previous', listed[at - 1]], ['next', 'Next', listed[at + 1]]]) {
                const arrow = arrowOf(section, side);
                const wanted = at >= 0 && to ? { href: `/projects/${to}/`, name: `${word} project: ${html(titleOf[to])}`, word: `<span>${word.toLowerCase()}</span>` } : null;
                if (JSON.stringify(arrow) !== JSON.stringify(wanted)) arrowMisses.push(`${p.data.slug} ${side}: ${arrow ? `${arrow.href} "${arrow.name}"` : 'none'}, not ${wanted ? `${wanted.href} "${wanted.name}"` : 'none'}`);
            }
            if (res.status !== 200 || !body.includes(`<h1><a href="#project-info">${html(p.data.title)}</a></h1>`) || !body.includes('id="project-info"') || (firstWords && !textOf(body).includes(firstWords))) pageMisses.push(p.data.slug);
            const shown = body.match(/<li class="slide[ "]/g)?.length ?? 0;
            const captions = photos(p).filter(im => im.caption && !textOf(body).includes(html(words(im.caption))));
            // One slideshow per set, in set order, each with its set's photos.
            const perSet = (body.match(/<project-slides\b[\s\S]*?<\/project-slides>/g) ?? []).map(el => el.match(/<li class="slide[ "]/g)?.length ?? 0);
            const wantSets = setsOf(p).map(set => set.length);
            if (shown !== photos(p).length || captions.length || perSet.join() !== wantSets.join()) photoMisses.push(`${p.data.slug} (${shown}/${photos(p).length} photos, ${captions.length} captions missing, sets of ${perSet.join('+') || 0} not ${wantSets.join('+') || 0})`);
        }
        check('1+3. every project page answers 200 with its title and description in the HTML', pageMisses.length === 0, pageMisses.join(', '));
        check('1+3. every project page has every photo and caption in the HTML, one slideshow per set', photoMisses.length === 0, photoMisses.join(', '));
        check(`3. every project's information prints its own type, role, client and years and its details, each on a line and none for what is empty, the details in their blocks, its description if it has one, and nothing else but the links to its neighbours: not its title (${published.filter(p => detailsOf(p).length).length} project${published.filter(p => detailsOf(p).length).length === 1 ? '' : 's'} with details)`, infoMisses.length === 0, infoMisses.slice(0, 4).join('; '));
        check(`3. every project page's two words lead to the project before and the one after in the Index's order, "previous" and "next" in the HTML and each named after the project it opens, with none before the first or after the last (${listed.length} projects)`, listed.length === published.length && arrowMisses.length === 0, arrowMisses.slice(0, 4).join('; '));
        check(`3. every project page with a photo loads client/zoom.js, a page whose sets hold a photo to move to the slideshow's scripts as well, and a page without photos no script (${published.filter(p => photos(p).length).length} pages with photos, ${published.filter(scripted).length} with a slideshow to move)`, scriptMisses.length === 0, scriptMisses.slice(0, 4).join('; '));

        // The page template with each field emptied in turn (the content need not have such a project).
        {
            const site = createEnvironment(nunjucks, { templates: [root], components: join(root, 'components') });
            const full = { slug: 'x', title: 'A title', href: '/projects/x/', years: '2020', tags: ['one', 'two'], role: 'maker', client: 'someone', details: '', body: '<p>Words.</p>', sets: [], scripted: false, photoLinks: [], prevHref: '/projects/w/', prevTitle: 'Before', nextHref: '/projects/y/', nextTitle: 'After' };
            const more = '<div class="extra">\n<p>A line</p>\n<p>Another</p>\n</div>';
            const render = (over) => sectionOf(site.render('shared/pages/project.html', { pageTitle: full.title, project: { ...full, ...over } }));
            const all = ['type: one, two', 'role: maker', 'for: someone', '2020'];
            const wrong = [];
            const expect = (name, over, lines, has = {}) => {
                const section = render(over);
                const got = linesOf(section);
                const parts = { facts: lines.length > 0, extra: false, about: true, description: true, links: false, neighbours: true, prev: true, next: true, ...has };
                if (got.join(' | ') !== lines.join(' | ')) wrong.push(`${name}: lines "${got.join(' | ')}"`);
                if (/<p[^>]*>\s*<\/p>|<span class="label">[^<]*<\/span>\s*<\/p>|<div class="extra">\s*<\/div>/.test(section)) wrong.push(`${name}: an empty line, an empty block or a label with nothing after it`);
                for (const [part, there] of Object.entries(parts)) if (new RegExp(`class="${part}"`).test(section) !== there) wrong.push(`${name}: ${part} ${there ? 'missing' : 'printed'}`);
            };
            expect('everything filled in', {}, all);
            expect('no tags', { tags: [] }, all.filter(l => !l.startsWith('type')));
            expect('no role', { role: '' }, all.filter(l => !l.startsWith('role')));
            expect('no client', { client: '' }, all.filter(l => !l.startsWith('for')));
            expect('no years', { years: '' }, all.slice(0, 3));
            expect('years only', { tags: [], role: '', client: '' }, ['2020']);
            expect('details', { details: more }, [...all, 'A line', 'Another'], { extra: true });
            expect('details only', { tags: [], role: '', client: '', years: '', details: more }, ['A line', 'Another'], { extra: true });
            expect('no description', { body: '' }, all, { about: false, description: false });
            expect('nothing at all', { tags: [], role: '', client: '', years: '', body: '' }, [], { about: false, description: false });
            expect('photo links and no description', { body: '', photoLinks: [{ label: 'Photos', url: 'https://example.com/' }] }, all, { description: false, links: true });
            expect('the first project', { prevHref: '', prevTitle: '' }, all, { prev: false });
            expect('the last project', { nextHref: '', nextTitle: '' }, all, { next: false });
            expect('the only project', { prevHref: '', prevTitle: '', nextHref: '', nextTitle: '' }, all, { neighbours: false, prev: false, next: false });
            check('3. the information leaves out what is empty: no line or label for missing tags, role, client or years, no block without details, no column for a missing description (the photo links alone if there are any), no word where there is no neighbour (the page template, each field emptied in turn)', wrong.length === 0, wrong.slice(0, 4).join('; '));
        }
        // "More details", from the text as typed to what the page prints (server/markdown.js, server/content.js): an empty
        // line ends a block; every other line is a line of its own; a line is one line of Markdown (a link, bold, slanted
        // words); the mark of a list line is dropped; raw HTML comes out escaped; nothing typed prints nothing.
        {
            const lines = (typed) => markdownLines(typed);
            const table = [
                ['one line', 'A line', [['A line']]],
                ['two lines are two lines, not one paragraph', 'First\nSecond', [['First', 'Second']]],
                ['an empty line starts a new block', 'First\n\nSecond\nThird', [['First'], ['Second', 'Third']]],
                ['several empty lines, and lines of spaces, are one break', 'First\n\n  \n\t\nSecond', [['First'], ['Second']]],
                ['empty lines at either end make no block', '\n\nFirst\n\n', [['First']]],
                ['Windows line ends', 'First\r\nSecond\r\n\r\nThird', [['First', 'Second'], ['Third']]],
                ['a link', '[KIOSK](https://kioskrotterdam.com/)', [['<a href="https://kioskrotterdam.com/">KIOSK</a>']]],
                ['bold', '**stockists:**', [['<strong>stockists:</strong>']]],
                ['slanted words', 'In *The Title*', [['In <em><span>The</span> <span>Title</span></em>']]],
                ['the mark of a list line is dropped', '- one\n* two\n  - three', [['one', 'two', 'three']]],
                ['a line that only looks like a list line is kept', '-5 degrees\n*slanted*', [['-5 degrees', '<em><span>slanted</span></em>']]],
                ['raw HTML is escaped', 'A <b>bold</b> <script>alert(1)</script> line', [['A &lt;b&gt;bold&lt;/b&gt; &lt;script&gt;alert(1)&lt;/script&gt; line']]],
                ['an ampersand and a quote are escaped', 'Fish & "chips"', [['Fish &amp; &quot;chips&quot;']]],
                ['a link that is not a web, mail or site address prints its words only', '[x](javascript:alert(1))', [['x']]],
                ['nothing typed', '', []],
                ['only white space', '  \n\n ', []],
            ];
            const off = table.filter(([, typed, want]) => JSON.stringify(lines(typed)) !== JSON.stringify(want)).map(([name, typed]) => `${name}: ${JSON.stringify(lines(typed))}`);
            const none = [undefined, null, 5, {}].filter(v => lines(v).length).length;
            check(`3. "More details": every line typed is a line, an empty line starts a new block, a line takes a link, bold and slanted words, the mark of a list line is dropped, raw HTML is escaped, and nothing typed gives nothing (${table.length} cases)`, off.length === 0 && none === 0, off.slice(0, 3).join('; ') || `${none} values that are no text gave lines`);
            // On the page each block is a <div class="extra"> of <p>s, in the facts, after the years.
            const withDetails = published.filter(p => detailsOf(p).length);
            const placed = withDetails.filter((p) => {
                const facts = factsHtml(sectionOf(readFileSync(join(dist, 'projects', p.data.slug, 'index.html'), 'utf8')));
                const years = facts.indexOf('<p class="years">');
                const first = facts.indexOf('<div class="extra">');
                const inside = [...facts.matchAll(/<div class="extra">([\s\S]*?)<\/div>/g)].map(m => m[1]);
                return !(first > 0 && (years < 0 || years < first) && inside.every(block => !/<(?!\/?(?:p|a|strong|em|span)\b)/.test(block)));
            }).map(p => p.data.slug);
            if (!withDetails.length) check('3. a project\'s details on its page: ok (no project in content has details; the check was skipped)', true);
            else check(`3. a project's details are in its facts, after the years, each block a group of lines and nothing in them but lines, links, bold and slanted words (${withDetails.map(p => p.data.slug).join(', ')})`, placed.length === 0, placed.join(', '));
        }
        // The pages of text with one picture, About and Collaborations: each answers at its address with its own
        // words and no others. The tab title and the header's title are the page's; the text is every paragraph
        // of its content file, as the site's renderer prints it; the picture is the one the content names, with
        // the description the content gives it (none is written for it anywhere else: an empty one stays empty);
        // the caption and the footnote are there only if the content has them; the description for search
        // engines is the site's, as on the home page.
        {
            const home = await (await fetch(`${base}/`)).text();
            const about = home.match(/<meta name="description" content="([^"]*)">/)?.[1] ?? '';
            const wrong = [];
            const loads = [];
            const files = [];
            const rules = [];
            let pictured = 0;
            for (const s of sheetFronts) {
                const res = await fetch(`${base}/${s.name}/`);
                const body = await res.text();
                const want = sheetWants(s);
                const main = body.match(/<main class="sheet">([\s\S]*?)<\/main>/)?.[1] ?? '';
                const part = (re) => main.match(re)?.[1] ?? null;
                const off = [];
                if (res.status !== 200) off.push(`answers ${res.status}`);
                if (!body.includes(`<title>Tolomeo — ${html(want.title)}</title>`)) off.push(`tab title ${body.match(/<title>[^<]*<\/title>/)?.[0]}`);
                if (!/<header class="project-head">\s*<p class="back"><a href="\/">back<\/a><\/p>\s*<h1>([^<]*)<\/h1>\s*<\/header>/.test(body) || body.match(/<h1>([^<]*)<\/h1>/)?.[1] !== html(want.title)) off.push(`the header is not back and the title "${want.title}", unlinked`);
                if (!about || body.match(/<meta name="description" content="([^"]*)">/)?.[1] !== about) off.push(`its description is not the site's ("${about}")`);
                if (body.match(/<link rel="canonical" href="([^"]*)">/)?.[1] !== `${siteConfig.SITE_URL}/${s.name}/`) off.push(`canonical ${body.match(/<link rel="canonical" href="([^"]*)">/)?.[1]}`);
                // The text: the content's paragraphs, each one typed, in the renderer's HTML.
                const typed = s.content.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean).length;
                const printed = part(/<div class="text">\s*([\s\S]*?)\s*<\/div>/);
                if ((printed ?? '') !== want.body || (printed?.match(/<p>/g)?.length ?? 0) !== typed || Boolean(printed) !== Boolean(typed)) off.push(`the text is ${printed?.match(/<p>/g)?.length ?? 0} paragraphs for ${typed} typed, or not the renderer's`);
                // The picture, its description, its caption.
                const img = main.match(/<img\b[^>]*>/)?.[0] ?? '';
                const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? null;
                if (Boolean(img) !== Boolean(want.image)) off.push(want.image ? 'no picture' : 'a picture the content does not have');
                if (img) {
                    pictured++;
                    const src = decodeURIComponent(attr(img, 'src') ?? '');
                    if (!src.startsWith(`/images/${want.image.replace(/\.[^.]+$/, '')}.`)) off.push(`the picture is ${src}, the content's ${want.image}`);
                    if (attr(img, 'alt') !== html(want.alt)) off.push(`the picture's description is "${attr(img, 'alt')}", the content's "${want.alt}"`);
                    if (!/<figure id="figure-[a-z]+">\s*<picture data-zoom>/.test(main)) off.push('the picture is not in a figure with an id, marked data-zoom');
                    const source = main.match(/<source\b[^>]*>/)?.[0] ?? '';
                    // Its proportions: the original's own size is in `width` and `height`, and client/figures.css has them as --a, by the figure's id.
                    const meta = await sharp(join(root, 'images', want.image)).metadata();
                    const [w, h] = (meta.orientation ?? 1) >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
                    // Every file the HTML offers is there, as wide as the HTML says, and has the original's proportions: its height is the
                    // nearest whole number of pixels, so the stretch over the picture's box (object-fit: fill) is half a pixel of the file at most.
                    for (const [url, said] of [[attr(img, 'src'), ''], ...[attr(img, 'srcset'), attr(source, 'srcset')].flatMap(set => (set ?? '').split(',').map(c => c.trim().split(/\s+/)).filter(c => c[0]))]) {
                        const file = join(dist, decodeURIComponent(url));
                        if (!existsSync(file)) { files.push(`${s.name}: ${url} is not in dist/`); continue; }
                        const built = await sharp(file).metadata();
                        if ((said && `${built.width}w` !== said) || Math.abs(built.height - (built.width * h) / w) > 0.5) files.push(`${s.name}: ${url} is ${built.width} × ${built.height}${said ? `, offered as ${said}` : ''}; the original is ${w} × ${h}`);
                    }
                    if (Number(attr(img, 'width')) !== w || Number(attr(img, 'height')) !== h) rules.push(`${s.name}: width and height ${attr(img, 'width')} × ${attr(img, 'height')}, the original is ${w} × ${h}`);
                    const rule = `#figure-${s.name}{--a:${Math.round((w / h) * 10000) / 10000}}`;
                    if (!readFileSync(join(dist, 'client/figures.css'), 'utf8').split('\n').includes(rule)) rules.push(`${s.name}: client/figures.css lacks ${rule}`);
                }
                const caption = part(/<figcaption>([\s\S]*?)<\/figcaption>/);
                if ((caption ?? '') !== want.caption) off.push(`the caption is "${textOf(caption ?? '')}", not "${textOf(want.caption)}"`);
                // The footnote: one paragraph for each one typed, with the words typed, the mark each starts with included.
                const notes = [...(part(/<div class="note">([\s\S]*?)<\/div>/) ?? '').matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => textOf(m[1]).trim());
                if (notes.join(' | ') !== want.notes.map(html).join(' | ') || notes.some((n, i) => !n.startsWith(html(want.typedNotes[i][0])))) off.push(`the footnote is "${notes.join(' | ').slice(0, 60)}", not "${want.notes.join(' | ').slice(0, 60)}"`);
                // And nothing else: the page's words are the title, the word back, the text, the caption and the footnote.
                const all = textOf(body.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '').trim();
                const said = ['back', html(want.title), textOf(want.body).trim(), textOf(want.caption).trim(), want.notes.map(html).join(' ')].filter(Boolean).join(' ');
                if (all !== said) off.push(`the page says more, or less, than its content: "${all.slice(0, 80)}…"`);
                if (/\sstyle="/.test(body)) off.push('an inline style');
                if (off.length) wrong.push(`/${s.name}/: ${off.join('; ')}`);
                // What it loads: the site's stylesheet and its own, never the project pages'; client/zoom.js if it has a picture, and no other script.
                const sheets = [...body.matchAll(/<link rel="stylesheet" href="([^"]*)">/g)].map(m => m[1]);
                const scripts = [...body.matchAll(/<script[^>]*\ssrc="([^"]*)"/g)].map(m => m[1]);
                const wantScripts = want.image ? ['/client/zoom.js'] : [];
                if (!sheets.includes('/client/site.css') || !sheets.includes('/client/sheet.css') || sheets.includes('/client/figures.css') !== Boolean(want.image) || sheets.some(href => /project|slides/.test(href)) || scripts.join() !== wantScripts.join() || (want.image && !/<script type="module" src="\/client\/zoom\.js"><\/script>/.test(body)) || /<script(?![^>]*\ssrc=)/.test(body)) loads.push(`/${s.name}/: stylesheets ${sheets.join(', ')}; scripts ${scripts.join(', ') || 'none'}`);
            }
            check(`1+3. the About and Collaborations pages answer with their own words and no others: the tab title and the header's title (not a link), every paragraph of the text, the picture the content names with the description the content gives it and no other, the caption and the footnote where the content has them; their description for search engines is the home page's, and each names its own address as the canonical one (${sheetFronts.map(s => `/${s.name}/`).join(', ')})`, wrong.length === 0, wrong.join(' | '));
            check('3. the About and Collaborations pages load the site\'s stylesheet and client/sheet.css, not the project pages\' stylesheets; with a picture also client/figures.css and client/zoom.js, as a module, and no other script', loads.length === 0, loads.join(' | '));
            check(`3. the picture of the About and of the Collaborations page: every file its HTML offers is in dist/, as wide as the HTML says and in the original's proportions to within half a pixel; its width and height are the original's, and client/figures.css gives its proportions by the figure's id, never an inline style (${pictured} pictures)`, files.length === 0 && rules.length === 0, [...files, ...rules].slice(0, 4).join(' | '));
            const css = readFileSync(join(dist, 'client/figures.css'), 'utf8');
            check('3. client/figures.css holds one rule for each page of text that has a picture and nothing else', css.split('\n').filter(Boolean).length === pictured && css.split('\n').filter(Boolean).every(line => /^#figure-[a-z]+\{--a:\d+(\.\d+)?\}$/.test(line)), JSON.stringify(css));
        }
        // The data layer on made-up pages (sheet() and figuresCss() in server/content.js): every field is defaulted,
        // because the CMS drops an empty one; the mark a footnote starts with stays (read as a block of Markdown, "* By …"
        // would be a list item and lose it), and so does a lone asterisk in the text; an empty line starts a second
        // footnote; a caption is the picture's and is not printed without one; the picture may be named by its public
        // path, its path under images/, or its bare file name in the page's own folder; one that is not there is left
        // out, with a warning; one whose size the build could not read gets no proportions.
        {
            const known = { src: '/images/x/a.jpg', type: 'raster', width: 900, height: 600, variants: [{ width: 600, jpg: '/images/x/a.1.600.jpg', webp: '/images/x/a.1.600.webp' }, { width: 900, jpg: '/images/x/a.1.900.jpg', webp: '/images/x/a.1.900.webp' }] };
            const images = new Map([['x/a.jpg', known], ['x/b c.jpg', known], ['x/drawing.svg', { src: '/images/x/drawing.svg', type: 'copy', width: null, height: null, variants: [] }]]);
            const warned = [];
            const made = (data, content = '') => shapeSheet({ name: 'x', title: 'A page' }, { data, content }, { images, warn: w => warned.push(w) });
            const off = [];
            const same = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) off.push(`${name}: ${JSON.stringify(got)}`); };
            same('nothing filled in', made({}), { name: 'x', href: '/x/', title: 'A page', body: '', id: 'figure-x', picture: null, caption: '', note: '' });
            same('nothing filled in, said by null', made({ title: null, image: null, alt: null, caption: null, note: null }, undefined), { name: 'x', href: '/x/', title: 'A page', body: '', id: 'figure-x', picture: null, caption: '', note: '' });
            same('its own title', made({ title: 'Its own' }).title, 'Its own');
            same('a lone asterisk in the text stays', made({}, 'a decolonial* foundation\n\nSecond.').body, '<p>a decolonial* foundation</p>\n<p>Second.</p>');
            same('a footnote keeps its mark', made({ note: '* By ‘this’, I mean that.' }).note, '<p>* By ‘this’, I mean that.</p>');
            same('two footnotes, the first on two lines', made({ note: '* One note\non two lines.\n\n** A second.' }).note, '<p>* One note on two lines.</p>\n<p>** A second.</p>');
            same('Windows line ends, lines of spaces', made({ note: '* One\r\n \r\n\r\n† Two' }).note, '<p>* One</p>\n<p>† Two</p>');
            same('a footnote takes a link and slanted words', made({ note: '* See [this](https://example.org/) and *That*' }).note, '<p>* See <a href="https://example.org/">this</a> and <em><span>That</span></em></p>');
            same('raw HTML in a footnote is escaped', made({ note: '* <b>x</b>' }).note, '<p>* &lt;b&gt;x&lt;/b&gt;</p>');
            same('a caption without a picture is not printed', made({ caption: 'A caption' }).caption, '');
            const full = made({ image: '/images/x/a.jpg', alt: 'What it shows', caption: 'A *Title*' });
            same('a picture', full.picture, { src: '/images/x/a.1.900.jpg', srcset: '/images/x/a.1.600.jpg 600w, /images/x/a.1.900.jpg 900w', webp: '/images/x/a.1.600.webp 600w, /images/x/a.1.900.webp 900w', sizes: '(max-width: 899px) calc(100vw - 48px), min(calc(50vw - 42.5px), calc(max(160px, 100vh - 147px) * 1.5))', width: 900, height: 600, alt: 'What it shows' });
            same('its caption', full.caption, 'A <em><span>Title</span></em>');
            same('no description written', made({ image: '/images/x/a.jpg' }).picture?.alt, '');
            for (const spelled of ['images/x/a.jpg', 'x/a.jpg', 'a.jpg', '/images/x/b%20c.jpg', 'b c.jpg']) same(`the picture named ${spelled}`, made({ image: spelled }).picture?.width, 900);
            const before = warned.length;
            same('a picture that is not there', made({ image: '/images/x/gone.jpg', caption: 'A caption' }), { name: 'x', href: '/x/', title: 'A page', body: '', id: 'figure-x', picture: null, caption: '', note: '' });
            if (warned.length !== before + 1 || before !== 0) off.push(`${warned.length - before} warnings for a picture that is not there, ${before} before it`);
            const drawn = made({ image: 'drawing.svg' });
            same('a picture whose size is not known', drawn.picture, { src: '/images/x/drawing.svg', srcset: '', webp: '', sizes: drawn.picture?.sizes, width: '', height: '', alt: '' });
            same('the generated rules', figuresCss([full, made({}), drawn]), '#figure-x{--a:1.5}\n');
            same('no rule without a picture', figuresCss([made({})]), '');
            check('3. a page of text with a picture, in the data layer: every field is defaulted; a footnote keeps the mark it starts with and a lone asterisk in the text stays; an empty line starts a second footnote; a caption needs a picture; the picture may be named by its public path, its path under images/ or its bare file name in the page\'s folder, is left out with a warning if it is not there, and gets no proportions if its size is not known (made-up pages)', off.length === 0, off.slice(0, 3).join(' | '));
        }
        // The page template with each field emptied in turn (the content need not have such a page).
        {
            const site = createEnvironment(nunjucks, { templates: [root], components: join(root, 'components') });
            const picture = { src: '/images/x/a.900.jpg', srcset: '/images/x/a.600.jpg 600w, /images/x/a.900.jpg 900w', webp: '/images/x/a.600.webp 600w, /images/x/a.900.webp 900w', sizes: '100vw', width: 900, height: 600, alt: 'What it shows' };
            const full = { name: 'x', href: '/x/', title: 'A title', body: '<p>Words.</p>', id: 'figure-x', picture, caption: 'A caption', note: '<p>* A note</p>' };
            const render = (over) => site.render('shared/pages/sheet.html', { pageTitle: full.title, sheet: { ...full, ...over }, description: 'About the site', canonical: 'https://example.org/x/' });
            const wrong = [];
            const expect = (name, over, has = {}) => {
                const page = render(over);
                const parts = { text: true, figure: true, picture: true, source: true, caption: true, note: true, zoom: true, rules: true, ...has };
                const found = {
                    text: /<div class="text">/.test(page), figure: /<figure id="figure-x">/.test(page), picture: /<picture data-zoom>/.test(page), source: /<source\b/.test(page), caption: /<figcaption>/.test(page),
                    note: /<div class="note">/.test(page), zoom: /<script type="module" src="\/client\/zoom\.js">/.test(page), rules: /href="\/client\/figures\.css"/.test(page),
                };
                for (const [part, there] of Object.entries(parts)) if (found[part] !== there) wrong.push(`${name}: ${part} ${there ? 'missing' : 'printed'}`);
                if (/<(div|figure|figcaption|p|picture)[^>]*>\s*<\/\1>/.test(page)) wrong.push(`${name}: an empty element`);
                if (!/<h1>A title<\/h1>/.test(page) || !page.includes('<title>Tolomeo — A title</title>')) wrong.push(`${name}: the title`);
                return page;
            };
            expect('everything filled in', {});
            expect('no text', { body: '' }, { text: false });
            expect('no caption', { caption: '' }, { caption: false });
            expect('no footnote', { note: '' }, { note: false });
            expect('no picture', { picture: null, caption: '' }, { figure: false, picture: false, source: false, caption: false, zoom: false, rules: false });
            expect('a caption and no picture', { picture: null }, { figure: false, picture: false, source: false, caption: false, zoom: false, rules: false });
            expect('the text alone', { picture: null, caption: '', note: '' }, { figure: false, picture: false, source: false, caption: false, note: false, zoom: false, rules: false });
            const bare = expect('no description of the picture', { picture: { ...picture, alt: '' } });
            if (!/\salt=""/.test(bare)) wrong.push('no description of the picture: alt is not empty');
            if (!/\salt="What it shows"/.test(render({}))) wrong.push('a description of the picture is not its alt');
            const one = expect('a picture with one file, its size not known', { picture: { src: '/images/x/a.svg', srcset: '', webp: '', sizes: '100vw', width: '', height: '', alt: '' } }, { source: false });
            if (/\ssrcset=|\ssizes=/.test(one.slice(one.indexOf('<main'))) || !/\swidth=""/.test(one)) wrong.push('a picture with one file: srcset or sizes printed, or a width');
            check('3. a page of text leaves out what is empty: no box for a missing text, picture, caption or footnote, no script and no generated stylesheet without a picture, an empty description of the picture where none is written (the page template, each field emptied in turn)', wrong.length === 0, wrong.slice(0, 4).join('; '));
        }
        const hidden = fronts.find(f => f.data.published !== true);
        if (hidden) {
            const gone = await fetch(`${base}/projects/${hidden.data.slug}/`);
            check('3. an unpublished project has no page (404)', gone.status === 404, hidden.data.slug);
        }
    }

    // zero mutations, console errors with JS on
    const errorsOn = [];
    {
        const page = await browser.newPage();
        page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errorsOn.push(`${page.url()} ${m.type()}: ${m.text()}`); });
        page.on('pageerror', e => errorsOn.push(`${page.url()} pageerror: ${e.message}`));
        await page.addInitScript(() => {
            const records = [];
            const watch = new MutationObserver(r => records.push(...r));
            const define = customElements.define.bind(customElements);
            // Watch from the first class definition on: what the parser built is the server's HTML.
            customElements.define = (...args) => {
                watch.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
                watch.takeRecords();
                return define(...args);
            };
            window.__mutations = () => {
                records.push(...watch.takeRecords());
                const inside = records.filter(m => {
                    const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
                    return el?.closest('project-index, project-slides');
                }).map(m => `${m.type} ${m.target.nodeName}${m.attributeName ? ` [${m.attributeName}]` : ''}`);
                records.length = 0;
                return inside;
            };
        });
        // Every component on the page: a project page has one <project-slides> per set.
        const slideshows = published.filter(scripted).map(p => [`/projects/${p.data.slug}/`, 'project-slides']);
        for (const [path, tag] of [['/', 'project-index'], ['/projects/', 'project-index'], ...slideshows]) {
            await page.goto(base + path);
            await page.waitForFunction((t) => { const els = [...document.querySelectorAll(t)]; return els.length > 0 && els.every(el => el.rendered); }, tag);
            const first = await page.evaluate(() => window.__mutations());
            check(`zero mutations on first render: ${path}`, first.length === 0, first.slice(0, 5).join('; '));
            const forced = await page.evaluate((t) => { for (const el of document.querySelectorAll(t)) el.render(); return window.__mutations(); }, tag);
            check(`zero mutations on el.render(): ${path}`, forced.length === 0, forced.slice(0, 5).join('; '));
        }

        // 2. filtering
        await page.goto(base + '/');
        await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
        const tagged = (t) => published.filter(p => (p.data.tags ?? []).includes(t)).map(p => p.data.slug).sort();
        const click = await page.evaluate(async (tag) => {
            const before = new Map([...document.querySelectorAll('project-index .row, project-index .cell')].map(e => [e.id, e]));
            window.__mutations();
            document.querySelector(`project-index .tag[data-tag="${CSS.escape(tag)}"]`).click();
            await new Promise(r => setTimeout(r, 50));
            const rows = [...document.querySelectorAll('project-index .row')];
            const cells = [...document.querySelectorAll('project-index .cell')];
            const muts = window.__mutations();
            return {
                url: location.search,
                rows: rows.map(r => r.dataset.slug).sort(),
                cells: cells.map(c => c.dataset.slug).sort(),
                same: [...rows, ...cells].every(e => before.get(e.id) === e),
                other: muts.filter(m => !m.startsWith('childList') && !/\[(class|aria-pressed)\]$/.test(m)),
                buttons: muts.filter(m => m.startsWith('attributes')).every(m => m.startsWith('attributes BUTTON')),
                active: [...document.querySelectorAll('project-index .tag.on')].every(b => b.dataset.tag === tag),
            };
        }, tagA);
        const want = tagged(tagA);
        check(`2. clicking a tag filters rows and cells (OR) and writes ?filter= (${tagA})`, click.url === `?filter=${encodeURIComponent(tagA)}` && JSON.stringify(click.rows) === JSON.stringify(want) && JSON.stringify(click.cells) === JSON.stringify(want), `${click.url} rows=${click.rows.length} want=${want.length}`);
        check('2. the morph keeps surviving rows/cells as the same nodes and touches only tag state', click.same && click.other.length === 0 && click.buttons, click.other.slice(0, 5).join('; '));
        check('2. active tags are marked', click.active);
        const either = [...new Set([...tagged(tagA), ...tagged(tagB)])].sort();
        const both = `${encodeURIComponent(tagA)},${encodeURIComponent(tagB)}`;
        // The filter in the address is applied by the script, right after its first render: wait for that
        // (an active tag shows) and not for a fixed 100ms, which on a busy machine ran out before the
        // script had started; the check then read all the rows of the server's HTML ("29 vs 10").
        await page.goto(`${base}/?filter=${both}`);
        await page.waitForFunction(() => document.querySelector('project-index .tag.on') !== null, null, { timeout: 10000 }).catch(() => {});
        const fromUrl = await page.evaluate(() => [...document.querySelectorAll('project-index .row')].map(r => r.dataset.slug).sort());
        check(`2. ?filter=${tagA},${tagB} shows projects with either tag`, JSON.stringify(fromUrl) === JSON.stringify(either), `${fromUrl.length} vs ${either.length}`);
        await page.evaluate(async (tags) => {
            for (const t of tags) document.querySelector(`project-index .tag.on[data-tag="${CSS.escape(t)}"]`)?.click();
            await new Promise(r => setTimeout(r, 50));
        }, [tagA, tagB]);
        const cleared = await page.evaluate(() => ({ url: location.search, rows: document.querySelectorAll('project-index .row').length }));
        check('2. removing the last active tag restores everything', cleared.url === '' && cleared.rows === published.length, JSON.stringify(cleared));
        // Turning off a tag with the keyboard while its row is about to drop out: no error,
        // and focus stays in the list. The filter in the address is applied by the script, so wait for
        // it (a fixed pause was too short on a busy machine, and the check was then silently left out).
        await page.goto(`${base}/?filter=${both}`);
        await page.waitForFunction(() => document.querySelector('project-index .tag.on') !== null, null, { timeout: 10000 }).catch(() => {});
        const lone = await page.evaluate((t) => {
            const btn = [...document.querySelectorAll(`project-index .tag.on[data-tag="${CSS.escape(t)}"]`)]
                .find(b => b.closest('.row').querySelectorAll('.tag.on').length === 1);
            if (!btn) return false;
            btn.focus();
            return true;
        }, tagA);
        if (lone) {
            await page.keyboard.press('Enter');
            await page.waitForTimeout(100);
            const focus = await page.evaluate(() => document.activeElement?.closest('project-index .index') !== null);
            check('2. removing a focused row keeps keyboard focus in the list (errors are checked below)', focus);
        } else {
            check(`2. removing a focused row: ok (no row has "${tagA}" as its only active tag; the check was skipped)`, true);
        }
        // Back after two tags were turned off, one after the other: the filter that was there before the second click, in the
        // same page (the address changes and the list follows; nothing is loaded again). Each step waits for the page, not for a
        // fixed 100ms: the filter in the address is applied by the script, and with the script 300ms late (measured with the
        // component's files served slowly) the clicks found no active tag, turned nothing off, and Back then left for the page
        // before: the check failed, or passed without having tried what it names.
        await page.goto(`${base}/?filter=${both}`);
        await page.waitForFunction(() => document.querySelector('project-index .tag.on') !== null, null, { timeout: 10000 }).catch(() => {});
        const off = await page.evaluate(async (tags) => {
            window.__stayed = true;
            for (const t of tags) document.querySelector(`project-index .tag.on[data-tag="${CSS.escape(t)}"]`)?.click();
            await new Promise(r => setTimeout(r, 50));
            return { url: location.search, rows: document.querySelectorAll('project-index .row').length };
        }, [tagA, tagB]);
        await page.goBack();
        await page.waitForFunction(() => location.search !== '' && document.querySelector('project-index .tag.on') !== null, null, { timeout: 10000 }).catch(() => {});
        const back = await page.evaluate(() => ({ url: location.search, rows: document.querySelectorAll('project-index .row').length, stayed: window.__stayed === true }));
        check('2. back restores the previous filter', off.url === '' && off.rows === published.length && back.url === `?filter=${encodeURIComponent(tagB)}` && back.rows === tagged(tagB).length && back.stayed, `with both tags off: ${JSON.stringify(off)}; after Back: ${JSON.stringify(back)}; wanted ?filter=${encodeURIComponent(tagB)} with ${tagged(tagB).length} rows, in the same page`);
        await page.goto(`${base}/`);
        const reset = await page.evaluate(() => document.querySelectorAll('project-index .row').length);
        check('2. / with no query shows everything', reset === published.length);

        // pointing at a thumbnail highlights its row, and changes nothing else
        {
            await page.goto(`${base}/`);
            await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
            const slug = published[1].data.slug;
            await page.evaluate(() => window.__mutations());
            await page.hover(`#cell-${slug}`);
            await page.waitForTimeout(50);
            const hover = await page.evaluate(() => ({
                on: [...document.querySelectorAll('project-index .row.on')].map(r => r.dataset.slug),
                muts: window.__mutations(),
            }));
            check('pointing at a thumbnail highlights its row and touches nothing else', hover.on.length === 1 && hover.on[0] === slug && hover.muts.every(m => m === 'attributes LI [class]'), `${hover.on.join(',')} ${hover.muts.slice(0, 5).join('; ')}`);
        }

        // the project page's Back link brings the filter back. The filter is the script's to apply, on the way out (it is
        // remembered when a project is opened, so it must be on by then) and on the way back: both are waited for, where a
        // fixed 100ms each had run out before a script 300ms late.
        await page.goto(`${base}/?filter=${encodeURIComponent(tagA)}`);
        await page.waitForFunction(() => document.querySelector('project-index .tag.on') !== null, null, { timeout: 10000 }).catch(() => {});
        const leaving = await page.evaluate(() => document.querySelectorAll('project-index .row').length);
        await page.click('project-index .row .title');
        await page.waitForURL(/\/projects\/.+\//);
        await page.click('.back a');
        await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
        await page.waitForFunction(q => location.search === q && document.querySelector('project-index .tag.on') !== null, `?filter=${encodeURIComponent(tagA)}`, { timeout: 10000 }).catch(() => {});
        const returned = await page.evaluate(() => ({ url: location.search, rows: document.querySelectorAll('project-index .row').length }));
        check('2. the project page\'s Back link keeps the filter', leaving === tagged(tagA).length && returned.url === `?filter=${encodeURIComponent(tagA)}` && returned.rows === tagged(tagA).length, `${leaving} rows when the project was opened; back on the home page: ${JSON.stringify(returned)}; wanted ${tagged(tagA).length} rows`);

        // 3. a project from the grid
        await page.goto(`${base}/`);
        const first = published.find(p => !p.data.parent) ?? published[0];
        await page.click(`#cell-${first.data.slug}`);
        await page.waitForURL(`**/projects/${first.data.slug}/`);
        check('3. a grid cell opens its project page', (await page.textContent('h1')).trim() === String(first.data.title).trim());

        // 3. the photos of a set, one at a time (the first set: the one on screen when the page opens)
        const top = 'project-slides:first-of-type';
        if (many && firstSet(many).length > 2) {
            const count = firstSet(many).length;
            await page.goto(`${base}/projects/${many.data.slug}/`);
            await slidesReady(page);
            const look = () => page.evaluate(() => {
                const seen = (el) => Boolean(el) && el.getClientRects().length > 0;
                const slides = [...document.querySelectorAll('project-slides:first-of-type .slide')];
                const shown = slides.filter(seen);
                return {
                    shown: shown.length,
                    current: slides.indexOf(shown[0]),
                    prev: seen(shown[0]?.querySelector('.prev')),
                    next: seen(shown[0]?.querySelector('.next')),
                    focus: document.activeElement?.className ?? '',
                    open: document.querySelectorAll('.zoom').length,
                };
            });
            const start = await look();
            check('3. a project page shows its first photo only, with no "previous"', start.shown === 1 && start.current === 0 && !start.prev && start.next, JSON.stringify(start));
            await page.evaluate(() => window.__mutations());
            await page.click(`${top} .current .next`);
            const second = await look();
            const muts = await page.evaluate(() => window.__mutations());
            const other = muts.filter(m => !['attributes LI [class]', 'attributes IMG [loading]', 'characterData #text'].includes(m));
            check('3. the "next" chevron shows the second photo, between two chevrons, and keeps focus', second.shown === 1 && second.current === 1 && second.prev && second.next && second.focus.includes('next'), JSON.stringify(second));
            check('3. changing photo touches only the current class, the next photo\'s loading and the status line', other.length === 0, other.slice(0, 5).join('; '));
            // A click on the photo: client/zoom.js holds it back to see whether a second follows (two open the
            // photo), then hands it on. Timed in the page, from the click to the change of photo.
            await page.evaluate(() => {
                window.__took = new Promise((resolve) => {
                    const set = document.querySelector('project-slides:first-of-type');
                    const was = set.state.index;
                    let clicked = 0;
                    let seenAt = -1;
                    document.addEventListener('click', () => {
                        clicked = performance.now();
                        // What shows a moment after the click: still the photo that was clicked.
                        setTimeout(() => { seenAt = set.state.index; }, 60);
                    }, { capture: true, once: true });
                    const watch = new MutationObserver(() => { if (set.state.index !== was) { watch.disconnect(); resolve({ ms: performance.now() - clicked, early: seenAt, was }); } });
                    watch.observe(set, { subtree: true, attributes: true, attributeFilter: ['class'] });
                    setTimeout(() => { watch.disconnect(); resolve({ ms: -1, early: seenAt, was }); }, 4000);
                });
            });
            await page.click(`${top} .current .frame`);
            const took = await page.evaluate(() => window.__took);
            const third = await look();
            await page.keyboard.press('ArrowLeft');
            const left = await look();
            check(`3. a click on the photo goes on to the next, once the ${ZOOM_WAIT} ms are over in which a second click would have opened it (${Math.round(took.ms)} ms; until then the photo stays); the left arrow key goes back`,
                took.early === took.was && took.ms >= ZOOM_WAIT - 5 && took.ms < ZOOM_WAIT + 600 && third.current === 2 && third.open === 0 && left.current === 1, `${JSON.stringify(took)}; then photo ${third.current + 1}, then ${left.current + 1}`);
            await page.focus(`${top} .current .next`);
            await page.keyboard.press('ArrowRight');
            const kept = await page.evaluate(() => document.activeElement?.closest('project-slides:first-of-type .slide.current') !== null && document.activeElement?.classList.contains('arrow'));
            check('3. an arrow key pressed while a chevron has focus keeps focus on a chevron of the new photo', kept);
            for (let i = 0; i < count + 1; i++) await page.keyboard.press('ArrowRight');
            const end = await look();
            await page.click(`${top} .current .frame`);
            await page.waitForTimeout(ZOOM_WAIT + 250);
            const still = await look();
            check('3. the last photo has no "next", and a click on it stays', end.current === count - 1 && end.prev && !end.next && still.current === count - 1 && still.open === 0, JSON.stringify(end));
        }
        if (captioned) {
            const at = firstSet(captioned).findIndex(im => im.caption);
            await page.goto(`${base}/projects/${captioned.data.slug}/`);
            await slidesReady(page);
            for (let i = 0; i < at; i++) await page.keyboard.press('ArrowRight');
            const shown = await page.evaluate(() => [...document.querySelectorAll('project-slides:first-of-type .caption')].filter(c => c.getClientRects().length).map(c => c.textContent.replace(/\s+/g, ' ').trim()));
            check('3. a photo\'s caption shows under it, and only its own', shown.length === 1 && shown[0] === words(firstSet(captioned)[at].caption), shown.join(' | '));
        }
        // The page as the server sent it, parsed again in the page: is the document still that?
        const asSent = () => page.evaluate(async () => {
            const sent = new DOMParser().parseFromString(await (await fetch(location.pathname)).text(), 'text/html');
            return sent.body.innerHTML === document.body.innerHTML && sent.head.innerHTML === document.head.innerHTML;
        });
        if (single) {
            await page.goto(`${base}/projects/${single.data.slug}/`);
            await page.waitForTimeout(150);
            const lone = await page.evaluate(() => ({ arrows: document.querySelectorAll('project-slides .arrow').length, slides: document.querySelectorAll('project-slides .slide').length, scripts: [...document.scripts].map(s => s.src.split('/').pop()).join(), defined: Boolean(customElements.get('project-slides')) }));
            check('3. a project with one photo has no chevrons, and no script but zoom.js: its photo is the server\'s HTML', lone.arrows === 0 && lone.slides === 1 && lone.scripts === 'zoom.js' && !lone.defined, JSON.stringify(lone));
        }

        // 3. a double click opens a photo to the full window (client/zoom.js); a click, Escape, Enter or
        // the space bar closes it; meanwhile the page behind it stays as it is.
        if (many && firstSet(many).length > 2) {
            await page.setViewportSize({ width: 1366, height: 710 });
            await page.goto(`${base}/projects/${many.data.slug}/`);
            await slidesReady(page);
            const state = () => page.evaluate(() => {
                const box = document.querySelector('.zoom');
                const big = box?.querySelector('img');
                const r = big?.getBoundingClientRect();
                const a = document.activeElement;
                return {
                    index: document.querySelector('project-slides').state.index,
                    open: document.querySelectorAll('.zoom').length,
                    y: scrollY,
                    focus: a === document.body ? 'body' : a.className || a.localName,
                    role: box?.getAttribute('role') ?? '',
                    modal: box?.getAttribute('aria-modal') ?? '',
                    label: box?.getAttribute('aria-label') ?? '',
                    alt: big?.alt ?? '',
                    shown: document.querySelector('project-slides .slide.current img').alt,
                    fills: Boolean(r) && r.left === 0 && r.top === 0 && r.width === innerWidth && r.height === innerHeight,
                    fit: big ? getComputedStyle(big).objectFit : '',
                    loaded: Boolean(big) && big.complete && big.naturalWidth > 0,
                    onTop: Boolean(box) && document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.zoom') === box && document.elementFromPoint(20, 20)?.closest('.zoom') === box,
                    selected: String(getSelection()),
                };
            });
            // A double click, as the mouse sends it. Two clicks that a busy machine sends more than the wait
            // apart are two single clicks (the set moves on twice): back to the photo then, and once more.
            const dbl = async () => {
                for (let i = 0; i < 3; i++) {
                    const shown = await page.evaluate(() => document.querySelector('project-slides').state.index);
                    await page.dblclick(`${top} .current .frame`);
                    if (await page.waitForSelector('.zoom', { timeout: 2 * ZOOM_WAIT + 400 }).then(() => true, () => false)) break;
                    await page.evaluate(n => document.querySelector('project-slides').setState({ index: n }), shown);
                }
                await page.waitForFunction(() => { const img = document.querySelector('.zoom img'); return Boolean(img) && img.complete && img.naturalWidth > 0; }, null, { timeout: 5000 }).catch(() => {});
            };
            await dbl();
            await page.waitForTimeout(ZOOM_WAIT + 150);
            const opened = await state();
            check('3. a double click on a photo opens it to the full window: whole, over everything, the photo that was clicked; the set does not move on and nothing is selected',
                opened.open === 1 && opened.index === 0 && opened.fills && opened.fit === 'contain' && opened.loaded && opened.onTop && opened.selected === '', JSON.stringify(opened));
            check('3. the open photo is a dialog named after the photo, and has keyboard focus', opened.role === 'dialog' && opened.modal === 'true' && opened.label !== '' && opened.label === opened.shown && opened.alt === opened.shown && opened.focus === 'zoom', JSON.stringify(opened));
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('PageDown');
            await page.keyboard.press('Tab');
            await page.mouse.wheel(0, 500);
            await rest(page);
            const behind = await state();
            check('3. while a photo is open the arrow keys, Page Down, Tab and the wheel leave the page behind it as it is: the same photo, the same place, focus on the open photo', behind.open === 1 && behind.index === opened.index && behind.y === opened.y && behind.focus === 'zoom', JSON.stringify(behind));
            const closes = [];
            for (const how of ['Escape', 'Enter', ' ', 'click']) {
                if (!(await state()).open) await dbl();
                if (how === 'click') await page.mouse.click(683, 355);
                else await page.keyboard.press(how);
                await page.waitForTimeout(ZOOM_WAIT + 150);
                const after = await state();
                if (after.open !== 0 || after.index !== opened.index || after.y !== opened.y) closes.push(`${how === ' ' ? 'the space bar' : how}: ${JSON.stringify({ open: after.open, index: after.index, y: after.y })}`);
            }
            check('3. Escape, Enter, the space bar and a click each close the open photo, and the page behind is as it was: the same photo, the same place', closes.length === 0, closes.join('; '));
            // A double click on an open photo (as a double tap enlarges and a double tap goes back): its first click closes the
            // photo, and its second lands on the page that was behind it: on the photo, or on a link where the pointer is over
            // one (the header's "back"). That second click is not for the page: the set stays on its photo, no link is followed.
            // Sent as the mouse sends it. Two clicks that a busy machine sends more than the wait apart are a click that closes
            // and a click of its own, which rightly moves the set on or follows the link: such a try does not count and is made
            // again (the time between the two is read in the page; a page that was left cannot say, and is tried again too).
            {
                const here = `/projects/${many.data.slug}/`;
                const twice = async (target) => {
                    let last = 'not tried';
                    for (let i = 0; i < 4; i++) {
                        if (new URL(page.url()).pathname !== here) { await page.goto(base + here); await slidesReady(page); }
                        if (!(await state()).open) await dbl();
                        const was = await state();
                        const spot = await page.evaluate((sel) => {
                            window.__clicks = [];
                            if (!window.__timing) { window.__timing = true; document.addEventListener('click', () => window.__clicks.push(performance.now()), true); }
                            const r = document.querySelector(sel).getBoundingClientRect();
                            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
                        }, target);
                        await page.mouse.dblclick(spot.x, spot.y);
                        await page.waitForTimeout(ZOOM_WAIT + 250);
                        const left = new URL(page.url()).pathname !== here;
                        const after = left ? null : await state();
                        const gap = left ? NaN : await page.evaluate(() => (window.__clicks.length === 2 ? window.__clicks[1] - window.__clicks[0] : NaN));
                        last = left ? `the page was left for ${new URL(page.url()).pathname}` : `${after.open} open, photo ${after.index + 1} after photo ${was.index + 1}, the clicks ${Math.round(gap)} ms apart`;
                        if (!left && gap < ZOOM_WAIT - 20) return { ok: was.open === 1 && after.open === 0 && after.index === was.index && after.y === was.y, last };
                    }
                    return { ok: false, last };
                };
                // Over the photo last: the page is then as the checks after this one expect it, the pointer on the photo that was open.
                const onLink = await twice('.project-head .back a');
                const onPhoto = await twice(`${top} .current .frame`);
                check('3. a double click on an open photo closes it and does nothing more: the click that follows the closing one lands on the page behind, and moves no photo on and follows no link (tried over the photo, and where the header\'s "back" is behind the open photo)',
                    onPhoto.ok && onLink.ok, `over the photo: ${onPhoto.last}; over "back": ${onLink.last}`);
                // As the checks after this one expect the page: this project's, its first photo, nothing open.
                if (new URL(page.url()).pathname !== here) { await page.goto(base + here); await slidesReady(page); }
                if ((await state()).open) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
                await page.evaluate(() => document.querySelector('project-slides').setState({ index: 0 }));
            }
            await page.keyboard.press('ArrowRight');
            const moved = await state();
            await page.keyboard.press('Tab');
            const tabbed = await page.evaluate(() => (document.activeElement?.closest('project-slides:first-of-type .slide.current') !== null && document.activeElement.classList.contains('arrow') ? 'a chevron of that set' : document.activeElement?.closest('.project-head') ? 'the header' : document.activeElement?.className || document.activeElement?.localName));
            check('3. after a photo was open the arrow keys move the photos again, and Tab goes on from the photo that was open, not from the top of the page', moved.index === opened.index + 1 && moved.open === 0 && tabbed === 'a chevron of that set', `photo ${moved.index + 1}; Tab reaches ${tabbed}`);
            // Opened by two clicks from a script: a press of the mouse would itself take focus from the chevron.
            await page.focus(`${top} .current .next`);
            await page.evaluate(() => { const frame = document.querySelector('project-slides:first-of-type .current .frame'); frame.click(); frame.click(); });
            await page.waitForSelector('.zoom', { timeout: 5000 }).catch(() => {});
            const taken = await state();
            await page.keyboard.press('Escape');
            const given = await page.evaluate(() => document.activeElement?.matches('project-slides:first-of-type .slide.current .next') ?? false);
            const after = await state();
            check('3. what had keyboard focus when a photo was opened has it again when the photo closes', taken.open === 1 && taken.focus === 'zoom' && given && after.open === 0 && after.index === taken.index, `${taken.focus}, then ${given ? 'the chevron again' : after.focus}`);
            // A click on a photo of one set and at once on a photo of another: both were single clicks.
            if (multi && setsOf(multi).filter(set => set.length > 1).length > 1) {
                await page.goto(`${base}/projects/${multi.data.slug}/`);
                await slidesReady(page);
                const pair = setsOf(multi).map((set, i) => (set.length > 1 ? i : -1)).filter(i => i >= 0).slice(0, 2);
                await page.evaluate(([a, b]) => { const sets = document.querySelectorAll('project-slides'); sets[a].querySelector('.current .frame').click(); sets[b].querySelector('.current .frame').click(); }, pair);
                await page.waitForTimeout(ZOOM_WAIT + 250);
                const both = await page.evaluate(() => ({ at: [...document.querySelectorAll('project-slides')].map(el => el.state.index).join(), open: document.querySelectorAll('.zoom').length }));
                check('3. a click on a photo of one set and at once on a photo of another moves both sets on, and opens nothing', both.at === setsOf(multi).map((_, i) => (pair.includes(i) ? 1 : 0)).join() && both.open === 0, JSON.stringify(both));
            }
        }
        if (single) {
            await page.setViewportSize({ width: 1366, height: 710 });
            await page.goto(`${base}/projects/${single.data.slug}/`);
            await page.waitForTimeout(250);
            const loaded = await asSent();
            await page.click('project-slides .frame');
            await page.waitForTimeout(ZOOM_WAIT + 250);
            const clicked = await asSent();
            for (let i = 0; i < 3; i++) {
                await page.dblclick('project-slides .frame');
                if (await page.waitForSelector('.zoom', { timeout: 2 * ZOOM_WAIT + 400 }).then(() => true, () => false)) break;
            }
            const opened = await page.evaluate(() => ({ open: document.querySelectorAll('.zoom').length, label: document.querySelector('.zoom')?.getAttribute('aria-label') ?? '', alt: document.querySelector('project-slides img').alt }));
            await page.mouse.click(683, 355);
            await page.waitForTimeout(150);
            const closed = await asSent();
            check('3. zoom.js touches nothing until a photo is opened, and leaves nothing behind: on a page with one photo the document is the server\'s HTML after loading, after a click on the photo, and again after the photo was opened by a double click and closed by a click',
                loaded && clicked && opened.open === 1 && opened.label === opened.alt && closed, JSON.stringify({ loaded, clicked, opened, closed }));
        }

        // 3. the page's two layouts. Helpers for both.
        {
            const near = (a, b, by = 0.5) => Math.abs(a - b) <= by;
            const open = async (p, hash = '') => {
                await page.goto(`${base}/projects/${p.data.slug}/${hash}`);
                await slidesReady(page);
                await page.mouse.move(Math.round(page.viewportSize().width / 2), 400);
                return lie(page);
            };
            const scrollTo = async (y) => {
                await page.evaluate(to => window.scrollTo({ top: to === 'end' ? document.documentElement.scrollHeight : to, behavior: 'instant' }), y);
                return lie(page);
            };
            // One turn of the wheel, more than half a set: where the page snaps, it goes on to the next stop.
            const wheel = async (down = true) => {
                await page.mouse.wheel(0, (down ? 1 : -1) * Math.round((await page.evaluate(() => innerHeight) - pageOf(page.viewportSize().width).head) * 0.6));
                await rest(page);
                return lie(page);
            };
            // Do the two words that are fixed in the window's lower corners lie over anything? The word itself
            // over a line of a caption or of the information (2px of air), or the link's box within 8px of a
            // chevron's drawing. (Over a photo of a later set they may be: the sets pass under them.)
            const covered = () => page.evaluate(() => {
                const hit = (a, b, air) => a.left < b.right + air && b.left < a.right + air && a.top < b.bottom + air && b.top < a.bottom + air;
                const textRects = (el) => {
                    const out = [];
                    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                        if (!n.data.trim()) continue;
                        const range = document.createRange();
                        range.selectNodeContents(n);
                        out.push(...[...range.getClientRects()].filter(r => r.width > 0 && r.height > 0));
                    }
                    return out;
                };
                const found = [];
                for (const a of document.querySelectorAll('#project-info .neighbours a')) {
                    if (getComputedStyle(a).position !== 'fixed') continue;
                    const name = a.textContent.trim();
                    const word = a.querySelector('span').getBoundingClientRect();
                    const box = a.getBoundingClientRect();
                    for (const slide of document.querySelectorAll('project-slides .slide')) {
                        if (!slide.getClientRects().length) continue;
                        const caption = slide.querySelector('.caption');
                        if (caption && textRects(caption).some(r => hit(word, r, 2))) found.push(`"${name}" over a caption`);
                        for (const svg of slide.querySelectorAll('.arrow svg')) if (svg.getClientRects().length && hit(box, svg.getBoundingClientRect(), 8)) found.push(`"${name}" on a chevron`);
                    }
                    for (const part of document.querySelectorAll('#project-info .facts, #project-info .about')) if (textRects(part).some(r => hit(word, r, 2))) found.push(`"${name}" over the ${part.className === 'facts' ? 'facts' : 'description'}`);
                }
                return [...new Set(found)];
            });
            // Every photo of every project in a window of width × height: each as the design has it
            // (offDesign), nothing of it over anything else (overlapping), and, where the two words are
            // fixed in the corners, neither over a caption, a line of text or a chevron while a set is
            // directly under the header (as the first is when the page opens) or the page is at its end.
            const sweep = async (width, height) => {
                await page.setViewportSize({ width, height });
                const d = pageOf(width);
                const wrong = [];
                const corners = [];
                const idle = [];
                const tally = { photos: 0, upright: 0, lying: 0, alone: 0, bare: 0, long: 0, cleared: 0, wrapped: 0, widest: null, narrowest: null, lone: 0, still: 0 };
                for (const p of published) {
                    const counts = setsOf(p).map(set => set.length);
                    if (!counts.length) continue;
                    await page.goto(`${base}/projects/${p.data.slug}/`);
                    await slidesReady(page);
                    // Below 900px the page snaps: once it has come to rest it must still be at its top, the first photo under the header and not behind it, whatever the title's length.
                    if (!d.wide) {
                        await page.evaluate(() => document.fonts.ready.then(() => true));
                        await rest(page);
                        const opened = await lie(page);
                        if (opened.y !== 0 || opened.sets[0].frame.top < opened.head.bottom - 0.5) wrong.push(`${p.data.slug}: the page opens ${opened.y}px down, its photo from ${opened.sets[0].frame.top} under a header that ends at ${opened.head.bottom}`);
                        if (opened.head.bottom > d.head + 1) tally.wrapped++;
                    }
                    const show = (n, i) => page.evaluate(([k, j]) => document.querySelectorAll('project-slides')[k].setState?.({ index: j }), [n, i]);
                    for (let n = 0; n < counts.length; n++) {
                        if (d.wide && n > 0) await page.evaluate(([k, head]) => window.scrollTo({ top: document.querySelectorAll('project-slides')[k].getBoundingClientRect().top + scrollY - head, behavior: 'instant' }), [n, d.head]);
                        for (let i = 0; i < counts[n]; i++) {
                            if (i > 0) await show(n, i);
                            const at = await lie(page);
                            const set = at.sets[n];
                            const off = [set.current === i ? '' : `photo ${set.current + 1} shows`, offDesign(set, at), overlapping(set, at)].filter(Boolean).join('; ');
                            if (off) wrong.push(`${p.data.slug}, set ${n + 1}, photo ${i + 1}: ${off}`);
                            if (d.wide) for (const what of await covered()) corners.push(`${p.data.slug}, set ${n + 1} under the header, photo ${i + 1}: ${what}`);
                            // From 900px, a page with one set: it is as long as the row under the photo (the caption with the 8px under it, the
                            // chevrons) or the information makes it, and no longer. How far it scrolls is read from the page and held to that.
                            if (d.wide && counts.length === 1) {
                                const row = Math.max(set.frame.bottom, set.caption ? set.caption.bottom + 8 : 0, set.prev?.bottom ?? 0, set.next?.bottom ?? 0);
                                const reach = Math.max(0, Math.max(row, at.info.bottom) + at.y - at.vh);
                                tally.lone++;
                                if (at.max === 0) tally.still++;
                                if (Math.abs(at.max - reach) > 1) idle.push(`${p.data.slug}, photo ${i + 1}: the page scrolls by ${at.max}px, where the row under the photo ends at ${Math.round(row * 100) / 100}px and the information at ${Math.round(at.info.bottom * 100) / 100}px in a window ${at.vh}px tall`);
                            }
                            tally.photos++;
                            if (set.a < 1) tally.upright++; else tally.lying++;
                            if (set.count === 1) tally.alone++;
                            if (!set.caption) tally.bare++;
                            else if (set.caption.height / parseFloat(set.caption.type.split(' / ')[1]) > 3.5) tally.long++;
                            const room = roomOf(at.vw, at.vh);
                            if (Math.abs(photoWidth(set.a, at.vw, at.vh, set.count > 1 && Boolean(at.prev)) - Math.min(room.width, room.height * set.a)) > 0.01) tally.cleared++;
                            if (!tally.widest || set.a > tally.widest.a) tally.widest = { a: set.a, by: Math.abs(set.frame.width - room.width) <= EXACT ? 'width' : 'height' };
                            if (!tally.narrowest || set.a < tally.narrowest.a) tally.narrowest = { a: set.a, by: Math.abs(set.frame.width - room.width) <= EXACT ? 'width' : 'height' };
                        }
                        if (counts[n] > 1) await show(n, 0);
                    }
                    if (d.wide) {
                        await scrollTo('end');
                        const last = counts.length - 1;
                        for (let i = 0; i < counts[last]; i++) {
                            if (i > 0) { await show(last, i); await scrollTo('end'); }
                            for (const what of await covered()) corners.push(`${p.data.slug}, at the end of the page, photo ${i + 1} of the last set: ${what}`);
                        }
                    }
                }
                return { wrong, corners, idle, tally };
            };
            const told = (t) => `${t.photos} photos: ${t.upright} taller than wide, ${t.lying} wider, ${t.alone} alone in their set, ${t.bare} without a caption, ${t.long} with a caption of four lines or more; the widest, ${t.widest.a} : 1, limited by its ${t.widest.by}, the narrowest, ${t.narrowest.a} : 1, by its ${t.narrowest.by}`;

            // A project that has every part of the information and a neighbour on both sides: the one with the most to read.
            const whole = [...published]
                .filter(p => photos(p).length && factsOf(p).length >= 4 && texts(p.data.tags).length && texts(p.data.role).length && text(p.data.client) && text(p.data.years) && p.content.trim() && listed.indexOf(p.data.slug) > 0 && listed.indexOf(p.data.slug) < listed.length - 1)
                .sort((a, b) => b.content.length - a.content.length)[0];
            // One with details, if the content has one.
            const detailed = published.filter(p => photos(p).length && detailsOf(p).length).sort((a, b) => detailsOf(b).flat().length - detailsOf(a).flat().length)[0];
            // The information, measured: its parts, its lines, its type.
            const measure = () => page.evaluate(() => {
                const box = (el) => { if (!el || !el.getClientRects().length) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
                const info = document.querySelector('#project-info');
                const q = (sel) => info.querySelector(sel);
                const all = (sel) => [...info.querySelectorAll(sel)];
                const type = (el) => { if (!el) return ''; const s = getComputedStyle(el); return [s.fontSize, s.lineHeight, s.fontWeight].join(' / '); };
                const lines = all('.facts > p, .facts > .extra > p');
                return {
                    y: scrollY,
                    vw: document.documentElement.clientWidth,
                    vh: innerHeight,
                    wide: document.documentElement.scrollWidth,
                    centre: document.documentElement.clientWidth / 2,
                    info: box(info),
                    position: getComputedStyle(info).position,
                    least: getComputedStyle(info).minHeight,
                    facts: box(q('.facts')),
                    about: box(q('.about')),
                    desc: box(q('.description')),
                    paras: all('.description p').map(box),
                    lines: lines.map(p => ({ ...box(p), text: p.textContent.replace(/\s+/g, ' ').trim(), spaced: p.classList.contains('years') ? Boolean(p.previousElementSibling) : Boolean(p.parentElement.classList.contains('extra') && !p.previousElementSibling && p.parentElement.previousElementSibling) })),
                    types: { facts: type(lines[0]), text: type(q('.description p')) },
                    labels: all('.label').map(l => `${l.textContent} ${getComputedStyle(l).fontWeight}`).join(', '),
                    heavy: all('.facts > p, .description p').filter(p => getComputedStyle(p).fontWeight !== '300').length,
                    colours: [...new Set(all('.facts, .facts *, .about, .about *').map(el => getComputedStyle(el).color))].join(' / '),
                    ink: getComputedStyle(document.body).color,
                    slanted: all('.facts > p, .facts > p *').filter(el => getComputedStyle(el).transform !== 'none').length,
                    titles: all('h1, h2, h3, .row, .title').length,
                    nav: box(q('.neighbours')),
                };
            });
            // The facts' lines: each entry takes whole lines of `step` (one, or more where it wraps), and
            // nothing is between two entries but one empty line before the years and before each block of details.
            const linesOff = (m, step, wanted) => {
                const off = [];
                if (m.lines.map(l => l.text).join(' | ') !== wanted.join(' | ')) off.push(`lines "${m.lines.map(l => l.text).join(' | ')}"`);
                m.lines.forEach((l, i) => {
                    const takes = l.height / step;
                    if (takes < 0.99 || !near(takes, Math.round(takes), 0.02)) off.push(`"${l.text}" takes ${takes.toFixed(3)} lines`);
                    if (i > 0 && !near((l.top - m.lines[i - 1].bottom) / step, l.spaced ? 1 : 0, 0.02)) off.push(`${((l.top - m.lines[i - 1].bottom) / step).toFixed(3)} empty lines before "${l.text}", not ${l.spaced ? 1 : 0}`);
                });
                return off;
            };
            // The header, as both layouts have it: `back` at the left, the title in the middle of the page.
            const headOff = async (at) => {
                const d = pageOf(at.vw);
                const h = await page.evaluate(() => {
                    const type = (el) => { const s = getComputedStyle(el); return [s.fontSize, s.lineHeight, s.fontWeight].join(' / '); };
                    const head = document.querySelector('.project-head');
                    const title = head.querySelector('h1');
                    const back = head.querySelector('.back');
                    const link = back.querySelector('a');
                    const range = document.createRange();
                    range.selectNodeContents(title);
                    const text = range.getBoundingClientRect();
                    return {
                        position: getComputedStyle(head).position, ground: getComputedStyle(head).backgroundColor, image: getComputedStyle(head).backgroundImage, page: getComputedStyle(document.body).backgroundColor,
                        title: type(title), back: type(link), href: title.querySelector('a')?.getAttribute('href') ?? '', home: link.getAttribute('href'), word: link.textContent,
                        middle: (text.left + text.right) / 2, titleTop: title.getBoundingClientRect().top, lines: Math.round(title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight)),
                        backLeft: back.getBoundingClientRect().left, backTop: back.getBoundingClientRect().top, lean: getComputedStyle(link).transform, colour: getComputedStyle(link).color,
                    };
                });
                const off = [];
                const padding = d.wide ? { top: 39, side: 34 } : { top: 50, side: 24 };
                if (h.position !== 'sticky' || !near(at.head.top, 0) || !at.headOnTop) off.push(`header ${h.position} at ${at.head.top}, its links ${at.headOnTop ? 'on top' : 'covered'}`);
                if (h.lines === 1 && !near(at.head.height, d.head)) off.push(`header ${at.head.height} tall, not ${d.head}`);
                if (h.ground !== h.page || h.image !== 'none') off.push(`header ground ${h.ground} ${h.image}`);
                if (h.title !== d.title || h.back !== d.back) off.push(`title ${h.title}, back ${h.back}`);
                if (h.href !== '#project-info' || h.home !== '/' || h.word !== 'back') off.push(`title to "${h.href}", "${h.word}" to "${h.home}"`);
                if (!near(h.middle, at.vw / 2, 0.75)) off.push(`title's middle at ${h.middle} in a page ${at.vw} wide`);
                if (!near(h.titleTop, padding.top) || !near(h.backTop, padding.top) || !near(h.backLeft, padding.side)) off.push(`title ${h.titleTop} down, back at ${h.backLeft}, ${h.backTop}, not ${padding.side}, ${padding.top}`);
                if (h.colour !== 'rgb(128, 114, 121)' || !/^matrix\(1, 0, 0\.105\d*, 1, 0, 0\)$/.test(h.lean)) off.push(`back ${h.colour} ${h.lean}`);
                return off.join('; ');
            };
            // A stand-in for a project without photos, if the content has none: one with its sets taken out of the page.
            const bare = published.find(p => !photos(p).length && (factsOf(p).length || p.content.trim()));
            const openBare = async () => {
                const stand = bare ?? longest;
                await page.goto('about:blank');
                await page.goto(`${base}/projects/${stand.data.slug}/`);
                if (!bare) {
                    await slidesReady(page);
                    await page.evaluate(() => { document.querySelector('.sets')?.remove(); window.scrollTo({ top: 0, behavior: 'instant' }); });
                }
                await page.mouse.move(Math.round(page.viewportSize().width / 2), 400);
                await rest(page);
                return lie(page);
            };

            // --- From 900px wide: the sets of photos are the left half of the page, each photo right-aligned to
            // the page's centre; the information stays in place on the right, under the header, while the sets
            // scroll by; nothing snaps; "previous" and "next" are fixed in the window's lower corners.
            await page.setViewportSize({ width: 1366, height: 710 });
            if (oneSet) {
                const at = await open(oneSet);
                const off = [offDesign(at.sets[0], at), await headOff(at)].filter(Boolean).join('; ');
                check(`3. at 1366 × 710 a project page opens with its photo directly under the 71px header, in the left half of the page and right-aligned to its centre, as large as fits, its caption and chevrons in one row under it; back at the left of the header, the title in the middle of the page (${oneSet.data.slug})`,
                    at.sets.length === 1 && off === '' && near(at.sets[0].top, 71) && at.y === 0, off || `${at.sets.length} set, its top at ${at.sets[0].top}, the page at ${at.y}`);
            }
            for (const [width, height] of [[1366, 710], [900, 600]]) {
                const { wrong, corners, idle, tally } = await sweep(width, height);
                check(`3. at ${width} × ${height} every photo of every project is as large as fits its half of the page and the window under the header, the side that limits it exactly on its limit, right-aligned to the centre, without a border, the shadow around it, its picture over the whole box, its caption and its chevrons in the row under it and nothing over anything else; its sizes attribute gives its width to the pixel (${told(tally)}; ${tally.cleared} kept clear of "previous": ${CLEAR}px from the half's left edge or ${LOWER}px less tall)`,
                    wrong.length === 0 && tally.photos === published.reduce((n, p) => n + photos(p).length, 0), wrong.slice(0, 3).join(' | '));
                check(`3. at ${width} × ${height} "previous" and "next", fixed in the window's lower corners, lie over no caption, no line of the information and no chevron: with each set directly under the header, for every photo of it, and at the end of the page, on every project page`, corners.length === 0, corners.slice(0, 4).join(' | '));
                check(`3. at ${width} × ${height} a project page with one set of photos is only as long as the row under its photo, or its information, makes it: nothing under that row adds to the page, so a page whose photo, caption, chevrons and information are all in the window has nothing to scroll (how far the page scrolls, read for each of the ${tally.lone} photos on such pages; with ${tally.still} of them it does not scroll at all)`,
                    idle.length === 0 && tally.lone > 0, idle.slice(0, 4).join(' | '));
            }
            await page.setViewportSize({ width: 1366, height: 710 });

            if (!whole) check('3. the information\'s layout: ok (no project in content has tags, a role, a client, years, a description and a neighbour on both sides; its checks were skipped)', true);
            else {
                const slug = whole.data.slug;
                const at = await open(whole);
                const m = await measure();
                const d = pageOf(1366);
                check(`3. at 1366 × 710 the information is the right half of the page, from 8.5px right of the centre: the description, 245px wide, then 20px on the facts, 232px wide; both start 4px under the header, at 75px (${slug})`,
                    near(m.info.left, m.centre + 8.5) && near(m.about.left, m.centre + 8.5) && near(m.about.width, 245) && near(m.facts.left, m.about.right + 20) && near(m.facts.width, 232) && near(m.info.top, 71) && near(m.paras[0].top, 75) && near(m.lines[0].top, 75),
                    `the description from ${m.about.left - m.centre}px right of the centre, ${m.about.width}px wide; the facts ${m.facts.left - m.about.right}px on, ${m.facts.width}px wide; first lines at ${m.paras[0].top} and ${m.lines[0].top}`);
                const lines = linesOff(m, 17.75, factsOf(whole));
                check('3. the facts: "type:", "role:" and "for:" in Bold, colon and all, everything else Light, all of it and the description in the text colour, nothing slanted; 12.5px on a line of 17.75px (1.42), an entry that wraps taking whole lines, the years one empty line under the rest; the description 12.5px / 15.2px, its paragraphs 0.55em apart',
                    m.labels === 'type: 700, role: 700, for: 700' && m.heavy === 0 && m.colours === m.ink && m.slanted === 0 && lines.length === 0 && m.types.facts === d.facts && m.types.text === d.text
                    && m.paras.slice(1).every((para, i) => near(para.top - m.paras[i].bottom, 0.55 * 12.5, 0.05)),
                    `labels ${m.labels}; ${m.heavy} lines not Light; colours ${m.colours} (text ${m.ink}); ${m.slanted} slanted; ${lines.join('; ')}; facts ${m.types.facts}, description ${m.types.text}; paragraphs ${m.paras.slice(1).map((para, i) => (para.top - m.paras[i].bottom).toFixed(2)).join(', ')} apart`);
                check('3. the project\'s title is in the page header only: the information has no heading and no title row', m.titles === 0 && await page.evaluate(() => document.querySelectorAll('h1').length) === 1, `${m.titles} in the information`);

                // The two words in the window's lower corners.
                const placed = (a, side, to) => {
                    const off = [];
                    if (!a) return [`no "${side}"`];
                    if (a.text !== side || a.href !== `/projects/${to}/`) off.push(`"${a.text}" to ${a.href}`);
                    if (a.position !== 'fixed') off.push(`"${side}" is ${a.position}`);
                    if (side === 'previous' ? !near(a.left, 34) : !near(a.right, at.vw - 40)) off.push(`"${side}" from ${a.left} to ${a.right}`);
                    if (!near(a.bottom, at.vh - 26) || !near(a.height, 12 + 15.2 + 12, 0.1)) off.push(`"${side}" ends ${at.vh - a.bottom}px above the window's lower edge and is ${a.height} tall`);
                    if (a.colour !== 'rgb(128, 114, 121)' || a.underline !== 'none' || a.type !== d.text) off.push(`"${side}" ${a.colour}, ${a.underline}, ${a.type}`);
                    if (a.inline !== 'inline-block' || !new RegExp(`^matrix\\(1, 0, ${side === 'previous' ? '' : '-'}0\\.105\\d*, 1, 0, 0\\)$`).test(a.lean)) off.push(`"${side}" leans ${a.lean} (${a.inline})`);
                    return off;
                };
                const index = listed.indexOf(slug);
                const cornerOff = [...placed(at.prev, 'previous', listed[index - 1]), ...placed(at.next, 'next', listed[index + 1])];
                await page.hover('#project-info .neighbours .next');
                const hovered = await page.evaluate(() => getComputedStyle(document.querySelector('#project-info .neighbours .next')).color);
                await page.mouse.move(683, 400);
                check('3. at 1366 × 710 the words "previous" and "next" are fixed in the window\'s lower corners, 34px from its left edge and 40px from its right, 26px above its lower edge with 12px of link above and below the word; in the tag colour, not underlined, "previous" leaning backwards and "next" forwards; the link colour when pointed at',
                    cornerOff.length === 0 && hovered === 'rgb(153, 86, 122)', cornerOff.join('; ') || `pointed at: ${hovered}`);

                // By keyboard: the word shows its focus; Enter follows it; the page it opens points back.
                let tabs = 0;
                while (tabs++ < 60 && !await page.evaluate(() => document.activeElement?.matches('.neighbours .next'))) await page.keyboard.press('Tab');
                const focus = await page.evaluate(() => { const a = document.activeElement; const s = getComputedStyle(a); return { on: a.matches('.neighbours .next:focus-visible'), outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}`, shown: a.getBoundingClientRect().top >= 0 && a.getBoundingClientRect().bottom <= innerHeight, y: scrollY }; });
                await page.keyboard.press('Enter');
                await page.waitForURL(`**/projects/${listed[index + 1]}/`).catch(() => {});
                const went = new URL(page.url()).pathname;
                const backTo = await page.evaluate(() => document.querySelector('#project-info .neighbours .prev')?.getAttribute('href') ?? '');
                await page.click('#project-info .neighbours .prev');
                await page.waitForURL(`**/projects/${slug}/`).catch(() => {});
                const home = new URL(page.url()).pathname;
                check('3. "next" takes keyboard focus where it stands, with the site\'s outline, Enter opens the next project in the Index\'s order, and that page\'s "previous" leads back',
                    focus.on && focus.shown && focus.outline === 'solid 2px rgb(153, 86, 122) 2px' && went === `/projects/${listed[index + 1]}/` && backTo === `/projects/${slug}/` && home === `/projects/${slug}/`,
                    `${JSON.stringify(focus)}; opened ${went}; its "previous" to ${backTo}; then ${home}`);
            }
            if (!detailed) check('3. a project\'s details on its page: ok (no project with photos has details; the layout checks were skipped)', true);
            else {
                const sizesTold = [];
                const wrong = [];
                for (const [width, height, step] of [[1366, 710, 17.75], [390, 844, 23.43]]) {
                    await page.setViewportSize({ width, height });
                    await open(detailed);
                    const m = await measure();
                    wrong.push(...linesOff(m, step, factsOf(detailed)).map(o => `${width} × ${height}: ${o}`));
                    if (m.lines.some(l => l.left < m.facts.left - 0.5 || l.right > m.facts.right + 0.5)) wrong.push(`${width} × ${height}: a line reaches outside the facts`);
                    sizesTold.push(`${m.lines.length} lines on ${Math.round(m.facts.height / step)} of ${step}px at ${width} × ${height}`);
                }
                check(`3. a project's details follow its years in the facts, in the facts' type: every line typed a line of its own, the lines of a block one under the other, one empty line before each block (${detailed.data.slug}: ${detailsOf(detailed).map(b => b.length).join(' + ')} lines; ${sizesTold.join(', ')})`, wrong.length === 0, wrong.slice(0, 4).join('; '));
                await page.setViewportSize({ width: 1366, height: 710 });
            }

            // Nothing snaps, and the information stays where it is while the sets pass.
            {
                const walked = multi ?? many;
                const start = await open(walked);
                const seen = [];
                const moved = [];
                for (const turn of [240, 310, 180]) {
                    const before = await lie(page);
                    await page.mouse.wheel(0, turn);
                    await rest(page);
                    const at = await lie(page);
                    seen.push(at);
                    if (Math.abs(at.y - Math.min(before.y + turn, at.max)) > 1) moved.push(`a turn of ${turn}px from ${before.y} rests at ${at.y}`);
                }
                const end = await scrollTo('end');
                const fits = start.info.height <= start.vh - 71 + 0.5;
                const stays = [...seen, ...(fits ? [end] : [])].filter(at => infoOff(at) || at.head.top !== 0 || !at.headOnTop || !near(at.prev?.left ?? 34, 34) || !near(at.prev?.bottom ?? at.vh - 26, at.vh - 26) || !near(at.next?.right ?? at.vw - 40, at.vw - 40) || !near(at.next?.bottom ?? at.vh - 26, at.vh - 26));
                check(`3. from 900px nothing snaps: a turn of the wheel leaves the page where it stops, and while the sets pass on the left the header, the information under it (its first lines at 75px) and the two words in the corners stay where they are (${walked.data.slug}, ${start.sets.length} set${start.sets.length > 1 ? 's' : ''}, scrolled to ${seen.map(at => Math.round(at.y)).join(', ')} and to the end at ${Math.round(end.y)})`,
                    start.snap === 'none' && start.position === 'sticky' && moved.length === 0 && stays.length === 0 && seen.every(at => near(at.sets[0].top, 71 - at.y, 1)) && (seen.at(-1).y > 100 || !multi),
                    start.snap !== 'none' ? `the page snaps (${start.snap})` : moved.join('; ') || stays.map(at => `at ${at.y}: ${infoOff(at) || `header ${at.head.top}, previous ${at.prev?.left}, ${at.prev?.bottom}, next ${at.next?.right}, ${at.next?.bottom}`}`).join('; ') || `the first set at ${seen.map(at => at.sets[0].top).join(', ')}`);
                // A page opened at #project-info, and the title link: the information is where it always is, so the page does not move.
                await page.goto('about:blank');
                await open(walked, '#project-info');
                await rest(page);
                const landed = await lie(page);
                await scrollTo(Math.min(300, landed.max));
                const from = await lie(page);
                await page.click('.project-head h1 a');
                await rest(page);
                const clicked = await lie(page);
                check('3. from 900px a page opened at #project-info stays at its top, and the title link leaves the page where it is: the information is in place already', landed.y === 0 && infoOff(landed) === '' && clicked.y === from.y && infoOff(clicked) === '' && new URL(page.url()).hash === '#project-info', `opened at ${landed.y}; the link at ${from.y} leaves it at ${clicked.y}; ${infoOff(landed) || infoOff(clicked)}`);
            }

            // An information taller than the window: every line of it can be reached.
            // Alone beside one short set it is what makes the page tall, and scrolls with it like any text;
            // beside sets taller than itself it stays under the header until the end of the sets takes it
            // along, and its last lines are in the window at the end of the page.
            if (longest) {
                const reach = [];
                const cases = [];
                const tallest = async (p, width, height) => {
                    await page.setViewportSize({ width, height });
                    const startAt = await open(p);
                    const m = await measure();
                    const over = Math.round(startAt.info.height - (height - 71));
                    const endAt = await scrollTo('end');
                    const last = await measure();
                    const text = Math.max(last.facts?.bottom ?? 0, last.about?.bottom ?? 0);
                    const off = [];
                    if (!near(m.paras[0].top, 75) || !near(m.lines[0].top, 75)) off.push(`its first lines at ${m.paras[0].top} and ${m.lines[0].top} when the page opens`);
                    if (endAt.y < endAt.max - 1) off.push(`the page stops at ${endAt.y} of ${endAt.max}`);
                    if (text > height - 72 + 0.5 || endAt.info.bottom > height + 0.5) off.push(`at the end of the page its text ends at ${text} and its box at ${endAt.info.bottom} in a window ${height} tall`);
                    if (over > 0 && endAt.max < over - 1) off.push(`it is ${over}px taller than the window allows and the page scrolls only ${endAt.max}px`);
                    cases.push(`${p.data.slug} at ${width} × ${height}: ${over > 0 ? `${over}px taller than its room` : 'not taller than its room'}, beside ${startAt.sets.length} set${startAt.sets.length > 1 ? 's' : ''} ${Math.round(startAt.sets.at(-1).bottom - startAt.sets[0].top)}px tall`);
                    if (off.length) reach.push(`${p.data.slug} at ${width} × ${height}: ${off.join('; ')}`);
                    return over;
                };
                const alone = await tallest(longest, 900, 600);
                let beside = 0;
                if (multi) {
                    // A window in which the information of the project with several sets is some 40px taller than its room.
                    await page.setViewportSize({ width: 900, height: 600 });
                    const tall = (await open(multi)).info.height;
                    const height = Math.max(260, Math.round(tall + 71 - 40));
                    beside = await tallest(multi, 900, height);
                    // Half way down the sets it is still under the header: that is the price, its end shows only at the end of the page.
                    const mid = await scrollTo(200);
                    if (beside > 0 && !near(mid.info.top, 71)) reach.push(`${multi.data.slug}: 200px down, the information's top is at ${mid.info.top}`);
                }
                check(`3. from 900px an information taller than the window can be read to its end: its first lines are at 75px when the page opens, and at the end of the page its last line is in the window, 72px above its lower edge or more (${cases.join('; ')})`,
                    reach.length === 0 && (alone > 0 || beside > 0), reach.join(' | ') || (alone > 0 || beside > 0 ? '' : 'no information was taller than its room: nothing was tested'));
                await page.setViewportSize({ width: 1366, height: 710 });
            }

            // The arrow keys: the set on screen, and no other. Sets are short here, so several are in the window at once.
            if (!multi) check('3. sets: ok (no multi-set project in content; the checks that need two sets were skipped)', true);
            else {
                const want = setsOf(multi);
                const title = String(multi.data.title).trim();
                const start = await open(multi);
                const wrong = [];
                if (start.sets.length !== want.length) wrong.push(`${start.sets.length} slideshows for ${want.length} sets`);
                start.sets.forEach((set, i) => {
                    const files = want[i] ?? [];
                    if (set.count !== files.length || set.files.some((f, n) => !f.startsWith(`${stem(files[n] ?? { image: '?' })}.`))) wrong.push(`set ${i + 1} holds ${set.files.join(', ')}`);
                    if (set.shown !== 1 || set.current !== 0) wrong.push(`set ${i + 1} shows ${set.shown} photos, the current one number ${set.current + 1}`);
                    if (set.label !== `Photos of ${title}, set ${i + 1} of ${want.length}`) wrong.push(`set ${i + 1} is named "${set.label}"`);
                    if (i > 0 && !near(set.top, start.sets[i - 1].bottom)) wrong.push(`set ${i + 1} starts ${set.top - start.sets[i - 1].bottom}px after the one before`);
                });
                check(`3. one slideshow per set, in set order, one directly under the other, each with its own photos and showing its first (${multi.data.slug}: ${want.map(set => set.length).join(' + ')})`, wrong.length === 0, wrong.slice(0, 4).join('; '));

                const indexes = async () => (await lie(page)).sets.map(set => set.current);
                const only = (i, n) => want.map((_, k) => (k === i ? n : 0)).join();
                // A later set with photos to move through, if there is one.
                const later = want.findIndex((set, i) => i > 0 && set.length > 1);
                if (later < 0) check('3. sets: ok (no later set with more than one photo in content; its chevron check was skipped)', true);
                else {
                    await page.evaluate(i => document.querySelectorAll('project-slides')[i].scrollIntoView({ behavior: 'instant' }), later);
                    await rest(page);
                    await page.click(`project-slides:nth-of-type(${later + 1}) .current .next`);
                    const moved = (await indexes()).join();
                    const focus = await page.evaluate(i => document.activeElement?.closest('project-slides') === document.querySelectorAll('project-slides')[i] && document.activeElement.classList.contains('arrow'), later);
                    check(`3. the "next" chevron of set ${later + 1} moves set ${later + 1} only, and keeps focus on a chevron of that set`, moved === only(later, 1) && focus, moved);
                }
                const keyed = later > 0 ? later : 1;
                await open(multi);
                await page.evaluate(i => document.querySelectorAll('project-slides')[i].scrollIntoView({ behavior: 'instant' }), keyed);
                await rest(page);
                await page.keyboard.press('ArrowRight');
                const right = (await indexes()).join();
                await page.keyboard.press('ArrowLeft');
                const left = (await indexes()).join();
                await scrollTo(0);
                await page.keyboard.press('ArrowRight');
                const first = (await indexes()).join();
                await page.keyboard.press('ArrowLeft');
                await scrollTo('end');
                await page.keyboard.press('ArrowRight');
                const last = (await indexes()).join();
                check(`3. at 1366 × 710, where several sets are in the window at once, the arrow keys move the set that has the most of the window and no other: set ${keyed + 1} when it is under the header, the first at the top of the page, the last at its end`,
                    right === only(keyed, Math.min(1, want[keyed].length - 1)) && left === only(-1, 0) && first === only(0, Math.min(1, want[0].length - 1)) && last === only(want.length - 1, Math.min(1, want.at(-1).length - 1)), `${right} then ${left}; at the top ${first}; at the end ${last}`);
            }
            // A set that ends above the middle of the window (a very wide photo) still has the keys.
            {
                const flat = [...readFileSync(join(dist, 'client/slides.css'), 'utf8').matchAll(/#slides-(.+)-1 \.slide:nth-child\((\d+)\)\{--a:([\d.]+)\}/g)]
                    .map(m => ({ slug: m[1], n: Number(m[2]), a: Number(m[3]) })).filter(f => published.some(p => p.data.slug === f.slug && setsOf(p).length === 1 && firstSet(p).length > 1)).sort((x, y) => y.a - x.a)[0];
                if (!flat || flat.a < 2.5) check('3. the keys on a short set: ok (no one-set project has a photo two and a half times as wide as tall; the check was skipped)', true);
                else {
                    await page.goto(`${base}/projects/${flat.slug}/`);
                    await slidesReady(page);
                    await page.evaluate(i => document.querySelector('project-slides').setState({ index: i }), flat.n - 1);
                    const at = await lie(page);
                    const to = flat.n > 1 ? 'ArrowLeft' : 'ArrowRight';
                    await page.keyboard.press(to);
                    const after = (await lie(page)).sets[0].current;
                    check(`3. a set that ends above the middle of the window still answers the arrow keys (${flat.slug}, photo ${flat.n}, ${flat.a} : 1: the set ends at ${Math.round(at.sets[0].bottom)}px in a window 710px tall)`, at.sets[0].bottom < (71 + 710) / 2 && after === flat.n - 1 + (to === 'ArrowLeft' ? -1 : 1), `photo ${after + 1} after ${to}`);
                }
            }

            // A project with no photos: the information where it would be, in the right half; nothing on the left; the page no taller than the window, or than its text.
            if (bare ?? longest) {
                const wrong = [];
                for (const [width, height] of [[1366, 710], [390, 844]]) {
                    await page.setViewportSize({ width, height });
                    const at = await openBare();
                    const d = pageOf(width);
                    const tall = at.max + at.vh;
                    const end = at.y + at.info.bottom;
                    if (at.y !== 0) wrong.push(`${width} × ${height}: the page comes to rest ${at.y}px down`);
                    if (Math.abs(tall - Math.max(at.vh, end)) > 1) wrong.push(`${width} × ${height}: the page is ${tall}px tall, the window ${at.vh}px, and the information ends at ${end}`);
                    if (!near(at.info.top, at.head.bottom)) wrong.push(`${width} × ${height}: the information's top at ${at.info.top}, the header to ${at.head.bottom}`);
                    if (d.wide ? !near(at.info.left, width / 2 + 8.5) || !near(at.info.right, width - 34) : !near(at.info.left, 0) || !near(at.info.right, width)) wrong.push(`${width} × ${height}: the information from ${at.info.left} to ${at.info.right}`);
                    if (d.wide && infoOff(at)) wrong.push(`${width} × ${height}: ${infoOff(at)}`);
                    // In one column it is as tall as its text and no taller: under a header of two lines a
                    // screen's worth of minimum height would be more than the window has left.
                    const least = await page.evaluate(() => getComputedStyle(document.querySelector('#project-info')).minHeight);
                    if (least !== '0px') wrong.push(`${width} × ${height}: the information is at least ${least} tall, whatever its text`);
                    if (at.wide > width) wrong.push(`${width} × ${height}: the page is ${at.wide}px wide`);
                }
                check(`3. a project with no photos: at 1366 × 710 the information is where it always is, the right half of the page under the header, and the left half is empty; at 390 × 844 it follows the header; either way it is as tall as its text and the page no taller than the window or than that (${bare ? bare.data.slug : `${longest.data.slug}, its sets taken out`})`, wrong.length === 0, wrong.join('; '));
            }

            // --- Below 900px: the page opens on the photo and its caption, which fill the first screen; the
            // information comes after the sets, in one column; with a mouse or trackpad the page snaps from
            // set to set and then to the information.
            await page.setViewportSize({ width: 390, height: 844 });
            if (oneSet) {
                const at = await open(oneSet);
                const off = [offDesign(at.sets[0], at), await headOff(at)].filter(Boolean).join('; ');
                check(`3. at 390 × 844 a project page opens on its photo and caption, which fill the window under the 95px header: the photo in the middle of the page, 24px from its edges at most, the caption under it between the two chevrons, which are at the page's edges; the information starts below the window (${oneSet.data.slug})`,
                    at.sets.length === 1 && off === '' && near(at.sets[0].top, 95) && at.sets[0].height >= at.vh - 95 - 0.5 && at.info.top >= at.vh - 0.5 && at.y === 0, off || `${at.sets.length} set from ${at.sets[0].top}, ${at.sets[0].height} tall; the information from ${at.info.top}; the page at ${at.y}`);
            }
            for (const [width, height] of [[390, 844], [320, 640], [899, 700]]) {
                const { wrong, tally } = await sweep(width, height);
                check(`3. at ${width} × ${height} every project page opens at its top with its photo under the header, not behind it (${tally.wrapped} with a title of two lines), and every photo of every project is as large as fits the page less 24px on either side and the window under the header less the caption's room, the side that limits it exactly on its limit, in the middle of the page, without a border, the shadow around it, its picture over the whole box; its caption is between the two chevrons at the page's edges, and nothing lies over anything else or reaches outside the page; its sizes attribute gives its width to the pixel (${told(tally)})`,
                    wrong.length === 0 && tally.photos === published.reduce((n, p) => n + photos(p).length, 0), wrong.slice(0, 3).join(' | '));
            }
            await page.setViewportSize({ width: 390, height: 844 });
            // The chevrons are 26px wide, at the page's edges: a finger has 44px, the rest of it in the page's margin.
            if (many && firstSet(many).length > 2) {
                await open(many);
                await page.keyboard.press('ArrowRight');
                const reach = await page.evaluate(() => [...document.querySelectorAll('project-slides:first-of-type .slide.current .arrow')].map((button) => {
                    const r = button.getBoundingClientRect();
                    const left = button.classList.contains('prev');
                    const zone = getComputedStyle(button, '::before');
                    const at = (x) => button.contains(document.elementFromPoint(x, r.top + r.height / 2));
                    return {
                        side: left ? 'left' : 'right',
                        column: [r.width, r.height],
                        // The room it adds: a box 44px wide over the column's whole height, from the column's inner edge outwards.
                        zone: `${zone.position} ${zone.width} from ${left ? zone.right : zone.left}, ${zone.top} to ${zone.bottom}`,
                        beside: at(left ? r.left - 12 : r.right + 12),
                        beyond: at(left ? r.left - 24 : r.right + 24),
                        inside: at(left ? r.right + 6 : r.left - 6),
                    };
                }));
                check('3. at 390px a chevron can be tapped 44px wide and 44px tall: its 26px column and 18px of the page\'s margin beside it, and no more',
                    reach.length === 2 && reach.every(c => near(c.column[0], 26) && near(c.column[1], 44) && c.zone === 'absolute 44px from 0px, 0px to 0px' && c.beside && !c.beyond && !c.inside), JSON.stringify(reach));
            }

            // Set by set, then the information: where the page rests, and what the header does meanwhile.
            const walked = multi ?? oneSet;
            if (walked) {
                const start = await open(walked);
                const stops = [];
                const header = [];
                const frames = [];
                const early = [];
                const note = (at, i) => {
                    if (at.head.top !== 0 || !at.headOnTop) header.push(`at ${at.y}: header top ${at.head.top}, back and title ${at.headOnTop ? 'on top' : 'covered'}`);
                    if (i < at.sets.length) {
                        if (Math.abs(at.sets[i].top - at.head.bottom) > 1) stops.push(`set ${i + 1} rests at ${at.sets[i].top}, header to ${at.head.bottom}`);
                        const off = offDesign(at.sets[i], at);
                        if (off) frames.push(`set ${i + 1}: ${off}`);
                        if (at.info.top < at.vh - 0.5) early.push(`set ${i + 1} at rest: the information starts at ${at.info.top} in a window ${at.vh} tall`);
                    } else if (infoOff(at)) stops.push(infoOff(at));
                };
                note(start, 0);
                for (let i = 1; i <= start.sets.length; i++) note(await wheel(), i);
                const end = await lie(page);
                const back = await wheel(false);
                if (Math.abs(back.sets.at(-1).top - back.head.bottom) > 1) stops.push(`back up: the last set rests at ${back.sets.at(-1).top}`);
                check(`3. below 900px, after a turn of the wheel the page rests with the next set directly under the header, and after the last set with the information, its top 9px under the header at 104px (390 × 844; ${walked.data.slug}, ${start.sets.length} set${start.sets.length > 1 ? 's' : ''})`, start.mouse && start.snap.includes('mandatory') && stops.length === 0, start.mouse ? stops.join('; ') || start.snap : 'this browser has no fine pointer: the page does not snap');
                check('3. nothing of the information is in the window while a set of photos is at rest', early.length === 0, early.join('; '));
                check('3. the header stays at the top of the window while the page scrolls, back and the title on top', header.length === 0 && end.y > 0, header.join('; '));
                check('3. each set at rest fills the window under the header: the photo directly under it, as large as fits, in the middle of the page, the caption and the chevrons in the row under it', frames.length === 0, frames.join('; '));
                // The header's own links are always in the window: reaching them with the keyboard must not move the
                // page (they lie in the band that html's scroll-padding calls out of view), and the browser's Back
                // after the title link returns to the set the visitor was on.
                await open(walked);
                await page.keyboard.press('End');
                await rest(page);
                const stood = await page.evaluate(() => scrollY);
                const tabbed = [];
                for (let i = 0; i < 2; i++) {
                    await page.keyboard.press('Tab');
                    await rest(page);
                    tabbed.push(await page.evaluate(() => `${document.activeElement?.closest('.project-head') ? 'a header link' : 'elsewhere'} at ${scrollY}`));
                }
                check('3. the keyboard reaching back and the title in the header does not move the page', stood > 0 && tabbed.every(t => t === `a header link at ${stood}`), `at ${stood}; then ${tabbed.join(', ')}`);
                if (start.sets.length > 1) {
                    await open(walked);
                    const second = await wheel();
                    await page.click('.project-head h1 a');
                    await rest(page);
                    const there = await page.evaluate(() => scrollY);
                    await page.goBack();
                    await rest(page);
                    const returned = await page.evaluate(() => scrollY);
                    check('3. the browser\'s Back after the title link returns to the set the visitor was on', there > second.y && Math.abs(returned - second.y) <= 1, `on set 2 at ${second.y}, the title link to ${there}, Back to ${returned}`);
                }
            }
            if (multi) {
                const want = setsOf(multi);
                const indexes = async () => (await lie(page)).sets.map(set => set.current);
                const only = (i, n) => want.map((_, k) => (k === i ? n : 0)).join();
                const later = want.findIndex((set, i) => i > 0 && set.length > 1);
                const keyed = later > 0 ? later : 1;
                await open(multi);
                await page.evaluate(i => document.querySelectorAll('project-slides')[i].scrollIntoView({ behavior: 'instant' }), keyed);
                await rest(page);
                await page.keyboard.press('ArrowRight');
                const right = (await indexes()).join();
                await page.keyboard.press('ArrowLeft');
                const left = (await indexes()).join();
                check(`3. at 390 × 844, with set ${keyed + 1} in the window the arrow keys move that set and no other`, right === only(keyed, Math.min(1, want[keyed].length - 1)) && left === only(-1, 0), `${right} then ${left}`);
                await scrollTo(0);
                await rest(page);
                await page.keyboard.press('ArrowRight');
                const first = (await indexes()).join();
                await page.click('.project-head h1 a');
                await rest(page);
                const there = await lie(page);
                const address = page.url();
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowLeft');
                await page.waitForTimeout(100);
                const after = (await indexes()).join();
                check('3. back at the top the keys move the first set; with the information in the window they move nothing and lead nowhere', first === only(0, Math.min(1, want[0].length - 1)) && infoOff(there) === '' && after === first && page.url() === address, `${first} then ${after}; ${infoOff(there)}; ${page.url()}`);
            }

            // The information in one column.
            if (whole) {
                const slug = whole.data.slug;
                const d = pageOf(390);
                await open(whole);
                await page.click('.project-head h1 a');
                await rest(page);
                const at = await lie(page);
                const m = await measure();
                const lines = linesOff(m, 23.43, factsOf(whole));
                const index = listed.indexOf(slug);
                check(`3. at 390 × 844 the information is one column, 24px from the page's edges: the facts, 24px under them the description, 40px under that the words "previous" at the left and "next" at the right, in the flow of the page; 16.5px type, the description on a 20px line, the facts on one of 23.43px (1.42) (${slug})`,
                    infoOff(at) === '' && near(m.facts.left, 24) && near(m.facts.right, 390 - 24) && near(m.lines[0].top, m.info.top + 8) && near(m.about.left, 24) && m.about.right <= 390 - 24 + 0.5 && near(m.about.top - m.facts.bottom, 24)
                    && at.prev && at.next && at.prev.position === 'static' && at.next.position === 'static' && near(at.prev.top - m.about.bottom, 40) && near(at.prev.top, at.next.top) && near(at.prev.left, 24) && near(at.next.right, 390 - 24) && near(at.prev.height, 12 + 20 + 12)
                    && at.prev.text === 'previous' && at.next.text === 'next' && at.prev.href === `/projects/${listed[index - 1]}/` && at.next.href === `/projects/${listed[index + 1]}/` && at.prev.type === d.text && at.prev.colour === 'rgb(128, 114, 121)'
                    && lines.length === 0 && m.types.facts === d.facts && m.types.text === d.text && m.labels === 'type: 700, role: 700, for: 700' && m.heavy === 0,
                    JSON.stringify({ rest: infoOff(at), facts: [m.facts.left, m.facts.right, m.lines[0].top - m.info.top], about: [m.about.left, m.about.right, m.about.top - m.facts.bottom], prev: at.prev && [at.prev.left, at.prev.top - m.about.bottom, at.prev.height, at.prev.position, at.prev.type], next: at.next && [at.next.right, at.next.top - m.about.bottom], lines, types: m.types, labels: m.labels }));

                // The two layouts meet at 900px; no width has a horizontal scroll, and the two words are inside the page.
                const widths = [];
                const shape = {};
                for (const width of [320, 360, 390, 600, 719, 720, 899, 900, 1024]) {
                    await page.setViewportSize({ width, height: 700 });
                    for (const p of [whole, published.find(q => q.data.slug === listed[0]), published.find(q => q.data.slug === listed.at(-1))]) {
                        await page.goto(`${base}/projects/${p.data.slug}/#project-info`);
                        await page.waitForTimeout(30);
                        const n = { ...await measure(), ...await page.evaluate(() => ({ words: [...document.querySelectorAll('#project-info .neighbours a')].map((a) => { const r = a.getBoundingClientRect(); return [r.left, r.right]; }) })) };
                        if (n.wide > width) widths.push(`${p.data.slug} at ${width}px: ${n.wide}px wide`);
                        if (n.words.some(([from, to]) => from < 0 || to > width)) widths.push(`${p.data.slug} at ${width}px: a word outside the page`);
                        if (p === whole) shape[width] = n;
                    }
                }
                check('3. no horizontal scroll on a project page at 320, 360, 390, 600, 719, 720, 899, 900 or 1024px, "previous" and "next" inside the page (a project with both, the first and the last)', widths.length === 0, widths.slice(0, 4).join('; '));
                const one = (n) => n.about.top >= n.facts.bottom && near(n.about.left, n.facts.left) && near(n.facts.left, 24) && n.position !== 'sticky';
                const two = (n) => near(n.about.left, n.centre + 8.5) && n.facts.left > n.about.right && near(n.about.top, n.facts.top) && n.position === 'sticky';
                check('3. the information is beside the photos from 900px, the description left of the facts, and after them in one column below, where the description is at most 460px wide',
                    two(shape[900]) && two(shape[1024]) && [899, 720, 719, 390, 320].every(w => one(shape[w])) && near(shape[899].about.width, 460) && near(shape[720].about.width, 460) && shape[390].about.width <= 342.5
                    && near(shape[900].about.width, (900 - 85) / 2 / 2 - 10) && near(shape[900].facts.width, (900 - 85) / 2 / 2 - 10) && near(shape[1024].about.width, (1024 - 85) / 2 / 2 - 10),
                    [1024, 900, 899, 720, 390].map(w => `${w}: facts from ${shape[w].facts.left}, description from ${shape[w].about.left}, ${shape[w].about.width} wide, ${shape[w].about.top - shape[w].facts.bottom} under them`).join('; '));
                await page.setViewportSize({ width: 390, height: 844 });
            }

            // A long information section is taller than a small window: all of it can be reached.
            if (longest) {
                await page.setViewportSize({ width: 720, height: 500 });
                await open(longest);
                // Here the page could scroll further than the section's top, so the link has to stop there itself.
                await page.click('.project-head h1 a');
                await rest(page);
                const linked = await lie(page);
                check('3. below 900px the title lands a long information section at rest, its top 9px under the header at 104px (720 × 500)', infoOff(linked) === '' && linked.y > 0, `the information's top at ${linked.info.top}, ${Math.round(linked.max - linked.y)}px left to scroll`);
                await scrollTo(0);
                await rest(page);
                let at = await lie(page);
                for (let i = 0, last = -1; i < 60 && at.y !== last; i++) { last = at.y; at = await wheel(); }
                const taller = at.info.height > at.vh - restAt(at) + 1;
                const reached = at.y >= at.max - 1 && at.info.bottom <= at.vh + 1;
                // Inside a section taller than the window the page scrolls freely: a small turn back stays where it stops.
                let free = true;
                if (taller && at.info.height - (at.vh - restAt(at)) > 90) {
                    await page.mouse.wheel(0, -60);
                    await rest(page);
                    const inside = await lie(page);
                    free = Math.abs(inside.y - (at.y - 60)) <= 1;
                }
                check(`3. the bottom of the longest information section can be reached by wheel at 720 × 500, and it scrolls freely inside (${longest.data.slug}: ${Math.round(at.info.height)}px${taller ? '' : ', not taller than the window'})`, reached && free, `rests at ${at.y} of ${at.max}, the section ends at ${at.info.bottom}`);
                // Page Up from the bottom of a section taller than the window stops at the section's top, as the
                // wheel does, instead of passing it and landing on the photos.
                if (taller) {
                    let up = at;
                    for (let i = 0; i < 8 && (i === 0 || up.info.top < restAt(up) - 1); i++) { await page.keyboard.press('PageUp'); await rest(page); up = await lie(page); }
                    check('3. Page Up through a long information section stops with its top at rest, not on the photos (720 × 500)', infoOff(up) === '', `the information's top at ${up.info.top}`);
                }

                // A page opened at #project-info (a link from elsewhere, an address): the browser sets off
                // for the information before the sets are defined, the page then gets shorter, and the page's
                // script lands it again. On the project with the most to read, whose information is taller
                // than the window: a scroll that only stopped at the end of the page would leave its first
                // lines under the header.
                const landed = [];
                for (const [width, height] of [[720, 500], [390, 844]]) {
                    await page.setViewportSize({ width, height });
                    await page.goto('about:blank');
                    await page.goto(`${base}/projects/${longest.data.slug}/#project-info`);
                    await slidesReady(page);
                    await rest(page);
                    const here = await lie(page);
                    landed.push({ width, height, off: infoOff(here), over: Math.round(here.info.height - (here.vh - restAt(here))) });
                }
                check(`3. below 900px a project page opened at #project-info comes to rest as after the title link, the information's top at 104px (720 × 500 and 390 × 844; ${longest.data.slug}, its information ${landed.map(l => `${Math.max(0, l.over)}px`).join(' and ')} taller than the window allows)`,
                    landed.every(l => l.off === ''), landed.filter(l => l.off).map(l => `at ${l.width} × ${l.height}: ${l.off}`).join('; '));
            }

            // Where a title wraps (the longest one, at 320px) the header is a line taller, 112px for 95px.
            // The information still rests with its first line clear of it: that is what its 9px are for.
            {
                const wordy = published.filter(p => photos(p).length && factsOf(p).length).sort((a, b) => text(b.data.title).length - text(a.data.title).length)[0];
                if (wordy) {
                    await page.setViewportSize({ width: 320, height: 568 });
                    await page.goto('about:blank');
                    await page.goto(`${base}/projects/${wordy.data.slug}/`);
                    await slidesReady(page);
                    await page.evaluate(() => document.fonts.ready.then(() => true));
                    await page.mouse.move(160, 300);
                    await rest(page);
                    const opened = await lie(page);
                    await page.click('.project-head h1 a');
                    await rest(page);
                    const at = await lie(page);
                    const first = await page.evaluate(() => document.querySelector('#project-info .facts p').getBoundingClientRect().top);
                    check(`3. at 320px the title link leaves the information's first line clear of the header, also where the title takes two lines; and when such a page opens it stays at its top, its photo under the taller header, not behind it, though the page snaps (${wordy.data.slug}: the header is ${at.head.bottom}px tall, the first line starts at ${first}px)`,
                        infoOff(at) === '' && at.head.bottom > 95 + 1 && first >= at.head.bottom - 0.5 && opened.snap.includes('mandatory') && opened.y === 0 && opened.sets[0].frame.top >= opened.head.bottom - 0.5, `${infoOff(at)}; header to ${at.head.bottom}, first line at ${first}; on opening the page rests at ${opened.y} (${opened.snap}), the photo from ${opened.sets[0].frame.top}, the header to ${opened.head.bottom}`);
                }
            }

            // The type, on every project page and on the 404 page, in both layouts: every piece of text that
            // shows is one of the sizes its place has, and nothing is Bold but the title, the facts' labels and **bold** in content.
            {
                const wrong = [];
                let pieces = 0;
                let captions = 0;
                for (const [width, height] of [[390, 844], [800, 700], [1366, 710]]) {
                    await page.setViewportSize({ width, height });
                    const d = pageOf(width);
                    const bare = (t) => t.replace(/ \/ \d+$/, '');
                    for (const path of ['/404.html', ...published.map(p => `/projects/${p.data.slug}/`)]) {
                        await page.goto(base + path);
                        const found = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getClientRects().length && [...el.childNodes].some(n => n.nodeType === 3 && n.data.trim()) && !el.closest('.visually-hidden')).map((el) => {
                            const s = getComputedStyle(el);
                            const kind = el.closest('.caption') ? 'caption' : el.closest('.project-head h1') ? 'title' : el.closest('.back') ? 'back' : el.closest('.facts') ? 'facts' : 'text';
                            const weight = el.closest('.label, strong, .project-head h1') ? '700' : '300';
                            return `${kind} ${s.fontSize} / ${s.lineHeight}${s.fontWeight === weight ? '' : ` in weight ${s.fontWeight}`}`;
                        }));
                        const allowed = path === '/404.html' ? [`back ${bare(plainType(width))}`, `text ${bare(plainType(width))}`] : [`title ${bare(d.title)}`, `back ${bare(d.back)}`, `facts ${bare(d.facts)}`, `text ${bare(d.text)}`, `caption ${bare(d.caption)}`];
                        const off = [...new Set(found)].filter(t => !allowed.includes(t));
                        pieces += found.length;
                        captions += found.filter(t => t.startsWith('caption ')).length;
                        if (off.length) wrong.push(`${path} at ${width}px: ${off.slice(0, 3).join(', ')}`);
                    }
                }
                const [n, w] = [pageOf(390), pageOf(1366)];
                check(`3. the type on every project page: below 900px the title ${n.title.replace(' / 700', '')} Bold, back the same Light, the description ${n.text.replace(' / 300', '')}, the facts on a line of 1.42 (${n.facts.split(' / ')[1]}), a caption ${n.caption.replace(' / 300', '')}; from 900px ${w.title.replace(' / 700', '')}, ${w.text.replace(' / 300', '')}, ${w.facts.split(' / ')[1]} and ${w.caption.replace(' / 300', '')}; all Light but the title, the facts' labels and bold in content; the 404 page in the body's own type, ${plainType(390).replace(' / 300', '')} below 720px and ${plainType(1366).replace(' / 300', '')} from there (at 390, 800 and 1366px: ${pieces} pieces of text, ${captions} of them captions)`,
                    wrong.length === 0 && captions > 0, wrong.slice(0, 4).join(' | '));
            }
            // The 404 page keeps its layout: back where the page's padding puts it, the words 55px under it.
            {
                const wrong = [];
                for (const [width, height] of [[390, 844], [1366, 710]]) {
                    await page.setViewportSize({ width, height });
                    await page.goto(`${base}/404.html`);
                    const m = await page.evaluate(() => {
                        const back = document.querySelector('.back');
                        const link = back.querySelector('a');
                        const words = document.querySelector('.not-found h1');
                        return { left: back.getBoundingClientRect().left, top: back.getBoundingClientRect().top, bottom: back.getBoundingClientRect().bottom, word: link.textContent, href: link.getAttribute('href'), colour: getComputedStyle(link).color, lean: getComputedStyle(link).transform, under: words.getBoundingClientRect().top, at: words.getBoundingClientRect().left, text: words.textContent.trim(), wide: document.documentElement.scrollWidth, tall: document.documentElement.scrollHeight };
                    });
                    const side = width >= 720 ? 37 : 16;
                    if (Math.abs(m.left - side) > 0.5 || Math.abs(m.top - 42) > 0.5 || Math.abs(m.at - side) > 0.5 || Math.abs(m.under - m.bottom - 55) > 0.5) wrong.push(`${width}px: back at ${m.left}, ${m.top}; the words at ${m.at}, ${m.under - m.bottom} under it`);
                    if (m.word !== 'back' || m.href !== '/' || m.colour !== 'rgb(128, 114, 121)' || !/^matrix\(1, 0, 0\.105\d*, 1, 0, 0\)$/.test(m.lean) || !m.text) wrong.push(`${width}px: "${m.word}" to ${m.href}, ${m.colour}, ${m.lean}; "${m.text}"`);
                    if (m.wide > width || m.tall > height) wrong.push(`${width}px: the page is ${m.wide} × ${m.tall}`);
                }
                check('the 404 page keeps its layout: back 42px down and 16px in (37px from 720px), in the tag colour, Light, leaning backwards, a link to the home page; the page\'s words 55px under it; nothing to scroll', wrong.length === 0, wrong.join('; '));
            }
            // The font files a page fetches ahead (<link rel="preload"> in shared/pages/base.html) are the ones its text is drawn
            // with, no more and no fewer: a face nothing on the page uses is 115 kB fetched for nothing (the 404 page, whose
            // words are all Light since 26 Nov 2026, preloaded Bold), and one that is used and not preloaded comes late. Read in
            // the page: the files the stylesheet's @font-face rules name (the two faces that take the apostrophe from a system
            // font name none), and which of those faces the browser has loaded once the page's fonts are ready.
            {
                const kinds = [['/', 'the home page'], [`/projects/${(many ?? published[0]).data.slug}/`, 'a project page'], ...(single ? [[`/projects/${single.data.slug}/`, 'a project page with one photo']] : []), ...SHEET_PAGES.map(sh => [`/${sh.name}/`, sh.title]), ['/404.html', 'the 404 page']];
                const wrong = [];
                const told = new Map();
                for (const [width, height] of [[390, 844], [1366, 710]]) {
                    await page.setViewportSize({ width, height });
                    for (const [path, name] of kinds) {
                        await page.goto(base + path);
                        const f = await page.evaluate(async () => {
                            await document.fonts.ready;
                            const file = {};
                            for (const sheet of document.styleSheets) {
                                for (const rule of sheet.cssRules) {
                                    if (!(rule instanceof CSSFontFaceRule)) continue;
                                    const url = rule.style.getPropertyValue('src').match(/url\(["']?([^"')]+\.woff2)["']?\)/);
                                    if (url) file[`${rule.style.getPropertyValue('font-family').replace(/["']/g, '')} ${rule.style.getPropertyValue('font-weight')}`] = new URL(url[1], sheet.href).pathname;
                                }
                            }
                            const name = (face) => `${face.family.replace(/["']/g, '')} ${face.weight}`;
                            return {
                                ahead: [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(l => new URL(l.href).pathname).sort(),
                                // A face with a file of its own covers every character; the apostrophe's two cover three.
                                used: [...new Set([...document.fonts].filter(face => face.status === 'loaded' && face.unicodeRange === 'U+0-10FFFF' && file[name(face)]).map(face => file[name(face)]))].sort(),
                                files: Object.keys(file).length,
                            };
                        });
                        told.set(name, f.ahead.map(a => a.split('/').pop().replace(/^FluxischElse-|\.woff2$/g, '')).join(' and ') || 'none');
                        if (f.files < 2 || f.ahead.join() !== f.used.join()) wrong.push(`${path} at ${width}px preloads ${f.ahead.join(', ') || 'nothing'} and draws its text with ${f.used.join(', ') || 'nothing'}`);
                    }
                }
                check(`a page fetches ahead exactly the font files its text is drawn with, at 390 and 1366px (${[...told].map(([name, files]) => `${name}: ${files}`).join('; ')})`, wrong.length === 0 && told.size === kinds.length, wrong.slice(0, 4).join(' | '));
            }
            // "back" is a word 28 to 37px wide and 15 to 20px tall: little to aim a finger at. The link answers 12px beyond the
            // word on either side and over a height of 44px, by an unseen box of its own (`.back a::before` in client/site.css), as
            // a chevron does below 900px; the word, its place and its focus ring are what they were. Asked of the page, point by
            // point: which element is there. The link leans (6°), and its box with it: the points are taken with room for that.
            {
                const kinds = [[`/projects/${(many ?? published[0]).data.slug}/`, 'a project page'], ...SHEET_PAGES.slice(0, 1).map(sh => [`/${sh.name}/`, sh.title]), ['/404.html', 'the 404 page']];
                const small = [];
                let asked = 0;
                for (const [width, height] of [[390, 844], [1366, 710]]) {
                    await page.setViewportSize({ width, height });
                    for (const [path, name] of kinds) {
                        await page.goto(base + path);
                        await page.evaluate(() => document.fonts.ready.then(() => true));
                        const m = await page.evaluate(() => {
                            const a = document.querySelector('.back a');
                            const b = a.getBoundingClientRect();
                            const mine = (x, y) => { const el = document.elementFromPoint(x, y); return Boolean(el) && (el === a || a.contains(el)); };
                            const [cx, cy] = [b.left + b.width / 2, b.top + b.height / 2];
                            const area = { left: b.left - 12, right: b.right + 12, top: cy - 22, bottom: cy + 22 };
                            const others = [...document.querySelectorAll('a, button')].filter(el => el !== a && el.getClientRects().length).map(el => el.getBoundingClientRect());
                            const head = document.querySelector('.project-head');
                            return {
                                word: `${Math.round(b.width * 10) / 10} × ${Math.round(b.height * 10) / 10}`,
                                // Inside the area on every side, and outside it on every side.
                                answers: [[b.left - 9, cy], [b.right + 9, cy], [cx, cy - 20], [cx, cy + 20], [cx, cy]].every(([x, y]) => mine(x, y)),
                                beyond: [[b.left - 16, cy], [b.right + 16, cy], [cx, cy - 25], [cx, cy + 25]].some(([x, y]) => mine(x, y)),
                                over: others.filter(o => o.left < area.right && area.left < o.right && o.top < area.bottom && area.top < o.bottom).length,
                                under: head ? area.bottom <= head.getBoundingClientRect().bottom : true,
                                wide: document.documentElement.scrollWidth,
                            };
                        });
                        asked++;
                        if (!m.answers || m.beyond || m.over || !m.under || m.wide > width) small.push(`${name} at ${width}px: "back" (${m.word}) ${m.answers ? 'answers' : 'does not answer'} 9px beside the word and 20px above and below its middle${m.beyond ? ', and still does 16px beside it or 25px above or below' : ''}${m.over ? `; its area lies over ${m.over} other link or button` : ''}${m.under ? '' : '; its area reaches below the header'}${m.wide > width ? `; the page is ${m.wide}px wide` : ''}`);
                    }
                }
                check(`"back" can be aimed at: the link answers 12px beyond the word on either side and over 44px of height, on no other link or button and inside the header, on a project page, a page of text and the 404 page at 390 and 1366px (${asked} places)`, small.length === 0 && asked === 2 * kinds.length, small.slice(0, 4).join(' | '));
            }
            // 3. A project page with one photo snaps without a script, from the first moment (below 900px, with a mouse).
            // Its set must be a block there even before its own stylesheet (components/project-slides.css) has
            // arrived: laid out without it, a custom element is an inline box, which is no place to snap to; the
            // information is then the only one, and when the stylesheet comes in Chromium scrolls the page to the
            // information by itself (about one load in fifty did, measured; here the page is laid out each time
            // another stylesheet arrives and the set's own is held back until that has happened with
            // client/project.css there, and 300ms more, and every load did). client/project.css, which turns
            // snapping on, therefore makes the set a block itself.
            // The stylesheet waits for the page's word, not for a fixed time: held back for 300ms from its request,
            // as it first was, it came in before client/project.css whenever that one took longer (0 of 10 loads
            // were then laid out without it, with client/project.css 400ms slow), and the check had tried nothing.
            {
                const lone = published.filter(p => photos(p).length === 1).slice(0, 3);
                const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
                const late = await context.newPage();
                let laidOut = false;
                let wake = () => {};
                await late.exposeFunction('__laidOutEarly', () => { laidOut = true; wake(); });
                await late.route('**/components/project-slides.css', async (route) => {
                    // At most 15s, so that a page that never gets there ends the check instead of hanging it.
                    if (!laidOut) await new Promise(r => { const t = setTimeout(r, 15000); wake = () => { clearTimeout(t); r(); }; });
                    await new Promise(r => setTimeout(r, 300));
                    await route.continue();
                });
                await late.addInitScript(() => {
                    window.__early = [];
                    // Reading a box lays the page out with the stylesheets that are there by then.
                    const look = () => {
                        const set = document.querySelector('project-slides');
                        if (!set) return;
                        const waiting = [...document.querySelectorAll('link[rel=stylesheet]')].filter(l => !l.sheet).map(l => l.getAttribute('href').split('/').pop());
                        window.__early.push({ waiting: waiting.join(), set: getComputedStyle(set).display, top: set.getBoundingClientRect().top, snap: getComputedStyle(document.documentElement).scrollSnapType });
                        if (waiting.includes('project-slides.css') && !waiting.includes('project.css')) window.__laidOutEarly();
                    };
                    document.addEventListener('readystatechange', () => {
                        if (document.readyState !== 'interactive') return;
                        look();
                        for (const l of document.querySelectorAll('link[rel=stylesheet]')) if (!l.sheet) l.addEventListener('load', look);
                    });
                });
                const wrong = [];
                let early = 0;
                let snaps = true;
                for (const p of lone) {
                    laidOut = false;
                    await late.goto(`${base}/projects/${p.data.slug}/`);
                    await late.evaluate(() => document.fonts.ready.then(() => true));
                    const y = await rest(late);
                    const seen = (await late.evaluate(() => window.__early)).filter(e => e.snap !== 'none' && /project-slides\.css/.test(e.waiting));
                    snaps = await late.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType !== 'none');
                    if (seen.length) early++;
                    if (y !== 0 || seen.some(e => e.set !== 'block')) wrong.push(`${p.data.slug}: rests at ${y}; laid out without its stylesheet the set is ${seen[0]?.set ?? 'not seen'}`);
                }
                await context.close();
                if (!lone.length) check('3. a one-photo page whose set\'s stylesheet arrives late: ok (no project in content has exactly one photo; the check was skipped)', true);
                else if (!snaps) check('3. a one-photo page whose set\'s stylesheet arrives late: ok (this browser has no mouse, so the page does not snap; the check was skipped)', true);
                else check(`3. a project page with one photo stays at its top when its set's stylesheet arrives late and the page is laid out before it is there: the set is a block already, a place to snap to, so the page does not scroll to the information by itself (390 × 844; ${lone.map(p => p.data.slug).join(', ')}; laid out while it snapped and the stylesheet was still on its way in ${early} of ${lone.length} loads)`, wrong.length === 0 && early === lone.length, wrong.join(' | ') || (early === lone.length ? '' : 'the page was not laid out before the stylesheet came in every load: the check tried nothing there'));
            }
            // 3. From 900px, until the slideshow's script has run. The photos of a set are then one under the other (as with
            // JavaScript off), and from 900px a slide is only as tall as its photo and the row under it: so the second photo
            // stood in the first window, under the first, and vanished when the script arrived (on 15 of the 21 pages with
            // several photos at 1366 × 710, measured: for half a second on a fast connection, for seconds on a slow one).
            // While a set of several photos waits for its script, its first slide is therefore as tall as the window under
            // the header, as it is below 900px (components/project-slides.css, where scripting is enabled): nothing of a
            // photo the script will hide is in the window, and the first photo is exactly where the script shows it. The
            // script is held back here until the page has been measured without it; a load in which it was there already
            // tried nothing and fails the check. (With JavaScript off no script is waited for and the photos follow each
            // other directly: that state has its own check further down.)
            {
                const waiting = published.filter(scripted);
                const flashed = [];
                let held = 0;
                for (const [width, height] of [[1366, 710], [900, 600]]) {
                    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
                    const early = await context.newPage();
                    let let_in = false;
                    let wake = () => {};
                    await early.route('**/client/project.js', async (route) => {
                        if (!let_in) await new Promise(r => { wake = r; });
                        await route.continue();
                    });
                    // Every photo that shows, set by set: its place in its set and its box.
                    const look = () => early.evaluate(() => {
                        const sets = [...document.querySelectorAll('project-slides')];
                        return {
                            defined: sets.filter(set => set.matches(':defined')).length,
                            y: scrollY,
                            vh: innerHeight,
                            photos: sets.flatMap((set, n) => [...set.querySelectorAll('.slide')].map((sl, i) => ({ sl, i })).filter(({ sl }) => sl.getClientRects().length).map(({ sl, i }) => { const r = sl.querySelector('.frame').getBoundingClientRect(); return { n, i, top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height }; })),
                        };
                    });
                    for (const p of waiting) {
                        let_in = false;
                        await early.goto(`${base}/projects/${p.data.slug}/`, { waitUntil: 'commit' });
                        // The page as it is before its script: parsed, every stylesheet there.
                        await early.waitForFunction(() => document.readyState !== 'loading' && Boolean(document.querySelector('#project-info')) && [...document.querySelectorAll('link[rel=stylesheet]')].every(l => l.sheet), null, { timeout: 15000 });
                        const before = await look();
                        let_in = true;
                        wake();
                        await slidesReady(early);
                        const after = await look();
                        const where = `${p.data.slug} at ${width} × ${height}`;
                        if (before.defined === 0) held++;
                        const first = (m) => m.photos.find(f => f.n === 0 && f.i === 0);
                        const [was, is] = [first(before), first(after)];
                        const early2 = before.photos.filter(f => f.i > 0 && f.top < before.vh && f.bottom > 0);
                        if (early2.length) flashed.push(`${where}: before the script ${early2.map(f => `photo ${f.i + 1} of set ${f.n + 1} shows from ${Math.round(f.top)}px down`).slice(0, 2).join(', ')}`);
                        if (!was || !is || ['top', 'left', 'width', 'height'].some(k => Math.abs(was[k] - is[k]) > 0.5) || before.y !== 0 || after.y !== 0) flashed.push(`${where}: the first photo is at ${was?.left}, ${was?.top} (${was?.width} × ${was?.height}) before the script and at ${is?.left}, ${is?.top} (${is?.width} × ${is?.height}) after it; the page at ${before.y}, then ${after.y}`);
                        if (after.photos.some(f => f.i > 0)) flashed.push(`${where}: with the script there a later photo of a set still shows`);
                    }
                    await context.close();
                }
                if (!waiting.length) check('3. from 900px until the slideshow\'s script has run: ok (no project in content has a set of several photos; the check was skipped)', true);
                else check(`3. from 900px, until the slideshow's script has run, nothing of a photo that the script will hide is in the window, and the first photo is where the script shows it: the page opens on one photo and stays on it (1366 × 710 and 900 × 600; the ${waiting.length} pages with a set of several photos; measured before the script in ${held} of ${2 * waiting.length} loads)`,
                    flashed.length === 0 && held === 2 * waiting.length, flashed.slice(0, 4).join(' | ') || 'the script was there before the page could be measured without it: the check tried nothing in some loads');
            }
            // 3. The pages of text with one picture, About and Collaborations (client/sheet.css), on a page of their
            // own that watches the document from the moment the parser is done: before the module script runs.
            {
                const sheetPage = await browser.newPage({ viewport: { width: 1366, height: 710 }, deviceScaleFactor: 1 });
                const said = [];
                sheetPage.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') said.push(`${sheetPage.url()} ${m.type()}: ${m.text()}`); });
                sheetPage.on('pageerror', e => said.push(`${sheetPage.url()} pageerror: ${e.message}`));
                await sheetPage.addInitScript(() => {
                    const records = [];
                    let watch = null;
                    document.addEventListener('readystatechange', () => {
                        if (document.readyState !== 'interactive' || watch) return;
                        watch = new MutationObserver(r => records.push(...r));
                        watch.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
                    });
                    window.__changed = () => { if (!watch) return ['the document was not watched']; records.push(...watch.takeRecords()); return records.splice(0).map(m => `${m.type} ${m.target.nodeName}${m.attributeName ? ` [${m.attributeName}]` : ''}`); };
                });
                // A page of text, loaded and at rest: its fonts in, its picture there.
                const settled = async (pg, s) => {
                    await pg.goto(`${base}/${s.name}/`);
                    await pg.evaluate(() => document.fonts.ready.then(() => true));
                    await pg.waitForFunction(() => { const img = document.querySelector('main.sheet img'); return !img || (img.complete && img.naturalWidth > 0); }, null, { timeout: 10000 }).catch(() => {});
                    return sheetLie(pg);
                };
                // On the watched page. (A picture that was open had the whole screen: the window is one again a moment after it closes, and cannot be resized before.)
                const go = async (s, width, height) => {
                    for (let i = 0; i < 20; i++) {
                        if (await sheetPage.setViewportSize({ width, height }).then(() => true, () => false)) break;
                        await sheetPage.waitForTimeout(100);
                    }
                    return settled(sheetPage, s);
                };
                // In a browser of its own, which has no file of the picture yet: the one it takes is the one `sizes` asks for
                // (a browser that already holds a larger file of the same picture shows that one instead).
                const fresh = async (s, width, height) => {
                    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
                    const pg = await context.newPage();
                    pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') said.push(`${pg.url()} ${m.type()}: ${m.text()}`); });
                    pg.on('pageerror', e => said.push(`${pg.url()} pageerror: ${e.message}`));
                    const m = await settled(pg, s);
                    await context.close();
                    return m;
                };
                // The layout, in both: from 900px the picture is the left half, right-aligned to the page's centre, as
                // large as fits the half and the window less the header less 76px; the text the right half, at most
                // 292px wide, the footnote under it. Below 900px the text, then the picture the page wide less 24px
                // either side, its caption, then the footnote. The picture is whole, without a border, with the shadow.
                const sizes = [[320, 640], [390, 844], [899, 700], [900, 600], [1024, 768], [1366, 710], [1920, 1080], [900, 500], [1000, 280]];
                const wrong = [];
                const promised = [];
                const taken = [];
                const tally = { pictures: 0, byWidth: 0, byHeight: 0, least: 0, captions: 0, notes: 0, scroll: [] };
                const idle = [];
                const fitted = { all: 0, captioned: 0 };
                for (const s of sheetFronts) {
                    const want = sheetWants(s);
                    for (const [width, height] of sizes) {
                        const m = await fresh(s, width, height);
                        const off = sheetOff(m);
                        if (off) wrong.push(`/${s.name}/ at ${width} × ${height}: ${off}`);
                        if (Boolean(m.figure) !== Boolean(want.image) || Boolean(m.caption) !== Boolean(want.caption) || (m.note?.paras.length ?? 0) !== want.notes.length || m.title?.text !== want.title) wrong.push(`/${s.name}/ at ${width} × ${height}: not the parts its content has (${m.order.join(', ')})`);
                        if (m.picture) {
                            const room = sheetRoom(width, height);
                            tally.pictures++;
                            if (Math.abs(m.picture.width - room.width) <= EXACT) tally.byWidth++; else tally.byHeight++;
                            if (width >= WIDE && height - pageOf(width).head - SHEET_KEEP < SHEET_LEAST) tally.least++;
                            // From 900px the picture is never taller than the window less the header less 76px (where that is at least 160px).
                            if (width >= WIDE && height - pageOf(width).head - SHEET_KEEP >= SHEET_LEAST && m.picture.height > height - pageOf(width).head - SHEET_KEEP + EXACT) wrong.push(`/${s.name}/ at ${width} × ${height}: the picture is ${m.picture.height} tall`);
                            // `sizes` gives the width the picture has, to the pixel, and the browser takes the smallest file that is at least that wide.
                            const px = slideSizesPx(m.img.sizes[0] ?? '', width, height);
                            if (m.img.files.length && (!(Math.abs(px - m.picture.width) <= 1) || (m.img.sizes[1] !== null && m.img.sizes[1] !== m.img.sizes[0]))) promised.push(`/${s.name}/ at ${width} × ${height}: sizes gives ${Number.isNaN(px) ? 'nothing this check can read' : `${Math.round(px * 100) / 100}px`}, the picture is ${Math.round(m.picture.width * 100) / 100}px wide (${m.img.sizes.join(' | ')})`);
                            const fit = m.img.files.filter(([w]) => w >= m.picture.width - 0.01).sort((a, b) => a[0] - b[0])[0] ?? [...m.img.files].sort((a, b) => b[0] - a[0])[0];
                            if (m.img.files.length && (!m.img.loaded || m.img.current !== fit[1])) taken.push(`/${s.name}/ at ${width} × ${height}: the browser took ${m.img.current || 'no file'} for a picture ${Math.round(m.picture.width)}px wide, not ${fit[1]}`);
                        }
                        if (m.caption) tally.captions++;
                        if (m.note) tally.notes++;
                        if (width === 1366) tally.scroll.push(`/${s.name}/ ${m.tall - m.vh}px`);
                        // From 900px: is everything on the page in the window, the text and its footnote with the page's 60px under them?
                        // Then there is nothing to scroll to. (Read from the page: the picture's box, the caption's, the text's and the footnote's.)
                        if (width >= WIDE) {
                            const text = Math.max(m.text?.bottom ?? 0, m.note?.bottom ?? 0);
                            if (Math.max(m.picture?.bottom ?? 0, m.caption?.bottom ?? 0, text + sheetOf(width).end) <= m.vh) {
                                fitted.all++;
                                if (m.caption) fitted.captioned++;
                                if (m.tall > m.vh) idle.push(`/${s.name}/ at ${width} × ${height}: the page scrolls by ${m.tall - m.vh}px; its picture ends at ${Math.round(m.picture?.bottom ?? 0)}px, its caption at ${Math.round(m.caption?.bottom ?? 0)}px, its text at ${Math.round(text)}px`);
                            }
                        }
                    }
                }
                check(`3. the About and Collaborations pages in both layouts (${sizes.map(([w, h]) => `${w} × ${h}`).join(', ')}): the header ${pageOf(390).head}px, ${pageOf(1366).head}px from 900px, its title centred, Bold and not a link; below 900px the text from ${pageOf(390).head + sheetOf(390).first}px, 24px from either edge, paragraphs ${sheetOf(390).apart}px apart, the picture ${sheetOf(390).picture}px under it and the page wide less 24px either side, its caption ${sheetOf(390).under}px under it, the footnote ${sheetOf(390).note}px after that; from 900px the picture directly under the header, right-aligned to the centre less 8.5px, as large as fits its half and the window less the header less ${SHEET_KEEP}px, the text from the centre plus 8.5px and at most ${sheetOf(1366).column}px wide, its first line at ${pageOf(1366).head + sheetOf(1366).first}px, paragraphs ${sheetOf(1366).apart}px apart, the footnote ${sheetOf(1366).note}px under the text in the same column; a caption centred under its picture, at most ${SHEET_CAPTION}px wide; a footnote's first line at the column's edge and the others hung ${sheetOf(390).hang}em (${sheetOf(1366).hang}em from 900px); the picture whole, in its file's proportions, without a border, with the shadow (${tally.pictures} pictures measured: ${tally.byWidth} limited by their width, ${tally.byHeight} by the window's height, ${tally.least} of those in a window so short that the least room of ${SHEET_LEAST}px holds; ${tally.captions} captions, ${tally.notes} footnotes; at 1366 × 710 the pages scroll by ${tally.scroll.join(' and ')})`,
                    wrong.length === 0 && tally.pictures > 0, wrong.slice(0, 4).join(' | '));
                check(`3. from 900px a caption under the picture does not make a page of text longer than what is on it: it stands in the room the picture keeps free under itself, so a page whose picture, caption, text and footnote are all in the window, the text with its ${sheetOf(1366).end}px under it, has nothing to scroll (${fitted.all} such pages and window sizes above, ${fitted.captioned} of them with a caption)`,
                    idle.length === 0 && (fitted.captioned > 0 || !sheetFronts.some(f => sheetWants(f).caption)), idle.slice(0, 4).join(' | ') || (fitted.captioned > 0 || !sheetFronts.some(f => sheetWants(f).caption) ? '' : 'no page with a caption fitted its window: the check tried nothing'));
                check(`3. the picture's sizes attribute on the About and Collaborations pages gives the width it is shown at, to the pixel, in both layouts, the same on its <source> (${tally.pictures} measured)`, promised.length === 0, promised.slice(0, 4).join(' | '));
                check('3. on the About and Collaborations pages the browser takes the smallest file that is at least as wide as the picture (so it reads their sizes attribute as written), at every window size above', taken.length === 0, taken.slice(0, 4).join(' | '));

                // Nothing touches the document when a page loads, nor when its picture is clicked once: a single click
                // does nothing here. A double click opens the picture to the full window; Escape closes it and leaves nothing behind.
                {
                    const changed = [];
                    const opened = [];
                    const named = [];
                    for (const s of sheetFronts.filter(f => sheetWants(f).image)) {
                        const m = await go(s, 1366, 710);
                        await sheetPage.waitForTimeout(250);
                        const onLoad = await sheetPage.evaluate(() => window.__changed());
                        const scripts = await sheetPage.evaluate(() => [...document.scripts].map(sc => sc.src.split('/').pop()).join());
                        await sheetPage.click('main.sheet picture');
                        await sheetPage.waitForTimeout(ZOOM_WAIT + 250);
                        const once = await sheetPage.evaluate(() => ({ changes: window.__changed(), open: document.querySelectorAll('.zoom').length, y: scrollY, path: location.pathname + location.search + location.hash }));
                        if (onLoad.length || once.changes.length || once.open || once.y !== 0 || once.path !== `/${s.name}/` || scripts !== 'zoom.js') changed.push(`/${s.name}/: ${onLoad.length} changes on load (${onLoad.slice(0, 3).join(', ')}), ${once.changes.length} after one click, ${once.open} open, at ${once.y}, ${once.path}; scripts ${scripts}`);
                        if (m.picture.cursor !== 'zoom-in') changed.push(`/${s.name}/: the cursor over the picture is ${m.picture.cursor}`);
                        // A double click, as the mouse sends it; two clicks that a busy machine sends more than the wait apart are two single clicks, and it is tried again.
                        for (let i = 0; i < 3; i++) {
                            await sheetPage.dblclick('main.sheet picture');
                            if (await sheetPage.waitForSelector('.zoom', { timeout: 2 * ZOOM_WAIT + 400 }).then(() => true, () => false)) break;
                        }
                        await sheetPage.waitForFunction(() => { const img = document.querySelector('.zoom img'); return Boolean(img) && img.complete && img.naturalWidth > 0; }, null, { timeout: 5000 }).catch(() => {});
                        const z = await sheetPage.evaluate(() => {
                            const box = document.querySelector('.zoom');
                            const big = box?.querySelector('img');
                            const r = big?.getBoundingClientRect();
                            const shown = document.querySelector('main.sheet img');
                            return {
                                open: document.querySelectorAll('.zoom').length, role: box?.getAttribute('role') ?? '', modal: box?.getAttribute('aria-modal') ?? '', label: box?.getAttribute('aria-label') ?? null, alt: big?.getAttribute('alt'), shown: shown.getAttribute('alt'),
                                caption: document.querySelector('main.sheet figcaption')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
                                fills: Boolean(r) && r.left === 0 && r.top === 0 && r.width === innerWidth && r.height === innerHeight, fit: big ? getComputedStyle(big).objectFit : '', loaded: Boolean(big) && big.complete && big.naturalWidth > 0,
                                same: Boolean(big) && Math.abs(big.naturalWidth / big.naturalHeight - shown.naturalWidth / shown.naturalHeight) < 0.01, onTop: Boolean(box) && document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.zoom') === box && document.elementFromPoint(20, 20)?.closest('.zoom') === box,
                                focus: document.activeElement === box, selected: String(getSelection()), parent: box?.parentElement?.localName ?? '',
                            };
                        });
                        await sheetPage.keyboard.press('ArrowDown');
                        await sheetPage.keyboard.press('Tab');
                        const behind = await sheetPage.evaluate(() => ({ y: scrollY, focus: document.activeElement?.classList.contains('zoom') ?? false }));
                        await sheetPage.keyboard.press('Escape');
                        await sheetPage.waitForFunction(() => !document.querySelector('.zoom') && !document.fullscreenElement, null, { timeout: 5000 }).catch(() => {});
                        await sheetPage.waitForTimeout(150);
                        await sheetPage.evaluate(() => window.__changed());
                        const after = await sheetPage.evaluate(async () => {
                            const sent = new DOMParser().parseFromString(await (await fetch(location.pathname)).text(), 'text/html');
                            return { open: document.querySelectorAll('.zoom').length, asSent: sent.body.innerHTML === document.body.innerHTML && sent.head.innerHTML === document.head.innerHTML, y: scrollY };
                        });
                        // The dialog is named in the owner's words: the picture's description, or else the caption under it (as the page
                        // prints it, which the checks of the page's words hold to the content). A picture with neither has no name:
                        // client/zoom.js makes none up (until 26 Nov 2026 it said "Image", a word nobody gave).
                        named.push(z.shown ? 'its description' : z.caption ? 'its caption' : 'nothing');
                        if (z.open !== 1 || z.role !== 'dialog' || z.modal !== 'true' || z.label !== (z.shown || z.caption || null) || z.alt !== z.shown || !z.fills || z.fit !== 'contain' || !z.loaded || !z.same || !z.onTop || !z.focus || z.selected !== '' || z.parent !== 'body' || behind.y !== 0 || !behind.focus || after.open !== 0 || !after.asSent || after.y !== 0) opened.push(`/${s.name}/: ${JSON.stringify({ ...z, behind, after })}`);
                    }
                    check('3. nothing changes the document of the About or the Collaborations page when it loads (watched from the end of parsing, before its one script, client/zoom.js, runs), and a single click on the picture does nothing: no change, nothing opened, the page where it was; the cursor over the picture says it can be enlarged', changed.length === 0, changed.join(' | '));
                    check(`3. a double click on the picture of the About or the Collaborations page opens it to the full window: whole, over everything, a dialog with keyboard focus, named by the picture\'s description, by its caption where none is written, and not named where there is neither: no word but the owner\'s (today by ${named.join(' and ')}); the keys do not move the page behind it; Escape closes it, and the document is the server\'s HTML again`, opened.length === 0 && sheetFronts.some(f => sheetWants(f).image), opened.join(' | ').slice(0, 900));
                }

                // The header stays at the top of the window while the page scrolls under it, and what is behind it is
                // brought out when it gets keyboard focus: html { scroll-padding-top } in client/sheet.css is the header's
                // height in both layouts, so a link of the text that lies behind the header comes clear of it when
                // focused (tried wherever the page scrolls far enough to put its first link there), while focus on
                // "back", which is in the header, moves nothing.
                {
                    const stuck = [];
                    let tried = 0;
                    for (const s of sheetFronts) {
                        for (const [width, height] of [[390, 500], [1000, 300]]) {
                            await go(s, width, height);
                            const m = await sheetPage.evaluate(async () => {
                                const head = document.querySelector('.project-head');
                                const link = document.querySelector('main.sheet .text a');
                                const settle = async () => { let last = NaN; for (let i = 0, same = 0; i < 60 && same < 3; i++) { await new Promise(r => setTimeout(r, 50)); same = scrollY === last ? same + 1 : 0; last = scrollY; } };
                                const max = document.documentElement.scrollHeight - innerHeight;
                                // The link's line 30px under the top of the window: behind the header, if the page scrolls that far.
                                window.scrollTo({ top: link ? Math.min(max, link.getBoundingClientRect().top + scrollY - 30) : max, behavior: 'instant' });
                                const down = { y: scrollY, head: head.getBoundingClientRect().top, bottom: head.getBoundingClientRect().bottom, onTop: head.contains(document.elementFromPoint(innerWidth / 2, 10)), link: link ? link.getBoundingClientRect().top : null };
                                document.querySelector('.back a').focus();
                                await settle();
                                const back = scrollY;
                                if (link) { link.focus(); await settle(); }
                                return { max, down, back, link: link ? link.getBoundingClientRect().top : null, bottom: head.getBoundingClientRect().bottom, padding: getComputedStyle(document.documentElement).scrollPaddingTop };
                            });
                            if (m.padding !== `${pageOf(width).head}px` || Math.abs(m.bottom - pageOf(width).head) > 0.5) stuck.push(`/${s.name}/ at ${width} × ${height}: scroll-padding-top is ${m.padding} under a header ${m.bottom}px tall`);
                            if (m.max > 0 && (m.down.head !== 0 || !m.down.onTop || m.back !== m.down.y)) stuck.push(`/${s.name}/ at ${width} × ${height}: ${m.down.y}px down the header is at ${m.down.head}; focus on back leaves the page at ${m.back}`);
                            if (m.down.link !== null && m.down.link < m.down.bottom) {
                                tried++;
                                if (m.link < m.bottom - 0.5) stuck.push(`/${s.name}/ at ${width} × ${height}: a focused link of the text is at ${m.link}, behind a header that ends at ${m.bottom}`);
                            }
                        }
                    }
                    const linked = sheetFronts.some(f => /<a\b/.test(sheetWants(f).body));
                    check(`3. on the About and Collaborations pages the header stays at the top of the window while the page scrolls under it, and the page keeps what gets keyboard focus clear of it (scroll-padding-top is the header's height): a link of the text that is behind the header comes out from under it when focused, and focus on "back" moves nothing (390 × 500 and 1000 × 300; a link was behind the header in ${tried} of the ${2 * sheetFronts.length} cases)`, stuck.length === 0 && (tried > 0 || !linked), stuck.join(' | '));
                }

                // The type, in both layouts and between 720 and 900px, where the body's own type is already the small one:
                // every piece of text that shows is one of the sizes its place has, and nothing is Bold but the title and **bold** in content.
                {
                    const offType = [];
                    let pieces = 0;
                    for (const s of sheetFronts) {
                        for (const [width, height] of [[390, 844], [800, 700], [1366, 710]]) {
                            await go(s, width, height);
                            const h = pageOf(width);
                            const d = sheetOf(width);
                            const bare = (t) => t.replace(/ \/ \d+$/, '');
                            const found = await sheetPage.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getClientRects().length && [...el.childNodes].some(n => n.nodeType === 3 && n.data.trim()) && !el.closest('.visually-hidden')).map((el) => {
                                const st = getComputedStyle(el);
                                const kind = el.closest('figcaption') ? 'caption' : el.closest('.project-head h1') ? 'title' : el.closest('.back') ? 'back' : 'text';
                                const weight = el.closest('strong, .project-head h1') ? '700' : '300';
                                return `${kind} ${st.fontSize} / ${st.lineHeight}${st.fontWeight === weight ? '' : ` in weight ${st.fontWeight}`}`;
                            }));
                            const allowed = [`title ${bare(h.title)}`, `back ${bare(h.back)}`, `text ${bare(d.text)}`, `caption ${bare(d.caption)}`];
                            const off = [...new Set(found)].filter(t => !allowed.includes(t));
                            pieces += found.length;
                            if (off.length) offType.push(`/${s.name}/ at ${width}px: ${off.slice(0, 3).join(', ')}`);
                        }
                    }
                    const [n, w] = [sheetOf(390), sheetOf(1366)];
                    check(`3. the type on the About and Collaborations pages: below 900px the title ${pageOf(390).title.replace(' / 700', '')} Bold, back the same Light, the text and the footnote ${n.text.replace(' / 300', '')}, a caption ${n.caption.replace(' / 300', '')}; from 900px ${pageOf(1366).title.replace(' / 700', '')}, ${w.text.replace(' / 300', '')} and ${w.caption.replace(' / 300', '')}; all Light but the title and bold in content (at 390, 800 and 1366px: ${pieces} pieces of text)`, offType.length === 0 && pieces > 0, offType.slice(0, 4).join(' | '));
                }
                check('3. no console errors or warnings on the About and Collaborations pages through all of this', said.length === 0, said.slice(0, 4).join(' | '));
                await sheetPage.close();
            }
            await page.setViewportSize({ width: 1366, height: 710 });
        }

        // 6. the Index's proportions at the design's width
        {
            await page.setViewportSize({ width: 1366, height: 710 });
            await page.goto(`${base}/`);
            await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
            const m = await page.evaluate(({ shadow, exact, fit, line }) => {
                const box = (el) => el.getBoundingClientRect();
                const cells = [...document.querySelectorAll('project-index .cell')];
                const rows = [...document.querySelectorAll('project-index .row')];
                const page = document.documentElement.clientWidth;
                const cell = box(cells[0]);
                // The only lines on the page are the two strips' lower edges: the strip over the grid (generated,
                // `.images::before`) and the one over the list (`.head`), each with a bottom border in the line
                // colour and no other. Nothing else has a border, the pictures' boxes included; a shadow is the
                // pictures' alone.
                const sides = (s) => ['Top', 'Right', 'Bottom', 'Left'].map(k => parseFloat(s[`border${k}Width`]));
                const probe = document.createElement('i');
                probe.style.cssText = `position: absolute; border-bottom: ${line} solid var(--line);`;
                document.body.append(probe);
                const rule = `${getComputedStyle(probe).borderBottomWidth} ${getComputedStyle(probe).borderBottomStyle} ${getComputedStyle(probe).borderBottomColor}`;
                probe.remove();
                window.__mutations?.();
                const strips = [getComputedStyle(document.querySelector('project-index .images'), '::before'), getComputedStyle(document.querySelector('project-index .head'))];
                const ruled = strips.every((s) => { const [top, right, bottom, left] = sides(s); return top + right + left === 0 && bottom > 0 && `${s.borderBottomWidth} ${s.borderBottomStyle} ${s.borderBottomColor}` === rule; });
                const all = [...document.querySelectorAll('.site-head, .site-head *, project-index, project-index *')];
                const bordered = (s) => sides(s).reduce((a, b) => a + b) > 0;
                const lines = all.filter((el) => { const s = getComputedStyle(el); return (bordered(s) && !el.matches('project-index .head')) || (s.boxShadow !== 'none' && !el.classList.contains('box')); }).length
                    + all.flatMap(el => ['::before', '::after'].map(pseudo => ({ el, pseudo, s: getComputedStyle(el, pseudo) })))
                        .filter(({ el, pseudo, s }) => !['none', 'normal'].includes(s.content) && (bordered(s) || s.boxShadow !== 'none') && !(pseudo === '::before' && el.matches('project-index .images'))).length;
                // A thumbnail's box (`.box`, a name from when it had a border) is the picture: as large as fits 88%
                // of the cell's width and 86.5% of its height (49.9733% of its width), one of the two exactly.
                const thumbs = cells.filter(c => c.querySelector('.box')).map((c) => {
                    const a = box(c);
                    const b = box(c.querySelector('.box'));
                    const img = c.querySelector('img');
                    const im = box(img);
                    const s = getComputedStyle(c.querySelector('.box'));
                    const wrong = [];
                    if (b.width > a.width * fit.width + exact || b.height > a.width * fit.height + exact) wrong.push(`larger than fits (${b.width} × ${b.height})`);
                    if (Math.abs(b.width - a.width * fit.width) > exact && Math.abs(b.height - a.width * fit.height) > exact) wrong.push(`neither side on its limit (${b.width} × ${b.height} in ${a.width * fit.width} × ${a.width * fit.height})`);
                    if (Math.abs((b.x + b.width / 2) - (a.x + a.width / 2)) >= 0.5 || Math.abs((b.y + b.height / 2) - (a.y + a.height / 2)) >= 0.5) wrong.push('not centred');
                    if (Math.abs(b.width / b.height - img.getAttribute('width') / img.getAttribute('height')) >= 0.01 || Math.abs(im.width - b.width) > 0.5 || Math.abs(im.height - b.height) > 0.5) wrong.push('cropped, or not filling its box');
                    if (getComputedStyle(img).objectFit !== 'fill') wrong.push(`object-fit: ${getComputedStyle(img).objectFit}`);
                    if (!['Top', 'Right', 'Bottom', 'Left'].every(k => s[`border${k}Width`] === '0px')) wrong.push(`a border (${s.borderTopWidth})`);
                    if (s.boxShadow !== shadow) wrong.push(`shadow ${s.boxShadow}`);
                    return wrong.length ? `${c.dataset.slug}: ${wrong.join(', ')}` : '';
                }).filter(Boolean);
                const body = getComputedStyle(document.body);
                return {
                    page,
                    cell: cell.width,
                    first: cell.x,
                    ratio: Math.abs(cell.width / cell.height - 341.2 / 197.12) < 0.005,
                    row: rows.every(r => Math.abs(box(r).height - 23) < 0.1),
                    columns: Math.abs(box(cells[1]).x - cell.x - cell.width) < 0.5 && Math.abs(box(cells[2]).y - cell.y - cell.height) < 0.5 && Math.abs(box(cells[2]).x - cell.x) < 0.5,
                    count: cells.filter(c => c.querySelector('.box')).length,
                    thumbs,
                    sized: cells.filter(c => c.querySelector('.box')).map(c => ({ name: c.dataset.slug, width: box(c.querySelector('.box')).width, sizes: [c.querySelector('img').getAttribute('sizes'), c.querySelector('source')?.getAttribute('sizes') ?? null] })),
                    vw: innerWidth,
                    vh: innerHeight,
                    scrolls: document.documentElement.scrollHeight <= innerHeight,
                    lines,
                    ruled,
                    rule,
                    body: [body.fontSize, body.lineHeight, body.fontWeight].join(' / '),
                    rows: [...new Set(rows.map(r => [getComputedStyle(r).fontSize, getComputedStyle(r).lineHeight, getComputedStyle(r).fontWeight].join(' / ')))].join(', '),
                };
            }, { shadow: SHADOW, exact: EXACT, fit: HOME_THUMB, line: '0.67px' });
            check(`6. at 1366px a cell is a quarter of what the two columns have (the page less 20px either side and the 29px between them: ${homeCell(1366)}px), two to a row from 20px, and every list row is 23px tall`,
                Math.abs(m.cell - homeCell(m.page)) < 0.5 && Math.abs(m.first - HOME_EDGE) < 0.5 && m.ratio && m.row && m.columns, JSON.stringify({ cell: m.cell, first: m.first, ratio: m.ratio, row: m.row, columns: m.columns }));
            check(`6. every thumbnail is whole, centred, without a border, with the shadow, filling its box edge to edge, and as large as its cell allows: the side that limits it is exactly on its limit (${m.count} thumbnails)`, m.count > 0 && m.thumbs.length === 0, m.thumbs.slice(0, 5).join(' | '));
            {
                const off = sizesOff(m.sized, m.vw, m.vh);
                check(`6. every thumbnail's sizes attribute gives the width it is shown at, to the pixel (${m.sized.length} thumbnails)`, m.sized.length > 0 && off.length === 0, off.slice(0, 3).join(' | '));
            }
            {
                // The width limit, which no cover of the content reaches (the widest is limited by its height):
                // a picture of 3 : 1 is 88% of its cell wide, one of 1 : 3 is 49.9733% of the cell's width tall,
                // and the build's `sizes` for such pictures says those widths.
                const wide = await reshaped(page, 3);
                const tall = await reshaped(page, 0.3333);
                const widest = Math.max(...published.map(p => Number(readFileSync(join(dist, 'client/covers.css'), 'utf8').match(new RegExp(`#cell-${p.data.slug}\\{--a:([\\d.]+)\\}`))?.[1] ?? 0)));
                check(`6. a thumbnail wider than any the content has (3 : 1; the widest is ${widest} : 1) is limited by its cell's width, 88% of it, and one of 1 : 3 by the height, 49.9733% of the cell's width, each centred, and the build's sizes for such pictures gives those widths to the pixel`,
                    Math.abs(wide.width - wide.cell * HOME_THUMB.width) <= EXACT && Math.abs(wide.height - wide.width / 3) <= 0.5 && wide.off < 0.5 && Math.abs(wide.sizes - wide.width) <= 1
                    && Math.abs(tall.height - tall.cell * HOME_THUMB.height) <= EXACT && Math.abs(tall.width - tall.height * 0.3333) <= 0.5 && tall.off < 0.5 && Math.abs(tall.sizes - tall.width) <= 1,
                    JSON.stringify({ wide, tall }));
            }
            check('6. the two columns scroll on their own, and the only lines are the two under the columns\' strips (0.67px in the line colour, as the browser draws it): no other element has a border, and only the pictures have a shadow', m.scrolls && m.lines === 0 && m.ruled, JSON.stringify({ scrolls: m.scrolls, lines: m.lines, ruled: m.ruled, rule: m.rule }));
            check('6. the type is 12.5px on a 15.2px line, Light, in the list\'s rows as on the page', m.body === HOME_BODY.wide && m.rows === HOME_BODY.wide, `body ${m.body}; rows ${m.rows}`);

            // A column scrolled to its end, then filtered down to something that no longer scrolls: no thumb left behind.
            await page.setViewportSize({ width: 1366, height: 710 });
            const rare = [...counts].filter(([, n]) => n <= 2).map(([t]) => t)[0];
            if (rare && await page.evaluate(() => CSS.supports('animation-timeline: scroll()'))) {
                const thumbs = () => page.evaluate(() => [...document.querySelectorAll('project-index .thumb')].map(t => getComputedStyle(t).visibility));
                await page.evaluate(() => { for (const el of document.querySelectorAll('project-index .scroll, project-index .rows')) el.scrollTop = el.scrollHeight; });
                await page.waitForTimeout(100);
                const atEnd = await thumbs();
                await page.evaluate((t) => document.querySelector(`project-index .tag[data-tag="${CSS.escape(t)}"]`).click(), rare);
                await page.waitForTimeout(150);
                const after = await thumbs();
                check('6. the scroll thumbs show while a column scrolls and go when a filter leaves nothing to scroll', atEnd.every(v => v === 'visible') && after.every(v => v === 'hidden'), `${atEnd.join(',')} → ${after.join(',')}`);
            }

            // From 720px the page does not scroll. Under the intro, which takes one, two or three lines
            // (34px above it, a 21px line each, 12px under it), the index fills exactly what is left of the
            // window: 20px from either edge of the page, its two columns equal and 29px apart. Each column
            // starts with a 29px strip and scrolls on its own under it, down to the window's lower edge; its
            // thumb starts under the strip, at the column's right edge. The grid's first cell is 12px under
            // its strip, the list's first row 9px, and 24px follow the last row. Also in a window only
            // 400px tall. The line count is read in the page, not expected: where a line breaks is the
            // font's matter (and the system's, at these sizes), and how many lines there are is the owner's:
            // the intro is theirs to edit, it may be one short line at every width, or none. So the page is
            // measured with the intro as it is, whatever it takes, and then, at three of the windows, with a
            // made-up one of exactly one, two, three and five lines set in its place (the header is the
            // server's HTML, outside the component: nothing renders it again).
            {
                const fills = [];
                const counted = new Set();
                const MADE = [1, 2, 3, 5];
                // The page as it lies, with the intro as it is (`made` 0) or with a made-up one of `made` lines: one
                // part of one word, to which words are added until the paragraph takes that many lines.
                const filled = (made) => page.evaluate(async (made) => {
                    const box = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height }; };
                    const q = (sel) => document.querySelector(sel);
                    let p = q('.site-head p');
                    const count = () => {
                        if (!p) return 0;
                        const range = document.createRange();
                        range.selectNodeContents(p);
                        return new Set([...range.getClientRects()].filter(r => r.width > 0).map(r => Math.round((r.top + r.bottom) / 2 / 21))).size;
                    };
                    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                    if (made) {
                        if (!p) { p = document.createElement('p'); q('.site-head').append(p); }
                        const part = document.createElement('span');
                        part.className = 'l';
                        part.textContent = 'word';
                        p.replaceChildren(part);
                        for (let n = 0; n < 3000 && count() < made; n++) part.textContent += ' word';
                        await frame();
                    }
                    const lines = count();
                    const grid = q('project-index .scroll');
                    const list = q('project-index .rows');
                    const thumbs = () => [...document.querySelectorAll('project-index .thumb')].map(box);
                    const rest = thumbs();
                    // Each column to its end by itself: the other one and the page stay where they are.
                    grid.scrollTop = grid.scrollHeight;
                    await frame();
                    const afterGrid = { grid: grid.scrollTop, list: list.scrollTop, page: scrollY, thumbs: thumbs() };
                    list.scrollTop = list.scrollHeight;
                    await frame();
                    const afterList = { grid: grid.scrollTop, list: list.scrollTop, page: scrollY, thumbs: thumbs() };
                    grid.scrollTop = 0;
                    list.scrollTop = 0;
                    await frame();
                    const rows = [...document.querySelectorAll('project-index .row')];
                    return {
                        page: document.documentElement.clientWidth,
                        window: [innerWidth, innerHeight],
                        doc: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
                        lines,
                        head: box(q('.site-head')),
                        text: p ? box(p) : null,
                        index: box(q('project-index')),
                        images: box(q('project-index .images')),
                        section: box(q('project-index .index')),
                        strips: [parseFloat(getComputedStyle(q('project-index .images'), '::before').height), box(q('project-index .head')).height],
                        stripTop: box(q('project-index .head')).top,
                        // The two words in the list's strip: each set like the column it names (a main project's title at
                        // rest, a row's types), in a 24px line at the top of the strip.
                        words: (() => {
                            const head = q('project-index .head');
                            const set = (el) => { const s = getComputedStyle(el); return [s.fontWeight, s.fontSize, s.color, s.transform].join(' '); };
                            const middle = (el) => { const r = document.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect(); return (b.top + b.bottom) / 2 - head.getBoundingClientRect().top; };
                            const [projects, tags] = [head.querySelector('.title'), head.querySelector('.tags')];
                            return {
                                text: [projects.textContent, tags.textContent].join(' | '),
                                projects: set(projects),
                                titles: set(q('project-index .row:not(.child) .title')),
                                tags: set(tags),
                                types: set(q('project-index .row .tags')),
                                line: getComputedStyle(head).lineHeight,
                                middles: [middle(projects), middle(tags)],
                            };
                        })(),
                        grid: { ...box(grid), over: getComputedStyle(grid).overflowY, more: grid.scrollHeight - grid.clientHeight },
                        list: { ...box(list), over: getComputedStyle(list).overflowY, more: list.scrollHeight - list.clientHeight, all: list.scrollHeight },
                        tracks: [...document.querySelectorAll('project-index .track')].map(box),
                        rest,
                        afterGrid,
                        afterList,
                        cell: box(q('project-index .cell')),
                        row: box(rows[0]),
                        rows: rows.length,
                    };
                }, made);
                for (const [width, height, made] of [[720, 500, []], [800, 600, []], [1024, 768, []], [1366, 710, MADE], [1920, 1080, MADE], [720, 400, MADE]]) {
                    await page.setViewportSize({ width, height });
                    await page.mouse.move(1, 1);
                    await page.goto(`${base}/`);
                    await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
                    await page.evaluate(() => document.fonts.ready.then(() => true));
                    const timeline = await page.evaluate(() => CSS.supports('animation-timeline: scroll()'));
                    for (const lines of [0, ...made]) {
                        const at = await filled(lines);
                        if (!lines) counted.add(at.lines);
                        const near = (a, b) => Math.abs(a - b) <= 0.5;
                        const half = (at.page - 2 * HOME_EDGE - HOME_GAP) / 2;
                        const under = at.index.top + HOME_STRIP;
                        const off = [];
                        if (lines && at.lines !== lines) off.push(`the made-up intro takes ${at.lines} lines`);
                        if (at.doc[0] > at.window[0] || at.doc[1] > at.window[1]) off.push(`the page is ${at.doc.join(' × ')}`);
                        if (!near(at.head.height, 34 + at.lines * 21 + 12) || (at.text && (!near(at.text.left, 44) || !near(at.text.right, at.page - 44) || !near(at.text.top, 34)))) off.push(`the intro's ${at.lines} line(s) in a header of ${at.head.height}px${at.text ? `, the text from ${at.text.left} to ${at.text.right}, ${at.text.top} down` : ''}`);
                        if (!near(at.index.top, at.head.bottom) || !near(at.index.bottom, at.window[1])) off.push(`the index from ${at.index.top} to ${at.index.bottom}`);
                        if (!near(at.images.left, HOME_EDGE) || !near(at.images.width, half) || !near(at.section.left, HOME_EDGE + half + HOME_GAP) || !near(at.section.width, half) || !near(at.section.right, at.page - HOME_EDGE)) off.push(`the columns at ${at.images.left} + ${at.images.width} and ${at.section.left} + ${at.section.width}`);
                        if (!at.strips.every(h => near(h, HOME_STRIP)) || !near(at.stripTop, at.index.top)) off.push(`strips ${at.strips.join(' and ')}px tall, the list's at ${at.stripTop}`);
                        if (at.words.text !== 'Projects | tags' || at.words.projects !== at.words.titles || !at.words.projects.startsWith(`700 ${HOME_TYPE.wide} `) || at.words.tags !== at.words.types || !at.words.tags.startsWith(`300 ${HOME_TYPE.wide} `) || at.words.tags.endsWith(' none')
                            || at.words.line !== '24px' || at.words.middles.some(y => Math.abs(y - 12) > 1)) off.push(`the strip's words: ${JSON.stringify(at.words)}`);
                        for (const [name, col] of [['grid', at.grid], ['list', at.list]]) if (!near(col.top, under) || !near(col.bottom, at.window[1]) || col.over !== 'auto') off.push(`the ${name} scrolls (${col.over}) from ${col.top} to ${col.bottom}`);
                        if (!near(at.cell.top, under + 12) || !near(at.row.top, under + 9) || !near(at.list.all, Math.max(at.list.height, 9 + at.rows * 23 + 24))) off.push(`the first cell ${at.cell.top - under}px and the first row ${at.row.top - under}px under the strip; the list is ${at.list.all}px in all, its ${at.rows} rows and the 9px and 24px round them ${9 + at.rows * 23 + 24}px`);
                        if (!near(at.tracks[0].top, under) || !near(at.tracks[1].top, under) || !near(at.tracks[0].right, at.images.right) || !near(at.tracks[1].right, at.section.right) || !at.tracks.every(t => near(t.width, 8) && near(t.bottom, at.window[1]))) off.push(`the thumbs' tracks at ${at.tracks.map(t => `${t.left}, ${t.top}`).join(' and ')}`);
                        if (at.grid.more <= 0 || !near(at.afterGrid.grid, at.grid.more) || at.afterGrid.list !== 0 || at.afterGrid.page !== 0 || !near(at.afterList.list, Math.max(0, at.list.more)) || !near(at.afterList.grid, at.grid.more) || at.afterList.page !== 0) off.push(`scrolling one column moved another, or the page: ${JSON.stringify([at.afterGrid.grid, at.afterGrid.list, at.afterGrid.page, at.afterList.grid, at.afterList.list, at.afterList.page])}`);
                        if (timeline) {
                            // The thumbs: at the top of their track at rest, at its bottom when the column is at its end.
                            if (!near(at.rest[0].top, under) || !near(at.afterGrid.thumbs[0].bottom, at.window[1]) || !near(at.rest[0].height, Math.min(123, at.tracks[0].height * 0.4))) off.push(`the grid's thumb from ${at.rest[0].top} (${at.rest[0].height}px) to ${at.afterGrid.thumbs[0].bottom}`);
                            if (!near(at.rest[1].top, under) || (at.list.more > 0 && !near(at.afterList.thumbs[1].bottom, at.window[1])) || !near(at.rest[1].height, Math.min(299, at.tracks[1].height * 0.5))) off.push(`the list's thumb from ${at.rest[1].top} (${at.rest[1].height}px) to ${at.afterList.thumbs[1].bottom}`);
                        }
                        if (off.length) fills.push(`${width} × ${height}${lines ? `, a made-up intro of ${lines} line(s)` : ''}: ${off.join('; ')}`);
                    }
                }
                check(`6. from 720px the page does not scroll and the index fills what the intro leaves of the window, with the intro as it is (${[...counted].sort().join(', ')} line(s)) and with a made-up one of ${MADE.join(', ')} lines in its place: two equal columns 20px from the page's edges and 29px apart, each scrolling on its own under its 29px strip, its thumb under the strip; in the list's strip "Projects" set like the titles (Bold) and "tags" like the types (the tag colour, slanted), in a 24px line at its top (720 × 500, 800 × 600, 1024 × 768, 1366 × 710, 1920 × 1080, 720 × 400; the made-up intros at the last three)`,
                    fills.length === 0, fills.slice(0, 3).join(' | '));
            }

            // The list from 720px up: three rigid columns, every row one line. The date starts 12px from the
            // list's left edge, in a column as wide as the widest date
            // printed plus 32.2px (5px of air and the 27.2px the hover chevron takes), never more than 40% of
            // the list; what is left before the 16px right padding is the title's column and the type's,
            // 11 : 10, 15px apart. A column cuts its text and fades it out over its last 1em (12.5px); text that
            // ends before the fade is left alone, text that reaches it slides left at 100px a second while its
            // row is pointed at, until its end is clear of the fade, and goes back in 0.2s. The dates are
            // Light and the titles Bold, in the text colour both.
            const FADE = HOME_FADE;
            const show = async (width, height) => {
                await page.setViewportSize({ width, height });
                await page.mouse.move(1, 1);
                await page.goto(`${base}/`);
                await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
                await page.evaluate(() => document.fonts.ready.then(() => true));
            };
            // The list as it lies: every row with its date, its chevron and its columns. A column's `start`
            // is where its text begins against the column's left edge: 0 at rest, negative once it has slid
            // (or been scrolled). The slanted types' box is wider than their layout by the lean on each side.
            const list = () => page.evaluate(() => {
                const px = (v) => parseFloat(v) || 0;
                const index = document.querySelector('project-index .index').getBoundingClientRect();
                return {
                    page: document.documentElement.clientWidth,
                    left: index.left,
                    width: index.width,
                    slot: 23,
                    ground: getComputedStyle(document.body).backgroundColor.match(/\d+/g).slice(0, 3).map(Number),
                    rows: [...document.querySelectorAll('project-index .row')].map((r) => {
                        const b = r.getBoundingClientRect();
                        const years = r.querySelector('.years').getBoundingClientRect();
                        const what = r.querySelector('.what');
                        const before = getComputedStyle(what, '::before');
                        const dateText = document.createRange();
                        dateText.selectNodeContents(r.querySelector('.years'));
                        return {
                            slug: r.dataset.slug,
                            top: b.top,
                            bottom: b.bottom,
                            height: b.height,
                            on: r.classList.contains('on'),
                            date: years.left,
                            type: [r.querySelector('.years'), r.querySelector('.title')].map(el => `${getComputedStyle(el).fontWeight} ${getComputedStyle(el).fontSize} ${getComputedStyle(el).color}`).join(' | '),
                            child: r.classList.contains('child'),
                            dateWidth: dateText.getBoundingClientRect().width,
                            dateLines: years.height / px(getComputedStyle(r).lineHeight),
                            // The chevron's box: from the title column's left edge, and its middle from the row's.
                            chevron: before.content === 'none' ? null : {
                                left: px(before.left),
                                width: px(before.width),
                                height: px(before.height),
                                middle: what.getBoundingClientRect().top + px(before.top) + px(before.height) / 2 - (b.top + b.height / 2),
                                colour: before.backgroundColor,
                            },
                            cells: [...r.querySelectorAll('.clip')].map((c) => {
                                const line = c.querySelector('.line');
                                const cs = getComputedStyle(c);
                                const ls = getComputedStyle(line);
                                const cb = c.getBoundingClientRect();
                                const lb = line.getBoundingClientRect();
                                const text = px(ls.width);
                                const lean = (lb.width - text - px(ls.paddingRight)) / 2;
                                const left = cb.left + px(cs.paddingLeft);
                                return {
                                    left,
                                    room: px(cs.paddingLeft),
                                    right: cb.right,
                                    width: cb.right - left,
                                    text,
                                    start: lb.left + lean - left,
                                    lines: px(ls.height) / px(ls.lineHeight),
                                    middle: lb.top + lb.height / 2 - (b.top + b.height / 2),
                                    cut: cs.overflowX,
                                    mask: cs.maskImage,
                                    colour: ls.color.match(/\d+/g).slice(0, 3).map(Number),
                                    tags: [...c.querySelectorAll('.tag')].map((t) => { const tb = t.getBoundingClientRect(); return { tag: t.dataset.tag, left: tb.left - left, right: tb.right - left, top: tb.top - cb.top, bottom: cb.bottom - tb.bottom }; }),
                                };
                            }),
                        };
                    }),
                };
            });
            const row = async (slug) => (await list()).rows.find(r => r.slug === slug);
            // The pointer on a row (in its date column, so on no link and no tag; a sub-project's date cell is
            // empty and has no height, so the height is the row's), the row brought into its column's window first.
            const spot = (slug) => page.evaluate((slug) => {
                const r = document.querySelector(`#row-${slug}`);
                r.scrollIntoView({ block: 'center', behavior: 'instant' });
                const b = r.querySelector('.years').getBoundingClientRect();
                const whole = r.getBoundingClientRect();
                return { x: b.left + 4, y: whole.top + whole.height / 2 };
            }, slug);
            const pointAt = async (slug) => {
                const at = await spot(slug);
                await page.mouse.move(at.x, at.y);
            };
            // The middle of a tag of a row as it lies now (of what shows of it at rest, for one longer than its column).
            const tagSpot = (slug, n) => page.evaluate(({ slug, n, FADE }) => {
                const r = document.querySelector(`#row-${slug}`);
                r.scrollIntoView({ block: 'center', behavior: 'instant' });
                const tag = r.querySelectorAll('.tag')[n];
                const b = tag.getBoundingClientRect();
                const right = Math.min(b.right, tag.closest('.clip').getBoundingClientRect().right - FADE);
                return { tag: tag.dataset.tag, x: (b.left + right) / 2, y: b.top + b.height / 2 };
            }, { slug, n, FADE });
            // The first project with a title and a type list too long for their columns, by `over` px or a little
            // more: for the widths at which all the content's own texts fit, so that the cut, the fade and the
            // slide are checked there too. Through the component's own state; the title grows by words, the
            // type list by the site's own tags, each once.
            const lengthen = (over) => page.evaluate(({ over, FADE }) => {
                const px = (v) => parseFloat(v) || 0;
                const el = document.querySelector('project-index');
                const all = el.state.projects;
                const spare = [...new Set(all.flatMap(p => p.tags))].filter(t => !all[0].tags.includes(t));
                let { title } = all[0];
                let tags = [...all[0].tags];
                const cut = (i) => {
                    const c = document.querySelectorAll(`#row-${all[0].slug} .clip`)[i];
                    return c ? px(getComputedStyle(c.querySelector('.line')).width) - (c.getBoundingClientRect().width - px(getComputedStyle(c).paddingLeft) - FADE) : -Infinity;
                };
                const set = () => el.setState({ projects: all.map((p, k) => (k === 0 ? { ...p, title, tags } : p)) });
                for (let n = 0; n < 200 && cut(0) < over; n++) { title += ' and on'; set(); }
                while (spare.length && cut(1) < over) { tags = [...tags, spare.shift()]; set(); }
                return { slug: all[0].slug, tags: tags.length, title: cut(0), types: cut(1) };
            }, { over, FADE });
            const filteredBy = (tag) => page.waitForFunction((t) => new URLSearchParams(location.search).get('filter') === t, tag, { timeout: 5000 }).then(() => true, () => false);
            const travelled = (slug, i) => page.evaluate(({ slug, i }) => parseFloat(getComputedStyle(document.querySelectorAll(`#row-${slug} .clip`)[i].querySelector('.line')).getPropertyValue('--index-slid')) || 0, { slug, i });
            // One column of a row, frame by frame from now on: [the page's animation clock, the column's `start`].
            // Until the text has moved and then stood still for 20 frames ('stopped'), or until a text
            // would have travelled `until` px (the registered length that drives the slide); 15s at most.
            const follow = (slug, i, until) => page.evaluate(({ slug, i, until }) => new Promise((resolve) => {
                const px = (v) => parseFloat(v) || 0;
                const cell = document.querySelectorAll(`#row-${slug} .clip`)[i];
                const line = cell.querySelector('.line');
                const samples = [];
                const from = performance.now();
                let still = 0;
                const frame = () => {
                    const ls = getComputedStyle(line);
                    const lb = line.getBoundingClientRect();
                    const lean = (lb.width - px(ls.width) - px(ls.paddingRight)) / 2;
                    const start = lb.left + lean - cell.getBoundingClientRect().left - px(getComputedStyle(cell).paddingLeft);
                    still = samples.length && Math.abs(samples.at(-1)[1] - start) < 0.01 ? still + 1 : 0;
                    samples.push([document.timeline.currentTime, start]);
                    const done = until === 'stopped' ? Math.abs(start) > 0.5 && still >= 20 : px(ls.getPropertyValue('--index-slid')) >= until;
                    if (done || performance.now() - from > 15000) resolve(samples);
                    else requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            }), { slug, i, until });
            // The way back, by its own event: how long the transition that takes the text home ran.
            const home = (slug, i) => page.evaluate(({ slug, i }) => new Promise((resolve) => {
                const line = document.querySelectorAll(`#row-${slug} .clip`)[i].querySelector('.line');
                const give = setTimeout(() => resolve(-1), 10000);
                line.addEventListener('transitionend', (e) => {
                    if (e.target !== line || e.propertyName !== '--index-keep') return;
                    clearTimeout(give);
                    resolve(e.elapsedTime);
                });
            }), { slug, i });
            // One column of a row on tape, frame by frame, until taken off: [the animation clock, `start`, the share
            // of the slide that shows (1 while the row is pointed at, down to 0 on the way home)].
            const tape = (slug, i) => page.evaluate(({ slug, i }) => {
                const px = (v) => parseFloat(v) || 0;
                const cell = document.querySelectorAll(`#row-${slug} .clip`)[i];
                const line = cell.querySelector('.line');
                const samples = [];
                window.__tape = { on: true, samples };
                const frame = () => {
                    if (!window.__tape.on) return;
                    const ls = getComputedStyle(line);
                    const lb = line.getBoundingClientRect();
                    const lean = (lb.width - px(ls.width) - px(ls.paddingRight)) / 2;
                    samples.push([document.timeline.currentTime, lb.left + lean - cell.getBoundingClientRect().left - px(getComputedStyle(cell).paddingLeft), px(ls.getPropertyValue('--index-keep'))]);
                    requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            }, { slug, i });
            const untape = () => page.evaluate(() => { window.__tape.on = false; return window.__tape.samples; });
            // On the way home: resolves once less than three quarters of the slide show (5s at most).
            const partWay = (slug, i) => page.evaluate(({ slug, i }) => new Promise((resolve) => {
                const line = document.querySelectorAll(`#row-${slug} .clip`)[i].querySelector('.line');
                const from = performance.now();
                const frame = () => {
                    const keep = parseFloat(getComputedStyle(line).getPropertyValue('--index-keep'));
                    if (keep < 0.75 || performance.now() - from > 5000) resolve(keep);
                    else requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            }), { slug, i });
            // The ink in three strips of a column of a row at rest, each as the furthest any pixel is from the
            // ground colour (0 to 255): the 17px of text before the fade, the last 5px of the fade (at most
            // 5/12.5 of the ink left there), and the 7px after the column's edge.
            const inkAt = async (r, cell, ground) => {
                const edge = Math.floor(cell.right);
                const clip = { x: edge - 30, y: Math.ceil(r.top), width: 38, height: Math.floor(r.bottom) - Math.ceil(r.top) };
                const { data, info } = await sharp(await page.screenshot({ clip })).raw().toBuffer({ resolveWithObject: true });
                const most = (x0, x1) => {
                    let ink = 0;
                    for (let y = 0; y < info.height; y++) for (let x = x0; x < x1; x++) for (let c = 0; c < 3; c++) ink = Math.max(ink, Math.abs(data[(y * info.width + x) * info.channels + c] - ground[c]));
                    return ink;
                };
                return { text: most(0, 17), fade: most(25, 30), after: most(31, 38) };
            };

            // The mask takes nothing off text that is not cut. Its opaque part starts 1px before the column:
            // a column starts on a fraction of a pixel, and a hard stop on that very edge erased the pixels
            // in which a first letter begins (J, T, W; a bullet, while sub-projects had one; most at 1536px). Every row is in the window; each
            // column, from its ring room to its end (to where its fade begins when its text is cut), is
            // the same picture with the mask and with a mask that hides nothing put in its place for the
            // test. (Not with no mask at all: on some systems a browser smooths text under a mask in another
            // way than text on the plain ground, GitHub's runners among them, and then every letter differs.)
            for (const width of [1366, 1536]) {
                await show(width, 109 + HOME_STRIP + 9 + published.length * 23 + 24 + 20);
                const m = await list();
                const shot = async () => sharp(await page.screenshot()).raw().toBuffer({ resolveWithObject: true });
                const masked = await shot();
                const bared = await page.addStyleTag({ content: 'project-index .clip { -webkit-mask: linear-gradient(#000, #000) !important; mask: linear-gradient(#000, #000) !important; }' });
                const bare = await shot();
                await bared.evaluate(el => el.remove());
                const at = (img, x, y) => [0, 1, 2].map(c => img.data[(y * img.info.width + x) * img.info.channels + c]);
                const apart = (a, b) => Math.max(...a.map((v, c) => Math.abs(v - b[c])));
                let differ = 0;
                let ink = 0;
                const where = new Set();
                for (const r of m.rows) {
                    for (const c of r.cells) {
                        const x0 = Math.floor(c.left - c.room) - 1;
                        const x1 = c.text <= c.width - FADE + 0.01 ? Math.ceil(c.right) : Math.floor(c.right - FADE) - 1;
                        for (let y = Math.ceil(r.top); y < Math.floor(r.bottom); y++) {
                            for (let x = x0; x < x1; x++) {
                                if (apart(at(masked, x, y), at(bare, x, y)) > 2) { differ++; where.add(r.slug); }
                                if (x >= Math.floor(c.left) && x < Math.floor(c.left) + 3 && apart(at(bare, x, y), m.ground) > 24) ink++;
                            }
                        }
                    }
                }
                check(`6. at ${width}px the columns' mask takes nothing off text that is not cut: not a pixel of a first letter on a column's left edge`,
                    m.rows.length === published.length && m.rows.at(-1).bottom <= masked.info.height && ink > 0 && differ === 0, `${differ} pixels differ in ${[...where].slice(0, 5).join(', ')}; ${ink} inked pixels on the columns' first 3px`);
            }

            // The date column, at every width, the phone's one column included: as wide as the widest date
            // the list prints plus 32.2px (5px of air, then the 27.2px the hover chevron takes), the same in
            // every row. The width comes from a text the build writes (--dates, every date a line) and each
            // row prints unseen after its own date, so it follows the content with no script and does not
            // depend on the rows a filter leaves.
            const dateCells = () => page.evaluate(() => {
                const px = (v) => parseFloat(v) || 0;
                const index = document.querySelector('project-index .index').getBoundingClientRect();
                const scroller = document.querySelector('project-index .rows');
                return {
                    page: document.documentElement.clientWidth,
                    left: index.left,
                    width: index.width,
                    sizer: getComputedStyle(document.querySelector('project-index .row .years'), '::after').content,
                    // What the list scrolls over, against its rows and its own padding (side by side); the page's end against the list's (below 720px).
                    scrolls: scroller.scrollHeight - Math.max(scroller.clientHeight, [...scroller.children].reduce((sum, r) => sum + r.getBoundingClientRect().height, px(getComputedStyle(scroller).paddingTop) + px(getComputedStyle(scroller).paddingBottom))),
                    // The two words over the list's columns (from 720px): where "Projects" and "tags" start, and the
                    // date cell before them. The slanted word's box is wider than its layout by the lean on each side.
                    head: (() => {
                        const head = document.querySelector('project-index .head');
                        if (!head || head.getClientRects().length === 0) return null;
                        const tags = head.querySelector('.tags');
                        const tb = tags.getBoundingClientRect();
                        return { date: head.querySelector('.years').getBoundingClientRect().left, title: head.querySelector('.title').getBoundingClientRect().left, tags: tb.left + (tb.width - px(getComputedStyle(tags).width)) / 2 };
                    })(),
                    under: document.documentElement.scrollHeight - (document.querySelector('project-index .index').getBoundingClientRect().bottom + scrollY),
                    sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                    rows: [...document.querySelectorAll('project-index .row')].map((r) => {
                        const years = r.querySelector('.years');
                        const box = years.getBoundingClientRect();
                        const text = document.createRange();
                        text.selectNodeContents(years);
                        const tb = text.getBoundingClientRect();
                        const after = getComputedStyle(years, '::after');
                        const what = r.querySelector('.what');
                        const before = getComputedStyle(what, '::before');
                        return {
                            slug: r.dataset.slug,
                            height: r.getBoundingClientRect().height,
                            date: box.left,
                            boxRight: box.right,
                            boxLines: box.height / px(getComputedStyle(years).lineHeight),
                            text: tb.width,
                            textRight: tb.right,
                            textLines: new Set([...text.getClientRects()].map(c => Math.round(c.top))).size,
                            // How far the date's line is under the first line of its title: they are one line.
                            level: tb.height ? tb.top - r.querySelector('.title').getClientRects()[0].top : 0,
                            title: what.getBoundingClientRect().left,
                            // The left edges of the titles' column and of the types' (from 720px, where each is a box): where its text starts.
                            columns: [...r.querySelectorAll('.clip')].map(c => c.getBoundingClientRect().left + px(getComputedStyle(c).paddingLeft)),
                            chevron: before.content === 'none' ? null : what.getBoundingClientRect().left + px(before.left),
                            tags: [...r.querySelectorAll('.tag')].map(t => t.dataset.tag),
                            // The unseen text: generated, so no node; no height; hidden, so not read out.
                            unseen: `${after.height} ${after.visibility} ${after.whiteSpace}`,
                            nodes: years.childNodes.length === 0 ? '' : years.childNodes.length === 1 && years.firstChild.nodeType === 3 ? years.textContent : `${years.childNodes.length} nodes`,
                            read: years.innerText,
                        };
                    }),
                };
            });
            // A row's date starts 12px from the list's left edge from 720px; below that a row has no side padding (the list has the page's 16px).
            const inset = (m) => (m.page >= 720 ? 12 : 0);
            // The two words over the list: "Projects" starts on the left edge of the titles' column and "tags" on that
            // of the types' column, in every row, and the strip's date cell where the rows' dates start. Layout
            // against layout, to a tenth of a pixel (the design asks for half a pixel). Below 720px they do not show.
            // Returns what is off, or ''.
            const headsOff = (m) => {
                if (m.page < 720) return m.head ? 'the two words show below 720px' : '';
                if (!m.head) return 'the two words do not show';
                const titles = m.rows.map(r => r.columns[0]);
                const types = m.rows.filter(r => r.columns.length > 1).map(r => r.columns[1]);
                const off = [];
                if (!titles.length || titles.some(v => Math.abs(v - m.head.title) > 0.1)) off.push(`"Projects" at ${m.head.title}, the titles' column at ${titles.find(v => Math.abs(v - m.head.title) > 0.1)}`);
                if (!types.length || types.some(v => Math.abs(v - m.head.tags) > 0.1)) off.push(`"tags" at ${m.head.tags}, the types' column at ${types.find(v => Math.abs(v - m.head.tags) > 0.1)}`);
                if (m.rows.some(r => Math.abs(r.date - m.head.date) > 0.1)) off.push(`the strip's date cell at ${m.head.date}, the rows' at ${m.rows[0].date}`);
                return off.join('; ');
            };
            // The rows whose title's column is not `column` px after the date, or whose date is not at the row's inset.
            const strays = (m, column) => m.rows.filter(r => Math.abs(r.title - r.date - column) > 0.5 || Math.abs(r.date - (m.left + inset(m))) > 0.5);
            const say = (rows) => rows.slice(0, 3).map(r => `${r.slug}: date at ${r.date}, title ${(r.title - r.date).toFixed(2)}px after it`).join('; ');
            // Every project's date as the list prints it: short, and white space one space (a date typed with two
            // spaces between its years prints with one, and --dates carries it with one); none for a sub-project.
            const printedDates = Object.fromEntries(published.map(p => [p.data.slug, spaced(listDate(p))]));
            // The made-up rule of the escaping check again, now read by the browser: put in the page in place
            // of the built one, the unseen text of a date cell is the made-up dates as they were given, and
            // the rule written after it still holds (the string ended where it should).
            {
                await show(1366, 710);
                const style = await page.addStyleTag({ content: `${madeUpCss}project-index{--after:ok}` });
                const read = await page.evaluate(() => ({
                    content: getComputedStyle(document.querySelector('project-index .row .years'), '::after').content,
                    after: getComputedStyle(document.querySelector('project-index')).getPropertyValue('--after').trim(),
                }));
                await style.evaluate(el => el.remove());
                const lines = cssText(read.content).split('\n');
                check('6. the browser reads that rule as the dates it was made from (the double quote, the backslash, the line break as a space, the text that would end a rule), and the rule after it still holds',
                    JSON.stringify(lines) === JSON.stringify(madeUpDates) && read.after === 'ok', `${read.content} reads as ${JSON.stringify(lines)}; the rule after it: ${read.after || 'lost'}`);
            }
            const ax = await page.context().newCDPSession(page);
            for (const [width, height] of [[390, 844], [720, 800], [1024, 768], [1366, 710], [1920, 1080]]) {
                await show(width, height);
                const m = await dateCells();
                // The two words over the list's columns, in every state this loop puts the list in.
                const heads = [['at rest', headsOff(m)]];
                const widest = Math.max(...m.rows.map(r => r.text));
                const column = widest + 32.2;
                const off = strays(m, column);
                // Printed: a sub-project's row prints no date, so its years (today's longest among them) do not
                // count; its empty cell has the column's width like every other.
                const blank = m.rows.filter(r => subs.has(r.slug) && (r.text !== 0 || r.nodes !== ''));
                check(`6. at ${width}px every row's date column is the widest date printed (${widest.toFixed(2)}px, ${m.rows.find(r => r.text === widest)?.slug}) plus 32.2px: the date at ${(m.left + inset(m)).toFixed(1)}, the title's column ${column.toFixed(2)}px after it, in all ${m.rows.length} rows, the ${subs.size} sub-projects' with their empty date cell among them`,
                    m.rows.length === published.length && widest > 0 && off.length === 0 && blank.length === 0, `${say(off)} ${blank.slice(0, 3).map(r => `${r.slug}: a date cell with "${r.nodes}"`).join('; ')}`);

                // The text that sizes the column: every date the list prints, each once; it takes no height (a
                // date cell is one line tall, its date on the first line of its title as ever, and nothing is
                // added to what the list or the page scrolls over),
                // it is no node of the page (a date cell holds its own date and nothing else), and it is not
                // read out: the accessibility tree has each row's date once and the sizing text nowhere.
                const lines = cssText(m.sizer).split('\n');
                const want = [...new Set(m.rows.map(r => printedDates[r.slug]).filter(Boolean))];
                // (A sub-project's date cell is empty: it has the column's width and no line of its own.)
                const high = m.rows.filter(r => r.unseen !== '0px hidden pre' || (printedDates[r.slug] ? Math.abs(r.boxLines - 1) > 0.01 : r.boxLines > 1.01) || Math.abs(r.level) > 1 || (width >= 720 && Math.abs(r.height - 23) > 0.05));
                const overflow = width >= 720 ? m.scrolls : m.under;
                check(`6. at ${width}px the text that sizes the date column is every date the list prints (${want.length}; no sub-project's), a date to a line, and takes no height: a date cell is one line tall, its date level with its title, and neither the list nor the page scrolls over more than its rows`,
                    JSON.stringify(lines) === JSON.stringify(want) && high.length === 0 && Math.abs(overflow) <= 1 && m.sideways <= 0,
                    `${JSON.stringify(lines)}; ${high.slice(0, 3).map(r => `${r.slug}: ${r.unseen}, ${r.boxLines} lines, the date ${r.level}px under its title's line, row ${r.height}px`).join('; ')}; ${overflow}px more to scroll over, ${m.sideways}px sideways`);
                const inDom = m.rows.filter(r => spaced(r.nodes) !== printedDates[r.slug] || spaced(r.read) !== printedDates[r.slug]);
                const { nodes } = await ax.send('Accessibility.getFullAXTree');
                const said = nodes.filter(n => !n.ignored && n.role?.value === 'StaticText').map(n => spaced(n.name?.value ?? ''));
                const count = (list, d) => list.filter(t => t === d).length;
                const headSaid = ['Projects', 'tags'].map(word => count(said, word));
                const dates = m.rows.map(r => printedDates[r.slug]).filter(Boolean);
                const extra = want.filter(d => count(said, d) !== count(dates, d)).map(d => `${d}: ${count(said, d)} times for ${count(dates, d)} rows`);
                const whole = nodes.filter(n => !n.ignored && want.length > 1 && spaced(n.name?.value ?? '').includes(spaced(lines.join(' ')))).length;
                check(`6. at ${width}px that text is not in the DOM (every date cell holds its own date, one text node, and reads as it) and is not read out: the accessibility tree has each date once per row that prints it and the sizing text nowhere`,
                    inDom.length === 0 && said.length > dates.length && extra.length === 0 && whole === 0,
                    `${inDom.slice(0, 3).map(r => `${r.slug}: ${r.nodes} / ${r.read}`).join('; ')} ${extra.slice(0, 4).join('; ')}; the whole text in ${whole} nodes`);

                // Pointed at, the row with the widest date: its chevron starts 5px after the date's end, 27.2px
                // (its 14px box, then 13.2px) before the title's column.
                const longest = m.rows.find(r => r.text === widest);
                await pointAt(longest.slug);
                await page.waitForFunction((slug) => getComputedStyle(document.querySelector(`#row-${slug} .what`), '::before').content !== 'none', longest.slug, { timeout: 5000 }).catch(() => {});
                const pointed = (await dateCells()).rows.find(r => r.slug === longest.slug);
                check(`6. at ${width}px the chevron of the row with the widest date is 5px clear of that date and 14px before the title's column (${longest.slug})`,
                    pointed.chevron !== null && Math.abs(pointed.chevron - pointed.textRight - 5) <= 0.5 && Math.abs(pointed.title - pointed.chevron - 27.2) <= 0.01,
                    `the date ends at ${pointed.textRight}, the chevron's box starts at ${pointed.chevron}, the title's column at ${pointed.title}`);
                await page.mouse.move(1, 1);

                // A filter that hides every row with the widest date: the rows it leaves keep their columns.
                const narrow = (t) => m.rows.filter(r => r.tags.includes(t)).every(r => r.text < widest - 1);
                const hiding = [...counts].sort((a, b) => b[1] - a[1]).map(([t]) => t).find(narrow);
                if (!hiding) check(`6. at ${width}px: ok (every tag has a row with the widest date; the check of a filter that hides it was skipped)`, true);
                else {
                    await page.evaluate((t) => document.querySelector(`project-index .tag[data-tag="${CSS.escape(t)}"]`).click(), hiding);
                    const applied = await filteredBy(hiding);
                    const left = await dateCells();
                    const was = new Map(m.rows.map(r => [r.slug, r]));
                    const moved = left.rows.filter(r => Math.abs(r.date - was.get(r.slug).date) > 0.01 || Math.abs(r.title - was.get(r.slug).title) > 0.01);
                    const now = Math.max(...left.rows.map(r => r.text));
                    heads.push([`with the filter "${hiding}", which hides the widest date`, headsOff(left)]);
                    check(`6. at ${width}px the columns do not move when a filter hides every row with the widest date (${hiding}: ${left.rows.length} of ${m.rows.length} rows left, their widest date ${now.toFixed(2)}px): the column is still ${column.toFixed(2)}px`,
                        applied && left.rows.length > 0 && left.rows.length < m.rows.length && now < widest - 1 && moved.length === 0 && strays(left, column).length === 0, `${say(moved)} ${say(strays(left, column))}`);
                    await show(width, height);
                }

                // A longer date, as the next build would have it: the first row prints it (through the
                // component's own state) and --dates carries it (set in the page for the test). Every row's
                // column is then that date's width plus 32.2px; with both taken back, it is as it was.
                // (Two years in full: longer than any date the list prints, and still short of the 40% of
                // the list at which the column stops, which the next check is for. Three years, as this
                // check had until 26 Nov 2026, reach that limit in the redesign's narrower list at 720px
                // and in its larger type at 390px.)
                const withDate = async (date) => {
                    const style = await page.addStyleTag({ content: `project-index { --dates: "${date}"; }` });
                    await page.evaluate((date) => {
                        const el = document.querySelector('project-index');
                        window.__projects = el.state.projects;
                        el.setState({ projects: el.state.projects.map((p, k) => (k === 0 ? { ...p, listYears: date } : p)) });
                    }, date);
                    return async () => {
                        await style.evaluate(el => el.remove());
                        await page.evaluate(() => document.querySelector('project-index').setState({ projects: window.__projects }));
                    };
                };
                // Any other filter: the most used tag, or the next one if that was the filter just tried.
                {
                    const other = hiding === tagA ? tagB : tagA;
                    await page.evaluate((t) => document.querySelector(`project-index .tag[data-tag="${CSS.escape(t)}"]`).click(), other);
                    const applied = await filteredBy(other);
                    const some = await dateCells();
                    heads.push([`with the filter "${other}"`, applied && some.rows.length > 0 && some.rows.length < m.rows.length ? headsOff(some) : 'the filter was not applied']);
                    await show(width, height);
                }
                const takeBack = await withDate('2019, 2020');
                const longer = await dateCells();
                heads.push(['with a longer date', headsOff(longer)]);
                const wide = longer.rows[0].text;
                check(`6. at ${width}px a longer date (${wide.toFixed(2)}px for ${widest.toFixed(2)}px) makes the date column wider in every row: the title's column ${(wide + 32.2).toFixed(2)}px after the date`,
                    wide > widest + 5 && strays(longer, wide + 32.2).length === 0 && longer.rows[0].textLines === 1 && longer.sideways <= 0, say(strays(longer, wide + 32.2)));
                await takeBack();
                const again = await dateCells();
                check(`6. at ${width}px with that date gone the column is ${column.toFixed(2)}px again`, strays(again, column).length === 0, say(strays(again, column)));

                // A date typed as a whole sentence: the date column stops at 40% of the list in every row. Side by
                // side the date is cut at its cell's edge (the cell ends where the chevron's 27.2px begin), on
                // one line, in a row as tall as the others, and nothing of it is printed between its cell and
                // the title's column (that strip is the ground colour and nothing else); below 720px, where a
                // row wraps, it wraps inside its cell.
                const sentence = 'from the spring of 2019 until some day and perhaps still going on today, as far as anyone can tell, or longer';
                const undo = await withDate(sentence);
                const most = await dateCells();
                heads.push(['with a date that stops its column at 40% of the list', headsOff(most)]);
                const first = most.rows[0];
                const limit = most.width * 0.4;
                const capped = strays(most, limit);
                let said2 = '';
                let held;
                if (width >= 720) {
                    await page.evaluate(() => document.querySelector('project-index .row').scrollIntoView({ block: 'center', behavior: 'instant' }));
                    const r = await page.evaluate(() => { const b = document.querySelector('project-index .row').getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; });
                    // The strip stops 2px before the title's column: a first letter may begin a pixel before its column.
                    const clip = { x: Math.ceil(first.boxRight), y: Math.ceil(r.top), width: Math.floor(first.title) - 2 - Math.ceil(first.boxRight), height: Math.floor(r.bottom) - Math.ceil(r.top) };
                    const ground = (await list()).ground;
                    // No strip to look at (the column was not stopped, and the title's column is off the page): that is a failure, not a crash.
                    let ink = 255;
                    if (clip.width > 0 && clip.height > 0 && clip.x + clip.width <= width) {
                        const { data, info } = await sharp(await page.screenshot({ clip })).raw().toBuffer({ resolveWithObject: true });
                        ink = 0;
                        for (let i = 0; i < info.width * info.height; i++) for (let c = 0; c < 3; c++) ink = Math.max(ink, Math.abs(data[i * info.channels + c] - ground[c]));
                    }
                    held = first.text > limit && first.textRight > first.boxRight + 20 && first.textLines === 1 && most.rows.every(row => Math.abs(row.height - 23) < 0.05) && clip.width >= 23 && ink <= 2;
                    said2 = `the date's text ends ${(first.textRight - first.boxRight).toFixed(1)}px after its cell, ${first.textLines} line(s); the ${clip.width}px before the title's column are at most ${ink} from the ground colour`;
                } else {
                    held = first.textLines > 1 && first.textRight <= first.boxRight - 5 + 0.5;
                    said2 = `the date takes ${first.textLines} lines and ends ${(first.boxRight - 5 - first.textRight).toFixed(1)}px before its cell's 5px of air`;
                }
                check(`6. at ${width}px a date as long as a sentence stops the date column at 40% of the list (${limit.toFixed(1)}px) in every row, and is ${width >= 720 ? 'cut at its cell\'s edge, 27.2px before the title\'s column: one line, nothing of it printed after the cell, no row taller' : 'wrapped inside its cell'}`,
                    capped.length === 0 && Math.abs(first.title - first.boxRight - 27.2) <= 0.5 && held && most.sideways <= 0, `${say(capped)} ${said2}`);
                await undo();

                // The two words over the list. From 720px each starts on the left edge of the column it names,
                // whatever the date column's width is and whichever rows a filter leaves, and each is real
                // text, read out once. Below 720px they do not show and are not read out.
                const headWrong = heads.filter(([, wrong]) => wrong).map(([state, wrong]) => `${state}: ${wrong}`);
                if (width >= 720) {
                    check(`6. at ${width}px the words "Projects" and "tags" start on the left edge of the titles' column and of the types' column in every row, to a tenth of a pixel (${heads.map(([state]) => state).join('; ')}), and each is read out once`,
                        headWrong.length === 0 && headSaid.join() === '1,1', `${headWrong.slice(0, 3).join(' | ')}; read out ${headSaid.join(' and ')} times`);
                } else {
                    check(`6. at ${width}px the words "Projects" and "tags" do not show and are not read out`, headWrong.length === 0 && headSaid.join() === '0,0', `${headWrong.slice(0, 3).join(' | ')}; read out ${headSaid.join(' and ')} times`);
                }
            }
            await ax.detach();

            // The sub-projects' rows (20 Nov 2026; the indent of 26 Nov 2026), at every width, the phone's one
            // column included: no bullet (nothing stands before the title in its column, in the HTML or drawn
            // by the stylesheet), an empty date cell, and the title in Fluxisch Else Light, 20px in from the
            // start of the title's column (the redesign's measure; it was five word spaces of the title's own
            // type until then, 1.39em). A main project's row: its date, and its title Bold on the column's start. Colour and
            // underline are the same for both. Every row is read at rest, with the pointer off the list.
            const rowsAsSet = () => page.evaluate(() => {
                const px = (v) => parseFloat(v) || 0;
                const rows = [...document.querySelectorAll('project-index .row')].map((r) => {
                    const what = r.querySelector('.what');
                    const title = r.querySelector('.title');
                    const years = r.querySelector('.years');
                    const line = title.parentElement;
                    const ts = getComputedStyle(title);
                    const first = title.getClientRects()[0];
                    const whole = title.getBoundingClientRect();
                    const before = getComputedStyle(what, '::before');
                    const column = what.getBoundingClientRect().left;
                    const b = r.getBoundingClientRect();
                    return {
                        slug: r.dataset.slug,
                        child: r.classList.contains('child'),
                        on: r.classList.contains('on'),
                        // Anything that could be a bullet: an element of that name, a node before the title, generated content.
                        bullets: r.querySelectorAll('.bullet').length + (line.firstChild === title ? 0 : 1)
                            + [getComputedStyle(line, '::before'), getComputedStyle(title, '::before'), getComputedStyle(r, '::marker')].filter(g => !['none', 'normal', ''].includes(g.content)).length
                            + (getComputedStyle(r).listStyleType === 'none' ? 0 : 1),
                        date: years.textContent,
                        dateNodes: years.childNodes.length,
                        type: `${ts.fontWeight} ${ts.fontSize}`,
                        face: ts.fontFamily,
                        colour: ts.color,
                        line: ts.textDecorationLine,
                        indent: first.left - column,
                        titleLeft: whole.left - column,
                        titleRight: whole.right - column,
                        titleWidth: whole.width,
                        chevron: before.content === 'none' ? null : { left: px(before.left), width: px(before.width), colour: before.backgroundColor },
                        // A place in the row that is on no link and no tag: its left padding, in its middle.
                        x: b.left + 4,
                        y: b.top + b.height / 2,
                    };
                });
                // The faces that are loaded, each once: the two files of Fluxisch Else. (The stylesheet has two more
                // faces of that name and those weights, a system font for the apostrophe; whether one of them counts
                // as loaded is the machine's matter, not the page's.)
                return { rows, faces: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family.replace(/["']/g, '')} ${f.weight}`))].sort() };
            });
            for (const [width, height] of [[390, 844], [720, 800], [800, 600], [1024, 768], [1366, 710], [1920, 1080]]) {
                await show(width, height);
                const as = await rowsAsSet();
                const kids = as.rows.filter(r => subs.has(r.slug));
                const mains = as.rows.filter(r => !subs.has(r.slug));
                const size = width >= 720 ? HOME_TYPE.wide : HOME_TYPE.narrow;
                const ink = mains[0]?.colour ?? as.rows[0].colour;
                const wrong = [];
                for (const r of kids) {
                    const why = [];
                    if (!r.child) why.push('not marked as a sub-project');
                    if (r.bullets) why.push('a bullet, or something else before its title');
                    if (r.date !== '' || r.dateNodes !== 0) why.push(`a date cell with "${r.date}"`);
                    if (r.type !== `300 ${size}`) why.push(`its title ${r.type}`);
                    if (Math.abs(r.indent - HOME_INDENT) > 0.1) why.push(`its title ${r.indent.toFixed(3)}px in, not ${HOME_INDENT}px`);
                    if (r.colour !== ink || r.line !== 'none' || !/Fluxisch Else/.test(r.face)) why.push(`its title ${r.colour}, ${r.line}, ${r.face}`);
                    if (why.length) wrong.push(`${r.slug}: ${why.join(', ')}`);
                }
                for (const r of mains) {
                    const why = [];
                    if (r.child) why.push('marked as a sub-project');
                    if (r.bullets) why.push('a bullet, or something else before its title');
                    if (spaced(r.date) !== printedDates[r.slug]) why.push(`its date "${r.date}", not "${printedDates[r.slug]}"`);
                    if (r.type !== `700 ${size}`) why.push(`its title ${r.type}`);
                    if (Math.abs(r.indent) > 0.05) why.push(`its title ${r.indent.toFixed(3)}px in`);
                    if (r.colour !== ink || r.line !== 'none' || !/Fluxisch Else/.test(r.face)) why.push(`its title ${r.colour}, ${r.line}, ${r.face}`);
                    if (why.length) wrong.push(`${r.slug}: ${why.join(', ')}`);
                }
                const faces = as.faces.join(', ');
                if (!kids.length) check(`6. at ${width}px: ok (no sub-project in content; the checks of a sub-project's row were skipped)`, true);
check(`6. at ${width}px every sub-project's row (${kids.length}) has no bullet, an empty date cell and a Light title (300, ${size}), ${HOME_INDENT}px in from the start of the title's column; every main project's row (${mains.length}) has its date and a Bold title (700, ${size}) on the column's start; both faces of Fluxisch Else are loaded`,
                    as.rows.length === published.length && wrong.length === 0 && faces === 'Fluxisch Else 300, Fluxisch Else 700', `${wrong.slice(0, 4).join(' | ')}${faces === 'Fluxisch Else 300, Fluxisch Else 700' ? '' : ` faces loaded: ${faces || 'none'}`}`);
                if (!kids.length) continue;

                // Pointed at, a sub-project's row is highlighted like any other: its title the link colour (the
                // chevron's), still Light and still indented, the chevron 14px left of the title's column (not
                // of the indented title), and still no date. Rather one whose title fits its column, so nothing
                // slides and the title must still be 20px in; where every sub-project's title is cut,
                // the first of them, and where its title is then is the next checks' matter.
                const widths = width >= 720 ? Object.fromEntries((await list()).rows.map(r => [r.slug, r.cells[0]])) : {};
                const calm = kids.find(r => width < 720 || widths[r.slug].text <= widths[r.slug].width - FADE + 0.01);
                {
                    const { slug } = calm ?? kids[0];
                    await page.evaluate((slug) => document.querySelector(`#row-${slug}`).scrollIntoView({ block: 'center', behavior: 'instant' }), slug);
                    const at = (await rowsAsSet()).rows.find(r => r.slug === slug);
                    await page.mouse.move(at.x, at.y);
                    await page.waitForFunction((slug) => document.querySelector(`#row-${slug}`).classList.contains('on') && getComputedStyle(document.querySelector(`#row-${slug} .what`), '::before').content !== 'none', slug, { timeout: 5000 }).catch(() => {});
                    const pointed = (await rowsAsSet()).rows.find(r => r.slug === slug);
                    check(`6. at ${width}px a sub-project's row pointed at is highlighted like any other: its title the link colour, still Light${calm ? ` and ${HOME_INDENT}px in` : ''}, the chevron 14px left of the title's column, no date (${slug}${calm ? '' : ', whose title is cut and slides, as is every sub-project\'s at this width'})`,
                        pointed.on && pointed.chevron !== null && Math.abs(pointed.chevron.left + 27.2) <= 0.01 && pointed.chevron.width === 14 && pointed.colour === pointed.chevron.colour && pointed.colour !== at.colour
                        && pointed.type === `300 ${size}` && (!calm || Math.abs(pointed.indent - HOME_INDENT) <= 0.1) && pointed.date === '' && pointed.bullets === 0,
                        JSON.stringify({ on: pointed.on, chevron: pointed.chevron, title: pointed.colour, rest: at.colour, type: pointed.type, indent: pointed.indent, date: pointed.date }));
                    await page.mouse.move(1, 1);
                    // Home again before anything else is read: the highlight off, and a title that slid back at its start.
                    await page.waitForFunction((slug) => {
                        const r = document.querySelector(`#row-${slug}`);
                        const line = r.querySelector('.line');
                        return !r.classList.contains('on') && Math.abs(line.getBoundingClientRect().left - r.querySelector('.what').getBoundingClientRect().left) < 0.01;
                    }, slug, { timeout: 5000 }).catch(() => {});
                }
                if (width < 720) continue;

                // A sub-project's title that is too long for its column: the indent is part of the text that is
                // cut (the line is the indent and the title), it fades before the column's edge like any other,
                // and pointed at it slides until the END OF THE TITLE is where the fade begins, the indent
                // gone with it, then is home in 0.2s. The one that is cut the most; a title cut by less than
                // 2px has too short a way to follow.
                const m = await list();
                const worst = m.rows.filter(r => subs.has(r.slug)).map(r => ({ r, slug: r.slug, over: r.cells[0].text - (r.cells[0].width - FADE) })).sort((a, b) => b.over - a.over)[0];
                if (worst.over < 2) { check(`6. at ${width}px: ok (no sub-project's title is cut by 2px or more; the checks of a cut sub-project title were skipped)`, true); continue; }
                const { slug } = worst;
                await page.evaluate((slug) => document.querySelector(`#row-${slug}`).scrollIntoView({ block: 'center', behavior: 'instant' }), slug);
                const rest = await row(slug);
                const cell = rest.cells[0];
                const lies = (await rowsAsSet()).rows.find(r => r.slug === slug);
                const inked = await inkAt(rest, cell, m.ground);
                const full = Math.max(...cell.colour.map((v, c) => Math.abs(v - m.ground[c])));
                check(`6. at ${width}px a sub-project's title too long for its column (by ${worst.over.toFixed(1)}px, the indent counted: the line is the ${HOME_INDENT}px of the indent and the title's ${lies.titleWidth.toFixed(1)}px) starts ${HOME_INDENT}px in, is cut at the column's edge and faded before it (${slug})`,
                    Math.abs(lies.indent - HOME_INDENT) <= 0.1 && Math.abs(cell.text - (HOME_INDENT + lies.titleWidth)) <= 0.2 && Math.abs(cell.start) < 0.01 && lies.titleRight > cell.width - FADE
                    && inked.text > full * 0.6 && inked.after <= 6 && inked.fade <= full * 0.5,
                    `the line ${cell.text}px for ${(HOME_INDENT + lies.titleWidth).toFixed(2)}; the title from ${lies.titleLeft.toFixed(2)} to ${lies.titleRight.toFixed(2)} in a column of ${cell.width.toFixed(2)}; ink ${JSON.stringify(inked)} of ${full}`);
                const watch = follow(slug, 0, 'stopped');
                await pointAt(slug);
                await watch;
                const slid = await row(slug);
                const moved = (await rowsAsSet()).rows.find(r => r.slug === slug);
                check(`6. at ${width}px pointing at its row slides that title left, indent and all, until the end of the title is where the fade begins, and it stays there (${slug})`,
                    slid.on && Math.abs(slid.cells[0].start + worst.over) <= 1 && Math.abs(moved.titleRight - (cell.width - FADE)) <= 1 && Math.abs(moved.titleLeft - (HOME_INDENT - worst.over)) <= 1,
                    `the line starts ${slid.cells[0].start.toFixed(2)}px left of its column (wanted ${(-worst.over).toFixed(2)}); the title from ${moved.titleLeft.toFixed(2)} to ${moved.titleRight.toFixed(2)}, the fade begins at ${(cell.width - FADE).toFixed(2)}`);
                const gone = home(slug, 0);
                await page.mouse.move(1, 1);
                const took = await gone;
                const back = await row(slug);
                const again = (await rowsAsSet()).rows.find(r => r.slug === slug);
                check(`6. at ${width}px when the pointer leaves, that title is back in 0.2s, ${HOME_INDENT}px in from its column's start`, Math.abs(took - 0.2) < 0.005 && Math.abs(back.cells[0].start) < 0.01 && !back.on && Math.abs(again.indent - HOME_INDENT) <= 0.1, `${took}s, the line at ${back.cells[0].start}, the title ${again.indent.toFixed(3)}px in`);
            }

            // A sub-project's own page is as it was: its years in its information, its title in the header Bold.
            {
                const kid = published.filter(p => subs.has(p.data.slug) && text(p.data.years)).sort((a, b) => text(b.data.years).length - text(a.data.years).length)[0];
                if (!kid) check('3. a sub-project\'s own page: ok (no sub-project in content has years; the check was skipped)', true);
                else {
                    await page.setViewportSize({ width: 1366, height: 710 });
                    await page.goto(`${base}/projects/${kid.data.slug}/`);
                    await page.evaluate(() => document.fonts.ready.then(() => true));
                    const own = await page.evaluate(() => {
                        const years = document.querySelector('#project-info .facts .years');
                        const title = document.querySelector('.project-head h1');
                        return { years: years?.textContent ?? null, shown: Boolean(years) && years.getClientRects().length > 0 && getComputedStyle(years).visibility === 'visible', title: getComputedStyle(title).fontWeight };
                    });
                    const want = spaced(shortYears(text(kid.data.years)));
                    check(`3. a sub-project's own page still shows its years in its information (${want}), and its title in the header is Bold (${kid.data.slug})`, spaced(own.years ?? '') === want && own.shown && own.title === '700', JSON.stringify(own));
                }
            }

            for (const [width, height] of [[720, 800], [800, 600], [1024, 768], [1366, 710], [1920, 1080]]) {
                await show(width, height);
                const first = await page.evaluate(() => window.__mutations());
                check(`6. zero mutations on first render at ${width}px: /`, first.length === 0, first.slice(0, 5).join('; '));
                let m = await list();
                // A row's date starts 12px from the list's left edge.
                const padding = 12;
                // The date column: the widest date printed, 5px of air and the 27.2px the hover chevron takes.
                const widest = Math.max(...m.rows.map(r => r.dateWidth));
                const dates = widest + 32.2;
                const shared = m.width - padding - dates - 16 - 15;
                const want = { date: m.left + padding, title: m.left + padding + dates, titleWidth: shared * 11 / 21, type: m.left + padding + dates + shared * 11 / 21 + 15, typeWidth: shared * 10 / 21 };
                const near = (a, b) => Math.abs(a - b) <= 0.5;
                const fits = (c) => c.text <= c.width - FADE + 0.01;

                const tall = m.rows.filter(r => Math.abs(r.height - m.slot) > 0.05 || (printedDates[r.slug] ? Math.abs(r.dateLines - 1) > 0.01 : r.dateLines > 1.01) || r.cells.some(c => Math.abs(c.lines - 1) > 0.01 || Math.abs(c.middle) > 0.5));
                const span = m.rows.at(-1).bottom - m.rows[0].top;
                check(`6. at ${width}px every row of the list is one line, in the middle of a row ${m.slot}px tall, the same at every width`, m.rows.length === published.length && tall.length === 0 && Math.abs(span - m.rows.length * m.slot) <= 0.02 * m.rows.length + 0.05, `${tall.slice(0, 5).map(r => `${r.slug} ${r.height}px`).join(', ')}; ${m.rows.length} rows in ${span}px`);

                const off = m.rows.filter(r => !near(r.date, want.date) || !near(r.cells[0].left, want.title) || !near(r.cells[0].width, want.titleWidth) || (r.cells[1] && (!near(r.cells[1].left, want.type) || !near(r.cells[1].width, want.typeWidth))));
                const types = m.rows.filter(r => r.cells[1]).map(r => r.cells[1].left);
                check(`6. at ${width}px the list's three columns are where the design puts them in every row: the date at ${want.date.toFixed(1)}, the title at ${want.title.toFixed(1)} (the widest date, ${widest.toFixed(1)}px, and 32.2px after the date's start), ${want.titleWidth.toFixed(1)} wide, the type at ${want.type.toFixed(1)}, ${want.typeWidth.toFixed(1)} wide, lined up`,
                    off.length === 0 && (types.length === 0 || Math.max(...types) - Math.min(...types) < 0.01),
                    off.slice(0, 3).map(r => `${r.slug}: date ${r.date}, title ${r.cells[0].left} + ${r.cells[0].width}, type ${r.cells[1]?.left} + ${r.cells[1]?.width}`).join('; '));

                // The dates are Fluxisch Else Light and the titles Bold, a sub-project's title Light (20 Nov 2026),
                // all at the body's 12.5px, in the text colour.
                const set = `${HOME_TYPE.wide} rgb(${m.rows[0].cells[0].colour.join(', ')})`;
                const weights = m.rows.filter(r => r.type !== `300 ${set} | ${subs.has(r.slug) ? 300 : 700} ${set}` || r.child !== subs.has(r.slug));
                check(`6. at ${width}px every row's date is Light (300) and its title Bold (700), a sub-project's title Light (300; ${subs.size} of the ${m.rows.length} rows), all ${HOME_TYPE.wide} in the text colour`,
                    m.rows.length === published.length && weights.length === 0, weights.slice(0, 3).map(r => `${r.slug}: ${r.type}`).join(' ; '));

                // Every column is a box that cuts (not a scroller: nothing to drag with a mouse), with the fade over its
                // last 1em (12.5px), and at rest its text starts at its left edge.
                const fade = new RegExp(`^linear-gradient\\(to right, .*rgb\\(0, 0, 0\\) calc\\(100% - ${FADE}px\\), rgba\\(0, 0, 0, 0\\)\\)$`);
                const loose = m.rows.flatMap(r => r.cells.filter(c => c.cut !== 'clip' || !fade.test(c.mask) || Math.abs(c.start) > 0.01).map(c => `${r.slug}: ${c.cut}, start ${c.start}, ${c.mask}`));
                const cellsOf = (lies) => lies.rows.flatMap(r => r.cells.map((c, i) => ({ slug: r.slug, i, over: c.text - (c.width - FADE), r, c })));
                let cells = cellsOf(m);
                let long = cells.filter(x => !fits(x.c));
                check(`6. at ${width}px every column cuts its text at its right edge, fades it out over the last ${FADE}px and shows it from its start (${long.length} of ${cells.length} texts reach the fade)`, loose.length === 0, loose.slice(0, 3).join('; '));

                // A row whose texts both fit, the one that ends closest to a fade: nothing of it is under the
                // fade, and it does not move while it is pointed at for as long as a text takes to travel 60px.
                const whole = m.rows.filter(r => r.cells.every(fits)).sort((a, b) => Math.min(...a.cells.map(c => c.width - FADE - c.text)) - Math.min(...b.cells.map(c => c.width - FADE - c.text)))[0];
                if (!whole) check(`6. at ${width}px: ok (no row whose title and types both fit; that check was skipped)`, true);
                else {
                    const spare = Math.min(...whole.cells.map(c => c.width - FADE - c.text));
                    const tight = whole.cells.findIndex(c => c.width - FADE - c.text === spare);
                    const watch = follow(whole.slug, tight, 60);
                    await pointAt(whole.slug);
                    const samples = await watch;
                    const pointed = await row(whole.slug);
                    const moved = Math.max(...samples.map(([, start]) => Math.abs(start)), ...pointed.cells.map(c => Math.abs(c.start)));
                    const arrow = pointed.chevron;
                    check(`6. at ${width}px a row whose texts fit is not faded (its longest ends ${spare.toFixed(1)}px before the fade) and does not move when pointed at; the chevron is 14px left of the title's column, in the row's middle (${whole.slug})`,
                        spare >= -0.01 && pointed.on && samples.length > 3 && moved < 0.01
                        && Boolean(arrow) && near(arrow.left, -27.2) && arrow.width === 14 && arrow.height === 16 && near(arrow.middle, 0) && near(pointed.cells[0].left, want.title) && near(pointed.date, want.date),
                        `on=${pointed.on}, ${samples.length} frames, moved ${moved}px, chevron ${JSON.stringify(arrow)}`);
                    await page.mouse.move(1, 1);
                }

                // Where every text fits its column (the content's own all do from about 1270px up), the checks of a
                // text that is cut are made on a made-up one: the first project is given a title and a type list
                // 120px too long for their columns, through the component's own state, as a build with such a
                // project would render it. A page loaded again is given them again.
                let made = null;
                if (!long.length) {
                    made = await lengthen(120);
                    m = await list();
                    cells = cellsOf(m);
                    long = cells.filter(x => !fits(x.c));
                }
                const reshow = async () => { await show(width, height); if (made) await lengthen(120); };
                const madeUp = made ? `; made up for this width, at which every text of the content fits: ${made.slug} with a longer title and ${made.tags} types` : '';
                if (!long.length) { check(`6. at ${width}px: no text is cut, not even one made too long for its column`, false, JSON.stringify(made)); continue; }
                // The title that is cut the most and the type list that is cut the most.
                for (const i of [0, 1]) {
                    const worst = long.filter(x => x.i === i).sort((a, b) => b.over - a.over)[0];
                    const what = i === 0 ? 'title' : 'type list';
                    if (!worst) { check(`6. at ${width}px: ok (no ${what} is cut; its checks were skipped)`, true); continue; }
                    const { slug } = worst;
                    await page.evaluate((slug) => document.querySelector(`#row-${slug}`).scrollIntoView({ block: 'center', behavior: 'instant' }), slug);
                    const rest = await row(slug);
                    const cell = rest.cells[i];
                    const ink = await inkAt(rest, cell, m.ground);
                    const full = Math.max(...cell.colour.map((v, c) => Math.abs(v - m.ground[c])));
                    check(`6. at ${width}px a ${what} too long for its column (by ${worst.over.toFixed(1)}px) is cut at the column's edge and faded before it: nothing after the edge, less than half the ink left in the fade's last 5px (${slug}${madeUp})`,
                        ink.text > full * 0.6 && ink.after <= 6 && ink.fade <= full * 0.5, `${JSON.stringify(ink)} of ${full}`);

                    // Pointed at: it slides left at 100px a second until its end is at the fade's start, and stays there.
                    const watch = follow(slug, i, 'stopped');
                    await pointAt(slug);
                    const samples = await watch;
                    const slid = await row(slug);
                    const end = slid.cells[i].start + cell.text;
                    // The frames on the way, clear of both ends: after the first 0.2s (20px), in which the text sets
                    // off from up to 5px behind the straight line and is level with it at the end, and before the
                    // stop. A way too short to hold three of them is not timed. No frame is a jump: the text is
                    // never faster than at the end of that start (200px a second).
                    const moving = samples.filter(([, start]) => start < -23 && start > -worst.over + 3);
                    const fastest = Math.max(0, ...samples.slice(1).map(([t, start], k) => (samples[k][1] - start) / Math.max(t - samples[k][0], 1) * 1000));
                    const speed = moving.length >= 3 ? (moving[0][1] - moving.at(-1)[1]) / (moving.at(-1)[0] - moving[0][0]) * 1000 : NaN;
                    const drift = moving.length >= 3 ? Math.max(...moving.map(([t, start]) => Math.abs(start - (moving[0][1] - speed * (t - moving[0][0]) / 1000)))) : 0;
                    // The lean of the slanted types puts the top of their last letter up to 1px further right.
                    check(`6. at ${width}px pointing at its row slides the ${what} left until its end is inside the column and clear of the fade, and it stays there`,
                        slid.on && Math.abs(slid.cells[i].start + worst.over) <= 1 && end <= cell.width - FADE + 1 && end > cell.width - FADE - 1, `starts ${slid.cells[i].start}px left of its column, ends ${(cell.width - end).toFixed(2)}px before the edge`);
                    check(`6. at ${width}px the ${what} slides at a steady 100px a second after a 0.2s start (${Number.isNaN(speed) ? 'too short a way to time' : `${speed.toFixed(1)}px/s over ${moving.length} frames, never more than ${drift.toFixed(2)}px off the line`}; no frame faster than ${fastest.toFixed(0)}px/s)`,
                        (Number.isNaN(speed) ? worst.over < 60 : Math.abs(speed - 100) <= 10 && drift <= 1.5) && fastest <= 260, `${samples.length} frames`);
                    const arrow = slid.chevron;
                    check(`6. at ${width}px the slide moves nothing else: the date, both columns and the chevron (14px left of the title's column) are where they were`,
                        near(slid.date, rest.date) && slid.cells.every((c, k) => Math.abs(c.left - rest.cells[k].left) < 0.01 && Math.abs(c.right - rest.cells[k].right) < 0.01)
                        && Boolean(arrow) && near(arrow.left, -27.2) && arrow.width === 14 && arrow.height === 16 && near(arrow.middle, 0) && Math.abs(slid.height - rest.height) < 0.01,
                        `date ${rest.date} → ${slid.date}, chevron ${JSON.stringify(arrow)}`);
                    const gone = home(slug, i);
                    await page.mouse.move(1, 1);
                    const took = await gone;
                    const back = await row(slug);
                    check(`6. at ${width}px when the pointer leaves the ${what} is back at its start in 0.2s`, Math.abs(took - 0.2) < 0.005 && Math.abs(back.cells[i].start) < 0.01 && !back.on, `${took}s, start ${back.cells[i].start}`);

                    // The same from the grid: the pointer on the project's thumbnail.
                    await page.evaluate((slug) => document.querySelector(`#cell-${slug}`).scrollIntoView({ block: 'center', behavior: 'instant' }), slug);
                    const fromGrid = follow(slug, i, 'stopped');
                    await page.hover(`#cell-${slug}`);
                    await fromGrid;
                    const byThumb = await row(slug);
                    const leaving = home(slug, i);
                    await page.mouse.move(1, 1);
                    const left = await leaving;
                    const after = await row(slug);
                    check(`6. at ${width}px pointing at the project's thumbnail slides the ${what} the same way, and it goes back when the pointer leaves`,
                        byThumb.on && Math.abs(byThumb.cells[i].start + worst.over) <= 1 && Math.abs(left - 0.2) < 0.005 && Math.abs(after.cells[i].start) < 0.01, `start ${byThumb.cells[i].start}, wanted ${-worst.over}; back in ${left}s to ${after.cells[i].start}`);

                    // A pointer that leaves and is back before the 0.2s are over (it wobbles between two rows): the
                    // text turns round and glides to where the slide stands, no faster than it was going home
                    // (its way in 0.2s) plus the slide's own speed; it does not jump there in one frame. A way
                    // too short to tell a glide from a jump is not tried.
                    if (worst.over < 40) { check(`6. at ${width}px: ok (the ${what} is cut by too little to time a pointer that comes back; skipped)`, true); continue; }
                    const at = await spot(slug);
                    const there = follow(slug, i, 'stopped');
                    await page.mouse.move(at.x, at.y);
                    await there;
                    await tape(slug, i);
                    const turning = partWay(slug, i);
                    await page.mouse.move(1, 1);
                    await turning;
                    const again = follow(slug, i, 'stopped');
                    await page.mouse.move(at.x, at.y);
                    await again;
                    const taped = await untape();
                    const low = taped.reduce((a, b) => (b[2] < a[2] ? b : a));
                    const rush = Math.max(0, ...taped.slice(1).map(([t, start], k) => (taped[k][1] - start) / Math.max(t - taped[k][0], 1) * 1000));
                    const limit = worst.over / 0.2 * 1.3 + 150;
                    const ended = await row(slug);
                    // Home before the pointer was back (a machine too busy to be back in 0.2s): nothing to judge.
                    if (low[2] < 0.02) check(`6. at ${width}px: ok (the pointer was not back on the ${what}'s row within 0.2s; the check of a pointer that comes back was skipped)`, true);
                    else check(`6. at ${width}px a pointer back on the row before the ${what} is home (${Math.round(low[2] * 100)}% of its slide still showing) sees it glide back to its end, not jump (${rush.toFixed(0)}px/s at most; a jump is over ${limit.toFixed(0)})`,
                        rush <= limit && Math.abs(ended.cells[i].start + worst.over) <= 1 && ended.on, `${taped.length} frames, turned at ${low[1].toFixed(1)}px, ends at ${ended.cells[i].start}`);
                    const settle = home(slug, i);
                    await page.mouse.move(1, 1);
                    await settle;
                }

                // The mouse on a type list that is cut. The list stands still while the pointer is on it, or a
                // tag would slide away from under the pointer before the click. (1) The pointer comes down
                // onto the list's first tag and waits there as long as the slide would have needed to carry
                // that tag out of sight (the title of the same row, which does slide, is the clock): the list
                // has not moved, and the click filters by that tag. (2) The row is pointed at on its date
                // until the list is at its end, then the pointer goes to the last tag: the list stays at its
                // end, and the click filters by that tag. (3) Leaving from there, the list is home in 0.2s and
                // its travel is back at 0, so the next slide starts at the start.
                const reach = long.filter(x => x.i === 1).sort((a, b) => b.over - a.over)[0];
                if (!reach) check(`6. at ${width}px: ok (no type list is cut; the checks of a click with the mouse were skipped)`, true);
                else {
                    const { slug } = reach;
                    const lastTag = reach.c.tags.length - 1;
                    const first = await tagSpot(slug, 0);
                    const clock = follow(slug, 0, Math.max(reach.c.tags[0].right, 0) + 30);
                    await page.mouse.move(first.x, first.y - 2 * m.slot);
                    await page.mouse.move(first.x, first.y, { steps: 3 });
                    await clock;
                    const held = await row(slug);
                    await page.mouse.down();
                    await page.mouse.up();
                    const byFirst = await filteredBy(first.tag);
                    check(`6. at ${width}px the types stand still under the pointer: the mouse on the first tag of the type list that is cut the most, a click once a slide would have carried it away, filters by that tag (${slug}: ${first.tag})`,
                        held.on && Math.abs(held.cells[1].start) < 0.01 && byFirst, `on=${held.on}, the list at ${held.cells[1].start}, ${await page.evaluate(() => decodeURIComponent(location.search))}`);

                    await reshow();
                    let slid = follow(slug, 1, 'stopped');
                    await pointAt(slug);
                    await slid;
                    const atEnd = await row(slug);
                    const last = await tagSpot(slug, lastTag);
                    const more = follow(slug, 0, await travelled(slug, 0) + 60);
                    await page.mouse.move(last.x, last.y);
                    await more;
                    const stayed = await row(slug);
                    await page.mouse.down();
                    await page.mouse.up();
                    const byLast = await filteredBy(last.tag);
                    check(`6. at ${width}px once the row's slide has brought the last tag into the column, the pointer on that tag keeps the list at its end and a click filters by it (${slug}: ${last.tag})`,
                        Math.abs(atEnd.cells[1].start + reach.over) <= 1 && stayed.on && Math.abs(stayed.cells[1].start - atEnd.cells[1].start) < 0.01 && byLast, `the list at ${atEnd.cells[1].start} → ${stayed.cells[1].start}, wanted ${-reach.over}; ${await page.evaluate(() => decodeURIComponent(location.search))}`);

                    await reshow();
                    slid = follow(slug, 1, 'stopped');
                    await pointAt(slug);
                    await slid;
                    const end = await tagSpot(slug, lastTag);
                    const pause = follow(slug, 0, await travelled(slug, 0) + 30);
                    await page.mouse.move(end.x, end.y);
                    await pause;
                    const leaving = home(slug, 1);
                    await page.mouse.move(1, 1);
                    const took = await leaving;
                    const reset = await page.waitForFunction((slug) => getComputedStyle(document.querySelectorAll(`#row-${slug} .clip`)[1].querySelector('.line')).getPropertyValue('--index-slid') === '0px', slug, { timeout: 3000 }).then(() => true, () => false);
                    const gone = await row(slug);
                    check(`6. at ${width}px leaving the row from a tag sends the list home in 0.2s, and its next slide starts at the start`,
                        Math.abs(took - 0.2) < 0.005 && reset && Math.abs(gone.cells[1].start) < 0.01 && !gone.on, `${took}s, travel reset: ${reset}, the list at ${gone.cells[1].start}`);
                    await reshow();
                }

                // The keyboard: a tag that is cut at rest is reached with Tab, is then whole inside its column
                // before the fade with room for its focus ring, stays there while the row is pointed at as
                // well, and filters on Enter. When focus leaves, the column shows its start again. Rather a
                // tag of which 32px or more show at rest: Chromium does not scroll to such a one by itself.
                const showing = (x) => x.width - x.t.left;
                const hidden = long.filter(x => x.i === 1).flatMap(x => x.c.tags.map((t, n) => ({ slug: x.slug, n, t, width: x.c.width, text: x.c.text })))
                    .filter(x => x.t.right > x.width - FADE && x.t.right - x.t.left <= x.width - FADE - 5)
                    .sort((a, b) => (showing(b) >= 32) - (showing(a) >= 32) || b.t.left - a.t.left)[0];
                if (!hidden) { check(`6. at ${width}px: ok (no tag is cut at rest that would fit its column whole; the keyboard check was skipped)`, true); continue; }
                const { slug, n } = hidden;
                await page.evaluate((slug) => document.querySelector(`#row-${slug} .title`).focus(), slug);
                for (let k = 0; k <= n; k++) await page.keyboard.press('Tab');
                const focused = () => page.evaluate(({ slug, n }) => {
                    const tag = document.querySelectorAll(`#row-${slug} .tag`)[n];
                    return document.activeElement === tag && tag.matches(':focus-visible');
                }, { slug, n });
                const inside = (r) => { const t = r.cells[1].tags[n]; return t.left >= -1 && t.right <= r.cells[1].width - FADE + 1; };
                await page.waitForFunction(({ slug, n, FADE }) => {
                    const cell = document.querySelectorAll(`#row-${slug} .clip`)[1];
                    const tag = cell.querySelectorAll('.tag')[n].getBoundingClientRect();
                    return tag.right <= cell.getBoundingClientRect().right - FADE + 1;
                }, { slug, n, FADE }, { timeout: 5000 }).catch(() => {});
                const onTag = await focused();
                const seen = await row(slug);
                const tag = seen.cells[1].tags[n];
                // The ring is 2px, 2px from the tag: 4px on every side must be inside the column's box and before the fade.
                const ring = tag.left - 4 >= -seen.cells[1].room - 1 && tag.top >= 4 && tag.bottom >= 4 && tag.right + 4 <= seen.cells[1].width - FADE + 1;
                check(`6. at ${width}px a tag cut at rest (${Math.max(0, showing(hidden)).toFixed(1)}px of its ${(hidden.t.right - hidden.t.left).toFixed(1)}px inside a ${hidden.width.toFixed(1)}px column) is reached with Tab and is then whole inside its column, clear of the fade, its focus ring uncut (${slug}: ${hidden.t.tag})`,
                    onTag && inside(seen) && ring, `focused=${onTag}, tag ${tag.left.toFixed(2)} to ${tag.right.toFixed(2)} of ${seen.cells[1].width.toFixed(2)}, ${tag.top} / ${tag.bottom} above and below`);
                // The row is pointed at as well (focus has already highlighted it): once its title would have travelled 60px, the tag has not moved.
                const meanwhile = follow(slug, 0, 60);
                await pointAt(slug);
                await meanwhile;
                const both = await row(slug);
                check(`6. at ${width}px pointing at the row of the focused tag does not move the tag`, await focused() && Math.abs(both.cells[1].tags[n].left - tag.left) < 0.01 && Math.abs(both.cells[1].start - seen.cells[1].start) < 0.01, `${tag.left} → ${both.cells[1].tags[n].left}`);
                await page.mouse.move(1, 1);
                await page.keyboard.press('Enter');
                const filtered = await page.waitForFunction((t) => new URLSearchParams(location.search).get('filter') === t && [...document.querySelectorAll('project-index .row')].every(r => r.querySelector(`.tag[data-tag="${CSS.escape(t)}"]`)), hidden.t.tag, { timeout: 5000 }).then(() => true, () => false);
                const kept = await focused();
                const shown = await row(slug);
                check(`6. at ${width}px Enter on that tag filters by it, and it keeps focus, still whole inside its column`, filtered && kept && inside(shown), `${await page.evaluate(() => location.search)} focused=${kept}`);
                await page.evaluate(() => document.activeElement.blur());
                await page.waitForFunction((slug) => !document.querySelector(`#row-${slug}`).classList.contains('on'), slug, { timeout: 5000 }).catch(() => {});
                const released = await row(slug);
                check(`6. at ${width}px when focus has left, the type column shows its start again`, !released.on && Math.abs(released.cells[1].start) < 0.01 && released.cells[1].cut === 'clip', `start ${released.cells[1].start}, ${released.cells[1].cut}`);
            }
        }

        // 7. the Index on a phone: one column of thumbnails, each with its title under it
        {
            const titles = Object.fromEntries(published.map(p => [p.data.slug, String(p.data.title).trim()]));
            // The pointer rests on the header, before the page loads and after: below 720px a cell is as wide
            // as the page, so a pointer left anywhere over the grid would highlight a row.
            const away = async () => {
                await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
                await page.mouse.move(1, 1);
                await page.waitForTimeout(50);
            };
            const open = async (width, height) => {
                await page.setViewportSize({ width, height });
                await page.mouse.move(1, 1);
                await page.goto(`${base}/`);
                await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
                await page.evaluate(() => document.fonts.ready.then(() => true));
            };

            // From 720px up nothing shows of the titles, and every cell keeps its fixed proportion.
            const fixed = () => page.evaluate(({ edge, gap }) => {
                const names = [...document.querySelectorAll('project-index .name')];
                const cells = [...document.querySelectorAll('project-index .cell')];
                const quarter = (document.documentElement.clientWidth - 2 * edge - gap) / 4;
                return {
                    names: names.length,
                    shown: names.filter(n => n.getClientRects().length > 0 || getComputedStyle(n).display !== 'none').length,
                    off: cells.filter((c) => {
                        const r = c.getBoundingClientRect();
                        return Math.abs(r.width - quarter) > 0.5 || Math.abs(r.width / r.height - 341.2 / 197.12) > 0.005;
                    }).length,
                    pair: cells.length < 2 || Math.abs(cells[0].getBoundingClientRect().top - cells[1].getBoundingClientRect().top) < 0.5,
                    sized: cells.filter(c => c.querySelector('.box')).map(c => ({ name: c.dataset.slug, width: c.querySelector('.box').getBoundingClientRect().width, sizes: [c.querySelector('img').getAttribute('sizes'), c.querySelector('source')?.getAttribute('sizes') ?? null] })),
                    vw: innerWidth,
                    vh: innerHeight,
                };
            }, { edge: HOME_EDGE, gap: HOME_GAP });
            for (const [width, height] of [[1920, 1080], [1366, 710], [720, 800]]) {
                await open(width, height);
                const { sized, vw, vh, ...m } = await fixed();
                check(`7. at ${width}×${height} the titles under the thumbnails are not displayed and take no space: a cell is a quarter of what the two columns have (${homeCell(width)}px) at 341.2 : 197.12, two to a row`, m.names === published.length && m.shown === 0 && m.off === 0 && m.pair, JSON.stringify(m));
                // The same attribute serves every width: also at the narrowest and at a wide side-by-side window.
                const off = sizesOff(sized, vw, vh);
                check(`7. at ${width}×${height} every thumbnail's sizes attribute gives the width it is shown at, to the pixel (${sized.length} thumbnails)`, sized.length > 0 && off.length === 0, off.slice(0, 3).join(' | '));
            }

            // Below 720px: what is wrong with each cell, by slug, and the list's frame under the grid.
            const phone = () => page.evaluate(({ titles, shadow, exact, fit, line }) => {
                const page = document.documentElement.clientWidth;
                const box = (el) => el.getBoundingClientRect();
                const cells = [...document.querySelectorAll('project-index .cell')];
                const rows = [...document.querySelectorAll('project-index .row')];
                const bad = { rows: [], titles: [], thumbs: [], sized: [] };
                // A colour of the stylesheet as the browser gives it back, and the thin line as it draws it.
                const probe = document.createElement('i');
                probe.style.cssText = `position: absolute; color: var(--caption); border-top: ${line} solid var(--line);`;
                document.body.append(probe);
                const caption = getComputedStyle(probe).color;
                const rule = `${getComputedStyle(probe).borderTopWidth} ${getComputedStyle(probe).borderTopStyle} ${getComputedStyle(probe).borderTopColor}`;
                probe.remove();
                window.__mutations?.();
                cells.forEach((c, i) => {
                    const slug = c.dataset.slug;
                    const a = box(c);
                    const frame = c.querySelector('.box');
                    const name = c.querySelector('.name');
                    const next = cells[i + 1];
                    const f = frame ? box(frame) : null;

                    // one cell to a row, as wide as the page
                    if (Math.abs(a.left) > 0.5 || Math.abs(a.width - page) > 0.5 || (i > 0 && a.top < box(cells[i - 1]).bottom - 0.5)) bad.rows.push(slug);

                    // the title: shown, the project's own, 16px under its picture and 44px before the next one
                    // (22px under it in its own cell, 22px over the next picture in the next), so nearer to its own
                    const n = name ? box(name) : null;
                    const first = next ? next.querySelector('.box') ?? next.querySelector('.name') : null;
                    const after = first ? box(first).top - n?.bottom : null;
                    const under = f ? n?.top - f.bottom : null;
                    const why = [];
                    if (!name || name.getClientRects().length === 0 || getComputedStyle(name).visibility !== 'visible' || n.height < 18) why.push('not shown');
                    else {
                        if (name.textContent !== titles[slug]) why.push(`reads "${name.textContent}"`);
                        if (n.top < a.top - 0.5 || n.bottom > a.bottom + 0.5) why.push('outside its cell');
                        if (under !== null && !(under > 0 && Math.abs(under - fit.under) < 0.5)) why.push(`${under.toFixed(2)}px under its picture, not ${fit.under}`);
                        if (after !== null && !(after > 0 && Math.abs(after - 2 * fit.pad) < 0.5)) why.push(`${after.toFixed(2)}px before the next, not ${2 * fit.pad}`);
                        if (Math.abs(a.bottom - n.bottom - fit.pad) > 0.5) why.push(`${(a.bottom - n.bottom).toFixed(2)}px over its cell's end, not ${fit.pad}`);
                        if (under !== null && after !== null && !(under < after)) why.push('nearer to the next picture than to its own');
                        if (n.width > page * fit.name + 0.5 || Math.abs((n.left + n.right) / 2 - page / 2) > 0.5) why.push(`not centred within ${fit.name * 100}% of the page`);
                        if (getComputedStyle(name).color !== caption) why.push(`${getComputedStyle(name).color}, not the caption colour`);
                    }
                    if (why.length) bad.titles.push(`${slug}: ${why.join(', ')}`);

                    // the thumbnail: whole, centred, without a border, with the shadow, as large as fits the page's
                    // width less 124px and 132% of that width in height: one of the two exactly; 22px under its cell's top
                    if (frame) {
                        const s = getComputedStyle(frame);
                        const img = frame.querySelector('img');
                        const im = box(img);
                        const limit = { width: page - fit.side, height: page * fit.height };
                        const wrong = [];
                        if (Math.abs(f.width / f.height - img.getAttribute('width') / img.getAttribute('height')) > 0.01
                            || Math.abs(im.width - f.width) > 0.5 || Math.abs(im.height - f.height) > 0.5) wrong.push('cropped, or not filling its box');
                        if (getComputedStyle(img).objectFit !== 'fill') wrong.push(`object-fit: ${getComputedStyle(img).objectFit}`);
                        bad.sized.push({ name: slug, width: f.width, sizes: [img.getAttribute('sizes'), frame.querySelector('source')?.getAttribute('sizes') ?? null] });
                        if (!['Top', 'Right', 'Bottom', 'Left'].every(k => s[`border${k}Width`] === '0px')) wrong.push(`a border (${s.borderTopWidth})`);
                        if (s.boxShadow !== shadow) wrong.push(`shadow ${s.boxShadow}`);
                        if (Math.abs((f.left + f.right) / 2 - page / 2) > 0.5) wrong.push('not centred');
                        if (f.width > limit.width + exact || f.height > limit.height + exact) wrong.push('too large');
                        if (Math.abs(f.width - limit.width) > exact && Math.abs(f.height - limit.height) > exact) wrong.push(`neither side on its limit (${f.width} × ${f.height} in ${limit.width} × ${limit.height})`);
                        if (Math.abs(f.top - a.top - fit.pad) > 0.5 || f.bottom > a.bottom + 0.5) wrong.push(`${(f.top - a.top).toFixed(2)}px under its cell's top, not ${fit.pad}`);
                        if (wrong.length) bad.thumbs.push(`${slug}: ${wrong.join(', ')}`);
                    }
                });
                const index = document.querySelector('project-index .index');
                const list = box(index);
                const ls = getComputedStyle(index);
                const last = cells.length ? box(cells[cells.length - 1]) : null;
                const head = document.querySelector('project-index .head');
                return {
                    ...bad,
                    cells: cells.map(c => c.dataset.slug),
                    list: rows.map(r => r.dataset.slug),
                    under: !last || list.top >= last.bottom - 0.5,
                    scroll: document.documentElement.scrollWidth - page,
                    vw: innerWidth,
                    vh: innerHeight,
                    page,
                    // the list's frame: 32px under the grid, 16px from either edge of the page, a thin line over it and
                    // no other border, its first row 20px under the line, 48px after its last row, where the page ends;
                    // a row as wide as the list (no side padding) and at least 28px tall
                    frame: {
                        left: list.left,
                        right: list.right,
                        gap: last ? list.top - last.bottom : null,
                        rule: `${ls.borderTopWidth} ${ls.borderTopStyle} ${ls.borderTopColor}`,
                        wanted: rule,
                        others: [ls.borderRightWidth, ls.borderBottomWidth, ls.borderLeftWidth].join(' '),
                        first: rows.length ? box(rows[0]).top - list.top - parseFloat(ls.borderTopWidth) : null,
                        after: rows.length ? list.bottom - box(rows.at(-1)).bottom : null,
                        end: document.documentElement.scrollHeight - (list.bottom + scrollY),
                        rows: rows.filter((r) => { const b = box(r); return Math.abs(b.left - list.left) > 0.5 || Math.abs(b.right - list.right) > 0.5 || b.height < 28 - 0.05 || parseFloat(getComputedStyle(r).paddingLeft) + parseFloat(getComputedStyle(r).paddingRight) > 0; }).map(r => r.dataset.slug),
                        shortest: Math.min(...rows.map(r => box(r).height)),
                        words: Boolean(head) && head.getClientRects().length === 0 && getComputedStyle(document.querySelector('project-index .images'), '::before').content === 'none',
                    },
                    // every row's date and title, the titles under the thumbnails, and the page's own type
                    type: rows.map(r => ({ slug: r.dataset.slug, set: [r.querySelector('.years'), r.querySelector('.title')].map(el => `${getComputedStyle(el).fontWeight} ${getComputedStyle(el).fontSize}`).join(' | ') })),
                    names: [...new Set(cells.map(c => `${getComputedStyle(c.querySelector('.name')).fontWeight} ${getComputedStyle(c.querySelector('.name')).fontSize}`))],
                    body: [getComputedStyle(document.body).fontSize, getComputedStyle(document.body).lineHeight, getComputedStyle(document.body).fontWeight].join(' / '),
                };
            }, { titles, shadow: SHADOW, exact: EXACT, fit: HOME_PHONE, line: '0.67px' });
            // What is off in the list's frame, or ''.
            const frameOff = (m) => {
                const f = m.frame;
                const near = (a, b) => a !== null && Math.abs(a - b) <= 0.5;
                const off = [];
                if (!near(f.left, 16) || !near(f.right, m.page - 16)) off.push(`the list from ${f.left} to ${f.right}`);
                if (!near(f.gap, 32)) off.push(`${f.gap}px under the grid, not 32`);
                if (f.rule !== f.wanted || f.others !== '0px 0px 0px') off.push(`its line ${f.rule} (wanted ${f.wanted}), other borders ${f.others}`);
                if (!near(f.first, 20) || !near(f.after, 48) || !near(f.end, 0)) off.push(`the first row ${f.first}px under the line, ${f.after}px after the last, the page ${f.end}px longer`);
                if (f.rows.length || !near(f.shortest, 28)) off.push(`${f.rows.length} rows not as wide as the list or under 28px (${f.rows.slice(0, 3).join(', ')}); the shortest ${f.shortest}px`);
                if (!f.words) off.push('the columns\' strips or their words show');
                return off.join('; ');
            };
            // The first project with a title made longer, a word at a time, until it takes three lines under its
            // thumbnail (through the component's own state, as a title typed in the CMS would arrive): the
            // title's box and its lines; then the state as it was, and whether the cell is as it was.
            const longName = () => page.evaluate(() => {
                const el = document.querySelector('project-index');
                const all = el.state.projects;
                const name = () => document.querySelector(`#cell-${all[0].slug} .name`);
                const cell = () => { const b = document.querySelector(`#cell-${all[0].slug}`).getBoundingClientRect(); return [b.width, b.height, name().textContent].join(' / '); };
                const linesOf = (node) => {
                    const range = document.createRange();
                    range.selectNodeContents(node);
                    const rows = new Map();
                    for (const r of [...range.getClientRects()].filter(r => r.width > 0)) {
                        const key = Math.round((r.top + r.bottom) / 2);
                        const row = [...rows.keys()].find(k => Math.abs(k - key) <= 3) ?? key;
                        const at = rows.get(row) ?? { left: Infinity, right: -Infinity };
                        rows.set(row, { left: Math.min(at.left, r.left), right: Math.max(at.right, r.right) });
                    }
                    return [...rows].sort((a, b) => a[0] - b[0]).map(([, ends]) => ends);
                };
                const before = cell();
                let { title } = all[0];
                let added = 0;
                for (; added < 400 && linesOf(name()).length < 3; added++) {
                    title += ' and on';
                    el.setState({ projects: all.map((p, k) => (k === 0 ? { ...p, title } : p)) });
                }
                const b = name().getBoundingClientRect();
                const got = { slug: all[0].slug, added, page: document.documentElement.clientWidth, width: b.width, left: b.left, right: b.right, height: b.height, lines: linesOf(name()) };
                el.setState({ projects: all });
                return { ...got, back: cell() === before };
            });
            const want = JSON.stringify(published.map(p => p.data.slug).sort());
            for (const [width, height] of [[390, 844], [360, 740], [719, 900]]) {
                await open(width, height);
                if (width === 390) {
                    const first = await page.evaluate(() => window.__mutations());
                    check('7. zero mutations on first render at 390px: /', first.length === 0, first.slice(0, 5).join('; '));
                    const forced = await page.evaluate(() => { document.querySelector('project-index').render(); return window.__mutations(); });
                    check('7. zero mutations on el.render() at 390px: /', forced.length === 0, forced.slice(0, 5).join('; '));
                }
                const m = await phone();
                const at = `at ${width}×${height}`;
                check(`7. ${at} one cell to a row, each as wide as the page, the list under the grid, no horizontal scroll`, m.rows.length === 0 && m.under && m.scroll <= 0 && JSON.stringify([...m.cells].sort()) === want, `${m.rows.slice(0, 5).join(', ')} under=${m.under} scroll=${m.scroll} cells=${m.cells.length}`);
                check(`7. ${at} every project's title shows under its thumbnail, in the caption colour, centred within 88% of the page: 16px under its own picture, 44px before the next`, m.titles.length === 0 && m.cells.length === published.length, m.titles.slice(0, 5).join(' | '));
                check(`7. ${at} every thumbnail is whole, centred, without a border, with the shadow, filling its box edge to edge, and as large as fits the page's width less 124px and 132% of that width in height: the side that limits it is exactly on its limit`, m.thumbs.length === 0, m.thumbs.slice(0, 5).join(' | '));
                {
                    const off = sizesOff(m.sized, m.vw, m.vh);
                    check(`7. ${at} every thumbnail's sizes attribute gives the width it is shown at, to the pixel`, m.sized.length > 0 && off.length === 0, off.slice(0, 3).join(' | '));
                }
                {
                    // Both limits, whatever the covers of the content are: a picture of 3 : 1 is the page less 124px
                    // wide, one of 1 : 3 is 132% of the page's width tall, and the build's `sizes` says those widths.
                    const wide = await reshaped(page, 3);
                    const tall = await reshaped(page, 0.3333);
                    check(`7. ${at} a thumbnail of 3 : 1 is limited by the page's width less 124px and one of 1 : 3 by its height, 132% of the page's width, each centred, and the build's sizes for such pictures gives those widths to the pixel`,
                        Math.abs(wide.width - (wide.page - HOME_PHONE.side)) <= EXACT && Math.abs(wide.height - wide.width / 3) <= 0.5 && wide.off < 0.5 && Math.abs(wide.sizes - wide.width) <= 1
                        && Math.abs(tall.height - tall.page * HOME_PHONE.height) <= EXACT && Math.abs(tall.width - tall.height * 0.3333) <= 0.5 && tall.off < 0.5 && Math.abs(tall.sizes - tall.width) <= 1,
                        JSON.stringify({ wide, tall }));
                }
                check(`7. ${at} the list lies 32px under the grid, 16px from either edge of the page, under a thin line (0.67px in the line colour, as the browser draws it) and no other: its first row 20px under the line, every row as wide as the list and at least 28px tall, 48px after the last row; the columns' strips and their two words do not show`,
                    frameOff(m) === '', frameOff(m));
                {
                    const off = m.type.filter(r => r.set !== `300 ${HOME_TYPE.narrow} | ${subs.has(r.slug) ? 300 : 700} ${HOME_TYPE.narrow}`);
                    check(`7. ${at} the type is 14.5px on an 18px line, Light; in the list every date is Light (300), every title Bold (700) and a sub-project's title Light (300); under the thumbnails every title is Light`,
                        m.body === HOME_BODY.narrow && m.type.length === published.length && off.length === 0 && m.names.length === 1 && m.names[0] === `300 ${HOME_TYPE.narrow}`, `body ${m.body}; rows ${off.slice(0, 3).map(r => `${r.slug}: ${r.set}`).join(' ; ')}; under the thumbnails ${m.names.join(', ')}`);
                }
                {
                    // The limit of a title under its thumbnail, 88% of the page: at these widths no title of the
                    // content is that long (the widest is under 300px), so the limit is tried on a made-up one, the
                    // first project's own with words added until it takes three lines, through the component's
                    // own state (and the state is put back). Its box is then exactly as wide as it may be, centred,
                    // its lines inside it, 18px each.
                    const long = await longName();
                    const limit = long.page * HOME_PHONE.name;
                    check(`7. ${at} a title too long for one line under its thumbnail (made up: the first project's with "and on" added ${long.added} times, ${long.lines.length} lines) is as wide as 88% of the page and no wider, centred, its lines inside that and 18px each; with its own title back, the cell is as it was`,
                        long.lines.length >= 3 && Math.abs(long.width - limit) <= 0.5 && Math.abs((long.left + long.right) / 2 - long.page / 2) <= 0.5 && Math.abs(long.height - long.lines.length * 18) <= 0.5
                        && long.lines.every(l => l.left >= long.left - 0.5 && l.right <= long.right + 0.5 && Math.abs((l.left + l.right) / 2 - long.page / 2) <= 1) && long.back,
                        `${long.slug}: ${long.width}px wide in a page of ${long.page}px (88% is ${limit}px), from ${long.left} to ${long.right}, ${long.height}px tall; lines ${long.lines.map(l => `${l.left.toFixed(1)} to ${l.right.toFixed(1)}`).join(', ')}; put back: ${long.back}`);
                }
            }

            // The title under a thumbnail is in the page's own type (Light, the list's size and line), in the caption
            // colour, where a main project's title in the list is Bold in the text colour; pointing at the thumbnail
            // or focusing it turns both the link colour.
            // The first cell: it is on screen, so neither pointing at it nor focusing it scrolls the page under the pointer.
            await open(390, 844);
            const slug = await page.evaluate(() => document.querySelector('project-index .cell').dataset.slug);
            const type = await page.evaluate((slug) => {
                const pick = (el) => { const s = getComputedStyle(el); return [s.fontFamily, s.fontWeight, s.fontSize, s.lineHeight, s.color].join(' / '); };
                const cell = document.querySelector(`#cell-${slug}`);
                const probe = document.createElement('i');
                probe.style.cssText = 'position: absolute; color: var(--caption);';
                document.body.append(probe);
                const caption = pick(probe);
                probe.style.color = 'var(--link)';
                const link = getComputedStyle(probe).color;
                probe.remove();
                window.__mutations?.();
                return {
                    name: pick(cell.querySelector('.name')),
                    caption,
                    link,
                    title: pick(document.querySelector(`#row-${slug} .title`)),
                    body: pick(document.body),
                    align: getComputedStyle(cell.querySelector('.name')).textAlign,
                    wrap: getComputedStyle(cell.querySelector('.name')).textWrapStyle ?? getComputedStyle(cell.querySelector('.name')).textWrap,
                    line: getComputedStyle(cell).textDecorationLine,
                };
            }, slug);
            check('7. the title under a thumbnail is in the page\'s type (Fluxisch Else Light, 14.5px on an 18px line) in the caption colour, centred, its lines balanced, not underlined; the list\'s title is Bold in the text colour',
                type.name === type.caption && type.name.split(' / ').slice(0, 4).join() === type.body.split(' / ').slice(0, 4).join() && type.name.includes(` / 300 / ${HOME_TYPE.narrow} / 18px / `) && /Fluxisch Else/.test(type.name)
                && type.title === type.body.replace(' / 300 / ', ' / 700 / ') && type.align === 'center' && /balance/.test(type.wrap) && type.line === 'none', JSON.stringify(type));
            const colours = () => page.evaluate((slug) => ({
                name: getComputedStyle(document.querySelector(`#cell-${slug} .name`)).color,
                title: getComputedStyle(document.querySelector(`#row-${slug} .title`)).color,
                on: [...document.querySelectorAll('project-index .row.on')].map(r => r.dataset.slug).join(','),
                muts: window.__mutations(),
            }), slug);
            const rest = await colours();
            await page.hover(`#cell-${slug}`);
            await page.waitForTimeout(50);
            const pointed = await colours();
            await away();
            const left = await colours();
            await page.evaluate((slug) => document.querySelector(`#cell-${slug}`).focus({ preventScroll: true }), slug);
            await page.waitForTimeout(50);
            const focused = await colours();
            await page.evaluate(() => document.activeElement.blur());
            check('7. pointing at a thumbnail or focusing it turns its title the link colour, highlights its row and touches nothing else',
                rest.name !== rest.title && rest.on === ''
                && pointed.name === type.link && pointed.name === pointed.title && pointed.on === slug
                && left.name === rest.name && left.title === rest.title && left.on === ''
                && focused.name === pointed.name && focused.on === slug
                && [...pointed.muts, ...left.muts, ...focused.muts].every(m => m === 'attributes LI [class]'),
                JSON.stringify({ rest: [rest.name, rest.title], pointed: [pointed.name, pointed.title], left: left.name, focused: focused.name, on: [pointed.on, focused.on], link: type.link }));

            // A tag clicked on a phone: the grid and the list show the same projects, and the survivors are the same nodes.
            await open(390, 844);
            await page.evaluate(() => {
                window.__before = new Map([...document.querySelectorAll('project-index .row, project-index .cell')].map(e => [e.id, e]));
                window.__mutations();
            });
            await page.click(`project-index .tag[data-tag=${JSON.stringify(tagA)}]`);
            await page.waitForTimeout(50);
            const kept = await page.evaluate(() => {
                const all = [...document.querySelectorAll('project-index .row, project-index .cell')];
                const muts = window.__mutations();
                return {
                    url: location.search,
                    same: all.every(e => window.__before.get(e.id) === e),
                    other: muts.filter(m => !m.startsWith('childList') && !/\[(class|aria-pressed)\]$/.test(m)),
                };
            });
            await away();
            const some = await phone();
            const tag = JSON.stringify(tagged(tagA));
            check(`7. at 390px clicking a tag filters the grid and the list alike (${tagA}), and the morph only removes`,
                kept.url === `?filter=${encodeURIComponent(tagA)}` && JSON.stringify([...some.cells].sort()) === tag && JSON.stringify([...some.list].sort()) === tag && kept.same && kept.other.length === 0,
                `${kept.url} cells=${some.cells.length} rows=${some.list.length} want=${tagged(tagA).length} ${kept.other.slice(0, 5).join('; ')}`);
            check('7. at 390px the filtered grid keeps its layout: one cell to a row, titles under their thumbnails, the list in its frame under them', some.rows.length === 0 && some.titles.length === 0 && some.thumbs.length === 0 && some.under && some.scroll <= 0 && frameOff(some) === '', [...some.rows, ...some.titles, ...some.thumbs, frameOff(some)].slice(0, 5).join(' | '));
            await page.click('project-index .tag.on');
            await page.waitForTimeout(50);
            const again = await page.evaluate(() => ({ url: location.search, cells: document.querySelectorAll('project-index .cell').length, rows: document.querySelectorAll('project-index .row').length }));
            check('7. at 390px clicking the tag again brings every thumbnail and row back', again.url === '' && again.cells === published.length && again.rows === published.length, JSON.stringify(again));

            // Below 720px the grid is above the list, so a filter turned off puts thousands of pixels back above
            // the tag that was tapped: the page follows, and the tag is still where the finger is.
            const stay = await page.evaluate((t) => {
                const tag = [...document.querySelectorAll('project-index .tag')].find(x => x.dataset.tag === t);
                tag.scrollIntoView({ block: 'center', behavior: 'instant' });
                const start = tag.getBoundingClientRect().top;
                tag.click();
                const on = tag.getBoundingClientRect().top;
                tag.click();
                const off = tag.getBoundingClientRect().top;
                return { start: Math.round(start), on: Math.round(on), off: Math.round(off), window: innerHeight, page: document.documentElement.scrollHeight, filter: location.search };
            }, tagA);
            check('7. at 390px a tag tapped on and then off again is still where it was tapped, not a grid\'s height away',
                stay.filter === '' && stay.on >= 0 && stay.on < stay.window && stay.off >= 0 && stay.off < stay.window && (Math.abs(stay.off - stay.on) <= 1 || Math.abs(stay.off - stay.start) <= 1), JSON.stringify(stay));

            // Below 720px the list is as it was before it had columns: a row's title and types are one flow
            // that wraps, the types 15px after the title (or 15px in on a line of their own); the two
            // columns make no box, so nothing is cut or faded, and nothing moves when a row is pointed at.
            // A sub-project's row (20 Nov 2026) is the same flow 20px further in: its types on
            // a line of their own start 15px in from where its title starts, like a main project's (not 15px
            // in from the column's start, 3px left of the title above them), and a second line of a title
            // starts under its first. 320px is here because that is where most types have a line of their own.
            for (const [width, height] of [[320, 568], [390, 844], [719, 900]]) {
                await open(width, height);
                const flow = () => page.evaluate(() => {
                    const px = (v) => parseFloat(v) || 0;
                    return [...document.querySelectorAll('project-index .row')].map((r) => {
                        const titleLines = [...r.querySelector('.title').getClientRects()];
                        const first = titleLines[0];
                        const last = titleLines.at(-1);
                        const tags = r.querySelector('.tags');
                        const tb = tags?.getBoundingClientRect();
                        const ts = tags ? getComputedStyle(tags) : null;
                        // The slanted types' box is wider than their layout by the lean on each side.
                        const lean = tags ? (tb.width - px(ts.width)) / 2 : 0;
                        const beside = tags && tb.top < last.bottom - 1 && tb.bottom > last.top + 1 && tb.left > last.left;
                        const what = r.querySelector('.what');
                        const chevron = getComputedStyle(what, '::before');
                        return {
                            slug: r.dataset.slug,
                            on: r.classList.contains('on'),
                            height: r.getBoundingClientRect().height,
                            boxes: [...r.querySelectorAll('.clip')].filter(c => getComputedStyle(c).display !== 'contents').length,
                            lines: [...r.querySelectorAll('.line')].map(l => { const s = getComputedStyle(l); return `${s.display} ${s.translate} ${px(s.paddingRight)}`; }).join(', '),
                            gap: tags ? tb.left + lean - (beside ? last.right : first.left) : 15,
                            beside,
                            own: Boolean(tags) && !beside,
                            ragged: Math.max(...titleLines.map(l => Math.abs(l.left - first.left))),
                            // The chevron of a row pointed at: how far its middle is under the middle of the title's first line, and its left edge from the title column's.
                            chevron: chevron.content === 'none' ? null : { level: what.getBoundingClientRect().top + px(chevron.top) + px(chevron.height) / 2 - (first.top + first.bottom) / 2, left: px(chevron.left) },
                            tags: tags ? [tb.left, tb.top, tb.width, tb.height].join(' ') : '',
                        };
                    });
                });
                const rows = await flow();
                const boxed = rows.filter(r => r.boxes > 0 || !/^inline none 0(, inline-block none 0)?$/.test(r.lines) || Math.abs(r.gap - 15) > 0.5 || r.ragged > 0.05);
                const wrapped = rows.filter(r => r.height > 28.5).length;
                const alone = rows.filter(r => r.own);
                const aloneKids = alone.filter(r => subs.has(r.slug)).length;
                // Rather a row that takes more than one line: its chevron belongs on the first, where its date and its title are.
                const pointed = rows.find(r => r.tags && r.height > 28.5) ?? rows.find(r => r.tags) ?? rows[0];
                await page.evaluate((slug) => document.querySelector(`#row-${slug}`).scrollIntoView({ block: 'center', behavior: 'instant' }), pointed.slug);
                const before = (await flow()).find(r => r.slug === pointed.slug);
                await page.hover(`#row-${pointed.slug} .years`);
                await page.waitForFunction((slug) => document.querySelector(`#row-${slug}`).classList.contains('on'), pointed.slug, { timeout: 5000 }).catch(() => {});
                await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
                const during = (await flow()).find(r => r.slug === pointed.slug);
                await away();
                check(`7. at ${width}×${height} the list has no columns: a row's types follow its title in the same flow, 15px after it, or on a line of their own 15px in from where the title starts (${alone.length} rows, ${aloneKids} of them sub-projects', whose title starts 20px in), and every line of a title starts under its first; all wrap as they need (${wrapped} of ${rows.length} rows take more than one line); nothing is cut, and nothing moves when a row is pointed at, whose chevron is on the first line of its title, 14px left of the title's column (${pointed.slug}, ${Math.round((pointed.height - 10) / 18)} line${pointed.height > 28.5 ? 's' : ''})`,
                    rows.length === published.length && boxed.length === 0 && during.on && during.tags === before.tags && before.chevron === null && during.chevron !== null && Math.abs(during.chevron.level) <= 1 && Math.abs(during.chevron.left + 27.2) <= 0.01,
                    `chevron ${JSON.stringify(during.chevron)}; ${boxed.slice(0, 3).map(r => `${r.slug}: ${r.boxes} boxes, ${r.lines}, gap ${r.gap.toFixed(2)}${r.own ? ' on a line of their own' : ''}, title lines ${r.ragged.toFixed(2)}px apart`).join('; ')} pointed: ${before.tags} → ${during.tags}`);
            }
        }

        // 4. 390px, and on the way through every route: the type, and the pictures' boxes (the grid's `.box`,
        // a project page's `.frame`; every one in the HTML, shown or not): no border, the shadow.
        await page.setViewportSize({ width: 390, height: 844 });
        const wide = [];
        const type = [];
        const boxes = [];
        const homeType = [];
        let pictures = 0;
        let captions = 0;
        for (const path of routes) {
            await page.goto(base + path);
            await page.waitForTimeout(30);
            const w = await page.evaluate(() => document.documentElement.scrollWidth);
            if (w > 390) wide.push(`${path} (${w}px)`);
            const look = await page.evaluate((shadow) => {
                const set = (el) => { const s = getComputedStyle(el); return [s.fontSize, s.lineHeight, s.fontWeight].join(' / '); };
                const all = [...document.querySelectorAll('picture, project-index .box, project-slides .frame')];
                return {
                    body: set(document.body),
                    // Text that is not the body's size: a photo's caption, and a caption is no other size than its own
                    // (one that followed the body to 13px / 16px is as wrong as body text that is not).
                    other: [...new Set([...document.querySelectorAll('body *')].filter(el => el.getClientRects().length && [...el.childNodes].some(n => n.nodeType === 3 && n.data.trim()) && !el.closest('.visually-hidden'))
                        .map(el => `${el.matches('.caption, .caption *') ? 'caption' : el.localName} ${getComputedStyle(el).fontSize} / ${getComputedStyle(el).lineHeight}`))]
                        .filter(t => (t.startsWith('caption ') ? t !== 'caption 11px / 13.2px' : !/ 13px \/ (16|18\.73)px$/.test(t))),
                    captions: [...document.querySelectorAll('.caption')].filter(el => el.getClientRects().length && el.textContent.trim()).length,
                    count: new Set(all).size,
                    wrong: [...new Set(all)].map((el) => {
                        const s = getComputedStyle(el);
                        const border = ['Top', 'Right', 'Bottom', 'Left'].map(k => s[`border${k}Width`]).join(' ');
                        // A box has its picture's proportions, and the picture is stretched over all of it (`fill`): a resized
                        // file is a fraction of a pixel off those proportions, and `contain` then left a line of the ground
                        // colour between the picture and its shadow. Only a picture whose size the build could not read
                        // (no `width`; none today) is `contain` in a 3 : 2 box.
                        const img = el.querySelector('img');
                        const fit = img ? getComputedStyle(img).objectFit : '';
                        return border !== '0px 0px 0px 0px' ? `a border (${border})` : s.boxShadow !== shadow ? `shadow ${s.boxShadow}`
                            : fit !== (img?.getAttribute('width') ? 'fill' : 'contain') ? `object-fit: ${fit}` : '';
                    }).filter(Boolean),
                };
            }, SHADOW);
            if (HOME_ROUTES.includes(path)) {
                // The home page has its own sizes (the redesign of 26 Nov 2026): every text that shows at 390px is the
                // body's 14.5px on an 18px line, but the intro, which is 17.5px on a 21px line (and is there to
                // be measured unless the field is empty).
                const sizes = await page.evaluate(() => [...new Set([...document.querySelectorAll('body *')].filter(el => el.getClientRects().length && [...el.childNodes].some(n => n.nodeType === 3 && n.data.trim()) && !el.closest('.visually-hidden'))
                    .map(el => `${el.closest('.site-head') ? 'intro' : el.localName} ${getComputedStyle(el).fontSize} / ${getComputedStyle(el).lineHeight}`))]);
                const strange = sizes.filter(t => (t.startsWith('intro ') ? t !== `intro ${HOME_INTRO.narrow.split(' / ').slice(0, 2).join(' / ')}` : !t.endsWith(` ${HOME_BODY.narrow.split(' / ').slice(0, 2).join(' / ')}`)));
                if (look.body !== HOME_BODY.narrow || strange.length || (homeIntro.length > 0 && !sizes.some(t => t.startsWith('intro ')))) homeType.push(`${path}: body ${look.body}${strange.length ? `; ${strange.slice(0, 3).join(', ')}` : ''}`);
            } else if (look.body !== BODY || look.other.length) type.push(`${path}: body ${look.body}${look.other.length ? `; ${look.other.slice(0, 3).join(', ')}` : ''}`);
            pictures += look.count;
            captions += look.captions;
            if (look.wrong.length) boxes.push(`${path}: ${look.wrong.length} of ${look.count}, ${look.wrong[0]}`);
        }
        // (The project pages, the About and Collaborations pages and the 404 page have had their own type since 26 Nov 2026, and
        // checks of their own for it with the project pages' other checks: they are not judged by the one below.)
        for (let i = type.length - 1; i >= 0; i--) if (/^\/(projects\/[^/]+\/|404\.html|info\/|collaborations\/):/.test(type[i])) type.splice(i, 1);
        check('4. no horizontal scroll at 390px on any route', wide.length === 0, wide.join(', '));
        check('the type on the home page at 390px is 14.5px on an 18px line, Light; the intro is 17.5px on a 21px line, and nothing is any other size (/ and /projects/)', homeType.length === 0, homeType.join(' | '));
        check(`the type on every route is 13px on a 16px line, Light (a project's type, role and client on an 18.73px line); a caption is 11px / 13.2px and nothing else (${captions} captions on screen)`, type.length === 0 && captions > 0, type.slice(0, 4).join(' | ') || (captions ? '' : 'no caption on screen on any route'));
        check(`no picture on any route has a border, every one has the shadow and is stretched over its whole box (object-fit: fill): the ${pictures} thumbnails and project photos`, pictures > 0 && boxes.length === 0, boxes.slice(0, 4).join(' | '));

        // 6. the intro (the redesign of 26 Nov 2026; Fluxisch Else Light by the owner's word of that day). In
        // the link colour, its links in the text colour, underlined 1px thick 3px under the text, not Bold,
        // the link colour when pointed at. From 720px: one running paragraph, 15px on a 21px line, set left,
        // from 44px to at most 44px before the page's right edge, 34px under the top; the header is that, the
        // paragraph's lines and 12px (88px with two lines). Below 720px: 17.5px on a 21px line, every line of
        // the field a block of its own, 12px apart, its lines centred in the page between 30px margins,
        // 52px under the top and 30px over the grid. The lines are counted in the page: where one breaks is
        // the font's matter. At both addresses of the home page.
        // What the text is, is the owner's: how many parts it has, how many lines they take at a width and
        // whether there is a link in it are read from the field and from the page, never expected, and with
        // the field empty the header is its padding. So that every rule is tried all the same, the page is
        // then measured again with a made-up text in the intro's place (HOME_MADE_INTRO: four parts, two
        // links), made as long as each case asks: from 720px in one to four lines, below with a part of
        // two or three lines.
        const intro = [];
        const introSeen = { lines: new Set(), wide: new Set(), narrow: new Set() };
        const ownLinks = homeParts.flatMap(homePartLinks).length;
        const madeLinks = HOME_MADE_INTRO.join('').split('<a ').length - 1;
        // The made-up text in place of the page's own, its second part made longer a word at a time until the
        // paragraph (from 720px, where the parts run on) or that part (below, where it is a block of its own)
        // takes `lines` lines; the lines it then takes.
        const stage = (lines) => page.evaluate(({ parts, lines }) => {
            const head = document.querySelector('.site-head');
            let p = head.querySelector('p');
            if (!p) { p = document.createElement('p'); head.append(p); }
            p.innerHTML = parts.map(h => `<span class="l">${h}</span>`).join(' ');
            const grown = p.querySelectorAll('.l')[1];
            const count = (el) => { const range = document.createRange(); range.selectNodeContents(el); return new Set([...range.getClientRects()].filter(r => r.width > 0).map(r => Math.round((r.top + r.bottom) / 2 / 21))).size; };
            const taken = () => count(getComputedStyle(grown).display === 'block' ? grown : p);
            for (let n = 0; n < 3000 && taken() < lines; n++) grown.textContent += ' more';
            return taken();
        }, { parts: HOME_MADE_INTRO, lines });
        const read = () => page.evaluate(() => {
            const box = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, height: b.height }; };
            const head = document.querySelector('.site-head');
            const p = head.querySelector('p');
            const hs = getComputedStyle(head);
            const ps = getComputedStyle(p ?? head);
            const parts = p ? [...p.querySelectorAll('.l')] : [];
            // The boxes of a piece of text (a text node, or a part of one), one to a line it is on, as the layout
            // has them. Slanted text (a *title* typed in the field: an inline-block with a skew, as everywhere on
            // the site) leans over its own ends by half its height times the skew, and the browser gives its
            // box with that lean (0.79px either side at 15px); it is taken back here, so that a line which
            // starts or ends with a slanted word is measured where it stands, to the same half pixel as any other.
            const boxesOf = (node, from = 0, to = node.data.length) => {
                let skew = 0;
                for (let up = node.parentElement; up && up !== head; up = up.parentElement) {
                    const t = getComputedStyle(up).transform;
                    if (t && t !== 'none') skew += Math.abs(new DOMMatrixReadOnly(t).c);
                }
                const range = document.createRange();
                range.setStart(node, from);
                range.setEnd(node, to);
                return [...range.getClientRects()].filter(r => r.width > 0).map(r => ({ left: r.left + skew * r.height / 2, right: r.right - skew * r.height / 2, middle: (r.top + r.bottom) / 2 }));
            };
            // The lines of some text: each as its left and right ends and its middle, top to bottom.
            const linesOf = (el) => {
                const rows = new Map();
                const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                    for (const r of boxesOf(node)) {
                        const key = Math.round(r.middle);
                        const row = [...rows.keys()].find(k => Math.abs(k - key) <= 3) ?? key;
                        const at = rows.get(row) ?? { left: Infinity, right: -Infinity };
                        rows.set(row, { left: Math.min(at.left, r.left), right: Math.max(at.right, r.right) });
                    }
                }
                return [...rows].sort((a, b) => a[0] - b[0]).map(([middle, ends]) => ({ middle, ...ends }));
            };
            const lines = p ? linesOf(p) : [];
            // The words of the paragraph in reading order: a word is what stands between two white spaces,
            // whatever elements it runs through (a link and the full stop after it are one word), since a line
            // can only end at a space. Each with its part, the line it starts on and the one it ends on (a
            // word the browser broke in itself, at a hyphen, is on two), its ends on the first of them and
            // its right end on the last.
            const words = [];
            if (p) {
                const lineAt = (middle) => lines.findIndex(l => Math.abs(l.middle - middle) <= 3);
                const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
                let open = null;
                for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                    for (const m of node.data.matchAll(/[^ \t\n\r\f]+|[ \t\n\r\f]+/g)) {
                        if (/^[ \t\n\r\f]/.test(m[0])) { open = null; continue; }
                        const rects = boxesOf(node, m.index, m.index + m[0].length).map(r => ({ left: r.left, right: r.right, line: lineAt(r.middle) }));
                        if (!rects.length) continue;
                        if (!open) { open = { text: '', part: parts.indexOf(node.parentElement.closest('.l')), rects: [] }; words.push(open); }
                        open.text += m[0];
                        open.rects.push(...rects);
                    }
                }
            }
            // The link colour as the browser gives it back, and a space of the intro's type.
            const probe = document.createElement('i');
            probe.style.cssText = 'position: absolute; visibility: hidden; white-space: pre; color: var(--link);';
            probe.textContent = ' ';
            head.append(probe);
            const link = getComputedStyle(probe).color;
            const space = probe.getBoundingClientRect().width;
            probe.remove();
            const a = head.querySelector('a');
            return {
                page: document.documentElement.clientWidth,
                head: box(head),
                main: document.querySelector('main').getBoundingClientRect().top,
                type: [hs.fontSize, hs.lineHeight, hs.fontWeight].join(' / '),
                face: hs.fontFamily,
                colour: hs.color,
                link,
                ink: getComputedStyle(document.body).color,
                align: hs.textAlign,
                wrap: ps.textWrapStyle ?? ps.textWrap,
                padding: [hs.paddingTop, hs.paddingRight, hs.paddingBottom, hs.paddingLeft].join(' '),
                paragraphs: head.querySelectorAll('p').length,
                lines,
                space,
                words: words.map((w) => {
                    const [from, to] = [w.rects[0].line, w.rects.at(-1).line];
                    const on = (line) => w.rects.filter(r => r.line === line);
                    return { text: w.text, part: w.part, line: from, end: to, left: Math.min(...on(from).map(r => r.left)), right: Math.max(...on(from).map(r => r.right)), endRight: Math.max(...on(to).map(r => r.right)) };
                }),
                parts: parts.map(l => ({ display: getComputedStyle(l).display, wrap: getComputedStyle(l).textWrapStyle ?? getComputedStyle(l).textWrap, ...box(l), lines: linesOf(l) })),
                // A link's own look. Its weight is the text's, Light: the link adds none (until 26 Nov 2026 it made the
                // name Bold). One typed inside **bold** is Bold by that, which is the owner's doing and not the link's.
                links: [...head.querySelectorAll('a')].map((el) => { const s = getComputedStyle(el); return [s.color, el.closest('strong, b') ? 'in bold' : s.fontWeight, s.textDecorationLine, s.textDecorationThickness, s.textUnderlineOffset].join(' '); }),
                hover: a ? getComputedStyle(a).color : '',
                loaded: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/["']/g, '')))].sort().join(', '),
            };
        });
        const INTRO_AT = [[320, '/'], [390, '/'], [390, '/projects/'], [719, '/'], [720, '/'], [807, '/'], [1024, '/'], [1366, '/'], [1366, '/projects/'], [1920, '/']];
        // [width, lines]: from 720px the lines of the whole made-up paragraph, below the lines of its second part.
        const INTRO_MADE = [[320, 3], [390, 3], [719, 2], [720, 1], [720, 3], [1024, 2], [1366, 1], [1366, 4], [1920, 2]];
        for (const [width, path, made] of [...INTRO_AT.map(c => [...c, 0]), ...INTRO_MADE.map(([w, n]) => [w, '/', n])]) {
            await page.setViewportSize({ width, height: 800 });
            await page.mouse.move(1, 700);
            await page.goto(base + path);
            await page.evaluate(() => document.fonts.ready.then(() => true));
            const staged = made ? await stage(made) : 0;
            const m = await read();
            const near = (a, b) => Math.abs(a - b) <= 0.5;
            const off = [];
            const wide = width >= 720;
            const want = made ? { parts: HOME_MADE_INTRO.length, links: madeLinks } : { parts: homeIntro.length, links: ownLinks };
            if (made) (wide ? introSeen.wide : introSeen.narrow).add(staged);
            if (made && staged !== made) off.push(`the made-up text takes ${staged} lines, not ${made}`);
            if (m.parts.length !== want.parts || m.links.length !== want.links || m.paragraphs !== (want.parts ? 1 : 0)) off.push(`${m.paragraphs} paragraph(s) of ${m.parts.length} parts with ${m.links.length} links, not ${want.parts} parts with ${want.links}`);
            if (m.type !== (wide ? HOME_INTRO.wide : HOME_INTRO.narrow) || !/^"?Fluxisch Else/.test(m.face) || m.loaded !== 'Fluxisch Else') off.push(`set ${m.type} in ${m.face} (loaded: ${m.loaded})`);
            if (m.colour !== m.link || m.colour === m.ink) off.push(`colour ${m.colour}`);
            if (m.links.some(l => l !== `${m.ink} 300 underline 1px 3px` && l !== `${m.ink} in bold underline 1px 3px`)) off.push(`links ${[...new Set(m.links)].join(' | ')}`);
            if (m.padding !== (wide ? '34px 44px 12px 44px' : '52px 30px 30px 30px')) off.push(`padding ${m.padding}`);
            if (!near(m.head.bottom, m.main) || !near(m.head.top, 0)) off.push(`the header ends at ${m.head.bottom}, the index starts at ${m.main}`);
            if (wide) {
                if (!made) introSeen.lines.add(m.lines.length);
                // One running paragraph that wraps as plain text does (`text-wrap: wrap`; the `balance` of the
                // phone's blocks would leave every line short of the margin).
                if (!['left', 'start'].includes(m.align) || !/^(auto|wrap)$/.test(m.wrap) || m.parts.some(l => l.display !== 'inline')) off.push(`aligned ${m.align}, text-wrap ${m.wrap}, parts ${m.parts.map(l => l.display).join(' ')}`);
                if (!near(m.head.height, 34 + m.lines.length * 21 + 12)) off.push(`a header of ${m.head.height}px for ${m.lines.length} line(s)`);
                if (m.lines.some(l => !near(l.left, 44) || l.right > m.page - 44 + 0.5)) off.push(`lines from ${m.lines.map(l => `${l.left} to ${l.right}`).join(', ')}`);
                // And as it lies: a line ends only where the next word has no room left before the right margin,
                // whether that word goes on with the same part or begins the next one. So a part starts in the
                // line the part before it ends in, unless its first word does not fit there. Measured word by
                // word in the page (a word's width and a space's are the layout's own, whatever the system's
                // glyph advances); 2px of room are let pass. A word that is itself broken over two lines is
                // the browser's own break and is not judged.
                m.words.forEach((b, k) => {
                    const a = m.words[k - 1];
                    if (!a || b.line <= a.end || b.line !== b.end) return;
                    const room = m.page - 44 - a.endRight;
                    const need = m.space + b.right - b.left;
                    if (need + 2 <= room) off.push(`${b.part !== a.part ? `part ${b.part + 1} does not go on where part ${a.part + 1} ends: line ${a.end + 1}` : `line ${a.end + 1}`} ends ${room.toFixed(1)}px before the margin, where "${b.text}" (${need.toFixed(1)}px with its space) has room`);
                });
            } else {
                if (m.align !== 'center' || m.parts.some(l => l.display !== 'block' || !/balance/.test(l.wrap))) off.push(`aligned ${m.align}, parts ${m.parts.map(l => `${l.display} ${l.wrap}`).join(', ')}`);
                if (!m.parts.length && !near(m.head.height, 52 + 30)) off.push(`an empty header of ${m.head.height}px`);
                if (m.parts.length && (!near(m.parts[0].top, 52) || !near(m.head.bottom - m.parts.at(-1).bottom, 30))) off.push(`the first part ${m.parts[0].top}px down, the last ${m.head.bottom - m.parts.at(-1).bottom}px over the header's end`);
                m.parts.forEach((l, i) => {
                    if (i > 0 && !near(l.top - m.parts[i - 1].bottom, 12)) off.push(`part ${i + 1} is ${l.top - m.parts[i - 1].bottom}px under part ${i}`);
                    if (!near(l.height, l.lines.length * 21)) off.push(`part ${i + 1}: ${l.lines.length} line(s) in ${l.height}px`);
                    if (l.lines.some(r => Math.abs((r.left + r.right) / 2 - m.page / 2) > 1 || r.left < 30 - 0.5 || r.right > m.page - 30 + 0.5)) off.push(`part ${i + 1} is not centred between the 30px margins: ${l.lines.map(r => `${r.left.toFixed(1)} to ${r.right.toFixed(1)}`).join(', ')}`);
                });
            }
            // Pointed at, a link is the link colour (and the text round it already is). An intro without a link has none to point at.
            if (m.links.length) {
                await page.hover('.site-head a');
                const pointed = (await read()).hover;
                if (pointed !== m.link) off.push(`a link pointed at is ${pointed}`);
            }
            if (off.length) intro.push(`${width}px ${path}${made ? `, the made-up text in ${made} lines` : ''}: ${off.join('; ')}`);
        }
        check(`6. the intro: Fluxisch Else Light in the link colour, its links underlined in the text colour; from 720px one running paragraph of 15px / 21px across the page between 44px margins, wrapped as plain text is: a line full before the next begins, a part going on in the line the one before it ends in (as typed: ${[...introSeen.lines].sort().join(', ')} line(s) at 720 to 1920px), the header as tall as its lines; below 720px 17.5px / 21px, each of its parts (as typed: ${homeIntro.length}, with ${ownLinks} link(s)) a block of its own, 12px apart, centred and balanced between 30px margins (/ and /projects/); and the same of a made-up text of ${HOME_MADE_INTRO.length} parts with ${madeLinks} links set in its place, in ${[...introSeen.wide].sort().join(', ')} lines from 720px and with a part of ${[...introSeen.narrow].sort().join(', ')} lines below`,
            intro.length === 0, intro.slice(0, 3).join(' | '));

        // console errors on every route
        await page.setViewportSize({ width: 1328, height: 900 });
        for (const path of routes) { await page.goto(base + path); await page.waitForTimeout(30); }
        const real = errorsOn.filter(e => !e.includes('/404.html') || !e.includes('404'));
        check('no console errors or warnings with JavaScript on', real.length === 0, real.slice(0, 5).join(' | '));
        await page.close();
    }

    // JS off
    {
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();
        const errs = [];
        page.on('console', m => { if (m.type() === 'error') errs.push(`${page.url()}: ${m.text()}`); });
        page.on('pageerror', e => errs.push(`${page.url()}: ${e.message}`));
        let rowsShown = 0;
        let photosShown = -1;
        let setsShown = [];
        const snaps = {};
        // The photos that show, set by set, and whether each lies under the one before.
        const stacked = () => page.evaluate(() => [...document.querySelectorAll('project-slides')].map((el) => {
            const frames = [...el.querySelectorAll('.slide')].filter(sl => sl.getClientRects().length).map(sl => sl.querySelector('.frame').getBoundingClientRect());
            return { shown: frames.length, under: frames.every((f, i) => i === 0 || f.top >= frames[i - 1].bottom), top: frames[0]?.top ?? 0, bottom: frames.at(-1)?.bottom ?? 0 };
        }));
        for (const path of routes) {
            await page.goto(base + path);
            if (path === '/') rowsShown = await page.evaluate(() => document.querySelectorAll('project-index .row').length);
            if (many && path === `/projects/${many.data.slug}/`) photosShown = await page.evaluate(() => [...document.querySelectorAll('project-slides .slide')].filter(s => s.getClientRects().length).length);
            if (multi && path === `/projects/${multi.data.slug}/`) setsShown = await stacked();
        }
        // The project pages' two layouts without a script (the loop above ran in a window 1280px wide): every photo of
        // every set is on the page, one under the other in set order, each with its caption under it and no chevron;
        // the first is exactly where the script shows it; the information is beside the photos from 900px and after
        // them below. Below 900px, photos one under the other are a state the page must not snap in (it scrolls
        // freely), while a page whose sets hold one photo each is in its final state without a script, and snaps;
        // from 900px nothing snaps.
        const plain = [];
        for (const [width, height] of [[390, 844], [1366, 710]]) {
            await page.setViewportSize({ width, height });
            const d = pageOf(width);
            for (const p of [...new Set([many, multi, single, captioned].filter(Boolean))]) {
                await page.goto(`${base}/projects/${p.data.slug}/`);
                const at = await lie(page);
                const sets = await page.evaluate(() => [...document.querySelectorAll('project-slides')].map(el => [...el.querySelectorAll('.slide')].map((sl) => {
                    const r = (x) => { if (!x || !x.getClientRects().length) return null; const b = x.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right }; };
                    return { frame: r(sl.querySelector('.frame')), caption: r(sl.querySelector('.caption')), text: sl.querySelector('.caption')?.textContent.replace(/\s+/g, ' ').trim() ?? '', arrows: [...sl.querySelectorAll('.arrow')].filter(a => a.getClientRects().length).length };
                })));
                const where = `${p.data.slug} at ${width} × ${height}`;
                const want = setsOf(p);
                if (sets.map(set => set.length).join() !== want.map(set => set.length).join() || sets.flat().some(sl => !sl.frame)) plain.push(`${where}: ${sets.map(set => set.filter(sl => sl.frame).length).join(' + ')} photos show, of ${want.map(set => set.length).join(' + ')}`);
                const flat = sets.flat().filter(sl => sl.frame);
                if (flat.some((sl, i) => i > 0 && sl.frame.top < (flat[i - 1].caption ?? flat[i - 1].frame).bottom - 0.5)) plain.push(`${where}: a photo is not under the one before and its caption`);
                if (flat.some(sl => sl.arrows)) plain.push(`${where}: a chevron shows`);
                want.flat().forEach((im, i) => { if (flat[i] && (flat[i].text !== (im.caption ? words(im.caption) : '') || (flat[i].caption && (flat[i].caption.top < flat[i].frame.bottom - 0.5 || flat[i].caption.left < flat[i].frame.left - 0.5 - (d.wide ? 0 : width) || flat[i].caption.right > flat[i].frame.right + 0.5 + (d.wide ? 0 : width))))) plain.push(`${where}: photo ${i + 1} has the caption "${flat[i].text.slice(0, 30)}" at ${JSON.stringify(flat[i].caption)}`); });
                const first = at.sets[0];
                const wide = photoWidth(first.a, at.vw, at.vh, first.count > 1 && Boolean(at.prev));
                if (Math.abs(first.frame.width - wide) > 0.5 || Math.abs(first.frame.top - d.head) > 0.5 || Math.abs(d.wide ? first.frame.right - (width / 2 - 8.5) : first.frame.left - (width - wide) / 2) > 0.5) plain.push(`${where}: the first photo is ${first.frame.width} wide from ${first.frame.left}, ${first.frame.top}, not where the script shows it (${wide} wide)`);
                if (d.wide ? Math.abs(at.info.left - (width / 2 + 8.5)) > 0.5 || Math.abs(at.info.top - d.head) > 0.5 : at.info.top < at.sets.at(-1).bottom - 0.5 || Math.abs(at.info.left) > 0.5) plain.push(`${where}: the information at ${at.info.left}, ${at.info.top}`);
                if (at.wide > width) plain.push(`${where}: the page is ${at.wide}px wide`);
                snaps[`${p === single ? 'single' : firstSet(p).length > 1 ? 'stacked' : 'other'} ${width}`] = at.snap;
            }
        }
        // From 900px, where the words "previous" and "next" are fixed in the window's lower corners: with the photos one under the
        // other the left column is long, and at the end of the page its last photo, or the caption under it, lay under "previous"
        // (on 7 of the 29 pages at 900 × 600 and 3 at 1366 × 710, measured). While its photos are one under the other, the last set
        // of a page with that word therefore ends 52px later (client/project.css), as the last of several sets always does: the
        // row under the last photo then ends 72px above the window's lower edge, above the word. Every project page, at its end.
        const cornered = [];
        let ended = 0;
        for (const [width, height] of [[1366, 710], [900, 600]]) {
            await page.setViewportSize({ width, height });
            for (const p of published.filter(q => photos(q).length)) {
                await page.goto(`${base}/projects/${p.data.slug}/`);
                const m = await page.evaluate(() => {
                    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
                    const hit = (a, b, air) => a.left < b.right + air && b.left < a.right + air && a.top < b.bottom + air && b.top < a.bottom + air;
                    const textRects = (el) => {
                        const out = [];
                        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                            if (!n.data.trim()) continue;
                            const range = document.createRange();
                            range.selectNodeContents(n);
                            out.push(...[...range.getClientRects()].filter(r => r.width > 0 && r.height > 0));
                        }
                        return out;
                    };
                    const found = [];
                    let fixed = 0;
                    for (const a of document.querySelectorAll('#project-info .neighbours a')) {
                        if (getComputedStyle(a).position !== 'fixed') continue;
                        fixed++;
                        const name = a.textContent.trim();
                        const box = a.getBoundingClientRect();
                        const word = a.querySelector('span').getBoundingClientRect();
                        if ([...document.querySelectorAll('project-slides .frame')].some(f => f.getClientRects().length && hit(box, f.getBoundingClientRect(), 0))) found.push(`"${name}" on a photo`);
                        if ([...document.querySelectorAll('project-slides .caption')].some(c => c.getClientRects().length && textRects(c).some(r => hit(word, r, 2)))) found.push(`"${name}" over a caption`);
                    }
                    return { found, fixed, end: Math.abs(scrollY - (document.documentElement.scrollHeight - innerHeight)) <= 1, script: matchMedia('(scripting: enabled)').matches };
                });
                if (m.end && m.fixed && !m.script) ended++;
                if (m.found.length || !m.end) cornered.push(`${p.data.slug} at ${width} × ${height}: ${m.found.join(', ') || 'the page is not at its end'}`);
            }
        }
        check(`3. with JavaScript off, from 900px, "previous" and "next" lie on no photo and over no caption at the end of a project page, where its photos, one under the other, come to rest (1366 × 710 and 900 × 600, every project page with a photo: ${ended} ends)`, cornered.length === 0 && ended > 0, cornered.slice(0, 4).join(' | '));
        // The pages of text with one picture need no script: with JavaScript off each is whole in both layouts, as it is
        // with JavaScript on (the same measures), its picture loaded; only the cursor over the picture no longer says it
        // can be enlarged, since nothing would answer the double click.
        const sheetsPlain = [];
        for (const s of sheetFronts) {
            for (const [width, height] of [[390, 844], [1366, 710]]) {
                await page.setViewportSize({ width, height });
                await page.goto(`${base}/${s.name}/`);
                await page.waitForFunction(() => { const img = document.querySelector('main.sheet img'); return !img || (img.complete && img.naturalWidth > 0); }, null, { timeout: 10000 }).catch(() => {});
                const m = await sheetLie(page);
                const off = sheetOff(m);
                if (off) sheetsPlain.push(`/${s.name}/ at ${width} × ${height}: ${off}`);
                if (m.img && !m.img.loaded) sheetsPlain.push(`/${s.name}/ at ${width} × ${height}: the picture did not load`);
                if (m.picture && m.picture.cursor === 'zoom-in') sheetsPlain.push(`/${s.name}/ at ${width} × ${height}: the cursor promises a larger picture`);
            }
        }
        check('3. with JavaScript off the About and Collaborations pages are whole in both layouts (390 × 844 and 1366 × 710): the same measures as with it, the picture loaded, and no cursor over the picture that promises to enlarge it', sheetsPlain.length === 0, sheetsPlain.slice(0, 4).join(' | '));
        check('no console errors with JavaScript off', errs.length === 0, errs.slice(0, 5).join(' | '));
        check('1. with JavaScript off the index shows every row', rowsShown === published.length);
        if (many) check('1. with JavaScript off a project page shows every photo', photosShown === photos(many).length, `${photosShown}/${photos(many).length}`);
        if (many && firstSet(many).length > 1) check('3. with JavaScript off a page whose photos are one under the other does not snap (390px)', snaps['stacked 390'] === 'none', snaps['stacked 390']);
        if (single) check('3. below 900px a page with one photo snaps without a script (390px)', String(snaps['single 390']).includes('mandatory'), snaps['single 390']);
        check('3. from 900px no project page snaps, with or without a script (1366px)', Object.entries(snaps).filter(([k]) => k.endsWith(' 1366')).every(([, v]) => v === 'none') && Object.keys(snaps).some(k => k.endsWith(' 1366')), JSON.stringify(snaps));
        if (multi) {
            const want = setsOf(multi).map(set => set.length);
            const inOrder = setsShown.every((set, i) => set.under && (i === 0 || set.top >= setsShown[i - 1].bottom));
            check('1. with JavaScript off every photo of every set shows, one under the other, in set order', setsShown.map(set => set.shown).join() === want.join() && inOrder, `${setsShown.map(set => set.shown).join(' + ')} of ${want.join(' + ')}`);
        }
        check(`3. with JavaScript off a project page is whole in both layouts (390 × 844 and 1366 × 710): every photo of every set, one under the other in set order, each with its own caption under it and no chevron, the first where the script shows it; the information beside the photos from 900px, after them below (${[...new Set([many, multi, single, captioned].filter(Boolean))].map(p => p.data.slug).join(', ')})`, plain.length === 0, plain.slice(0, 4).join(' | '));
        await context.close();
    }

    // 6. a touch screen 820px wide (it cannot hover, and the list still has its columns): nothing
    // slides; a column whose text is cut is dragged sideways, by exactly what is cut, so that its end
    // stops where the fade begins, and shows no scrollbar; a column whose text fits cannot be dragged
    // at all (the slanted types lean 0.84px over their own end, which a scroller counts and rounds up,
    // so their way is up to 2px longer and one that just fits may give 1px); a tap on a tag filters.
    // The fade is the last 1em of a column, 12.5px: a list dragged to its end has its last tag clear of it.
    {
        const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, hasTouch: true });
        const page = await context.newPage();
        await page.goto(`${base}/`);
        await page.waitForFunction(() => document.querySelector('project-index')?.rendered);
        await page.evaluate(() => document.fonts.ready.then(() => true));
        if (!await page.evaluate(() => matchMedia('(hover: none)').matches)) check('6. on a touch screen at 820px: ok (this browser says it can hover; the check was skipped)', true);
        else {
            const cells = await page.evaluate((fade) => [...document.querySelectorAll('project-index .clip')].map((c, k) => {
                const px = (v) => parseFloat(v) || 0;
                const line = c.querySelector('.line');
                const cs = getComputedStyle(c);
                const ls = getComputedStyle(line);
                c.scrollLeft = 10000;
                const tag = [...c.querySelectorAll('.tag')].at(-1)?.getBoundingClientRect();
                const at = { k, slug: c.closest('.row').dataset.slug, over: px(ls.width) - (c.getBoundingClientRect().width - px(cs.paddingLeft) - fade), drag: c.scrollLeft, cut: cs.overflowX, bar: c.offsetHeight - c.clientHeight, moved: ls.translate, tags: Boolean(tag), last: tag ? c.getBoundingClientRect().right - tag.right : fade };
                c.scrollLeft = 0;
                return at;
            }), HOME_FADE);
            const wrong = cells.filter(c => c.cut !== 'auto' || c.bar !== 0 || c.moved !== 'none' || (c.over <= 0.01 ? c.drag > 1 : c.drag < c.over - 1 || c.drag > c.over + 2.5 || c.last < HOME_FADE - 1.5));
            const most = cells.filter(c => c.over > 0.01 && c.tags).sort((a, b) => b.over - a.over)[0];
            let tapped = 'no type list is cut';
            if (most) {
                const spot = await page.evaluate((k) => {
                    const c = document.querySelectorAll('project-index .clip')[k];
                    c.scrollIntoView({ block: 'center', behavior: 'instant' });
                    c.scrollLeft = 10000;
                    const tag = [...c.querySelectorAll('.tag')].at(-1);
                    const b = tag.getBoundingClientRect();
                    return { tag: tag.dataset.tag, x: b.left + b.width / 2, y: b.top + b.height / 2 };
                }, most.k);
                await page.touchscreen.tap(spot.x, spot.y);
                tapped = await page.waitForFunction((t) => new URLSearchParams(location.search).get('filter') === t, spot.tag, { timeout: 5000 }).then(() => spot.tag, () => '');
            }
            check(`6. on a touch screen at 820px nothing slides: the ${cells.filter(c => c.over > 0.01).length} columns whose text is cut are dragged sideways to their end and no further, the ${cells.filter(c => c.over <= 0.01).length} whose text fits cannot be dragged, none shows a scrollbar, and a tap on a tag dragged into view filters (${tapped})`,
                cells.length > 0 && wrong.length === 0 && Boolean(tapped), wrong.slice(0, 4).map(c => `${c.slug}: ${c.cut}, cut by ${c.over.toFixed(1)}, drags ${c.drag}, last tag ${c.last.toFixed(1)} before the edge, ${c.moved}, bar ${c.bar}`).join('; '));
        }
        await context.close();
    }

    // 4. a touch screen, 390px wide: a project page scrolls freely (no snapping), its sets one
    // under the other, and no photo shows through the header it passes under; a double tap opens a photo.
    {
        const shownOn = multi ?? oneSet ?? many;
        const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
        const page = await context.newPage();
        if (shownOn) {
            await page.goto(`${base}/projects/${shownOn.data.slug}/`);
            await slidesReady(page);
            await page.waitForFunction(() => { const img = document.querySelector('project-slides .slide.current img'); return img.complete && img.naturalWidth > 0; });
            await page.evaluate(() => document.fonts.ready);
            const start = await lie(page);
            // The header as it is with nothing under it: its ground colour covers all of it.
            const clip = { x: 0, y: 0, width: 390, height: Math.round(start.head.bottom) };
            const pixels = async () => sharp(await page.screenshot({ clip })).raw().toBuffer();
            const clear = await pixels();
            // A place between two stops, with the first photo half under the header.
            const y = Math.round(start.sets[0].frame.top + start.sets[0].frame.height / 2 - start.head.bottom / 2);
            await page.evaluate(to => scrollTo({ top: to, behavior: 'instant' }), y);
            await rest(page);
            const at = await lie(page);
            const under = at.sets[0].frame.top < 0 && at.sets[0].frame.bottom > at.head.bottom;
            const covered = await pixels();
            let differ = 0;
            for (let i = 0; i < clear.length; i++) if (clear[i] !== covered[i]) differ++;
            const stack = at.sets.every((set, i) => i === 0 || set.top >= at.sets[i - 1].bottom - 0.5);
            check(`4. on a touch screen at 390px a project page scrolls freely, its sets one under the other, with no horizontal scroll (${shownOn.data.slug})`, !at.mouse && at.snap === 'none' && Math.abs(at.y - y) <= 1 && stack && at.wide <= 390, `asked for ${y}, rests at ${at.y}; snap ${at.snap}; ${at.wide}px wide`);
            check('3. the header keeps its place and nothing of a photo passing under it shows through', under && at.head.top === 0 && at.headOnTop && differ === 0, under ? `${differ} of ${clear.length} colour values changed` : 'no photo was under the header');
            // Two taps on a photo, one after the other, open it; a tap closes it. (Taps that this machine was
            // too slow to send within the wait are two single taps: the set moves on twice, and it is tried again.)
            await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
            await rest(page);
            let tapped = { open: 0, tries: 0, touch: '' };
            for (let i = 0; i < 4 && !tapped.open; i++) {
                await page.evaluate(() => document.querySelector('project-slides').setState?.({ index: 0 }));
                const box = await page.evaluate(() => { const r = document.querySelector('project-slides .slide.current .frame').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
                await page.touchscreen.tap(box.x, box.y);
                await page.touchscreen.tap(box.x, box.y);
                await page.waitForTimeout(ZOOM_WAIT + 250);
                tapped = await page.evaluate(n => ({ open: document.querySelectorAll('.zoom').length, tries: n, index: document.querySelector('project-slides').state?.index ?? 0, touch: getComputedStyle(document.querySelector('project-slides .slide.current .frame')).touchAction }), i + 1);
            }
            if (tapped.open) { await page.touchscreen.tap(195, 420); await page.waitForTimeout(150); }
            const closed = await page.evaluate(() => document.querySelectorAll('.zoom').length);
            check('3. on a touch screen a double tap on a photo opens it (the photo takes no double-tap zoom of the browser\'s: touch-action manipulation), and a tap closes it', tapped.open === 1 && tapped.index === 0 && tapped.touch === 'manipulation' && closed === 0, JSON.stringify({ ...tapped, closed }));
        }
        // A double tap on the open photo, the usual way back from an enlarged picture: the first tap closes it and the second lands
        // on the photo behind, which stays the photo it was (a single tap there would move the set on). On a page whose first set
        // has photos to move to. Taps this machine sent more than the wait apart are a tap that closes and a tap of its own: such
        // a try does not count and is made again.
        if (many && firstSet(many).length > 1) {
            await page.goto(`${base}/projects/${many.data.slug}/`);
            await slidesReady(page);
            await page.waitForFunction(() => { const img = document.querySelector('project-slides .slide.current img'); return img.complete && img.naturalWidth > 0; });
            let again = { counted: false, last: 'not tried' };
            for (let i = 0; i < 5 && !again.counted; i++) {
                await page.evaluate(() => { scrollTo({ top: 0, behavior: 'instant' }); document.querySelector('project-slides').setState({ index: 0 }); });
                const box = await page.evaluate(() => { const r = document.querySelector('project-slides .slide.current .frame').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
                if (!await page.evaluate(() => document.querySelectorAll('.zoom').length)) {
                    await page.touchscreen.tap(box.x, box.y);
                    await page.touchscreen.tap(box.x, box.y);
                    await page.waitForTimeout(ZOOM_WAIT + 250);
                }
                const was = await page.evaluate(() => {
                    window.__taps = [];
                    if (!window.__timing) { window.__timing = true; document.addEventListener('click', () => window.__taps.push(performance.now()), true); }
                    return { open: document.querySelectorAll('.zoom').length, index: document.querySelector('project-slides').state.index };
                });
                if (!was.open) { again.last = 'the photo did not open'; continue; }
                await page.touchscreen.tap(box.x, box.y);
                await page.touchscreen.tap(box.x, box.y);
                await page.waitForTimeout(ZOOM_WAIT + 250);
                const after = await page.evaluate(() => ({ open: document.querySelectorAll('.zoom').length, index: document.querySelector('project-slides').state.index, gap: window.__taps.length === 2 ? window.__taps[1] - window.__taps[0] : NaN }));
                again = { counted: after.gap < ZOOM_WAIT - 20, ok: after.open === 0 && after.index === was.index, last: `${after.open} open, photo ${after.index + 1} after photo ${was.index + 1}, the taps ${Math.round(after.gap)} ms apart` };
            }
            check(`3. on a touch screen a double tap on an open photo closes it and leaves the set on the photo it showed (${many.data.slug})`, again.counted && again.ok, again.last);
        }
        // The same on a page of text with one picture: two taps on the picture open it, one more closes it, and a single tap does nothing.
        {
            const s = sheetFronts.find(f => sheetWants(f).image);
            if (s) {
                await page.goto(`${base}/${s.name}/`);
                await page.waitForFunction(() => { const img = document.querySelector('main.sheet img'); return img.complete && img.naturalWidth > 0; });
                const spot = async () => page.evaluate(() => { const el = document.querySelector('main.sheet picture'); el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
                const one = await spot();
                await page.touchscreen.tap(one.x, one.y);
                await page.waitForTimeout(ZOOM_WAIT + 250);
                const once = await page.evaluate(() => ({ open: document.querySelectorAll('.zoom').length, path: location.pathname }));
                let tapped = { open: 0, tries: 0 };
                for (let i = 0; i < 4 && !tapped.open; i++) {
                    const box = await spot();
                    await page.touchscreen.tap(box.x, box.y);
                    await page.touchscreen.tap(box.x, box.y);
                    await page.waitForTimeout(ZOOM_WAIT + 250);
                    tapped = await page.evaluate(n => ({ open: document.querySelectorAll('.zoom').length, tries: n, touch: getComputedStyle(document.querySelector('main.sheet picture')).touchAction }), i + 1);
                }
                if (tapped.open) { await page.touchscreen.tap(195, 420); await page.waitForTimeout(150); }
                const closed = await page.evaluate(() => document.querySelectorAll('.zoom').length);
                check(`3. on a touch screen a single tap on the picture of a page of text does nothing, a double tap opens it (touch-action manipulation: no double-tap zoom of the browser's), and a tap closes it (/${s.name}/)`, once.open === 0 && once.path === `/${s.name}/` && tapped.open === 1 && tapped.touch === 'manipulation' && closed === 0, JSON.stringify({ once, ...tapped, closed }));
            }
        }
        await context.close();
    }

    // 5. CMS fields
    {
        const config = matter(`---\n${readFileSync(join(root, '.pages.yml'), 'utf8')}\n---\n`, {}).data;
        const collection = (config.content ?? []).find(c => c.name === 'projects');
        const fields = new Map((collection?.fields ?? []).map(f => [f.name, f]));
        const keys = new Set(fronts.flatMap(f => Object.keys(f.data)));
        const unknown = [...keys].filter(k => !fields.has(k));
        check('5. every project front-matter key is a field in .pages.yml', unknown.length === 0, unknown.join(', '));
        const vocab = new Set((fields.get('tags')?.options?.values ?? []).map(v => (typeof v === 'object' ? v.value ?? v.name : v)));
        const used = [...new Set(fronts.flatMap(f => f.data.tags ?? []))].filter(t => !vocab.has(t));
        check('5. every tag in use is in the tags select', used.length === 0, used.join(', '));
        const photoFields = new Map((fields.get('images')?.fields ?? []).map(f => [f.name, f]));
        const photoKeys = [...new Set(fronts.flatMap(f => photos(f).flatMap(im => Object.keys(im))))].filter(k => !photoFields.has(k));
        check('5. every key of a project photo (image, alt, caption, set) is a field in .pages.yml', photoKeys.length === 0, photoKeys.join(', '));
        const set = photoFields.get('set');
        check('5. a photo\'s set is a number field in .pages.yml, whole numbers from 1', set?.type === 'number' && set?.options?.min === 1 && set?.options?.step === 1, JSON.stringify(set ?? null));
        // The home page's text: every key of content/site/index.md is a field of its entry; the intro is a
        // text of several lines whose help says how lines and links are written, the description a field of its own.
        {
            const home = (config.content ?? []).find(c => c.path === 'content/site/index.md');
            const homeFields = new Map((home?.fields ?? []).map(f => [f.name, f]));
            const homeKeys = Object.keys(matter(readFileSync(join(root, 'content/site/index.md'), 'utf8'), {}).data).filter(k => !homeFields.has(k));
            const help = String(homeFields.get('intro')?.description ?? '');
            check('5. the home page\'s intro and description are fields of its entry in .pages.yml: the intro a text of several lines, with help on lines and on how a link is written; every key of content/site/index.md is a field',
                home?.type === 'file' && homeKeys.length === 0 && homeFields.get('intro')?.type === 'text' && /line/i.test(help) && /\[[^\]]+\]\([^)]+\)/.test(help) && ['string', 'text'].includes(homeFields.get('description')?.type) && Boolean(homeFields.get('description')?.description),
                `keys without a field: ${homeKeys.join(', ') || 'none'}; intro: ${homeFields.get('intro')?.type}; description: ${homeFields.get('description')?.type}`);
        }
        const files = (config.content ?? []).filter(c => c.type === 'file').map(c => c.path).sort();
        check('5. the three text pages are editable: the home page\'s intro, About and Collaborations', JSON.stringify(files) === JSON.stringify(['content/site/collaborations.md', 'content/site/index.md', 'content/site/info.md']), files.join(', '));
        // The two pages of text with one picture: an entry each, with the same fields under the names the data layer reads
        // (title, fixed; the text; the picture, its description, its caption; the footnote), and every key of the
        // page's content file is one of them. Neither can be created, renamed or deleted: the site needs both files.
        {
            const media = (config.media?.extensions ?? []).join();
            const wrong = [];
            const shapes = [];
            for (const s of sheetFronts) {
                const entry = (config.content ?? []).find(c => c.path === `content/site/${s.name}.md`);
                const fields = new Map((entry?.fields ?? []).map(f => [f.name, f]));
                const f = (name) => fields.get(name) ?? {};
                const off = [];
                if (!entry || entry.type !== 'file' || entry.format !== 'yaml-frontmatter' || entry.operations?.create !== false || entry.operations?.rename !== false || entry.operations?.delete !== false) off.push('not a single file that stays where it is');
                if ([...fields.keys()].join() !== 'title,body,image,alt,caption,note') off.push(`fields ${[...fields.keys()].join(', ')}`);
                if (f('title').type !== 'string' || f('title').readonly !== true) off.push('the title can be changed');
                if (f('body').type !== 'rich-text' || f('body').options?.format !== 'markdown') off.push('the text is not Markdown');
                if (f('image').type !== 'image' || f('image').options?.path !== `images/${s.name}` || (f('image').options?.extensions ?? []).join() !== media) off.push(`the picture: ${JSON.stringify(f('image').options ?? null)}`);
                if (f('alt').type !== 'string' || !/can't see/.test(f('alt').description ?? '') || f('alt').required) off.push('the picture\'s description');
                if (f('caption').type !== 'string' || f('caption').required) off.push('the caption');
                if (f('note').type !== 'text' || f('note').required) off.push('the footnote is not plain text of several lines');
                const unknown = Object.keys(s.data).filter(k => !fields.has(k));
                if (unknown.length) off.push(`keys of the content file that are no field: ${unknown.join(', ')}`);
                if (off.length) wrong.push(`${s.name}: ${off.join('; ')}`);
                shapes.push(JSON.stringify((entry?.fields ?? []).map(({ name, label, type, readonly, description, options }) => ({ name, label, type, readonly, description: String(description ?? '').replaceAll(`images/${s.name}`, 'images/…'), options: { ...options, path: undefined } }))));
            }
            check('5. the About and the Collaborations page are each an entry in .pages.yml with the same fields, named as the data layer reads them: the title (fixed), the text, the picture (in the page\'s own folder under images/, every kind of file the media library takes), its description for people who can\'t see it, its caption and the footnote, none of them required; every key of the two content files is one of them', wrong.length === 0 && new Set(shapes).size === 1, wrong.join(' | ') || (new Set(shapes).size === 1 ? '' : 'the two entries differ in more than their folder'));
        }
        const details = fields.get('details');
        check('5. a project\'s "More details" is a field of plain text of several lines in .pages.yml, optional, with words on how to write it', details?.type === 'text' && details?.label === 'More details' && !details?.required && /empty line/.test(details?.description ?? '') && /\]\(/.test(details?.description ?? ''), JSON.stringify(details ?? null));
    }
} finally {
    await browser.close();
    server.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\nverify: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
