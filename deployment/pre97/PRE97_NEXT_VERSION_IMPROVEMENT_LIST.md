# PRE97 Next Version Improvement List

This is the required cumulative next-version list. It is builder-facing; preserve it into the next material successor and do not require Roger to restate these items.

## Continue page-by-page visual and functional QA
- Audit the authenticated professional dashboard/workspace with real representative account states: new, claimed, verified, firm administrator, MFA enabled, sparse profile, and multi-jurisdiction profile.
- Audit remaining account, firm operations, legal workbench, growth/compliance, membership, support, contact, legal-area, free-tool, Spanish, error, empty, unauthorized, and expired-session surfaces on desktop, laptop, tablet, and mobile.
- Continue removing excessive vertical space, unclear hierarchy, repeated warnings, internal/product-heavy language, and inconsistent CTA patterns where discovered.

## Homepage
- Re-render the exact PRE97 homepage at 320, 375, 390, 768, 1024, 1280, 1366, 1440, and large desktop widths after deployment and tune only where visual evidence warrants it.
- Recheck floating Help collision, header density, hero column balance, jurisdiction selector, legal-path card alignment, attorney CTA balance, and footer/privacy-choice placement.

## Professional network
- Continue qualified national source-adapter expansion across the United States while preserving jurisdiction-specific evidence and currentness rules.
- Expand representative profile QA beyond New York and verify state/D.C. filtering, sparse-data rendering, no-firm profiles, multi-jurisdiction profiles, and firm rosters.
- Improve source/currentness presentation where it can be made more scannable without weakening evidence or creating implied endorsement.
- Continue evidence-level deduplication upstream where repeated office/source records are genuinely duplicates; PRE97 presentation normalization must not substitute for canonical data hygiene.

## Authentication and recovery
- Add/retain end-to-end owner login, professional login, password reset, MFA enrollment, MFA login, recovery-code login, session revocation, and expired-session tests to every release qualification.
- Configure owner reset email delivery when operationally ready; until then keep unavailable email recovery clearly secondary to the configured one-time hosting path.
- Re-audit the fully authenticated Owner Control Center and remove remaining obsolete internal/legacy wording that does not help owner operation.

## Signup / claim
- After PRE97 is staged, test full claim → account creation → email verification → authority verification → private dashboard continuity using synthetic/test identities only.
- Confirm source-backed claim context survives signup without silently converting illustrative placeholder text into saved facts.
- Continue moving nonessential profile-completion work after account creation where safe, while preserving professionals who choose to supply details early.

## Attorney-facing value
- Re-test Attorney Partner Tour presenter mode, practice variants, firm path, membership links, follow-up/print routes, Navigator demonstration, and compliance links after PRE97 staging.
- Continue making professional membership value more scannable and concrete while preserving the separation of payment from verification, ranking, endorsement, suitability, and organic discovery.

## Release engineering
- Preserve deterministic exact-carrier construction, predecessor hash enforcement, rollback identity, route/link auditing, inherited regression suites, and changed-file receipts.
- Continue toward a scalable source-control-to-staging-to-production release path that does not depend on manual large-ZIP handling.
