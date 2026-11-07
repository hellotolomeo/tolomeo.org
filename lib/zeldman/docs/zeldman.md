# Zeldman

How components work, on one page.

## The idea

One Nunjucks template per component is the single source of truth for its
presentation, including the light logic and loops that presentation needs.
The markup is written once, in that file. The server renders it inside the
custom element's tag, with the tag's attributes as variables; the element's
class renders the same file in the browser, from its state.

The browser provides the rest: custom elements, lifecycle callbacks,
attributes, events, modules and classes. `BaseComponent` lets a custom
element render a Nunjucks template, and re-renders it when state changes,
morphing the DOM so that only what changed is touched; the morph is
idiomorph. A component is an HTML file, a CSS file and, if it does
anything, a small JS class. Someone who knows HTML can edit a page;
someone who knows a little JS can write a component.

A component's inputs are its tag: its attributes, and its content, the
HTML between the tags. The tag carries what the component needs to
behave. Content is held by the box, the one element the template marks
`data-content`; the template renders around it, never into it, and
renders only what changes. Whoever writes a tag owns its attributes and
its content: the page writes a tag once; a parent's template writes a
child's tag on every render, and the morph keeps the child's attributes
and box in step with what it printed. The server renders the template
from the tag; the browser starts its state from the same tag and
derives the rest, so the first render changes nothing. `lifecycle.md`
follows four components through it.

## A component

```
components/mineral-row.html    what it looks like
components/mineral-row.css     how it's styled
components/mineral-row.js      what it does
```

The class says which template it renders:

```js
template = 'components/mineral-row.html';
```

That line is the registration. The browser reads it to render;
the server reads it at startup (it scans `components/`) to render the
same template inside the tag. Put files in whatever folders make sense,
`controls/` or `gallery/`; the path is explicit.

Use it anywhere, server or client, by writing the tag:

```html
<mineral-row mineral-id="{{ m.id }}">
  <span class="name">{{ m.name }}</span>
  <span class="formula">{{ m.formula }}</span>
  <span class="group">{{ m.group }}</span>
  <hardness-scale value="{{ m.hardness }}">{{ m.hardnessLabel }}</hardness-scale>
</mineral-row>
```

The server finds the tag, renders `components/mineral-row.html` inside it
with the attributes as template variables and the HTML between the tags as
`content`, and sends HTML. The browser upgrades the same tag to the JS
class, and the class picks up from there.

## The template

The template is the contents of the tag; the caller wrote the tag itself.

```html
{% if loading %}
<p>Loading…</p>
{% elif detail %}
<dl>…{{ detail.description }}…</dl>
{% endif %}
```

It's Nunjucks, written in the portable Jinja dialect
(`portable-templates.md`) so a Python or PHP server renders it to the same
bytes. Use `{{ }}`, `{% if %}` and `{% for %}` like you would anywhere.
Attributes on the tag arrive as variables, kebab-case turned camelCase
(`mineral-id` → `mineralId`).

A boolean is passed by writing the attribute or leaving it off.

```html
<drop-down
  name="system"
  label="Crystal system"
  {{ 'disabled' if disabled }}
></drop-down>
```

`disabled="{{ disabled }}"` is wrong: HTML treats any present attribute as
true, so `disabled="false"` still disables. An array or object is passed as
JSON: `rows="{{ rows | dump | e }}"`.

A list control takes its options as `<option>` content, the way `<select>`
does:

```html
<drop-down
  name="system"
  label="Crystal system"
  value="hexagonal"
>
  <option value="cubic">Cubic</option>
  <option value="hexagonal">Hexagonal</option>
  <option value="tetragonal" disabled>Tetragonal</option>
</drop-down>
```

The list is the `<option>` elements in the control's box, written by the
page or printed by a parent's template between the tags on every
render; the control reads them when it renders. The class reads them
with `choicesIn(this.box)` and hands the template `choices`; on the
server the template reads the content string with the filter,
`choices | default([] | choices(content))`. Either way each entry is `{
value, label, disabled, data, dataAttrs }`. `value` is a string. `label`
is HTML, the option's contents as written: print it as element content
with `| safe`, never inside an attribute. `disabled` is a boolean.
`data` is the option's `data-*` attributes under the names
`HTMLElement.dataset` gives them (`data-hex-color` → `hexColor`), each
decoded as `value` is; a bare `data-common` is `''`, which is false in a
condition on every engine, and in PHP so is `'0'`, so test with
`{% if o.data.common is defined %}` or compare to a string
(`o.data.count == '0'`), never on truth. `dataAttrs` is the same
attributes as the author wrote them, for a template that prints an
`<option>` from the list with `| safe`; no control in `components/`
does, since each keeps the author's `<option>`s as written. The filter
reads the content as a browser reads a tag; its edges are in the
header of `lib/filters.js`. A component does not go inside a list
control's content. The control's template loops the list for the
styled control and for the native `<select>` it renders beside the
content (below, "Starting from server HTML"). The filter and
`choicesIn` are in `lib/filters.js`; an app registers the filter once
on `BaseComponent.env` in `template-env.js`, and each server adapter
registers it on its own environment.

## The class

```js
import BaseComponent from '../client/lib/BaseComponent.js';

class MineralRow extends BaseComponent {
    template = 'components/mineral-row.html';
    static props = { 'mineral-id': '' };
    state = { open: false, detail: null, loading: false };

    connectedCallback() {
        this.addEventListener('click', e => {
            if (e.target.closest('[data-action="toggle"]')) this.toggle();
        }, { signal: this.signal });
        super.connectedCallback();
    }

    async load() {
        this.setState({ loading: true });
        const res = await fetch(`/api/minerals/${this.state.mineralId}`, { signal: this.signal });
        this.setState({ loading: false, detail: await res.json() });
    }
}

customElements.define('mineral-row', MineralRow);
```

- `template` is the path to the HTML, and is required.
- `static props` lists the attributes it reads, each with its default.
  The default carries the type: `''` a string, `0` a number, `false` a
  boolean (present or absent), `[]` and `{}` JSON, `null` the attribute
  as written. They land in `this.state` under camelCase keys and update
  when the attribute's text changes; one whose text has not changed
  keeps the value it parsed to, so a JSON prop stays one object across
  a sync. Content is not a prop: it is the nodes between the tags, held
  by the box (below, "Starting from server HTML"). The server reads the same declaration
  from the class file and types each attribute by it, so a default is a
  literal: a string, a number, `true`, `false`, `null`, or an array or
  object of those.
- `state` holds what the component owns and the tag does not say. It is
  a class field; a component with nothing of its own leaves it out. A key
  in it that is also a prop is overwritten on connect by the attribute's
  value, or by the prop's default when the attribute is absent.
- `this.state` is the template's variables. `setState()` re-renders, as
  does an attribute change that leaves a prop different; nothing else
  changes the DOM.
- One delegated listener in `connectedCallback`, with `this.signal` so
  it's removed when the element goes away. Then `super.connectedCallback()`.
- `emit('name', detail)` raises an event for the parent. Parents
  pass data down by writing the child's tag, its attributes and its
  content; children send events up. Neither reaches into the other.

Five optional hooks: `onConnected()`, `onDisconnected()`,
`afterRender()` for a library that draws into the DOM (never for
listeners), `getTemplateContext()` for values computed from state (a
filtered list, a percentage) rather than stored in it, and
`onPropsChanged(props)` if a prop change should also change some other
state.

`static events = ['range-change']` lists what the component emits, with a
comment beside each naming its `detail` (`// { name, low, high } when a
thumb comes to rest`), so the outgoing contract sits next to the incoming
one. A comment beside each prop says what it's for, and the comment above
the class says what the component is for; the pages under
`docs/components/` are printed from these.

## Re-rendering

`setState` renders the template to a string and morphs the element's
children to match. Unchanged DOM stays put, so focus, scroll position and
input values survive.

A dashed tag inside a template is a boundary. The parent writes the tag,
its attributes and what is between the tags; the morph syncs the
attributes, morphs what was printed between the tags into the child's
box, and goes no further in. A child whose attributes or box changed
re-renders once, with every prop read from the tag again; a tag printed
bare empties the box. A child that has not rendered yet (its class not
defined) is left as it is until it upgrades; the parent's next render
brings it in step.

The template's own `data-content` element, the box ("Starting from
server HTML", below), is a boundary too, for as long as the template
marks it. The morph syncs its attributes and never enters it: what is
inside is whoever wrote the tag's. Content the page wrote stays as the
reader left it, a `<details>` opened, text typed into an input; content
a parent prints follows the parent's print, so what a reader changes
there lives in state, as everywhere else. What an `afterRender`, a
library or a script added in the box stays to the next render, where
such code runs again on top unless it checks, so make it idempotent. A
live element can be the box: `note-card`'s body (`docs/demo`) carries
its `folded` class, `mineral-row`'s head is the button itself and its
`aria-expanded` follows state, while the name, formula and group inside
it are the page's. The box's own attributes must be ones only the
template changes; a control whose value the reader changes sits outside
the box, as the native select does.

A component never renders into its box. What it fetches goes in an
element the morph enters, in one of two shapes. Keep the box and render
after it, as `mineral-row` renders the record it fetches below its head,
and as a tree does whose server-rendered children stay in the box and
whose fetched ones follow them. Or stop marking it: print the same
element, with the same `id`, without `data-content`, and the fetched
rows in it, as `mineral-list` does (`#mineral-list-content`, marked
until it has fetched); the morph, which no longer sees a box, renders
the rows into it where it stands, and a row in both keeps its element
and its place, matched by `id`. Never two branches inside a marked box,
`{% if fetched %}` rows `{% else %}{{ content | safe }}{% endif %}`, and
never a loading or error line inside it: the morph would not enter it;
the branches wrap the element. A box, once unmarked, is not marked
again; a component that may return to the server's rows keeps the box,
the first shape. Both shapes are written out, page, template and class,
in `howto.md`, "Hand a list as content".

The morph matches siblings by `id` first and by tag name after. If a
template loops over a component, give each one an `id`, unique across
the page, so reorders move elements instead of re-propping them:

```html
{% for m in results %}
<mineral-row id="mineral-row-{{ m.id }}" mineral-id="{{ m.id }}">…</mineral-row>
{% endfor %}
```

The same matching can rebuild a child that did not move: an element a
`{% if %}` prints before the child, with the same tag name as the
element wrapping it, is matched to that wrapper when it appears, and the
child is built again under a new one. The box is subject to it in the
same way: an `{% if error %}<div class="error">` printed before a
`<div data-content>` is matched to the box when it appears, and what
the box held moves into the new one. Give the child, its wrapper or the
box an `id`, or print the element before it always.

## Starting from server HTML

The server renders the page; the class attaches to what is there. Data
reaches a component three ways. An attribute is on the tag because the
class reads it, a template condition tests it, a parent may change it,
or a part the template re-renders prints it (`mineral-list`'s `total`
and `count`: the summary is rendered again on every search). A value
printed only in markup that never changes is content, written by the
include that writes the tag, on both sides: `mineral-row` carries
`mineral-id`, the one thing its class reads, and the name, formula and
group spans and the `<hardness-scale>` tag in its head come between the
tags from `mineral-list/row.html`. Content carries HTML the template
places and does not look inside. What a component needs only later, it
fetches when asked.

Content has one convention. The template says where it goes, as the
whole contents of one element it owns, marked `data-content`, and
never touches it: `<div class="body" data-content>{{ content | safe
}}</div>`. The server fills `content` with the HTML between the tags as
written; the browser has no content string (`content` is not a prop,
and no prop or state field may use the name) and prints the box empty:
on the first render of a tag nothing has rendered, the nodes between
the tags move into it, and a tag the server rendered already holds its
box, kept as it is. Whoever writes the tag owns the box: the page wrote
it once; a parent's template writes it on every render, and the
parent's morph keeps it in step with what it printed, a bare tag
meaning an empty box. `data-content` is reserved for the box. Classes
are defined after the page is parsed (a module script, or `defer`): a
class that upgrades a tag while the parser is still inside it sees no
content. The edges are in `howto.md`, "Content: the edges."

A list control is the one place markup is read as data. Its list is the
`<option>`s in its box, a hidden `<datalist data-content>`, written by
the page or printed by a parent on every render; `choices` reads them
when the control renders (`choicesIn` in the browser, the string filter
on the server), and the native fallback, the form field, is a `<select>`
rendered beside the datalist with `selected` on the option whose value
is `value` (`multi-select`: a `<select multiple>` and `values`;
`combo-box`: the datalist itself is what the input lists). Picking an
option is `setState({ value })`; the morph moves `selected`, and the
select follows; the datalist does not change. A pick a reader makes in
the native select before the class connects is discarded by the first
render, which sets the choice from the tag.

A component that is handed rows it will later replace prints them as
content and fetches when it must: the page writes the rows between the
tags, looping the row's own include, and what the list needs from those
rows before it fetches, the page writes as an attribute beside them
(`count`). `mineral-list` is the shape to copy.

## The contract between server and browser

The server's HTML and the browser's first render of the same component
are byte-identical, so the first morph does nothing, and the first render
adds no attribute either: a prop's default stays in the class and is
never written to the tag, and no id or key is added. Measured with a
`MutationObserver` installed before any class is defined, the first
render of every minerals page makes zero mutations inside any component,
and so does a forced `render()` on every one of them;
`test/minerals.test.js` holds both for the three pages (84, 6 and 2
components) and `test/controls.test.js` holds the first render for every
fixture of the five controls; `test/base-component.test.js` holds that
no later render of the owner enters the box, a `<details>` opened and
text typed inside page-written content surviving a render. You can
check it: open a server-rendered page and call
`document.querySelector('mineral-list').render()` in the console.
Nothing changes.

It holds because server and browser run the same template with the same options
(`autoescape`, `trimBlocks`, `lstripBlocks`) over the same values. The
server adapters (`server/node`, `server/python`, `server/php`, `server/go`,
`server/rust`) exist to make that true;
`portable-templates.md` lists the handful of constructs the engines
disagree on.

## Where files go

A project is laid out by where its code runs:

```
components/   one component = three files side by side; both sides render these
client/       only the browser: main.js, template-env.js, lib/ (BaseComponent, TemplateLoader, vendor), services/
server/       only the server: the adapter wiring, routes, the data layer
shared/       both, but not components: pages/ (page templates), base.html, base.css, lib/ (pure logic)
```

`components/` is the shared part that has a browser class; `shared/` is the
shared part that doesn't. A page template lives in `shared/pages/` because
the server renders it and the browser's components render inside it. A
pure function both sides call, a date formatter or a sort, lives in
`shared/lib/`. Nothing in `client/` is imported by the server; nothing in
`server/` is served to the browser.

## What each side can see

On both sides the template's variables are the tag's attributes, kebab
turned camel, plus the engine's globals, and on the server `content`,
the HTML between the tags; nothing of the page the tag sits in, on
either side.
In the browser the class's own `state` and what `getTemplateContext()`
derives are variables too, and they are undefined on the server, so
each must be false or empty at the first render and the template must
render the same bytes without it: `{% if open %}` around a derived list
with `open` false at first, `{% if fetched %}` around rows the server
never has, or `{% set cursor = cursor | default(-1) %}` for a state
field the class defaults, as the controls in `components/` do for
`cursor` (`x in undefined` throws in Nunjucks; guard it).

Both sides type an attribute by `static props`: the server reads the
declaration from the class file, so a declared attribute is a boolean
by presence, a number by `Number()`, an array or object by JSON, a
string as written (`"3"` stays `"3"`), and an attribute the tag omits
is the prop's default on both sides; a template needs no `| default`
for a prop. A prop cannot say the attribute is absent, since an omitted
`total: 0` reads as `0`; a value the server may not know is declared
`null`, so an omitted attribute is `null` on both sides and a written
one is its text, which the template converts behind `is none`
(`null | int` differs between engines; `portable-templates.md`). An
attribute the class does not declare is coerced by shape on the server
(`"3"` is a number, `"[…]"` is JSON, a bare attribute is `true`) and is
not state in the browser. A declaration the server cannot read (a
default that is a reference or a call, not a literal) stops it at boot,
naming the entry; the rest no adapter warns about; `test/parity.test.js`
and a forced `render()` are how you find out. `content` is a variable
on the server only; in the browser the content is the nodes in the
box, as "Starting from server HTML" says.

## Modals are popovers

A dialog is an element with `popover` and a static `id`. The browser owns
the top layer and the open state; for `auto` it also owns Escape, backdrop
click and focus return. The scrim is `::backdrop`, open styling hangs off
`:popover-open` (an unscoped `display` would override the UA's
`display: none`), triggers are `popovertarget="<id>"`, close buttons add
`popovertargetaction="hide"`; call `showPopover()` only when there is no
button (a keyboard shortcut). Open-side work listens for the dialog's
`toggle` on the host with `{ capture: true }`, because it does not bubble. Keep
`role="dialog" aria-modal aria-labelledby`. Use `manual` only where light
dismiss would throw away work; the spec restores focus only for `auto`.
Because the `id` and `popover` are static in the template, `setState` can
morph around an open popover. Nothing can stack over the top layer by z-index:
what must sit over a popover must be its descendant.

## Not everything is a component

`<site-footer>` and `<static-page>`, in flora, are tags used for scoping
CSS, with no class. A tag with no state is still a component when its template builds
markup from its attributes (a loop, arithmetic) and is written by tag in
more than one place, as `hardness-scale` is, its cells drawn from `value`
in every row and on the detail page; its attributes then cross the wire
beside their rendering. A template that prints values, or tests them, is
a partial, included where it is used. Any other tag with no state has no
template: its markup is written where it is used. `<mineral-detail>` is
written out in `shared/pages/detail.html`, between its tags, and never
re-rendered; its class is a plain `class extends HTMLElement` that hangs
one listener on it, for the copy button. The server passes the tag
through as the HTML it already is. With no state and nothing to build
from its attributes, there is nothing to render, so no `BaseComponent`
and no template.

## What's under the hood

Five files:

- `server/node/expand.js` — the expander, server side. The page's engine
  renders the page as the plain template it is, custom tags and all; then
  `expand(html, { templates, props, render })` walks the HTML once with a
  small tokenizer and, at each start tag whose name is in `templates`,
  calls `render` with that template and the tag's attributes as variables
  (kebab to camel, each typed by its declaration in `props` as the
  browser types it, a declared one the tag omits as its default, an
  undeclared one by shape) plus `content`, the HTML between the tags as
  written, and puts the result inside a re-emitted tag. The result is
  expanded in turn, so components nest. Text, other tags, comments and
  the insides of `<script>`,
  `<style>`, `<textarea>` and `<title>` pass through untouched. A
  template that fails to render is an error naming the tag, the template
  path, what the engine said and the names of the variables the template
  was given, on every server and as one line in the browser's console. No
  engine, no HTML parser, with the attribute grammar and entity table it
  shares with `lib/filters.js`; the same pass in any language, and all
  five adapters are on it.
- `server/node/zeldman.js` — the Node adapter. Scans `components/` once at
  boot for `define('tag')` + `template = '…'` pairs and each class's
  `static props` (a literal reader: no `eval`, no JS parser; a default
  that is not a literal stops the boot, naming the entry), builds a plain
  Nunjucks environment, and its `render` is: render, then expand.
  `server/python/zeldman.py` is the same for Jinja2, with its port of the
  expander and the reader in the one file, `server/rust/src/lib.rs` for
  minijinja, `server/go` for gonja, with its port in `expand.go`, and
  `server/php/zeldman.php` for Twig, with its port in the one file beside
  the `elif` / inline-`if` rewriter Twig needs.
- `lib/BaseComponent.js` — client side. Props, content, state, render,
  emit, and the morph callback that never enters the `data-content`
  element and keeps each child's attributes and box in step with what
  the template printed. No imports.
- `lib/TemplateLoader.js` — the browser's template loader, set up once in
  `template-env.js`. Fetches a template by the path in `template =`, with
  no query string, so the HTTP cache keeps it under the server's headers;
  Nunjucks keeps the compiled template, so each is fetched once per page.
  The request is synchronous, as `render()` is. No imports.
- `lib/filters.js` — the `choices` filter (above, "The template"), one
  function the app registers on `BaseComponent.env` and every server
  adapter registers on its own environment; `choicesIn`, the same list
  from the `<option>` elements in a box, browser only; and the
  attribute grammar and entity table the filter's scan and the
  expander's tokenizer share. No imports.

The line counts and gzipped sizes are in the README, "What's in the
box". Two example apps in `/examples`: `client-only` (no server) and
`client-server` (SSR from a JSON file, a real site's shape in miniature,
with Node, Python, PHP, Go and Rust servers that render the same files).
Each is a few components and a README; start there.
