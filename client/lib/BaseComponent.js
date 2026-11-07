/**
 * A component is a custom element whose contents are rendered from its
 * template with its state as the context. Its inputs are its tag: the
 * attributes, and what is between the tags.
 *
 *   template -> `template = 'components/x.html'`; the server reads this
 *             line too, so one declaration serves server and browser
 *   props    -> attributes, declared with their defaults, which carry the
 *             type: `static props = { heading: '', count: 0, open: false }`;
 *             each lands in state under its camelCase key (`has-more` ->
 *             hasMore) and follows the attribute when it changes
 *   content  -> the nodes between the tags. They live in the box: the one
 *             element the template marks `data-content` (and prints
 *             `{{ content | safe }}` in, which the server fills; the browser
 *             has no content string, `content` is not a prop, and the box is
 *             printed empty; a class that still declares `content: ''` gets
 *             an ordinary string prop, '' unless the tag carries the
 *             attribute, printed into a box the morph never enters). The first
 *             render of a tag nothing has rendered moves what is between the
 *             tags into the box; a tag the server rendered already holds its
 *             box, kept as it is. The template never touches the box: the
 *             morph syncs its attributes and does not enter it, and when the
 *             template prints the box as another element, what it holds
 *             follows. Whoever writes the tag owns the box: the page wrote
 *             it once; a parent's template writes it on every render, and the
 *             parent's morph keeps the box in step with what the template
 *             printed, as it keeps the attributes (below). `this.box` is the
 *             element, or the tag itself before the first render, for a class
 *             that reads its content as data (a list control's <option>s)
 *   state    -> `this.state`, a class field in the subclass; `setState()` re-renders
 *   render   -> nunjucks -> idiomorph morph of this element's children; a
 *             failed render is a console.error naming tag, template and keys
 *   events   -> `emit(name, detail)`; bubbles and composed;
 *             `addEventListener(..., { signal: this.signal })` for listeners
 *             that should die with the element; `this.abort`, the controller
 *             behind it, is this class's: a subclass uses the signal and
 *             never replaces the controller, which a disconnect aborts and
 *             renews, so the signal is live on every connect; `connected`,
 *             `rendered`, `box` and `queueSync` are this class's too
 *
 * Parents render child tags; children render their own contents. When a
 * parent re-renders, the morph reaches each child's tag and goes no further
 * in: the child's attributes are synced (which runs its attributeChangedCallback),
 * and, if the child has rendered and has a box, what the parent printed
 * between the tags is morphed into that box, node to node (a tag printed bare
 * empties it); a box that changed has the child re-render once, in the same
 * microtask as a props sync. A child that has not rendered (its class not yet
 * defined, or a plain element) is left as it is, whatever the parent printed:
 * it shows what it holds when it upgrades (the server's rendering, or the
 * parent's first print) and the parent's next render brings it in step. That
 * is the one place this file assumes the parent's first print was the
 * server's: entering an unrendered tag would cost the zero-mutation first
 * render whenever a parent's class defines before its children's. The rest of
 * the child's subtree is its own.
 */
export default class BaseComponent extends HTMLElement {
    static props = {};
    // The Nunjucks Environment every component renders with. Set once at boot.
    static env = null;

    static get observedAttributes() {
        return Object.keys(this.props);
    }

    constructor() {
        super();
        this.state = {};
        this.connected = false;
        // False until the first render that built this element's contents.
        this.rendered = false;
        this.propsSyncQueued = false;
        this.boxChanged = false;
        this.parsed = new Map();
        this.abort = new AbortController();
    }

    connectedCallback() {
        this.connected = true;
        const props = this.getPropsFromAttributes();
        Object.assign(this.state, props, this.onPropsChanged(props));
        this.render();
        this.onConnected();
    }

    disconnectedCallback() {
        this.connected = false;
        this.abort.abort();
        // Renewed here, not on the next connect: a subclass adds its listeners with
        // this.signal before super.connectedCallback(), and an aborted signal adds nothing.
        this.abort = new AbortController();
        this.onDisconnected();
    }

    // Present so moveBefore() moves the element without disconnect/connect: a
    // keyed child moved by a parent's re-render keeps its DOM state untouched.
    connectedMoveCallback() {}

    // Listeners added with { signal: this.signal } are removed on disconnect.
    get signal() {
        return this.abort.signal;
    }

    // The box: the data-content element this element's template printed, which
    // holds the content, or the element itself before the first render, when
    // what is between the tags is the content as written. Null for a rendered
    // template that prints no box.
    get box() {
        return contentBox(this, this) ?? (this.rendered ? null : this);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal) this.queueSync();
    }

    // One re-render per microtask for what a parent's render hands this
    // element: its attributes, and its box when the parent printed content.
    queueSync() {
        if (!this.connected || this.propsSyncQueued) return;
        this.propsSyncQueued = true;
        queueMicrotask(() => {
            this.propsSyncQueued = false;
            this.syncPropsFromAttributes();
        });
    }

    getPropsFromAttributes() {
        const props = {};
        for (const [name, fallback] of Object.entries(this.constructor.props)) {
            // An attribute whose text has not changed keeps the value it parsed to, so
            // a JSON prop stays one object across a sync and compares unchanged.
            const text = this.getAttribute(name);
            const last = this.parsed.get(name);
            const value = text === null ? fallback : last?.text === text ? last.value : parseAttribute(text, fallback);
            if (text !== null) this.parsed.set(name, { text, value });
            props[kebabToCamel(name)] = value;
        }
        return props;
    }

    syncPropsFromAttributes() {
        const props = this.getPropsFromAttributes();
        const changed = Object.entries(props).some(([key, val]) => this.state[key] !== val);
        if (changed) Object.assign(this.state, props, this.onPropsChanged(props));
        if (!changed && !this.boxChanged) return;
        this.boxChanged = false;
        this.render();
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    render() {
        const env = BaseComponent.env;
        if (!env || !this.template) return;
        const next = document.createElement('template');
        const context = { ...this.state, ...this.getTemplateContext() };
        // A template that fails to render is one console.error naming the tag, the
        // template, what the engine said and the keys given; the DOM stays as it was.
        try { next.innerHTML = env.render(this.template, context); }
        catch (err) { return console.error(`<${this.localName}> (${this.template}): ${said(err)}\nstate keys: ${Object.keys(context).join(', ')}`, err); }
        const box = contentBox(next.content, null);
        const was = contentBox(this, this);
        // The first render of a tag nothing has rendered: what is between the tags is
        // the content, and it goes into the box the template prints.
        let held = box && !was && !this.rendered ? hold(this) : null;
        held = morph(this, next.content, box, was) ?? held;
        // The template prints the box as another element: what it held follows.
        if (box && was && !held && !this.contains(was)) held = hold(was);
        if (held) contentBox(this, this)?.append(held);
        this.rendered = true;
        this.boxChanged = false;
        this.afterRender();
    }

    emit(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }

    // Hooks, all optional.

    /** Extra state derived from incoming props; runs on connect and on every attribute change. @returns {object} */
    onPropsChanged(props) { return {}; }
    /** Values computed for the template on every render, in addition to state. Browser only. @returns {object} */
    getTemplateContext() { return {}; }
    /** After every render; for imperative libraries (charts), never for listeners. What it adds inside the box stays there to the next render, so make it idempotent. */
    afterRender() {}
    /** After the first render on connect. */
    onConnected() {}
    /** On removal; signal listeners are already gone. */
    onDisconnected() {}
}

// An attribute's value, typed by its default: presence for a boolean; parsed,
// or the default, for a number, array or object; the string for anything else.
function parseAttribute(value, fallback) {
    if (typeof fallback === 'boolean') return true;
    if (typeof fallback === 'number') return Number.isFinite(Number(value)) ? Number(value) : fallback;
    if (typeof fallback !== 'object' || fallback === null) return value;
    try { return JSON.parse(value); } catch { return fallback; }
}

// What the engine said, as one line, as server/node/expand.js says it: Nunjucks
// writes a `(path)` line per template level, the first with the line and column
// when it has them, then what went wrong; the path lines and a bare `Error:` go.
const PATH_LINE = /^(?:Template render error: )?\(.*\)( \[Line \d+(?:, Column \d+)?\])?$/;
function said(err) {
    const lines = String(err?.message ?? err).split('\n').map(line => line.trim());
    return (lines.find(line => !PATH_LINE.test(line)) ?? lines[0]).replace(/^Error: /, '') + (lines[0].match(PATH_LINE)?.[1] ?? '');
}

// The [data-content] element the owner's template printed, under root: the first
// with no component between them. A rendering not yet in the page has owner null.
function contentBox(root, owner) {
    for (const box of root.querySelectorAll('[data-content]')) {
        let el = box.parentElement;
        while (el && !isComponent(el)) el = el.parentElement;
        if (el === owner) return box;
    }
}

function isComponent(el) {
    return el.nodeType === 1 && el.localName.includes('-');
}

// The morph of what a template printed into the element that owns it. Two
// kinds of element are boundaries. A child component's tag: its attributes are
// synced, and what the template printed between the tags is handed to the
// child's box once the morph is done (a tag inside that box is the child's
// business then, handed in turn); the rest of its subtree is its own. The
// owner's box, `was`, matched to the one the template printed, `box`: its
// attributes are synced and it is not entered. Matched to anything else, what it
// holds is taken out before the morph enters it, and returned, to go into the
// box the template printed. A box on one side only is an ordinary element to
// the morph, so a template may stop marking it, the same element and id, and
// render rows into it. Returns the held nodes, or null.
function morph(el, content, box, was) {
    const handed = [];
    let held = null;
    Idiomorph.morph(el, content, {
        morphStyle: 'innerHTML',
        callbacks: {
            beforeNodeMorphed: (oldEl, newEl) => {
                if (oldEl === el || (!isComponent(oldEl) && oldEl !== was)) return true;
                if (isComponent(oldEl)) {
                    syncAttributes(oldEl, newEl);
                    if (oldEl instanceof BaseComponent && oldEl.rendered) handed.push([oldEl, newEl]);
                    return false;
                }
                if (newEl === box) {
                    syncAttributes(oldEl, newEl);
                    return false;
                }
                if (box) held = hold(oldEl);
                return true;
            },
        },
    });
    for (const [child, printed] of handed) handOver(child, printed);
    return held;
}

// What a parent's template printed between a child's tags, morphed into the
// child's box as the tag's attributes are synced: node to node, so a `<details>`
// the reader opened stays open while the parent prints it open, and what
// the template stops printing goes; what the reader typed into an input
// there goes too, on every print, as it does in any markup a template prints,
// so there is no print after which it survives. Printed bare, the box is
// emptied. The child re-renders once, with its attributes, in the next
// microtask, when the morph changed a node in the box: added, removed, moved,
// an attribute or text set (a MutationObserver sees all of these; idiomorph's
// callbacks miss a keyed move). A box the morph found in step costs the child
// nothing. A child that has rendered and has no box takes no content.
function handOver(child, printed) {
    const box = contentBox(child, child);
    if (!box) return;
    let changed;
    if (printed.hasChildNodes()) {
        const watch = new MutationObserver(() => {});
        watch.observe(box, { subtree: true, childList: true, attributes: true, characterData: true });
        morph(box, printed.childNodes, null, null);
        changed = watch.takeRecords().length > 0;
        watch.disconnect();
    } else {
        changed = box.hasChildNodes();
        box.replaceChildren();
    }
    if (!changed) return;
    child.boxChanged = true;
    child.queueSync();
}

// The element's child nodes, moved out into a fragment.
function hold(el) {
    const held = document.createDocumentFragment();
    held.append(...el.childNodes);
    return held;
}

function syncAttributes(oldEl, newEl) {
    for (const { name, value } of newEl.attributes) {
        if (oldEl.getAttribute(name) !== value) oldEl.setAttribute(name, value);
    }
    for (const { name } of [...oldEl.attributes]) {
        if (!newEl.hasAttribute(name)) oldEl.removeAttribute(name);
    }
}

function kebabToCamel(name) {
    return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
