import type { APIRoute } from 'astro';
import { rifles, rifleUrl, fromPrice, formatPrice, keyComponents } from '../data/readyToShip';
import { products } from '../data/products';
import { getPosts, postUrl, SITE } from '../data/blog';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const rimfire = rifles.filter((r) => r.platform === 'rimfire');
  const centerfire = rifles.filter((r) => r.platform === 'centerfire');

  const formatRifleLine = (r: (typeof rifles)[number]) => {
    const priceStr = formatPrice(fromPrice(r));
    const comps = keyComponents(r);
    const meta = [
      r.code ? `Build ${r.code}` : null,
      r.caliber,
      comps || null,
      r.usage ? `For ${r.usage}` : null,
      priceStr === 'Call for Price' ? 'Call for Price' : `From ${priceStr}`,
    ]
      .filter(Boolean)
      .join(' · ');
    return `- [${r.name}](${SITE}${rifleUrl(r)}): ${meta}. ${r.summary}`;
  };

  const formatProductLine = (p: (typeof products)[number]) => {
    const status = p.inStock ? `$${p.price.toFixed(2)} (In Stock)` : `$${p.price.toFixed(2)} (Out of Stock)`;
    return `- [${p.name}](${SITE}/shop/${p.slug}/): ${status} — ${p.description}`;
  };

  const lines: string[] = [
    '# Cybex Precision Gunworx',
    '',
    '> Hand-built precision rimfire and centerfire competition rifles, Precision Quest Products (PQP) benchrest rests and tools, and $25 FFL transfer services in Toledo, Ohio. Every Ready-to-Ship rifle is professionally assembled from proven match-grade components, test-fired, zeroed, and in stock for immediate shipment to a licensed FFL dealer.',
    '',
    'Cybex Precision Gunworx builds competition-ready bolt-action precision rifles for rimfire benchrest (ARA, IR 50/50), PRS Rimfire & NRL22, centerfire PRS/NRL, 6mm PPC short-range benchrest, F-Class, and long-range / ELR shooting. Builds feature actions and components from Kelbly\'s, BAT Machine Co., PQP / HoleShot Arms (2500X & Trident), Zermatt Arms (RimX), MasterPiece Arms (MPA), Foundation, McMillan, Krieger, Bartlein, MullerWorks, Shilen, Bix\'n Andy, TriggerTech, Arken Optics, and custom-cut Gunfoam cases.',
    '',
    '- **Location**: Toledo, Ohio, USA',
    '- **Phone**: (419) 740-0456',
    '- **Email**: jmurphy@cybexinc.com',
    `- **Website**: ${SITE}`,
    '- **FFL Compliance**: All serialized firearms ship exclusively to a valid Federal Firearms Licensee (FFL). Non-serialized rests, tops, and maintenance tools ship directly where permitted. We do not ship where restrictions apply; all firearm shipments comply with ATF constraints and state-mandated restrictions.',
    '',
    '## Core Pages',
    '',
    `- [Home](${SITE}/): Overview of Cybex Precision Gunworx, featured Ready-to-Ship rifles, PQP benchrest equipment, and partner brands.`,
    `- [Ready-to-Ship Precision Rifles](${SITE}/ready-to-ship/): Live inventory of ${rifles.length} in-stock rimfire and centerfire competition rifles ready for immediate FFL shipment.`,
    `- [Shop Benchrest Rests & Accessories](${SITE}/shop/): Precision Quest Products (PQP) mechanical rests, 1-piece rests, front tops, boreguides, action wrenches, and bolt tools.`,
    `- [Rimfire vs. Centerfire Shooter's Guide](${SITE}/guides/rimfire-vs-centerfire/): Comprehensive comparison of priming systems, ammunition, competition disciplines (PRS Rimfire, NRL22, ARA/IR 50/50 Benchrest, Centerfire PRS, 6mm PPC Benchrest, ELR), FAQs, and rifle recommendations.`,
    `- [About Cybex Precision Gunworx](${SITE}/about/): Origin story, system-based build philosophy, component selection, test-firing & zeroing process, and optional Arken scope + custom-cut foam case packages.`,
    `- [FFL Transfer Service](${SITE}/ffl-transfer/): Flat-rate $25 local FFL transfers in Toledo, Ohio, plus instructions for shipping Cybex rifles to your receiving FFL dealer.`,
    `- [Contact Us](${SITE}/contact/): Direct builder contact via phone (419) 740-0456, email jmurphy@cybexinc.com, or inquiry form.`,
    '',
    `## Ready-to-Ship Rimfire Rifles (${rimfire.length} In Stock)`,
    '',
    ...rimfire.map(formatRifleLine),
    '',
    `## Ready-to-Ship Centerfire Rifles (${centerfire.length} In Stock)`,
    '',
    ...centerfire.map(formatRifleLine),
    '',
    `## Benchrest Rests, Front Tops & Precision Tools (${products.length} Products)`,
    '',
    ...products.map(formatProductLine),
    '',
    '## Technical Guides & Blog Articles',
    '',
    `- [Rimfire vs. Centerfire: Which Precision Rifle Is Right for You?](${SITE}/guides/rimfire-vs-centerfire/): Side-by-side comparison of rimfire and centerfire platforms, costs, barrel life, wind reading, and discipline-specific rifle picks.`,
    ...posts.map(
      (p) => `- [${p.data.title}](${SITE}${postUrl(p)}): ${p.data.description}`
    ),
    '',
    '## Policies & Legal Compliance',
    '',
    `- [Shipping & Delivery Policy](${SITE}/policies/shipping/): FFL firearm shipping workflow, adult signature rules, and accessory shipping details.`,
    `- [Return & Refund Policy](${SITE}/policies/returns/): Return eligibility, inspection windows, and firearm transfer finality rules.`,
    `- [Restricted States & Legal Notices](${SITE}/policies/restricted-states/): State/local compliance rules, buyer verification responsibilities, and California Prop 65 notice.`,
    `- [Terms & Conditions](${SITE}/policies/terms/): Terms of sale, age requirements (21+), and compliance terms.`,
    `- [Privacy Policy](${SITE}/policies/privacy/): Customer data handling, FFL record retention, and privacy rights.`,
    '',
    '## Optional',
    '',
    `- [Full AI Knowledge Base (llms-full.txt)](${SITE}/llms-full.txt): Complete inline specifications for every Ready-to-Ship rifle, package pricing, benchrest tool specs, discipline FAQs, and full technical articles.`,
    `- [Blog RSS Feed](${SITE}/rss.xml): XML feed of precision shooting guides and articles.`,
    `- [XML Sitemap](${SITE}/sitemap.xml): Complete search engine and image sitemap.`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'all',
    },
  });
};

