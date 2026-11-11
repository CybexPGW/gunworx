/*
 * Ready to Ship rifles.
 *
 * Data lives in readyToShip.json, synced from the WooCommerce Store API by
 *   python3 scripts/import-ready-to-ship.py
 * Edit the JSON directly (or re-run `npm run sync`) to update inventory.
 */
import data from './readyToShip.json';

export interface SpecItem { label: string | null; value: string }
export interface SpecGroup { title: string; items: SpecItem[] }
export interface Package { label: string; price: number }

export interface Rifle {
  id: string;
  wooId: number;
  sku: string;
  code: string | null;
  name: string;
  slug: string;
  /** Base price (lowest package). */
  price: number;
  /** Optional package choices; empty = single price. */
  packages: Package[];
  inStock: boolean;
  platform: 'rimfire' | 'centerfire';
  caliber: string;
  usage: string;
  images: string[];
  imageBgs?: string[];
  scopedInPhoto?: boolean;
  summary: string;
  description: string[];
  specGroups: SpecGroup[];
}

/** Compliance category used by ComplianceNotice / compliance.ts */
export const RTS_CATEGORY = 'ready-to-ship';

export const rifles: Rifle[] = (data as Rifle[]).filter((r) => r.inStock);

export const rifleUrl = (r: Rifle) => `/ready-to-ship/${r.slug}/`;

export const formatPrice = (n: number) =>
  n > 0
    ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : 'Call for Price';

/** Lowest price a rifle can be bought for. */
export const fromPrice = (r: Rifle) => (r.packages.length ? Math.min(...r.packages.map((p) => p.price)) : r.price);

/** Look up a spec value, e.g. spec(r, 'Action', 'Manufacturer'). */
export const spec = (r: Rifle, group: string, label: string) =>
  r.specGroups
    .find((g) => g.title.toLowerCase().startsWith(group.toLowerCase()))
    ?.items.find((i) => (i.label ?? '').toLowerCase() === label.toLowerCase())?.value ?? '';

/** Short "Action · Barrel" line for cards. */
export const keyComponents = (r: Rifle) =>
  [
    [spec(r, 'Action', 'Manufacturer'), spec(r, 'Action', 'Model')].filter(Boolean).join(' '),
    spec(r, 'Barrel', 'Manufacturer') && `${spec(r, 'Barrel', 'Manufacturer')} barrel`,
  ]
    .filter(Boolean)
    .join(' · ');
