# Smarter Justice v1.7.48 — Personalized Attorney Invitations and Privacy-Minimized Launch Funnel Operations

## Material improvements

- Added owner-created, personalized attorney invitation links for the free basic-profile launch path.
- Invitation tokens are cryptographically random, stored only as SHA-256 hashes, displayed to the owner once, revocable, and time-limited.
- Public invitation lookup exposes only the minimum professional context needed to prefill the launch form; it never returns the professional email address.
- A validated invitation reuses its existing outreach contact instead of creating a duplicate.
- Invitation state is explicit: issued, opened, redeemed, revoked, or expired.
- The browser removes the raw invitation token from the visible URL and history immediately after successful validation.
- Added owner-managed public, professional, and mixed launch campaigns with recognized campaign codes and controlled status.
- Added allowlisted aggregate funnel events for public starting help, portal direction, professional search, attorney launch, and invitation progression.
- Funnel records deliberately exclude legal narratives, intake answers, professional email addresses, IP addresses, user agents, device fingerprints, cookies, and cross-site identifiers.
- Added owner campaign metrics, invitation activity, one-time-link handling, revocation, and aggregate CSV export to the private Initial Launch Activation workbench.
- Preserved the v1.7.47 free-profile cohort, lawful source-supported profile candidate workflow, and all central/profile/portal trust boundaries.

## Test and gate truth

- Official suite: 103 parts, comprising 102 dependency-independent parts and one PostgreSQL-dependent storage-readiness part.
- No deployment, profile-publication, portal-import, payment, Sponsored/Featured, opportunity, review, appointment, confidential-upload, external-AI, or automatic-write gate was opened.
- The release does not prove production email delivery, PostgreSQL durability, portal staging, device/accessibility acceptance, monitoring, backup/restore, legal approval, or deployment readiness.
