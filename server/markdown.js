/**
 * Markdown → HTML, once, in the data layer. The site prints paragraphs and
 * links and nothing else: headings, list items, quotes and code become
 * paragraphs, inline emphasis becomes plain text, images become their alt
 * text, and raw HTML is escaped (the CMS's source mode can type any, and
 * marked does not sanitize). Bare e-mail addresses become mailto: links (GFM).
 * One scoped instance; the global `marked` is never configured.
 */
import { Marked } from 'marked';

const escape = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Links the site will print: web, mail, phone, and paths on this site.
const SAFE_HREF = /^(https?:|mailto:|tel:|\/|#|\.\.?\/)/i;

const md = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
        paragraph({ tokens }) { return wrap(this.parser.parseInline(tokens)); },
        heading({ tokens }) { return wrap(this.parser.parseInline(tokens)); },
        blockquote({ tokens }) { return this.parser.parse(tokens); },
        list({ items }) { return items.map(item => paragraphs(this.parser.parse(item.tokens))).join(''); },
        code({ text }) { return wrap(escape(text)); },
        table({ header, rows }) {
            return [header, ...rows].map(row => wrap(row.map(cell => this.parser.parseInline(cell.tokens)).join(' '))).join('');
        },
        hr() { return ''; },
        html({ text, block }) { return block ? wrap(escape(text)) : escape(text); },
        strong({ tokens }) { return this.parser.parseInline(tokens); },
        em({ tokens }) { return this.parser.parseInline(tokens); },
        del({ tokens }) { return this.parser.parseInline(tokens); },
        codespan({ text }) { return escape(text); },
        br() { return ' '; },
        image({ text }) { return escape(text); },
        checkbox() { return ''; },
        link({ href, tokens }) {
            const label = this.parser.parseInline(tokens);
            return SAFE_HREF.test(href ?? '') ? `<a href="${escape(href)}">${label}</a>` : label;
        },
    },
});

function wrap(inline) {
    return inline.trim() ? `<p>${inline.trim()}</p>\n` : '';
}

// A list item's rendering: paragraphs already, or bare inline text to wrap.
function paragraphs(html) {
    return html.trimStart().startsWith('<p>') ? html : wrap(html);
}

/** Block Markdown (a description, the Info page) → paragraphs and links. */
export function markdown(src) {
    return src && typeof src === 'string' ? md.parse(src).trim() : '';
}

/** One line of Markdown (the contact line) → inline HTML with links, no <p>. */
export function markdownInline(src) {
    return src && typeof src === 'string' ? md.parseInline(src).trim() : '';
}
