// A double click (or double tap) on a picture opens it to the full window; a click, a tap,
// Escape, Enter or the space bar closes it. Pictures that take part: a project's photos
// (`project-slides .frame`) and any picture marked `data-zoom`.
// A project's photos also answer a single click by moving to the next one
// (components/project-slides.js), so a click on a picture waits a moment to see whether a second
// follows: two open the picture, one is passed on to the page as the click it was.
// Nothing here runs when the page loads but the listeners: the page's HTML is not touched until
// a picture is opened.
const WAIT = 260;
const PICTURE = '[data-zoom], project-slides .frame';
// While a picture is open the page behind it must stay as it is: these keys would scroll it or
// move focus into it (the arrow keys would also change the photo there).
const HELD = new Set(['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);
const CLOSES = new Set(['Escape', 'Enter', ' ']);
let timer = 0;
let first = null;
let passing = false;

function open(frame) {
    const img = frame.querySelector('img');
    if (!img || document.querySelector('.zoom')) return;
    const before = document.activeElement;
    const box = document.createElement('div');
    box.className = 'zoom';
    box.tabIndex = -1;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', img.alt || 'Image');
    const big = new Image();
    big.alt = img.alt;
    // First the file the page already shows, which is there at once. The one that is sharp at
    // this size is fetched beside it and takes its place when it has loaded (asked of the
    // picture itself, the browser would show nothing until then). The picture is shown whole, so
    // it is as wide as the window or as wide as the window's height allows, whichever is less.
    big.src = img.currentSrc || img.src;
    const srcset = img.closest('picture')?.querySelector('source')?.srcset || img.srcset;
    if (srcset) {
        const ratio = Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
        const sharp = new Image();
        sharp.addEventListener('load', () => { if (sharp.currentSrc && sharp.currentSrc !== big.src) big.src = sharp.currentSrc; });
        sharp.sizes = ratio > 0 ? `min(100vw, ${Math.round(ratio * 10000) / 100}vh)` : '100vw';
        sharp.srcset = srcset;
    }
    box.append(big);

    const close = () => {
        if (!box.isConnected) return;
        window.removeEventListener('keydown', key, true);
        if (document.fullscreenElement === box) document.exitFullscreen?.().catch(() => {});
        box.remove();
        // What had keyboard focus gets it back. As a rule nothing had (a click on a picture takes
        // it from whatever had it), and then the Tab key should go on from the picture, not from
        // the top of the page: a browser goes on from where the element with focus was removed,
        // so one is put after the picture for a moment.
        if (before && before !== document.body && before.isConnected) before.focus({ preventScroll: true });
        else if (frame.isConnected) {
            const place = document.createElement('span');
            place.tabIndex = -1;
            frame.after(place);
            place.focus({ preventScroll: true });
            place.remove();
        }
    };
    // Every key stops here, so nothing behind the picture hears it. The browser's own shortcuts
    // (with Ctrl, Alt or the command key) are left to the browser.
    const key = e => {
        e.stopPropagation();
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (CLOSES.has(e.key)) {
            e.preventDefault();
            close();
        } else if (HELD.has(e.key)) e.preventDefault();
    };
    box.addEventListener('click', close);
    box.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) close(); });
    // The wheel and a dragging finger would scroll the page behind the picture. Pinching (Ctrl
    // with the wheel on a trackpad, two fingers on a screen) still enlarges it, and a picture
    // enlarged that way can be dragged about.
    box.addEventListener('wheel', e => { if (!e.ctrlKey) e.preventDefault(); }, { passive: false });
    box.addEventListener('touchmove', e => { if (e.touches.length === 1 && !(window.visualViewport?.scale > 1)) e.preventDefault(); }, { passive: false });
    window.addEventListener('keydown', key, true);
    document.body.append(box);
    box.focus({ preventScroll: true });
    // The whole screen where the browser allows it (it does not on a phone, or in some frames):
    // the box already covers the window either way.
    try { box.requestFullscreen?.().catch(() => {}); } catch { /* refused: the window it is */ }
}

// A second press on a picture must not select it, or the words beside it.
document.addEventListener('mousedown', e => {
    if (e.detail > 1 && e.target.closest?.(PICTURE)) e.preventDefault();
}, true);

// The click that is being held back goes to the page now, as a click on its picture.
function pass() {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
    passing = true;
    try { first.click(); } finally { passing = false; }
}

document.addEventListener('click', e => {
    if (passing || e.target.closest?.('.zoom')) return;
    const frame = e.target.closest?.(PICTURE);
    if (!frame) return;
    // Held back until it is known whether it is the first of two.
    e.stopPropagation();
    if (timer && first === frame) {
        clearTimeout(timer);
        timer = 0;
        open(frame);
        return;
    }
    // A click still waiting on another picture was one click.
    pass();
    first = frame;
    timer = setTimeout(pass, WAIT);
}, true);
