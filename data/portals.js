const PORTALS = [
  {
    slug: 'immigration-oasis',
    name: 'Immigration Oasis',
    officialDomain: 'immigrationoasis.com',
    brandFamily: 'Independent immigration-only platform',
    status: 'Live — Separate Platform',
    defaultUrlEnv: 'PORTAL_IMMIGRATION_OASIS_URL',
    defaultUrl: 'https://immigrationoasis.com',
    summary: 'Dedicated immigration-only help for USCIS forms, notices, family immigration, citizenship, work authorization, RFEs, NOIDs, waivers, and immigration document organization.',
    audience: 'People with immigration questions or documents who should be routed to the specialized immigration-only platform instead of a broad general portal.',
    helpsWith: ['USCIS forms and notices', 'RFE/NOID/denial organization', 'Family immigration starting summaries', 'Citizenship/naturalization starting questions', 'Work authorization and travel document support'],
    practices: ['immigration'],
    entryActions: ['Ask where to start', 'Continue to Immigration Oasis for notice help', 'Continue in the immigration-only platform'],
    disclosure: 'Immigration Oasis remains a separate immigration-only platform. Smarter Justice is not renaming or merging it.'
  },
  {
    slug: 'justice-tax-solutions',
    name: 'Justice Tax Solutions',
    officialDomain: 'justicetaxsolutions.com',
    brandFamily: 'Focused tax preparation and tax resolution portal',
    status: 'Pilot — Start Here Now',
    defaultUrlEnv: 'PORTAL_JUSTICE_TAX_SOLUTIONS_URL',
    defaultUrl: '',
    summary: 'Tax preparation and tax resolution help, including IRS/state/NYC notices, tax debt, offers in compromise, installment agreements, audits, liens, levies, amended returns, and organizer files.',
    audience: 'People with tax filing questions, IRS/state notices, tax debt, audits, or resolution needs.',
    helpsWith: ['Tax preparation organizer', 'IRS/state/NYC notice review starter', 'Offer in compromise starting summary', 'Installment agreement starting summary', 'CPA/EA/accountant/tax attorney review path'],
    practices: ['taxes'],
    entryActions: ['Describe a tax notice', 'Start a tax organizer', 'Request tax professional review when needed'],
    disclosure: 'Tax outcomes, refunds, settlements, or IRS/state decisions are not guaranteed.'
  },
  {
    slug: 'estate-planning-probate',
    name: 'Estate Law Aid',
    officialDomain: 'estatelawaid.com',
    brandFamily: 'Official Smarter Justice estate-planning and probate portal brand',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_ESTATE_PLANNING_URL',
    defaultUrl: '',
    summary: 'Wills, trusts, powers of attorney, health care proxies, living wills, advance directives, beneficiary planning, probate, estate administration, and guardianship-adjacent routing.',
    audience: 'People planning documents for themselves or dealing with an estate after death.',
    helpsWith: ['Estate planning starting questionnaire', 'Will/trust/POA document family', 'Probate starting summary', 'Beneficiary and asset organizer', 'Attorney review recommendation for complex matters'],
    practices: ['estate-planning','probate-estate-administration','guardianship-conservatorship'],
    entryActions: ['Start estate planning questions', 'Describe an existing will or trust', 'Start probate organization'],
    disclosure: 'State law matters. Users must review, sign, witness, notarize, and file documents as required unless separately represented.'
  },
  {
    slug: 'business-launch-desk',
    name: 'Business and Contract Law',
    brandFamily: 'Focused business formation, contract, startup, and ongoing compliance portal',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_BUSINESS_LAUNCH_DESK_URL',
    defaultUrl: '',
    summary: 'Business formation, startups, LLCs, corporations, nonprofit formation, contracts, founder and operating agreements, EINs, annual reports, licenses, permits, and ongoing compliance support.',
    audience: 'Entrepreneurs, small businesses, founders, nonprofits, and owners with compliance needs.',
    helpsWith: ['LLC/corporation starting summary', 'Contract creation and review preparation', 'Founder and operating agreement organization', 'EIN/SS-4 and annual compliance paths', 'State/local business filing and licensing checklist'],
    practices: ['business-formation-compliance','nonprofit-formation-compliance','business-law','contracts-document-review'],
    entryActions: ['Start business formation', 'Describe a contract question', 'Start nonprofit or compliance organization'],
    disclosure: 'The official portal domain remains to be selected. Government filing fees and professional fees are separate. State and local formation, licensing, tax, and compliance rules require jurisdiction-specific review.'
  },
  {
    slug: 'contract-creator',
    name: 'Business and Contract Law — legacy route',
    brandFamily: 'Compatibility route into Business and Contract Law',
    status: 'Coming Soon',
    defaultUrlEnv: 'PORTAL_BUSINESS_CONTRACT_LAW_URL',
    defaultUrl: '',
    publicVisible: false,
    summary: 'Legacy internal route preserved so earlier contract links continue into the approved Business and Contract Law experience.',
    audience: 'Existing users following an older internal contract route.',
    helpsWith: ['Contract explanation and review preparation', 'Business agreement organization'],
    practices: [],
    entryActions: ['Continue to Business and Contract Law'],
    disclosure: 'ContractCreator.com is not owned and must not be presented as the official brand or domain.'
  },
  {
    slug: 'bankruptcy-debt-help',
    name: 'Bankruptcy & Debt Help',
    brandFamily: 'Focused bankruptcy, debt lawsuit, and collection-notice portal',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_BANKRUPTCY_DEBT_URL',
    defaultUrl: '',
    summary: 'Bankruptcy/debt organizers, Chapter 7/13 starting summaries, debt lawsuit answer organization, garnishment/judgment notices, and collection-response starting help.',
    audience: 'People sued for debt, facing collection, or exploring bankruptcy.',
    helpsWith: ['Debt lawsuit starting summary', 'Bankruptcy debt schedule organizer', 'Garnishment/judgment notice organization', 'Settlement checklist', 'Attorney review recommendation for court/bankruptcy matters'],
    practices: ['bankruptcy-debt','small-claims-consumer-debt','credit-repair','foreclosure-mortgage'],
    entryActions: ['Describe a summons or collection notice', 'Start debt organizer', 'Check court/deadline signals'],
    disclosure: 'Court and bankruptcy matters are deadline-sensitive and often require attorney review.'
  },
  {
    slug: 'disability-benefits-help',
    name: 'Disability Law Aid',
    officialDomain: 'disabilitylawaid.com',
    brandFamily: 'Official Smarter Justice disability-law portal brand',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_DISABILITY_BENEFITS_URL',
    defaultUrl: '',
    summary: 'SSDI, SSI, disability appeals, veterans benefits, SNAP, Medicaid, housing benefits, cash assistance, overpayments, and denial/appeal organization.',
    audience: 'People applying for or appealing benefits and notices.',
    helpsWith: ['SSA disability appeal starter', 'Medical evidence checklist', 'Benefits denial organizer', 'Veterans benefits starting summary', 'Public benefits fair-hearing starter'],
    practices: ['disability-benefits','public-benefits','veterans-benefits','healthcare-billing-insurance-appeals'],
    entryActions: ['Describe a denial', 'Start benefits appeal checklist', 'Organize medical evidence'],
    disclosure: 'Benefit approval, timing, and payment amounts are not guaranteed.'
  },
  {
    slug: 'housing-tenant-help',
    name: 'Landlord Tenant Aid',
    officialDomain: 'landlordtenantaid.com',
    brandFamily: 'Official Smarter Justice landlord-tenant portal brand',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_HOUSING_TENANT_URL',
    defaultUrl: '',
    summary: 'Eviction notices, repairs, rent issues, security deposits, housing court documents, tenant/landlord letters, foreclosure/mortgage notices, and property-related document organization.',
    audience: 'Tenants, landlords, homeowners, and people with housing notices or disputes.',
    helpsWith: ['Eviction notice organizer', 'Repair/rent/deposit letter starter', 'Housing court document checklist', 'Foreclosure notice routing', 'State/county/city-aware next steps'],
    practices: ['landlord-tenant-housing','foreclosure-mortgage','real-estate','hoa-condo-property-disputes'],
    entryActions: ['Upload eviction/housing notice', 'Start repair or deposit issue', 'Add court date/deadline'],
    disclosure: 'Housing rules are state and local. Deadlines can be short.'
  },
  {
    slug: 'accident-injury-help',
    name: 'Personal Injury Law Aid',
    officialDomain: 'personalinjurylawaid.com',
    brandFamily: 'Official Smarter Justice personal-injury portal brand',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_ACCIDENT_INJURY_URL',
    defaultUrl: '',
    summary: 'Vehicle accidents, personal injury, medical malpractice records, workers’ compensation, insurance letters, police reports, medical bills, demand-package organization, and attorney-review routing.',
    audience: 'People injured or dealing with insurance/medical documents after an accident or suspected malpractice.',
    helpsWith: ['Vehicle accident document organizer', 'Personal injury timeline and evidence checklist', 'Medical malpractice records organizer', 'Workers’ compensation notice organization', 'Insurance letter upload path'],
    practices: ['vehicle-accidents','personal-injury','medical-malpractice','workers-compensation','wrongful-death-survivor-claims','toxic-exposure-asbestos-mesothelioma'],
    entryActions: ['Describe an insurance letter', 'Start accident organizer', 'Organize medical records'],
    disclosure: 'Injury and malpractice matters are deadline-sensitive and usually need attorney review.'
  },
  {
    slug: 'digital-divorce',
    name: 'Divorce Law Aid',
    officialDomain: 'divorcelawaid.com',
    brandFamily: 'Official Smarter Justice divorce and family-law portal brand',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_DIVORCE_LAW_AID_URL',
    defaultUrl: '',
    summary: 'Divorce, separation, custody, parenting time, child support, spousal support, property and debt organization, enforcement, modification, adoption, guardianship, and related family-law starting help.',
    audience: 'People dealing with divorce, separation, parenting, support, property, or another family-law matter.',
    helpsWith: ['Divorce and separation starting path', 'Parenting and custody organizer', 'Support and financial organizer', 'Property and debt organizer', 'Family-law document and court-date preparation'],
    practices: ['divorce-family-law'],
    entryActions: ['Start divorce or family questions', 'Describe a family-court notice', 'Organize parenting, support, property, or deadlines'],
    disclosure: 'A complete separate portal build exists in development but is not deployed or live verified. Family-law rules are state and court specific.'
  },
  {
    slug: 'criminal-law-help-center',
    name: 'Criminal Law Aid',
    officialDomain: 'criminallawaid.com',
    brandFamily: 'Official Smarter Justice criminal-law portal brand',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_CRIMINAL_LAW_AID_URL',
    defaultUrl: '',
    summary: 'Arrests, charges, court notices, warrants, bail, traffic and license matters, records, evidence organization, collateral consequences, and urgent defense-attorney preparation.',
    audience: 'People facing a criminal, traffic, license, warrant, arrest, or court matter who need urgent, jurisdiction-aware starting help.',
    helpsWith: ['Charge and court-date organizer', 'Arrest, bail, and warrant starting path', 'Traffic and license notice organizer', 'Record-sealing and collateral-consequence questions', 'Defense-attorney preparation'],
    practices: ['criminal-defense-traffic-license','expungement-record-cleanup'],
    entryActions: ['Describe a criminal or traffic notice', 'Start an urgent court organizer', 'Find a defense attorney'],
    disclosure: 'A complete separate portal build exists in development but is not deployed or live verified. Criminal matters can be urgent and often require immediate attorney review.'
  },
  {
    slug: 'employment-labor-law-help-center',
    name: 'Employment Law Aid',
    officialDomain: 'employmentlawaid.com',
    brandFamily: 'Official Smarter Justice employment-law and workers’ compensation portal brand',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_EMPLOYMENT_LAW_AID_URL',
    defaultUrl: '',
    summary: 'Pay and hours, overtime, discrimination, harassment, retaliation, leave, accommodation, termination, severance, unemployment, workplace injuries, workers’ compensation, union, public-employee, and employer-compliance starting help.',
    audience: 'Employees, applicants, former workers, contractors, injured workers, and small employers seeking role-specific employment-law organization.',
    helpsWith: ['Pay, hours, and overtime organizer', 'Discrimination and retaliation timeline', 'Leave and accommodation organizer', 'Termination and severance review', 'Workplace injury and workers’ compensation path'],
    practices: ['employment-wage-claims'],
    entryActions: ['Start an employment issue', 'Describe a workplace notice', 'Organize a workplace injury or workers’ compensation issue'],
    disclosure: 'A complete separate portal build exists in development but is not deployed or live verified. Employee-side and employer-side matters must remain separated.'
  },
  {
    slug: 'name-records-employment',
    name: 'Name, Records & Education Help',
    brandFamily: 'Focused personal-records and education-document portal',
    status: 'Coming Soon',
    defaultUrlEnv: 'PORTAL_RECORDS_EMPLOYMENT_URL',
    defaultUrl: '',
    summary: 'Name change, personal-record correction, identity-document organization, and education or special-education starting help that does not yet have a dedicated live portal.',
    audience: 'People trying to change or correct records or organize an education-related notice.',
    helpsWith: ['Name-change starting summary', 'Record-correction checklist', 'Identity-document organizer', 'Education or special-education notice organizer'],
    practices: ['name-change-personal-records','education-special-education'],
    entryActions: ['Start a records question', 'Describe an education notice', 'Describe a court or agency document'],
    disclosure: 'State, court, school, and agency rules matter. Employment and criminal matters now have their own focused in-development portal records.'
  },
  {
    slug: 'intellectual-property-desk',
    name: 'Intellectual Property Desk',
    brandFamily: 'Focused trademark, patent, copyright, and brand-protection portal',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_IP_DESK_URL',
    defaultUrl: '',
    summary: 'Trademarks, patents, copyrights, USPTO office actions, brand protection, specimens, goods/services organization, and prepared for review IP starting summaries.',
    audience: 'Creators, businesses, inventors, and brand owners with IP filing or notice questions.',
    helpsWith: ['Trademark starting summary', 'USPTO office-action upload', 'Copyright registration starter', 'Patent/invention organizer', 'IP attorney review recommendation'],
    practices: ['trademarks','patents','copyrights','intellectual-property-general'],
    entryActions: ['Start trademark/IP organizer', 'Describe a USPTO notice', 'Start copyright registration starter'],
    disclosure: 'IP filings can affect rights. Attorney or registered patent/trademark professional review may be recommended.'
  },
  {
    slug: 'domestic-violence-aid',
    name: 'Domestic Violence Aid',
    officialDomain: '',
    brandFamily: 'Survivor-centered initial-launch legal micro-portal; The Stop Sign Project is its preserved community initiative',
    status: 'In Development',
    launchStatus: 'Initial Launch — Safety Acceptance Required',
    defaultUrlEnv: 'PORTAL_DOMESTIC_VIOLENCE_AID_URL',
    defaultUrl: '/domestic-violence-aid.html',
    summary: 'A survivor-centered starting point for legal information, attorney and legal-aid discovery, approved organization and resource discovery, court and agency navigation, prevention, education, outreach, and safe cross-portal direction.',
    audience: 'Survivors, people helping someone else, and people seeking neutral information about domestic-violence-related legal or resource needs.',
    helpsWith: ['Safe legal starting information', 'Attorney and legal-aid discovery preparation', 'Approved organization and resource discovery after safety review', 'Court and agency navigation', 'Prevention, education, and The Stop Sign Project'],
    practices: ['domestic-violence-protection-orders'],
    entryActions: ['Open the Domestic Violence Aid safe entry page', 'Use local emergency services when immediate danger exists and it is safe to do so', 'Learn about The Stop Sign Project community initiative'],
    embeddedInitiative: { name:'The Stop Sign Project', relationship:'A Domestic Violence Aid Community Initiative', officialDomain:'stopsignproject.org', directDoorwayState:'preserved; live routing requires separate verification' },
    disclosure: 'Smarter Justice does not save domestic-violence descriptions or accept related confidential uploads through the general starting path. Domestic Violence Aid and The Stop Sign Project are not emergency services, hotlines, shelters, law firms, courts, police departments, or government agencies. Current resource details and any live portal handoff remain gated until dated safety and staging acceptance is recorded.'
  },
  {
    slug: 'domestic-violence-safety-support',
    name: 'The Stop Sign Project — A Domestic Violence Aid Community Initiative',
    officialDomain: 'stopsignproject.org',
    brandFamily: 'Preserved embedded community initiative within Domestic Violence Aid',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_DOMESTIC_VIOLENCE_SUPPORT_URL',
    defaultUrl: '',
    publicVisible: false,
    primaryPortalSlug: 'domestic-violence-aid',
    relationship: 'EMBEDDED_COMMUNITY_INITIATIVE_PRESERVED',
    automaticRecordReassignment: false,
    summary: 'The Stop Sign Project remains a directly recognizable prevention, education, outreach, and evidence-informed community initiative within Domestic Violence Aid.',
    audience: 'Survivors, people helping someone else, advocates, educators, organizations, and community members seeking prevention and awareness resources.',
    helpsWith: ['Prevention and education', 'Community outreach', 'Evidence-informed tools', 'Public awareness', 'Safe connection to Domestic Violence Aid'],
    practices: ['domestic-violence-protection-orders'],
    entryActions: ['Use the preserved Stop Sign Project direct doorway after exact route acceptance', 'Open the Domestic Violence Aid safe entry page'],
    disclosure: 'The Stop Sign Project remains preserved but no live redirect, DNS change, resource claim, confidential-location disclosure, or automatic legacy-record reassignment is authorized by this release.'
  },
  {
    slug: 'general-smarter-justice-start',
    name: 'Smarter Justice General Start',
    officialDomain: 'smarterjustice.com',
    brandFamily: 'Umbrella starting point for issues that do not fit a focused portal yet',
    status: 'Available Now',
    defaultUrlEnv: 'APP_BASE_URL',
    defaultUrl: '/',
    summary: 'Use the Smarter Justice general start when the user is unsure, the issue crosses categories, or the focused portal is not live yet.',
    audience: 'People who do not know what kind of help they need yet.',
    helpsWith: ['Issue sorting', 'Notice upload', 'Starting summary', 'Portal recommendation', 'Human Review Specialist organization'],
    practices: ['other','appeals','administrative-license-appeals','civil-rights-police-misconduct','consumer-protection-identity-theft','education-special-education','guardianship-conservatorship','traffic-license-issues'],
    entryActions: ['Ask where to start', 'Describe a redacted notice', 'Get portal recommendation'],
    disclosure: 'Smarter Justice will help identify the likely starting point and recommend a focused portal or review path.'
  }
];
const bySlug = new Map(PORTALS.map(p => [p.slug, p]));
const practiceToPortal = new Map();
for (const portal of PORTALS) for (const practice of portal.practices) if (!practiceToPortal.has(practice)) practiceToPortal.set(practice, portal.slug);
function safePortalUrl(value){
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\/(?!\/)/.test(raw) && !/[\\\u0000-\u001f]/.test(raw)) return raw;
  try {
    const parsed = new URL(raw);
    return /^https?:$/.test(parsed.protocol) ? parsed.toString() : '';
  } catch { return ''; }
}
function publicUrl(portal){
  const configured = process.env[portal.defaultUrlEnv];
  return safePortalUrl(configured || portal.defaultUrl || '');
}
function availabilityMessage(portal){
  if (portal.status === 'Live — Separate Platform') return 'This focused portal is available now on its own separate website.';
  if (portal.status === 'Pilot — Start Here Now') return `A separate ${portal.name} website is not open yet. You can still continue through Smarter Justice now.`;
  if (portal.status === 'Available Now') return 'This general starting path is available now through Smarter Justice.';
  if (portal.slug === 'domestic-violence-aid') return 'The Smarter Justice safe entry page is available without saving a description. Current resources, organization publication, and any live portal handoff remain closed until safety and staging acceptance is recorded.';
  if (portal.status === 'In Development') return `A separate ${portal.name} website is not open yet. You can still start through Smarter Justice now without saving your description.`;
  return `A separate ${portal.name} website is planned. You can still start through Smarter Justice now or describe a notice without sensitive details.`;
}
function decoratePortal(p){
  return { ...p, publicUrl: publicUrl(p), availabilityMessage: availabilityMessage(p) };
}
function listPortalSummaries(){ return PORTALS.filter(p=>p.publicVisible!==false).map(decoratePortal); }
function getPortalBySlug(slug){
  const p = bySlug.get(slug);
  return p ? decoratePortal(p) : null;
}
function recommendPortalForPractice(practiceSlug, requestedPortalSlug=''){
  const requested = requestedPortalSlug ? getPortalBySlug(requestedPortalSlug) : null;
  const mappedSlug = practiceToPortal.get(practiceSlug) || 'general-smarter-justice-start';
  const mapped = getPortalBySlug(mappedSlug) || getPortalBySlug('general-smarter-justice-start');
  const portal = requested && (practiceSlug === 'other' || requested.practices.includes(practiceSlug)) ? requested : mapped;
  const action = portal.publicUrl && portal.publicUrl !== '/' ? 'open focused portal' : 'continue with Smarter Justice';
  const userRouteMessage = portal.status === 'Live — Separate Platform'
    ? `${portal.name} is the best focused starting point for this issue. It is a separate platform and is not merged into Smarter Justice.`
    : `${portal.name} is the best focused starting point for this issue. ${portal.availabilityMessage}`;
  return { ...portal, action, userRouteMessage };
}
const STORY_PORTAL_SIGNALS = [
  { slug:'domestic-violence-aid', terms:['domestic violence','abusive partner','abuse','order of protection','restraining order','stalking','harassment','safety plan','threatened me','controlling partner'] },
  { slug:'justice-tax-solutions', terms:['tax','irs','refund','return','audit','levy','lien','installment','income tax','sales tax','payroll tax'] },
  { slug:'estate-planning-probate', terms:['will','trust','probate','estate','executor','beneficiary','power of attorney','health care proxy','inheritance'] },
  { slug:'business-launch-desk', terms:['start a business','business formation','llc','corporation','nonprofit','ein','annual report','registered agent','startup'] },
  { slug:'business-launch-desk', terms:['contract','agreement','lease','terms','breach','vendor agreement','service agreement','employment agreement','founder agreement','operating agreement'] },
  { slug:'bankruptcy-debt-help', terms:['debt','creditor','collection','garnishment','bankruptcy','summons for debt','judgment','credit card lawsuit'] },
  { slug:'disability-benefits-help', terms:['disability','ssdi','ssi','social security','benefits denied','snap','medicaid','veterans benefits','public assistance'] },
  { slug:'housing-tenant-help', terms:['landlord','tenant','rent','eviction','housing court','security deposit','repairs','foreclosure','mortgage'] },
  { slug:'accident-injury-help', terms:['accident','injury','car crash','medical malpractice','workers compensation','insurance claim','hospital','police report'] },
  { slug:'digital-divorce', terms:['divorce','separation','custody','parenting time','visitation','child support','spousal support','family court'] },
  { slug:'criminal-law-help-center', terms:['arrest','criminal charge','warrant','bail','arraignment','traffic ticket','suspended license','dwi','dui','record sealing','expungement'] },
  { slug:'employment-labor-law-help-center', terms:['unpaid wages','employer','job','fired','termination','unemployment','overtime','discrimination','harassment','retaliation','workers compensation'] },
  { slug:'name-records-employment', terms:['name change','record correction','birth certificate','education notice','special education','iep','504 plan'] },
  { slug:'intellectual-property-desk', terms:['trademark','patent','copyright','brand','invention','uspto','office action','intellectual property'] },
  { slug:'immigration-oasis', terms:['immigration','uscis','visa','green card','citizenship','work permit','deportation','rfe','noid'] }
];
function recommendPortalsForStory(question, practiceSlug='other') {
  const text=String(question||'').toLowerCase();
  const primary=recommendPortalForPractice(practiceSlug);
  const scored=STORY_PORTAL_SIGNALS.map(group=>{
    const portal=getPortalBySlug(group.slug);
    if(!portal || portal.slug===primary.slug) return null;
    const matches=group.terms.filter(term=>text.includes(term));
    return matches.length ? { portal, score:matches.length, reasons:matches.slice(0,3) } : null;
  }).filter(Boolean).sort((a,b)=>b.score-a.score || a.portal.name.localeCompare(b.portal.name));
  return { primary, related:scored.slice(0,2).map(row=>({ ...row.portal, storySignals:row.reasons })) };
}
module.exports = { PORTALS, listPortalSummaries, getPortalBySlug, recommendPortalForPractice, recommendPortalsForStory, safePortalUrl };
