import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Blog articles live in src/content/blog/*.md
 * The filename becomes the URL: getting-started.md -> /blog/getting-started/
 */
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(170),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Cybex Precision Gunworx'),
    category: z.enum(['Getting Started', 'Rimfire', 'Centerfire', 'Long Range', 'Buying Guide']),
    tags: z.array(z.string()).default([]),
    heroImage: z.string(),
    heroAlt: z.string(),
    /** Show matching Ready to Ship rifles at the end of the article. */
    rifles: z.enum(['rimfire', 'centerfire', 'all', 'none']).default('all'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
