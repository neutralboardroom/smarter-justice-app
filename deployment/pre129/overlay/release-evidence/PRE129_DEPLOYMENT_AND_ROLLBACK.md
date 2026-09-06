# PRE129 deployment and rollback state

## Deployment state

`NOT_AUTHORIZED`

PRE129 is a source-qualified launch-readiness candidate. It must not replace production PRE128 while professional registration and paid membership remain closed by the acceptance record.

The production service remains on PRE128 commit `962db2fe8a0b66dff2ad58bda75caf9e983bf45a`, tree `fcec5b314657da0d39c68b70d109fe80ba9fb6fe`, Render deployment `dep-dacq74vavr4c739dmipg`.

## Why deployment is withheld

- `smarterjustice.com` email sending domain exists but is not DNS verified.
- Verification/recovery email E2E is not accepted.
- No Smarter Justice-authorized Stripe account is connected to this build session.
- No Smarter Justice product/price mapping, signed-webhook lifecycle, entitlement lifecycle, annual cadence, seat, invoice, cancellation/refund, or paid first-value proof exists.
- Support, bilingual purchase-path, professional-responsibility, and owner launch-GO evidence are not complete.

## Rollback

PRE129 changes no production database schema, Stripe object, membership state, customer record, entitlement, or production environment variable. The rollback target is the current PRE128 production deployment above. Because PRE129 is not deployed, no rollback action is currently required.

Any later deployment must name an exact accepted commit, artifact hash, provider identities, migration state, live smoke results, and rollback target.
