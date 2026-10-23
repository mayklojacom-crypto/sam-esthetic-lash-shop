// Cookie choice for Google (AW-18052419500) and Meta Pixel tags. No choice = nothing loads.
export const CONSENT_KEY = 'sam_cookie_consent';
export const CONSENT_VERSION = 'v1-2026-10';
export const CONSENT_NOTICE =
  'Usamos cookies do Google (Google Ads e Analytics) e da Meta (Facebook/Instagram) para medir visitas, compras e melhorar nossos anúncios. Nenhum nome, CPF, e-mail, telefone ou endereço é enviado.';
import { GA4_MEASUREMENT_ID, GOOGLE_ADS_TAG_ID as GOOGLE_TAG_ID, META_PIXEL_ID, isPublicHost } from './analyticsIds';
export { GOOGLE_TAG_ID, META_PIXEL_ID };

export type ConsentChoice = 'granted' | 'denied';
export interface ConsentRecord { choice: ConsentChoice; at: string; version: string }

export function readConsent(): ConsentRecord | null {
  try {
    const v = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    return v && (v.choice === 'granted' || v.choice === 'denied') && v.version === CONSENT_VERSION ? v : null;
  } catch { return null; }
}

export const hasAdConsent = () => readConsent()?.choice === 'granted';

type Fn = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; push?: unknown; loaded?: boolean; version?: string };
interface TagWindow { dataLayer?: unknown[]; gtag?: Fn; fbq?: Fn; _fbq?: Fn }
const w = () => window as unknown as TagWindow;
let googleLoaded = false;
let metaLoaded = false;

function loadScript(src: string) {
  const s = document.createElement('script');
  s.async = true; s.src = src;
  document.head.appendChild(s);
}

function ensureGtag() {
  const win = w();
  win.dataLayer = win.dataLayer || [];
  if (!win.gtag) win.gtag = function gtag() { // eslint-disable-next-line prefer-rest-params
    win.dataLayer!.push(arguments); } as Fn;
  return win.gtag;
}

function loadGoogle() {
  const gtag = ensureGtag();
  if (googleLoaded) { gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' }); return; }
  googleLoaded = true;
  gtag('consent', 'default', { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
  gtag('js', new Date());
  gtag('config', GOOGLE_TAG_ID);
  // GA4 only on the public domains; page_view is sent by RouteTracker on every SPA navigation (no automatic one).
  if (isPublicHost()) gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`);
}

function loadMeta() {
  const win = w();
  if (metaLoaded) { win.fbq?.('consent', 'grant'); return; }
  metaLoaded = true;
  if (!win.fbq) {
    const n = function (...args: unknown[]) { n.callMethod ? n.callMethod.apply(n, args) : n.queue!.push(args); } as Fn;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    win.fbq = n; if (!win._fbq) win._fbq = n;
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
  }
  win.fbq!('consent', 'grant');
  win.fbq!('init', META_PIXEL_ID, {}, { agent: 'lovable' });
  win.fbq!('track', 'PageView');
}

function revoke() {
  const win = w();
  if (googleLoaded) win.gtag?.('consent', 'update', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  if (metaLoaded) win.fbq?.('consent', 'revoke');
}

export function applyConsent() {
  if (hasAdConsent()) { loadGoogle(); loadMeta(); } else revoke();
}

export function saveConsent(choice: ConsentChoice) {
  const record: ConsentRecord = { choice, at: new Date().toISOString(), version: CONSENT_VERSION };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(record)); } catch { /* ignore */ }
  applyConsent();
  window.dispatchEvent(new Event('sam-consent-change'));
}

export const OPEN_SETTINGS_EVENT = 'sam-open-cookie-settings';
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));

/** Applies stored choice at start and follows changes from other tabs. */
export function initConsent() {
  applyConsent();
  window.addEventListener('storage', e => { if (e.key === CONSENT_KEY) { applyConsent(); window.dispatchEvent(new Event('sam-consent-change')); } });
}
