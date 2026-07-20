# Smarter Justice v1.6.1

## v1.6.1: Pre-Deployment Brand Header Correction

This narrow release preserves every v1.6.0 launch-readiness safeguard while correcting a real presentation defect before deployment: the full horizontal logo already contained the Smarter Justice wordmark, while site headers also rendered a second text wordmark. Headers now use the accessible full logo once, theme-color metadata matches the navy brand color, and the AI summary includes the favicon. No marketplace, security, pricing, workflow, or launch gate was weakened or activated.

# Smarter Justice v1.6.0

Smarter Justice is the umbrella access platform, central professional marketplace, shared-system foundation, and private owner Control Center for a family of focused justice-oriented portals. It is not a law firm, tax firm, accounting firm, insurer, government agency, or guarantee of outcomes.

## v1.6.0: Controlled Founding-Professional Launch Readiness

This release preserves the v1.5.3 public directory, profile-claim, firm-seat, outreach, pricing, and portal-governance systems while materially strengthening the areas that could block a safe controlled pilot.

### Material improvements

- Blocks sensitive production writes unless PostgreSQL is configured and healthy; production startup does not fall back to local JSON, and detected runtime database-write failures block later writes. Application-level transactional write confirmation remains future hardening.
- Separates local-development storage from verified production readiness and requires durable private upload storage for sensitive traffic.
- Adds owner accounts with short-lived secure sessions, authenticator MFA, one-time recovery codes, and session revocation.
- Disables legacy owner-token access by default in production while preserving an explicit local/test migration path.
- Adds professional password recovery with single-current-token behavior, fragment-based reset links, hashed-only reset-token storage, authenticator MFA, recovery codes, and other-session revocation.
- Keeps professional enrollment paused by default and adds owner-controlled cohort limits for individual memberships, firms, and total firm seats.
- Adds manual-first credential-verification records, complaint records, immediate compliance holds, resolution history, and reversible suspension controls.
- Adds a first-class evidence-bearing Cross-Portal Capability Registry and Success Pattern Library to the Control Center.
- Adds tighter authentication-specific rate limits and removes internal configuration detail from the public health response.
- Adds regression tests for production storage failure, owner security, professional recovery/MFA, pilot gates, credential procedures, complaints, and suspension restoration.

### Activation boundary

The package remains a controlled-launch release candidate, not approval for unrestricted paid traffic. Production PostgreSQL, durable private upload storage, owner MFA enrollment, SMTP, Stripe lifecycle evidence, final policies and ethics review, backup/restore evidence, real-device testing, and first-cohort approval remain required.

## v1.5.3: Official-Source, Profile Discovery, Onboarding, and Pricing Clarity Polish

This release is a third evidence-driven pre-deployment pass over the founding professional marketplace. It fixes the remaining official New York source pagination gap, makes directory searches clearable and shareable, improves public profile discovery metadata, adds a professional setup checklist, adds a transparent firm-rate estimator, strengthens mobile enrollment fields, and clarifies the free public core versus optional paid help. No unfinished consultation, review, or automatic matching feature was activated.

### Material v1.5.3 improvements

- Added true offset-based pagination to the official New York attorney-registration finder, preserving all active filters and showing result progress.
- Added clear-filter controls and bookmarkable public directory searches without placing private data in URLs.
- Added source-grounded dynamic titles, descriptions, canonical URLs, Open Graph metadata, and structured Person/Organization data to public professional and firm profiles.
- Added a professional dashboard setup checklist that separates profile control, public information, membership, credentials, services, agreements, and opportunity eligibility.
- Added a transparent founding-firm rate estimator for monthly and annual per-seat pricing and volume discounts.
- Improved mobile enrollment fields with appropriate autocomplete, telephone, URL, address, and numeric input hints.
- Clarified that substantial AI-guided starting help can be free while Human Review Specialist, licensed professional, government, filing, and third-party charges remain separate.
- Expanded Control Center and prompt governance for official-source pagination, shareable directory filters, source-grounded metadata, onboarding progress, mobile autofill, and pricing clarity.
- Updated Master Rules Pack 1.4.3, Shared Platform Standard 1.3.3, Professional Marketplace Standard 1.3.2, and Portal Continuation Prompt Standard 1.3.3.

## v1.5.2: Directory Completeness and Firm-Profile Reliability Polish

This release is a second pre-deployment quality pass over v1.5.1. It corrects two real public-directory defects, completes the firm-profile claim and account-control path, improves default search completeness and pagination, prevents generic signups from being mislabeled as a 26 Court campaign, and strengthens narrow-phone acquisition safeguards. It preserves the prior public-language, legal-page, marketplace, and Control Center work without activating unfinished consultations or reviews.

### Material v1.5.2 improvements

- Corrected a default-limit defect that could reduce professional and official New York searches to one result when no limit was supplied.
- Corrected the multi-firm search builder so every firm receives the correct marketplace state and can render reliably.
- Added useful 25-record default pages, accurate totals and offsets, separate individual and firm results, and show-more controls.
- Added public firm detail pages with source evidence, represented practice areas, linked public professionals, and honest claim/participation labels.
- Added a complete firm claim workflow: central account request, read-only pending state, owner approval, account linking, and authorized editing.
- Added password confirmation, vendor-neutral public checkout language, and accurate general-versus-location-specific campaign attribution.
- Prevented find-and-claim signup from creating a second private professional record when an existing public profile is already being claimed.
- Prevented empty membership checkout forms while a profile or firm claim is awaiting approval.
- Added connected regression tests for multi-record directories, firm profiles, firm claims, owner approval, post-approval edits, and default NY official-source page size.
- Updated Master Rules Pack 1.4.2, Shared Platform Standard 1.3.2, and Professional Marketplace Standard 1.3.1 so later portal prompts inherit these reliability requirements.

## v1.5.1: Pre-Deployment Marketplace and Public Experience Polish

This release preserves the v1.5.0 marketplace foundation and completes a focused pre-deployment quality pass. It improves the attorney and firm acquisition funnel, customer-facing language, public legal and privacy explanations, mobile navigation and forms, public/internal indexing separation, and Control Center readiness tracking without activating unfinished booking, reviews, or professional-service claims.


### Material v1.5.1 improvements

- Rebuilt the professional membership page around a clearer claim-profile, central-account, founding-price, and firm-seat conversion path.
- Rebuilt individual and firm signup into a short mobile-friendly flow that can continue to secure Stripe checkout after account creation.
- Reworked public professional search, profile, login, and dashboard pages with clearer status labels and fewer internal terms.
- Added dedicated professional membership terms covering recurring billing, renewal, cancellation, firm seats, profile status, non-guarantee, and independent professional engagement boundaries.
- Rewrote privacy, security, platform terms, forms-roadmap, and after-review pages in public language.
- Removed owner, staff, technical, and launch-readiness pages from the public sitemap and added no-index protections to private and result pages.
- Added explicit Control Center fields for accessibility, public-language, signup/conversion, and prompt/build-handoff readiness.
- Updated Master Rules and Suggestions Pack 1.4.1 and Shared Platform Standard 1.3.1 so every future portal prompt inherits these release-quality requirements.

### Launch-critical capabilities

- Public professional and firm profile finder.
- 16 source-tracked Downtown Brooklyn firm records and 11 source-tracked individual professional records created from public information.
- Live lookup against the approved New York attorney-registration data source when available.
- One central Smarter Justice professional or firm account across all micro-portals.
- Profile-claim requests that remain read-only until owner identity and authority approval.
- Professional and firm profile editing after authorized account control is established.
- Firm roster and covered-seat management.
- Founding individual membership at $15 monthly or $150 annually.
- Founding firm per-seat membership with transparent volume discounts.
- Stripe subscription Checkout and signed-webhook/verified-session activation foundation.
- No simulated paid status when Stripe credentials are missing.
- Central owner tracking for professional accounts, profiles, firms, outreach, memberships, revenue programs, and all current or planned micro-portals.

Public booking, public reviews, AI-selected “best professional” claims, and automatic consultation routing remain disabled until the later compliance, credential, scheduling, consent, conflicts, moderation, and professional-service gates are completed.

## Central professional identity

An attorney, tax professional, law firm, or approved professional should manage their marketplace presence from the main Smarter Justice platform—not through conflicting accounts inside every specialty portal.

One account may manage:

- multiple professional profiles;
- a firm and its covered professionals;
- multiple practice areas;
- participation in multiple Smarter Justice micro-portals;
- office locations and jurisdictions;
- professional services;
- firm seats and billing targets;
- membership status;
- claim, correction, and verification requests.

Specialty portals may display approved profile and service information, but Smarter Justice remains the canonical professional marketplace identity and management system.

## Profile truthfulness and public sources

Profile states remain separate:

- unclaimed public-information profile;
- claim pending;
- claimed;
- verified;
- participating;
- integrated;
- sponsored;
- suspended or archived.

A public-source profile does not imply that the professional participates in, endorses, pays, or trusts Smarter Justice. It does not imply consultation availability, quality, or suitability for a particular user.

Each source record may track:

- source name and URL;
- publisher and authority level;
- retrieval and verification dates;
- facts supported;
- external source identifier;
- source-review status;
- use limitations and notes.

The New York source connector uses the approved NYS Attorney Registrations dataset. Registration data may support identity, public registration, and business-location facts, but it must not be used alone to infer practice area, quality, participation, or appointment eligibility.

The public finder combines 16 curated firm records and 11 curated individual professional records around 26 Court Street with live official-data lookup. This avoids freezing thousands of potentially stale records inside the release ZIP while permitting attorneys throughout Brooklyn, Manhattan, and the Bronx to locate an official record and begin a private verification process.

## Claim and account-control safeguards

A claim request never grants immediate edit control.

1. The professional creates or signs into a central Smarter Justice account.
2. The account requests control of an existing public profile.
3. The profile remains read-only and appears as a pending claim.
4. Smarter Justice reviews identity and authority.
5. The owner explicitly links the profile to the account.
6. Credential verification, membership, agreements, services, and consultation eligibility remain separate requirements.

This prevents an unauthenticated or unverified person from editing another professional’s public profile merely by submitting a claim form.

## Founding memberships and firm discounts

### Basic public profile

- Free source-tracked listing where appropriate.
- Claim and correction workflow.
- No consultation eligibility.
- No professional dashboard participation merely from being listed.

### NYC Founding Professional Member

- $15 monthly or $150 annually during the pilot.
- Central professional dashboard.
- Enhanced claimed profile after review.
- Potential eligibility for free or paid consultations after all independent gates are satisfied.
- Multiple practice areas and portal relationships.
- Future scheduling, intake, review, and analytics tools.

### NYC Founding Firm Membership

- $15 per covered professional per month or $150 annually per seat before discounts.
- 10% discount for 2–4 seats.
- 15% discount for 5–9 seats.
- 20% discount for 10–24 seats.
- 25% pilot discount for 25 or more seats, subject to owner review.
- One firm account, centralized billing target, covered-professional roster, and future firm analytics and routing.

Membership never guarantees users, appointments, exclusivity, ranking, revenue, results, or permanent pricing.

## Consultation eligibility

Paid membership is necessary for integrated opportunities but never sufficient by itself. Eligibility also requires:

- owner marketplace approval;
- verified identity and active professional credentials;
- lawful jurisdiction and service authority;
- accepted marketplace, independence, and conflicts terms;
- approved micro-portal and practice-area participation;
- at least one active scheduling-enabled service;
- availability;
- no suspension, expired credential, past-due membership, or unresolved compliance block.

Sponsorship, premium placement, or payment never controls AI risk analysis, legal or tax warnings, credential verification, ratings, or a statement that a professional is the best choice.

## Stripe membership checkout

The professional dashboard can create recurring Stripe Checkout sessions using the selected plan, billing cadence, firm seat count, and applicable discount.

Membership status is activated only after:

- a signed Stripe webhook reports a completed and satisfied Checkout session; or
- the authenticated professional confirms a Checkout session that belongs to the same account and Stripe reports the session complete with payment satisfied.

If Stripe credentials are absent, the system saves the intended membership target and returns an honest “not activated” state. It never fabricates payment.

Production use requires:

- `STRIPE_SECRET_KEY`;
- `STRIPE_WEBHOOK_SECRET`;
- live/test-mode review of products, prices, subscriptions, cancellations, failed payments, refunds, and taxes;
- final professional-membership terms and jurisdiction-specific legal/ethics review.

## Master Rules and Suggestions Pack 1.4.3

The versioned governance artifacts are:

- `SMARTER_JUSTICE_MASTER_RULES_AND_SUGGESTIONS_PACK.md`
- `SMARTER_JUSTICE_MASTER_RULES_AND_SUGGESTIONS_PACK.json`
- protected API `/api/system/master-rules-pack`
- deterministic export command `npm run governance:export`

Every generated Master Coordination prompt and portal continuation prompt embeds the current pack. Every generated portal manifest records its version and checksum. Approved portals may retrieve the pack with `X-Portal-Rules-Token`; query-string credentials are rejected.

Rules Pack 1.4.3 includes:

- central professional identities across portals;
- owner-approved profile claims;
- public claimable profile search and approved official-data lookup;
- Stripe-confirmed memberships;
- NYC founding-member and firm-seat strategy;
- professional-funded freemium public service;
- lessons from Justice Tax Solutions and Immigration Oasis second-pass audits;
- full/lean/overlay package tracking;
- official-form evidence ledgers and universal release gates;
- no-guess guided workflows;
- separate preparation, review, payment, release, filing, and acceptance states;
- pilot, first-case, cohort, capacity, launch-evidence, and manual-QA controls;
- specialty adaptation authority.

Shared standards remain strong defaults rather than inflexible requirements. A portal may document a narrow specialty-specific adaptation when it improves legal accuracy, compliance, safety, usability, professional workflow, or technical reliability without weakening non-waivable protections.

## Portfolio and builder dashboard

The private Control Center tracks 23 current or planned records, including the six uploaded real platforms:

1. Immigration Oasis — effective v1.10.227 overlay on required v1.10.162 full base.
2. Justice Tax Solutions — v0.1.93.
3. ContractCreator.com — v0.1.0.
4. Business Launch Desk — v0.2.6.
5. Estate Help Desk — v1.0.36.
6. CoveredNYC — v1.0.30 healthcare and coverage arm.

It also tracks planned builds including DigitalDivorce, Motor Vehicle / Personal Injury Help Center, Criminal Law Help Center, Medical Malpractice Assistant Center, Family Law Help Center, Social Security and Disability Help Center, Bankruptcy and Debt Help Center, Workers’ Compensation Help Center, Employment and Labor Law Help Center, and Tenant / Landlord Help Center.

Tracked fields include version, ZIP role, deployment status, tests, progress, completed capabilities, next build, blockers, launch readiness, shared-rule contributions, specialty adaptations, professional roles, continuation prompt, release history, and source package.

Second-pass audit artifacts included in this release:

- `IMMIGRATION_OASIS_V1.10.227_SECOND_PASS_AUDIT.md`
- `JUSTICE_TAX_SOLUTIONS_V0.1.93_SECOND_PASS_AUDIT.md`

## Customer and professional service model

The long-term service ladder remains:

1. Free starting guidance.
2. AI-guided self-help and organization.
3. Human Review Specialist assistance.
4. Limited attorney, CPA, enrolled-agent, accountant, tax-attorney, or other professional review.
5. Free or paid consultation.
6. Limited-scope professional service.
7. Full professional engagement where independently offered and accepted.

Core AI-guided public assistance should remain free or very low cost where safe and sustainable. Professional memberships, firm tools, enhanced profiles, clearly labeled advertising, scheduling, analytics, workflow tools, integrations, and enterprise services may subsidize public access. Government, court, filing, tax, third-party, and professional fees remain separate.

## Private Owner Control Center

Open `/control-center.html` and sign in with the separately bootstrapped owner account. Production owner access uses a short-lived HttpOnly session and authenticator MFA. The legacy `OWNER_CONTROL_CENTER_TOKEN` is disabled by default in production and should be retained only for an explicitly authorized local/test migration. The Control Center is not linked from customer pages, is excluded from the public sitemap, and does not display customer matter data.

It manages:

- portal portfolio, packages, versions, releases, progress, risks, and readiness;
- Master Rules Pack and generated governance artifacts;
- professional and firm records;
- professional-account summaries, active sessions, owned profiles/firms, and owner-approvable pending claims;
- source evidence and source plans;
- membership plans, firm quotes, revenue programs, and outreach;
- credentials, services, jurisdictions, portal mappings, and agreements;
- profile claims, corrections, removal requests, and credential updates;
- official New York attorney source preview and controlled import.

Owner account sessions, authenticator MFA, one-time recovery codes, and other-session revocation are included. Fine-grained multi-owner roles, self-service owner password recovery, device history, and suspicious-session controls remain future work.

## Run locally

```bash
npm ci
npm run governance:export
npm test
npm start
```

Open `http://localhost:3000`.

- Public professional finder: `/professionals.html`
- Professional membership: `/professional-membership.html`
- Professional signup: `/professional-signup.html`
- Professional dashboard: `/professional-dashboard.html`
- Private Control Center: `/control-center.html`

## Important environment settings

Configure secrets only through Render or another secure secret store:

- `APP_BASE_URL`
- `OWNER_ACCOUNT_EMAIL` and `OWNER_ACCOUNT_PASSWORD` for the one-time production bootstrap
- optional local/test-only `OWNER_CONTROL_CENTER_TOKEN` during an explicitly authorized migration
- `PORTAL_RULES_API_TOKEN`
- `ADMIN_TOKEN`
- reserved `STAFF_SIGNUP_CODE` and `SESSION_SECRET` values for later staff-account work; these do not replace `ADMIN_TOKEN` in this release
- `PROFESSIONAL_SESSION_DAYS`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- production database and durable private storage settings
- SMTP settings
- optional AI-provider settings

Never place credentials in URLs, source records, public profiles, notes, prompts, manifests, screenshots, or repository files.

## Launch boundaries

The public profile finder and central professional-account foundation are operational in this source package. Broad live launch still requires:

- production database and encrypted durable storage;
- staging acceptance of professional password recovery, optional MFA, recovery codes, and session revocation, plus the policy for when professional MFA becomes mandatory;
- production owner account bootstrap, MFA enrollment, recovery-code custody, and restart/session-revocation evidence;
- final membership, privacy, advertising, professional-independence, cancellation, and refund terms;
- live Stripe subscription and webhook testing;
- professional identity and credential review procedures;
- owner claim-approval operations;
- support, complaint, suspension, and incident procedures;
- mobile and in-person enrollment testing;
- final New York legal and professional-ethics review;
- controlled founding-member pilot approval.

Public consultation booking, public reviews, credential monitoring, consent-based matter sharing, and professional-opportunity routing remain later gated phases.
