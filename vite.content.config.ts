import { defineConfig } from 'vite';
import { resolve } from 'path';

// The content script: one self-contained classic script (IIFE) added to the build folder
// after the extension pages are built.
export default defineConfig({
  build: {
    outDir: 'build',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      formats: ['iife'],
      name: 'globalInputContent',
      fileName: () => 'content.js',
    },
  },
});
