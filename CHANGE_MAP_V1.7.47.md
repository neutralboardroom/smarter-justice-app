# Smarter Justice v1.7.47 Change Map

## Backend

- `lib/launchCohortOperations.js`: cohort plan, consented contacts, status queue, source-supported batch preview, duplicate review, private candidate commit and export.
- `server.js`: public professional launch-interest endpoint and protected owner cohort, contact, batch preview, commit and export routes.
- `lib/store.js` storage remains private and environment-bound.

## Owner experience

- `public/launch-activation.html` and `public/launch-activation.js`: cohort plan, metrics, contacts, source batch preview/commit and export.
- Batch actions remain owner-only and non-activating.

## Attorney experience

- `public/attorney-launch.html` and `public/attorney-launch.js`: free-profile follow-up form, portal interests, campaign/QR attribution, explicit consent and confidential-information warning.

## Profile-growth controls

- Source name, URL, authority, retrieval date, supported facts and use notes are reviewable before commit.
- Workers’ Compensation and Medical Malpractice are not silently assigned to Personal Injury.
- Suggested portals never become approved eligibility.
- Ready rows create private unclaimed records only; missing or duplicate rows remain reviewable.

## Tests and evidence

- Added `tests/launch-cohort-profile-growth-v1747.test.js`.
- Official suite: 102 parts, comprising 101 dependency-independent and one PostgreSQL-dependent part.
- Current release, deployment, manifest, registry, continuation and improvement records reconciled.

## Explicit non-changes

No micro-portal repository, live connection, automatic write, public profile, credential, specialty approval, payment, Sponsored placement, opportunity, review, appointment, confidential upload, external AI or deployment gate was opened.
