/**
 * The expander: one pass over rendered HTML that renders each component's
 * template inside its tag.
 *
 * The page's engine never hears of components; it renders
 * `<x-y a="{{ b }}"><p>…</p></x-y>` as the text it is. Then this walks the
 * result once with a small tokenizer. At every start tag whose name is in
 * `templates`, it renders that template with the tag as the variables and
 * puts the rendering inside a re-emitted tag:
 *
 *   the attributes   names camelCased; a value typed by the class's declared
 *                    default, as the browser types it (`static props`: a
 *                    boolean is presence, a number is Number(), an array or
 *                    object is JSON, a string is the string as written), and
 *                    a declared attribute the tag omits is its default; a
 *                    name the class does not declare is coerced by shape
 *                    (`"3"` is a number, `"[…]"` is JSON, a bare attribute
 *                    is true)
 *   content          the HTML between the start tag and its end tag, as written
 *
 * The rendering is expanded in turn, so a component may use components.
 * Nothing else is touched: text, other tags, comments and the insides of
 * <script>, <style>, <textarea> and <title> pass through byte for byte.
 *
 * Attribute values are decoded for the common named entities (the table
 * in lib/filters.js, whose `choices` filter reads an `<option>` tag's
 * attributes with the same grammar, in the browser too) and numeric
 * references (one past U+10FFFF is U+FFFD); write other characters as
 * UTF-8 or as numeric references. Tag and attribute names are lowercased
 * over ASCII letters only, and a duplicate attribute is dropped: both as
 * the browser does.
 *
 *   expand(html, { templates, props, render })
 *     templates  Map of tag name -> template path (scanComponents builds one)
 *     props      Map of tag name -> declared props, attribute name ->
 *                { name, fallback } (scanComponents builds this one too;
 *                leave it out and every attribute is coerced by shape)
 *     render     (path, vars) -> string, with whatever template engine
 *
 * A template that fails to render is an Error naming the tag, the path and
 * what the engine said, then the names of the variables the template was
 * given (`<x-row> (components/x-row.html): filter not found: money`, then
 * `vars: mineralId, name, formula, content`), the engine's error as
 * `cause` and the tag as `tag`.
 *
 * No engine, no HTML parser: this file, with the attribute grammar and
 * entity table it shares with lib/filters.js, is the whole mechanism, some
 * two hundred lines, the same in every server language.
 */

import { ATTR, TAG_END, at, lower, unescapeHtml } from '../../lib/filters.js';

export function expand(html, { templates, props = new Map(), render }) {
    let out = '';
    for (let i = 0; i < html.length;) {
        const tag = token(html, i);
        const path = tag.type === 'start' && templates.get(tag.name);
        if (!path) { out += html.slice(i, tag.end); i = tag.end; continue; }
        const close = tag.selfClosing ? { start: tag.end, end: tag.end } : closeOf(html, tag.name, tag.end);
        if (!close) throw new Error(`<${tag.name}>: no closing tag`);
        const declared = props.get(tag.name) ?? new Map();
        // Prototype-less, so an attribute named `constructor` or `__proto__` is a key like any other, as in the DOM.
        const vars = Object.create(null);
        const attrs = [];
        for (const { name, value } of tag.attrs) {
            const prop = declared.get(name);
            const key = prop ? prop.name : kebabToCamel(name);
            if (Object.hasOwn(vars, key)) continue;
            vars[key] = prop ? parseAttribute(value, prop.fallback) : coerce(value);
            attrs.push(value === true ? name : `${name}="${escapeHtml(value)}"`);
        }
        for (const { name, fallback } of declared.values()) if (!Object.hasOwn(vars, name)) vars[name] = fallback;
        vars.content = html.slice(tag.end, close.start);
        const inner = expand(rendered(render, path, vars, tag.name), { templates, props, render });
        out += `<${tag.name}${attrs.map(a => ' ' + a).join('')}>${inner}</${tag.name}>`;
        i = close.end;
    }
    return out;
}

// The template rendered, or an Error naming the tag, the path, what the engine
// said and the variable names (the keys; a value can be a page of HTML), with
// the engine's error as `cause`. Expansion is depth-first, so the innermost tag
// is the one named: an error that already names a tag passes up as it is.
function rendered(render, path, vars, tag) {
    try { return render(path, vars); } catch (err) {
        if (err?.tag) throw err;
        throw Object.assign(new Error(`<${tag}> (${path}): ${said(err)}\nvars: ${Object.keys(vars).join(', ')}`, { cause: err }), { tag });
    }
}

// What the engine said, as one line. Nunjucks writes a `(path)` line per
// template level, the first with the line and column when it has them, then
// what went wrong under the error's name: the path lines go (the message names
// the path), a bare `Error:` goes, the line and column stay.
const PATH_LINE = /^(?:Template render error: )?\(.*\)( \[Line \d+(?:, Column \d+)?\])?$/;
function said(err) {
    const lines = String(err?.message ?? err).split('\n').map(line => line.trim());
    const text = lines.find(line => !PATH_LINE.test(line)) ?? lines[0];
    return text.replace(/^Error: /, '') + (lines[0].match(PATH_LINE)?.[1] ?? '');
}

// The end tag that closes the element whose start tag ended at `from`,
// counting same-named nested elements in between.
function closeOf(html, name, from) {
    for (let depth = 1, i = from; i < html.length;) {
        const tag = token(html, i);
        if (tag.type === 'start' && tag.name === name && !tag.selfClosing) depth++;
        if (tag.type === 'end' && tag.name === name && --depth === 0) return tag;
        i = tag.end;
    }
    return null;
}

const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);
// Whitespace inside a tag is HTML's five characters, [ \t\n\f\r], as a browser
// splits a tag; anything else (U+00A0 included) is part of a name or value.
// ATTR and TAG_END, the rest of the grammar, are lib/filters.js's.
const END_TAG = /<\/([a-zA-Z][^ \t\n\f\r/>]*)[^>]*>/y;
const TAG_NAME = /<([a-zA-Z][^ \t\n\f\r/>]*)/y;

// The token at `i`: text up to the next '<'; a comment or doctype; an end
// tag; a start tag with its attributes (a raw-text element spans through
// its end tag, so nothing inside is a tag); or, when '<' begins none of
// those, that one character as text.
function token(html, i) {
    const text = (end) => ({ type: 'text', start: i, end: end < 0 ? html.length : end });
    if (html[i] !== '<') return text(html.indexOf('<', i));
    if (html.startsWith('<!--', i)) return { type: 'comment', start: i, end: after(html, '-->', i + 4) };
    if (html[i + 1] === '!' || html[i + 1] === '?') return { type: 'comment', start: i, end: after(html, '>', i) };
    let m = at(END_TAG, html, i);
    if (m) return { type: 'end', name: lower(m[1]), start: i, end: END_TAG.lastIndex };
    if (!(m = at(TAG_NAME, html, i))) return text(i + 1);
    const name = lower(m[1]);
    const attrs = [];
    let j = TAG_NAME.lastIndex;
    while (!(m = at(TAG_END, html, j))) {
        const a = at(ATTR, html, j);
        if (a) { j = ATTR.lastIndex; const raw = a[2] ?? a[3] ?? a[4]; attrs.push({ name: lower(a[1]), value: raw === undefined ? true : unescapeHtml(raw) }); }
        else if (html[j] === '/') j++;
        else return text(i + 1);
    }
    const selfClosing = m[1] === '/';
    let end = TAG_END.lastIndex;
    if (RAW_TEXT.has(name) && !selfClosing) {
        const close = new RegExp(`</${name}(?=[ \\t\\n\\f\\r/>])`, 'ig');
        close.lastIndex = end;
        end = close.exec(html) ? after(html, '>', close.lastIndex) : html.length;
    }
    return { type: 'start', name, attrs, selfClosing, start: i, end };
}

function after(html, needle, from) {
    const found = html.indexOf(needle, from);
    return found < 0 ? html.length : found + needle.length;
}

// An attribute's value, typed by its declared default, as lib/BaseComponent.js
// parseAttribute types it in the browser: presence for a boolean (the value is
// ignored); Number(), or the default when that is not finite, for a number;
// JSON.parse, or the default when that throws, for an array or object; the
// string as written for a string or null. A bare attribute's value is '',
// as getAttribute gives it.
export function parseAttribute(value, fallback) {
    if (typeof fallback === 'boolean') return true;
    if (value === true) value = '';
    if (typeof fallback === 'number') return Number.isFinite(Number(value)) ? Number(value) : fallback;
    if (typeof fallback !== 'object' || fallback === null) return value;
    try { return JSON.parse(value); } catch { return fallback; }
}

// An attribute value the class does not declare, as a template variable: JSON
// where the value is JSON, true for a bare attribute, otherwise the string.
export function coerce(value) {
    if (value === true) return true;
    if (/^(?:-?\d+(?:\.\d+)?|true|false|null)$/.test(value)) {
        try { const parsed = JSON.parse(value); return String(parsed) === value ? parsed : value; } catch { return value; }
    }
    if (/^[\[{][\s\S]*[\]}]$/.test(value)) {
        try { return JSON.parse(value); } catch { return value; }
    }
    return value;
}

// A no-break space goes back out as the entity, so View Source shows it.
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\u00a0/g, '&nbsp;');
}

function kebabToCamel(name) {
    return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
