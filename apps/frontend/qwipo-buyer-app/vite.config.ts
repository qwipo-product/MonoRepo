import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Each mockup owns a fixed port so `bun dev` at the repo root can run
    // several of them side by side without a collision. If you add an app,
    // `bun run new` picks the next free port for you.
    port: Number(process.env.PORT) || 5173,
    // Listen on the LAN too — the whole point of a mobile mockup is opening
    // it on an actual phone. Vite prints the Network URL on boot.
    host: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
