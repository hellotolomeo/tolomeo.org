// The Nunjucks environment every component renders with, with the server's
// three options (createEnvironment sets the same) so both produce the same
// bytes. The templates a page needs are fetched up front with fetch(); the
// vendored synchronous TemplateLoader is only the fallback for one missed.
import BaseComponent from './lib/BaseComponent.js';
import TemplateLoader from './lib/TemplateLoader.js';
import { choices } from '../lib/filters.js';

class PreloadedLoader extends TemplateLoader {
    constructor(base, sources) {
        super(base);
        this.sources = sources;
    }

    getSource(name) {
        const src = this.sources.get(name);
        return src === undefined ? super.getSource(name) : { src, path: name, noCache: false };
    }
}

export async function setup(names) {
    const sources = new Map();
    await Promise.all(names.map(async (name) => {
        try {
            const res = await fetch(`/${name}`);
            if (res.ok) sources.set(name, await res.text());
        } catch { /* left to the fallback loader */ }
    }));
    BaseComponent.env = new nunjucks.Environment(
        new PreloadedLoader('/', sources),
        { autoescape: true, trimBlocks: true, lstripBlocks: true },
    );
    BaseComponent.env.addFilter('choices', choices);
}
