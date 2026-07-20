const CAPABILITY_REGISTRY_VERSION = '1.0.0';

const CAPABILITY_DEFINITIONS = [
  ['brand-positioning','Brand and positioning','public-experience','general-smarter-justice-start','1.6.0','proven'],
  ['homepage-first-impression','Homepage first impression','public-experience','justice-tax-solutions','0.1.93','proven'],
  ['free-starting-funnel','Free starting funnel','public-experience','justice-tax-solutions','0.1.93','proven'],
  ['account-creation','Account creation','identity','general-smarter-justice-start','1.6.0','proven'],
  ['authentication-recovery','Authentication and recovery','identity','justice-tax-solutions','0.1.93','proven'],
  ['mfa-privileged','MFA for privileged accounts','security','justice-tax-solutions','0.1.93','proven'],
  ['user-dashboard','User dashboard','workflow','immigration-oasis','1.10.227','proven'],
  ['owner-dashboard','Owner dashboard','operations','general-smarter-justice-start','1.6.0','proven'],
  ['staff-dashboard','Staff dashboard','operations','justice-tax-solutions','0.1.93','proven'],
  ['professional-dashboard','Professional dashboard','marketplace','general-smarter-justice-start','1.6.0','proven'],
  ['firm-dashboard','Firm dashboard','marketplace','general-smarter-justice-start','1.6.0','partial'],
  ['community-partner-dashboard','Community Partner dashboard','growth','immigration-oasis','1.10.227','proven'],
  ['guided-intake','Guided intake','workflow','justice-tax-solutions','0.1.93','proven'],
  ['one-question-mode','One-question-at-a-time flow','workflow','justice-tax-solutions','0.1.93','proven'],
  ['uncertainty-handling','Uncertainty handling','ai-and-routing','justice-tax-solutions','0.1.93','proven'],
  ['document-uploads','Document uploads','documents','immigration-oasis','1.10.227','proven'],
  ['ocr-extraction','OCR and extraction','documents','justice-tax-solutions','0.1.93','proven'],
  ['truth-check','Notice or document Truth Check','documents','coverednyc','1.0.30','proven'],
  ['multi-ai-roles','Multi-AI specialist roles','ai-and-routing','contract-creator','0.1.0','proven'],
  ['consolidated-ai-output','Consolidated AI output','ai-and-routing','contract-creator','0.1.0','proven'],
  ['ai-fallback','AI provider fallback','ai-and-routing','general-smarter-justice-start','1.6.0','proven'],
  ['matter-path-engine','Matter Path Engine','ai-and-routing','general-smarter-justice-start','1.6.0','proven'],
  ['form-generation','Form generation','forms','immigration-oasis','1.10.227','proven'],
  ['official-pdf-completion','Official PDF completion','forms','immigration-oasis','1.10.227','proven'],
  ['official-form-governance','Official form governance','forms','justice-tax-solutions','0.1.93','proven'],
  ['draft-generation','Draft generation','documents','contract-creator','0.1.0','proven'],
  ['document-comparison','Document comparison and redlines','documents','contract-creator','0.1.0','proven'],
  ['customer-verification','Customer verification','quality-and-release','justice-tax-solutions','0.1.93','proven'],
  ['human-review','Human Review Specialist workflow','professional-help','immigration-oasis','1.10.227','proven'],
  ['paralegal-preparation','Paralegal or preparer workflow','professional-help','estate-help-desk','1.0.36','proven'],
  ['professional-review','Attorney or professional review','professional-help','estate-help-desk','1.0.36','proven'],
  ['consultation-scheduling','Consultation scheduling','professional-help','immigration-oasis','1.10.227','partial'],
  ['professional-directory','Professional directory','marketplace','general-smarter-justice-start','1.6.0','proven'],
  ['profile-claiming','Profile claiming','marketplace','general-smarter-justice-start','1.6.0','proven'],
  ['credential-verification','Credential verification','marketplace','justice-tax-solutions','0.1.93','proven'],
  ['professional-membership','Professional membership','marketplace','general-smarter-justice-start','1.6.0','partial'],
  ['firm-seats','Firm seats and central billing','marketplace','general-smarter-justice-start','1.6.0','partial'],
  ['neutral-eligibility','Neutral professional eligibility','marketplace','general-smarter-justice-start','1.6.0','proven'],
  ['referral-attribution','Referral and attribution','growth','immigration-oasis','1.10.227','proven'],
  ['qr-campaigns','QR codes and campaign attribution','growth','general-smarter-justice-start','1.6.0','proven'],
  ['pricing-clarity','Pricing clarity','growth','justice-tax-solutions','0.1.93','proven'],
  ['payments','Payments','revenue','general-smarter-justice-start','1.6.0','partial'],
  ['refunds-cancellations','Refund and cancellation controls','revenue','justice-tax-solutions','0.1.93','partial'],
  ['messaging-email','Privacy-safe messaging and email','communications','justice-tax-solutions','0.1.93','proven'],
  ['sms','SMS communications','communications','immigration-oasis','1.10.227','planned'],
  ['lifecycle-reminders','Lifecycle reminders','lifecycle','estate-help-desk','1.0.36','proven'],
  ['matter-roadmap','Matter roadmap','lifecycle','business-launch-desk','0.2.6','proven'],
  ['data-room','Data room or document vault','lifecycle','business-launch-desk','0.2.6','proven'],
  ['state-jurisdiction-rules','State and jurisdiction rules','governance','business-launch-desk','0.2.6','proven'],
  ['official-source-registry','Official-source registry','governance','justice-tax-solutions','0.1.93','proven'],
  ['release-gates','Release gates','quality-and-release','immigration-oasis','1.10.227','proven'],
  ['pilot-controls','Pilot and cohort controls','quality-and-release','estate-help-desk','1.0.36','proven'],
  ['capacity-controls','Capacity controls','quality-and-release','estate-help-desk','1.0.36','proven'],
  ['analytics','Analytics taxonomy','operations','general-smarter-justice-start','1.6.0','partial'],
  ['conversion-reporting','Conversion reporting','operations','general-smarter-justice-start','1.6.0','partial'],
  ['revenue-reporting','Revenue reporting','operations','general-smarter-justice-start','1.6.0','partial'],
  ['security','Security controls','security','justice-tax-solutions','0.1.93','proven'],
  ['privacy','Privacy controls','security','justice-tax-solutions','0.1.93','proven'],
  ['accessibility','Accessibility','public-experience','general-smarter-justice-start','1.6.0','proven'],
  ['mobile','Mobile experience','public-experience','general-smarter-justice-start','1.6.0','proven'],
  ['spanish-language','Spanish or other language support','public-experience','immigration-oasis','1.10.227','proven'],
  ['seo','SEO and indexing separation','public-experience','general-smarter-justice-start','1.6.0','proven'],
  ['health-checks','Health checks','deployment','general-smarter-justice-start','1.6.0','proven'],
  ['deployment','Deployment documentation','deployment','immigration-oasis','1.10.227','proven'],
  ['backups-restore','Backups and restore testing','deployment','justice-tax-solutions','0.1.93','proven'],
  ['incident-response','Incident response','security','justice-tax-solutions','0.1.93','proven'],
  ['continuation-prompts','Continuation prompts','governance','general-smarter-justice-start','1.6.0','proven'],
  ['portal-manifests','Portal manifests','governance','general-smarter-justice-start','1.6.0','proven'],
  ['master-rules-adoption','Master Rules Pack adoption','governance','general-smarter-justice-start','1.6.0','proven'],
  ['production-persistence-failure-controls','Production persistence failure controls','security','general-smarter-justice-start','1.6.0','proven'],
  ['owner-account-security','Owner account sessions, MFA, and recovery','security','general-smarter-justice-start','1.6.0','proven'],
  ['professional-account-security','Professional password recovery, MFA, and session controls','security','general-smarter-justice-start','1.6.0','proven'],
  ['cross-portal-capability-registry','Cross-portal Capability Registry and Success Pattern Library','governance','general-smarter-justice-start','1.6.0','proven'],
  ['professional-pilot-controls','Controlled professional pilot capacity and compliance controls','marketplace','general-smarter-justice-start','1.6.0','proven'],
  ['full-lean-governance','Full/lean/overlay package governance','deployment','immigration-oasis','1.10.227','proven'],
  ['contract-negotiation','Contract negotiation packages','specialty','contract-creator','0.1.0','proven'],
  ['estate-maps','Asset, people, beneficiary, and fiduciary maps','specialty','estate-help-desk','1.0.36','proven'],
  ['coverage-household-map','Coverage household mapping','specialty','coverednyc','1.0.30','proven'],
  ['business-compliance-lifecycle','Business launch-to-compliance lifecycle','specialty','business-launch-desk','0.2.6','proven']
].map(([id,name,category,bestReferencePortal,bestReferenceVersion,evidenceStatus])=>({id,name,category,bestReferencePortal,bestReferenceVersion,evidenceStatus}));

const SUCCESS_PATTERNS = [
  { id:'free-first-no-guess', name:'Free-first no-guess journey', originPortal:'justice-tax-solutions', originVersion:'0.1.93', status:'proven', value:'Combines a meaningful free starting service with explicit uncertainty, readiness lanes, and professional escalation.', reuse:'Evaluate for every portal; adapt questions, risk lanes, and professional categories.' },
  { id:'full-lean-release-governance', name:'Full/lean overlay governance', originPortal:'immigration-oasis', originVersion:'1.10.227', status:'proven', value:'Protects large official asset sets while allowing small continuation builds.', reuse:'Use only where a portal has heavy immutable assets or required base packages.' },
  { id:'contract-board', name:'Side-specific Contract Board', originPortal:'contract-creator', originVersion:'0.1.0', status:'proven', value:'Surfaces competing interpretations, disagreement, negotiation choices, and final consolidation.', reuse:'Adapt for adversarial documents and multi-party decisions; do not copy into simple forms.' },
  { id:'launch-compliance-roadmap', name:'Launch-to-compliance roadmap', originPortal:'business-launch-desk', originVersion:'0.2.6', status:'proven', value:'Keeps users engaged after formation through tax, licensing, filing, and lifecycle reminders.', reuse:'Adapt to portals with recurring duties and post-completion obligations.' },
  { id:'estate-completion-gates', name:'Estate completion checkpoints', originPortal:'estate-help-desk', originVersion:'1.0.36', status:'proven', value:'Separates drafting, signing, notarization, filing, funding, transfer, and final delivery.', reuse:'Use wherever formal execution or post-signing actions matter.' },
  { id:'coverage-truth-check', name:'Free Coverage Truth Check', originPortal:'coverednyc', originVersion:'1.0.30', status:'proven', value:'Starts with the user’s real plan, household, providers, prescriptions, bills, notices, and life event.', reuse:'Adapt the truth-check concept for notices, contracts, returns, benefits, and existing documents.' },
  { id:'central-professional-identity', name:'Central professional identity and firm seats', originPortal:'general-smarter-justice-start', originVersion:'1.6.0', status:'proven-foundation', value:'Avoids separate conflicting professional accounts across focused portals.', reuse:'All legal, tax, accounting, broker, and approved professional portals should use the central identity model.' }
];


const CAPABILITY_EVIDENCE = {
  'production-persistence-failure-controls':{confirmedFrom:['source code','automated tests','release documentation'],sourceFiles:['lib/store.js','lib/storageAdapter.js','server.js'],screensOrRoutes:['/api/launch-readiness'],apiEndpoints:['GET /api/launch-readiness'],dataModels:['smarter_justice_store'],dependencies:['PostgreSQL','durable private upload storage'],testStatus:'tests/storage-readiness.test.js passed',knownDefects:['Database writes are not yet wrapped in application-level transactions; production deployment still requires database and restore evidence.'],nextAction:'Verify PostgreSQL, durable upload storage, write failure behavior, backup, and restore in staging.'},
  'owner-account-security':{confirmedFrom:['source code','automated tests','private interface'],sourceFiles:['lib/accountSecurity.js','lib/ownerAccounts.js','server.js','public/control-center.html','public/app.js'],screensOrRoutes:['/control-center.html'],apiEndpoints:['GET /api/owner/auth/status','POST /api/owner/auth/login','POST /api/owner/auth/mfa/begin','POST /api/owner/auth/mfa/confirm','POST /api/owner/auth/recovery-codes/rotate','POST /api/owner/auth/sessions/revoke-others'],dataModels:['ownerAccounts.json'],dependencies:['authenticator app','secure environment bootstrap'],testStatus:'tests/security-readiness.test.js passed',knownDefects:['Owner password self-service recovery is deliberately not enabled; secure operational recovery remains an owner procedure.'],nextAction:'Bootstrap the production owner account, enroll MFA, store recovery codes offline, and verify session revocation on real devices.'},
  'professional-account-security':{confirmedFrom:['source code','automated tests','professional interface'],sourceFiles:['lib/accountSecurity.js','lib/professionalAccounts.js','server.js','public/professional-login.html','public/professional.js'],screensOrRoutes:['/professional-login.html','/professional-dashboard.html'],apiEndpoints:['POST /api/professional/auth/login','POST /api/professional/auth/password-reset/request','POST /api/professional/auth/password-reset/confirm','POST /api/professional/auth/mfa/begin','POST /api/professional/auth/mfa/confirm','POST /api/professional/auth/sessions/revoke-others'],dataModels:['professionalAccounts.json'],dependencies:['SMTP for real password-reset delivery','authenticator app'],testStatus:'tests/security-readiness.test.js passed',knownDefects:['MFA is available but not yet mandatory for all professional accounts.'],nextAction:'Verify SMTP delivery, reset-link privacy, authenticator setup, recovery codes, and multi-device session revocation in staging.'},
  'cross-portal-capability-registry':{confirmedFrom:['source code','automated tests','Control Center interface'],sourceFiles:['data/crossPortalCapabilities.js','lib/controlCenter.js','public/control-center.html','public/app.js'],screensOrRoutes:['/control-center.html'],apiEndpoints:['GET /api/owner/control-center','GET /api/owner/control-center/export'],dataModels:['generated capability registry'],dependencies:['portal portfolio records','portal audit evidence'],testStatus:'tests/security-readiness.test.js and tests/static-checks.test.js passed',knownDefects:['Most non-Smarter-Justice portal evidence remains based on imported audit records rather than live synchronized manifests.'],nextAction:'Add controlled portal-manifest ingestion and evidence refresh without overwriting portal-specific decisions.'},
  'professional-pilot-controls':{confirmedFrom:['source code','automated tests','Control Center interface'],sourceFiles:['lib/professionalMarketplace.js','server.js','public/control-center.html','public/app.js'],screensOrRoutes:['/control-center.html','/professional-dashboard.html'],apiEndpoints:['POST /api/owner/professional-marketplace/pilot-controls','POST /api/owner/professional-marketplace/credential-verification','POST /api/owner/professional-marketplace/complaints','POST /api/owner/professional-marketplace/suspension'],dataModels:['professionalMarketplace.json pilotControls','credentials','complaints'],dependencies:['owner approval','production persistence','Stripe evidence','written operating procedures'],testStatus:'tests/marketplace.test.js passed',knownDefects:['The default pilot remains paused and no production cohort has been approved.'],nextAction:'Complete procedures and evidence, then open only a capped owner-approved cohort.'}
};

const CATEGORY_VALUE = {
  'public-experience':{userValue:'high',conversionValue:'high',revenueValue:'indirect',complianceValue:'medium',securityValue:'medium'},
  identity:{userValue:'high',conversionValue:'high',revenueValue:'high',complianceValue:'high',securityValue:'high'},
  security:{userValue:'high',conversionValue:'medium',revenueValue:'enabling',complianceValue:'high',securityValue:'high'},
  marketplace:{userValue:'high',conversionValue:'high',revenueValue:'high',complianceValue:'high',securityValue:'medium'},
  governance:{userValue:'indirect',conversionValue:'indirect',revenueValue:'enabling',complianceValue:'high',securityValue:'high'},
  deployment:{userValue:'indirect',conversionValue:'indirect',revenueValue:'enabling',complianceValue:'high',securityValue:'high'},
  documents:{userValue:'high',conversionValue:'high',revenueValue:'medium',complianceValue:'high',securityValue:'high'},
  forms:{userValue:'high',conversionValue:'high',revenueValue:'medium',complianceValue:'high',securityValue:'medium'},
  'quality-and-release':{userValue:'high',conversionValue:'medium',revenueValue:'enabling',complianceValue:'high',securityValue:'high'},
  'professional-help':{userValue:'high',conversionValue:'high',revenueValue:'high',complianceValue:'high',securityValue:'medium'},
  growth:{userValue:'medium',conversionValue:'high',revenueValue:'high',complianceValue:'medium',securityValue:'medium'},
  revenue:{userValue:'medium',conversionValue:'high',revenueValue:'high',complianceValue:'high',securityValue:'high'},
  operations:{userValue:'indirect',conversionValue:'medium',revenueValue:'high',complianceValue:'high',securityValue:'medium'},
  lifecycle:{userValue:'high',conversionValue:'high',revenueValue:'medium',complianceValue:'medium',securityValue:'medium'},
  communications:{userValue:'high',conversionValue:'high',revenueValue:'medium',complianceValue:'high',securityValue:'high'},
  'ai-and-routing':{userValue:'high',conversionValue:'high',revenueValue:'medium',complianceValue:'high',securityValue:'medium'},
  workflow:{userValue:'high',conversionValue:'high',revenueValue:'medium',complianceValue:'medium',securityValue:'medium'},
  specialty:{userValue:'high',conversionValue:'high',revenueValue:'context-specific',complianceValue:'specialty-specific',securityValue:'specialty-specific'}
};

function evidenceFor(capability){ return CAPABILITY_EVIDENCE[capability.id] || {}; }
function progressFor(status){ return ({proven:100,'proven-foundation':80,'possible-partial-needs-verification':40,'planned-from-roadmap':20,'not-assessed':5,'not-confirmed':0})[status] ?? 0; }

function searchableText(portal){
  return [portal.name,portal.lastReleaseSummary,portal.currentBuildTarget,...(portal.sharedCapabilities||[]),...(portal.completedMilestones||[]),...(portal.futureFeatures||[]),...(portal.nextMilestones||[])].join(' ').toLowerCase();
}
function implementationStatus(capability, portal){
  if(portal.slug===capability.bestReferencePortal) return capability.evidenceStatus;
  const text=searchableText(portal); const words=capability.name.toLowerCase().split(/\W+/).filter(word=>word.length>4);
  if(words.some(word=>text.includes(word))) return portal.portfolioStatus==='planned' ? 'planned-from-roadmap' : 'possible-partial-needs-verification';
  if(portal.portfolioStatus==='planned') return 'not-assessed';
  return 'not-confirmed';
}
function buildCapabilityRegistry(portals=[]){
  const capabilities=CAPABILITY_DEFINITIONS.map(capability=>{
    const evidence=evidenceFor(capability);
    const sharedCoreCandidate=capability.category!=='specialty';
    const values=CATEGORY_VALUE[capability.category] || {userValue:'context-specific',conversionValue:'context-specific',revenueValue:'context-specific',complianceValue:'context-specific',securityValue:'context-specific'};
    const implementations=portals.map(portal=>{
      const status=implementationStatus(capability,portal);
      return {portalId:portal.slug,portalName:portal.name,version:portal.latestDevelopmentVersion || portal.currentProductionVersion || '',status,progressPercentage:progressFor(status),productionStatus:portal.portfolioStatus,evidenceLink:portal.latestZipName || portal.continuationPromptLocation || '',specialtyException:(portal.documentedDeviations||[]).filter(item=>String(item).toLowerCase().includes(capability.name.toLowerCase()))};
    });
    return {
      ...capability,
      ...values,
      implementationStatus:capability.evidenceStatus,
      confirmedFrom:evidence.confirmedFrom || ['portal audit record','release documentation'],
      evidenceBasis:'Current uploaded package, tests, release documents, portal audit records, and Control Center records; verify again from source code before reuse.',
      testStatus:evidence.testStatus || (capability.evidenceStatus==='proven' ? 'Reference portal evidence recorded; source-level regression test must be verified before reuse.' : 'Not fully tested as a shared component.'),
      productionStatus:capability.bestReferencePortal==='general-smarter-justice-start' ? 'development release; deployment evidence pending' : 'Use the reference portal record; verify live status before relying on it.',
      reuseRecommendation:sharedCoreCandidate ? 'Evaluate for shared-core reuse, then adapt narrowly to the target specialty.' : 'Keep specialty-specific unless another portal has the same legal and operational need.',
      sharedCoreCandidate,
      portalsConsiderAdopting:sharedCoreCandidate ? portals.filter(portal=>portal.slug!==capability.bestReferencePortal).map(portal=>portal.slug) : [],
      portalsNotAdopt:[],
      requiredAdaptations:['jurisdiction and specialty rules','public-language boundaries','privacy and data minimization','professional-role and credential requirements','portal-specific regression tests'],
      specialtyLimitations:'Shared pattern only. The target portal must document legal, tax, insurance, jurisdiction, safety, privacy, and workflow adaptations.',
      sourceFiles:evidence.sourceFiles || [],
      screensOrRoutes:evidence.screensOrRoutes || [],
      apiEndpoints:evidence.apiEndpoints || [],
      dataModels:evidence.dataModels || [],
      dependencies:evidence.dependencies || [],
      knownDefects:evidence.knownDefects || ['No defect is recorded in the Control Center; verify from the current source package before reuse.'],
      lastReviewedDate:'2026-07-20',
      ownerDecision:sharedCoreCandidate ? 'Preserve as a reusable candidate; adoption requires evidence and a material portal benefit.' : 'Preserve as a specialty precedent; do not force ecosystem-wide adoption.',
      nextAction:evidence.nextAction || 'Open the reference portal source and tests before adopting, then record the target portal adaptation and evidence.',
      implementations
    };
  });
  return {
    version:CAPABILITY_REGISTRY_VERSION,
    generatedAt:new Date().toISOString(),
    capabilityCount:capabilities.length,
    successPatternCount:SUCCESS_PATTERNS.length,
    categories:[...new Set(capabilities.map(item=>item.category))].sort(),
    capabilities,
    successPatterns:SUCCESS_PATTERNS
  };
}

module.exports={CAPABILITY_REGISTRY_VERSION,CAPABILITY_DEFINITIONS,SUCCESS_PATTERNS,buildCapabilityRegistry};
