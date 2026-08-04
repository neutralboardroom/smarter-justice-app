# Smarter Justice v1.7.49 — Production Readiness, Service Status, and Fail-Safe Monitoring

## Material improvements

- Added `/livez` as a minimal process-liveness probe.
- Added `/readyz` as a lane-aware fail-closed readiness probe. It returns HTTP 503 and `Retry-After: 60` while the selected lane is blocked.
- Added a truthful public service-status API and launch-status presentation that distinguish operational, limited, and unavailable capabilities without exposing secrets or personal information.
- Added a private owner service-readiness workbench with lane-specific blockers and monitoring guidance.
- Preserved the exact minimal `/health` contract for backward compatibility; `/health` does not imply database, SMTP, portal, legal, payment, publication, or deployment readiness.
- Bound readiness to the existing launch-command checks. Readiness cannot write evidence, alter a gate, approve a professional, publish a profile, activate payment, connect a portal, or authorize deployment.
- Refreshed owner-recorded launch-portal context: Divorce Law Aid v0.11.0, Estate Law Aid v1.1.42, and Personal Injury Law Aid v0.35.0. Dedicated exact-artifact and D4 staging evidence are still required in their own portal contexts.
- Preserved v1.7.48 personalized invitations, privacy-minimized funnel operations, v1.7.47 free-profile cohort operations, and every central/profile/portal trust boundary.

## Test and gate truth

- Official suite: 104 parts — 103 dependency-independent and one PostgreSQL-dependent storage-readiness part.
- Legitimate dependency installation remains blocked because the configured registry returns HTTP 404 for `xtend-4.0.2.tgz`; fresh audit remains blocked by the configured audit endpoint HTTP 404.
- Launch preflight remains `NO_GO`: 0 of 4 lanes ready and 92 blocked checks.
- No deployment, profile-publication, portal-import, payment, Sponsored/Featured, opportunity, review, appointment, confidential-upload, external-AI, or automatic-write gate was opened.
- Production monitoring, alert delivery, PostgreSQL durability, SMTP, MFA, portal staging, backup/restore, device/accessibility acceptance, legal approval, rollback, and deployment remain unverified.

---

Historical release records remain preserved in their versioned files.
