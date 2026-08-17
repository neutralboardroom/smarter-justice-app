# Smarter Justice PRE93 — National Attorney Free-Profile Launch Readiness Action Packet

Generated after live PRE93-D4 diagnostic on August 17, 2026. This packet records the current state; it does not auto-approve or bypass any launch gate.

## Current live state

- Product: Smarter Justice v2.0.0-pre93
- Scope: national United States — all 50 states plus Washington, D.C.
- National Roger Rule: `SJ-RGR-PRE92-NATIONAL-USA-SCOPE`
- Public attorney directory: live
- Qualified Attorney Profile Factory: v0.27.0 — 12,082 professionals + 496 firms = 12,578 qualified source identities
- Live searchable individual professional projection: 12,295
- Directory source architecture: read-only Factory source; no bulk Factory JSONB import into the transactional database
- Search: every field optional; token-aware partial search; no paid organic boost
- Attorney tour/presenter tour: live and passing smoke checks
- Monitoring evidence: recorded
- Rollback artifact identity: recorded
- Live readiness lane `free-professional-profiles`: 14/26 checks passing; 12 blockers remain

## Remaining blockers

1. `machine:owner_mfa` — every active owner account must have MFA plus recovery codes.
2. `machine:owner_bootstrap_removed` — bootstrap owner email/password environment credentials must be removed after durable owner login is confirmed.
3. `machine:smtp_configured` — transactional SMTP host/user/password/from identity must be configured.
4. `evidence:support_owner` — owner must designate the launch support owner.
5. `evidence:support_runbook` — owner must review/accept `deployment/pre93/PRE93_ATTORNEY_LAUNCH_SUPPORT_RUNBOOK.md` before the recorded flag is set.
6. `evidence:incident_owner` — owner must designate the production incident owner.
7. `evidence:incident_runbook` — owner must review/accept `deployment/incident-runbook.md` before the recorded flag is set.
8. `evidence:accessibility` — real launch acceptance still needs assistive-technology evidence; current source/rendered audits are not a WCAG conformance claim and did not include real assistive-technology testing.
9. `evidence:terms` — owner review of the current professional membership terms must be recorded.
10. `evidence:privacy` — owner review of the current privacy notice must be recorded.
11. `evidence:cohort` — a national launch cohort name plus positive bounded cohort cap must be recorded.
12. `approval:free_profiles` — explicit owner approval must be the final step after all prerequisite evidence is true.

## Safe owner action order

1. Confirm owner login works, then enroll authenticator MFA and save recovery codes offline. Never share the MFA secret, six-digit code, password, or recovery codes in chat.
2. Reconfirm owner MFA state from the live service. Only then remove bootstrap `OWNER_ACCOUNT_EMAIL` / `OWNER_ACCOUNT_PASSWORD` environment credentials.
3. Configure transactional SMTP in Render using a real provider. Keep the SMTP password out of chat.
4. Review/accept the support and incident runbooks and designate the responsible owner(s).
5. Perform real assistive-technology acceptance on representative attorney pages; record only evidence actually observed.
6. Review the current professional membership terms and privacy notice.
7. Choose a bounded national attorney launch cohort cap. National scope must remain intact; the cap controls the first operational enrollment cohort, not geographic coverage.
8. Re-run `/readyz?lane=free-professional-profiles` and confirm all prerequisite checks pass.
9. Only then record explicit owner authorization to open the free-profile applications lane.

## Infrastructure continuity warning

The current `smarter-justice-db` Render Postgres instance is on the free plan and reports an expiration timestamp of August 19, 2026. Because attorney outreach begins before that date, the existing database should be upgraded/persisted in Render before expiration rather than relying on a last-minute database replacement or migration.

## Gates intentionally left closed

- Private upload storage remains not ready and is not required for the free-professional-profile lane.
- No automatic claim, verification, billing, outreach, member-care, licensing assertion, or paid organic ranking is authorized by this packet.
- This packet does not claim accessibility conformance, owner legal review, SMTP readiness, MFA completion, or free-profile launch approval.
