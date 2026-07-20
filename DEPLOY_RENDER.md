# Deploy Smarter Justice v1.6.1 to Render

This release contains a public professional-profile finder and central professional-account foundation. Deployment alone does not authorize broad live professional operations. Use a controlled staging or founding-member pilot until production authentication, persistence, Stripe, verification, terms, and legal/ethics review are complete.

## v1.6.1 controlled-launch deployment order

1. Deploy to staging or a controlled Render service with PostgreSQL and a durable private disk. Do not use production local JSON for sensitive writes.
2. Set `OWNER_ACCOUNT_EMAIL` and a unique `OWNER_ACCOUNT_PASSWORD` of at least 14 characters for the first successful database-backed start.
3. Sign in at `/control-center.html`, enable authenticator MFA, and securely retain the one-time recovery codes.
4. Remove both owner bootstrap environment values after confirming the account survives a restart. Keep `ALLOW_LEGACY_OWNER_TOKEN=false`.
5. Configure SMTP and prove password-recovery delivery without including sensitive matter details.
6. Configure Stripe test mode and record checkout, signed webhook, subscription, failure, cancellation, and refund evidence.
7. Keep the professional pilot status paused until legal/ethics review, credential and complaint procedures, backup/restore, real-device, QR, and first-cohort checks are complete.

The service may serve public read-only pages without production persistence, but production-sensitive writes return `503 STORAGE_NOT_READY` until PostgreSQL is healthy.


## Repository and service setup

1. Place app contents at the repository root whenever practical. Avoid another nested-folder deployment unless Render Root Directory is intentionally configured.
2. Use Node 20 or later.
3. Build/install command: `npm ci`
4. Start command: `npm start`
5. Set `APP_BASE_URL` to the canonical HTTPS URL.
6. Keep every secret in Render environment variables. Never commit secrets.

## Required secrets and configuration

Set long, independent values for the controls active in this release:

- `PORTAL_RULES_API_TOKEN`
- `ADMIN_TOKEN`

`STAFF_SIGNUP_CODE` and `SESSION_SECRET` remain reserved for later staff-account work and do not replace `ADMIN_TOKEN` in v1.6.1.

Owner and professional sessions use secure HttpOnly cookies on Render/production. `PROFESSIONAL_SESSION_DAYS` may adjust the default 14-day professional-session period. Password recovery, authenticator MFA, recovery codes, and other-session revocation are included; staging must verify them before pilot use. Suspicious-session detection and mandatory professional MFA remain later controls.

Before real sensitive or paid use, configure:

- `DATABASE_URL`
- durable encrypted private file/object storage
- SMTP
- backup and restoration procedures
- monitoring and incident response

## Stripe professional memberships

Set:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Professional founding memberships use inline recurring Stripe price data based on the platform’s approved plan and firm-seat quote. Membership activates only after a verified completed Checkout session with payment satisfied.

Before live billing, test in Stripe test mode:

- individual monthly and annual subscriptions;
- firm quantities and every volume-discount tier;
- signed webhook handling;
- duplicate webhook idempotency expectations;
- failed, past-due, canceled, and refunded subscriptions;
- billing-email and customer creation behavior;
- taxes, receipts, cancellation, renewal, refund, and support language;
- confirmation that no membership becomes active when Stripe is unconfigured or a session is incomplete.

Do not confuse professional membership billing with customer matter payments. They are separate products and workflows.

## Master Rules Pack API

Approved micro-portals may retrieve the current rules pack from:

`GET /api/system/master-rules-pack`

Use:

`X-Portal-Rules-Token: <PORTAL_RULES_API_TOKEN>`

The owner credential may also access it. Query-string credentials are rejected. JSON and Markdown formats report the current version and checksum.

## Public professional pages

Verify:

- `/professionals.html`
- `/professional-profile.html?id=<profile-slug>`
- `/professional-membership.html`
- `/professional-membership-terms.html`
- `/professional-signup.html`
- `/professional-login.html`
- `/professional-dashboard.html`

The directory and membership pages are public. Signup, login, dashboard, professional account APIs, and owner APIs should remain excluded from indexing.

## Official New York attorney source

The profile finder may query the fixed NYS Attorney Registrations connector. Render needs outbound HTTPS access. Production requests should be throttled and monitored.

The official dataset may support public registration and address facts. It does not prove specialty, quality, participation, membership, availability, or suitability. A selected official record creates only a private verification-pending account profile until reviewed.

## Owner profile-claim operations

A public claim request does not grant edit control. Owner staff must review identity and authority and then use the protected approval workflow to link the profile to the professional account. Credential verification, membership, agreements, service activation, and consultation eligibility remain separate.

## Persistence boundary to verify

Production startup fails closed when PostgreSQL is missing or unavailable, and production state is not mirrored to local JSON. After a runtime database-write failure is detected, later writes are blocked. The current application does not yet wait for transactional confirmation on every request-level write, so staging must deliberately test database interruption and recovery before any sensitive cohort opens. Do not describe this release as fully transactionally fail-closed.

When Render provides `RENDER_DISK_MOUNT_PATH`, that mounted path takes precedence over `SMARTER_JUSTICE_STORAGE_DIR` for private file storage. Confirm the mount is attached and writable before launch.

## Verification after deployment

- `/health` reports version `1.6.1` without exposing storage paths, credentials, provider configuration, or database errors.
- Owner account sign-in and MFA work, legacy owner-token access remains disabled, and protected portal-rules access is configured.
- Public professional directory and central account feature flags are true.
- Public booking and public reviews remain false.
- Public search returns source-labeled 26 Court Street profiles.
- Official New York lookup handles success and outage states honestly.
- Staff `ADMIN_TOKEN` cannot open owner endpoints.
- Query-string owner, admin, partner, and rules credentials are rejected.
- Professional signup creates an HttpOnly session.
- Claim requests remain pending/read-only before owner approval.
- Missing Stripe configuration does not activate membership.
- Test-mode Stripe checkout and signed webhooks activate only the correct account target.
- Firm membership calculates correct seat quantities and discounts.
- `/launch-readiness` accurately reports remaining blockers.

## Controlled founding-member launch prerequisites

Before recruiting paying attorneys in production, complete or approve:

- final professional membership, privacy, cancellation, renewal, refund, advertising, and professional-independence terms;
- New York legal and professional-ethics review;
- identity, authority, and credential-verification procedure;
- owner claim-approval and suspension procedure;
- complaint, correction, removal, and support process;
- production database and account backups;
- professional password-recovery and MFA staging acceptance, including recovery-code handling;
- Stripe test evidence;
- mobile and in-person signup testing;
- outreach materials and truthful founding-member disclosures;
- controlled pilot size and pause conditions.

Public consultations, reviews, automated credential monitoring, client matter sharing, and professional opportunity routing remain later gated features.

## Post-deployment directory and firm-profile verification

Before the founding-member pilot, confirm that the default directory shows multiple professional and firm records, filters work for 26 Court Street/Brooklyn/Manhattan/Bronx, show-more controls load additional results, firm profiles open correctly, firm claims remain read-only before owner approval, and approved firm accounts can edit only their connected records. Test the general website signup separately from location-specific QR campaign links.
