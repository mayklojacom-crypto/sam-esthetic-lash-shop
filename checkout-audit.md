# Sam Esthetic checkout review

## Completed
- CEP consultation in cart and the first checkout step, using the existing ViaCEP lookup.
- Municipality + GO validation, without postcode prefix assumptions.
- Reused local delivery selection, editable and stored in sessionStorage; no customer identifiers in this selection.
- Owner-defined tariff implemented in checkoutRules: origin CEP 74963-580; below 5 km R$7; at/above 5 km R$1.20 × the TOTAL unrounded road-route distance, rounding the final price only. Unknown freight remains null, not free delivery.
- Subtotal, pending freight and pending full total displayed before personal data. Existing payment-required fields/validation preserved in later steps.
- Brazilian currency formatting; no invented Pix-specific discount or unsupported instalment promise on product cards, product page or checkout.
- Pending freight blocks Pix creation rather than charging an incomplete/incorrect total. Existing payment functions and credentials are unchanged.
- URL status cannot approve a payment or clear the cart. Confirmation pages read the existing exact-reference order lookup and require approved payment status.
- Removed the unconditional Meta Purchase from the thank-you page. No replacement event is enabled without a verified transaction and established consent.
- Floating WhatsApp hidden on cart/checkout so it cannot bypass consultation or overlap controls there.
- Global delivery ticker and homepage footer no longer promise universal 30-minute delivery or an invented cutoff.

## Analytics audit and blockers
- Existing Meta Pixel: 1484172626568462; existing Google Ads tag: AW-18052419500. Preserved, not replaced.
- No GA4 G- measurement ID found. No Ads purchase conversion action label found. No established consent configuration found.
- view_item, add_to_cart and begin_checkout are not configured in the inspected application; purchase was an unvalidated Meta page-mount event and has been removed. These events are not declared resolved.
- Existing PageView tags still load unconditionally in index.html; this review did not change credentials, IDs or invent a consent mechanism. Consent configuration remains a prerequisite for new ecommerce tracking.
- confirmedPurchase returns only a verified transaction_id, BRL and database order total; no name, CPF, email or phone. It is a validation helper, not an enabled analytics sender. Consequently no new purchase event or event deduplication sender is claimed operational.
- No existing usable automatic road-route quotation exists: calculate-shipping is a legacy PAC/SEDEX calculator, not local road routing. ViaCEP resolves postal addresses only. The commercial tariff is now defined, but actual route distance is still unavailable.
- Checkout previously displayed coupon reductions without sending them to create-pix-payment. Payment functions remain unchanged, and Pix remains unavailable with pending local freight, so this mismatch cannot generate an incorrect charge in the revised local flow. Server-validated coupon support is a prerequisite for enabling discounted online payments.
- Product instalment advertising was removed because the active checkout offers Pix/WhatsApp, not card preference creation. The existing card preference function remains untouched.
- Existing banner artwork and metadata may still contain earlier delivery claims; artwork was not replaced, and index.html was not edited.

## Verification
- 16 unit tests in src/test/checkoutRules.test.ts: served cities, state checks, pending vs explicitly free freight, totals/coupon rounding, BRL formatting, and approved-only exact-reference transaction validation.
- 4 hook tests in src/test/useVerifiedOrder.test.tsx: empty reference, exact-reference approved read, pending order and lookup error. All 20 tests passed.
- Live browser: real catalog item added, real Goiânia and Aparecida CEP lookup, cart-to-checkout delivery reuse, data deferred, pending freight, disabled Pix, São Paulo address rejected, simulated network outage/retry, mobile/desktop layout and unvalidated payment return retaining cart.
- Direct thank-you without a reference does not display success or emit Purchase.
- No real order/payment creation, no WhatsApp send, no customer record/stock/credential/RLS changes, no publishing.
- Approved confirmation UI was exercised using a synthetic mocked lookup; a real paid transaction was intentionally not created or claimed tested.

## Owner-defined freight update (2026-10-21)
- Google Maps Platform (managed by Lovable) is accessible in the workspace but NOT linked to this project. It is a candidate for Routes API, not an operational or verified route provider here. No connection, credentials, paid request or API contract was created; no live Maps test was attempted under the sandbox limitation.
- No alternate existing road-route provider was found in application code or accessible connections. ViaCEP remains the existing address lookup, not evidence of distance. No coordinates or route distances were fabricated and no straight-line approximation is used.
- The tariff and origin are disclosed in the cart and first checkout step before personal data. Rota/frete confirmation via WhatsApp remains the alternative. A CEP-only lookup does not establish an exact street-number route or a payable quote.
- Pure freightForRoadRoute validates served municipality + GO, road-route status/type, exact origin/destination CEP and finite nonnegative metres. It is NOT a server-issued quote and is intentionally not connected to payment. Unit route fixtures are synthetic boundary inputs, not measured journeys.
- Shared delivery selection still persists only pending freight. Client-edited numeric freight cannot be restored from session storage; invalid freight keeps totals pending. Both cart and checkout summaries consume the same delivery price.
- 60 tests pass across checkoutRules, DeliveryContext and useVerifiedOrder, including 4.99 / 5 / 5.01 km, 10 km, unrounded distance, negative/non-finite/overflow values, destinations outside cities/GO, route failure/mismatch/non-road data, totals, and client-storage tampering.
- Browser check uses a real available catalog product and real origin CEP lookup, reuses delivery in checkout, verifies tariff before data, pending totals, disabled Pix, rejects an outside-city CEP and tests address-lookup failure. Route failure is unit-tested; real route calls remain unavailable/unverified. All function POSTs were blocked in the browser test, including incidental visit telemetry; no real orders, payments, leads or WhatsApp messages were created.

### Necessary before enabling online quoted payment (not implemented/deployed)
- An authorized usable road-route provider plus an exact destination address/number and trusted, expiring server quote bound to that destination; revalidate distance and calculate tariff server-side from authoritative data, never from client price/km.
- Existing create-pix-payment and create-mp-preference currently trust submitted item prices/quantities and have no server-side freight/coupon verification. Both need canonical product/discount/freight totals and quote revalidation before enabling online payment. The current frontend block does not secure direct calls to those existing deployed endpoints.
- Server payment changes must include approved amount/currency comparison against the canonical order total; storage/permissions may be needed if a persistent quote record is selected. These requirements are reported only: no payment integration, function, RLS, permission, catalog, price, stock or deployment was changed.

## Changed files
- src/App.tsx
- src/contexts/DeliveryContext.tsx
- src/lib/checkoutRules.ts
- src/hooks/useVerifiedOrder.ts
- src/components/DeliveryConsultation.tsx
- src/components/CheckoutTotals.tsx
- src/components/DeliveryTickerBar.tsx
- src/components/ProductCard.tsx
- src/components/WhatsAppLeadModal.tsx
- src/components/WhatsAppFloat.tsx
- src/pages/Cart.tsx
- src/pages/Checkout.tsx
- src/pages/PaymentStatus.tsx
- src/pages/ThankYou.tsx
- src/pages/ProductDetail.tsx
- src/pages/Index.tsx
- src/test/checkoutRules.test.ts
- src/test/useVerifiedOrder.test.tsx
- AGENTS.md, roadmap.md, checkout-audit.md