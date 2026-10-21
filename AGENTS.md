# Architecture rules
- Share the selected local delivery between cart and checkout through DeliveryProvider; one consultation prevents diverging address and freight states.
- Keep monetary and served-city rules in checkoutRules with concrete unit tests; unknown freight must remain null.
- Keep the existing app-arranged local service without fabricated automatic rates; disable online payment until a confirmed shipping price exists.
- Verify order reference and approved status through the existing read-only order lookup before displaying payment success; URL status is never proof.
- Do not dispatch purchase events without an established consent integration and verified transaction value; existing marketing tags remain unchanged pending consent configuration.