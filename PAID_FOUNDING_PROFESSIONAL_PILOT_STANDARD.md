# Smarter Justice Paid Founding-Professional Pilot Standard

Version: 1.0.0  
Prepared: July 20, 2026

## Purpose

This standard governs controlled paid professional pilots in Smarter Justice and participating micro-portals. It prevents a polished interface, paid membership, or owner approval from being misrepresented as credential verification, opportunity eligibility, professional engagement, or launch approval.

## Separate required states

Keep these states separate in data, dashboards, public language, owner controls, and audit history:

1. Account created.
2. Email verified.
3. Profile located, created, or claimed.
4. Identity review status.
5. Credential review status.
6. Firm relationship and seat status.
7. Pilot application status.
8. Membership-payment status.
9. Portal participation status.
10. Matter or opportunity eligibility.
11. Availability.
12. Professional acceptance of a specific engagement.
13. Client engagement and conflicts status.
14. Service delivery and outcome.

Payment must never replace any other state.

## Application lifecycle

Approved lifecycle states are:

- Draft
- Submitted
- Owner review
- Changes requested
- Approved for payment
- Active member
- Paused
- Declined
- Withdrawn
- Canceled

Every state change should record the actor, timestamp, reason, prior state, new state, and relevant evidence. Duplicate requests must not create duplicate applications or transitions.

## Versioned acknowledgments

Before submission or payment, record the exact accepted version of:

- Professional membership terms
- Privacy policy
- Recurring-billing disclosure
- No-guarantee disclosure
- Independent-professional acknowledgment
- Conflicts and engagement-boundary acknowledgment

A later policy version does not silently replace the version previously accepted.

## Payment gate

Payment may open only after owner-controlled evidence confirms, at minimum:

- Production-appropriate database and persistence
- Backup and restore test
- Request-level transaction and idempotency acceptance
- Owner security and recovery evidence
- Professional account security evidence
- Authenticated transactional email
- Complete Stripe test lifecycle and signed webhook evidence
- Legal and professional-responsibility review
- Support and escalation ownership
- Monitoring, incident, pause, and rollback procedures
- Real-device acceptance
- Named first cohort and explicit owner approval

The gate must fail closed when evidence is incomplete or stale.

## Day-one member value

A founding membership should provide truthful value even before broad opportunity routing exists, such as:

- Claimed and managed professional or firm presence
- Central dashboard and onboarding
- Credential and participation status visibility
- Portal-interest and availability controls
- Firm seats and permissions
- Founding-member support
- Early access to approved professional tools

Do not promise clients, cases, leads, rankings, revenue, selection, or outcomes.

## Support and operations

Before opening a cohort, define:

- Support channels and hours
- Response expectations
- Billing, account, profile, credential, and firm escalation paths
- Incident ownership
- Complaint, appeal, suspension, and restoration procedures
- Refund and cancellation procedures
- Capacity limits and immediate pause controls
- Daily first-cohort review

## Portal adoption

Every micro-portal must document:

- Applicable professional types and credentials
- Jurisdictions
- Portal-specific eligibility
- Specialty-specific advertising and engagement boundaries
- Whether participation is open, application-only, paused, or unavailable
- Any deliberate deviation from this standard and the evidence supporting it

## Launch rule

Code completion, automated tests, exact-artifact testing, deployment, live verification, operational acceptance, pilot approval, and broad-launch approval are separate states. A pilot opens only after the required evidence is recorded and the owner explicitly approves the named cohort.
