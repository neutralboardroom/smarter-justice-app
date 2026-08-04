# Smarter Justice Micro-Portal Professional Integration Kit

Version: 1.1.0  
Contract: 1.4.0  
Date: July 28, 2026

## Purpose

This kit lets every legal micro-portal display approved specialty profiles while Smarter Justice remains the only professional account, firm, seat, billing, membership, support, and shared-profile-management system.

## Initial launch scope

Build only these portal capabilities first:

1. Claim/create/manage links to Smarter Justice.
2. A read-only import of the portal-specific v1.4.0 handoff.
3. Local upsert by immutable central IDs and monotonic source revisions.
4. Public rendering only for records explicitly eligible for that portal.
5. Suppression handling, import receipts, and audit logging.
6. No portal account, no portal subscription, no automatic write-back, and no user-matter transfer.

## Required routes or configuration

- `SMARTER_JUSTICE_BASE_URL`
- `SMARTER_JUSTICE_PORTAL_ID`
- Claim URL: `{base}/professional-signup.html?portal={portalId}&claim={professionalId}`
- Create URL: `{base}/professional-signup.html?portal={portalId}&mode=create`
- Manage URL: `{base}/professional-dashboard.html`
- Billing URL: `{base}/professional-dashboard.html#professional-billing`

## Import algorithm

1. Validate the handoff schema and stable SHA-256 digest.
2. Confirm `destinationPortalId` exactly matches the portal configuration.
3. Confirm any public assignment has `approvedSourceRevision` equal to `sourceRevision`, and any public profile has that same revision submitted and approved.
4. For each firm and professional, compare `sourceRevision` with the local last-applied revision.
5. Reject older revisions and duplicate fingerprints.
6. Apply `UPSERT_PRIVATE`, `UPSERT_PUBLIC`, or `SUPPRESS` exactly.
7. Never infer publication from payment or membership.
8. Write an import receipt and preserve the prior record for rollback.

## Release acceptance

- Claim/create/manage links use the correct portal ID.
- No duplicate login or payment UI exists in the micro-portal.
- The portal rejects mismatched destination IDs, invalid digests, invalid fingerprints, stale revisions, prohibited keys, and unsupported public states.
- Public profiles contain only portal-safe fields.
- A `publicationEligible: false` record is never public.
- A suppression action removes public rendering without erasing audit evidence.
- The exact packaged portal artifact passes its own tests after import support is added.

## Initial launch restraint

Do not add a second professional account, checkout, billing portal, credential-verification system, or general professional editor inside a micro-portal. The portal may store a local read-only projection and portal-specific presentation fields only. Portal-specific facts must never overwrite the central Smarter Justice record.
