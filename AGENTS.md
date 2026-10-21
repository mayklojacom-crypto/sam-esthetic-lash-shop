# Architecture rules
- Share the selected local delivery between cart and checkout through DeliveryProvider; one consultation prevents diverging address and freight states.
- Keep monetary and served-city rules in checkoutRules with concrete unit tests; unknown freight must remain null.
- Centralize the owner-defined road-distance tariff in checkoutRules; route evidence must match origin/destination and never come from straight-line estimates. Keep browser delivery prices null until an existing route service and server-side payment revalidation are implemented, so session storage cannot enable online payment.
- Verify order reference and approved status through the existing read-only order lookup before displaying payment success; URL status is never proof.
- Do not dispatch purchase events without an established consent integration and verified transaction value; existing marketing tags remain unchanged pending consent configuration.