# PRE129 launch-provider reconciliation

## Current product line

- Smarter Justice production is the PRE128 line.
- PRE129 is a launch-readiness successor candidate built from the exact PRE128 production source line.
- Public legal help, free profiles, the Downtown Brooklyn community, and the professional preview remain independent of paid membership.

## Email

A Smarter Justice-specific Resend sending-domain record for `smarterjustice.com` was created on 2026-09-06. It is not yet DNS verified. Open and click tracking are disabled, sending is enabled, receiving is disabled, and TLS is enforced.

Registration remains closed because domain creation is not proof of delivery. The gate also requires verification/recovery delivery, replay/expiry/abuse tests, bounce/error behavior, and support acceptance.

## Payments

The connected live Stripe context observed during this build contains Franklin Navigator products and no Smarter Justice product/price authority. That account is explicitly excluded from Smarter Justice. PRE129 creates no Smarter Justice Stripe products, prices, customers, subscriptions, or checkout sessions in that account.

Paid membership remains closed until a Smarter Justice-authorized Stripe account is connected and its products/prices are mapped and tested through signed webhooks, entitlements, annual/monthly cadence, seats, invoices, renewals, failed payments, cancellation, refunds, reactivation, and first value.

## LinkedIn prospecting

The current prospect-facing route is `/attorney-partner-tour.html`. It may be used for truthful manual LinkedIn prospecting for the free profile/community preview because it does not claim that paid enrollment is open, promise clients, or automate messages. Paid-membership solicitation must not say “join now” or imply active checkout until the payment and email gates pass.

## Release rule

No environment variable or provider configuration alone can open registration or paid enrollment. A source-controlled acceptance record in a new qualified release must change the requested-open state and all underlying tests must pass.
