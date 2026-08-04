# Smarter Justice v1.7.39 — 48-Hour Attorney Launch Runbook

Status: development runbook; no deployment or commercial activation is authorized by this file.

## Separate launch lanes

- Public starting help
- Founding-attorney applications
- Paid founding-attorney enrollment

## Hours 0–12: infrastructure and legal/operational truth

- Freeze the exact v1.7.39 candidate and verify inventory.
- Configure staging PostgreSQL, migrations, backups, restore rehearsal, SMTP, Stripe test mode, webhook signing, monitoring, support ownership, incident ownership, and rollback.
- Review professional membership terms, privacy, recurring billing, cancellation/refund, no-guarantee, professional advertising, and separate-engagement language.
- Keep public help, attorney applications, and paid enrollment as separate gates.

## Hours 12–24: attorney account and profile acceptance

- Complete the full `ATTORNEY_ENROLLMENT_ACCEPTANCE_V1.7.39.md` rehearsal.
- Test individual and firm signup, email verification, MFA, profile claim, owner approval, profile completeness, unsaved changes, firm seats, and support.
- Run desktop, tablet, mobile, keyboard, zoom, and screen-reader checks.

## Hours 24–36: payment and operations rehearsal

- Approve a test application with exact target, plan, seats, and cadence.
- Verify recurring quote and all four checkout acknowledgments.
- Test Stripe success, duplicate submit, webhook replay, failed payment, cancellation, refund, and billing exception paths.
- Confirm no payment can activate credential verification, specialty eligibility, ranking, or opportunity eligibility.

## Hours 36–48: go/no-go and controlled deployment

- Run the production preflight and owner Launch Command Center.
- Record lane-specific evidence and explicit decisions.
- Test staging smoke journeys and rollback.
- Deploy only the separately approved lane. Do not activate a broader lane because a narrower lane passed.
- Verify live health, public status, signup, email, authentication, dashboard, support, monitoring, and rollback after deployment.

## Default decision

NO_GO until every required machine, operational, acceptance, and owner-approval gate is complete.
