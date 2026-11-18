import BaseComponent from '../client/lib/BaseComponent.js';

/**
 * One set of a project page's photos, one at a time; a page has one of these
 * per set, one under the other. Every photo is in the HTML; `index` says which
 * is the current one, and the stylesheet shows only that. The chevrons, a
 * click on the photo and the left / right arrow keys move through them; the
 * chevron that leads nowhere is not printed, so the first photo has no
 * "previous" and the last no "next". The next photo is loaded ahead.
 * Until this class is defined (JavaScript off, or the script still loading)
 * the photos are simply one under the other: project-slides.css, :defined.
 */
class ProjectSlides extends BaseComponent {
    template = 'components/project-slides.html';
    static props = {
        images: [], // the set's photos in order, as server/content.js shapes them (JSON)
        label: '', // the list's name for assistive technology
        eager: false, // the set at the top of the page: its first two photos load with the page
    };
    static events = [];
    // index: the current photo. The server renders the first.
    // near: the set has come on screen, so its current photo and the next load now. Only the
    // set at the top of the page loads them with the page (`eager`).
    state = { index: 0, near: false };

    connectedCallback() {
        this.addEventListener('click', e => this.click(e), { signal: this.signal });
        window.addEventListener('keydown', e => this.key(e), { signal: this.signal });
        window.addEventListener('scroll', () => this.scrolled(), { passive: true, signal: this.signal });
        super.connectedCallback();
    }

    click(e) {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action) this.go(action === 'prev' ? -1 : 1);
        else if (e.target.closest('.frame')) this.go(1);
    }

    // Left / right, unless a modifier makes it the browser's own shortcut (Alt+Left is "back"),
    // and only for the set that is on screen: every set on the page hears the key.
    key(e) {
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        if (!this.onScreen()) return;
        this.go(e.key === 'ArrowLeft' ? -1 : 1);
    }

    // The set on screen is the one whose box covers the middle of the window below the page's
    // header (`--head`, project-slides.css). Sets do not overlap, so that is one set at most;
    // while the project's information is there instead, it is none.
    onScreen() {
        const head = parseFloat(getComputedStyle(this).getPropertyValue('--head')) || 0;
        const middle = (head + innerHeight) / 2;
        const { top, bottom } = this.getBoundingClientRect();
        return top <= middle && middle < bottom;
    }

    // The page scrolled: once any of this set is in the window, its current photo and the next
    // may load. A set the page jumps past (a link to the information, a reload further down)
    // stays as it was.
    scrolled() {
        if (this.state.eager || this.state.near) return;
        const { top, bottom } = this.getBoundingClientRect();
        if (top < innerHeight && bottom > 0) this.setState({ near: true });
    }

    go(step) {
        const index = Math.min(this.state.images.length - 1, Math.max(0, this.state.index + step));
        if (index === this.state.index) return;
        // A focused chevron leaves with its photo, however the photo was changed (the chevron
        // itself, or an arrow key while it had focus): focus goes to the same chevron of the
        // new photo, or to the other one at either end.
        const focused = this.contains(document.activeElement);
        this.setState({ index, near: true });
        if (focused) (this.querySelector(`.current .${step < 0 ? 'prev' : 'next'}`) ?? this.querySelector('.current .arrow'))?.focus();
    }
}

customElements.define('project-slides', ProjectSlides);
