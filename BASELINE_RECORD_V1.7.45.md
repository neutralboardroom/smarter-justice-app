# Smarter Justice v1.7.45 Baseline Record

- Prepared: 2026-07-29 America/New_York
- Untouched source artifact: `smarter-justice-v1.7.44(1).zip`
- Expected authoritative filename: `smarter-justice-v1.7.44.zip`
- Exact SHA-256: `b280f19078b95a006becf970b55a480464fa157d679a98886c2665fb2697c1b3`
- Exact size: 2,401,801 bytes
- ZIP entries/files/directories: 841 / 827 / 14
- Repository layout: files at ZIP root
- Inventory: 826 self-excluding records; SHA-256 `c921b591fd1494a2b134c2bd6dfb8268e64625b65a451f3a27e772c729430197`
- CRC, duplicate-path, traversal, absolute-path, backslash-path, symlink, encrypted-entry and suspicious-binary checks: passed
- Two independent clean extractions: inventory validated in both
- Package version: 1.7.44; CommonJS; Node 22.x
- Exact-tested runtime here: Node v22.16.0 and npm 10.9.2
- Production version recorded by the artifact: 1.6.1
- Deployment state: NOT DEPLOYED; deployment NOT AUTHORIZED
- Launch preflight: NO_GO; 0 of 4 lanes ready; 92 blocked checks
- Dependency-independent tests reproduced: 98 of 98 passed
- PostgreSQL-dependent test: not run because authentic dependencies could not be installed
- Legitimate clean install: blocked by HTTP 404 for `xtend-4.0.2.tgz` from the configured registry
- Fresh npm audit: blocked by the same unavailable dependency/audit infrastructure
- Public surfaces: 70 top-level HTML pages
- Packaged profile records: 233 professionals and 48 firms
- Portal contracts/assignments: 25 / 678
- Live portal connections: 0
- Automatic portal writes: disabled
- Public profile publication gate: closed
- Paid membership, Sponsored visibility, case opportunities, reviews, appointments, confidential uploads, external AI and deployment: closed

## Current implementation relevant to this release

- A central professional account can claim or create a private professional or firm record.
- Free basic profile editing and exact-revision submission foundations exist.
- Shared professional fields can be selected for multiple portals, but there is no complete central per-portal specialty-profile editor with independent revision state.
- Portal handoffs contain shared professional and firm fields, assignment metadata, digest protection, `UPSERT_PRIVATE`, `UPSERT_PUBLIC` and `SUPPRESS` controls.
- Full public attorney pages, firm pages and specialty search remain the responsibility of each micro-portal and are not production verified.
- The professional dashboard does not yet show a complete portal-by-portal presence record containing specialty draft status, public URL, search acceptance, firm-link acceptance, import receipt, last-known-good state and rollback state.

## Material v1.7.45 scope

Build a central, free, revision-safe **Portal Presence Management and Acceptance** foundation for Divorce Law Aid, Estate Law Aid and Personal Injury Law Aid:

1. Add portal-specific professional profile drafts with independent revisions and allowed specialty fields.
2. Expose those drafts in the professional dashboard as separate portal sections.
3. Include approved portal-specific fields and their exact revisions in read-only handoff records.
4. Add owner-operated portal-presence acceptance records for canonical attorney page, canonical firm page, search, reciprocal links, claim/manage links, import receipt, last-known-good and rollback evidence.
5. Keep every acceptance state fail-closed, non-live and non-public until owner and portal evidence are recorded.
6. Add regression tests and release evidence without modifying any micro-portal repository.

## Non-goals

- No portal repository modification
- No live portal connection or automatic write
- No D4 or D5 claim
- No production deployment
- No payment-gate activation
- No Sponsored or opportunity activation
- No public central specialty directory expansion
- No fabricated browser, accessibility, legal, SMTP, PostgreSQL, Stripe, backup, restore or monitoring acceptance

## Acceptance evidence planned

- Revision-safe portal-specific edits and stale-write rejection
- Portal boundary enforcement for the three launch portals
- Personal Injury scope boundary preservation
- Read-only handoff inclusion with no prohibited data
- Owner acceptance record validation and fail-closed state
- Professional dashboard portal-by-portal rendering
- Existing 98 dependency-independent tests preserved plus new v1.7.45 tests
- Deterministic final ZIP, two independent fresh extractions and exact final artifact verification
