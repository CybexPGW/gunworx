/** Shop location shown in the footer, contact and about pages, and LocalBusiness data. */
export const shop = {
  street: '9540 Airport Hwy',
  city: 'Monclova',
  region: 'OH',
  postalCode: '43542',
  country: 'US',
  hours: 'By appointment only',
} as const;

export const shopAddressLine = `${shop.street}, ${shop.city}, ${shop.region} ${shop.postalCode}`;

export const shopMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopAddressLine)}`;
