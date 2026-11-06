import { execFileSync } from 'node:child_process';
const version = JSON.stringify(process.env.VITE_APP_VERSION || 'local');
const commit = JSON.stringify(process.env.VITE_APP_COMMIT || '');
execFileSync(process.execPath, [
  'node_modules/@angular/cli/bin/ng.js', 'build',
  '--define', 'BUILD_VERSION=' + version, '--define', 'BUILD_COMMIT=' + commit,
], { stdio: 'inherit' });
