# Zeldman

Web components give you a class and lifecycle callbacks, but no way to
render a template out of the box. Thankfully I was able to shoehorn in
Nunjucks for the task.

The result: web components whose markup lives in an HTML template, not in JavaScript.
A component's template is a file of HTML, with a little Jinja for loops and
conditions, that says what the component is and what it contains; anyone
who reads HTML can read it. The class holds state and behavior and writes
no markup: no HTML strings, no DOM manipulation. When state changes, the
template renders again and the DOM is morphed to match. The same template
renders on the server, so the page arrives finished.

The Zeldman Pattern is one template file per component as the single
source of truth. The server renders the template inside the
custom element's tag, with the tag's attributes as variables; the element's
class renders the same file in the browser, from its state. A component is
three files, `.html`, `.css` and `.js`. Attributes go in, events come out,
and state drives the DOM.

In the box: `BaseComponent`, which renders the
template and, when state changes, morphs the DOM to match; a server adapter
that renders the template inside the tag, for Node, Python, PHP, Go and
Rust; and
two vendored libraries, Nunjucks and idiomorph. Copy `lib/` into a project
and you have all of it. There is no build step.

With a server, the page arrives as finished HTML and the classes enhance it.
Without one, a static HTML file with a tag in it is a complete application,
rendered in the browser from the same templates.

Named for Jeffrey Zeldman, whose *Designing with Web Standards* set out the
separation of structure, presentation and behavior that this pattern keeps.
Not affiliated with or endorsed by him.

Developed in part for [IBIS](https://www.anbg.gov.au/ibis/ibis.html), the
Australian National Botanic Gardens' Integrated Botanical Information
System, on the rebuild of [biodiversity.org.au](https://biodiversity.org.au),
Flora of Australia and eleven sister sites on one codebase, where the
pattern took its shape.

## Drop it in an `index.html` and it just works

```html
<script src="lib/vendor/nunjucks.min.js"></script>
<script src="lib/vendor/idiomorph.min.js"></script>
<script type="module" src="client/main.js"></script>

<creature-builder></creature-builder>
```

That is a complete application. `examples/client-only` is this file, five
components and whatever serves files; there is no server, no build and no
install. The browser does the rest.

## A component

`components/hardness-scale.html` — what it looks like

```html
<span class="cells" aria-hidden="true">
  {% for i in range(1, 11) %}
  <span class="cell{% if i <= ((value + 0.5) | int) %} on{% endif %}"></span>
  {% endfor %}
</span>
<span class="visually-hidden">Hardness </span>
<span class="label" data-content>{{ content | safe }}</span>
<span class="visually-hidden"> of 10</span>
```

`components/hardness-scale.css` — how it's styled

```css
hardness-scale { display: inline-flex; align-items: center; gap: 0.4rem; }
hardness-scale .cell { width: 5px; height: 12px; background: #e2ded2; }
hardness-scale .cell.on { background: #7a6f52; }
hardness-scale .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
```

`components/hardness-scale.js` — what it does

```js
import BaseComponent from '../client/lib/BaseComponent.js';

class HardnessScale extends BaseComponent {
    template = 'components/hardness-scale.html';
    static props = { value: 0 };
}

customElements.define('hardness-scale', HardnessScale);
```

Use it by writing the tag, in a page or inside another component's template:

```html
<hardness-scale value="{{ mineral.hardness }}">{{ mineral.hardnessLabel }}</hardness-scale>
```

## What happens

1. **The server** finds the tag, renders `hardness-scale.html` inside it with
   the attributes as variables and the HTML between the tags as `content`,
   and sends HTML. The page is complete before any script runs; it holds
   the elements the author wrote and nothing else, and crawlers and screen
   readers get the same page.
2. **The browser** upgrades the tag to the class, which reads the same
   attributes into `this.state`, renders the same template and morphs
   the element to match; what is between the tags stays in its box.
   Nothing changes, because the server already rendered it, and nothing
   is added to the tag: a default stays in the class. A test measures it
   (`docs/zeldman.md`, "The contract between server and browser"), and
   `document.querySelector('hardness-scale').render()` in the console
   shows the same.
3. **From then on** `setState()` re-renders and morphs. Only what changed is
   touched, so focus, scroll position and half-typed input survive.

## Without a server

Skip step 1. The tag arrives with what the author wrote and the class
renders it on connect, from its attributes and its content; from there
everything is the same. The page needs
JavaScript in this mode, and there is nothing to deploy but files.
`examples/client-only` is one `<creature-builder>` tag in an `index.html`,
served by anything that serves files.

## Run it

```sh
git clone https://github.com/erikswedberg/zeldman && cd zeldman && npm install
```

```sh
node examples/client-server/server.js        # http://localhost:3100 — minerals, Node
```
```sh
pip install -r examples/client-server/requirements.txt
python3 examples/client-server/server.py     # the same site, same files — Python
```
```sh
cd examples/client-server && composer install && cd ../..
php -S localhost:3100 examples/client-server/server.php   # — PHP
```
```sh
cd examples/client-server && go run .        # — Go
```
```sh
cd examples/client-server && cargo run       # — Rust
```
```sh
python3 -m http.server 8811                  # http://localhost:8811/examples/client-only/ — no server at all
                                             # and http://localhost:8811/docs/ — the tour, with live demos
```
```sh
npm test                                     # the suite, including byte parity between Node and every other server you have installed
```

The minerals example is a small site in the shape of a real one: a
server-rendered list, a typeahead, rows that fetch detail when expanded, a
plain detail page. Node, Python, PHP, Go and Rust render its `components/`,
`shared/pages/` and `server/minerals.json` to the same bytes; a test checks
that. The client-only example is a character builder: one empty tag in an
HTML file.

## Start a project

```sh
mkdir my-app && cd my-app && npm init -y
npm install fastify @fastify/static nunjucks github:erikswedberg/zeldman
mkdir -p components client/lib shared/pages server
cp -r node_modules/zeldman/lib/. client/lib/          # BaseComponent, nunjucks, idiomorph
```

Then four files, each a few lines: `server.js` (the minerals `server.js`,
minus the minerals: `import { createEnvironment } from 'zeldman/server'`),
`client/main.js` (imports `./template-env.js` and your components),
`client/template-env.js` (sets `BaseComponent.env`; copy the minerals one),
and `shared/pages/base.html` (links the three scripts and your stylesheets).
Your first component goes in `components/`; `AGENTS.md` has the shape.
`docs/zeldman.md` says why the layout is `components/`, `client/`,
`server/`, `shared/`.

## The rules

1. **One template, content only.** The caller writes the tag; the template
   is what goes inside it. The same file renders on the server and in the
   browser.
2. **Attributes in, events out.** `static props` declares every attribute a
   component reads, with its default; `emit()` raises an event for its
   parent. What is written between the tags is content, held by the
   one element the template marks `data-content` and never touches;
   whoever writes the tag owns it.
3. **Booleans are present or absent.** `{{ 'open' if open }}`. HTML treats
   any present attribute as true, so `open="false"` is open.
4. **State changes the DOM.** `setState()` is the only thing that changes
   what is on screen.
5. **One delegated listener**, added in `connectedCallback` with
   `{ signal: this.signal }`, then `super.connectedCallback()`. It is removed
   with the element.
6. **Parents render child tags; children render child contents.** A
   parent's render keeps a child's attributes and its box in step with
   what it printed. Repeated children get an `id`, so reorders move
   elements instead of rewriting them.
7. **Styles hang off the tag.** `hardness-scale .cell { }`, in the light
   DOM, so the cascade works as designed.
8. **A component has state, or builds markup from its tag.**
   `hardness-scale` has no state and draws its cells from `value`; a
   template that only prints values is a partial. A tag with neither can
   scope CSS, or hold a listener on HTML that never changes, with a plain
   class or none.
9. **Templates are in the portable dialect**, the subset of Jinja that
   Nunjucks and Jinja2 render identically, so any server can render them.
10. **No build step.** The files on disk are the files the browser loads;
    bundle them if a project wants to.

## What's in the box

```
lib/BaseComponent.js        the client class: props, content, state, render  312 lines, 4.9 KB gzipped
lib/TemplateLoader.js       the browser's loader: a template by its path, HTTP-cached  27 lines
lib/filters.js              the `choices` filter and the tag grammar the expander shares  140 lines
lib/vendor/nunjucks.min.js  templates, Jinja dialect, Mozilla, BSD-2        26 KB gzipped
lib/vendor/idiomorph.min.js DOM morphing, Big Sky Software, 0BSD             4 KB gzipped
server/node/zeldman.js      Node: the scan, the static-props reader, render  170 lines
server/node/expand.js       the expander, one pass over the rendered HTML   193 lines
server/python/zeldman.py    Python, Jinja2: the same, expander included     571 lines, one file
server/php/zeldman.php      PHP, Twig 3: the same, expander included, plus a rewriter for elif and inline if  1,123 lines, one file
server/go/                  Go, gonja: the same, expander included, plus shims for three hooks gonja lacks  1,645 lines
server/rust/                Rust, minijinja: the same, expander included, plus three filters minijinja lacks  947 lines, one file
components/                 five form controls: combo-box, drop-down, range-slider, multi-select, chip-list
examples/client-server/     minerals — Node, Python, PHP, Go or Rust server, same files
examples/client-only/       creature builder — no server
docs/index.html             the tour: eleven ideas, live demos, no build
docs/components/            a page per control, generated from the control itself
docs/                       the contract, the lifecycle, the how-to, the dialect, why, the roadmap
test/                       BaseComponent contract, loader goldens, parity across the five servers, the controls
bin/                        lint-templates: the dialect mistakes that fail silently; render-component-pages
AGENTS.md                   copy into your project so a coding agent builds in the pattern
```

The browser side is installed by copying `lib/` into your project, or by
serving it from here.

## Components

Five form controls in `components/`, each three files, each a tag you
write: `combo-box` (a text box with suggestions), `drop-down` (one choice
from a list, behind a button), `range-slider` (a low and a high on one
stepped track), `multi-select` (several choices, checkboxes behind a
button), `chip-list` (picks collected as chips, fed by a combo-box). The
three list controls take their options as `<option>` content, as a
`<select>` does, and keep them as written in a hidden `<datalist>`. Each
works by keyboard and screen reader, and has a real form field
underneath, a native `<select>` for drop-down and multi-select rendered
beside the datalist from the same options, so it works before the script
arrives. A control's `name` is its form field's and prefixes every id
inside it, the datalist's included, so two controls on a page do not
share one.

Each has a page under `docs/components/`, generated from the component and
its `*.fixtures.json` by `npm run components`: the control working, its
attributes and events as the class declares them, every example's tag and
the HTML it renders. A test fails if the pages drift.

## Any server

The template language is the Jinja family, with native engines in
JavaScript (Nunjucks), Python (Jinja2), PHP (Twig), Go (gonja), Rust
(minijinja) and Java (Jinjava). An adapter does three things: find the
component templates, render the page, render each component's template
inside its tag, from the tag alone, each attribute typed by the class's
`static props`. Five ship, their sizes in "What's in the box" above;
each is the Node adapter's expander and reader ported function for
function, plus what its engine lacks (PHP rewrites `elif` and inline
`if` into what Twig has; gonja lacks three hooks, and its README names
them; minijinja lacks no hook, only three filters). `npm test` checks
all five byte for byte on the example's pages and on the attribute
forms, and `sh test/support/fuzz/run.sh` holds their expanders to
Node's on generated HTML, ten thousand cases at a time. Each adapter's
README says what it shims and why; `docs/portable-templates.md` is the
dialect they all render.

## Limits

- **Client-only components arrive unrendered.** Without a server they are
  JavaScript web components, and the page needs JavaScript. The two
  examples show both modes.
- **Nunjucks is the largest thing shipped** and is effectively frozen
  at 3.2.4; the dialect it implements has six engines.
  Its browser loader fetches templates synchronously, by path, and the
  HTTP cache keeps them.

## Read next

- [`docs/zeldman.md`](docs/zeldman.md) — the contract, one page
- [`docs/lifecycle.md`](docs/lifecycle.md) — four components followed from the server to every later render
- [`docs/howto.md`](docs/howto.md) — recipes: props, events, lists, fetching, content, a library's DOM
- [`docs/portable-templates.md`](docs/portable-templates.md) — the dialect
- [`docs/why.md`](docs/why.md) — what the browser provides and the pattern adds, the neighbors, when not to use it
- [`docs/lineage.md`](docs/lineage.md) — 2005 to now
- [`docs/roadmap.md`](docs/roadmap.md) — known defects and what's next
- [`docs/components/`](docs/components/index.html) — the five controls, a page each
- [`AGENTS.md`](AGENTS.md) — the rules, for coding agents
- The server adapters: [Python](server/python/README.md), [PHP](server/php/README.md), [Go](server/go/README.md), [Rust](server/rust/README.md)
- The examples: [minerals](examples/client-server/README.md), [creature builder](examples/client-only/README.md)

## License

MIT. Nunjucks (BSD-2-Clause) and idiomorph (0BSD) are vendored under their
own licenses in `lib/vendor/`.
