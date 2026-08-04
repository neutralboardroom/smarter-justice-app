# Smarter Justice v1.7.49 Change Map

## Runtime

- `lib/serviceReadiness.js` — safe liveness, lane-aware readiness, public status, and owner diagnostics.
- `server.js` — `/livez`, `/readyz`, `/api/public/service-status`, and owner-protected `/api/owner/service-readiness`; legacy `/health` preserved.

## User-facing

- `public/launch-status.html` and `public/app.js` — truthful service availability alongside launch-gate status.
- `public/attorney-launch.html` — professional account/profile-control readiness explanation.
- `public/launch-activation.html` and `public/launch-activation.js` — private owner lane diagnostics.
- `public/styles.css` — readiness presentation.

## Tests and evidence

- `tests/service-readiness-v1749.test.js` — fail-closed and privacy-boundary regression.
- `SERVICE_READINESS_CONTRACT_V1.7.49.json` and `SERVICE_READINESS_ACCEPTANCE_V1.7.49.md` — explicit endpoint and acceptance boundaries.
- Current release, environment, registry, portal-truth, audit, rollback, and continuation records reconciled to v1.7.49.

## Deliberately unchanged

Authentication, claims, verification, professional revisions, firms, billing, Stripe gates, organic ordering, opportunity gates, portal handoff contract v1.4.0, portal repositories, live imports, automatic writes, and deployment authorization.
