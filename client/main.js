// The home page's script: templates first, then the component that renders them.
import { setup } from './template-env.js';

await setup([
    'components/project-index.html',
    'components/project-index/cell.html',
    'components/project-index/picture.html',
]);
await import('../components/project-index.js');
