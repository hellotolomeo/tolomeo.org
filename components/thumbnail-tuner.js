import BaseComponent from '../client/lib/BaseComponent.js';

/**
 * The thumbnail preview (/tools/thumbnail/): a real grid cell for one
 * project's cover in each style, and the `cover_style` value to copy into the
 * CMS. Thumbnails are never cropped (each box takes its photo's proportions),
 * so the style is the only choice.
 */
class ThumbnailTuner extends BaseComponent {
    template = 'components/thumbnail-tuner.html';
    static props = {
        projects: [], // the index's project list (JSON): slug, title, style, cover, pair
    };
    static events = [];
    state = { slug: '', style: 'polaroid' };

    connectedCallback() {
        this.addEventListener('change', e => this.change(e), { signal: this.signal });
        super.connectedCallback();
    }

    onConnected() {
        const slug = new URLSearchParams(location.search).get('project');
        if (slug) this.pick(slug);
    }

    getTemplateContext() {
        const p = this.state.projects.find(q => q.slug === this.state.slug);
        if (!p) return { cell: null };
        const style = this.state.style === 'pair' && !p.pair ? 'polaroid' : this.state.style;
        return { cell: { ...p, style } };
    }

    pick(slug) {
        const p = this.state.projects.find(q => q.slug === slug && q.cover);
        this.setState({ slug: p ? slug : '', style: p?.style ?? 'polaroid' });
    }

    change(e) {
        const action = e.target.dataset?.action;
        if (action === 'pick') this.pick(e.target.value);
        if (action === 'style') this.setState({ style: e.target.value });
    }
}

customElements.define('thumbnail-tuner', ThumbnailTuner);
