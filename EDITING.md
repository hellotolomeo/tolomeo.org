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
3. Open **tolomeo.org**. On the left you see **Projects**, **Home page intro**, **Info page**
   and **Media** (all the photos).

## Edit the intro or the Info page

- **Home page intro**: the line at the top of the home page. Your name is written
  `[Tolomeo](/info/)`: that makes it bold and a link to the Info page. Change the words
  around it freely; keep the square and round brackets as they are.
- **Info page**: the text of the Info page. Write normal paragraphs. To add a link, select
  the words and use the link button.
- Paragraphs, links, **bold** and *italic* show on the site. Italic shows as slanted text
  (the font has no italic of its own). Headings, lists and so on are turned into plain
  paragraphs.

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
   - **Years**: shown exactly as you type it: `2026`, `2023–2026`, `2025, 2026`, `2023 –`.
   - **Start year / End year**: only used for sorting. Leave End year empty if it's ongoing.
   - **Tags**: the categories people can filter by. Pick from the list.
   - **Role**: what you did, one per line (**Add an item** for another). Shown as `role:`.
   - **Client**: shown as `for:`.
   - **Description**: paragraphs, links, bold and italic. Leave it empty if there is
     nothing to say; the page then shows only the photos, the title and the labels.
3. Press **Save**.

**Drafts.** Turn **Published** off to keep a project hidden while you work on it. It is
then not on the home page and has no page of its own. Turn it on when it's ready.

**Order numbers.** The list is sorted by **Order**, smallest first.

- Whole numbers are main projects: `1`, `2`, `3` …
- Sub-projects sit under a main project: `2.1`, `2.2`, `2.3` sit under project `2`.
- Need ten or more under one project? Use `2.01`, `2.02` … `2.10` (because `2.10` is the
  same number as `2.1`).
- To fit a project in between, decimals are fine: `4.5` sits between `4` and `5`.

**Sub-projects.** Set **Part of (parent project)** to the main project, and give it an
order like `2.1`. It then shows with a `•` under its main project. Leave it empty for a
main project.

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
5. **Drag** the handle on the left of an item to change the order. The project page shows
   the photos one at a time, in this order: the first one first, the rest with the arrows.
6. Press **Save**.

## Set a thumbnail

The thumbnail is the photo in the grid on the home page.

- **Thumbnail photo (cover)**: press **Select** and pick a photo from the project's folder.
  Empty = a blank space in the grid (no frame); it still opens the project.

Every thumbnail looks the same: the photo shows whole, in its own proportions (nothing is
cut off), centred in its box, in a paper-coloured frame. There is nothing else to set. If
you want a tighter view, crop the photo before uploading it.

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
- **Folder names in `images/projects`.** Don't rename or move them; the projects point at
  them.
- **The file `.pages.yml`**, except for adding a tag as described above.
- Anything outside **Projects**, **Home page intro**, **Info page** and **Media**. If you
  see something you don't recognise, leave it and ask.
