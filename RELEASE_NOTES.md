# Smarter Justice v1.6.1 — Pre-Deployment Brand Header Correction

Released: 2026-07-20

This narrow release preserves the full v1.6.0 controlled-launch foundation and fixes only verified presentation consistency issues before deployment.

## Material improvements

- Removed the duplicate Smarter Justice text rendered beside the existing full horizontal wordmark in site headers.
- Standardized browser theme-color metadata to the platform navy (`#123d5f`).
- Added favicon and theme metadata to the private AI-readable summary page.
- Preserved all v1.6.0 security, persistence, marketplace, pilot, compliance, and capability-registry safeguards.

---

# Smarter Justice v1.6.0 — Controlled Founding-Professional Launch Readiness

Released: 2026-07-20

This release implements the highest-priority launch safeguards identified in the v1.5.3 audit. It preserves working public and marketplace functionality and does not open unrestricted enrollment or consultation booking.

## Material improvements

- Production startup now fails closed when PostgreSQL is absent or selected but unavailable, production state is not mirrored to local JSON, and subsequent writes are blocked after a runtime database-write failure is detected. Application-level transactional write confirmation remains a required future hardening step.
- Production readiness distinguishes a healthy database, durable private upload storage, and local development storage.
- Owner access now supports a central account, short-lived secure session, authenticator MFA, one-time recovery codes, other-session revocation, and production-default shutdown of the legacy token.
- Professional accounts now support password-reset messages, reset-token expiration and one-time use, invalidation of older reset requests, fragment-based reset links that keep tokens out of HTTP request URLs, hashed-only reset-token storage with no raw token retained in notifications or audit records, session revocation after reset, authenticator MFA, recovery codes, and other-session revocation.
- Founding membership enrollment is paused by default and governed by owner-controlled limits for individual memberships, firms, and total seats.
- Credential reviews, complaints, immediate compliance holds, resolutions, suspensions, and restoration of the prior profile state are recorded with audit history.
- The private Control Center now includes a versioned Cross-Portal Capability Registry and Success Pattern Library with reference portal/version, evidence sources, tests, value, source files, routes, data models, dependencies, defects, required adaptations, next actions, shared-core candidacy, and portal-by-portal status.
- Authentication-specific rate limits protect owner login, professional signup/login, and password-reset routes more tightly than the general API allowance.
- The public health endpoint no longer exposes storage paths, credential-configuration details, provider configuration, or database errors; detailed readiness remains authenticated.
- New integration tests cover owner security, professional recovery and MFA, production persistence failure controls, durable-upload gating, pilot gating, credential review, complaint handling, and reversible suspension.

## Preserved governance

- Master Rules and Suggestions Pack 1.4.3
- Shared Platform Standard 1.3.3
- Master Coordination Standard 1.3.3
- Portal Continuation Prompt Standard 1.3.3
- Professional Marketplace Standard 1.3.2

## Still required before opening the pilot

- Verified production PostgreSQL and durable private upload storage
- Owner account bootstrap followed by authenticator MFA enrollment and secure recovery-code custody
- SMTP delivery and password-recovery acceptance evidence
- Stripe test-mode checkout, signed webhook, renewal, failed-payment, cancellation, and refund evidence
- Final membership, privacy, advertising, ethics, credential, complaint, suspension, and support procedures
- Backup/restore testing, real-device testing, QR and office-enrollment testing, and first-cohort approval

---

# Smarter Justice v1.5.3 — Official-Source, Profile Discovery, Onboarding, and Pricing Clarity Polish

Released: 2026-07-20

This release is an evidence-driven pre-deployment pass over v1.5.2. It makes only changes that materially improve public discovery, attorney and firm conversion, onboarding clarity, mobile data entry, free-versus-paid pricing transparency, and future portal governance. Public consultation booking, public reviews, automatic professional matching, and unrestricted live enrollment remain disabled until their separate requirements are satisfied.

## Material improvements

- Added complete offset-based pagination to the official New York attorney-registration finder.
- Preserved official-source search filters across successive result pages and added honest shown-result progress and unavailable-source states.
- Added clear controls for both the Smarter Justice directory and official New York search.
- Reflected non-sensitive public directory filters in shareable, bookmarkable URLs.
- Added source-grounded dynamic profile titles, descriptions, canonical URLs, Open Graph metadata, and Person/Organization structured data.
- Added a professional dashboard setup checklist with progress across account, profile control, public information, membership, and independent opportunity requirements.
- Added a founding-firm membership estimator covering monthly and annual per-seat pricing and all approved pilot volume discounts.
- Improved signup autofill and mobile keyboards for telephone, website, address, and seat fields.
- Clarified free AI-guided starting help and the separate nature of human review, professional, government, filing, and third-party charges.
- Expanded Master Rules, Shared Platform, Professional Marketplace, continuation-prompt, and Control Center requirements so future micro-portals inherit these safeguards.

## Governance versions

- Master Rules and Suggestions Pack 1.4.3
- Shared Platform Standard 1.3.3
- Master Coordination Standard 1.3.3
- Portal Continuation Prompt Standard 1.3.3
- Professional Marketplace Standard 1.3.2

---

# Smarter Justice v1.5.2 — Directory Completeness and Firm-Profile Reliability Polish

Release date: July 20, 2026

## Purpose

This release is a second full pre-deployment audit of v1.5.1. Changes were limited to defects or friction that materially affected public search completeness, firm discoverability, profile claims, professional signup, mobile acquisition, Control Center governance, or release reliability.

## Material corrections

- Fixed an input-normalization defect that could turn an omitted result limit into a one-record professional or official New York attorney search.
- Fixed the firm-search mapper so each firm is built with the complete marketplace state rather than an array index.
- Added useful 25-record defaults, totals, offsets, and show-more controls for both individual and firm searches.
- Added a complete public firm profile surface and connected firm claim, owner approval, account-control, and authorized-edit workflow.
- Added firm claim and verification fields to the firm data model and update path.
- Prevented empty membership checkout controls while a claim remains under review.
- Added password confirmation and accurate general website versus 26 Court campaign attribution.
- Prevented direct find-and-claim signup from creating a duplicate private professional record alongside the existing public profile.
- Replaced processor-specific customer wording with secure, vendor-neutral checkout language where the processor name was not needed.
- Added narrow-phone header overflow protection and responsive directory quick filters.

## Public language and experience audit

- Re-audited all 53 HTML pages and local links.
- Rechecked public pages for internal staff, builder, infrastructure, readiness, credential, queue, gate, and deployment language.
- Preserved protected operational language only on noindex owner, staff, account, and readiness surfaces.
- Added static H1 loading states to dynamic individual and firm profile pages.
- Preserved honest distinctions among listing, claim, verification, membership, participation, sponsorship, and appointment eligibility.

## Control Center and governance

- Updated Master Rules and Suggestions Pack to 1.4.2.
- Updated Shared Platform Standard to 1.3.2.
- Updated Professional Marketplace Standard to 1.3.1.
- Added future-build evidence requirements for directory page size, totals, pagination, firm-profile parity, firm claim control, campaign attribution, vendor-neutral checkout language, and narrow-phone acquisition review.

## Activation boundaries

Public consultation booking, reviews, automated credential monitoring, and unrestricted live professional operations remain disabled. Live attorney enrollment still requires production persistence, Stripe test evidence, final terms and policies, credential and claim procedures, security hardening, and controlled-pilot acceptance testing.

---

# Smarter Justice v1.5.1 — Pre-Deployment Marketplace and Public Experience Polish

Release date: July 20, 2026

## Purpose

This release is a focused pre-deployment audit of v1.5.0. It changes only areas where the change materially improves public clarity, attorney and firm enrollment, mobile usability, legal and privacy communication, search indexing boundaries, Control Center governance, or release reliability.

## Professional acquisition and conversion

- Rebuilt the professional membership landing page with one clear promise: claim a profile, manage practice areas and firm seats centrally, and join the NYC founding network.
- Preserved $15 monthly and $150 annual founding individual pricing and transparent firm per-seat volume discounts.
- Added a three-step enrollment explanation and clearer available-now versus planned-feature sections.
- Rebuilt individual and firm signup for phone and tablet use, including account type, profile information, service-area selection, billing cadence, terms, and optional immediate Stripe checkout.
- Improved the public directory, profile view, professional sign-in, and professional dashboard language and navigation.
- Added professional membership terms covering recurring billing, renewal, cancellation, refunds, firm seats, profile control, verification, non-guarantee, suspension, and independent professional engagement.
- Kept public listing, claimed control, verification, paid membership, sponsorship, and consultation eligibility as separate states.

## Public-language and trust audit

- Rewrote Privacy, Security, Terms, Forms Roadmap, and After Review pages in customer language.
- Removed customer-facing references to internal builder, staff, configuration, readiness, and deployment concepts where they were not needed for a customer decision.
- Refined homepage first impression and added a visible professional founding-network invitation.
- Clarified that planned scheduling, consultations, intake, review, analytics, and integrations are not active until configured and tested.
- Preserved prominent private-service, no-government-affiliation, no-guarantee, and independent-professional boundaries.

## Mobile, tablet, and accessibility polish

- Added responsive professional pricing, signup, directory, profile, dashboard, legal-content, and call-to-action layouts.
- Added mobile navigation to professional account pages.
- Improved field grouping, checkbox cards, touch targets, wrapping, spacing, and narrow-screen calls to action.
- Preserved labels, fieldsets, legends, error summaries, counters, live status messages, and keyboard-accessible navigation.

## Public and private indexing separation

- Removed launch-readiness, production-readiness, AI-summary, customer-dashboard, result, checkout-result, staff, owner, and professional-account pages from the public sitemap.
- Added or strengthened noindex, nofollow, and noarchive directives on protected or user-specific pages.
- Added professional membership terms to the public sitemap.
- Expanded robots directives for protected and result surfaces.

## Control Center and future portal coordination

- Added accessibility readiness, public-language readiness, signup-and-conversion readiness, and prompt/build-handoff readiness to every portal record.
- Added these fields to generated continuation prompts and owner edit forms.
- Updated the Master Rules and Suggestions Pack to 1.4.1 and the Shared Platform Standard to 1.3.1.
- Future portal prompts now inherit mandatory public-language audits, mobile-device conversion reviews, professional-funnel truthfulness, recurring-checkout disclosure rules, and public/internal page separation.

## Unchanged safety boundaries

- Public consultation booking and public reviews remain disabled.
- Membership does not create verification, endorsement, appointment eligibility, users, clients, or results.
- Payment and sponsorship do not affect neutral eligibility, credential review, ratings, warnings, or substantive AI analysis.
- Profile claim requests remain read-only until owner approval.
- Live charging still requires Stripe credentials, signed webhooks, test evidence, production persistence, final terms, and legal/ethics review.

## Release validation

The final release is required to pass catalog, static, smoke, marketplace, JavaScript syntax, governance checksum, storage-cleanliness, dependency-audit, and fresh-ZIP extraction tests before delivery.
