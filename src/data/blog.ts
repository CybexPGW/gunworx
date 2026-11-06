import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const SITE = 'https://cybexprecisiongunworx.com';

/** All published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const postUrl = (post: Post) => `/blog/${post.id}/`;

/** ~225 words per minute, minimum 1 minute. */
export function readingTime(body = ''): number {
  const words = body.replace(/[#>*_`|\-\[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export const categorySlug = (c: string) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-');
