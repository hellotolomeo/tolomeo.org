# Editing tolomeo.org

A short guide for Tolomeo. Everything here is done in Pages CMS, in a web browser.
No terminal, no scripts.

## What this is

- The website is built from the text and photos stored in this repository.
- Pages CMS is the editing screen for them. When you press **Save**, the change is stored
  and the site rebuilds itself.
- The live site updates about **1–2 minutes** after you save.
- Every save and every photo upload is one update. If you upload 20 photos, the updates
  queue up and run one after another. The site catches up a few minutes after the last one.
  Nothing is lost; it just takes a little while.
- If Pages CMS says *"File has changed since you last loaded it"*, the site changed the file
  in the meantime (for example after converting a photo). Reload the page and save again.

## Logging in

1. Go to **app.pagescms.org**.
2. Sign in with **GitHub**, or with the **email invite** you were sent (it sends you a code).
3. Open **tolomeo.org**. On the left you see **Projects**, **Home page intro**, **About page**,
   **Collaborations page** and **Media** (all the photos and pictures).

## Edit the home page intro

**Home page intro** has two fields.

- **Intro**: the text at the top of the home page. Every line you type is one part of it.
  On a phone each line is a block of its own, centred; on a computer the lines run on as one
  paragraph across the page. Press Enter to start a new line; empty lines are ignored.
- A link is written `[the words to click](the address)`, with no space between `]` and `(`.
  - A page of this site: the address starts and ends with a slash. `[Tolomeo](/info/)` makes
    your name a link to the About page; `[read this](/collaborations/)` leads to the
    Collaborations page.
  - Another site: the whole address, starting with `https://`, for example
    `[publishing house](https://landlinepress.nl)`.
  - Change the words freely; keep the square and round brackets as they are. Links in the
    intro are underlined (your name is no longer bold).
  - A mistyped address does not stop the site from updating: the link then leads to the
    "nothing here" page. Click a new link once, after the site has updated.
- The Collaborations page is reached only from its link in the intro. If you take that link
  out, nothing on the site leads to the page any more.
- **Description for search engines**: one or two plain sentences that search engines and link
  previews show for the home page, the About page and the Collaborations page. Plain text, no
  links. Leave it empty to use the words of the intro.

Press **Save** when you're done.

## Edit the About and Collaborations pages

**About page** (it used to be called Info page; its address is still `tolomeo.org/info/`) and
**Collaborations page** (`tolomeo.org/collaborations/`) work the same way: a text with one
picture. On a computer the picture is on the left and the text on the right; on a phone the
text comes first, then the picture. Each has these fields:

- **Title**: fixed by the design; it can't be changed here.
- **Text**: write normal paragraphs. To add a link, select the words and use the link button.
  Paragraphs, links, **bold** and *italic* show on the site. Italic shows as slanted text (the
  font has no italic of its own). Headings, lists and so on are turned into plain paragraphs.
- **Picture**: the one picture on the page. It is shown whole, with a soft shadow around it
  and no frame. To change it, upload the new picture in **Media**, in the folder `info` (for
  the About page) or `collaborations`, then press **Select** here and pick it. Photos straight
  from a phone, HEIC files and large files are fine, as for projects. Empty = the page is the
  text alone.
- **Description of the picture**: say what is in the picture, in a sentence, for people who
  can't see it. **Both descriptions are empty now, and they are yours to write**: nobody
  wrote one for you. Until you do, a screen reader passes over the picture; when a visitor
  opens the picture large, it is announced by its caption if it has one, and otherwise by
  nothing.
- **Caption**: optional. One line shown under the picture. Put asterisks around words to slant
  them, like a book title: `as told in *Memory of Fire*`. A caption shows only if the page
  has a picture.
- **Footnote**: optional. A note to the text: under the text on a computer, after the picture
  on a phone. Start it with the mark you put in the text, for example an asterisk and a
  space: `* By ‘rigorous decolonial foundation’, I mean …`. Its second and later lines are set
  a little further in, so the mark stands out. An empty line starts a second footnote. A link
  in a footnote is written `[the words](https://the.address)`.

A single asterisk used as a footnote mark, right after a word in the text (`decolonial*`) or
at the start of the footnote, is printed as an asterisk.

A visitor can double-click the picture (on a phone: tap it twice) to see it as large as the
screen allows; a click, a tap or the Esc key closes it again.

Press **Save** when you're done.

## Add a project

1. Open **Projects** and press **Add an entry**.
2. Fill in:
   - **Title**: the name, as it should appear.
   - **Slug (web address)**: the project's address and photo folder name, for example
     `the-riso-studio` gives `tolomeo.org/projects/the-riso-studio/`. Lower case letters
     and numbers only, words joined by hyphens. Choose it once; **don't change it after
     publishing** (old links would break and the photos would be in the wrong folder).
   - **Order**: where it sits in the list (see below).
   - **Years**: type them in full: `2026`, `2023 - 2026`, `2025, 2026`, `2023 –`. The site prints
     them short: `’26`, `’23–26`, `’25, 26`, `’23–`. In the list on the home page the date column
     fits the longest date by itself, so the titles always start right after the dates.
     (A sub-project's years show on its own page only, not in the list.)
   - **Start year / End year**: only used for sorting. Leave End year empty if it's ongoing.
   - **Tags**: the categories people can filter by. Pick from the list. On the project's
     own page they are shown as `type:`.
   - **Role**: what you did, one per line (**Add an item** for another). Shown as `role:`.
   - **Client**: shown as `for:`.
   - **More details**: optional. Extra lines for the project's page, shown under type, role,
     for and the years: stockists, edition details, where to order. Every line you type is a
     line on the page. Leave an empty line to start a new group; the page shows an empty line
     there too. A link is written `[the words](https://the.address)`, bold is written
     `**like this**`, slanted `*like this*`. A dash or an asterisk at the start of a line is
     dropped (the page prints plain lines, not bullets). Leave the field empty and nothing is
     shown.
   - **Description**: paragraphs, links, bold and italic. Leave it empty if there is
     nothing to say; its place on the page then stays empty.
3. Press **Save**.

**What the project's page shows.** The title is at the top of the page, and only there. The
word *back* at the top left returns to the home page.

- **On a computer** (a window at least 900 pixels wide) the page is two halves. On the left
  are the photos, one at a time, each with its caption under it. On the right is the text,
  which stays in place: the description, and beside it `type:` (the tags), `role:`, `for:`
  (the client), one line lower the years, and under them your More details.
- **On a phone** it is one column: first the photo with its caption, filling the screen, then
  type, role, for, the years and More details, then the description. Tapping the title jumps
  down to the text.

A field you leave empty is left out, with its label. The words *previous* and *next* open the
project before this one and the project after it, in the order of the list on the home page
(the **Order** numbers, sub-projects in their place; drafts are skipped). On a computer they
stand in the bottom corners of the window; on a phone they come after the description. The
first project has no *previous* and the last one no *next*.

**Drafts.** Turn **Published** off to keep a project hidden while you work on it. It is
then not on the home page and has no page of its own. Turn it on when it's ready.

**Order numbers.** The list is sorted by **Order**, smallest first.

- Whole numbers are main projects: `1`, `2`, `3` …
- Sub-projects sit under a main project: `2.1`, `2.2`, `2.3` sit under project `2`.
- Need ten or more under one project? Use `2.01`, `2.02` … `2.10` (because `2.10` is the
  same number as `2.1`).
- To fit a project in between, decimals are fine: `4.5` sits between `4` and `5`.

**Sub-projects.** Set **Part of (parent project)** to the main project, and give it an
order like `2.1`. It then shows under its main project in the list on the home page, set
apart from it: its title a little further in and in the light font instead of the bold
one, with no date in front of it. Its years are still shown on its own
page, so do fill them in. Leave **Part of** empty for a main project.

## Add photos

Photos live in **Media**, in one folder per project: `images/projects/<slug>`.

**The first time, make the folder:**

1. Open **Media**, then the folder **projects**.
2. Press the folder button (**Create folder**) and name it exactly like the project's slug.

**Upload:**

- On a computer, **drag many photos at once** from your computer onto the open folder.
- The **Upload** button adds one photo at a time (handy on a phone). Use it inside the
  project's folder: the Upload button next to **Select** in a project puts photos in
  `images/projects` instead, outside the folder.
- Photos straight from a phone are fine, including iPhone **HEIC** files, and large files.
  The site converts and resizes them automatically. You never need to resize anything.
  A HEIC photo becomes a `.jpg` a couple of minutes after you save; the project is updated
  to point at the `.jpg` for you. If Pages CMS then says the file "has changed since you
  last loaded it", reload the page and save again.
- File names are tidied on upload (lower case, no spaces).
- If a file with the same name is already there, the new one is saved as `name-1.jpg`,
  `name-2.jpg` … Nothing is ever overwritten.

**Put them on the project page:**

1. Open the project. Under **Project photos**, press **Add an item** for each photo.
2. In each item, press **Select**, open `projects` → your project's folder, pick the photo.
   (You can also upload from here: open the folder first, then upload or drag photos in.)
3. Fill in **Description of the photo**: say what is in it, for people who can't see it,
   e.g. "Three risograph posters pinned to a white wall". If you leave it empty, the
   project title is used.
4. Optional: **Caption** is a line shown under the photo on the project page. Put
   asterisks around words to slant them, like a book title: `Printed for *Not My Sister*`.
   Leave it empty for no caption.
5. Optional: **Set** splits the photos into groups. Photos with the same number are shown
   together, one at a time with the arrows. On a computer the sets stand one under the
   other in the left half of the page, set 1 first, and scrolling moves through them while
   the text stays in place on the right. On a phone the page shows set 1 first; scrolling
   down brings set 2, then set 3, and after the last set the project's text. Leave it at 1
   (or empty) if the project has one group of photos. To start a second group, type 2 in
   **Set** on each photo that belongs to it (3 for a third, and so on). A photo you add
   starts in set 1, wherever it sits in the list: change its **Set** if it belongs to
   another group. A set has no title on the page; only the photos' captions show.
6. **Drag** the handle on the left of an item to change the order. The project page shows
   the photos one at a time, in this order: the first one first, the rest with the arrows.
   With sets, the photos of a set keep this order among themselves; which set comes first
   is decided by the set numbers, not by the order of the list.
7. Press **Save**.

**How a visitor looks at the photos.** One photo shows at a time. The arrows under the
photo (at either end of the caption), a click on the photo, or the left and right arrow keys
go to the next one. A double click on a photo (on a phone: two quick taps) opens it as large
as the screen allows; a click, a tap or the Esc key closes it again.

## Set a thumbnail

The thumbnail is the photo in the grid on the home page. On a phone the thumbnails are one
under the other, each with the project's title under it.

- **Thumbnail photo (cover)**: press **Select** and pick a photo from the project's folder.
  Empty = a blank space in the grid, and on a phone just the project's title; it still opens
  the project.

Every thumbnail looks the same: the photo shows whole, in its own proportions (nothing is
cut off), centred in its box, with a soft shadow around it and no frame. There is nothing
else to set. If you want a tighter view, crop the photo before uploading it.

## Replace a photo

1. Upload the new photo into the project's folder (see *Add photos*).
2. In the project, on the current photo (the thumbnail, or the photo in a Project photos
   item), press the bin icon (**Remove**). Then press **Select** and pick the new photo.
3. Press **Save**.
4. Then, in **Media**, open the old file's menu (the three dots) and **Delete** it.

Delete the old file only **after** saving, otherwise the thumbnail briefly shows a grey
placeholder (a missing project photo is simply left out).

## Hide a project

Open the project, turn **Published** off, press **Save**. It disappears from the home page
and its page is removed. Turn it back on to bring it back. Prefer this to deleting.

## Add a tag category

The tag list is fixed on purpose, so filters keep the same spelling. Adding one is a
one-line change in the file `.pages.yml` (ask for it, or do it yourself):

1. If you signed in with GitHub: in Pages CMS, open **Configuration** in the left sidebar,
   or open `.pages.yml` on github.com and press the pencil. If you signed in with the email
   invite, you can't change this file: ask for the tag to be added.
2. Find the `tags` field and its list of `values`:

   ```yaml
         - name: tags
           ...
             values:
               - art print
               - book
               ...
               - wallpaper
               - workshop
   ```

3. Add one line in the same style, for example `- risograph`: lower case, in alphabetical
   order, with the dash lined up exactly under the others.
4. Save. The new tag now appears in the **Tags** list of every project.

The site picks it up automatically: as soon as a project uses the tag, it shows on that
project and becomes a filter on the home page.

## Links to more photos

If photos are somewhere else (Google Drive, Dropbox, Flickr …), add them under
**Links to more photos** with **Add an item**:

- **Link text**: what the link says, e.g. `Photos by Jane Doe`.
- **Web address**: the whole address, starting with `https://`.

They show as links on the project page, under the project's text.

## What not to touch

- **Slugs after publishing.** Changing one breaks links and separates the project from its
  photo folder.
- **Folder names in `images/projects`**, and the folders `images/info` and
  `images/collaborations`. Don't rename or move them; the projects and the two pages point
  at them.
- **The file `.pages.yml`**, except for adding a tag as described above.
- Anything outside **Projects**, **Home page intro**, **About page**, **Collaborations
  page** and **Media**. If you see something you don't recognise, leave it and ask.
