// Official Smarter Justice domain and portal-brand registry seed.
// Domain ownership is separate from DNS, SSL, deployment, canonical configuration,
// live verification, professional participation, and launch approval.

const DOMAIN_REGISTRY_VERSION = '1.0.0';

const DOMAIN_STATUS_OPTIONS = {
  ownership: ['owned','purchase planned','under consideration','domain pending','not applicable'],
  dns: ['not configured','pending verification','configured unverified','verified','not applicable'],
  ssl: ['not requested','pending','active verified','failed','not applicable'],
  deployment: ['not deployed','development package','staging','deployed unverified','live verified','separate live platform'],
  canonical: ['not configured','planned','configured unverified','verified','not applicable'],
  portal: ['live','pilot paused','testing','in development','planned','coming soon','separate live platform'],
  participation: ['not open','applications only','pilot paused','controlled pilot','open','not applicable']
};

const DOMAIN_REGISTRY_SEEDS = [
  {
    id:'DOMAIN-SJ-001', portalSlug:'general-smarter-justice-start', brandName:'Smarter Justice',
    domain:'smarterjustice.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'pilot paused', dnsStatus:'verified', sslStatus:'active verified', deploymentStatus:'live verified', canonicalStatus:'verified',
    professionalParticipationStatus:'applications only', publicUserStatus:'Free starting-point routing available',
    publicSummary:'The central professional network, public starting point, and private ecosystem Control Center.',
    liveUrl:'https://smarterjustice.com', sourceNote:'Owned official domain. Last verified live application version remains separate from newer exact-tested development packages.',
    publicVisible:true, sortOrder:1
  },
  {
    id:'DOMAIN-IO-001', portalSlug:'immigration-oasis', brandName:'Immigration Oasis',
    domain:'immigrationoasis.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'separate live platform', dnsStatus:'verified', sslStatus:'active verified', deploymentStatus:'separate live platform', canonicalStatus:'verified',
    professionalParticipationStatus:'not open', publicUserStatus:'Separate immigration-only platform',
    publicSummary:'Dedicated immigration-only assistance and document-organization platform.',
    liveUrl:'https://immigrationoasis.com', sourceNote:'Owned official domain. Immigration Oasis remains separate and immigration-only.',
    publicVisible:true, sortOrder:2
  },
  {
    id:'DOMAIN-JTS-001', portalSlug:'justice-tax-solutions', brandName:'Justice Tax Solutions',
    domain:'justicetaxsolutions.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'testing', dnsStatus:'not configured', sslStatus:'not requested', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'not open', publicUserStatus:'Development and controlled testing',
    publicSummary:'Tax preparation, notices, tax debt, audits, amended returns, and tax-resolution workflows.',
    liveUrl:'', sourceNote:'Owned official domain. Deployment and live status are not yet verified.',
    publicVisible:true, sortOrder:3
  },
  {
    id:'DOMAIN-STOP-SIGN-001', portalSlug:'domestic-violence-support', brandName:'Stop Sign Project',
    domain:'stopsignproject.org', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'in development', dnsStatus:'not configured', sslStatus:'not requested', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'not open', publicUserStatus:'Dedicated domestic-violence safety and legal-help portal in development',
    publicSummary:'Free-first domestic-violence safety, incident documentation, evidence organization, court preparation, agency resources, and qualified-professional routing.',
    liveUrl:'', sourceNote:'Owner-confirmed official domain. The dedicated portal is a separate build; DNS, deployment, SSL, and live behavior are not yet verified.',
    publicVisible:true, sortOrder:4
  },
  {
    id:'DOMAIN-BUSINESS-CONTRACT-PENDING', portalSlug:'business-launch-desk', brandName:'Business and Contract Law',
    domain:'', ownershipStatus:'domain pending', domainRole:'primary domain to be selected',
    portalStatus:'in development', dnsStatus:'not applicable', sslStatus:'not applicable', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'applications only', publicUserStatus:'Guided Smarter Justice starting path available; official domain pending',
    publicSummary:'Business formation, startups, LLC and corporation workflows, contracts, ongoing compliance, business tax routing, and related professional help.',
    liveUrl:'', sourceNote:'The owner confirmed ContractCreator.com is not owned. Do not publish or use it as an official domain. Select and purchase a replacement domain before canonical deployment.',
    publicVisible:false, sortOrder:4
  },
  {
    id:'DOMAIN-ESTATE-001', portalSlug:'estate-planning-probate', brandName:'Estate Law Aid',
    domain:'estatelawaid.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'in development', dnsStatus:'not configured', sslStatus:'not requested', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'not open', publicUserStatus:'Portal in development',
    publicSummary:'Estate planning, wills, trusts, powers of attorney, probate, and estate administration.',
    liveUrl:'', sourceNote:'Owned official domain. An exact-tested development package exists, but DNS, deployment, SSL, and live behavior remain unverified.',
    publicVisible:true, sortOrder:5
  },
  {
    id:'DOMAIN-DIVORCE-001', portalSlug:'digital-divorce', canonicalPortfolioSlug:'digital-divorce', brandName:'Divorce Law Aid',
    domain:'divorcelawaid.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'in development', dnsStatus:'not configured', sslStatus:'not requested', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'not open', publicUserStatus:'Exact-tested development package; not deployed',
    publicSummary:'Divorce, separation, custody, parenting, visitation, support, property, enforcement, modification, adoption, guardianship, and related family-law workflows.',
    liveUrl:'', sourceNote:'Owned official domain. Divorce Law Aid has an exact-tested v0.3.0 development package. DNS, deployment, SSL, and live behavior remain unverified.',
    publicVisible:true, sortOrder:6
  },
  {
    id:'DOMAIN-CRIMINAL-001', portalSlug:'criminal-law-help-center', brandName:'Criminal Law Aid',
    domain:'criminallawaid.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'in development', dnsStatus:'not configured', sslStatus:'not requested', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'not open', publicUserStatus:'Exact-tested development package; not deployed',
    publicSummary:'Criminal-law starting guidance, records, court notices, traffic, and professional-routing preparation.',
    liveUrl:'', sourceNote:'Owned official domain. Not yet deployed or live verified.',
    publicVisible:true, sortOrder:7
  },
  {
    id:'DOMAIN-PI-001', portalSlug:'motor-vehicle-personal-injury-help-center', canonicalPortfolioSlug:'accident-injury-help', brandName:'Personal Injury Law Aid',
    domain:'personalinjurylawaid.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'in development', dnsStatus:'not configured', sslStatus:'not requested', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'not open', publicUserStatus:'Portal in development',
    publicSummary:'Vehicle accidents, personal injury, evidence organization, insurance, and attorney-routing preparation.',
    liveUrl:'', sourceNote:'Owned official domain. The initial Personal Injury pilot includes vehicle accidents. Workers’ Compensation Law Aid remains a separate portal; Medical Malpractice Law Aid remains a separate specialty portal.',
    publicVisible:true, sortOrder:8
  },
  {
    id:'DOMAIN-DISABILITY-001', portalSlug:'social-security-disability-help-center', canonicalPortfolioSlug:'disability-benefits-help', brandName:'Disability Law Aid',
    domain:'disabilitylawaid.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'in development', dnsStatus:'not configured', sslStatus:'not requested', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'not open', publicUserStatus:'Portal in development',
    publicSummary:'Social Security disability, SSI, SSDI, benefits denials, appeals, and evidence organization.',
    liveUrl:'', sourceNote:'Owned official domain. Broader public-benefits paths may remain within or alongside this portal.',
    publicVisible:true, sortOrder:9
  },
  {
    id:'DOMAIN-HOUSING-001', portalSlug:'tenant-landlord-help-center', canonicalPortfolioSlug:'housing-tenant-help', brandName:'Landlord Tenant Aid',
    domain:'landlordtenantaid.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'in development', dnsStatus:'not configured', sslStatus:'not requested', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'not open', publicUserStatus:'Portal in development',
    publicSummary:'Evictions, rent, repairs, deposits, notices, housing-court preparation, and landlord/tenant workflows.',
    liveUrl:'', sourceNote:'Owned official domain. State and local law require portal-specific adaptation.',
    publicVisible:true, sortOrder:10
  },
  {
    id:'DOMAIN-EMPLOYMENT-001', portalSlug:'employment-labor-law-help-center', brandName:'Employment Law Aid',
    domain:'employmentlawaid.com', ownershipStatus:'owned', domainRole:'primary',
    portalStatus:'in development', dnsStatus:'not configured', sslStatus:'not requested', deploymentStatus:'development package', canonicalStatus:'planned',
    professionalParticipationStatus:'not open', publicUserStatus:'Exact-tested development package; not deployed',
    publicSummary:'Wages, termination, discrimination, harassment, retaliation, leave, and workplace disputes.',
    liveUrl:'', sourceNote:'Owned official domain. Employment Law Aid has an exact-tested v0.7.0 development package. DNS, deployment, SSL, and live behavior remain unverified.',
    publicVisible:true, sortOrder:11
  },

  // Private owner planning records. These must not be published before ownership is confirmed.
  { id:'DOMAIN-BANKRUPTCY-PLAN', portalSlug:'bankruptcy-debt-help', brandName:'Bankruptcy Law Aid', domain:'bankruptcylawaid.com', ownershipStatus:'purchase planned', domainRole:'proposed primary', portalStatus:'in development', dnsStatus:'not applicable', sslStatus:'not applicable', deploymentStatus:'not deployed', canonicalStatus:'planned', professionalParticipationStatus:'not open', publicUserStatus:'Private domain-purchase planning', publicSummary:'Bankruptcy and debt portal.', liveUrl:'', sourceNote:'Do not publish or mark owned until purchase is explicitly confirmed.', publicVisible:false, sortOrder:101 },
  { id:'DOMAIN-MEDMAL-PLAN', portalSlug:'medical-malpractice-assistant-center', brandName:'Medical Malpractice Law Aid', domain:'medicalmalpracticelawaid.com', ownershipStatus:'purchase planned', domainRole:'proposed primary', portalStatus:'planned', dnsStatus:'not applicable', sslStatus:'not applicable', deploymentStatus:'not deployed', canonicalStatus:'planned', professionalParticipationStatus:'not open', publicUserStatus:'Private domain-purchase planning', publicSummary:'Medical-malpractice portal.', liveUrl:'', sourceNote:'Do not publish or mark owned until purchase is explicitly confirmed.', publicVisible:false, sortOrder:102 },
  { id:'DOMAIN-WC-PLAN', portalSlug:'workers-comp-help-center', brandName:'Workers Compensation Law Aid', domain:'workerscompensationlawaid.com', ownershipStatus:'purchase planned', domainRole:'proposed primary', portalStatus:'planned', dnsStatus:'not applicable', sslStatus:'not applicable', deploymentStatus:'not deployed', canonicalStatus:'planned', professionalParticipationStatus:'not open', publicUserStatus:'Private domain-purchase planning', publicSummary:'Workers’ compensation portal.', liveUrl:'', sourceNote:'Preferred remaining purchase. Do not publish or mark owned until purchase is explicitly confirmed.', publicVisible:false, sortOrder:103 },
  { id:'DOMAIN-TM-PLAN', portalSlug:'intellectual-property-desk', brandName:'Trademark Law Aid', domain:'trademarklawaid.com', ownershipStatus:'purchase planned', domainRole:'proposed focused primary', portalStatus:'in development', dnsStatus:'not applicable', sslStatus:'not applicable', deploymentStatus:'not deployed', canonicalStatus:'planned', professionalParticipationStatus:'not open', publicUserStatus:'Private domain-purchase planning', publicSummary:'Trademark-focused portal.', liveUrl:'', sourceNote:'Do not publish or mark owned until purchase is explicitly confirmed.', publicVisible:false, sortOrder:104 },
  { id:'DOMAIN-PATENT-PLAN', portalSlug:'intellectual-property-desk', brandName:'Patent Law Aid', domain:'patentlawaid.com', ownershipStatus:'purchase planned', domainRole:'proposed focused primary', portalStatus:'in development', dnsStatus:'not applicable', sslStatus:'not applicable', deploymentStatus:'not deployed', canonicalStatus:'planned', professionalParticipationStatus:'not open', publicUserStatus:'Private domain-purchase planning', publicSummary:'Patent-focused portal.', liveUrl:'', sourceNote:'Do not publish or mark owned until purchase is explicitly confirmed.', publicVisible:false, sortOrder:105 }
];

module.exports = { DOMAIN_REGISTRY_VERSION, DOMAIN_STATUS_OPTIONS, DOMAIN_REGISTRY_SEEDS };
