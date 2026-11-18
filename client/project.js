// A project page's script: the template first, then the component that renders it.
import { setup } from './template-env.js';

await setup(['components/project-slides.html']);
await import('../components/project-slides.js');

// A page opened at #project-info: the browser set off for the information while the photos of
// every set were still one under the other (a smooth scroll, where site.css asks for one). Now
// that the sets are defined the page is shorter, and that scroll would stop at the end of the
// page, which can leave the information's first lines under the header. Go to it once more, the
// way the title link does: the new scroll takes over from the one under way (an instant one would
// be carried on by it for a few pixels). A scroll, no change to the DOM. Only when the page was
// opened (a link, an address); a reload or the back button brings back where the reader was.
if (location.hash === '#project-info' && performance.getEntriesByType('navigation')[0]?.type === 'navigate') {
    document.getElementById('project-info')?.scrollIntoView();
}
