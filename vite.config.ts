import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Extension pages: the popup (index.html, the manifest's default_popup) and the side panel.
// The content script is built separately as one classic script (vite.content.config.ts),
// because Chrome does not load content scripts as ES modules.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      'global-input-mobile': resolve(__dirname, 'src/global-input-mobile'),
      'global-input-config': resolve(__dirname, 'src/global-input-config'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
}));
