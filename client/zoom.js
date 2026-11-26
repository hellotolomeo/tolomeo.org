// A double click (or double tap) on a photo opens it to the full window; a click, a tap or
// Escape closes it. A project's photos also answer a single click by moving to the next one
// (components/project-slides.js), so a click on one waits a moment to see whether a second
// follows: two open the photo, one is passed on as "next".
const WAIT = 260;
let timer = 0;
let first = null;

function open(img) {
    if (!img || document.querySelector('.zoom')) return;
    const box = document.createElement('div');
    box.className = 'zoom';
    box.tabIndex = -1;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', img.alt || 'Image');
    const big = new Image();
    big.alt = img.alt;
    big.sizes = '100vw';
    big.srcset = img.closest('picture')?.querySelector('source')?.srcset || img.srcset;
    big.src = img.currentSrc || img.src;
    box.append(big);

    const close = () => {
        if (!box.isConnected) return;
        box.remove();
        window.removeEventListener('keydown', key, true);
        if (document.fullscreenElement === box) document.exitFullscreen?.().catch(() => {});
    };
    const key = e => {
        if (e.key !== 'Escape' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        e.stopPropagation();
        close();
    };
    box.addEventListener('click', close);
    box.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) close(); });
    window.addEventListener('keydown', key, true);
    document.body.append(box);
    box.focus();
    // The whole screen where the browser allows it (it does not on a phone, or in some frames):
    // the box already covers the window either way.
    try { box.requestFullscreen?.().catch(() => {}); } catch { /* refused: the window it is */ }
}

document.addEventListener('click', e => {
    if (e.target.closest?.('.zoom')) return;
    const frame = e.target.closest?.('[data-zoom], project-slides .frame');
    if (!frame) return;
    e.stopPropagation();
    if (timer && first === frame) {
        clearTimeout(timer);
        timer = 0;
        open(frame.querySelector('img'));
        return;
    }
    clearTimeout(timer);
    first = frame;
    timer = setTimeout(() => {
        timer = 0;
        frame.closest('project-slides .slide')?.querySelector('.arrow.next')?.click();
    }, WAIT);
}, true);
