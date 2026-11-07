# Zeldman how-to

Recipes. `zeldman.md` is the contract; this is the how. Every snippet is
lifted from a component in `examples/`, `components/` or `docs/demo`, or
is a sketch checked against a probe.

---

## Make a component

Three files.

```
components/status-badge.html
components/status-badge.css
components/status-badge.js
```

`status-badge.html`:
```html
<span class="badge {{ status }}">{{ label }}</span>
```

`status-badge.js` — the minimum:
```js
import BaseComponent from '../client/lib/BaseComponent.js';

class StatusBadge extends BaseComponent {
    template = 'components/status-badge.html';
}
customElements.define('status-badge', StatusBadge);
```

Add the import to your page's `main.js`. Use it:
```html
<status-badge status="accepted" label="Accepted"></status-badge>
```

The `template` line is what registers it: the server scans `components/`
at startup and renders that file inside the tag.
Folders are yours to choose — `controls/`, `gallery/` — the path is
explicit, so nothing needs to match anything.

---

## Give it behavior

```js
class StatusBadge extends BaseComponent {
    template = 'components/status-badge.html';
    static props = { status: '', label: '' };
    state = { hovered: false };

    connectedCallback() {
        this.addEventListener('mouseenter', () => this.setState({ hovered: true }), { signal: this.signal });
        this.addEventListener('mouseleave', () => this.setState({ hovered: false }), { signal: this.signal });
        super.connectedCallback();
    }
}

```

The template can now use `hovered`.

---

## Pass data in

Scalars go on the tag: what the class reads, a template condition
tests, or a parent may change. Declare each with its default; the
default's type is what the string becomes, and an absent attribute is
the default.

```js
static props = {
    'name-id':   '',        // "123"        → state.nameId = "123"
    'offset':    0,         // "40"         → state.offset = 40
    'loading':   false,     // present/absent → true/false
    'code':      null,      // "007"        → state.code = "007", as written
};
```

In the parent template:
```html
<combo-box
  name="q"
  label="Search"
  value="{{ value }}"
  {{ 'disabled' if disabled }}
>…</combo-box>
```

Kebab on the tag, camel in state. `name-id` → `state.nameId`. The
server reads the same declaration from the class file and types each
attribute by it when it renders the child's template, so `"007"` stays
a string for `code` and becomes 7 for `offset`, and an attribute the
tag omits is its default on both sides. A default is a literal (a
string, a number, `true`, `false`, `null`, an array or object of
those), so the server can read it without running the class.

A list, or markup that never changes, goes between the tags as content
("Content", below; "Hand a list as content" for a list): `mineral-row`
carries `mineral-id` on the tag and the head's spans between the tags;
a list control takes its `<option>`s there. The exception is a small
object a template reads as a whole, which may go in as JSON, declared
`[]` or `{}` and written `chips="{{ chips | dump | e }}"`; `chip-list`
takes its chips so, a few hundred bytes a parent owns. It is on the
wire twice, as the attribute and as what the template prints from it,
so it stays small.

The one rule people trip on: **a boolean is present or absent.** Write
`{{ 'loading' if loading }}`, never `loading="{{ loading }}"` — the second
one emits `loading="false"`, and HTML says any present attribute is on.

`aria-*` attributes are the exception: they're strings, and `"false"`
means false. `aria-expanded="{{ 'true' if open else 'false' }}"`.

---

## Content

Content goes between the tags. The template says where it goes, one
element marked `data-content`, the box, and never touches it.

```html
<note-card>
  <h3>Streak</h3>
  <p>Rub the mineral across unglazed porcelain.</p>
</note-card>
```

```html
{# the template, before its fold button #}
<div class="body{{ ' folded' if folded }}" data-content>{{ content | safe }}</div>
```

The server fills `content` with what it found between the tags; the
browser prints the box empty and the nodes between the tags move into
it on the first render, or are already there from the server. The
morph syncs the box's attributes (`note-card`'s `folded` class;
`mineral-row`'s head is a `<button data-content>` whose `aria-expanded`
flips) and never enters it. Whoever writes the tag owns what is inside:
the page writes it once, and a parent's template writes it on every
render, so a parent changes a child's content by printing it again
("Hand a list as content", below). The contract is `zeldman.md`,
"Starting from server HTML"; the edges are below.

The template does not look inside the box. A list control is the one
place markup is read as data: the `<option>` elements in its hidden
`<datalist data-content>` are its list, read when it renders, and the
native `<select>` is rendered beside it from that list (`zeldman.md`,
"The template").

---

## Content: the edges

The contract is in `zeldman.md`, "Re-rendering" and "Starting from
server HTML". These are its edges, each with the reason. The class
header of `lib/BaseComponent.js` states the mechanism.

- **Hide empty content with a class.** `{% if content %}` around the
  box removes it on a server page where the content was empty, and in
  the browser always, since `content` is undefined there; the element
  stays, and the template stops marking it only after a fetch ("Hand a
  list as content", below).
- **`data-content` is reserved for the box; author content does not use
  it.** The class takes the first `data-content` element its own
  template printed (one below a nested component is that one's), and an
  author's would be taken for it.
- **Never print `content` inside a component tag.** `<x-card>{{ content
  | safe }}</x-card>` gives the card the content on the server and
  prints the card bare in the browser, which empties it.
- **What a reader changes inside content a parent prints goes on the
  parent's next render.** Text typed into an input there, a `<details>`
  opened: the morph brings the box back to what the template printed.
  What should survive lives in state. Content the page wrote stays as
  the reader left it.
- **An option's `data-*` attributes have two edges of their own.** The
  first of a duplicated name counts, as in a browser. A `data-*` name
  that is a number (`data-2`) is a key JavaScript orders before the
  others, so `o.data` dumps in a different order there; name them with
  a letter first. What `o.data` and `o.dataAttrs` hold, and how a bare
  one is tested, is in `zeldman.md`, "The template".
- **A reconnect re-reads the attributes.** Connect takes `query`,
  `total` and `count` from attributes the class never writes back, so
  after a remove-and-reinsert `mineral-list`'s summary and search box
  revert to the page's while the rows stay fetched: the rows in the
  unmarked element are state, rendered from it once more.
- **A keyed move does not reconnect.** `connectedMoveCallback` is defined
  (`BaseComponent.js`), so a parent's re-render that moves the element
  (`moveBefore`) leaves its DOM state untouched. The minerals list is the
  page's root, and nothing moves it.
- **A page restored from the back-forward cache does not reconnect.** A
  component comes back with the state it had when the page was left, an
  open menu and its pick included. A control that should come back
  closed listens for `pageshow` with `persisted` and resets its own
  state.
- **A child component in the content of a component the browser creates
  moves.** A fetched row through an include arrives as a tag with the
  `<hardness-scale>` between its tags; the row's first render moves it,
  the same element, into the box. If it had connected first it
  disconnects and connects again, one render more, and a fetch on
  connect is one request, aborted if it uses `this.signal`, so use it.
  A server-rendered row holds its box already and nothing moves.

---

## Send data out

```js
this.emit('range-change', { low, high });
```

Parent listens on itself (events bubble):
```js
connectedCallback() {
    this.addEventListener('range-change', e => {
        this.setState({ rank: [e.detail.low, e.detail.high] });
    }, { signal: this.signal });
    super.connectedCallback();
}
```

Down: the child's tag, its attributes and what the parent prints
between them. Up: events. Nothing else passes between components.
Never call a method on a child; never read a child's DOM.

---

## Two components with no common parent

Events reach a parent and a tag reaches a child, so two components
with no parent template in common share what they both need through a
module in `services/`: it owns the value, raises one event when the
value changes, and each component sets its own state from it.
`examples/client-only`'s `CreatureStore` is the shape. It keeps the
saved creatures in `localStorage` and raises `change`; `creature-builder`
calls `save` and `remove`, and `saved-list` listens:

```js
store.addEventListener('change', () => this.setState({ creatures: store.all() }), { signal: this.signal });
```

A fetched resource two components read goes the same way: the service
fetches once and hands every caller the same promise, so one large
response crosses the wire once.

---

## Change what's on screen

Change state. The template does the rest.

```js
// yes
this.setState({ open: true });

// no
this.querySelector('.panel').classList.add('open');
this.querySelector('.count').textContent = n;
```

```html
<div class="panel{% if open %} open{% endif %}">…</div>
```

One render path. If you find yourself reaching for `querySelector` to
*write*, the state is in the wrong place.

---

## Handle clicks (and everything else)

One delegated listener, in `connectedCallback`, with `this.signal`.
Route on a `data-action`.

```js
connectedCallback() {
    this.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        if (btn.dataset.action === 'expand')  this.toggle(btn.dataset.id);
        if (btn.dataset.action === 'remove')  this.remove(btn.dataset.id);
    }, { signal: this.signal });
    super.connectedCallback();
}
```

```html
<button data-action="expand" data-id="{{ m.id }}">Show</button>
```

Don't add listeners in `afterRender` — it runs every render and they'd
pile up. Don't add them to elements inside the template — they get
morphed away.

---

## Loop over components

Give each one an `id` unique across the page. It's how the morph
knows which one is which when the list reorders.

```html
{% for m in results %}
  <mineral-row id="mineral-row-{{ m.id }}" mineral-id="{{ m.id }}">…</mineral-row>
{% endfor %}
```

The `id` is *which row this is*. If two rows could carry the same data
(two synonyms of one record), they still need different ids.

It is a DOM `id` (`mineral-row-quartz`), so it must be unique across the
whole page. Five `<part-picker>`s that each list an option with
`id="opt-none"` collide; write `id="{{ slotName }}-opt-{{ option.id }}"`.

The morph matches siblings by `id` first and by tag name after, and the
tag-name match applies outside loops too. An element a `{% if %}`
prints before a child, with the same tag name as the element wrapping
the child, is matched to that wrapper when it appears: the wrapper's
contents are morphed into the new element's, and the child is built
again under a new wrapper, disconnected and connected with its state
gone. The box is subject to the same match: a `<div class="error">` an
`{% if %}` prints before a `<div data-content>` is matched to the box,
and what the box held moves into the new one. A `<p>` before a `<div>` wrapper, or a
`<div>` before a bare child tag, is inserted and rebuilds nothing. Give
the child, its wrapper or the box an `id`, or print the element always
and hide it with a class.

---

## Compute something for the template

Store the inputs in state; derive in `getTemplateContext()`.

```js
getTemplateContext() {
    const { entries, query } = this.state;
    const q = query.toLowerCase();
    return {
        matches: entries.filter(e => e.term.toLowerCase().includes(q)),
    };
}
```

Template sees `entries`, `query`, *and* `matches`. Don't write a
`getTemplateContext` that copies state fields — state is already
the context.

---

## React to a prop changing

Usually the template handles it. If a prop should also set some *other*
state:

```js
onPropsChanged({ options, noResults }) {
    return { open: options.length > 0 || noResults };
}
```

Runs on connect and whenever attributes change, with every prop, before
they land in `this.state`; a change that leaves every prop as it was
runs neither the hook nor a render. An attribute whose text has not
changed keeps the value it parsed to, so `options !== this.state.options`
tells a new list from a re-prop that left it alone. A child whose tag
did not change is not reached: a control that resets after a pick does
so itself, as `combo-box` empties its input when `clear-on-select` is set.

---

## Fetch data

```js
// mineral-row.js
async load() {
    if (this.state.detail || this.state.loading) return;
    this.setState({ loading: true, error: null });
    try {
        const res = await fetch(`/api/minerals/${this.state.mineralId}`, { signal: this.signal });
        if (!res.ok) throw new Error(`Server said ${res.status}`);
        this.setState({ loading: false, detail: await res.json() });
    } catch (err) {
        if (err.name === 'AbortError') return;
        this.setState({ loading: false, error: err.message });
    }
}
```

```html
{% if loading %}<p>Loading…</p>
{% elif error %}<p class="error">{{ error }}</p>
{% elif detail %}…{% endif %}
```

`this.signal` cancels the fetch if the element is removed mid-flight.

---

## Host a library's DOM

A chart library draws into an element and keeps it; the morph would
empty a plain `<div class="chart">` on every render. Give the library a
dashed tag no class is defined for, and mount inside it:

```html
<chart-canvas class="chart"><div class="mount"></div></chart-canvas>
```

A dashed tag is a boundary whether or not a class is defined for it: the
morph syncs its attributes and leaves its contents alone. The library
mounts on the inner element, since what it writes on the tag itself is
synced away. Make the library's object in `onConnected()`, where a size
the tag passes is already in state; in `afterRender`, redraw only when
the values it reads have changed; in `onDisconnected()`, destroy it
("Clean up", below), and a reconnect makes it again.

---

## Start from server-rendered HTML

You mostly don't have to do anything. The server rendered the template
with the same attributes and the same content; the class connects,
parses props, renders — and the morph finds nothing to change, then or
later: the box is never entered. What the component needs only later,
it fetches.

Give every checkbox and radio a `value` attribute. The morph syncs a
form control's `value` property with its attribute, and one without the
attribute is two mutations on every render, the attribute written and
removed again.

---

## Hand a list as content

A parent prints the list between the child's tags, on every render,
and prints it again when it changes; the morph keeps the child's box
in step with the print, and the child re-renders once when it changed.
`mineral-search` writes the library's `combo-box` this way, the names
that match what was typed as its `<option>`s, and nothing matched is
the tag printed bare:

```html
{# components/mineral-search.html #}
<combo-box
  name="q"
  label="Search"
  value="{{ value }}"
>{% for match in matches %}<option value="{{ match.id }}">{{ match.name }}</option>{% endfor %}</combo-box>
```

```js
// the names that start with what was typed; none before the names arrive
getTemplateContext() {
    const needle = this.state.value.trim().toLowerCase();
    const matches = needle ? this.state.names.filter(n => n.name.toLowerCase().startsWith(needle)).slice(0, 8) : [];
    return { matches };
}
```

The control reads the `<option>`s from its box on every render. Its
template ends with the box, `<datalist id="{{ name }}-options"
data-content>{{ content | safe }}</datalist>`, and starts with
`{% set choices = choices | default([] | choices(content)) %}`: the
browser's list from the class, the server's from the content string.
The class gives it:

```js
import { choicesIn } from '../lib/filters.js';

getTemplateContext() {
    return { choices: choicesIn(this.box) };
}
```

Each entry is `{ value, label, disabled, data, dataAttrs }`
(`zeldman.md`, "The template"). `components/drop-down` is the one to
copy.

The other way round, a component that will replace the rows it starts
with is handed them as content by the page, and fetches when it must.
The minerals list: the page writes the rows between the tags with the
row's own include, and the component keeps them in its box until it
has rows of its own, then stops marking that element and renders its
rows in it.

```html
{# shared/pages/list.html #}
<mineral-list
  query="{{ query }}"
  total="{{ total }}"
  count="{{ results | length }}"
>
  {% for mineral in results %}{% include 'components/mineral-list/row.html' %}{% endfor %}
</mineral-list>
```

```html
{# components/mineral-list.html — the rows #}
{% if fetched %}
<ol
  id="mineral-list-content"
  class="rows"
  aria-busy="{{ 'true' if loading else 'false' }}"
>{% for mineral in results %}{% include 'components/mineral-list/row.html' %}{% endfor %}</ol>
{% else %}
<ol
  id="mineral-list-content"
  class="rows"
  data-content
  aria-busy="{{ 'true' if loading else 'false' }}"
>{{ content | safe }}</ol>
{% endif %}
```

```js
static props = { query: '', total: 0, count: 0 };
state = { results: [], fetched: false, loading: false };

async load(query) {
    this.setState({ loading: true });
    const res = await fetch(`/api/minerals?q=${encodeURIComponent(query)}`, { signal: this.signal });
    const { results } = await res.json();
    if (query !== this.state.query) return;   // a later keystroke's fetch is the one that counts
    this.setState({ results, count: results.length, fetched: true, loading: false });
}
```

One element, the same `id` on both branches: marked `data-content`
until the class has fetched, then unmarked, with the fetched rows in
it. The morph, which no longer sees a box, drops `data-content` and
renders the rows into the element where it stands, and a row that is
in both keeps its element and its place, matched by `id`, with whatever
state it holds. The box's own attributes follow state while it is
marked (`aria-busy` dims the rows while a search loads); nothing inside
it does. The summary line reads `count` and `total` from the tag, which is why the page
writes `count` as well as the rows. The branches wrap the element;
never `{% if fetched %}` rows `{% else %}{{ content | safe }}{% endif
%}` inside a marked box, and never a loading or error line inside it.

The other shape keeps the box and renders after it. `mineral-row` is
this shape: the head button is the box, and the record the row fetches
("Fetch data", above) renders below it, loading and error lines
included. A component that may show the server's rows again is this
shape too, since a box, once unmarked, is not marked again.

```html
{# components/mineral-row.html #}
<button
  type="button"
  class="head"
  data-action="toggle"
  aria-expanded="{{ 'true' if open else 'false' }}"
  data-content
>{{ content | safe }}</button>
{% if open %}
<div class="body">
  {% if loading %}
  <p class="status">Loading…</p>
  {% elif error %}
  <p class="status error">{{ error }}</p>
  {% elif detail %}
  <p>{{ detail.description }}</p>
  <dl>
    <dt>Crystal system</dt><dd>{{ detail.system }}</dd>
    <dt>Lustre</dt><dd>{{ detail.luster }}</dd>
    <dt>Streak</dt><dd>{{ detail.streak }}</dd>
    <dt>Colors</dt><dd>{{ detail.colors }}</dd>
  </dl>
  <p class="more"><a href="/minerals/{{ detail.id }}">Full entry</a></p>
  {% endif %}
</div>
{% endif %}
```

A list the component re-renders from its handed data, without fetching,
rides as an attribute (`rows="{{ rows | dump | e }}"`) and is on the wire
twice, once as the attribute and once as the rows. Small lists a parent
owns, a few hundred bytes escaped, fall on that side; a list that
escapes to several kilobytes, or anything that would make View Source
hard to read, falls on this one.

---

## Partials

A component with several templates gets a folder.

```
components/gallery/image-gallery.html      ← the component
components/gallery/gallery-item.html       ← partials it includes
components/gallery/gallery-caption.html
```

```html
{% for image in images %}{% include 'components/gallery/gallery-item.html' %}{% endfor %}
```

A partial a page and a component share lives in the folder of the
component that owns the shape, as `mineral-list/row.html` does.

---

## Running it somewhere else

BaseComponent renders with one thing: `BaseComponent.env`, a Nunjucks
`Environment` whose loader fetches `components/x.html` by that path
(`lib/TemplateLoader.js`; the HTTP cache keeps what it fetches). Set it
before importing any component:

```html
<script src="lib/vendor/nunjucks.min.js"></script>
<script src="lib/vendor/idiomorph.min.js"></script>
<script type="module" src="main.js"></script>
```
```js
// template-env.js — first import in main.js
import BaseComponent from './lib/BaseComponent.js';
import TemplateLoader from './lib/TemplateLoader.js';
import { choices } from './lib/filters.js';

BaseComponent.env = new nunjucks.Environment(
    new TemplateLoader('.'),    // where components/ is: '.', '/', '../..'
    { autoescape: true, trimBlocks: true, lstripBlocks: true },
);
BaseComponent.env.addFilter('choices', choices);
```

The options must match the server's (if there is one) or the two sides
render different whitespace and the first morph isn't a no-op. The filter
is the one the list controls read their list through; every adapter
registers the same function.

With no server, `<body><my-app></my-app></body>` is a complete page: the
root component renders from its `state` field on connect and the
tree grows from there. `examples/client-only` is exactly this.
`examples/client-server` shows the server wiring five times: `server.js`,
`server.py`, `server.php`, `server.go` and `server.rs`. On Node,
`createEnvironment` scans `components/` with `node:fs`; a tree that
holds classes the scan should not read (classes on another base) passes
its own `fs` (`readdirSync`, `readFileSync`, `statSync`, `join`).

## Tags that aren't components

A tag can be a CSS scope, or a place to hang a listener or two on HTML
that never changes. No template, no BaseComponent: the markup is written
where it is used, between the tags, and the server passes the tag
through as it is. The rule, and its one exception (`hardness-scale`, no
state, but a template that builds markup from its attributes), is in
`zeldman.md`, "Not everything is a component"; a template that only
prints values is a partial ("Partials", above).

```html
<site-footer variant="citation">…</site-footer>
```
```css
site-footer[variant="citation"] .acknowledgement { … }
```

The minerals detail page is one. `shared/pages/detail.html` writes the
whole entry between `<mineral-detail>` and `</mineral-detail>`, and the
class is the copy button:

```js
// mineral-detail.js — enhances the page, never re-renders
class MineralDetail extends HTMLElement {
    connectedCallback() {
        this.abort = new AbortController();
        this.addEventListener('click', …, { signal: this.abort.signal });
    }
    disconnectedCallback() { this.abort.abort(); }
}
```

If there's no state and nothing to build from the attributes, there is
nothing to render; don't pretend.

---

## Clean up

```js
onDisconnected() {
    clearTimeout(this.timer);
    this.chart?.destroy();
}
```

Listeners on `this.signal` are already handled. Don't override
`disconnectedCallback`; the hook exists so you can't forget `super`.
By the time it runs, `this.signal` is a new one, live, for the next
connect: a fetch started here with it is not aborted by the disconnect.

---

## Events in use

The two examples' and the five controls' cross-component vocabulary. Emit
from the child; listen on the parent. A control's detail always carries its
`name`, so one listener can serve several.

| event | from | detail |
|---|---|---|
| `search-input` | mineral-search | `{ value }` |
| `part-change` | part-picker | `{ slot, value }` |
| `color-change` | color-palette | `{ color }` |
| `creature-load` / `creature-remove` | saved-list | `{ id }` |
| `change` | CreatureStore (a service, not a component) | — |
| `combo-input` | combo-box | `{ name, value }` — the text changed, by typing or a pick |
| `combo-select` | combo-box | `{ name, value, option }` |
| `drop-down-change` | drop-down | `{ name, value, option }` |
| `range-change` | range-slider | `{ name, low, high }` |
| `multi-select-change` | multi-select | `{ name, values }` |
| `chip-list-input` / `chip-list-change` | chip-list | `{ name, value }` / `{ name, chips }` |

Name events for what happened, not what should happen next:
`search-input`, not `filter-list`.

---

## Checklist for a new component

- [ ] a template — content only, no wrapper tag
- [ ] a stylesheet — `<tag> .class` selectors, no prefix
- [ ] a class with `template = '…'`, `customElements.define`, imported in `main.js`
- [ ] the closing tag written wherever it's used; never `<x-y />`
- [ ] `static props` for every attribute it reads, each with its default; own state in `state = { … }`
- [ ] One listener in `connectedCallback`, `{ signal: this.signal }`, then `super`
- [ ] All DOM changes via `setState`
- [ ] `id` if the parent loops over it
- [ ] a `data-content` element if it takes content, the box; never rendered into; kept, or unmarked after a fetch with the same `id`; an `id` on it if a `{% if %}` prints an element of the same tag before it
- [ ] Booleans as `{{ 'attr' if cond }}`
