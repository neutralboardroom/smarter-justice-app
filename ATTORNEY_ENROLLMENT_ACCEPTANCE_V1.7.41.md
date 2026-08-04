# Smarter Justice v1.7.41 Attorney Enrollment Acceptance

## Account and profile creation

- Create and verify an individual professional account without selecting a prebuilt listing.
- Confirm a private professional profile is created and remains unpublished.
- Create an additional private professional profile from the dashboard.
- Create a private firm workspace and confirm seat limits and firm identity validation.
- Create an owner-assisted record linked to an existing account.
- Confirm canonical portal selections remain attached.

## Membership and payment separation

- Select a self-created profile as the membership target.
- Save and submit a founding application with versioned acceptances.
- Confirm no payment occurs at submission.
- Confirm checkout remains unavailable until the application and global payment gates are approved.
- Confirm payment does not change credential, evidence, assignment, publication, or ranking states.

## Portal distribution

- Generate the v1.4.0 handoff for a focused portal.
- Confirm it contains only allowed assignment, professional, and referenced-firm fields.
- Confirm it contains no user matter, credentials, payment data, confidential data, or automatic write instructions.
- Confirm the general Smarter Justice account destination exports no public profile payload.
- Confirm an unverified or unapproved profile has `publicationEligible: false`.
- Confirm a focused portal cannot accept a publication-eligible record without verified credentials and owner-approved assignment state.

## Field acceptance still required

Complete real-browser, keyboard, 200%/400% zoom, screen-reader, mobile, tablet, email, database, Stripe test lifecycle, support, backup/restore, monitoring, staging, and rollback acceptance before launch.

## v1.7.41 controlling additions

- Launch with one central Smarter Justice professional account, firm workspace, profile editor, support path, membership application, and billing authority.
- Approve only an exact submitted profile revision; reject stale browser writes and stale portal imports.
- Changing credential identity requires re-verification.
- Approve payment only after the exact current profile revision passes profile review.
- Approve each portal assignment for the exact source revision.
- Micro-portals must use the supplied read-only v1.4.0 contract and must not duplicate account, billing, or shared profile-management systems.
- Start with a very small owner-approved cohort and add optional features only after the initial launch is stable.
