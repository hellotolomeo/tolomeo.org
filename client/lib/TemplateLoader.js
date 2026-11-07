/**
 * The browser's template loader: fetches a template by the path in
 * `template = 'components/x.html'`, under `base`, with no query string, so
 * the HTTP cache keeps it for as long as the server's headers say. The
 * request is synchronous, as render() is; Nunjucks keeps the compiled
 * template, so each is fetched once per page.
 *
 *   BaseComponent.env = new nunjucks.Environment(new TemplateLoader('/'), options);
 *
 * `base` is where `components/` is: '/' for the site root, '.' for the
 * page's directory, '../..' for a page two levels down.
 */
export default class TemplateLoader {
    constructor(base = '.') {
        this.base = base.replace(/\/$/, '');
    }

    // What Nunjucks asks a loader for; an error names the path and the status.
    getSource(name) {
        const url = `${this.base}/${name}`;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        try { xhr.send(); } catch (err) { throw new Error(`${url}: ${err.message}`, { cause: err }); }
        if (xhr.status !== 200) throw new Error(`${url}: ${xhr.status} ${xhr.statusText}`);
        return { src: xhr.responseText, path: name, noCache: false };
    }
}
