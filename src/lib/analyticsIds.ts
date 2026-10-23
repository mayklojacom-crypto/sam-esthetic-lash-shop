// Public tag IDs (they appear in every page request; not secrets).
export const GOOGLE_ADS_TAG_ID = 'AW-18052419500';
export const GOOGLE_ADS_PURCHASE_SEND_TO = 'AW-18052419500/xk4JCPjmp5McEKyfiKBD';
/** GA4 property 530657009, stream 14282741219 (samestheticlash.shop). */
export const GA4_MEASUREMENT_ID = 'G-BSHD3WSQRB';
export const META_PIXEL_ID = '1484172626568462';

/** New automatic sends (GA4 events, Ads purchase) only happen on these public domains. */
export const PUBLIC_HOSTS = ['samestheticlash.shop', 'www.samestheticlash.shop'];
export const isPublicHost = (host = typeof window !== 'undefined' ? window.location.hostname : '') => PUBLIC_HOSTS.includes(host);
