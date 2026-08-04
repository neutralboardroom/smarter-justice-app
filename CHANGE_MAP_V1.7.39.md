# Smarter Justice v1.7.39 Change Map

## Public attorney signup

- `public/professional-signup.html`: streamlined initial account fields, 12-character password parity, optional expandable profile preparation, explicit firm identity, clearer pricing and no-charge disclosures.
- `public/professional.js`: guided signup state, firm-field requirements, network failure handling, and safer redirect behavior.
- `public/styles.css`: responsive signup, profile completeness, sticky save, checkout summary, and active-membership management styling.

## Profile and firm management

- `public/professional.js`: profile/firm completeness, collapsible editing groups, unsaved/saved state, protected save actions, clearer public status.
- `lib/professionalAccounts.js`: rejects blank public professional/firm names, requires new firm name, and caps covered seats at 500.

## Membership and payment

- `server.js`: authoritative firm seat count, exact approved-application matching, four checkout acknowledgments, Stripe idempotency, duplicate-active-subscription prevention, and fail-safe Stripe error handling.
- `public/professional.js`: exact recurring quote, volume discount, renewal language, checkout acknowledgments, duplicate-submit protection, and active membership billing/cancellation support state.

## Governance and tests

- Current release manifests, dashboards, handoffs, watchlist, environment review, runbooks, release evidence, and continuation records advance to v1.7.39.
- `tests/attorney-enrollment-v1739.test.js` is the 95th official regression part.
- `tests/marketplace.test.js` adds end-to-end checks for name protection, firm identity, acknowledgments, application cadence matching, active-subscription duplication, and successful payment activation.
