# Cybex Precision Gunworx

Official Astro storefront and Cloudflare Worker for **Cybex Precision Gunworx** — competition-ready rimfire & centerfire rifles, precision rests, and gunsmithing tools built in Waterville, Ohio.

## Project Structure

```text
/
├── public/                 # Static assets, studio WebP images, hero videos, robots.txt
├── scripts/                # WooCommerce Store API catalog & image sync scripts
│   ├── import-ready-to-ship.py
│   └── sync-accessories.py
├── src/
│   ├── components/         # Reusable UI, cart drawer, age gate, compliance notices
│   ├── content/blog/       # Technical precision-shooting & FFL transfer articles
│   ├── data/               # Synced Ready-to-Ship rifles, accessories, & compliance data
│   ├── layouts/            # Base HTML layout, SEO metadata, & Schema.org JSON-LD
│   └── pages/              # Astro routes, guides, policies, sitemap.xml, & llms.txt endpoints
├── astro.config.mjs        # Astro site configuration
├── wrangler.jsonc          # Cloudflare Worker & static assets config
├── worker.js               # Cloudflare Worker entry point & WooCommerce cart handoff
└── package.json
```

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies (Node.js `>=22.12.0`) |
| `npm run dev` | Start local Astro dev server at `http://localhost:4321` |
| `npm run sync` | Sync Ready-to-Ship rifles and accessories from WooCommerce |
| `npm run build` | Build production static site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npx wrangler deploy` | Deploy Worker + `./dist/` assets to Cloudflare |
