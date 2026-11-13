/*
 * WooCommerce Shop Products (Benchrest Rests, Front Tops, Tools & Accessories).
 *
 * Data lives in accessories.json, synced from the WooCommerce Store API by:
 *   python3 scripts/sync-accessories.py
 */
import data from './accessories.json';

export interface Product {
  id: string;
  wooId: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  wooCategory: string;
  slug: string;
  description: string;
  fullDescription: string[];
  highlights: string[];
  sku: string;
  inStock: boolean;
  featured?: boolean;
  specs?: Record<string, string>;
}

export const categories = [
  { name: 'All', slug: 'all' },
  { name: 'Optics & Cases', slug: 'optics-cases' },
  { name: 'Rests & Front Tops', slug: 'rests-tops' },
  { name: 'Tools & Accessories', slug: 'tools-parts' },
];

export const products: Product[] = data as Product[];
