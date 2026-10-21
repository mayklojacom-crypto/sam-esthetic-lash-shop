# Pix freight verification

Owner authorized deploying payment verification, preserving Mercado Pago and not publishing the site.

- local-route-freight now issues HMAC-signed six-hour address-bound route quotes using an existing server-only key; signatures contain no credentials. Cached route metres are retained unrounded. Payment rejects stale tariff versions, expired/modified tokens, changed CEP/number and destinations outside the served municipalities.
- Both Mercado Pago payment functions derive product identities, active status, stock, sizes and prices from products and validate active coupon codes before inserting orders or calling Mercado Pago. Freight is recalculated from the authenticated route metres, never browser prices. Changed totals return 409 and require another customer confirmation.
- Discount and freight adjustment lines preserve downstream order item totals. No tables, RLS or permissions were changed.
- Checkout uses the signed quote to enable the Pix request; older unsigned quotes require recalculation, and the house number must match. Server errors are surfaced and revised totals displayed before another attempt.
- Deployed local-route-freight, create-pix-payment and create-mp-preference. No site publication.
- 100 targeted tests passed (36 server pricing/signature, 54 checkout rules, 6 delivery context, 4 verified-order tests). Deployed payment functions returned 400 on invalid input before any order/payment creation.
- Browser verification: real catalog product added, checkout opened without runtime errors; consultation precedes personal data, no-delivery continuation disabled, freight remains pending.
- Google-dependent rendering/API checks were deliberately not run under the connector sandbox limitation. No mocks, real orders, real payment QR codes or WhatsApp messages were generated. The complete valid quote-to-QR flow remains unverified; owner must recalculate freight with the address number and generate Pix on an authorized deployed origin.
- Route lookup remains the existing public endpoint and carries usage costs; signed quote verification avoids an additional Google request during payment. This task did not alter its access model.