import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset URLs: preview builds are served from /builds/<branch>/<sha>/
  // (see azure-cicd/templates/mockup-docker-template.yaml). Safe because the
  // apps route on the URL hash, so the document path never changes.
  base: "./",
  server: {
    port: Number(process.env.PORT) || 5177,
    host: true,
  },
  preview: { host: true, allowedHosts: true },
});
