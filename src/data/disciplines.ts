/*
 * Shooting disciplines used by the Rimfire vs. Centerfire guide.
 * Each discipline lists which Ready to Ship rifles fit it (matched by build
 * code prefix / caliber), so recommendations stay in sync with inventory.
 */
import { rifles, type Rifle } from './readyToShip';

export interface Discipline {
  id: string;
  name: string;
  platform: 'rimfire' | 'centerfire';
  tagline: string;
  distances: string;
  about: string;
  whatMatters: string[];
  bestFor: string;
  matches: (r: Rifle) => boolean;
}

const code = (r: Rifle) => (r.code ?? '').toUpperCase();
const cal = (r: Rifle) => r.caliber.toLowerCase();

export const disciplines: Discipline[] = [
  {
    id: 'prs-rimfire',
    name: 'PRS Rimfire & NRL22',
    platform: 'rimfire',
    tagline: 'Positional precision on a rimfire budget',
    distances: '25 – 300+ yards',
    about:
      'Timed, positional stages shot from barricades, props, and unconventional positions at steel targets. It is the same skill set as centerfire PRS, at a fraction of the cost per round, and it is one of the fastest-growing ways to get into precision shooting.',
    whatMatters: [
      'A chassis or adjustable stock that is stable on barricades and bags',
      'A smooth, repeatable action that cycles fast under time pressure',
      'A first-focal-plane scope with a usable MIL reticle for holdovers',
      'Weight and balance tuned for positional shooting',
    ],
    bestFor: 'New precision shooters, and centerfire PRS shooters who want affordable training.',
    matches: (r) => r.platform === 'rimfire' && code(r).startsWith('RX'),
  },
  {
    id: 'rimfire-benchrest',
    name: 'Rimfire Benchrest',
    platform: 'rimfire',
    tagline: 'Every X-ring counts',
    distances: '25 & 50 yards',
    about:
      'Score-based matches (such as ARA and IR 50/50) shot from a rest at small scoring rings. Wind reading and absolute mechanical consistency decide matches, often by a single X.',
    whatMatters: [
      'A benchrest action with a precise lockup (e.g. PQP / HoleShot designs)',
      'A match barrel paired with a tuner to dial in your ammunition lot',
      'A low-profile benchrest stock that tracks straight in the bags',
      'A light, crisp trigger measured in ounces',
    ],
    bestFor: 'Shooters chasing perfect scores and the tightest groups a .22 can produce.',
    matches: (r) => r.platform === 'rimfire' && code(r).startsWith('BR'),
  },
  {
    id: 'centerfire-prs',
    name: 'Centerfire PRS & NRL',
    platform: 'centerfire',
    tagline: 'Real distance, real wind',
    distances: '300 – 1,200 yards',
    about:
      'The centerfire version of positional precision: multi-stage matches with steel targets at real distance. Ballistics, wind calls, and speed under pressure are all tested.',
    whatMatters: [
      'A rigid action and match barrel with a twist suited to high-BC bullets',
      'A chassis with an ARCA rail and adjustable fit for positional work',
      'A threaded muzzle for a brake or suppressor to manage recoil',
      'A quality FFP scope with plenty of elevation, plus a 20-MOA rail',
    ],
    bestFor: 'Competitors ready to step up from rimfire, or anyone who wants to shoot steel at distance.',
    matches: (r) => r.platform === 'centerfire' && (cal(r).includes('creedmoor') || cal(r).includes('223')),
  },
  {
    id: 'centerfire-benchrest',
    name: 'Centerfire Benchrest',
    platform: 'centerfire',
    tagline: 'The pursuit of the one-hole group',
    distances: '100 – 300 yards',
    about:
      'Group and score benchrest is the most accuracy-focused discipline in shooting. The 6mm PPC has long been the standard in short-range group benchrest, and every component exists to remove variables.',
    whatMatters: [
      'A benchrest action (e.g. Kelbly’s Prometheus) in a bedded benchrest stock',
      'A heavy-contour barrel machined to match the action',
      'A cartridge known for inherent accuracy, such as the 6mm PPC',
      'An ultra-light trigger and a stock that tracks perfectly in the bags',
    ],
    bestFor: 'Accuracy purists who measure success in thousandths of an inch.',
    matches: (r) => r.platform === 'centerfire' && cal(r).includes('ppc'),
  },
  {
    id: 'elr',
    name: 'Long Range & ELR',
    platform: 'centerfire',
    tagline: 'Pushing past the horizon',
    distances: '1,000 yards to 1 mile+',
    about:
      'Long-range shooting stretches the limits of ballistics, optics, and wind reading. A heavy-barreled 6.5 Creedmoor is an excellent, manageable entry point. True ELR (well beyond a mile) usually moves to larger magnum cartridges, so call us if that is your goal.',
    whatMatters: [
      'A heavy barrel that stays consistent through long strings',
      'A scope with generous elevation travel, plus a 20-MOA (or more) rail',
      'A stable chassis or folding stock with room for a bipod and rear bag',
      'High-BC bullets and accurate ballistic data',
    ],
    bestFor: 'Shooters who want to see how far they can push it.',
    matches: (r) => r.platform === 'centerfire' && cal(r).includes('creedmoor'),
  },
];

export const riflesFor = (d: Discipline) => rifles.filter(d.matches);
