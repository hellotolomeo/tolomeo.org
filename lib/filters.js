/**
 * Filters a component template uses beyond the engine's own. Each is
 * registered under the same name in the browser, by the app's
 * template-env.js (`BaseComponent.env.addFilter('choices', choices)`), in
 * the Node adapter's createEnvironment, and in the Python, Rust, Go and
 * PHP adapters, so one template renders the same bytes on every side.
 *
 * A list control's list is the `<option>` elements in its box, written by
 * the page or by the parent's template that writes the tag. On the server
 * they reach the template as the `content` string, and `[] | choices(content)`
 * reads them; in the browser the box holds elements, the class reads them
 * with `choicesIn(this.box)` (below) and gives the template the list as
 * `choices`, so a template sets `choices | default([] | choices(content))`.
 * Both give one list of { value, label, disabled, data, dataAttrs }.
 *
 * `options | choices(content)`: the first argument is a list a server
 * adapter may still pass, [{ value, label, disabled }]; while it has
 * entries the filter returns its entries, with `value` a
 * string, `label` escaped as text, `disabled` a boolean, `data` empty and
 * `dataAttrs` ''; otherwise one entry per `<option>` in the content, with
 * `value` the attribute, decoded as the expander decodes a tag's own (`''`
 * if absent; the first of a duplicated name), `label` the HTML between the
 * option's tags as written, `disabled` whether the attribute is present,
 * `data` the option's `data-*` attributes under the names
 * `HTMLElement.dataset` gives them (`data-hex-color` -> `hexColor`), each
 * value decoded as `value` is and `''` for a bare one (so a template tests
 * `o.data.basic is defined`, never `o.data.basic`), the first of a
 * duplicated name; and `dataAttrs` those same attributes as written, each
 * after one space, for a template that prints an `<option>` from the
 * list, with `| safe`, as it prints the label (the controls print none:
 * they keep the author's options). The scan reads an option's tag as the expander
 * reads a tag, holes included: names in any case (ASCII letters), an
 * attribute as `a="b"`, `a='b'`, `a=b` or bare. It is flat: an option
 * inside an `<optgroup>` is one of the list, and between options nothing
 * is parsed: an `<hr>`, text, a comment pass by, and an `<option>` inside
 * a `<script>` or a quoted attribute is read, where the expander would
 * not look. An `<option>` with no end tag runs to the next `<option>` or
 * the end of the content, where a browser closes it too. A component
 * does not go inside a list control's content: the server scans the raw
 * slice, the browser whatever has rendered by connect. A template prints
 * `o.label | safe` and compares `o.value` to its string prop.
 */
export function choices(options, content) {
    if (options && options.length) return options.map(o => ({ value: text(o.value), label: escape(text(o.label)), disabled: Boolean(o.disabled), data: Object.create(null), dataAttrs: '' }));
    const html = text(content), out = [];
    let open = null; // the option whose label is being read: value, disabled, data, dataAttrs, where the label starts
    const close = end => { if (open) out.push({ value: open.value, label: html.slice(open.start, end), disabled: open.disabled, data: open.data, dataAttrs: open.dataAttrs }); open = null; };
    for (let i = 0, m; (m = at(OPTION, html, i));) {
        const start = m.index;
        i = OPTION.lastIndex;
        if (m[0] === '<!--') { const c = html.indexOf('-->', i); i = c < 0 ? html.length : c + 3; continue; }
        if (m[1]) {
            const gt = html.indexOf('>', i);
            if (gt >= 0) close(start);
            i = gt >= 0 ? gt + 1 : start + 1;
            continue;
        }
        let j = i, value, disabled = false, data = Object.create(null), dataAttrs = '', a;
        while (!at(TAG_END, html, j)) {
            if ((a = at(ATTR, html, j))) {
                j = ATTR.lastIndex;
                const name = lower(a[1]);
                if (name === 'value') value ??= unescapeHtml(a[2] ?? a[3] ?? a[4] ?? '');
                if (name === 'disabled') disabled = true;
                if (name.startsWith('data-') && !(datasetName(name) in data)) {
                    data[datasetName(name)] = unescapeHtml(a[2] ?? a[3] ?? a[4] ?? '');
                    dataAttrs += ' ' + a[0].replace(/^[ \t\n\f\r]+/, '');
                }
            } else if (html[j] === '/') j++;
            else { j = -1; break; }
        }
        if (j < 0) { i = start + 1; continue; }
        close(start);
        open = { value: value ?? '', disabled, data, dataAttrs, start: TAG_END.lastIndex };
        i = TAG_END.lastIndex;
    }
    close(html.length);
    return out;
}

// A comment, or a start or end tag named option, as the scan finds them; `i` without `u` folds case over ASCII only.
const OPTION = /<!--|<(\/?)option(?=[ \t\n\f\r/>])/gi;

// A `data-*` attribute's name as `HTMLElement.dataset` gives it: `data-` off,
// and each `-` before an ASCII lowercase letter dropped, the letter capitalized.
const datasetName = name => name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const ESCAPED = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = s => s.replace(/[&<>"']/g, c => ESCAPED[c]);
const text = v => (v == null ? '' : String(v));

// The same list from the `<option>` elements under `root` (a list control's
// box; the tag itself before its first render), as the browser holds them:
// `value` the attribute decoded (`''` if absent), `label` the option's
// innerHTML, `disabled` by presence, `data` the `data-*` attributes under
// their dataset names, `dataAttrs` the same as the serializer writes them
// (a bare one `data-x=""`). An option in an `<optgroup>` is one of the
// list; nothing else between the options is read. Browser only.
export function choicesIn(root) {
    if (!root) return [];
    return [...root.querySelectorAll('option')].map(o => {
        const data = Object.create(null);
        let dataAttrs = '';
        for (const { name, value } of o.attributes) {
            if (!name.startsWith('data-')) continue;
            data[datasetName(name)] = value;
            dataAttrs += ` ${name}="${value.replace(/[&"\u00a0]/g, c => (c === '&' ? '&amp;' : c === '"' ? '&quot;' : '&nbsp;'))}"`;
        }
        return { value: o.getAttribute('value') ?? '', label: o.innerHTML, disabled: o.hasAttribute('disabled'), data, dataAttrs };
    });
}

// How a browser reads the inside of a tag, for the scan above and for the
// expander's tokenizer (server/node/expand.js imports these; each other
// adapter keeps them beside its own tokenizer). Whitespace inside a tag is
// HTML's five characters, [ \t\n\f\r], as a browser splits a tag; anything
// else (U+00A0 included) is part of a name or value. An attribute is a
// name, then `="…"`, `='…'`, `=…` or nothing; a tag ends at `>` or `/>`.
export const ATTR = /[ \t\n\f\r]*([^ \t\n\f\r/>=]+)(?:[ \t\n\f\r]*=[ \t\n\f\r]*(?:"([^"]*)"|'([^']*)'|([^ \t\n\f\r>]+)))?/y;
export const TAG_END = /[ \t\n\f\r]*(\/?)>/y;
export const at = (re, html, i) => { re.lastIndex = i; return re.exec(html); };

// A tag or attribute name as a browser lowercases it: ASCII letters only.
export const lower = name => name.replace(/[A-Z]+/g, s => s.toLowerCase());

const NAMED_ENTITIES = new Map(Object.entries({
    quot: '"', apos: "'", lt: '<', gt: '>', amp: '&', nbsp: '\u00a0', hellip: '…', mdash: '—',
    ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', copy: '©', reg: '®', trade: '™',
    times: '×', middot: '·', bull: '•', deg: '°', plusmn: '±', laquo: '«', raquo: '»',
}));

// An attribute value decoded for the named entities above and numeric
// references; one past U+10FFFF is U+FFFD, as a browser decodes it. Write
// other characters as UTF-8 or as numeric references.
export function unescapeHtml(str) {
    return str.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(\w+));/gi, (m, dec, hex, name) => {
        if (dec || hex) { const code = dec ? Number(dec) : parseInt(hex, 16); return code > 0x10ffff ? '\ufffd' : String.fromCodePoint(code); }
        return NAMED_ENTITIES.get(name) ?? m;
    });
}
