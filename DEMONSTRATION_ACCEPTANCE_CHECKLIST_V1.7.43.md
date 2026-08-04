# Smarter Justice Demonstration Acceptance Checklist — v1.7.43

## Central journey

- [ ] QR or portal link opens the expected claim/create context.
- [ ] Unknown and tampered portal context fails safely.
- [ ] Account creation, login, verification, recovery, and MFA are accepted in staging.
- [ ] Claim submission and owner/staff review work.
- [ ] Private central profile preview is accurate.
- [ ] Permitted edits save; protected changes enter exact-revision review.
- [ ] Portal application and eligibility remain separate.
- [ ] Founding Profile Pilot invitation and redemption work without changing paid state.
- [ ] Revocation works and is audited.
- [ ] Dashboard is usable on laptop, tablet, phone, keyboard, and reasonable zoom.
- [ ] Support, correction, suppression, removal, and security paths work.

## Each portal

- [ ] Exact portal artifact is verified in its dedicated builder chat.
- [ ] Claim, Create profile, Manage profile, and safe return links work.
- [ ] v1.4.0 projection validates and imports idempotently.
- [ ] Import receipt records counts, rejection, conflicts, last-known-good, and rollback.
- [ ] Public profile states are truthful.
- [ ] Suppression removes public rendering without destroying evidence.
- [ ] D4 staging journey is independently accepted.

## Production controls

- [ ] PostgreSQL, SMTP, monitoring, backup/restore, incident, support, TLS, and exact rollback are accepted.
- [ ] Payment remains closed unless Stripe and owner policies are fully accepted.
- [ ] Roger records the go/no-go decision.
