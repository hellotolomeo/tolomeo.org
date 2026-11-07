# This project is built with the Zeldman Pattern

Markup, style and behavior are separate here, on disk and in the browser.
A component is an HTML template, a stylesheet and a small class. The server
renders the template inside the tag; the browser renders the same template
when state changes and morphs the DOM to match. Read `docs/zeldman.md`
once; it is the contract. This file is the conventions, in the order you
will need them. They are strict so that generated code comes out
consistent; a person adapting the pattern elsewhere may take what they like.

## Where files go

```
components/   one component = three files side by side; both sides render these
client/       only the browser: main.js, template-env.js, lib/ (BaseComponent, TemplateLoader, vendor), services/
server/       only the server: the adapter wiring, routes, the data layer
shared/       both, but not components: pages/ (page templates), base.html, base.css, lib/ (pure logic)
```

The path says where code runs. Nothing in `client/` is imported by the
server; nothing in `server/` is served to the browser; `shared/lib/` is for
pure functions both sides call.

## A component is three files, side by side

```
components/thing-name.html    the template: content only, no wrapper tag
components/thing-name.css     selectors start with the tag: thing-name .part { }
components/thing-name.js      class ThingName extends BaseComponent
```

The class declares its template, its attributes with their defaults, and
its own state:

```js
import BaseComponent from '../client/lib/BaseComponent.js';

class ThingName extends BaseComponent {
    template = 'components/thing-name.html';
    static props = { 'item-id': '', count: 0, open: false };
    state = { loading: false };

    connectedCallback() {
        this.addEventListener('click', e => {
            const btn = e.target.closest('[data-action]');
            if (btn?.dataset.action === 'toggle') this.setState({ open: !this.state.open });
        }, { signal: this.signal });
        super.connectedCallback();
    }
}

customElements.define('thing-name', ThingName);
```

Add the import to the page's `main.js`. Add the CSS link to the page.

## Use it by writing the tag

```html
<thing-name
  item-id="{{ item.id }}"
  count="{{ item.count }}"
  {{ 'open' if item.open }}
></thing-name>
```

Always write the closing tag. Never `<thing-name />`; browsers do not
self-close custom elements.

## Rules

1. **Attributes are kebab on the tag, camel in state.** `item-id` → `state.itemId`.
   Every attribute a component reads is in `static props` with its default,
   and the default is the type: `''` string, `0` number, `false` boolean,
   `[]` array, `{}` object, `null` the attribute as written. The server
   reads the same declaration from the class file and types each
   attribute by it, so a default is a literal (a string, a number, `true`,
   `false`, `null`, an array or object of those), never a reference or a
   call: `options: String` stops the server at boot. State the component
   owns goes in the `state` class field. No constructor. A key in `state`
   that is also a prop is overwritten on connect by the attribute's value
   or the prop's default. A default array or object is one object shared
   by every instance until `setState` replaces it; never mutate state in
   place.
2. **Booleans are present or absent.** `{{ 'open' if open }}`. Never
   `open="{{ open }}"`; `open="false"` is still open. Exception: `aria-*`
   attributes are strings: `aria-expanded="{{ 'true' if open else 'false' }}"`.
3. **Three ways in: attributes, content, fetch.** An attribute is on
   the tag because the class reads it, a template condition tests it, a
   parent may change it, or a part the template re-renders prints it.
   Markup that never changes, and a list the template loops, is
   content, written between the tags by whoever writes the tag: the
   page once, a parent's template on every render. The exception is a
   small object a template reads as a whole, as JSON:
   `chips="{{ chips | dump | e }}"`.

   Content lives in the box: the one element the template marks
   `data-content`, with `{{ content | safe }}` as its whole contents
   and nothing else ever rendered into it. Whoever writes the tag owns
   the box: a parent's render keeps a child's attributes and box in step
   with what it printed, and a tag printed bare means an empty box. What
   a reader changes inside content a parent prints lives in state. The
   box's own attributes follow state (`mineral-row`'s head button, its
   `aria-expanded`). Hide empty content with a class, never
   `{% if content %}` around the box. `data-content` is reserved for it.

   A fetch renders after the box (`mineral-row`: the record below the
   head), or the template stops marking the box and renders the rows in
   the same element with the same `id` (`mineral-list`: `<ol
   id="mineral-list-content">`). Never both branches, or a loading or
   error line, inside a marked box; once unmarked, never marked again.

   A list control takes its options as `<option>`s between its tags
   and reads them from its box on every render: copy
   `components/drop-down` (`docs/howto.md`, "Hand a list as content").
   `o.label` is HTML: print it with `| safe`, never inside an
   attribute. A bare `data-*` is `''`: test `o.data.x is defined`, or
   compare to a string.
4. **Change state, never the DOM.** `this.setState({ … })` is the only way the
   page changes. No `querySelector(…).textContent =`, no `classList.add`.
   Put the condition in the template: `<div class="panel{% if open %} open{% endif %}">`.
5. **One delegated listener** per component, in `connectedCallback`, with
   `{ signal: this.signal }`, then `super.connectedCallback()`. Route on
   `data-action`. Never add listeners in `afterRender` (runs every render) or
   on elements inside the template (they get morphed away).
6. **Events up, attributes down.** Child: `this.emit('thing-selected', { id })`.
   Parent: `this.addEventListener('thing-selected', e => this.setState(…), { signal: this.signal })`
   on itself, because events bubble. A parent passes data to a child only through the
   child's tag in its own template: its attributes, and what it prints
   between the tags, the child's box (rule 3). Never call a method on a child;
   never read a child's DOM. What no component owns lives in a module in
   `services/` that raises an event when it changes, and a component
   sets its own state from it (`CreatureStore` in `examples/client-only`
   keeps the saved creatures and raises `change`).
   - List what a component emits in `static events = ['thing-selected']`,
     a comment beside each naming its detail: `// { id } when a row is
     picked`. The outgoing contract sits next to `static props`; the pages
     under `docs/components/` are printed from both.
7. **Repeated children get an `id`**, unique across the page:
   `<thing-row id="thing-row-{{ row.id }}" row-id="{{ row.id }}"></thing-row>`.
   The morph matches siblings by `id` first and by tag name after, so a
   plain element repeated from a list that reorders gets one too, and so
   does a child's wrapper when a `{% if %}` prints an element of the same
   tag before it (or print that element always). So does a
   `data-content` element a template stops marking after a fetch, the
   same `id` marked and unmarked: the morph keeps the element and what
   it holds in place instead of moving every row into a new one.
8. **Derive, don't store.** Values computed from state go in
   `getTemplateContext()` (a filtered list, a total). Don't write one that
   copies state fields; state is already the template's context.
9. **Fetch in a method, with the signal.** `fetch(url, { signal: this.signal })`;
   `setState({ loading: true })` before, `setState({ loading: false, data })`
   after; ignore `AbortError`. The template renders `loading`, `error`, data.
10. **Clean up in `onDisconnected()`**, not `disconnectedCallback`. Signal
    listeners are already handled. `this.abort` and `this.connected` are
    the base's: use `this.signal`, never a controller of your own in its
    place, and declare no field named `connected`.
11. **If there's no state, it isn't a component, with one exception.**
    A tag with no state is still a component when its template builds
    markup from its attributes (a loop, arithmetic) and is written by tag
    in more than one place, as `hardness-scale` is; its attributes then
    cross the wire beside their rendering. A template that prints values,
    or tests them, is a partial, included where it is used. Any other tag
    with no state has no template: write its markup where it is used, in
    the page, between its tags. A tag that only scopes CSS needs no class.
    A tag that only hangs one listener on that markup is a plain `class
    extends HTMLElement` with the listener and nothing else; the server
    passes the tag through as written.
12. **Modals are `popover` elements** with a static `id`; triggers use
    `popovertarget`. The browser owns the top layer, Escape, and focus return.

## What a template can see

On both sides a component template's variables are the tag's attributes
(kebab turned camel) and the engine's globals, and on the server
`content`, the HTML between the tags (in the browser the content is the
nodes in the box, and `content` is undefined); nothing of the page the
tag sits in, on either side.
In the browser the class's own `state` and `getTemplateContext()` are
variables too; they are undefined on the server, so each is false or
empty at the first render and the template renders the same bytes
without it: guard it (`{% if open %}…{% endif %}` with `open` false at
first render, `{% if fetched %}` around rows the server never has) or
give the template the class's default (`{% set cursor = cursor |
default(-1) %}`, for a state field only). `x in undefined` throws. Both
sides type an attribute by `static props`: a boolean by presence, a
number by `Number()`, an array or object by JSON, a string as written,
and an absent attribute is the prop's default on both sides, so a prop
needs no `| default`. An attribute the class does not declare is coerced
by shape on the server (`"3"` is a number) and is not state in the
browser: declare what the template reads. `content` is not a prop and
not a state field: the server hands the template the string, the browser
the box (rule 3).

## Templates

- Nunjucks, in the **portable dialect** (`docs/portable-templates.md`) so the
  same file renders under Jinja2 and Twig: `| length` not `.length`; quoted
  dict keys; `==` not `===`; `not x` not `x == null`; `{% if list | length %}`
  not `{% if list %}`; `~` to concatenate; `(x + 0.5) | int` not `| round`;
  `{#- -#}` comments; never print a list; `or`/`and` only in conditions.
- Display HTML from data with `| safe`; everything else autoescapes.
- `trimBlocks` and `lstripBlocks` are on: a `{% %}` tag alone on a line
  leaves nothing behind, not even its newline. Put the spaces you want
  *inside* the branches: `{% if n %} of {{ n }}{% endif %}`.
- **Three or more attributes, or one whose presence is conditional: one
  per line**, each two spaces past the indent of the line the tag starts
  on, then `>` (or `/>`) first on a line at that indent; what the tag
  wraps starts right after it on that line, as it would on one line
  (`>{{ label }}</label>`, `>{{ content | safe }}</ol>`, `>{% for %}…`),
  and a child on its own line stays on its own line, as `<thing-name>` is
  written above. A conditional attribute is one line, its space inside
  the branch, `{% if x %} attr="{{ x }}"{% endif %}`, or
  `{{ 'flag' if x }}`; a condition inside a value
  (`class="panel{% if open %} open{% endif %}"`) is not one. One
  condition over several attributes: `{% if x %}` and `{% endif %}` each
  alone on a line around them. Fewer than three and none conditional: one
  line. Stays on one line: `{{ content | safe }}` as the box's whole
  contents, the spaces inside text and inside branches, a `{#- -#}`
  comment.
- Partials: `{% include 'components/thing-name/part.html' %}` from a folder
  named for the component. A partial a page and a component share lives in
  the folder of the component that owns the shape, as
  `mineral-list/row.html` does.

## Styles

- One stylesheet per component. Every selector starts with the tag:
  `thing-name .panel { }`. No prefixes on child classes, no utility classes in
  the markup, no inline styles, no style manipulation from JS.
- State-driven styling hangs off a class the template toggles, or off the tag's
  own attributes: `thing-name[open] .panel { }`. The tag's attributes are
  the parent's to write; a state the component owns goes on an element
  its template renders (`drop-down` puts `hidden` on its menu), since a
  template does not write its own tag.
- Style the un-upgraded state if it matters: `thing-name:not(:defined) .panel { display: none }`.

## Server

- Node: `createEnvironment(nunjucks, { templates: [root], components })` from
  `server/node/zeldman.js`, then `env.render('shared/pages/x.html', ctx)`. Python:
  `make_env(root, components)` from `server/python/zeldman.py`. The server
  renders the page as a plain template, then renders each component's
  template inside its tag from the tag alone, attributes and `content`
  (`server/node/expand.js`); the browser's first render then changes
  nothing.
- A page that hands a component a list writes it between the tags, with
  the row's include, as `shared/pages/list.html` does for `<mineral-list>`.
- Shape data in the server's data layer, not in templates. Templates consume
  flat fields: `{{ mineral.hardnessLabel }}`, not `{{ m.props.hardness.label }}`.
- Serve `client/`, `components/` and `shared/` statically (never `server/`),
  with `Cache-Control: no-cache` and an ETag or Last-Modified. The browser
  fetches templates from `components/` by the path in `template =`, with
  no query string, keeps them, and asks before reusing one; an unchanged
  template is a 304 and an edited one shows on the next view. The five
  example servers do this.

## Don't

- Don't add a build step or a bundler unless the project already has one;
  nothing here needs one.
- Don't use shadow DOM. Use light DOM; the cascade is the styling model.
- Don't put behavior in markup (`onclick=`) or style in markup
  (`style=""`, utility-class strings). Each goes in its own file.
- Don't duplicate a template in JS. If the HTML lives in two places, one is wrong.
- Don't `innerHTML =`. If you are writing `innerHTML =`, you are doing it
  wrong; change state and let the morph apply it.
- Don't prefix identifiers with underscores or leave comments in CSS.

## Checklist for a new component

- [ ] `components/<tag>.html` — content only, portable dialect
- [ ] `components/<tag>.css` — `<tag> .class` selectors, linked from the page
- [ ] `components/<tag>.js` — `template = '…'`, `static props` with defaults, own state in `state = { … }`, `customElements.define`, imported in `main.js`
- [ ] one listener in `connectedCallback`, `{ signal: this.signal }`, then `super`
- [ ] all DOM changes via `setState`
- [ ] `id` if a parent loops over it; a `data-content` element if it takes content, the box, never rendered into, kept or unmarked after a fetch with the same `id`, an `id` on it if a `{% if %}` prints an element of the same tag before it
- [ ] booleans as `{{ 'attr' if cond }}`; closing tag always written
- [ ] server renders it and `el.render()` in the console changes nothing
