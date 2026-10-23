# Ecommerce measurement (frontend only, preview, not published)

Central module: `src/lib/analytics.ts`. All events go through it. No customer name, CPF, e-mail, phone or address is sent.

## Events
| Event | Where | When | Dedup |
|---|---|---|---|
| view_item | ProductDetail | product opened | once per product + navigation |
| add_to_cart | ProductDetail, ProductCard | user adds | per click |
| begin_checkout | Checkout | checkout opened with items | once per navigation |
| add_shipping_info | Checkout | signed freight quote available | once per quote |
| add_payment_info (pix) | Checkout | Pix QR generated (NOT a sale) | once per order reference |
| contato_whatsapp | Checkout, WhatsApp floating modal | WhatsApp opened (NOT a sale) | per click |
| purchase (+ Ads conversion) | /obrigado, /pagamento/status | only `confirmedPurchase`: exact reference, payment_status approved, database total, BRL | once per transaction_id per browser (localStorage), also when disabled, so nothing is replayed later |

Direct visits to /obrigado, pending orders, Pix generation and WhatsApp never send purchase.

## Not configured (everything is disabled until all are set)
1. `ga4MeasurementId`: null. No GA4 G- ID exists in this project. A GA4 config tag must also load it.
2. `adsPurchaseSendTo`: null. Needs `AW-18052419500/<label>` from the Google Ads purchase conversion action. Label unknown.
3. `consentGranted`: returns false. No consent banner/CMP exists. Must be connected to a real advertising/analytics consent choice.
4. Meta Pixel: existing PageView unchanged; no Meta ecommerce events added.
5. Existing tags in index.html (Meta Pixel, AW-18052419500 config) are unchanged and still load without consent.
6. Not covered: server-side purchase (webhook), gclid storage, purchase when the customer closes the page before the approval screen.
