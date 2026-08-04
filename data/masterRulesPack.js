const crypto = require('crypto');

const MASTER_RULES_PACK_VERSION = '1.7.0';
const MASTER_RULES_PACK_EFFECTIVE_DATE = '2026-07-29';

const MASTER_RULES_PACK = {
  title: 'Smarter Justice Master Rules and Suggestions Pack',
  version: MASTER_RULES_PACK_VERSION,
  effectiveDate: MASTER_RULES_PACK_EFFECTIVE_DATE,
  status: 'approved self-contained legal-portfolio operating, integrated portal, profile-growth, design, accessibility, release-quality, carry-forward, portfolio-truth, and exact-artifact standard',
  purpose: 'Carry Roger’s current self-contained Smarter Justice owner decisions and the legal-network rules, the mandatory integrated legal-portal standard, strong defaults, recommendations, roadmap, complete improvement list, and specialty-adaptation authority into every portal build, replacement continuation prompt, manifest, dashboard, release gate, and handoff without requiring the owner to restate them.',
  priorityRules: [
    'The newest approved portal-specific continuation prompt governs that portal unless the owner explicitly supersedes it.',
    'The latest uploaded ZIP or repository state is the source of truth for code and must be inspected before changes.',
    'This Master Rules Pack supplies legal-network-wide requirements and defaults; it does not erase newer or more specific portal decisions.',
    'Older prompts, ZIPs, and summaries are historical context unless deliberately preserved by the newest governing prompt.',
    'When requirements conflict, protect users, privacy, security, truthful public language, professional boundaries, official-source verification, and legal or regulatory compliance first.'
  ],
  mandatoryRules: [
    'Roger is the final owner and decision authority. Smarter Justice is the active self-contained operating and governance system for the legal portfolio.',
    'Neutral Boardroom is not part of the initial launch and must not be a runtime, management, launch-gate, deployment, billing, profile, support, monitoring, backup, rollback, portal-integration, or source-of-truth dependency. Any retained boundary is dormant optional future non-confidential export only.',
    'The initial controlled portal order is Divorce Law Aid first, Estate Law Aid second, and Personal Injury Law Aid third. Immigration Oasis and later portals follow only after the initial model is proven.',
    'Personal Injury Law Aid includes vehicle accidents and broad personal-injury starting paths. Workers’ Compensation Law Aid remains separate. The independent Car Accident Law Aid repository and history are preserved as a dormant compatibility asset and are not automatically merged, deleted, launched as a competing pilot, or silently reassigned.',
    'Smarter Justice centrally owns professional identity, authentication, claims, verification, core profiles, firms, offices, seats, membership, billing, entitlements, support, and approved read-only profile distribution. Focused portals own their specialty content, evidence, public profiles, intake, brand, repository, deployment, and release truth.',
    'Claiming, verifying, correcting, and editing a basic professional or firm profile is free and must not require a paid membership, invitation, trial, promotional code, or sponsored product.',
    'Paid professional products are separate optional commercial programs. They may provide clearly labeled Sponsored or Featured prominence, enhanced visibility, lead eligibility, and access to case, attorney-review, or work opportunities only after every independent membership, verification, specialty, jurisdiction, conflicts, privacy, disclosure, support, compliance, and owner gate is satisfied.',
    'Payment must never buy identity verification, credential approval, practice-area evidence, portal eligibility, correction rights, organic trust signals, an endorsement, a favorable review, or a claim that the professional is the best match.',
    'Professional-growth charges must use disclosed fixed subscription, advertising, software, platform, or opportunity-access fees. Do not charge a percentage of legal fees, settlements, recoveries, refunds, or outcomes, and do not make charges contingent on retention, recovery, settlement, legal fees, or case results.',
    'Every paid placement must be conspicuously labeled as Sponsored or equivalent advertising language at the point of display. Organic ordering and substantive routing must remain neutral and independently governed.',
    'Live sponsored visibility and case-opportunity access must remain fail-closed until jurisdiction-specific attorney-advertising, solicitation, referral, fee-sharing, privacy, billing, conflicts, support, and qualified-counsel review evidence is recorded and Roger separately opens the applicable gate.',
    'Public specialty discovery belongs on focused portals. Any Smarter Justice professional lookup retained during migration must be noindexed, excluded from the public sitemap, truthfully labeled for claim or migration use, and must not become a competing permanent specialty directory.',
    "Every legal-portal build, audit, continuation prompt, release gate, design review, profile-growth plan, dashboard, and coordination handoff must include or exactly incorporate LEGAL_MICRO_PORTAL_INTEGRATED_STANDARD_V1.0.0.md.",
    "Public free launch, professional account preparation, attorney applications, paid enrollment, sensitive storage, and deployment are separate fail-closed gates. No narrower gate or configured secret proves a broader gate, and every activation requires its own evidence and explicit owner approval.",
    "Every appropriate legal-portal release has a dual mission: materially improve individually supported public professional coverage when evidence permits and materially improve complete product quality, not merely one or the other.",
    "The exact assigned-portal artifact remains implementation truth. Shared systems may be adapted only when they fit the portal specialty and may not import unrelated content, claims, data, branding, workflows, or legal assumptions.",
    "Every published individual attorney profile requires attorney-specific evidence connecting that person to the portal subject. Firm-wide practice, proximity, licensing alone, search snippets, generic directory categories, or AI prediction are insufficient.",
    "For New York candidate generation, use the official New York State Attorney Registrations dataset eqw2-r5nb as the primary structured identity and registration foundation, subject to permitted use and separate individual-practice evidence.",
    "Profile growth follows the owner-approved maximum-yield rotation across Downtown Brooklyn and 26 Court Street, broader Brooklyn, Manhattan, Queens, the Bronx, Northern Metro New Jersey, NYC-connected Connecticut, then Staten Island and Nassau before Suffolk, followed by statewide New York and the approved later-state order.",
    "Every profile-growth batch must preserve provenance, checked dates, official identity evidence, individual-practice evidence, deduplication, conflicts, rejection reasons, suppression, claim state, freshness, and exact new, updated, total, geography, practice, and evidence-quality metrics, including honest zero values.",
    "Every portal release must audit the complete applicable surface set, including public, professional, firm, owner/admin, evidence, import, account, form, directory, profile, claim, correction, removal, empty, loading, error, success, mobile, tablet, SEO, print, email, and accessibility states; homepage-only polish is insufficient.",
    "The Smarter Justice family design uses a bright-white or near-white foundation, restrained portal accent, professional typography, coordinated logo and favicon assets, accessible contrast, clear action hierarchy, and strong mobile, tablet, desktop, zoom, keyboard, reduced-motion, and assistive-technology behavior.",
    "Do not use nonfunctional decorative pills, capsules, chips, bubbles, or ovals. They are permitted only as real controls, links, filters, selectable options, or meaningful status indicators.",
    "Do not stop at plans, mockups, disconnected screens, empty importers, recommendations, or token profile batches when substantially more responsible implementation and testing can be completed.",
    "Every continuation prompt and release manifest must carry the complete current Next Version Improvement List. An item may disappear only when completed and verified, explicitly rejected by the owner, or superseded by a stronger controlling decision with evidence.",
    "Every final release must freeze source, regenerate a self-excluding inventory, package one authoritative ZIP, verify safe archive structure, extract independently twice, test the exact packaged bytes, verify post-test stability, and record every blocked or unrun test honestly.",
    'Do not make changes merely for the sake of making changes. Change only what materially improves users, operations, compliance, safety, security, reliability, maintainability, deployability, conversion, or legal-network compatibility.',
    'Keep each focused micro-portal separately branded, deployable, versioned, testable, and reversible even when it reuses shared Smarter Justice capabilities.',
    'Keep Immigration Oasis separate and immigration-only unless the owner expressly changes that decision.',
    'Use plain customer-facing language and keep internal builder, routing-engine, queue, handoff, release-gate, risk-flag, and technical terminology out of public pages.',
    'Every public release must include a documented customer-language audit covering navigation, headings, buttons, status labels, pricing, professional-profile wording, forms, legal pages, empty states, errors, and transactional messages; internal staff, developer, infrastructure, and readiness terminology belongs only in protected workspaces or documentation.',
    'Every primary public and professional conversion path must be reviewed on phone, tablet, and desktop widths for readable type, usable navigation, visible form labels, accessible error summaries, non-obstructive calls to action, touch-friendly controls, and no horizontal clipping or hidden required actions.',
    'Professional acquisition pages must clearly separate what works now from planned capabilities, public listing from claimed control, verification from membership, paid membership from consultation eligibility, and neutral directory results from clearly labeled sponsorship.',
    'Public professional and firm directories must return a useful documented default page size, expose accurate total and pagination information, support show-more or equivalent navigation, and include regression tests that prevent accidental one-result defaults or incomplete multi-record rendering.',
    'Official public-record finders must support bounded page sizes and later-page offsets, preserve the user’s search filters across pages, provide visible progress or result-count language, and fail honestly when the official source is unavailable.',
    'Public directory filters should be easy to clear and should be reflected in a shareable or bookmarkable URL when doing so does not expose private or sensitive information.',
    'Public professional and firm profile pages should use accurate page titles, descriptions, canonical URLs, and source-grounded structured metadata where practical, without turning unverified facts into claims or endorsements.',
    'Individual and firm profiles must receive equivalent truthfulness, source, claim-control, account-approval, edit-authorization, public-status, and correction safeguards appropriate to their different record types.',
    'Public professional checkout and enrollment pages should use vendor-neutral customer language unless naming a processor is necessary to the user decision; campaign attribution must be explicit and must never silently assign a location-specific campaign to general website signups.',
    'A professional signup funnel may continue from authenticated account creation to secure payment only when the plan, cadence, recurring amount, firm seat count, discounts, renewal terms, cancellation route, and non-guarantee disclosures are shown clearly before checkout.',
    'Smarter Justice and its portals must not imply they are law firms, tax firms, accounting firms, government agencies, or sources of guaranteed outcomes unless a separate verified professional engagement establishes otherwise.',
    'AI may assist with summaries, organization, question flows, missing-information checks, stage detection, source tracking, and draft support, but must not be presented as autonomous legal, tax, accounting, or other professional judgment.',
    'Official forms, filing instructions, fees, editions, deadlines, and source links must be verified conservatively from authoritative sources before a form path is described as completed, review-ready, or current.',
    'State, county, city, court, agency, and other jurisdictional differences must be collected or clearly flagged before specialty-specific conclusions are offered.',
    'Human Review Specialist work must remain distinct from attorney, CPA, enrolled-agent, accountant, tax-attorney, or other licensed professional review.',
    'Use Community Partner in public language. Community Partners do not provide legal or tax advice, promise results, or complete professional work for users.',
    'Do not expose secrets, internal storage paths, private tokens, user documents, matter details, or personal information through public APIs, URLs, logs, manifests, prompts, profile records, or partner dashboards.',
    'Every release must be tested from a clean install or fresh extraction, preserve clean release storage, and include honest release notes, version metadata, known limitations, and launch blockers.',
    'Every continuation prompt must include or embed this rules pack, identify its version and checksum, and preserve complete portal-specific instructions, decisions, adaptations, risks, version history, and unresolved work.',
    'Users must be able to choose AI-guided, human-first, or human-only help where the portal offers those modes. AI use, including document analysis and case-summary generation, must be explicit, purpose-limited, and optional unless a clearly disclosed specialty-specific reason requires otherwise.',
    'Do not force users to guess. Preserve uncertainty, missing records, requests for explanation, and answer-later states as structured follow-up items rather than converting them into false yes/no answers or official-form facts.',
    'Preparation, payment, staff review, professional review, draft generation, download, signature readiness, filing readiness, submission, transmission, agency receipt, and agency acceptance are separate states and must never be collapsed into one completed status.',
    'An environment flag, source URL, captured PDF, field map, or successful payment is never sufficient by itself to release an official form or customer document. Exact form/year/edition/jurisdiction evidence, semantic mapping, calculations where applicable, automated tests, page-by-page visual QA, customer verification, qualified review, and recorded owner release must pass.',
    'Public official-form delivery must fail closed through an evidence-backed approval ledger. Legacy allowlists or direct configuration lists may be metadata but cannot replace the required evidence record for the exact form.',
    'A universal case-level reviewed-file delivery workflow may use a checked manual-upload fallback when automated official-form population is unavailable, but the platform must not describe that fallback as proof that every official form is automatically completed.',
    'Transactional emails, text messages, calendar invitations, and reminders must use neutral wording and must not expose sensitive legal, tax, immigration, health, financial, or evidentiary facts.',
    'Private continuation and resume credentials must be high entropy, stored only in salted or hashed form where feasible, transmitted in protected headers or secure sessions rather than ordinary URL query strings, and isolated by user and matter.',
    'When production persistence, private object storage, malware scanning, or other sensitive-data infrastructure is selected or required, the system must fail closed rather than silently fall back to ephemeral or development storage.',
    'Privileged owner, administrator, staff, reviewer, and professional actions should require role-based access, multifactor authentication, session and device revocation, and recent-authentication step-up for sensitive approvals before broad production use.',
    'Broad marketing, paid intake, sensitive uploads, official-form release, and expanded cohorts must remain blocked until the applicable launch evidence, manual QA, staff/professional rehearsal, payment fulfillment, privacy/security, compliance, and controlled-pilot gates are recorded as passed.',
    'Professional profiles seeded from public information must be source-tracked, dated, conservative, and labeled unclaimed unless the professional verifies control.',
    'Official bulk profile connectors must use approved source-specific endpoints, preserve retrieval evidence, reject uncontrolled arbitrary URLs, avoid unsupported specialty inferences, and remain private until public-directory activation is legally and operationally approved.',
    'A seeded or free profile never implies endorsement, participation, paid membership, consultation availability, or trust in Smarter Justice.',
    'Only an active qualifying paid professional or covered firm member who also satisfies credential, jurisdiction, service, agreement, availability, owner-approval, and compliance requirements may receive consultation bookings or integrated marketplace opportunities.',
    'Membership, sponsorship, advertising, or subscription tier must never control AI risk analysis, credential verification, ratings, warnings, neutral eligibility, or claims that a professional is the best match.',
    'Do not take a percentage of legal fees, professional fees, settlements, recoveries, refunds, or outcomes unless jurisdiction-specific legal and ethics review expressly approves the exact arrangement.',
    'User identities, matter summaries, deadlines, and documents may be shared with a professional only through explicit, recorded, purpose-limited user consent and appropriate conflict-check controls.',
    'A New York City founding-member pilot may use introductory fixed monthly or annual pricing, but the offer must be truthful, clearly described as introductory or pilot pricing, and must not promise users, appointments, results, exclusivity, or permanent pricing.',
    'Firm and multi-office memberships may use per-attorney or per-professional seat billing and transparent volume discounts, but every covered professional must independently satisfy credential, jurisdiction, agreement, service, availability, owner-approval, and compliance gates.',
    'Premium listings, firm discounts, founding-member terms, campaign attribution, and paid public visibility must never change substantive AI analysis, neutral eligibility filtering, credential verification, ratings, warnings, or professional-quality claims.',
    'In-person attorney and firm outreach, building campaigns, mobile enrollment, QR codes, and sales-pipeline records must remain private, permission-aware, truthful, and compliant with building access, solicitation, advertising, privacy, and professional-conduct requirements.',
    'Professionals and firms should manage marketplace profiles, practice areas, services, firm seats, and participation across multiple micro-portals through one central Smarter Justice professional account; specialty portals may consume approved profile data but should not create conflicting independent marketplace identities.',
    'A request to claim a public-source profile must not grant edit access. Profile control begins only after identity and authority review and explicit owner approval links the profile to the requesting account; credential verification, membership, and consultation eligibility remain separate gates.',
    'A public professional directory may combine curated source-tracked records with live approved official-data lookup. Live official records remain unclaimed and must not receive inferred practice areas, participation status, membership status, or consultation availability from registration data alone.',
    'Stripe membership activation must occur only after a verified Checkout session or signed webhook confirms payment. Missing Stripe credentials must produce an honest non-activated state rather than a simulated paid membership.'
  ],
  strongDefaults: [
    'Use one Smarter Justice Master Coordination track for legal-network strategy and separate dedicated development chats for detailed portal implementation.',
    'Use common conventions for security, upload handling, roles, audit logging, health endpoints, release manifests, referral attribution, review states, and form-source records where those conventions genuinely fit the specialty.',
    'Provide a private owner Control Center that tracks portal versions, builds, milestones, decisions, adaptations, readiness, professional-network status, revenue capabilities, and future work.',
    'Use a Green, Yellow, and Red readiness model where helpful: Green means an exact verified self-service lane is released; Yellow means free organization or a preliminary draft without filing-ready claims; Red means qualified professional completion or approval is required.',
    'Use one-question-at-a-time guided journeys with back navigation, answer history, plain explanations, source-document comparison, and structured missing-information follow-up where they improve completion and accuracy.',
    'Offer substantial free public starting, organizing, truth-check, and supported self-service value while keeping human labor, professional responsibility, representation, government fees, and unreleased or unsafe completion lanes separately disclosed.',
    'Use manual-first appointment fulfillment before provider APIs are proven: staff-entered HTTPS meeting or scheduling links, phone/in-person instructions, localized times, neutral calendar text, downloadable calendar files, quote approval, preparation guidance, and reschedule/cancel requests.',
    'Maintain launch-readiness evidence packs, manual QA workbenches, dry-run scripts, cohort definitions, issue-severity rules, pause/rollback triggers, and owner go/no-go records for controlled pilots.',
    'Track lifecycle support after the initial deliverable, including follow-up expectations, corrections, renewal or compliance reminders, deadlines, obligations, and post-service status where appropriate to the specialty.',
    'Use fixed professional subscriptions, fixed platform-access charges, and clearly labeled advertising as the initial marketplace revenue foundation.',
    'Track every proposed marketplace revenue capability separately with an honest activation status, pricing status, professional audience, legal or ethics gate, and explicit separation from substantive AI decisions.',
    'Let users choose among neutral eligible professionals rather than describing a paying provider as the best professional.',
    'Prefer verified platform-interaction reviews over anonymous or unverified reviews when the review system is activated.',
    'Use staged activation: private foundation, curated pilot, public directory and booking, AI-guided marketplace, then fuller professional operating system.',
    'Keep public directory status, professional verification, paid membership, consultation eligibility, sponsorship, and review status as separate concepts.',
    'Build source-backed profile import and correction workflows before large-scale public profile activation.',
    'Use feature flags and honest statuses for planned, foundation-only, pilot, and live capabilities.',
    'Use a low-friction New York City founding-member pilot as an early go-to-market path, with mobile and QR enrollment, campaign attribution, in-person follow-up, and an owner-only professional sales pipeline.',
    'Use centralized firm billing, firm administrators, bulk invitations, seat activation and deactivation, individual professional verification, and volume-discount quotes where these improve firm enrollment without weakening individual eligibility controls.',
    'Treat suggested introductory pricing, including approximately $10–$20 per individual professional per month, as a testable pilot strategy rather than a permanent public price commitment.'
  ],
  specialtyAdaptationPolicy: {
    principle: 'Shared Smarter Justice standards are strong defaults, not inflexible rules.',
    permittedReasons: [
      'The portal’s legal or tax specialty requires different terminology, evidence, deadlines, or professional roles.',
      'A jurisdiction, court, agency, licensing body, or professional-conduct rule requires a different workflow.',
      'The portal’s users need a safer, clearer, more accessible, or more urgent experience.',
      'The portal’s forms, data model, pricing, account flow, review steps, security, or technical integrations require a narrower adaptation.',
      'A specialty-specific design materially improves accuracy, compliance, usability, conversion, or professional workflow.'
    ],
    documentationRequired: [
      'Identify the shared default being adapted.',
      'Explain the specialty-specific reason.',
      'Define the narrow scope of the adaptation.',
      'Record risks and mitigations.',
      'State the expected user, professional, compliance, or system benefit.',
      'Preserve the adaptation in later prompts until deliberately superseded.'
    ],
    nonWaivableBoundaries: [
      'Privacy and security safeguards',
      'Truthful public language and honest capability status',
      'Professional independence and no misleading endorsement',
      'Official-source and credential verification',
      'Consent-based data sharing',
      'Legal, tax, accounting, ethics, and regulatory compliance boundaries'
    ]
  },
  recommendations: [
    'Promote a portal-specific improvement into the shared standard only after it proves broadly reusable and beneficial.',
    'Maintain an expansion ledger for every large promised program so the platform cannot announce completion while agreed forms, jurisdictions, tests, professional validations, or owner releases remain unfinished.',
    'Track each official document at the exact form, year, edition, language, jurisdiction, source checksum, field-map, calculation, visual-QA, customer-verification, professional-signoff, owner-release, filing, and acceptance states.',
    'Use a first-case and first-cohort review loop: document what happened, measure response and fulfillment times, pause expansion when serious issues appear, and approve the next cohort only after the prior cohort is reviewed.',
    'Preserve actual package relationships in the Control Center, including full archive, lean continuation, overlay-only, deployable, historical, and do-not-clean-deploy roles, so a smaller continuation package is never mistaken for a complete deployment source.',
    'Build a cross-portal capability matrix showing which real portal currently has the strongest proven implementation of each shared capability and which features remain specialty-specific.',
    'Maintain a machine-readable portal manifest, release notes, roadmap, decision log, limitations file, and complete continuation prompt for every active portal.',
    'Track the exact Master Rules Pack version and checksum governing each build for reproducibility.',
    'Use source plans for each portal to identify official bars, licensing boards, courts, agencies, IRS resources, firm websites, and other approved profile-data sources.',
    'Start professional-network launches with curated invited professionals and limited jurisdictions rather than millions of unverified profiles.',
    'Validate revenue features through professional interviews, pilot conversion data, retention, appointment quality, and jurisdiction-specific compliance review before setting final prices.',
    'Preserve professional memberships, firm and multi-office plans, enhanced profiles, clearly labeled sponsorships, scheduling and dashboard tools, document-review workflows, analytics, staff seats, practice-growth tools, compliant fixed platform charges, CRM and practice-management integrations, and white-label or enterprise services as distinct configurable revenue programs.',
    'Treat automated deployments, payments, public reviews, credential monitoring, and cross-portal data sharing as gated capabilities rather than assumptions.',
    'Track outreach by building, floor, firm, professional, campaign, QR code, follow-up date, potential seats, objections, conversion status, and projected recurring revenue so direct sales can be measured and improved.',
    'Offer transparent multi-seat discounts and annual-payment options where commercially useful, while preserving higher-value future tiers for scheduling, intake automation, analytics, document workflows, staff seats, integrations, and enterprise services.',
    'Use a central professional account and firm workspace as the canonical marketplace identity across the portal family, with approved portal-specific views rather than duplicate profile databases.',
    'For New York launch coverage, prefer the official NYS Attorney Registrations connector for live lookup and use curated firm or practice-area facts only when supported by separate reliable sources.',
    'Track public-language readiness, mobile readiness, accessibility readiness, signup-and-conversion readiness, and prompt/build-handoff readiness as explicit Control Center fields for every active portal.',
    'Use public pages for customer decisions and protected pages for system readiness, technical evidence, configuration, owner operations, or staff details; keep internal pages out of public navigation and public sitemaps.',
    'For professional sales funnels, keep the primary next action obvious, shorten unnecessary setup steps, preserve a find-and-claim path, support individual and firm enrollment, and measure account creation, claim submission, checkout start, paid activation, verification completion, and consultation eligibility as separate conversion stages.',
    'Professional dashboards should provide an understandable setup checklist showing account, claim or profile control, public information, membership, verification, service, and opportunity-readiness progress without presenting payment as completion.',
    'Professional enrollment forms should use appropriate browser autofill attributes, input types, input modes, clear labels, and mobile-friendly controls to reduce repeated typing and improve in-person or QR enrollment.',
    'Firm pricing pages should show transparent seat tiers and may provide a clearly labeled estimate calculator, while final recurring amounts, discounts, renewal terms, and covered seats remain subject to confirmation before checkout.',
    'Public pricing pages should state clearly which AI-guided or self-service features are free, which human or professional services are optional paid upgrades, and which government, filing, court, agency, or third-party costs are separate.',
    'Test directory result completeness, default page size, pagination, firm detail pages, firm claim approval, and post-approval edits as one connected acquisition workflow before each marketplace release.',
    'On narrow phones, explicitly test the brand, menu control, top action, search filters, results, forms, and checkout actions for wrapping, clipping, overlap, and touch usability.'
  ],
  futureRoadmap: [
    'Owner accounts, short-lived sessions, multifactor authentication, role-based permissions, and session revocation',
    'Cross-portal capability matrix, package-role tracking, test evidence, build progress, completion ledgers, launch cohorts, capacity controls, and first-case follow-up inside the private Control Center',
    'Human-first and human-only service preferences with provider-specific consent and audit records',
    'Evidence-backed official-form approval ledgers and universal reviewed-file delivery gates with checked manual fallback',
    'Automated portal manifest synchronization and protected rules-pack retrieval by approved portals',
    'Professional and firm accounts, staff seats, calendars, appointment reminders, and consultation workflows',
    'Public claimable profiles, directory search, verified reviews, contact portals, and clearly labeled sponsorships',
    'Consent-based AI-guided professional discovery and secure organized-matter sharing',
    'Central forms and official-source registry with edition and credential monitoring',
    'Cross-portal staff, Human Review Specialist, paralegal, attorney, CPA, enrolled-agent, accountant, and other professional workflows',
    'Professional CRM, practice-management, calendar, communications, e-signature, analytics, and workflow integrations',
    'White-label, enterprise, institutional, and API offerings',
    'Controlled staging, deployment, approval, rollback, health monitoring, and incident management'
,
    'NYC founding-member sales operations with mobile enrollment, QR attribution, building and firm outreach, centralized firm billing, bulk invitations, volume discounts, conversion analytics, and recurring-revenue reporting'
  ],
  buildHandoffRequirements: [
    'Integrated legal-portal standard version and conformance status',
    'Complete carried-forward Next Version Improvement List with evidence for every removal',
    'Exact profile-growth and evidence-quality metrics, including honest zero values and attempted-source blockers',
    'Complete surface, responsive, accessibility, performance, security, and exact-artifact acceptance evidence',
    'Latest clean ZIP or repository reference',
    'Current version and deployment status',
    'Full test results from a clean environment',
    'Release notes and known limitations',
    'Updated portal manifest containing rules-pack version and checksum',
    'Complete portal-specific continuation prompt with embedded rules pack',
    'Control Center update summary',
    'Documented specialty adaptations and unresolved compliance questions',
    'No secrets, test submissions, uploads, user records, logs, or notification data in the release artifact'
  ],
  changeLog: [
    { version:'1.7.0', date:'2026-07-28', summary:'Made Smarter Justice self-contained for legal-portfolio operations; made Roger the final owner authority; moved Neutral Boardroom to dormant optional non-confidential export only; established Divorce, Estate, and Personal Injury as the initial pilots; included vehicle accidents within Personal Injury while preserving Workers’ Compensation separately and Car Accident Law Aid as an independent compatibility asset.' },
    { version:'1.6.0', date:'2026-07-27', summary:'Added the controlling 48-hour launch objective and separate fail-closed public, attorney-application, paid-enrollment, sensitive-storage, and deployment gates.' },
    { version:'1.5.0', date:'2026-07-27', summary:'Integrated the owner-approved dual-mission legal-portal profile-growth, complete-product-quality, family-design, no-decorative-pill, attorney-specific evidence, New York structured-source, maximum-yield geography, exact metrics, complete-surface audit, carry-forward, and exact-artifact requirements.' },
    { version:'1.4.3', date:'2026-07-20', summary:'Added official-source pagination and preserved-filter requirements, shareable and clearable public directory searches, public profile metadata and structured-data guidance, professional setup checklists, mobile autofill standards, transparent firm pricing estimators, and clearer free-versus-paid public pricing language.' },
    { version:'1.4.2', date:'2026-07-20', summary:'Added mandatory useful default directory page sizes, pagination and completeness regression tests, individual/firm profile and claim-control parity, vendor-neutral public checkout language, accurate campaign attribution, and explicit narrow-phone acquisition-flow testing.' },
    { version:'1.4.1', date:'2026-07-20', summary:'Added mandatory customer-language audits, phone/tablet/desktop conversion-path review, professional funnel truthfulness, transparent recurring-checkout disclosures, public/internal indexing separation, and explicit Control Center readiness fields for language, accessibility, conversion, and prompt/build handoffs.' },
    { version:'1.4.0', date:'2026-07-20', summary:'Added central professional and firm accounts across all micro-portals, owner-approved profile-control claims, public claimable professional search, live official New York attorney lookup, Stripe-confirmed founding memberships, firm per-seat checkout and volume discounts, Downtown Brooklyn 26 Court Street source-tracked launch profiles, and active tracking for DigitalDivorce, motor-vehicle/personal-injury, criminal, medical-malpractice, family, disability, bankruptcy, workers’ compensation, employment, and housing portals.' },
    { version:'1.3.0', date:'2026-07-20', summary:'Added second-pass Justice Tax Solutions and Immigration Oasis lessons: free-first Green/Yellow/Red readiness, no-guess guided journeys, human-only choice, exact official-form evidence ledgers, universal reviewed-file delivery fallback, separated completion states, neutral notifications, protected resume credentials, production fail-closed storage, privileged MFA, launch evidence packs, manual QA, controlled-pilot and cohort controls, lifecycle follow-up, and full/lean package-role tracking.' },
    { version:'1.2.0', date:'2026-07-20', summary:'Added the New York City founding-member go-to-market strategy, introductory fixed-price pilot guidance, in-person and QR enrollment, owner sales-pipeline tracking, firm per-seat billing, transparent volume discounts, centralized firm administration, and non-influence safeguards.' },
    { version:'1.1.0', date:'2026-07-20', summary:'Added the professional marketplace, paid-membership eligibility, source-specific public-profile connector, revenue-program governance, and no-specialty-inference requirements for the v1.4.0 foundation.' },
    { version:'1.0.0', date:'2026-07-20', summary:'Established the first versioned ecosystem rules pack with mandatory rules, strong defaults, specialty adaptation authority, professional marketplace requirements, prompt inheritance, protected API availability, and build reproducibility requirements.' }
  ]
};

function stableStringify(value){
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
function checksum(){ return crypto.createHash('sha256').update(stableStringify(MASTER_RULES_PACK)).digest('hex'); }
function markdown(){
  const p=MASTER_RULES_PACK;
  const bullets=items=>(items||[]).map(x=>`- ${x}`).join('\n');
  return `# ${p.title}\n\n- Version: ${p.version}\n- Effective date: ${p.effectiveDate}\n- Status: ${p.status}\n- SHA-256 checksum: ${checksum()}\n\n## Purpose\n\n${p.purpose}\n\n## Prompt and source priority\n\n${bullets(p.priorityRules)}\n\n## Mandatory legal-network rules\n\n${bullets(p.mandatoryRules)}\n\n## Strong defaults\n\n${bullets(p.strongDefaults)}\n\n## Specialty adaptation authority\n\n**${p.specialtyAdaptationPolicy.principle}**\n\nPermitted reasons:\n${bullets(p.specialtyAdaptationPolicy.permittedReasons)}\n\nRequired documentation:\n${bullets(p.specialtyAdaptationPolicy.documentationRequired)}\n\nNon-waivable boundaries:\n${bullets(p.specialtyAdaptationPolicy.nonWaivableBoundaries)}\n\n## Recommendations\n\n${bullets(p.recommendations)}\n\n## Future roadmap to preserve\n\n${bullets(p.futureRoadmap)}\n\n## Every build handoff must contain\n\n${bullets(p.buildHandoffRequirements)}\n\n## Change log\n\n${p.changeLog.map(x=>`- ${x.version} — ${x.date}: ${x.summary}`).join('\n')}\n`;
}
function apiPayload(){ return { ...MASTER_RULES_PACK, checksum:checksum(), formats:{ markdown:'/api/system/master-rules-pack?format=markdown', json:'/api/system/master-rules-pack?format=json' } }; }

module.exports = { MASTER_RULES_PACK_VERSION, MASTER_RULES_PACK_EFFECTIVE_DATE, MASTER_RULES_PACK, checksum, markdown, apiPayload };
