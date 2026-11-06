/*
 * Compliance configuration – single source of truth for age gating,
 * shipping restrictions and Prop 65 notices.
 *
 * IMPORTANT: Firearms law changes frequently. This list is a conservative
 * default. Have your FFL compliance advisor / attorney review it before launch,
 * then edit the arrays below – every page reads from this file.
 */

/** Minimum age to enter the site / purchase (handguns & pistol uppers require 21; long guns 18). */
export const MIN_AGE = 21;

/** Categories (from products.ts) that are serialized firearms and MUST ship to an FFL. */
export const ffLCategories = ['complete-firearms', 'ar-15-lowers', 'ready-to-ship'];

/** Categories subject to state firearm / "assault weapon" restrictions. */
export const restrictedCategories = [
  'complete-firearms',
  'ready-to-ship',
  'ar-15-lowers',
  'ar-15-uppers',
  'ar-pistol-uppers',
];

/** States / jurisdictions where we do NOT ship restricted categories. */
export const noShipStates: { code: string; name: string }[] = [
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'IL', name: 'Illinois' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NY', name: 'New York' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'WA', name: 'Washington' },
];

/** Territories we do not ship any products to. */
export const noShipTerritories = ['Puerto Rico', 'Guam', 'U.S. Virgin Islands', 'APO/FPO addresses', 'International destinations'];

export const noShipStateNames = noShipStates.map((s) => s.name);

export const prop65Text =
  'WARNING: Cancer and Reproductive Harm – www.P65Warnings.ca.gov';

export const isFFLProduct = (category: string) => ffLCategories.includes(category);
export const isRestrictedProduct = (category: string) => restrictedCategories.includes(category);
