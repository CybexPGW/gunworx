import type { APIRoute } from 'astro';
import { rifles, rifleUrl, fromPrice, formatPrice } from '../data/readyToShip';
import { products, categories } from '../data/products';
import { disciplines } from '../data/disciplines';
import { getPosts, postUrl, formatDate, SITE } from '../data/blog';

export const GET: APIRoute = async () => {
  const posts = await getPosts();

  const rifleBlocks = rifles.map((r) => {
    const base = fromPrice(r);
    const pkgLines =
      r.packages.length > 0
        ? r.packages.map((pkg) => `  - ${pkg.label}: ${formatPrice(pkg.price)}`).join('\n')
        : `  - Standard Build: ${formatPrice(base)}`;

    const specLines = r.specGroups
      .map((g) => {
        const items = g.items
          .map((it) => (it.label ? `    - ${it.label}: ${it.value}` : `    - ${it.value}`))
          .join('\n');
        return `  - **${g.title}**:\n${items}`;
      })
      .join('\n');

    return [
      `### ${r.name}${r.code ? ` (${r.code})` : ''}`,
      `- **URL**: ${SITE}${rifleUrl(r)}`,
      `- **SKU**: ${r.sku}`,
      `- **Platform**: ${r.platform === 'rimfire' ? 'Rimfire' : 'Centerfire'}`,
      `- **Caliber**: ${r.caliber}`,
      r.usage ? `- **Primary Discipline / Usage**: ${r.usage}` : null,
      `- **Availability**: In Stock — Ready to Ship to Your FFL`,
      `- **Starting Price**: ${formatPrice(base)}`,
      `- **Package Options**:\n${pkgLines}`,
      `- **Summary**: ${r.summary}`,
      r.description.length > 0 ? `- **Details**:\n${r.description.map((d) => `  ${d}`).join('\n\n')}` : null,
      specLines ? `- **Full Component Specifications**:\n${specLines}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  });

  const productBlocks = products.map((p) => {
    const catName = categories.find((c) => c.slug === p.category)?.name ?? p.category;
    const desc = p.fullDescription?.length ? p.fullDescription.join(' ') : p.description;
    const highlights = p.highlights?.length
      ? `- **Key Features**:\n${p.highlights.map((h) => `  - ${h}`).join('\n')}`
      : null;
    return [
      `### ${p.name}`,
      `- **URL**: ${SITE}/shop/${p.slug}/`,
      `- **Category**: ${catName}`,
      p.sku ? `- **SKU**: ${p.sku}` : null,
      `- **Price**: $${p.price.toFixed(2)} USD`,
      `- **Stock Status**: ${p.inStock ? 'In Stock' : 'Out of Stock'}`,
      `- **Description**: ${desc}`,
      highlights,
    ]
      .filter(Boolean)
      .join('\n');
  });

  const disciplineBlocks = disciplines.map((d) => {
    const matching = rifles.filter(d.matches);
    return [
      `### ${d.name} (${d.platform === 'rimfire' ? 'Rimfire' : 'Centerfire'})`,
      `- **Typical Distances**: ${d.distances}`,
      `- **Overview**: ${d.about}`,
      `- **Best For**: ${d.bestFor}`,
      `- **What Matters Most**:\n${d.whatMatters.map((w) => `  - ${w}`).join('\n')}`,
      matching.length > 0
        ? `- **In-Stock Matching Rifles**: ${matching.map((r) => `[${r.name}](${SITE}${rifleUrl(r)})`).join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');
  });

  const articleBlocks = posts.map((p) =>
    [
      `### ${p.data.title}`,
      `- **URL**: ${SITE}${postUrl(p)}`,
      `- **Category**: ${p.data.category}`,
      `- **Published**: ${formatDate(p.data.pubDate)}`,
      `- **Summary**: ${p.data.description}`,
      '',
      (p.body ?? '').trim(),
    ].join('\n')
  );

  const doc = [
    '# Cybex Precision Gunworx — Complete AI & Search Knowledge Base',
    '',
    '> Hand-built precision rimfire and centerfire competition rifles, Precision Quest Products (PQP) benchrest rests and maintenance tools, and $25 FFL transfer services based in Toledo, Ohio.',
    '',
    '## Company Profile & Contact Information',
    '',
    '- **Business Name**: Cybex Precision Gunworx',
    '- **Location**: Toledo, Ohio, United States',
    '- **Phone**: (419) 740-0456',
    '- **Email**: Info@CybexInc.com',
    `- **Primary Website**: ${SITE}`,
    `- **Concise AI Index**: ${SITE}/llms.txt`,
    '- **Facebook**: https://www.facebook.com/CybexPrecisionGunworx',
    '- **Instagram**: https://www.instagram.com/cybexprecisiongunworx',
    '',
    '## Build Philosophy: Built as a System, Ready to Compete',
    '',
    'Our process is built around a single objective: to deliver competition-ready rifles without the delays or guesswork. Each rifle is thoughtfully configured using proven, high-performance components—from precision actions and match-grade barrels to carefully selected stocks or chassis systems. For rimfire platforms, we incorporate tuners to achieve measurable performance gains. Optics are selected as an integrated part of the system, ensuring complete synergy rather than serving as an afterthought.',
    '',
    'Every rifle is professionally assembled, test-fired, and zeroed prior to shipment (50 yards for rimfire, 100 yards for centerfire when configured with an optic). Each package also includes an optional Arken scope and custom-cut foam case tailored specifically to your setup, providing immediate protection for your investment.',
    '',
    'Equally important, these are not made-to-order builds with extended 12-month lead times. Every Ready-to-Ship rifle listed below is in stock and available for immediate shipment to your licensed FFL dealer.',
    '',
    '## FFL Transfer & Shipping Compliance',
    '',
    '- **Local FFL Transfers (Toledo, OH)**: Flat-rate $25.00 transfer fee, same-day processing when possible, NICS background check, valid government-issued photo ID required (21+ for handguns, 18+ for long guns). Contact (419) 740-0456 or Info@CybexInc.com for FFL license exchange.',
    '- **Out-of-State / Online Firearm Orders**: All serialized firearms ship exclusively to a licensed Federal Firearms Licensee (FFL). Buyers provide their receiving dealer\'s info at checkout or have their dealer email their FFL copy.',
    '- **Shipping Restrictions**: We do not ship where restrictions apply. All shipment of firearms MUST COMPLY with ATF constraints and state-mandated restrictions.',
    '',
    '---',
    '',
    `## Ready-to-Ship Precision Rifles (${rifles.length} In-Stock Builds)`,
    '',
    ...rifleBlocks.flatMap((b) => [b, '']),
    '---',
    '',
    `## Benchrest Rests, Front Tops & Precision Tools (${products.length} Products)`,
    '',
    ...productBlocks.flatMap((b) => [b, '']),
    '---',
    '',
    '## Precision Shooting Disciplines & Buyer Guidance',
    '',
    `Full interactive guide: ${SITE}/guides/rimfire-vs-centerfire/`,
    '',
    ...disciplineBlocks.flatMap((b) => [b, '']),
    '### Frequently Asked Questions',
    '',
    '- **What is the difference between rimfire and centerfire ammunition?** Centerfire ammunition uses a separate primer seated in the center of the case base. Rimfire ammunition holds its priming compound inside the hollow rim of the case, and the firing pin strikes the rim to ignite it.',
    '- **Can you reload rimfire ammunition?** Conventional rimfire ammunition is not designed to be reloaded. Precision rimfire shooters lot-test factory match ammunition (such as Lapua, Eley, SK, and RWS) to find the lot that groups tightest in their barrel.',
    '- **What does a barrel tuner do on a rimfire rifle?** A tuner is an adjustable muzzle weight that shifts barrel harmonics so bullets exit at a consistent node, tightening groups and reducing vertical dispersion for a given ammo lot.',
    '- **Do Cybex rifles arrive ready to shoot?** Yes. Every rifle is professionally assembled, test-fired with match-grade ammunition, and cleaned. Scoped rifle packages are zeroed prior to shipment and ship in a custom-cut foam case to your FFL dealer.',
    '',
    '---',
    '',
    '## Technical Articles & Guides',
    '',
    ...articleBlocks.flatMap((b) => [b, '']),
  ].join('\n');

  return new Response(doc, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'all',
    },
  });
};

