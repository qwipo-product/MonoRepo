import { mkdir } from 'node:fs/promises';
import { versionBadgeManagerHead } from '@mockups/version-badge/storybook';

// Use the same DOM-based badge as the component catalogs, without loading React in Angular.
const template = await Bun.file(new URL('./app/src/index.html', import.meta.url)).text();
const directory = new URL('./app/.cache/', import.meta.url);
await mkdir(directory, { recursive: true });
await Bun.write(new URL('index.html', directory), template.replace('</head>', versionBadgeManagerHead('bottom-right') + '\n</head>'));
