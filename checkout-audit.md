# Sam Esthetic checkout review

## Completed
- CEP consultation in cart and the first checkout step, using the existing ViaCEP lookup.
- Municipality + GO validation, without postcode prefix assumptions.
- Reused local delivery selection, editable and stored in sessionStorage; no customer identifiers in this selection.
- Existing local rule preserved: Uber/99Pop arranged through atendimento, with unknown freight represented as null, not free delivery.
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
- No existing local automatic fare exists: calculate-shipping is the existing PAC/SEDEX calculation used for non-local destinations, which are not served. It is not substituted for local app delivery. Local online payment cannot safely charge freight until a real quote mechanism or confirmed rate exists.
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