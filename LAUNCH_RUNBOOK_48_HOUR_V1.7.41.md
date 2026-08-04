# Smarter Justice v1.7.41 48-Hour Launch Runbook

## Lane 1 — Public users

Keep free public starting help separate from attorney membership. Do not store or transfer an initial legal story merely to route a user.

## Lane 2 — Attorney accounts and applications

Open only after database, authentication, email verification, MFA/recovery, support, privacy, terms, monitoring, backup, and rollback evidence pass. Attorneys may claim a listing or build a private profile from scratch. Owner-assisted entry is permitted only into an existing account.

## Lane 3 — Paid founding enrollment

Open only after Lane 2, Stripe test lifecycle, exact recurring quotes, approved application matching, cancellation/refund/support procedures, cohort capacity, and explicit owner approval pass. Payment never publishes a profile.

## Portal rollout

1. Freeze and verify the exact Smarter Justice artifact.
2. Select one exact focused micro-portal staging artifact.
3. Add a read-only consumer of the v1.4.0 handoff.
4. Validate profile and firm payloads, conflict handling, empty state, provenance, and rollback.
5. Publish only records independently eligible under that portal’s rules.
6. Repeat through each dedicated portal build; do not mutate repositories automatically.

## Go/no-go

Default is NO_GO. Each lane and each portal requires its own evidence and owner decision. Last verified production remains v1.6.1 until a separately authorized deployment is verified.

## Required lane labels and timing

- Public starting help
- Founding-attorney applications
- Paid founding-attorney enrollment

### Hours 36–48

Run final staged journeys, support rehearsal, monitoring review, backup/restore evidence, rollback rehearsal, and separate owner go/no-go decisions. Do not activate a broader lane merely because a narrower lane passed.

## v1.7.41 controlling additions

- Launch with one central Smarter Justice professional account, firm workspace, profile editor, support path, membership application, and billing authority.
- Approve only an exact submitted profile revision; reject stale browser writes and stale portal imports.
- Changing credential identity requires re-verification.
- Approve payment only after the exact current profile revision passes profile review.
- Approve each portal assignment for the exact source revision.
- Micro-portals must use the supplied read-only v1.4.0 contract and must not duplicate account, billing, or shared profile-management systems.
- Start with a very small owner-approved cohort and add optional features only after the initial launch is stable.
