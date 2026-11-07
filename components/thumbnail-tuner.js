import BaseComponent from '../client/lib/BaseComponent.js';

/**
 * The thumbnail tuner (/tools/thumbnail/): a real grid cell for one project's
 * cover. Drag to move the photo, scroll to zoom, or use the sliders;
 * the three values to copy into the CMS (cover_style, cover_focus,
 * cover_zoom) follow. The preview's placement is a <style> the template
 * prints from state, so nothing is set on an element from script.
 */
class ThumbnailTuner extends BaseComponent {
    template = 'components/thumbnail-tuner.html';
    static props = {
        projects: [], // the index's project list (JSON): slug, title, style, cover, pair
        start: [], // each project's current { slug, focus, zoom } (JSON)
    };
    static events = [];
    state = { slug: '', style: 'polaroid', x: 50, y: 50, zoom: 1, copied: false };

    connectedCallback() {
        this.addEventListener('input', e => this.input(e), { signal: this.signal });
        this.addEventListener('change', e => this.input(e), { signal: this.signal });
        this.addEventListener('click', e => { if (e.target.closest('[data-action="copy"]')) this.copy(); }, { signal: this.signal });
        this.addEventListener('pointerdown', e => this.grab(e), { signal: this.signal });
        this.addEventListener('wheel', e => this.wheel(e), { signal: this.signal, passive: false });
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
        const s = this.state.start.find(q => q.slug === slug) ?? { focus: [50, 50], zoom: 1 };
        this.setState({ slug: p ? slug : '', style: p?.style ?? 'polaroid', x: s.focus[0], y: s.focus[1], zoom: s.zoom, copied: false });
    }

    input(e) {
        const action = e.target.dataset?.action;
        if (action === 'pick') return this.pick(e.target.value);
        if (action === 'style') return this.setState({ style: e.target.value, copied: false });
        if (action === 'x' || action === 'y') return this.setState({ [action]: Math.round(Number(e.target.value)), copied: false });
        if (action === 'zoom') return this.setState({ zoom: round2(Number(e.target.value)), copied: false });
    }

    // Moving the photo by (dx, dy) pixels: its edge sits at focus/100 × (box − zoomed image),
    // so the focus that puts it there is the same ratio after the move.
    grab(e) {
        const cell = e.target.closest('[data-action="drag"]');
        if (!cell || e.button !== 0) return;
        e.preventDefault();
        const box = e.target.closest('.box') ?? cell.querySelector('.box');
        const img = box?.querySelector('img');
        if (!img) return;
        const { width: bw, height: bh } = box.getBoundingClientRect();
        const iw = Number(img.getAttribute('width')) || bw;
        const ih = Number(img.getAttribute('height')) || bh;
        const s = Math.max(bw / iw, bh / ih);
        const from = { px: e.clientX, py: e.clientY, x: this.state.x, y: this.state.y };
        const spare = () => ({ w: bw - this.state.zoom * iw * s, h: bh - this.state.zoom * ih * s });
        const move = (ev) => {
            const { w, h } = spare();
            const x = Math.abs(w) < 1 ? from.x : from.x + (100 * (ev.clientX - from.px)) / w;
            const y = Math.abs(h) < 1 ? from.y : from.y + (100 * (ev.clientY - from.py)) / h;
            this.setState({ x: clamp(Math.round(x)), y: clamp(Math.round(y)), copied: false });
        };
        const stop = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', stop); };
        addEventListener('pointermove', move, { signal: this.signal });
        addEventListener('pointerup', stop, { signal: this.signal });
    }

    wheel(e) {
        if (!e.target.closest('[data-action="drag"]')) return;
        e.preventDefault();
        const zoom = Math.min(4, Math.max(1, this.state.zoom * Math.exp(-e.deltaY / 500)));
        this.setState({ zoom: round2(zoom), copied: false });
    }

    async copy() {
        const { style, x, y, zoom } = this.state;
        const text = `cover_style: ${style}\ncover_focus:\n  - ${x}\n  - ${y}\ncover_zoom: ${zoom}\n`;
        try { await navigator.clipboard.writeText(text); this.setState({ copied: true }); } catch { /* select the text by hand */ }
    }
}

const clamp = (n) => Math.min(100, Math.max(0, n));
const round2 = (n) => Math.round(n * 100) / 100;

customElements.define('thumbnail-tuner', ThumbnailTuner);
