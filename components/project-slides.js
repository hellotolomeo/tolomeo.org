import BaseComponent from '../client/lib/BaseComponent.js';

/**
 * A project page's photos, one at a time. Every photo is in the HTML; `index`
 * says which is the current one, and the stylesheet shows only that. The
 * chevrons, a click on the photo and the left / right arrow keys move through
 * them; the chevron that leads nowhere is not printed, so the first photo has
 * no "previous" and the last no "next". The next photo is loaded ahead.
 * Until this class is defined (JavaScript off, or the script still loading)
 * the photos are simply one under the other: project-slides.css, :defined.
 */
class ProjectSlides extends BaseComponent {
    template = 'components/project-slides.html';
    static props = {
        images: [], // the project's photos in order, as server/content.js shapes them (JSON)
        label: '', // the list's name for assistive technology
    };
    static events = [];
    // index: the current photo. The server renders the first.
    state = { index: 0 };

    connectedCallback() {
        this.addEventListener('click', e => this.click(e), { signal: this.signal });
        window.addEventListener('keydown', e => this.key(e), { signal: this.signal });
        super.connectedCallback();
    }

    click(e) {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action) this.go(action === 'prev' ? -1 : 1, true);
        else if (e.target.closest('.frame')) this.go(1);
    }

    // Left / right, unless a modifier makes it the browser's own shortcut (Alt+Left is "back"),
    // and only while the photos are on screen.
    key(e) {
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        if (this.getBoundingClientRect().bottom <= 0) return;
        this.go(e.key === 'ArrowLeft' ? -1 : 1);
    }

    go(step, fromArrow = false) {
        const index = Math.min(this.state.images.length - 1, Math.max(0, this.state.index + step));
        if (index === this.state.index) return;
        this.setState({ index });
        // The pressed chevron left with its photo: focus stays on the same chevron of the new
        // photo, or on the other one at either end.
        if (fromArrow) (this.querySelector(`.current .${step < 0 ? 'prev' : 'next'}`) ?? this.querySelector('.current .arrow'))?.focus();
    }
}

customElements.define('project-slides', ProjectSlides);
