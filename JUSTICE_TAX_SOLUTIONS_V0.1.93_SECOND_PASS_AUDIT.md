# Justice Tax Solutions v0.1.93 — Second-Pass Cross-Portal Audit

Date: 2026-07-20
Purpose: Re-audit the uploaded real tax platform, identify reusable Smarter Justice rules that were not fully captured in the first pass, and define the exact private Control Center tracking record.

## Source of truth

- Uploaded package: `justice-tax-solutions-v0.1.93(3).zip`
- Package version: `0.1.93`
- Package SHA-256: `e1dbedeeb6e290d016f19bdbec68b4d5ec3cf600aa0266963fc92bca6077f383`
- Public files: 126
- Source modules: 102
- Automated test files: 28
- Historical/audit documents: 95
- Package intentionally excludes runtime databases, taxpayer uploads, secrets, logs, and dependencies.

## Validation completed in this review

- Package metadata and README consistently identify v0.1.93.
- Static smoke test passed.
- Form 1040 simple W-2 controlled-pilot tests passed.
- The source tree and package scripts expose a very broad regression suite covering security, official forms, document intelligence, PostgreSQL, MFA, email, calculations, XFA, free-service rules, guided journeys, accessibility, and public copy.
- A clean `npm ci` completed successfully during the renewed audit.
- `npm run check` passed a broad sequence including static checks, controlled Form 1040 and EIC calculations, robots/sitemap, security, official IRS form workspace and encrypted-session checks, document intelligence, PostgreSQL, MFA, production-foundation, transactional-email, and webhook checks before the available execution window ended.
- The remaining exact-package checks should be rerun without an execution limit before the next tax release. No application failure was demonstrated in the renewed audit.
- The installation reports Multer 1.x deprecation and security warnings; a future tax build should regression-test migration to Multer 2.x rather than changing uploads blindly.

## Additional reusable systems found in the second pass

### 1. User-controlled AI participation

Justice Tax Solutions distinguishes guided AI assistance, human-first help, and human-only help. AI explanations can remain off, document AI can be separately controlled, and users may request that AI not be used for questions, documents, summaries, or matter handling. This should be a shared Smarter Justice capability where practicable.

### 2. No-guess uncertainty model

The guided journey preserves distinct uncertainty reasons such as needing an explanation, needing a document, answering later, or requesting human help. An uncertain response is never silently converted to “No.” This is stronger than a generic missing-field rule and should be shared.

### 3. Answer history and source-document verification

The guided return retains answer history, uses back navigation, requires separate source-document comparison for entered W-2 and interest records, and stores customer verification status. Other form-producing portals should adapt this model.

### 4. Expansion ledger and anti-false-completion controls

The guided expansion ledger records every agreed roadmap item and blocks a program-wide completion announcement until all promised items are complete, tested, professionally validated where required, and owner released. Large portal programs should use the same anti-overstatement mechanism.

### 5. Strong state separation for work status

Justice Tax Solutions separates preparation, staff review, professional review, payment, draft generation, customer verification, official-form release, signature, filing, e-file transmission, agency receipt, and agency acceptance. These are not synonyms and must remain distinct throughout Smarter Justice.

### 6. Exact official-form evidence model

The tax platform tracks source capture, checksum, edition/year, semantic mapping, calculations, page-by-page visual QA, professional validation, customer verification, and owner release. Merely registering an official URL or capturing a PDF does not release a workflow.

### 7. XFA detection and fail-closed handling

The platform detects XFA-based PDFs and blocks unattended population unless an approved XFA-capable engine, rendering comparison, commercial licensing, security posture, and professional approval are established. This should be a shared official-document rule.

### 8. Universal free-first policy without unsafe completion claims

All users can start, organize, and preserve work for free. A jurisdiction or form may remain Yellow or Red even while organization is free. Declining an upgrade does not erase work. This is a stronger freemium model than a simple free trial.

### 9. Human consultation without forced payment or AI

A review or consultation request can be created without automatic payment. Professional or human help remains separately scoped, quoted, accepted, scheduled, and fulfilled. The user can request help before the matter is complete.

### 10. Commercial terms and checkout gates

Each paid service has versioned scope, exclusions, customer responsibilities, no-guarantee language, filing boundaries, refund references, owner approval, and customer acknowledgment. Stripe checkout can be blocked until the correct terms and quote have been accepted. Payment never proves work readiness.

### 11. Professional credential snapshots and signoffs

Professional role, credential, standing, scope, assignment, and signoff can be recorded at the time of review. A later credential change should not erase the historical record of who reviewed a matter and under what verified authority.

### 12. Secure document-intelligence state machine

Documents move through quarantine, malware scan, extraction, OCR, redaction, AI analysis, staff review, professional approval, and customer-summary release. Original files and direct identifiers are not sent to AI providers. Provider-specific commercial and data-term approval is required.

### 13. Production fail-closed persistence

When PostgreSQL is selected, the system does not silently fall back to JSON. It includes migrations, import verification, transactions, backup, restoration tests, and retention utilities. Production data continuity is a launch gate, not an afterthought.

### 14. Privileged MFA and recent-authentication step-up

Owner and administrative approvals can require TOTP enrollment, recovery codes, device/session revocation, and recent MFA. This should become a Control Center and shared portal standard before sensitive production operations.

### 15. Written security and incident governance

The build tracks WISP approval, retention and deletion policy, incident response, legal holds, deletion approvals, vendor approvals, tabletop exercises, annual review dates, backup runs, and restoration evidence. These belong in the shared governance pack.

### 16. Privacy-safe transactional communications

Email templates avoid sensitive tax facts and send users back to the secure dashboard. Email delivery has queue-only behavior until a provider and authenticated domain are ready. Duplicate webhook/message events are handled idempotently.

### 17. First-user and cohort controls

The platform includes first-public-user guides, pre-submit checks, after-start guidance, first-case follow-up boards, staff service-level expectations, review-before-next-cohort rules, and broad-marketing blocks. Smarter Justice should track first-case and first-cohort approval separately from technical deployment.

### 18. Safe public summary alternative

When sensitive uploads are not ready, the platform offers typed or redacted summaries rather than forcing users to upload full documents. This is a useful fallback for every portal.

### 19. Taxpayer Action Center and urgency triage

A user who does not know which tax lane applies can use a unified action center and urgency self-check. This is a reusable pattern for high-branching portals.

### 20. Referral attribution continuity

Referral code, campaign, landing page, intake, quote, payment, appointment, and release events can remain connected. Rewards, scans, accounts, cases, and payment events have separate records. Analytics prohibit sensitive case content.

### 21. Deployment continuity and rollback evidence

The platform verifies that users, drafts, queues, professional work, documents, quotes, payments, referral rewards, and audit records survive a deployment. Data continuity is explicitly tested before a release is announced.

### 22. Automated customer-language and accessibility regression

Plain public language, public/private route separation, indexing controls, English/Spanish behavior, mobile layout, and accessibility are tested rather than treated only as manual design preferences.

## Tax-specific systems that should remain tax-specific

- PTIN, EFIN, Circular 230, CPA/EA/tax-attorney authority, preparer and representative rules.
- Tax-year calculations, EIC tables, Schedule EIC, Schedule 1-A, Schedule C/SE, Form 1040, 1040-X, 433-F, 9465, 2848, 8821, 843, 9423, 12153, and state/local tax forms.
- Tax return filing, e-file provider, bank products, refund advances/transfers, direct debit, and agency representation.
- IRS, New York State, and New York City tax-source synchronization and tax-specific deadline/risk triage.

## Required Control Center tracking

The Justice Tax Solutions record should include:

- Current package and exact version.
- Production deployment status and live health verification.
- Test suite status, last clean install, dependency audit, and unresolved test-environment issues.
- Free-service policy version and Green/Yellow/Red inventory by form/year/jurisdiction.
- Guided-journey completion ledger and remaining roadmap items.
- Official form inventory, source capture, checksum, mapping, calculation, visual QA, professional validation, owner release, and public availability.
- XFA form count and approved/manual handling path.
- Production database, storage, malware scanning, OCR, redaction, AI-provider, email, Stripe, MFA, WISP, retention, incident-response, backup, and restore status.
- Professional roster and credential verification by CPA, EA, accountant, tax attorney, preparer, and other roles.
- Consultation products, availability, quote, appointment, and fulfillment status.
- First-user, first-case, cohort, and broad-marketing approval status.
- Referral and campaign attribution, rewards, conversion, and privacy-safe analytics.
- Current blockers, next version, continuation prompt, and source ZIP.

## Recommended next tax build direction

Do not broaden claims. The next build should first complete a reproducible clean-package installation and full regression run, then continue exact guided-return expansion and production readiness in controlled form/year/jurisdiction lanes. Preserve the free-first model, human-only option, no-guess workflow, source verification, and all separate release states.
