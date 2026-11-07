// The thumbnail tuner page's script: templates first, then the component.
import { setup } from './template-env.js';

await setup([
    'components/thumbnail-tuner.html',
    'components/project-index/cell.html',
    'components/project-index/picture.html',
]);
await import('../components/thumbnail-tuner.js');
