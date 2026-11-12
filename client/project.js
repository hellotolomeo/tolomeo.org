// A project page's script: the template first, then the component that renders it.
import { setup } from './template-env.js';

await setup(['components/project-slides.html']);
await import('../components/project-slides.js');
