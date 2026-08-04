# Initial Attorney Pilot Launch Runbook — v1.7.42

Status: preparation only; no launch authorization.

## Lane order

1. Self-contained Smarter Justice owner operations and exact rollback approval
2. Divorce Law Aid staging adapter and enrollment acceptance
3. Estate Law Aid staging adapter and enrollment acceptance
4. Personal Injury Law Aid staging adapter and enrollment acceptance, including vehicle accidents and workers’ compensation separation

## Required evidence before any live cohort

Legitimate clean install and audit; PostgreSQL and migrations; SMTP verification/recovery; owner and staff MFA; Stripe lifecycle if billing is activated; privacy/terms/support/refund/cancellation approval; monitoring and alerts; incident runbook; encrypted backup and tested restore; exact rollback; browser/mobile/keyboard/zoom/screen-reader acceptance; exact portal artifacts; signed staging receipts; last-known-good and rollback tests; owner go/no-go.

All gates remain closed until their own evidence and owner approval are recorded.

## Existing launch lanes preserved

- **Public starting help** remains a separate lane.
- **Founding-attorney applications** remain a separate lane.
- **Paid founding-attorney enrollment** remains closed unless billing is separately approved.
- **Hours 36–48** are reserved for final verification, owner go/no-go, rollback readiness, and no-expansion checks.
- **Do not activate a broader lane** merely because a narrower lane passes.
