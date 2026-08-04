'use strict';
const INNOVATION_LAB_V1724={
  version:'1.7.24',
  reviewedAt:'2026-07-22',
  purpose:'Turn access-to-justice evidence and user problems into small, testable, privacy-preserving improvements without copying competitors or silently opening regulated services.',
  operatingRules:[
    'Start with a documented user problem, not a fashionable technology.',
    'Prefer device-only and minimum-data designs before persistent or cross-sector services.',
    'Make every automated suggestion explainable in ordinary language.',
    'Separate general information, organization, professional judgment, and regulated advice.',
    'Record a success measure, a failure signal, safeguards, and an owner decision before expansion.',
    'Do not treat automated tests as real-user, accessibility, legal, security, or deployment acceptance.'
  ],
  sources:[
    {name:'Legal Services Corporation — 2025 Technology Initiative Grants',url:'https://www.lsc.gov/grants/technology-initiative-grant-program/technology-initiative-grant-awards-tig-projects-funded-year',observation:'Current projects emphasize multilingual intake, guided forms, e-filing support, legal-help websites, and scalable service delivery.'},
    {name:'National Center for State Courts — Guiding principles for court technology',url:'https://www.ncsc.org/resources-courts/guiding-principles-court-technology',observation:'User-centered, mobile-friendly, plain-language, remote-first, data-informed, and continuously refined services are favored.'},
    {name:'Legal Services Corporation — Justice Gap research',url:'https://justicegap.lsc.gov/resource/executive-summary/',observation:'Civil legal problems frequently cluster across housing, health, income, safety, family, and consumer needs and often substantially affect finances and health.'},
    {name:'ABA technology and AI ethics materials',url:'https://www.americanbar.org/groups/young_lawyers/resources/tyl/practice-management/guide-implementing-ai-tools-legal-practice/',observation:'Confidentiality, competence, supervision, verification, disclosure, and secure information flows remain central when technology assists legal work.'}
  ],
  experiments:[
    {id:'whole-situation-map',title:'Whole Situation Map',status:'implemented in v1.7.24',userProblem:'People often arrive with one label even though the problem affects housing, money, health, safety, family, benefits, business, or property at the same time.',hypothesis:'A transparent device-only map will help users recognize connected preparation needs and avoid a one-portal dead end without transmitting facts.',successMeasures:['Users can identify why every sector appears.','Users understand that the map is not advice, eligibility, diagnosis, coverage analysis, or a professional recommendation.','Users can create and review a local handoff without sending it.'],failureSignals:['Users believe the map selected a lawyer or diagnosed a claim.','Users enter highly sensitive details despite warnings.','Users cannot distinguish an official deadline from an organizer prompt.'],safeguards:['No network request, storage, analytics, AI, score, lead, routing, or automatic cross-sector sharing.','Broad topic selections only; explicit sensitive-data warning.','Transparent rule trace and user-controlled exports.'],nextDecision:'Conduct real-device, accessibility, and comprehension acceptance before broader promotion.'},
    {id:'source-freshness-receipts',title:'Public source freshness receipts',status:'candidate',userProblem:'People may not know whether legal information or a profile fact is current, official, self-reported, or independently verified.',hypothesis:'A consistent source/freshness receipt can improve trust without creating a misleading platform rating.',successMeasures:['Users can distinguish official, professional-controlled, community, and commercial sources.','Stale or unverified facts are easier to report and suppress.'],failureSignals:['Users interpret source type as endorsement or credential verification.'],safeguards:['No quality score or outcome implication.','Separate source review from credential verification and participation.'],nextDecision:'Prototype on a small set of public resources and profiles.'},
    {id:'accessible-guided-voice',title:'Accessible guided voice intake research',status:'research only — closed',userProblem:'Typing-heavy intake can exclude users with disabilities, limited literacy, limited English, or urgent mobile-only access.',hypothesis:'User-controlled voice capture could reduce barriers if it can be made private, accurate, multilingual, reviewable, and human-supervised.',successMeasures:['Accurate user review and correction before any save or transmission.','Documented accessibility and language performance.'],failureSignals:['Sensitive audio retention, transcription errors, hidden cloud processing, or unsupervised legal classification.'],safeguards:['No implementation until provider, privacy, security, consent, retention, accessibility, language, legal, and human-review gates pass.'],nextDecision:'Keep closed; study device-local and explicit-review architectures only.'},
    {id:'cross-sector-consent-receipt',title:'Cross-sector consent receipt',status:'candidate after standalone control center maturity',userProblem:'A user may need coordinated help but should not lose control of which facts move between sectors.',hypothesis:'A previewable, revocable, minimum-necessary consent receipt can make future handoffs understandable and auditable.',successMeasures:['Users can preview, edit, approve, revoke, and see a transfer history.'],failureSignals:['Bundled consent, automatic lead creation, hidden recipients, or copied confidential records.'],safeguards:['No automatic transfer; purpose, recipient, fields, duration, and revocation shown separately.'],nextDecision:'Do not implement public transfer until identity, privacy, security, retention, support, and sector-specific legal review pass.'}
  ],
  rejectedShortcuts:[
    'A general-purpose AI chatbot that invites confidential facts before privacy and human-review gates pass.',
    'A legal-risk score, win probability, case value, deadline prediction, or eligibility score presented as authoritative.',
    'Automatic professional matching, lead transmission, or cross-sector sharing based on organizer answers.',
    'Paid ranking, unverified reviews, outcome badges, or urgency pressure designed to force conversion.'
  ]
};
module.exports={INNOVATION_LAB_V1724};
