const { PORTALS } = require('../data/portals');
const { SHARED_STANDARD_VERSION, GOVERNANCE } = require('../data/sharedPlatformStandards');
const store = require('./store');
const masterRules = require('../data/masterRulesPack');
const { PORTFOLIO_SEED_OVERRIDES, PRIVATE_PORTFOLIO_SEEDS } = require('../data/portalPortfolioSeed');
const { CAPABILITY_REGISTRY_VERSION, buildCapabilityRegistry } = require('../data/crossPortalCapabilities');

const PORTFOLIO_STATUSES = ['live','pilot','testing','development','planned','paused','archived'];
const HEALTH_STATUSES = ['not checked','healthy','degraded','offline','not configured'];
const READINESS_STATUSES = ['not started','foundation','needs configuration','needs review','pilot ready','production ready','not applicable'];
const PRIORITIES = ['critical','high','medium','low','backlog'];
const ACTIVE_BUILD_STATES = ['not started','planning','building','testing','ready for release','released','paused'];

const DEFAULT_REVIEW_TYPES = {
  'immigration-oasis': ['Human Review Specialist','Immigration attorney when appropriate'],
  'justice-tax-solutions': ['Human Review Specialist','CPA','Enrolled Agent','Accountant','Tax Attorney'],
  'estate-planning-probate': ['Human Review Specialist','Estate-planning attorney','Probate attorney'],
  'business-launch-desk': ['Human Review Specialist','Business attorney','CPA','Accountant','Tax professional','IP attorney or registered practitioner'],
  'contract-creator': ['Human Review Specialist','Contract or business attorney','Other subject-matter professional when appropriate'],
  'bankruptcy-debt-help': ['Human Review Specialist','Bankruptcy attorney','Consumer-debt attorney'],
  'disability-benefits-help': ['Human Review Specialist','Benefits attorney','Accredited representative or qualified advocate where permitted'],
  'housing-tenant-help': ['Human Review Specialist','Housing or landlord-tenant attorney'],
  'accident-injury-help': ['Human Review Specialist','Personal-injury attorney','Medical-malpractice attorney','Workers’ compensation attorney'],
  'name-records-employment': ['Human Review Specialist','Employment attorney','Criminal-record attorney','Other qualified professional as appropriate'],
  'intellectual-property-desk': ['Human Review Specialist','Trademark or copyright attorney','Registered patent attorney or patent agent'],
  'general-smarter-justice-start': ['Human Review Specialist','Attorney','CPA','Enrolled Agent','Accountant','Other approved professional']
};

const DEFAULT_BUILD_TARGETS = {
  'immigration-oasis': 'Continue as a separate immigration-only platform and adopt shared improvements only when they improve the specialized immigration experience.',
  'justice-tax-solutions': 'Build the focused tax preparation and tax-resolution portal with distinct but coordinated service lanes.',
  'estate-planning-probate': 'Create the state-aware estate-planning and probate workflow family.',
  'business-launch-desk': 'Create formation, federal IP, ongoing compliance, and tax-routing workflows.',
  'contract-creator': 'Build the multi-AI contract creation, review, explanation, comparison, and professional-review platform.',
  'bankruptcy-debt-help': 'Develop deadline-aware debt, lawsuit, collection, and bankruptcy organization workflows.',
  'disability-benefits-help': 'Develop benefits application, evidence, denial, appeal, and deadline workflows.',
  'housing-tenant-help': 'Develop state and local housing, eviction, repair, rent, and court-document workflows.',
  'accident-injury-help': 'Develop accident, evidence, insurance, medical-record, and high-risk professional-routing workflows.',
  'name-records-employment': 'Plan records, name-change, expungement, employment, and unemployment workflows.',
  'intellectual-property-desk': 'Develop source-tracked trademark, patent, copyright, and office-action workflows.',
  'general-smarter-justice-start': 'Improve umbrella routing, shared systems, and private owner portfolio control.'
};


const DEFAULT_KNOWN_METADATA = {
  'immigration-oasis': {
    currentProductionVersion:'1.10.116 (last confirmed live June 22, 2026; verify live)', latestDevelopmentVersion:'1.10.227 effective overlay',
    latestZipName:'v1.10.162 full archival/deployment base + v1.10.227 lean continuation overlay (do not clean-deploy lean alone)', repository:'https://github.com/neutralboardroom/immigration-oasis-app',
    productionUrl:'https://immigrationoasis.com', deploymentService:'Render', activeBuildState:'testing', progressPercent:88,
    continuationPromptVersion:'v1.10.227 lean continuation history with v1.10.162 full-base package rules',
    lastReleaseSummary:'Customer-readability polish over the preserved full archive, with professional-help appointments, launch evidence, all-forms QA, universal case-level delivery, and evidence-backed official-PDF gates.'
  },
  'justice-tax-solutions': {
    currentProductionVersion:'Not confirmed deployed', latestDevelopmentVersion:'0.1.93',
    latestZipName:'justice-tax-solutions-v0.1.93.zip', deploymentService:'Render-ready development package', activeBuildState:'testing', progressPercent:84,
    continuationPromptVersion:'Create or refresh from v0.1.93 second-pass audit and current Smarter Justice Rules Pack',
    lastReleaseSummary:'Nationwide free-first guided 2025 return foundation with Schedule EIC sample, exact EIC calculations, official-form governance, secure document intelligence, MFA, professional operations, and production-readiness controls.'
  },
  'estate-planning-probate': {
    currentProductionVersion:'Not confirmed deployed', latestDevelopmentVersion:'1.0.36', latestZipName:'estate-help-desk-v1.0.36.zip',
    activeBuildState:'testing', progressPercent:68, continuationPromptVersion:'Create or refresh from Estate Help Desk v1.0.36 audit',
    lastReleaseSummary:'NY/NJ-first estate planning and probate pilot scaffold with document lifecycle, template governance, paralegal and attorney gates, capacity controls, and production evidence.'
  },
  'business-launch-desk': {
    currentProductionVersion:'Not confirmed deployed', latestDevelopmentVersion:'0.2.6', latestZipName:'business-launch-desk-v0.2.6-lifecycle-communications-polish-mvp.zip',
    activeBuildState:'testing', progressPercent:58, continuationPromptVersion:'Create or refresh from Business Launch Desk v0.2.6 audit',
    lastReleaseSummary:'Federal-first business launch, IP, compliance, business-tax, lifecycle, data-room, referral, professional-routing, and operations MVP.'
  },
  'contract-creator': {
    currentProductionVersion:'Not deployed for confidential production use', latestDevelopmentVersion:'0.1.0', latestZipName:'contractcreator-v0.1.0-first-base.zip',
    activeBuildState:'planning', progressPercent:30, continuationPromptVersion:'Create or refresh from ContractCreator.com v0.1.0 audit',
    lastReleaseSummary:'Functional first-base preview with five contract intents, deterministic issue detection, side-specific multi-perspective Contract Board, risk routing, and dashboard/library concepts.'
  },
  'general-smarter-justice-start': {
    currentProductionVersion:'1.0.6 (last known; verify live)', latestDevelopmentVersion:'1.6.1', latestZipName:'smarter-justice-v1.6.1.zip',
    repository:'https://github.com/neutralboardroom/smarter-justice-app', productionUrl:'https://smarter-justice-app.onrender.com', deploymentService:'Render',
    activeBuildState:'ready for release', progressPercent:99, continuationPromptVersion:'v1.6.1 Rules Pack 1.4.3, v1.6.0 controlled-launch safeguards plus verified pre-deployment brand-header correction',
    lastReleaseSummary:'Controlled founding-professional launch-readiness release with fail-closed production startup, detected-write blocking, durable-upload gating, truthful storage checks, owner account sessions and MFA, professional password recovery and MFA, pilot capacity gates, credential and complaint procedures, and a first-class cross-portal Capability Registry.'
  }
};

const DEFAULT_PORTAL_FUTURES = {
  'immigration-oasis': ['Continue verified USCIS form-path expansion','Preserve English/Spanish customer support and Human Review Specialist workflows','Adopt shared portal manifests and Control Center updates only where they improve the separate immigration platform'],
  'justice-tax-solutions': ['Tax notice upload and deadline triage','Prior-return savings and amended-return review','New personal and business tax preparation','Tax resolution workflows for debt, audits, OIC, installment agreements, liens, levies, and unfiled returns','Community Partner referral system and CPA/EA/accountant/tax-attorney review lanes'],
  'estate-planning-probate': ['Wills, trusts, powers of attorney, health care directives, beneficiary and asset organization','Upload and revise existing estate documents','State-aware probate and estate-administration workflows','Attorney review for complex or high-risk matters'],
  'business-launch-desk': ['Business formation, EIN, governing documents, licenses, and ongoing compliance','Federal trademark, patent, and copyright starter workflows with state/local modules clearly separated','Ongoing tax and compliance support','Community Partner referral tools'],
  'contract-creator': ['Multi-AI contract creation, review, comparison, explanation, improvement, and negotiation support','Contract upload and version comparison','Optional attorney or subject-matter professional review for higher-risk agreements','Contract management and renewal/deadline support'],
  'bankruptcy-debt-help': ['Debt-lawsuit and collection-notice organization','Bankruptcy financial organizers and deadline-aware workflows','Settlement and judgment/garnishment support','Attorney review routing'],
  'disability-benefits-help': ['SSDI/SSI application and appeal organization','Medical evidence and provider coordination','Veterans and public-benefit notice workflows','Deadline and professional-review routing'],
  'housing-tenant-help': ['Eviction, repair, rent, deposit, and housing-court workflows','State/county/city-aware rules and deadlines','Landlord, tenant, and foreclosure-adjacent document organization','Attorney review routing'],
  'accident-injury-help': ['Accident timeline, evidence, insurance, police-report, medical-record, and bill organization','Separate high-risk medical-malpractice workflow','Workers’ compensation and injury deadline routing','Attorney review and organized demand-support files'],
  'name-records-employment': ['Name-change and record-correction workflows','Record sealing, expungement, and certificate routing','Employment, wage, workplace-document, and unemployment appeal workflows','State-aware professional review'],
  'intellectual-property-desk': ['Trademark, patent, copyright, specimen, goods/services, and office-action starter workflows','Official USPTO and Copyright Office source tracking','Registered patent practitioner and IP attorney review paths'],
  'general-smarter-justice-start': GOVERNANCE.futureControlCenterRoadmap
};

const DEFAULT_RELEASE_HISTORY = {
  'immigration-oasis': ['1.10.116 | 2026-06-22 | last confirmed live | I-601A provisional-waiver support track','1.10.162 | 2026-06 | first-base packages | full archive plus lean continuation base'],
  'general-smarter-justice-start': ['1.2.1 | 2026-07-20 | completed | umbrella-router polish and privacy/security hardening','1.3.0 | 2026-07-20 | completed | private owner Control Center foundation','1.4.0 | 2026-07-20 | completed | Master Rules Pack, professional marketplace, official NY attorney connector, paid membership, NYC founding-member outreach, firm discounts, consultation, and revenue foundation','1.5.0 | 2026-07-20 | completed | public directory, central professional accounts, profile claims, recurring founding memberships, firm seats, and portfolio tracking','1.5.1 | 2026-07-20 | completed | public-language, legal-page, mobile, conversion, indexing, and Control Center readiness polish','1.5.2 | 2026-07-20 | completed | directory default-limit fix, multi-firm reliability, firm-profile claim parity, campaign attribution, and narrow-phone acquisition safeguards','1.5.3 | 2026-07-20 | completed | official-source pagination, shareable filters, profile metadata, onboarding checklist, firm estimate, and pricing clarity','1.6.0 | 2026-07-20 | completed | fail-closed production persistence, owner/professional account security, controlled pilot gates, compliance procedures, and Capability Registry','1.6.1 | 2026-07-20 | completed | corrected duplicate header wordmark and standardized brand metadata before deployment']
};
const DEFAULT_LIMITATIONS = {
  'immigration-oasis': ['Live version and deployment health should be reverified before the Control Center record is treated as current','Separate Immigration Oasis code and continuation prompt are not imported into this Smarter Justice package'],
  'general-smarter-justice-start': ['Owner authentication is a separate long-token foundation, not yet an account/session/MFA system','Portfolio records are manually maintained and do not yet synchronize from portal repositories or deployments','No automatic production deployment, staging approval, or rollback controls','Portfolio manifests generated here are not yet imported back from each source repository']
};
const DEFAULT_NEXT_BUILD_INSTRUCTIONS = {
  'immigration-oasis': ['Continue detailed development only in the Immigration Oasis portal chat using its newest governing prompt and ZIP','Send a concise version, deployment, risk, and next-build update back to the Smarter Justice Control Center after each release'],
  'general-smarter-justice-start': ['Stage and configure the audited v1.6.1 controlled-launch readiness release','Configure PostgreSQL, durable private upload storage, owner account credentials, owner MFA, SMTP, Stripe test products, and signed webhook evidence','Complete final membership, refund/cancellation, privacy, advertising, ethics, credential, complaint, and suspension procedures','Run real-device and first-cohort acceptance testing before opening the controlled founding pilot','Create or refresh each active portal’s complete continuation prompt and continue controlled manifest synchronization planning']
};
const DEFAULT_BLOCKERS = {
  'general-smarter-justice-start': ['Latest development release is not yet aligned with the last-known live Render/GitHub version','Production database and durable private upload storage are still required before sensitive paid traffic','Stripe, SMTP, final legal/compliance review, and deployed user-acceptance testing remain outstanding']
};
const DEFAULT_RISKS = {
  'general-smarter-justice-start': ['Manually entered portfolio records can become stale until controlled repository/deployment synchronization is added','Legacy owner-token access must remain disabled in production after owner account setup; recovery codes and privileged sessions require careful operational handling'],
  'immigration-oasis': ['Applying shared Smarter Justice patterns without an immigration-specific benefit could weaken the specialized platform; adopt shared changes only when they improve it']
};


const READINESS_FIELDS = ['paymentReadiness','emailReadiness','storageReadiness','securityReadiness','legalComplianceReadiness','mobileReadiness','accessibilityReadiness','publicLanguageReadiness','conversionReadiness','promptHandoffReadiness','aiReadiness','referralReadiness','staffWorkflowReadiness','formWorkflowReadiness'];
const LIST_FIELDS = ['professionalReviewTypes','sharedCapabilities','portalSpecificRequirements','completedMilestones','nextMilestones','ownerDecisions','releaseHistory','futureFeatures','knownLimitations','nextBuildInstructions','blockers','risks','documentedDeviations'];
const STRING_FIELDS = ['currentProductionVersion','latestDevelopmentVersion','latestZipName','currentBuildTarget','lastReleaseSummary','repository','productionUrl','stagingUrl','deploymentService','healthEndpoint','lastHealthCheckAt','lastBuildAt','lastDeploymentAt','continuationPromptVersion','continuationPromptLocation','activeDevelopmentChat','notes'];

function defaultPortfolioRecord(portal){
  const status = portal.status || '';
  const portfolioStatus = /live/i.test(status) ? 'live' : /pilot|available now/i.test(status) ? 'pilot' : /development/i.test(status) ? 'development' : 'planned';
  const isSmarterJustice = portal.slug === 'general-smarter-justice-start';
  const known = DEFAULT_KNOWN_METADATA[portal.slug] || {};
  return {
    slug: portal.slug,
    name: portal.name,
    brandFamily: portal.brandFamily || '',
    portfolioStatus,
    priority: isSmarterJustice ? 'critical' : (['justice-tax-solutions','estate-planning-probate','contract-creator','business-launch-desk'].includes(portal.slug) ? 'high' : 'medium'),
    activeBuildState: known.activeBuildState || (isSmarterJustice ? 'building' : (portfolioStatus === 'live' ? 'released' : 'planning')),
    currentProductionVersion: known.currentProductionVersion || '',
    latestDevelopmentVersion: known.latestDevelopmentVersion || (isSmarterJustice ? '1.6.1' : ''),
    latestZipName: known.latestZipName || (isSmarterJustice ? 'smarter-justice-v1.6.1.zip' : ''),
    currentBuildTarget: DEFAULT_BUILD_TARGETS[portal.slug] || 'Define the next portal-specific build.',
    lastReleaseSummary: known.lastReleaseSummary || (isSmarterJustice ? 'Private owner Control Center plus the versioned Master Rules Pack, professional and firm registry, public-source profile seeding, paid-membership eligibility, official NY attorney connector, NYC founding-member outreach, firm discounts, and revenue architecture.' : ''),
    progressPercent: known.progressPercent ?? (isSmarterJustice ? 75 : (portfolioStatus === 'live' ? 75 : portfolioStatus === 'development' ? 20 : 5)),
    repository: known.repository || '',
    productionUrl: known.productionUrl || portal.defaultUrl || '',
    stagingUrl: known.stagingUrl || '',
    deploymentService: known.deploymentService || '',
    healthEndpoint: '/health',
    healthStatus: portal.slug === 'immigration-oasis' ? 'not checked' : 'not configured',
    lastHealthCheckAt: known.lastHealthCheckAt || '',
    lastBuildAt: known.lastBuildAt || (isSmarterJustice ? '2026-07-20' : ''),
    lastDeploymentAt: known.lastDeploymentAt || '',
    sharedStandardVersion: SHARED_STANDARD_VERSION,
    continuationPromptVersion: known.continuationPromptVersion || '',
    continuationPromptLocation: '',
    activeDevelopmentChat: '',
    paymentReadiness: 'not started',
    emailReadiness: 'not started',
    storageReadiness: 'not started',
    securityReadiness: 'foundation',
    legalComplianceReadiness: 'needs review',
    mobileReadiness: 'needs review',
    accessibilityReadiness: 'needs review',
    publicLanguageReadiness: isSmarterJustice ? 'pilot ready' : 'needs review',
    conversionReadiness: isSmarterJustice ? 'pilot ready' : 'needs review',
    promptHandoffReadiness: isSmarterJustice ? 'pilot ready' : 'foundation',
    aiReadiness: 'foundation',
    referralReadiness: isSmarterJustice ? 'foundation' : 'not started',
    staffWorkflowReadiness: isSmarterJustice ? 'foundation' : 'not started',
    formWorkflowReadiness: isSmarterJustice ? 'foundation' : 'not started',
    professionalReviewTypes: DEFAULT_REVIEW_TYPES[portal.slug] || [],
    sharedCapabilities: isSmarterJustice ? ['Umbrella portal router','Community Partner foundation','Human Review Specialist workflow','Matter Path Engine and conservative form foundations','Private owner Control Center foundation','Versioned Master Rules Pack','Professional network and marketplace foundation','Membership eligibility and revenue architecture foundation','NYC founding-member outreach, mobile/QR enrollment, and firm volume-discount foundation','Reliable paginated professional and firm directory with complete firm profile and claim-control parity','Official-source later-page search, shareable directory filters, public profile metadata, professional onboarding checklist, and transparent firm pricing estimate','Fail-closed production persistence and truthful storage readiness','Owner and professional account sessions, MFA, recovery, and revocation controls','Controlled professional pilot capacity, credential review, complaints, and suspension procedures','Cross-portal Capability Registry and Success Pattern Library'] : ['Smarter Justice shared-standard compatibility planned','Future portal manifest and Control Center update compatibility','Compatible Community Partner, staff/reviewer, security, forms/source, and cross-portal conventions when beneficial'],
    portalSpecificRequirements: [portal.disclosure || 'Define portal-specific legal, compliance, jurisdiction, and professional-review requirements in the dedicated portal chat.'],
    completedMilestones: isSmarterJustice ? ['Umbrella portal-router foundation completed','Community Partner and administrator privacy hardening completed','Private Control Center foundation added in v1.3.0','Versioned Master Rules Pack and professional marketplace foundation completed in v1.4.0','NYC founding-member outreach, mobile/QR enrollment, and firm volume-discount foundation completed in v1.4.0','Directory completeness, firm profile parity, and connected acquisition regression coverage completed in v1.5.2','Official-source pagination, shareable filters, profile discoverability, onboarding, and firm-pricing transparency completed in v1.5.3','Fail-closed production persistence, account security, controlled professional pilot gates, compliance procedures, and Capability Registry completed in v1.6.0','Header wordmark and brand metadata consistency corrected in v1.6.1'] : ['Portal included in the Smarter Justice focused-portal portfolio'],
    nextMilestones: isSmarterJustice ? ['Stage v1.6.1 with verified PostgreSQL and durable private upload storage','Bootstrap the owner account and complete authenticator MFA enrollment before enabling pilot enrollment','Configure SMTP and Stripe test mode, complete signed webhook, cancellation, refund, and failed-payment evidence','Complete credential, complaint, suspension, privacy, advertising, ethics, and first-cohort operating procedures','Run real-device, QR, office-enrollment, backup/restore, and first-case acceptance testing before a controlled Downtown Brooklyn pilot','Add automated credential reverification, appointment scheduling, and controlled portal-manifest synchronization in later releases'] : ['Complete the portal-specific master continuation prompt','Record the latest ZIP, version, deployment, risks, and next build in the Control Center'],
    ownerDecisions: isSmarterJustice ? ['Use one Master Coordination track plus separate portal-specific development chats','Treat shared standards as strong defaults, not inflexible rules','Keep the Control Center private and separate from customer and staff workspaces','Do not automate production deployment until owner authentication, staging, audit, and rollback controls mature','Build the professional directory and marketplace in phased compliance-first releases; keep lead-sale ping-post integrations out until explicitly authorized','Use NYC in-person outreach, mobile/QR enrollment, introductory fixed-price founding memberships, per-professional firm billing, and transparent volume discounts as an early pilot strategy without letting payment affect substantive eligibility or AI analysis'] : ['Keep this as a separate focused portal within the Smarter Justice ecosystem','Include shared Smarter Justice requirements and the complete portal-specific source of truth in every future continuation prompt','Permit deliberate documented specialty adaptations when they improve safety, compliance, usability, or the portal’s legal workflow'],
    releaseHistory: DEFAULT_RELEASE_HISTORY[portal.slug] || [],
    futureFeatures: DEFAULT_PORTAL_FUTURES[portal.slug] || [],
    knownLimitations: DEFAULT_LIMITATIONS[portal.slug] || ['The latest source code, governing continuation prompt, version, and deployment details must be recorded from the dedicated portal chat before build status is treated as complete.'],
    nextBuildInstructions: DEFAULT_NEXT_BUILD_INSTRUCTIONS[portal.slug] || ['Complete the portal-specific source-of-truth record before detailed development','Use the dedicated portal chat for coding and return a Control Center update after each release'],
    blockers: DEFAULT_BLOCKERS[portal.slug] || [],
    risks: DEFAULT_RISKS[portal.slug] || ['Portal requirements may drift from shared systems if releases do not update the manifest, continuation prompt, and Control Center record.'],
    documentedDeviations: [],
    notes: '',
    updatedAt: '',
    updatedBy: ''
  };
}

function mergedPortfolio(){
  const saved = store.readJson('portalPortfolio.json', []);
  const savedItems = Array.isArray(saved) ? saved : [];
  const savedBySlug = new Map(savedItems.map(item => [item.slug, item]));
  const seedBySlug = new Map(Object.entries(PORTFOLIO_SEED_OVERRIDES || {}));
  const knownSlugs = new Set(PORTALS.map(portal => portal.slug));
  const known = PORTALS.map(portal => ({
    ...defaultPortfolioRecord(portal),
    ...(seedBySlug.get(portal.slug) || {}),
    ...(savedBySlug.get(portal.slug) || {}),
    slug:portal.slug,
    name:portal.name,
    brandFamily:portal.brandFamily || '',
    customPrivateRecord:false,
    sharedStandardVersion:SHARED_STANDARD_VERSION
  }));
  const privateSeeds = Array.isArray(PRIVATE_PORTFOLIO_SEEDS) ? PRIVATE_PORTFOLIO_SEEDS : [];
  const customCandidates = [...privateSeeds, ...savedItems.filter(item => item && item.slug && !knownSlugs.has(item.slug))];
  const customBySlug = new Map();
  for (const item of customCandidates) if (item && item.slug && !knownSlugs.has(item.slug)) customBySlug.set(item.slug, { ...(customBySlug.get(item.slug) || {}), ...item });
  const custom = [...customBySlug.values()].map(item => {
    const privateDefinition = { slug:item.slug, name:item.name || item.slug, brandFamily:item.brandFamily || 'Private planned portal record', status:item.portfolioStatus || 'planned', summary:item.currentBuildTarget || '', disclosure:'Private portfolio record. It is not added to the customer-facing portal directory by this Control Center entry.' };
    return { ...defaultPortfolioRecord(privateDefinition), ...item, slug:item.slug, name:item.name || item.slug, customPrivateRecord:true, sharedStandardVersion:SHARED_STANDARD_VERSION };
  });
  return [...known, ...custom];
}

function persistPortfolio(items){ store.writeJson('portalPortfolio.json', items); }
function sanitizeString(value, max=2500){ return String(value == null ? '' : value).trim().slice(0,max); }
function sanitizeList(value, maxItems=75, maxLength=1000){
  const source = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  return source.map(v => sanitizeString(v,maxLength)).filter(Boolean).slice(0,maxItems);
}
function enumValue(value, allowed, fallback){ return allowed.includes(value) ? value : fallback; }
function percent(value, fallback=0){ const n=Number(value); return Number.isFinite(n) ? Math.max(0,Math.min(100,Math.round(n))) : fallback; }
function safeAbsoluteUrl(value){
  const clean=sanitizeString(value,1500);
  if (!clean) return '';
  try { const u=new URL(clean); return ['http:','https:'].includes(u.protocol) ? u.toString() : null; } catch { return null; }
}
function safeEndpoint(value){ const clean=sanitizeString(value,500); return !clean || (/^\/[A-Za-z0-9_./?=&%-]*$/.test(clean) && !clean.startsWith('//')) ? clean : null; }
function safeSlug(value){ return sanitizeString(value,120).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-'); }

function createPortal(input, actor='owner'){
  const name=sanitizeString(input.name,180);
  const slug=safeSlug(input.slug || name);
  if (name.length < 2) return { error:'Add a portal name.' };
  if (slug.length < 2) return { error:'Add a valid portal identifier.' };
  const items=mergedPortfolio();
  if (items.some(item=>item.slug===slug)) return { error:'That portal identifier is already in the portfolio.' };
  const definition={ slug, name, brandFamily:sanitizeString(input.brandFamily,300) || 'Private planned focused portal', status:'planned', summary:sanitizeString(input.currentBuildTarget,3000), disclosure:'Private portfolio record. This does not add the portal to the public portal directory or claim that it is live.' };
  const record={ ...defaultPortfolioRecord(definition), customPrivateRecord:true, portfolioStatus:'planned', activeBuildState:'planning', priority:enumValue(input.priority,PRIORITIES,'medium'), currentBuildTarget:sanitizeString(input.currentBuildTarget,6000) || 'Define the portal-specific mission, source of truth, and first material build.', portalSpecificRequirements:sanitizeList(input.portalSpecificRequirements), ownerDecisions:['Keep this portal private in the portfolio until a public portal definition is deliberately added and approved','Use a dedicated portal development chat and preserve both Smarter Justice shared standards and this portal’s specific source of truth'], updatedAt:store.now(), updatedBy:sanitizeString(actor,120) || 'owner' };
  items.push(record); persistPortfolio(items);
  store.addAudit({ actor:'owner-control-center', action:'private_portal_record_created', details:{ portalSlug:slug, portalName:name } });
  return { portal:record, warnings:['This is a private portfolio record only. It was not added to the customer-facing portal directory.'] };
}

function updatePortal(slug, input, actor='owner'){
  const items=mergedPortfolio();
  const index=items.findIndex(item=>item.slug===slug);
  if (index<0) return null;
  const current=items[index];
  const next={...current};
  const warnings=[];
  for (const field of STRING_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input,field)) continue;
    if (['repository','productionUrl','stagingUrl'].includes(field)) {
      const checked=safeAbsoluteUrl(input[field]);
      if (checked===null) { warnings.push(`${field} was not saved because only HTTP/HTTPS URLs are allowed.`); continue; }
      next[field]=checked;
    } else if (field==='healthEndpoint') {
      const checked=safeEndpoint(input[field]);
      if (checked===null) { warnings.push('healthEndpoint was not saved because it must be a safe root-relative path.'); continue; }
      next[field]=checked || '/health';
    } else {
      next[field]=sanitizeString(input[field], ['notes','currentBuildTarget','lastReleaseSummary'].includes(field) ? 6000 : 1500);
    }
  }
  next.portfolioStatus=enumValue(input.portfolioStatus,PORTFOLIO_STATUSES,current.portfolioStatus);
  next.priority=enumValue(input.priority,PRIORITIES,current.priority);
  next.activeBuildState=enumValue(input.activeBuildState,ACTIVE_BUILD_STATES,current.activeBuildState);
  next.healthStatus=enumValue(input.healthStatus,HEALTH_STATUSES,current.healthStatus);
  for (const field of READINESS_FIELDS) next[field]=enumValue(input[field],READINESS_STATUSES,current[field]);
  if (Object.prototype.hasOwnProperty.call(input,'progressPercent')) next.progressPercent=percent(input.progressPercent,current.progressPercent);
  for (const field of LIST_FIELDS) if (Object.prototype.hasOwnProperty.call(input,field)) next[field]=sanitizeList(input[field]);
  next.sharedStandardVersion=SHARED_STANDARD_VERSION;
  next.updatedAt=store.now();
  next.updatedBy=sanitizeString(actor,120) || 'owner';
  items[index]=next;
  persistPortfolio(items);
  store.addAudit({ actor:'owner-control-center', action:'portal_portfolio_updated', details:{ portalSlug:slug, portfolioStatus:next.portfolioStatus, activeBuildState:next.activeBuildState, latestDevelopmentVersion:next.latestDevelopmentVersion, warningsCount:warnings.length } });
  return { portal:next, warnings };
}

function summary(items){
  const adaptations=items.reduce((sum,x)=>sum+(x.documentedDeviations || []).length,0);
  return {
    totalPortals:items.length,
    liveOrPilot:items.filter(x=>['live','pilot'].includes(x.portfolioStatus)).length,
    activeBuilds:items.filter(x=>['building','testing','ready for release'].includes(x.activeBuildState)).length,
    blockedPortals:items.filter(x=>(x.blockers || []).length).length,
    highPriority:items.filter(x=>['critical','high'].includes(x.priority)).length,
    continuationPromptsRecorded:items.filter(x=>x.continuationPromptVersion || x.continuationPromptLocation).length,
    documentedAdaptations:adaptations,
    averageProgress:items.length ? Math.round(items.reduce((sum,x)=>sum+Number(x.progressPercent || 0),0)/items.length) : 0,
    sharedStandardVersion:SHARED_STANDARD_VERSION
  };
}

function getControlCenterData(){
  const portals=mergedPortfolio();
  const capabilityRegistry=buildCapabilityRegistry(portals);
  return {
    generatedAt:store.now(),
    governance:GOVERNANCE,
    masterRulesPack:{ version:masterRules.MASTER_RULES_PACK_VERSION, effectiveDate:masterRules.MASTER_RULES_PACK_EFFECTIVE_DATE, checksum:masterRules.checksum(), status:masterRules.MASTER_RULES_PACK.status, protectedApi:'/api/system/master-rules-pack' },
    enums:{ portfolioStatuses:PORTFOLIO_STATUSES, healthStatuses:HEALTH_STATUSES, readinessStatuses:READINESS_STATUSES, priorities:PRIORITIES, activeBuildStates:ACTIVE_BUILD_STATES },
    summary:{...summary(portals),capabilityRegistryVersion:CAPABILITY_REGISTRY_VERSION,capabilitiesTracked:capabilityRegistry.capabilityCount,successPatternsTracked:capabilityRegistry.successPatternCount},
    capabilityRegistry,
    portals
  };
}

function manifestForPortal(slug){
  const record=mergedPortfolio().find(item=>item.slug===slug);
  const definition=PORTALS.find(item=>item.slug===slug) || { summary:record?.currentBuildTarget || '', audience:'Define in the dedicated portal chat.', helpsWith:[], practices:[], disclosure:'Private portfolio record. It is not customer-facing unless deliberately added to the public portal catalog.' };
  if (!record) return null;
  return {
    schemaVersion:'1.0.0',
    generatedAt:store.now(),
    portalId:record.slug,
    portalName:record.name,
    brandFamily:record.brandFamily,
    portfolioStatus:record.portfolioStatus,
    activeBuildState:record.activeBuildState,
    priority:record.priority,
    currentProductionVersion:record.currentProductionVersion,
    latestDevelopmentVersion:record.latestDevelopmentVersion,
    latestZipName:record.latestZipName,
    sharedStandardVersion:SHARED_STANDARD_VERSION,
    masterRulesPackVersion:masterRules.MASTER_RULES_PACK_VERSION,
    masterRulesPackChecksum:masterRules.checksum(),
    masterRulesPackApi:'/api/system/master-rules-pack',
    currentBuildTarget:record.currentBuildTarget,
    repository:record.repository,
    productionUrl:record.productionUrl,
    stagingUrl:record.stagingUrl,
    deploymentService:record.deploymentService,
    healthEndpoint:record.healthEndpoint,
    healthStatus:record.healthStatus,
    readiness:Object.fromEntries(READINESS_FIELDS.map(field=>[field,record[field]])),
    professionalReviewTypes:record.professionalReviewTypes,
    sharedCapabilities:record.sharedCapabilities,
    portalSpecificRequirements:record.portalSpecificRequirements,
    documentedDeviations:record.documentedDeviations,
    knownLimitations:record.knownLimitations,
    blockers:record.blockers,
    risks:record.risks,
    nextBuildInstructions:record.nextBuildInstructions,
    continuationPrompt:{ version:record.continuationPromptVersion, location:record.continuationPromptLocation },
    definition:{ summary:definition.summary, audience:definition.audience, helpsWith:definition.helpsWith, practices:definition.practices, disclosure:definition.disclosure },
    updatedAt:record.updatedAt,
    updatedBy:record.updatedBy
  };
}

function mdList(title,items){ return `\n## ${title}\n${(items && items.length) ? items.map(x=>`- ${x}`).join('\n') : '- None recorded yet.'}\n`; }
function promptForPortal(slug){
  const record=mergedPortfolio().find(item=>item.slug===slug);
  if (!record) return null;
  const definition=PORTALS.find(item=>item.slug===slug) || { summary:record.currentBuildTarget, audience:'Define in the dedicated portal chat.', helpsWith:[], practices:[], disclosure:'Private portfolio record. It is not customer-facing unless deliberately added to the public portal catalog.' };
  return `# ${record.name} — Complete Next-Chat Continuation Prompt\n\nYou are continuing development of **${record.name}**, a focused portal within the Smarter Justice ecosystem. This prompt embeds the current Smarter Justice Master Rules and Suggestions Pack and combines it with the portal-specific information recorded in the private Control Center. It is a governed continuation foundation, not permission to discard a more complete newer portal-specific prompt.\n\n## Governing Master Rules and Suggestions Pack\n\n- Version: ${masterRules.MASTER_RULES_PACK_VERSION}\n- SHA-256 checksum: ${masterRules.checksum()}\n- Protected API path for approved portals: /api/system/master-rules-pack\n\n${masterRules.markdown()}\n\n## Prompt priority and code source of truth\n\n1. The newest complete portal-specific continuation prompt explicitly approved by the user has the highest instruction priority for this portal.\n2. The newest uploaded portal ZIP or code package is the source of truth for the current code. Inspect it before changing anything.\n3. Older prompts, ZIPs, and summaries are historical context only unless the newest prompt deliberately preserves them.\n4. Run existing tests before making changes and again after changes from a fresh extraction or clean install.\n5. Preserve working functionality and prior decisions unless a change clearly improves users, operations, compliance, safety, reliability, maintainability, deployability, conversion, or ecosystem compatibility.\n6. Do not change anything merely for the sake of making changes.\n\n## Smarter Justice ecosystem operating model\n\n${GOVERNANCE.operatingModel.map(x=>`- ${x}`).join('\n')}\n\nThe Smarter Justice Master Coordination track is used for overall ecosystem strategy, portal priorities, shared architecture, dashboard/referral/review/staff/form/security/AI/compliance/pricing/account standards, cross-portal coordination, Control Center development, and portfolio roadmap. It should not normally contain every detailed line of code for this portal. Detailed implementation remains in this dedicated portal development chat.\n\n## Shared-standard flexibility and portal-specific deviation authority\n\n**${GOVERNANCE.deviationPolicy.principle}** You are explicitly authorized to adapt or depart from a shared design, dashboard, workflow, terminology, review structure, form strategy, pricing pattern, account flow, data model, or technical convention when this portal’s specialty, jurisdiction, users, urgency, evidence, professional rules, compliance duties, safety, security, usability, or technical needs justify it.\n\nPermitted reasons include:\n${GOVERNANCE.deviationPolicy.reasons.map(x=>`- ${x}`).join('\n')}\n\nEvery deviation must:\n${GOVERNANCE.deviationPolicy.requirements.map(x=>`- ${x}`).join('\n')}\n\n## General Smarter Justice system requirements\n\n${GOVERNANCE.sharedDefaults.map(x=>`- ${x}`).join('\n')}\n\nFuture shared capabilities to preserve architectural compatibility for, when they genuinely improve the ecosystem:\n${GOVERNANCE.futureControlCenterRoadmap.map(x=>`- ${x}`).join('\n')}\n\n## Portal-specific identity, purpose, and boundaries\n\n- Portal: ${record.name}\n- Brand/family description: ${record.brandFamily || 'Not recorded'}\n- Purpose: ${definition.summary || record.currentBuildTarget}\n- Audience: ${definition.audience || 'Define from the latest portal-specific source of truth.'}\n- Helps with: ${(definition.helpsWith || []).join('; ') || 'Not recorded'}\n- Practice mappings: ${(definition.practices || []).join(', ') || 'Not recorded'}\n- Current public disclosure/boundary: ${definition.disclosure || 'Define from the latest portal-specific source of truth.'}\n- Portfolio status: ${record.portfolioStatus}\n- Priority: ${record.priority}\n- Active build state: ${record.activeBuildState}\n- Progress estimate: ${record.progressPercent}%\n- Current production version: ${record.currentProductionVersion || 'Not recorded'}\n- Latest development version: ${record.latestDevelopmentVersion || 'Not recorded'}\n- Latest ZIP/package: ${record.latestZipName || 'Not recorded'}\n- Current build target: ${record.currentBuildTarget || 'Audit and define the next material improvement.'}\n- Last release summary: ${record.lastReleaseSummary || 'Not recorded'}\n- Shared-standard version: ${SHARED_STANDARD_VERSION}\n- Repository: ${record.repository || 'Not recorded'}\n- Production URL: ${record.productionUrl || 'Not recorded'}\n- Staging URL: ${record.stagingUrl || 'Not recorded'}\n- Deployment service: ${record.deploymentService || 'Not recorded'}\n- Health endpoint/status: ${record.healthEndpoint || '/health'} — ${record.healthStatus}\n- Active development chat: ${record.activeDevelopmentChat || 'This dedicated portal development chat'}\n- Continuation prompt version/location: ${record.continuationPromptVersion || 'Not recorded'} / ${record.continuationPromptLocation || 'Not recorded'}\n${mdList('Portal-specific requirements',record.portalSpecificRequirements)}${mdList('Shared capabilities currently used or planned',record.sharedCapabilities)}${mdList('Professional review types',record.professionalReviewTypes)}${mdList('Owner decisions that must be preserved',record.ownerDecisions)}${mdList('Completed milestones',record.completedMilestones)}${mdList('Release history',record.releaseHistory)}${mdList('Next milestones',record.nextMilestones)}${mdList('Future features to preserve in the roadmap',record.futureFeatures)}${mdList('Known limitations',record.knownLimitations)}${mdList('Known blockers',record.blockers)}${mdList('Known risks',record.risks)}${mdList('Documented portal-specific adaptations or deviations',record.documentedDeviations)}${mdList('Next-build instructions',record.nextBuildInstructions)}\n## Readiness snapshot\n\n${READINESS_FIELDS.map(field=>`- ${field}: ${record[field]}`).join('\n')}\n\n## Required next-chat workflow\n\n1. Inspect the newest ZIP/code and identify the actual current version, structure, dependencies, and deployment assumptions.\n2. Run the existing tests before changing anything.\n3. Compare the actual code against this prompt, the newest approved portal-specific prompt, and preserved owner decisions.\n4. Audit customer UX, mobile/accessibility, conversion, staff/reviewer workflows, security, privacy, source tracking, jurisdiction handling, AI boundaries, storage, payments, email, and deployment readiness.\n5. Preserve all working functionality and prior decisions unless a change clearly improves the portal.\n6. Apply shared Smarter Justice components when helpful, but use the explicit portal-specific deviation authority where needed.\n7. Keep customer-facing language free of internal builder, queue, routing-engine, handoff, release-gate, or technical terminology.\n8. Do not claim autonomous filing, guaranteed outcomes, government affiliation, or professional representation unless actually established.\n9. Document all meaningful decisions, deviations, limitations, credentials still needed, and launch blockers.\n10. Run the full test suite from a clean install or fresh extraction and verify release storage contains no user data, secrets, test submissions, uploads, logs, or notification data.\n11. Produce a clean release ZIP, release notes, updated portal manifest, updated complete continuation prompt, and a concise Smarter Justice Control Center update summary.\n\n## Future-prompt preservation rule\n\nEvery later continuation prompt for this portal must contain **both** the current Smarter Justice shared-system guidelines and the complete portal-specific source of truth. Generic shared language must never erase this portal’s specific requirements, legal-specialty adaptations, decisions, forms, workflows, risks, or version history. Justified deviations must remain visible until deliberately superseded.\n\n## Owner coordination notes\n\n${record.notes || 'No additional owner coordination notes are recorded yet.'}\n`;
}

function masterCoordinationPrompt(){
  const data=getControlCenterData();
  const portalLines=data.portals.map(p=>`- **${p.name}** — ${p.portfolioStatus}; priority ${p.priority}; build ${p.activeBuildState}; ${p.progressPercent}% progress; latest development ${p.latestDevelopmentVersion || 'not recorded'}; blockers ${(p.blockers || []).length}.`).join('\n');
  return `# Smarter Justice — Master Coordination Continuation Prompt\n\nYou are continuing the Smarter Justice Master Coordination track. This track governs the overall justice-portal ecosystem, shared standards, portfolio priorities, cross-portal compatibility, the private Control Center, and the portfolio roadmap. Detailed coding for a focused portal should normally remain in that portal’s dedicated development chat.\n\n## Governing Master Rules and Suggestions Pack\n\n- Version: ${masterRules.MASTER_RULES_PACK_VERSION}\n- SHA-256 checksum: ${masterRules.checksum()}\n\n${masterRules.markdown()}\n\n## Operating model\n\n${GOVERNANCE.operatingModel.map(x=>`- ${x}`).join('\n')}\n\n## Master coordination responsibilities\n\n${GOVERNANCE.masterCoordinationScope.map(x=>`- ${x}`).join('\n')}\n\n## Shared standards and specialty flexibility\n\n**${GOVERNANCE.deviationPolicy.principle}** A focused portal may adapt or deviate when its legal specialty, jurisdiction, users, professional workflow, safety, compliance, usability, or technical needs justify it. The deviation must be deliberate, narrowly tailored, documented, and beneficial. It must not weaken privacy, security, truthful language, professional boundaries, source verification, or compliance safeguards.\n\nShared defaults:\n${GOVERNANCE.sharedDefaults.map(x=>`- ${x}`).join('\n')}\n\n## Current portfolio snapshot\n\n- Shared-standard version: ${SHARED_STANDARD_VERSION}\n- Portals tracked: ${data.summary.totalPortals}\n- Live or pilot: ${data.summary.liveOrPilot}\n- Active builds: ${data.summary.activeBuilds}\n- Portals with blockers: ${data.summary.blockedPortals}\n- Average recorded progress: ${data.summary.averageProgress}%\n\n${portalLines}\n\n## Coordination workflow\n\n1. Make ecosystem-wide decisions here and record them in the shared standard or Control Center.\n2. Select one active portal implementation priority at a time unless there is a material reason to run parallel work.\n3. Carry shared improvements into portal prompts, but never overwrite portal-specific requirements.\n4. Keep each portal separately branded, deployable, versioned, testable, and reversible.\n5. Require every portal release to provide a manifest, release notes, complete continuation prompt, and Control Center update summary.\n6. Promote a portal-specific improvement into the shared standard only when it is broadly reusable and beneficial.\n7. Do not make changes merely for the sake of consistency or activity.\n\n## Future Control Center roadmap\n\n${GOVERNANCE.futureControlCenterRoadmap.map(x=>`- ${x}`).join('\n')}\n`;
}

module.exports = {
  SHARED_STANDARD_VERSION, GOVERNANCE, PORTFOLIO_STATUSES, HEALTH_STATUSES, READINESS_STATUSES, PRIORITIES, ACTIVE_BUILD_STATES,
  READINESS_FIELDS, CAPABILITY_REGISTRY_VERSION, getControlCenterData, createPortal, updatePortal, manifestForPortal, promptForPortal, masterCoordinationPrompt
};
