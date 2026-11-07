/**
 * A custom-element tag in a template is a component invocation. The
 * component's JS class says which template it renders and which
 * attributes it reads, each with its default:
 *
 *   class SearchForm extends BaseComponent {
 *       template = 'components/search-form.html';
 *       static props = { query: '', count: 0, dynamic: false, filters: [] };
 *       …
 *   }
 *   customElements.define('search-form', SearchForm);
 *
 * The server reads those three lines from components/ at startup
 * (scanComponents) so it can render the same template inside the tag,
 * typing each attribute as the browser types it: the default is the type.
 *
 *   <search-form dynamic {{ 'catalog' if isCatalog }}></search-form>
 *
 * Two steps. Nunjucks renders the page as the plain template it is, so
 * every expression between the angle brackets is Nunjucks's business and
 * the tag comes out as HTML. Then expand() walks that HTML once and, at
 * each tag with a template, renders the template inside it from the tag's
 * attributes (see expand.js). Tags with no template pass through as the
 * HTML they already are.
 *
 * createEnvironment wires that up; expand and scanComponents are for
 * servers that build their own Environment.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expand, coerce, parseAttribute } from './expand.js';
import { choices } from '../../lib/filters.js';

export { expand, coerce, parseAttribute, scanComponents };

// A renderer for pages with components. `templates` are the roots template
// names resolve against; `components` is scanned for classes, reading with
// `fs` (node:fs unless a caller narrows the tree). Returns { env, templates,
// props, render, renderString }: a plain Nunjucks Environment, the tag ->
// path and tag -> declared props maps the scan found, and two functions
// that render then expand. The options are the contract: the browser
// renders with the same three, so server and browser produce the same bytes.
export function createEnvironment(nunjucks, { templates: roots, components, noCache = false, fs = { readdirSync, readFileSync, statSync, join } }) {
    const loader = new nunjucks.FileSystemLoader(roots, { noCache });
    const env = new nunjucks.Environment(loader, { autoescape: true, trimBlocks: true, lstripBlocks: true });
    env.addFilter('choices', choices);
    const { templates, props } = scanComponents(components, fs);
    for (const [tag, path] of templates) {
        try { env.getTemplate(path); } catch { throw new Error(`<${tag}>: template not found: ${path}`); }
    }

    // A component renders from its tag alone (expand.js), as the browser
    // renders it from state alone; the page's variables are not under it.
    const expanded = html => expand(html, { templates, props, render: (path, vars) => env.render(path, vars) });
    return {
        env,
        templates,
        props,
        render: (name, context = {}) => expanded(env.render(name, context)),
        renderString: (src, context = {}) => expanded(env.renderString(src, context)),
    };
}

// What the component classes declare: `templates`, tag -> template path;
// `props`, tag -> the class's `static props`, as a Map of attribute name ->
// { name, fallback } (the state key and the default), for the classes that
// declare one. `content` is left out; it is never an attribute.
function scanComponents(dir, { readdirSync, readFileSync, statSync, join }) {
    const templates = new Map();
    const props = new Map();
    const walk = (d) => {
        for (const name of readdirSync(d)) {
            const p = join(d, name);
            if (statSync(p).isDirectory()) { walk(p); continue; }
            if (!name.endsWith('.js')) continue;
            const src = readFileSync(p, 'utf8');
            const tag = src.match(/customElements\.define\(\s*['"]([a-z][a-z0-9-]*)['"]/)?.[1];
            const template = src.match(/^\s*template\s*=\s*['"]([^'"]+)['"]/m)?.[1];
            if (!tag || !template) continue;
            templates.set(tag, template);
            const declared = readProps(src, tag);
            if (declared) props.set(tag, declared);
        }
    };
    walk(dir);
    return { templates, props };
}

// The class's `static props = { … }`, read from the source without running
// it: keys bare or quoted, kebab or camel; defaults literal (a string in
// either quote, a finite number, true, false, null, an array or object of
// those), with `//` comments and a trailing comma allowed. A string escapes
// only \\ \' \" \n \t \r; any other escape, and any other default (a
// reference, a call), is an error naming the entry, so it fails at boot
// rather than falling back to the shape rule. The declaration is a class
// member, at the start of its line, and there is one. Each entry is keyed by
// the attribute name as a browser reads it (ASCII-lowercased) and carries
// the state key (kebab to camel), as lib/BaseComponent.js derives them.
const PROPS = /^\s*static\s+props\s*=\s*/gm;
const SKIP = /(?:[ \t\n\r]+|\/\/[^\n]*)*/y;
const STRING = /'((?:[^'\\\n]|\\[^\n])*)'|"((?:[^"\\\n]|\\[^\n])*)"/y;
const IDENT = /[A-Za-z_$][A-Za-z0-9_$]*/y;
const NUMBER = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const WORD = /(?:true|false|null)\b/y;
const ESCAPES = { '\\': '\\', "'": "'", '"': '"', n: '\n', t: '\t', r: '\r' };
function readProps(src, tag) {
    const [start, second] = src.matchAll(PROPS);
    if (!start) return null;
    const fail = (what) => { throw new Error(`<${tag}>: static props: ${what}`); };
    if (second) fail('declared twice');
    const at = (re, i) => { re.lastIndex = i; return re.exec(src); };
    const skip = i => at(SKIP, i) && SKIP.lastIndex;
    const unescape = (s, what) => s.replace(/\\(.)/g, (m, c) => ESCAPES[c] ?? fail(what));
    // The key at i, as [key, end]: an identifier, or a string in either quote.
    const keyAt = (i) => {
        let m;
        if ((m = at(STRING, i))) return [unescape(m[1] ?? m[2], 'cannot read the declaration'), STRING.lastIndex];
        if ((m = at(IDENT, i))) return [m[0], IDENT.lastIndex];
        return fail('cannot read the declaration');
    };
    // The literal at i, as [value, end]; `entry` is the declaration entry it is the default of.
    const literal = (i, entry) => {
        let m;
        const bad = `cannot read the default for "${entry}"`;
        if ((m = at(STRING, i))) return [unescape(m[1] ?? m[2], bad), STRING.lastIndex];
        if ((m = at(NUMBER, i))) return [Number.isFinite(Number(m[0])) ? Number(m[0]) : fail(bad), NUMBER.lastIndex];
        if ((m = at(WORD, i))) return [JSON.parse(m[0]), WORD.lastIndex];
        if (src[i] === '[' || src[i] === '{') return compound(i, entry);
        return fail(bad);
    };
    // The array or object literal at i: its entries up to the closing bracket, each a
    // literal, keyed in an object. At the top level each key is its own entry.
    const compound = (i, entry) => {
        const object = src[i] === '{';
        const close = object ? '}' : ']';
        const out = object ? {} : [];
        for (i = skip(i + 1); src[i] !== close; i = skip(i)) {
            let key;
            if (object) {
                [key, i] = keyAt(i);
                i = skip(i);
                if (src[i] !== ':') fail('cannot read the declaration');
                i = skip(i + 1);
            }
            const [value, end] = literal(i, entry ?? key);
            if (object) out[key] = value; else out.push(value);
            i = skip(end);
            if (src[i] === ',') i++;
            else if (src[i] !== close) fail(`cannot read the default for "${entry ?? key}"`);
        }
        return [out, i + 1];
    };
    const i = skip(start.index + start[0].length);
    if (src[i] !== '{') fail('cannot read the declaration');
    const declared = new Map();
    for (const [key, fallback] of Object.entries(compound(i)[0])) {
        if (key === 'content') continue;
        declared.set(lower(key), { name: kebabToCamel(key), fallback });
    }
    return declared;
}

// A tag or attribute name as a browser lowercases it: ASCII letters only.
function lower(name) {
    return name.replace(/[A-Z]+/g, s => s.toLowerCase());
}

function kebabToCamel(name) {
    return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
