import type { APIRoute } from 'astro';
import { rifles, rifleUrl } from '../data/readyToShip';
import { products } from '../data/products';
import { getPosts, postUrl, SITE } from '../data/blog';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: string;
  images?: { loc: string; title: string }[];
}

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const buildDate = new Date().toISOString().split('T')[0];

  const entries: SitemapEntry[] = [
    {
      loc: `${SITE}/`,
      lastmod: buildDate,
      changefreq: 'daily',
      priority: '1.0',
      images: [
        {
          loc: `${SITE}/images/rifle-wall.webp`,
          title: 'Cybex Precision Gunworx Rimfire and Centerfire Competition Rifles',
        },
      ],
    },
    {
      loc: `${SITE}/ready-to-ship/`,
      lastmod: buildDate,
      changefreq: 'daily',
      priority: '0.95',
    },
    {
      loc: `${SITE}/shop/`,
      lastmod: buildDate,
      changefreq: 'weekly',
      priority: '0.9',
    },
    {
      loc: `${SITE}/guides/rimfire-vs-centerfire/`,
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.85',
      images: [
        {
          loc: `${SITE}/images/tool-room.webp`,
          title: 'Rimfire vs. Centerfire Precision Rifle Guide — Cybex Precision Gunworx',
        },
      ],
    },
    {
      loc: `${SITE}/about/`,
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.8',
      images: [
        {
          loc: `${SITE}/images/tool-room.webp`,
          title: 'Cybex Precision Gunworx Gunsmithing Tool Room',
        },
      ],
    },
    {
      loc: `${SITE}/ffl-transfer/`,
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.8',
    },
    {
      loc: `${SITE}/blog/`,
      lastmod: buildDate,
      changefreq: 'weekly',
      priority: '0.8',
    },
    {
      loc: `${SITE}/contact/`,
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.7',
    },
    ...rifles.map((r): SitemapEntry => ({
      loc: `${SITE}${rifleUrl(r)}`,
      lastmod: buildDate,
      changefreq: 'daily',
      priority: '0.9',
      images: r.images.map((img, i) => ({
        loc: img.startsWith('http') ? img : `${SITE}${img}`,
        title: i === 0 ? `${r.name} — ${r.caliber} Precision Rifle` : `${r.name} — View ${i + 1}`,
      })),
    })),
    ...products.map((p): SitemapEntry => {
      const imgs = p.images?.length ? p.images : [p.image];
      return {
        loc: `${SITE}/shop/${p.slug}/`,
        lastmod: buildDate,
        changefreq: 'weekly',
        priority: '0.85',
        images: imgs.filter(Boolean).map((img, i) => ({
          loc: img.startsWith('http') ? img : `${SITE}${img}`,
          title: i === 0 ? p.name : `${p.name} — View ${i + 1}`,
        })),
      };
    }),
    ...posts.map((p): SitemapEntry => ({
      loc: `${SITE}${postUrl(p)}`,
      lastmod: (p.data.updatedDate ?? p.data.pubDate).toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.75',
      images: p.data.heroImage
        ? [
            {
              loc: p.data.heroImage.startsWith('http') ? p.data.heroImage : `${SITE}${p.data.heroImage}`,
              title: p.data.title,
            },
          ]
        : undefined,
    })),
    ...['shipping', 'returns', 'restricted-states', 'terms', 'privacy'].map(
      (slug): SitemapEntry => ({
        loc: `${SITE}/policies/${slug}/`,
        lastmod: buildDate,
        changefreq: 'yearly',
        priority: '0.3',
      })
    ),
  ];

  const urlsXml = entries
    .map((e) => {
      const imgsXml = (e.images ?? [])
        .map(
          (im) => `    <image:image>
      <image:loc>${esc(im.loc)}</image:loc>
      <image:title>${esc(im.title)}</image:title>
    </image:image>`
        )
        .join('\n');

      return [
        '  <url>',
        `    <loc>${esc(e.loc)}</loc>`,
        e.lastmod ? `    <lastmod>${esc(e.lastmod)}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        imgsXml || null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

