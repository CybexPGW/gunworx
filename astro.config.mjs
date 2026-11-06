import { defineConfig } from 'astro/config';

const WC_BACKEND = process.env.WC_BACKEND_URL || 'https://cybexprecisiongunworx.com';

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
    server: {
      proxy: {
        '/api/wc/store': {
          target: WC_BACKEND,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/wc\/store/, '/wp-json/wc/store/v1'),
        },
        '/api/wc/tokenize': {
          target: WC_BACKEND,
          changeOrigin: true,
          rewrite: () => '/?wc-ajax=acceptbluev2_tokenize',
        },
      },
    },
  },
});
