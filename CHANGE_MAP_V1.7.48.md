# Smarter Justice v1.7.48 Change Map

## Backend

- `lib/launchOutreachOperations.js`: recognized campaigns, expiring/revocable invitation lifecycle, SHA-256 token storage, public-safe resolution, open/redeem tracking, allowlisted aggregate events, owner view, and CSV export.
- `lib/launchCohortOperations.js`: personalized invitation submissions reuse the existing owner contact; public callers cannot select an internal contact ID.
- `server.js`: public invitation lookup/open/event routes and protected owner campaign/invitation/export routes.

## Attorney experience

- `public/attorney-launch.js`: validates personalized invitations, prefills approved professional context, tracks open/redeem progression, submits the existing contact, and removes the raw token from the visible URL after validation.
- `public/attorney-launch.html`: clear personalized-invitation confirmation and truthful free-profile boundaries.

## Public launch learning

- `public/home.js`: records only recognized aggregate landing, starting-help, and portal-direction events; no user story, intake answer, or legal narrative is sent to the launch-funnel store.

## Owner operations

- `public/launch-activation.html` and `public/launch-activation.js`: campaign controls, aggregate metrics, invitation issue/revoke operations, one-time raw-link disclosure, activity state, and CSV export.

## Tests and evidence

- Added `tests/launch-outreach-conversion-v1748.test.js`.
- Official suite is 103 parts: 102 dependency-independent and one PostgreSQL-dependent.
- Current release, baseline, evidence, classification, registry, continuation, watchlist, and improvement records reconciled to v1.7.48.

## Explicit non-changes

No micro-portal repository, public profile fact, identity/credential verification, specialty approval, organic ordering, live connection, automatic write, payment, Sponsored/Featured placement, opportunity, review, appointment, confidential upload, external AI, deployment, or launch gate was activated.
