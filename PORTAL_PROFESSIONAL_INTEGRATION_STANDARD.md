# Smarter Justice Portal Professional Integration Standard

Version: 1.4.0
Established: July 20, 2026  
Updated: July 28, 2026

## Central Smarter Justice responsibilities

- Professional and firm identity.
- Account authentication and security.
- Profile and firm claims.
- Credential and jurisdiction records.
- Professional membership and billing state.
- Firm seats and approved roles.
- Portal interests, approved participation, availability, and suspension.
- Versioned professional terms.
- Shared support and audit evidence.
- Shared revenue, access, public paid Human Review, field-launch, brand, and origin-story standards.
- Central Human Review Specialist service/order/payment/refund state contracts and owner activation evidence.

## Portal responsibilities

- Specialty-specific public intake and workflows.
- Matter, form, document, and deadline data.
- Specialty-specific consent.
- Portal-specific professional qualifications and service options.
- Local support and professional-acceptance workflow.
- Separate portal database and confidential storage unless a documented secure integration is approved.
- A portal-specific Our Story page or clearly visible linked origin-story section.
- Portal-specific Human Review Specialist adoption, scope, exclusions, capacity, privacy, support, and escalation records under `PUBLIC_PAID_HUMAN_REVIEW_STANDARD.md`.

## Shared origin-story requirement

Every micro-portal must preserve this approved core sentence:

> Smarter Justice grew from years of street-level outreach through Justice Truck—meeting people where they were, listening to their legal concerns, speaking with attorneys, and seeing how difficult it could be to find the right starting point.

The specialty portal remains the primary portal brand for its subject. Smarter Justice is the broader network identity. Justice Truck remains the original and continuing community-access, vehicle, street, kiosk, event, and field-outreach brand. Use an owner-approved truthful relationship line such as “Connected with Justice Truck” when appropriate, without allowing any brand to erase the others’ distinct roles.

The surrounding copy may explain how the starting-point problem appears in that specialty, but it must not invent public reach, trust, case volume, professional status, outcomes, law-firm status, or affiliation with any court or government agency. Each portal must separately track copy approval, implementation, automated testing, exact-artifact testing, deployment, and live verification.

## Required state separation

Account, claim, identity, credential, payment, membership, portal participation, opportunity eligibility, availability, engagement, and outcome are distinct states.

## Data-transfer rule

A central identity does not authorize automatic matter-data sharing. Cross-portal transfer must be user-controlled, consented, minimum-necessary, purpose-limited, and auditable.

## Builder synchronization

Every portal continuation prompt must include the current shared standards, approved origin story, portal-specific build list, integration status, accepted deviations, tests, deployment state, live evidence, blockers, and owner decisions.


## Public paid Human Review boundary

Central membership billing, Human Review Specialist service payments, and separately engaged professional fees are distinct. A micro-portal may not activate a Human Review Specialist checkout merely because a central price or Stripe account exists. The portal must inherit the shared fail-closed gate, required acknowledgments, order/fulfillment/refund states, authenticated communications, support ownership, privacy safeguards, test evidence, and explicit owner approval. Licensed-professional review and representation remain separate engagements.


## Launch-minimal integration contract — v1.4.0

For the initial public and attorney launch, each focused micro-portal must remain a **public profile consumer**, not an account or billing system.

### Required portal entry points

- “Claim this profile” links to Smarter Justice with the portal ID and central professional ID.
- “Create a professional profile” links to Smarter Justice with the portal ID when no seeded listing exists.
- “Manage profile,” “Manage firm,” “Billing,” and “Cancel membership” link to Smarter Justice.
- The micro-portal must not create a second professional login, a second Stripe subscription, or a second authoritative copy of shared professional identity data.

### Source-of-truth matrix

- Smarter Justice: account, authentication, shared identity, firm, office, seat, billing, membership, credential-review state, support, and central profile revision.
- Focused micro-portal: specialty public rendering, specialty evidence, portal assignment, local disclaimers, portal SEO, and later portal-specific inquiry workflows.
- User matter data: remains in the portal where it was created unless the user separately authorizes a minimum-necessary transfer.

### Consumer safety rules

1. Upsert by immutable `professionalId` or `firmId`, never by name or slug.
2. Apply only a record whose `handoffDigest` and `recordFingerprint` validate.
3. Reject any public assignment unless `approvedSourceRevision` exactly equals `sourceRevision`.
4. Reject any public profile unless its `submittedRevision` equals `sourceRevision` and its review status is approved.
5. Reject any record with a lower `sourceRevision` than the locally applied revision.
6. `UPSERT_PRIVATE` stores or updates the record but does not publish it.
7. `UPSERT_PUBLIC` may publish only when `publicationEligible` is true and the portal’s own release gates pass.
8. `SUPPRESS` removes the public rendering without deleting audit history.
9. Payment, membership, or firm coverage never overrides credential, evidence, owner-approval, or portal-assignment requirements.
10. The portal must return an import receipt identifying the portal, central record ID, source revision, fingerprint, action, result, and timestamp.
11. No portal may write profile changes back automatically in the first launch. Attorneys edit shared information in Smarter Justice.
12. Every portal release must run the supplied conformance test and exact-artifact tests before deployment.
