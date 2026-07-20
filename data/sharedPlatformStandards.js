const SHARED_STANDARD_VERSION = '1.3.3';

const GOVERNANCE = {
  title: 'Smarter Justice Shared Platform Standard',
  purpose: 'Coordinate a family of separate, focused justice micro-portals through one private owner portfolio system without forcing every specialty into one rigid design, workflow, or codebase.',
  operatingModel: [
    'Smarter Justice is the umbrella brand, trusted starting point, portfolio coordinator, shared-system steward, and private owner Control Center.',
    'Each focused portal remains a separate branded and deployable product with its own portal-specific build history, code package, workflows, risks, compliance decisions, and launch plan.',
    'The Smarter Justice Master Coordination track governs ecosystem strategy, priorities, shared architecture, standards, cross-portal compatibility, Control Center development, and portfolio progress.',
    'Detailed implementation remains in a dedicated development chat for each portal.'
  ],
  masterCoordinationScope: [
    'Overall ecosystem strategy and portal priorities',
    'Shared architecture, interoperability, and reusable systems',
    'Shared customer, owner, staff, paralegal, reviewer, and professional dashboard standards',
    'Shared referral and Community Partner strategy',
    'Shared Human Review Specialist and separate professional-review workflows',
    'Shared staff roles, permissions, assignments, and audit expectations',
    'Shared form, official-source, edition, jurisdiction, readiness, and delivery standards',
    'Shared security, privacy, data-minimization, upload, and audit requirements',
    'Shared AI uses, safeguards, fallback rules, and prohibited claims',
    'Shared compliance boundaries and truthful public-language principles',
    'Shared pricing principles, account strategy, and consent-based cross-portal continuity',
    'Control Center development, portfolio roadmap, build progress, risks, blockers, and launch readiness',
    'Master Rules and Suggestions Pack governance, protected retrieval, versioning, checksum, prompt inheritance, and reproducible handoffs',
    'Professional marketplace status, membership eligibility, credential/source standards, consultation architecture, consent, sponsorship separation, and revenue capabilities'
  ],
  sharedDefaults: [
    'Clear separation between Human Review Specialist review and attorney or other professional review',
    'State, county, city, court, agency, and jurisdiction awareness where applicable',
    'Source-tracked official forms and conservative form-readiness and delivery claims',
    'Private-by-default uploads, continuation paths, staff access, and audit trails',
    'Role-based access for owner, administrators, staff, paralegals, attorneys, CPAs, enrolled agents, accountants, and other approved reviewers',
    'Compatible referral and Community Partner attribution with data minimization',
    'Consistent versioning, health checks, release notes, continuation prompts, testing, manifests, deployment records, and rollback awareness',
    'Mobile-first, accessible, plain-language customer experiences',
    'Documented customer-language audits for navigation, status labels, pricing, forms, errors, legal pages, professional profiles, and transactional messages before release',
    'Phone, tablet, and desktop review of every primary public and professional conversion path, including navigation, touch targets, form labels, error summaries, calls to action, and horizontal overflow',
    'Clear separation of currently available professional features from planned tools, public listing from profile control, verification from membership, and membership from consultation eligibility',
    'Useful default professional and firm directory result sizes, accurate totals, pagination or show-more controls, and regression coverage for multi-record rendering',
    'Official public-record finder pagination with preserved filters, visible progress, bounded page sizes, and honest source-unavailable states',
    'Clearable and shareable public directory filters when no private or sensitive information is placed in the URL',
    'Accurate titles, descriptions, canonical URLs, and source-grounded structured metadata for public professional and firm profiles where practical',
    'Professional setup checklists that keep profile control, public information, membership, verification, services, and opportunity readiness separate',
    'Mobile-friendly professional enrollment with appropriate autocomplete, input types, input modes, and transparent firm seat estimates',
    'Clear free-versus-paid public pricing language separating AI-guided self-service, Human Review Specialist work, professional fees, and government or third-party charges',
    'Equivalent public-source, claim, verification, account-control, edit-authorization, and correction safeguards for individual and firm profiles',
    'Accurate campaign attribution and vendor-neutral customer payment language on general professional acquisition pages',
    'No government affiliation, guaranteed outcome, autonomous filing, or professional-relationship claims unless a separate valid engagement establishes otherwise',
    'Changes are made only when they improve users, operations, compliance, safety, reliability, maintainability, deployability, conversion, or coordinated ecosystem value',
    'Users can choose AI-guided, human-first, or human-only assistance where applicable, with explicit consent and purpose-limited AI use',
    'No-guess question flows preserve uncertainty, answer-later states, missing records, and requests for human explanation',
    'Preparation, review, payment, drafting, download, signature, filing, submission, receipt, and acceptance remain separate states',
    'Exact form/year/edition/jurisdiction release evidence and page-by-page QA are required before official-form completion claims',
    'Green/Yellow/Red readiness classifications distinguish released self-service, free organizer/preliminary work, and professional-required lanes',
    'Neutral transactional messages and calendar content avoid sensitive matter details',
    'Controlled pilots use launch evidence, manual QA, cohort controls, pause/rollback triggers, and owner go/no-go records',
    'Public professional listing, claim, verification, membership, participation, sponsorship, reviews, and consultation eligibility remain separate states',
    'Source-seeded profiles remain unclaimed and do not imply endorsement, membership, participation, availability, or quality',
    'Paid membership is required for integrated professional opportunities but never substitutes for credentials, jurisdiction, service, agreement, availability, approval, or compliance',
    'Sponsorship and payment never control substantive AI analysis, warnings, credential verification, ratings, or neutral eligibility'
  ],
  deviationPolicy: {
    allowed: true,
    principle: 'Shared standards are strong defaults, not inflexible rules.',
    reasons: [
      'The portal’s legal, tax, benefits, business, or government-form specialty requires a different workflow',
      'Jurisdiction, court, agency, filing, licensing, ethics, or professional rules require adaptation',
      'Users face different urgency, evidence, accessibility, safety, literacy, or comprehension needs',
      'A different professional-review structure is safer, more accurate, or operationally necessary',
      'Technical separation, data minimization, security, resilience, or performance requires a different implementation',
      'A portal-specific approach materially improves usability, conversion, operations, or outcomes without creating deceptive claims'
    ],
    requirements: [
      'The deviation must be deliberate and not merely inconsistency for its own sake',
      'The shared default, reason, scope, risks, and expected benefit must be documented',
      'The change should be narrowly tailored to the portal’s actual needs',
      'Privacy, security, professional boundaries, source verification, truthful public language, and legal/compliance safeguards may not be weakened',
      'Reusable improvements should be proposed back to the shared standard when appropriate'
    ]
  },
  futurePromptRequirements: [
    'Current Smarter Justice shared-system standard and deviation policy',
    'Portal identity, purpose, audience, scope, exclusions, and public boundaries',
    'Prompt-priority rules and newest ZIP/code source-of-truth rules',
    'Current production and development versions, latest ZIP, repository, deployment, health, and environment status',
    'Exact package roles and deployment rules, including full archive, lean continuation, overlay, historical, deployable, and do-not-clean-deploy status',
    'Current test evidence, launch cohort, capacity status, completion ledger, first-case follow-up, and manual QA status',
    'Portal-specific decisions, terminology, workflows, forms, pricing, review types, jurisdiction rules, and justified adaptations',
    'Completed features, partially completed foundations, future features, unresolved issues, known limitations, risks, and launch blockers',
    'Shared components used and compatibility requirements',
    'Testing, security, privacy, storage, payment, email, AI, and deployment requirements',
    'Recommended next build, ordered workflow, required artifacts, and Control Center update summary',
    'Instruction not to remove or break working functionality and not to change merely for the sake of changing',
    'Current Master Rules Pack version, checksum, protected API reference, change history, and embedded rules',
    'Portal-specific professional types, public-source plans, paid-membership gates, services, consent, sponsorship, review, and revenue requirements where applicable',
    'Directory completeness, default page size, pagination, official-source later-page support, clearable/shareable filters, individual/firm profile parity, claim-control tests, profile metadata, campaign attribution, firm estimate transparency, onboarding checklist, and narrow-phone acquisition evidence where a professional marketplace is active'
  ],
  futureControlCenterRoadmap: [
    'Portal manifests and controlled portfolio synchronization',
    'Cross-portal capability matrix identifying the strongest proven implementation of each reusable system',
    'Evidence-backed official-form approval ledgers, universal reviewed-file delivery gates, expansion ledgers, and first-cohort review controls',
    'AI-guided, human-first, and human-only service preferences with consent and audit history',
    'Central build, version, roadmap, release, deployment, health, incident, and launch-readiness tracking',
    'Shared forms and official-source registry with edition and jurisdiction tracking',
    'Centralized staff, paralegal, attorney, CPA, enrolled-agent, accountant, and specialist role framework',
    'Referral and Community Partner coordination across portals',
    'Consent-based cross-portal routing and continuity',
    'Central configuration, feature flags, analytics, alerts, feedback, and compliance-review history',
    'GitHub, Render, database, email, Stripe, and AI status integrations without exposing secrets',
    'Staging previews, approval gates, controlled deployment, and rollback only after authentication, audit, and safety controls mature',
    'Professional and firm accounts, credential monitoring, calendars, booking, consent-controlled matter sharing, reviews, complaints, subscriptions, analytics, CRM integrations, and white-label services'
  ]
};

module.exports = { SHARED_STANDARD_VERSION, GOVERNANCE };
