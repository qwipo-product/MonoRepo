// Keep the CSS watcher and Angular dev server in the same terminal session.
import { spawn } from 'node:child_process';
await import('./build-css.mjs');
const args = process.argv.slice(2).filter((arg) => arg !== '--watch');
const server = spawn(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'serve', ...args], { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('error', (error) => { console.error(error); process.exit(1); });
server.on('exit', (code, signal) => process.exit(code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1)));
