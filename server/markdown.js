/**
 * Markdown → HTML, once, in the data layer. The site prints paragraphs, links,
 * bold and slanted text and nothing else: headings, list items, quotes and
 * code become paragraphs, images become their alt text, and raw HTML is
 * escaped (the CMS's source mode can type any, and marked does not sanitize).
 * Bare e-mail addresses become mailto: links (GFM). **Bold** is the Bold
 * weight. *Italic* is the design's slant: the font has no italic, so each
 * word is its own <span> that the stylesheet skews (word by word, so slanted
 * text still wraps). A line may break on either side of such a word, so what
 * touches the slanted text with no space (the comma after a *Title*, a bracket
 * before it) is tied to its word in a no-wrap <span class="nb">, unskewed.
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
        list({ items }) {
            // An item's own text, then any nested list's paragraphs after it: never a <p> in a <p>.
            return items.map((item) => {
                const html = this.parser.parse(item.tokens);
                const i = html.indexOf('<p>');
                return i <= 0 ? paragraphs(html) : wrap(html.slice(0, i)) + html.slice(i);
            }).join('');
        },
        code({ text }) { return wrap(escape(text)); },
        table({ header, rows }) {
            return [header, ...rows].map(row => wrap(row.map(cell => this.parser.parseInline(cell.tokens)).join(' '))).join('');
        },
        hr() { return ''; },
        html({ text, block }) { return block ? wrap(escape(text)) : escape(text); },
        strong({ tokens }) { return `<strong>${this.parser.parseInline(tokens)}</strong>`; },
        em({ tokens }) { return `<em>${words(this.parser.parseInline(tokens))}</em>`; },
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

// Inline HTML with every word in its own <span>; tags and the spaces between words stay as they
// are. Emphasis inside emphasis is one slanted run: its own <em> and word spans are dropped first.
function words(html) {
    return html.replace(/<\/?(?:em|span)>/g, '').replace(/(<[^>]*>)|([^<\s]+)/g, (m, tag, word) => tag ?? `<span>${word}</span>`);
}

// Inline HTML with what touches each <em> tied to its first / last word: `<em><span>A</span>
// <span>B</span></em>,` becomes `<em><span>A</span> <span class="nb"><span>B</span>,</span></em>`.
// Left as it is where the slanted text does not start or end with a plain word (a link, bold).
function tie(html) {
    return html.replace(/([^\s<>]*)<em>((?:(?!<\/?em>).)*)<\/em>([^\s<>]*)/gs, (all, before, inner, after) => {
        if (!before && !after) return all;
        const one = inner.match(/^<span>([^<]*)<\/span>$/);
        if (one) return `<em><span class="nb">${before}<span>${one[1]}</span>${after}</span></em>`;
        let out = inner;
        let pre = before;
        let post = after;
        if (before && /^<span>[^<]*<\/span>/.test(out)) {
            out = out.replace(/^<span>([^<]*)<\/span>/, `<span class="nb">${esc$(before)}<span>$1</span></span>`);
            pre = '';
        }
        if (after && /<span>[^<]*<\/span>$/.test(out)) {
            out = out.replace(/<span>([^<]*)<\/span>$/, `<span class="nb"><span>$1</span>${esc$(after)}</span>`);
            post = '';
        }
        return `${pre}<em>${out}</em>${post}`;
    });
}

// A literal for the replacement side of String.replace: `$` has a meaning there.
const esc$ = (s) => s.replace(/\$/g, '$$$$');

function wrap(inline) {
    return inline.trim() ? `<p>${inline.trim()}</p>\n` : '';
}

// A list item's rendering: paragraphs already, or bare inline text to wrap.
function paragraphs(html) {
    return html.trimStart().startsWith('<p>') ? html : wrap(html);
}

/** Block Markdown (a description, the Info page) → paragraphs and links. */
export function markdown(src) {
    return src && typeof src === 'string' ? tie(md.parse(src)).trim() : '';
}

/** One line of Markdown (the intro line, a caption) → inline HTML, no <p>. */
export function markdownInline(src) {
    return src && typeof src === 'string' ? tie(md.parseInline(src)).trim() : '';
}

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

/** One line of Markdown → its words only (a meta description). */
export function markdownText(src) {
    return markdownInline(src).replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, m => ENTITIES[m]).replace(/\s+/g, ' ').trim();
}
