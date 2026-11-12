// The home page's script: the template first, then the component that renders it.
import { setup } from './template-env.js';

await setup(['components/project-index.html']);
await import('../components/project-index.js');
