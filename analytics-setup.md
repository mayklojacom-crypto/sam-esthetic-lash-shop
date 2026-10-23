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

## Destinations (enabled independently, both need accepted cookies)
| Destination | Value | State |
|---|---|---|
| Google Ads purchase ("Compra (1)") | `AW-18052419500/xk4JCPjmp5McEKyfiKBD` | Configured; sends `conversion` with transaction_id, BRL, value after an approved order, when accepted |
| GA4 | `ga4MeasurementId: null` | NOT configured; waiting for the existing property ID. No GA4 events are sent and no GA4 tag is loaded |
| Meta | Pixel PageView only | No Meta ecommerce/Purchase events |

## Events
| Event | Where | When | Dedup | Destination today |
|---|---|---|---|---|
| view_item | ProductDetail | product opened | once per product + navigation | GA4 (off) |
| add_to_cart | ProductDetail, ProductCard | user adds | per click | GA4 (off) |
| begin_checkout | Checkout | opened with items | once per navigation | GA4 (off) |
| add_shipping_info | Checkout | signed freight quote | once per quote | GA4 (off) |
| add_payment_info (pix) | Checkout | Pix QR generated, NOT a sale | once per reference | GA4 (off) |
| contato_whatsapp | Checkout, WhatsApp modal | WhatsApp opened, NOT a sale | per click | GA4 (off) |
| purchase / Ads conversion | /obrigado, /pagamento/status | only `confirmedPurchase` (exact reference, approved, database total, BRL) | once per transaction_id per browser, also when blocked | Ads (on with consent), GA4 (off) |

## Pending / not covered
1. GA4 measurement ID (and loading its tag) — waiting for the owner.
2. Google Ads goals: "Compra (1)" is inactive in Ads; the GA4 "ads_conversion_Compra_1" goal (page visit to /obrigado) should not be primary. Must be adjusted in Google Ads.
3. Privacy policy page naming Google/Meta has not been created.
4. A purchase is not counted if the customer closes the page before the approval screen (no server-side sending).
5. The banner is shown to everyone (not only regulated regions), as requested.
