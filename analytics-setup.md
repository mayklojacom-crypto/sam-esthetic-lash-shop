# Ecommerce measurement and cookie choice (preview only, not published)

Modules: `src/lib/analytics.ts` (events), `src/lib/consent.ts` (cookie choice + Google/Meta tag loading), `src/components/CookieConsent.tsx` (banner). No customer name, CPF, e-mail, phone or address is sent.

## Cookie choice
- Banner with "Recusar" and "Aceitar" (equal buttons, nothing preselected) shown to every visitor until a choice is made.
- Stored in localStorage `sam_cookie_consent`: `{ choice, at (ISO time), version }`. Version `v1-2026-10` resolves to the notice text `CONSENT_NOTICE` in consent.ts (Google Ads/Analytics and Meta, measurement and ads).
- Review/change: "Cookies" link in the homepage footer. Change in another tab applies via storage event.
- No choice or refused: Google tag (AW-18052419500) and Meta Pixel (1484172626568462) are NOT loaded; no requests to Google/Meta (browser-checked).
- Accepted: Google tag and Meta Pixel load (PageView), and ecommerce events can be sent.
- Accepted then refused: Google `consent update` denied, Meta `fbq('consent','revoke')`, and new events stop. Old blocked events are never replayed.
- Refusing never blocks cart, checkout or Pix payment.
- The `<noscript>` Meta pixel was removed, because it fired without consent.
- Inline tags were removed from index.html; the same IDs now load from consent.ts.

## Destinations (independent; all need accepted cookies AND a public domain)
Public domains: `samestheticlash.shop`, `www.samestheticlash.shop` (`src/lib/analyticsIds.ts`). On any other host (preview, lash-glam-shop.lovable.app, localhost) GA4 is not configured and events/Ads purchase go only to a local log `window.__samAnalytics`; nothing is sent to production accounts.

| Destination | Value | State |
|---|---|---|
| GA4 | property 530657009, stream 14282741219, measurement ID in `analyticsIds.ts` (public tag ID) | Active on public domains with consent. `send_page_view: false`; `RouteTracker` sends one page_view per SPA navigation (no query string, admin excluded) |
| Google Ads purchase ("Compra (1)") | `AW-18052419500/xk4JCPjmp5McEKyfiKBD` | Active on public domains with consent; independent of GA4 |
| Google Ads tag AW-18052419500 / Meta Pixel PageView | existing | Load with consent on any host (unchanged behaviour) |

## Events
| Event | Where | When | Dedup | Destination today |
|---|---|---|---|---|
| page_view | RouteTracker (App) | each SPA navigation | once per navigation entry | GA4 |
| view_item | ProductDetail | product opened | once per product + navigation | GA4 |
| add_to_cart | ProductDetail, ProductCard | user adds | per click | GA4 |
| begin_checkout | Checkout | opened with items | once per navigation | GA4 |
| add_shipping_info | Checkout | signed freight quote | once per quote | GA4 |
| add_payment_info (pix) | Checkout | Pix QR generated, NOT a sale | once per reference | GA4 |
| contato_whatsapp | Checkout, WhatsApp modal | WhatsApp opened, NOT a sale | per click | GA4 |
| purchase / Ads conversion | /obrigado, /pagamento/status | only `confirmedPurchase` (exact reference, approved, database total, BRL) | once per transaction_id per browser, also when blocked | Ads + GA4 |

## Pending / not covered
1. Real GA4/Ads receipt is verifiable only after publishing on samestheticlash.shop (GA4 DebugView / Ads diagnostics).
2. Google Ads goals: "Compra (1)" is inactive in Ads; the GA4 "ads_conversion_Compra_1" goal (page visit to /obrigado) should not be primary. Must be adjusted in Google Ads.
3. Privacy policy page naming Google/Meta has not been created.
4. A purchase is not counted if the customer closes the page before the approval screen (no server-side sending).
5. The banner is shown to everyone (not only regulated regions), as requested.
