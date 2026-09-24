import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cybexprecisiongunworx.com',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
