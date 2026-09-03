# PRE128 Render deployment incident and prevention record

## Incident

- Attempted: September 3, 2026 at 15:56 UTC
- Render service: `srv-d8ps9jgjs32c73918vvg`
- Failed deployment: `dep-dacph7h5efls73e32ro0`
- Exact GitHub commit: `fbafa0db674b6ffc8e6ebb048f46c49cebe2fb83`
- Live release throughout the attempt: PRE127, deployment `dep-dabkqv2d0e5s739nr860`
- Promotion impact: none; Render reported `build_failed` and did not replace PRE127

Render checked out the intended commit and ran `npm ci --omit=dev`. PRE128's unit, HTTP, and system suites passed. The inherited `security-boundaries-v177.test.js` then expected a synthetic test owner login to succeed but received 401.

## Root cause

The test child process spread the full Render build environment before setting its test values. `RENDER_DISK_MOUNT_PATH` has higher storage precedence than `SMARTER_JUSTICE_STORAGE_DIR`, so the test's temporary directory did not isolate state. The synthetic owner credentials therefore encountered the existing owner-account state rather than a new empty test store.

This was a build-test environment-isolation defect. It was not an application startup failure, new Stripe setup, database migration, DNS change, TLS issue, or customer-facing promotion. No credential value was printed or copied into evidence.

## Correction

PRE128 now creates a qualification environment that removes:

- Render identity and disk variables;
- database and PostgreSQL connection variables;
- owner and legacy administration credentials;
- SMTP and transactional-email variables;
- Stripe variables;
- OpenAI variables;
- production-environment selectors and inherited PRE128 enrollment-test flags.

Predecessor reconstruction runs in the isolated build environment. PRE128 unit, HTTP, system, and security suites run in the isolated test environment. Each integration test may then use only its explicit temporary storage and synthetic credentials.

## Required regression checks

- `tests/pre128-render-filesystem.test.js` must verify the isolation function and required variable families before reconstruction begins.
- Clean-clone and Render builds must pass the same five retained qualification suites.
- The reproducible candidate artifact hash must remain identical between independent builds.
- Production state counts must be reconciled read-only after promotion.
- PRE128 may be described as deployed only after Render reports the exact successor commit live and canonical production checks pass.

## Rollback boundary

No rollback was necessary because PRE127 remained live. The exact rollback target remains commit `a746c2d689c03ba713d9d31dd952bc9fd2137dbb`, deployment `dep-dabkqv2d0e5s739nr860`. No correction to this incident authorizes provider, Stripe, environment, database, domain, or TLS mutation.
