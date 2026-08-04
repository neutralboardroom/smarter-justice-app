# Smarter Justice 48-Hour Controlled Launch Runbook — v1.7.38

## Purpose

Prepare a real-customer public launch and a bounded founding-attorney launch without combining free public help, attorney applications, paid enrollment, sensitive storage, or deployment into one uncontrolled switch.

## Non-negotiable launch lanes

1. **Public starting help** may open only for non-saved starting help and public preparation tools. Do not collect highly sensitive information, saved legal stories, or confidential uploads through the public starting flow.
2. **Founding-attorney applications** may open only after production database, owner security, professional authentication, transactional email, legal-page review, support, incident response, accessibility acceptance, cohort limits, monitoring, rollback evidence, stored application controls, and explicit owner approval pass.
3. **Paid founding-attorney enrollment** may open only for individually approved applicants after the application gate, first-cohort account verification and MFA, Stripe lifecycle, backup, restore, cancellation/refund handling, stored payment gate, and explicit paid-pilot approval pass.

## Hours 0–12 — Freeze scope and ownership

- Freeze the exact launch artifact and rollback artifact.
- Name the support owner and incident owner.
- Define the founding cohort name and hard cap.
- Confirm public, professional, privacy, security, terms, membership, cancellation, refund, complaint, and disclaimer language.
- Confirm that payments, appointments, sponsorship, reviews, confidential uploads, automatic portal writes, and deployment remain closed until their separate gates pass.
- Complete `.env.launch.example` values in the protected production environment without committing secrets.

## Hours 12–24 — Production services

- Verify the canonical HTTPS domain and `/health` response.
- Verify PostgreSQL connection, migrations, transactions, restart behavior, and fail-closed writes.
- Bootstrap the durable owner account, enroll MFA, preserve recovery codes, remove bootstrap credentials, and keep legacy token access disabled.
- Verify professional email verification, password reset, MFA, recovery, and session revocation.
- Verify authenticated SMTP delivery, replies, bounces, SPF, DKIM, and DMARC.
- Configure external monitoring and alert ownership.
- Complete a production backup and an independent restore test.

## Hours 24–36 — Acceptance and payment tests

- Test homepage, public starting help, portal routing, directory, profile, contact, privacy, security, terms, and current-availability page.
- Test professional account creation, email verification, sign-in, reset, MFA, recovery, profile claim, firm account, application, support, and sign-out.
- Test phone, tablet, desktop, keyboard-only, focus, labels, errors, touch targets, 200% and 400% zoom, reduced motion, and screen-reader journeys.
- In Stripe test mode, verify approved-applicant checkout, signed webhook, duplicate event protection, renewal, failed payment, cancellation, refund, dispute handling, and access revocation.
- Verify no charge can begin from account creation, profile claim, or an unapproved application.

## Hours 36–48 — Stage, verify, decide

- Run `npm run launch:preflight -- --json` in the exact production configuration.
- Run the full official test chain, syntax/JSON checks, inventory validation, and exact-artifact verification.
- Stage the exact artifact separately from production and verify health, public routes, professional routes, email, database, monitoring, and rollback.
- Record the final blocked-check list and resolve or explicitly defer every item.
- Record separate owner decisions for public free launch, attorney applications, paid pilot, and deployment.
- Do not activate a broader lane merely because a narrower lane passed.

## Rollback

Immediate rollback artifact: `smarter-justice-v1.7.37.zip`

SHA-256: `e033daf1e65cf1681b13b535f6e828d186d17efdc1d6f8785fb3c9ebae911fdd`

Rollback must be tested in staging and the live service details must be recorded before deployment approval.

## Truth boundary

This runbook, code, and configuration contract prepare launch decisions. They do not prove that production services, legal review, field support, accessibility, payment operations, or deployment have passed. Evidence references and explicit owner approval remain required.
