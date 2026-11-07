import BaseComponent from '../client/lib/BaseComponent.js';

/**
 * The home page: the grid of covers and the index list, both rendered from
 * one list of projects, filtered by tag. The active tags live in the URL
 * (?filter=a,b) and in `filter`; a change is one setState, and the morph
 * removes only the cells and rows that stop matching. Pointing at a cell or a
 * row puts the marker in that row (and swaps to the hover image, if any).
 * Static pages never carry ?filter, so the first render matches the server's;
 * a filter in the URL is applied right after it.
 */
class ProjectIndex extends BaseComponent {
    template = 'components/project-index.html';
    static props = {
        projects: [], // every published project in list order, as server/content.js shapes it (JSON)
        filter: [], // the active tags; static pages leave it empty and the URL sets it
        match: 'any', // 'any': a project shows with at least one active tag; 'all': with every one
        'hover-swap': false, // show a project's hover image while the pointer is over its cell
    };
    static events = [];
    // hover: the project whose row shows the marker (pointer on its cell or row, or focus);
    // swap: the project whose cell the pointer is over, which shows its hover image.
    state = { hover: '', swap: '' };

    connectedCallback() {
        this.addEventListener('click', e => this.click(e), { signal: this.signal });
        this.addEventListener('mouseover', e => this.point(e.target, true), { signal: this.signal });
        this.addEventListener('mouseleave', () => this.pointAt(''), { signal: this.signal });
        this.addEventListener('focusin', e => this.point(e.target, false), { signal: this.signal });
        // After the event: a morph that removes the focused row fires focusout mid-morph,
        // and a render must never start inside another.
        this.addEventListener('focusout', () => queueMicrotask(() => { if (!this.contains(document.activeElement)) this.pointAt(''); }), { signal: this.signal });
        window.addEventListener('popstate', () => {
            const filter = this.fromUrl();
            remember(filter);
            this.setState({ filter });
        }, { signal: this.signal });
        super.connectedCallback();
    }

    onConnected() {
        // ?filter= in the URL wins (unknown tags are dropped from it); else the filter a
        // project page's index link brings back; else nothing.
        const named = new URLSearchParams(location.search).has('filter');
        const filter = named ? this.fromUrl() : this.returning();
        if (filter.length || named) this.go(filter, 'replace');
        else remember([]);
    }

    getTemplateContext() {
        return { shown: this.visible() };
    }

    click(e) {
        const tag = e.target.closest('[data-action="tag"]');
        if (tag) {
            const t = tag.dataset.tag;
            const { filter } = this.state;
            this.go(filter.includes(t) ? filter.filter(x => x !== t) : [...filter, t], 'push');
            // The row holding the button can stop matching; keep keyboard focus in the list.
            if (!tag.isConnected) (this.querySelector('.tag.on') ?? this.querySelector('.index h1 a'))?.focus();
            return;
        }
        // Leaving for a project page: remember the filter, so its "index" link can bring it back.
        if (e.target.closest('a[href^="/projects/"]')) remember(this.state.filter);
    }

    point(target, pointer) {
        const el = target.closest?.('[data-slug]');
        const slug = el?.dataset.slug ?? '';
        this.pointAt(slug, pointer && el?.classList.contains('cell') ? slug : '');
    }

    pointAt(hover, swap = '') {
        if (hover !== this.state.hover || swap !== this.state.swap) this.setState({ hover, swap });
    }

    // Apply a filter: the URL first, then state.
    go(filter, how) {
        const url = location.pathname + query(filter);
        if (url !== location.pathname + location.search) history[`${how}State`](null, '', url);
        remember(filter);
        this.setState({ filter });
    }

    visible() {
        const { projects, filter, match } = this.state;
        if (!filter.length) return projects;
        const hit = match === 'all'
            ? p => filter.every(t => p.tags.includes(t))
            : p => p.tags.some(t => filter.includes(t));
        return projects.filter(hit);
    }

    // The tags in ?filter= that exist, in the order given.
    fromUrl() {
        const known = new Set(this.state.projects.flatMap(p => p.tags));
        const raw = new URLSearchParams(location.search).get('filter') ?? '';
        return [...new Set(raw.split(',').map(t => t.trim()).filter(t => known.has(t)))];
    }

    // Arriving from a project page by following its link (not a reload, not back/forward):
    // the filter that was active when the project was opened.
    returning() {
        const nav = performance.getEntriesByType('navigation')[0]?.type ?? 'navigate';
        const from = document.referrer ? new URL(document.referrer) : null;
        const stored = recall();
        if (nav !== 'navigate' || from?.origin !== location.origin || !/^\/projects\/[^/]+\/$/.test(from.pathname)) return [];
        const known = new Set(this.state.projects.flatMap(p => p.tags));
        return stored.filter(t => known.has(t));
    }
}

// ?filter=a,b with each tag encoded; '' when nothing is active.
function query(filter) {
    return filter.length ? `?filter=${filter.map(encodeURIComponent).join(',')}` : '';
}

const KEY = 'tolomeo:filter';
function remember(filter) {
    try { sessionStorage.setItem(KEY, JSON.stringify(filter)); } catch { /* storage unavailable: nothing to bring back */ }
}
function recall() {
    try {
        const value = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
        return Array.isArray(value) ? value.map(String) : [];
    } catch { return []; }
}

customElements.define('project-index', ProjectIndex);
