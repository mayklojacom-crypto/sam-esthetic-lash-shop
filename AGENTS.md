# Architecture rules
- Share the selected local delivery between cart and checkout through DeliveryProvider; one consultation prevents diverging address and freight states.
- Keep monetary and served-city rules in checkoutRules with concrete unit tests; unknown freight must remain null.
- Centralize the owner-defined road-distance tariff in checkoutRules (mirrored in the local-route-freight function, which computes Google Routes distance from the store origin). The route quote is display-only (delivery.quote); delivery.price stays null so online payment remains blocked until payment functions revalidate freight server-side.
- Verify order reference and approved status through the existing read-only order lookup before displaying payment success; URL status is never proof.
- Do not dispatch purchase events without an established consent integration and verified transaction value; existing marketing tags remain unchanged pending consent configuration.