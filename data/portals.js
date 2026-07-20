const PORTALS = [
  {
    slug: 'immigration-oasis',
    name: 'Immigration Oasis',
    brandFamily: 'Independent immigration-only platform',
    status: 'Live — Separate Platform',
    defaultUrlEnv: 'PORTAL_IMMIGRATION_OASIS_URL',
    defaultUrl: 'https://immigrationoasis.com',
    summary: 'Dedicated immigration-only help for USCIS forms, notices, family immigration, citizenship, work authorization, RFEs, NOIDs, waivers, and immigration document organization.',
    audience: 'People with immigration questions or documents who should be routed to the specialized immigration-only platform instead of a broad general portal.',
    helpsWith: ['USCIS forms and notices', 'RFE/NOID/denial organization', 'Family immigration starting files', 'Citizenship/naturalization starting questions', 'Work authorization and travel document support'],
    practices: ['immigration'],
    entryActions: ['Ask where to start', 'Upload an immigration notice', 'Continue in the immigration-only platform'],
    disclosure: 'Immigration Oasis remains a separate immigration-only platform. Smarter Justice is not renaming or merging it.'
  },
  {
    slug: 'justice-tax-solutions',
    name: 'Justice Tax Solutions',
    brandFamily: 'Focused tax preparation and tax resolution portal',
    status: 'Pilot — Start Here Now',
    defaultUrlEnv: 'PORTAL_JUSTICE_TAX_SOLUTIONS_URL',
    defaultUrl: '',
    summary: 'Tax preparation and tax resolution help, including IRS/state/NYC notices, tax debt, offers in compromise, installment agreements, audits, liens, levies, amended returns, and organizer files.',
    audience: 'People with tax filing questions, IRS/state notices, tax debt, audits, or resolution needs.',
    helpsWith: ['Tax preparation organizer', 'IRS/state/NYC notice review starter', 'Offer in compromise starter file', 'Installment agreement starter file', 'CPA/EA/accountant/tax attorney review path'],
    practices: ['taxes'],
    entryActions: ['Upload a tax notice', 'Start a tax organizer', 'Request tax professional review when needed'],
    disclosure: 'Tax outcomes, refunds, settlements, or IRS/state decisions are not guaranteed.'
  },
  {
    slug: 'estate-planning-probate',
    name: 'Estate Planning & Probate Portal',
    brandFamily: 'Focused life-document and estate administration portal',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_ESTATE_PLANNING_URL',
    defaultUrl: '',
    summary: 'Wills, trusts, powers of attorney, health care proxies, living wills, advance directives, beneficiary planning, probate, estate administration, and guardianship-adjacent routing.',
    audience: 'People planning documents for themselves or dealing with an estate after death.',
    helpsWith: ['Estate planning starting questionnaire', 'Will/trust/POA document family', 'Probate starter file', 'Beneficiary and asset organizer', 'Attorney review recommendation for complex matters'],
    practices: ['estate-planning','probate-estate-administration','guardianship-conservatorship'],
    entryActions: ['Start estate planning questions', 'Upload existing will or trust', 'Start probate organization'],
    disclosure: 'State law matters. Users must review, sign, witness, notarize, and file documents as required unless separately represented.'
  },
  {
    slug: 'business-launch-desk',
    name: 'Business Launch Desk',
    brandFamily: 'Focused business formation and compliance portal',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_BUSINESS_LAUNCH_DESK_URL',
    defaultUrl: '',
    summary: 'Business formation, EINs, LLCs, corporations, nonprofit formation, annual reports, registered agent issues, licenses, permits, and ongoing compliance support.',
    audience: 'Entrepreneurs, small businesses, founders, nonprofits, and owners with compliance needs.',
    helpsWith: ['LLC/corporation starter file', 'EIN/SS-4 draft path', 'Annual report/compliance organizer', 'Nonprofit formation starting path', 'State/local business filing checklist'],
    practices: ['business-formation-compliance','nonprofit-formation-compliance','business-law'],
    entryActions: ['Start business formation', 'Start nonprofit formation', 'Upload a compliance notice'],
    disclosure: 'Government filing fees and professional fees are separate. Some business/legal/tax choices require professional review.'
  },
  {
    slug: 'contract-creator',
    name: 'ContractCreator.com',
    brandFamily: 'Focused contract creation and review portal',
    status: 'Coming Soon',
    defaultUrlEnv: 'PORTAL_CONTRACT_CREATOR_URL',
    defaultUrl: '',
    summary: 'Create, review, explain, compare, improve, and organize contracts for individuals and small businesses using a guided multi-voice AI and human review model.',
    audience: 'Individuals and small businesses that need contract clarity, starter drafts, or review-ready contract files.',
    helpsWith: ['Plain-English contract explanation', 'Contract review starter file', 'Business document organization', 'Clause comparison', 'Attorney/professional review recommendation for high-risk contracts'],
    practices: ['contracts-document-review','business-law','consumer-protection-identity-theft'],
    entryActions: ['Upload a contract', 'Start a contract draft', 'Ask what a clause means'],
    disclosure: 'Contract guidance is support and organization, not guaranteed legal advice or outcome.'
  },
  {
    slug: 'bankruptcy-debt-help',
    name: 'Bankruptcy & Debt Help',
    brandFamily: 'Focused bankruptcy, debt lawsuit, and collection-notice portal',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_BANKRUPTCY_DEBT_URL',
    defaultUrl: '',
    summary: 'Bankruptcy/debt organizers, Chapter 7/13 starter files, debt lawsuit answer organization, garnishment/judgment notices, and collection-response starting help.',
    audience: 'People sued for debt, facing collection, or exploring bankruptcy.',
    helpsWith: ['Debt lawsuit starter file', 'Bankruptcy debt schedule organizer', 'Garnishment/judgment notice organization', 'Settlement checklist', 'Attorney review recommendation for court/bankruptcy matters'],
    practices: ['bankruptcy-debt','small-claims-consumer-debt','credit-repair','foreclosure-mortgage'],
    entryActions: ['Upload a summons or collection notice', 'Start debt organizer', 'Check court/deadline signals'],
    disclosure: 'Court and bankruptcy matters are deadline-sensitive and often require attorney review.'
  },
  {
    slug: 'disability-benefits-help',
    name: 'Disability & Benefits Help',
    brandFamily: 'Focused disability, veterans, and public-benefits portal',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_DISABILITY_BENEFITS_URL',
    defaultUrl: '',
    summary: 'SSDI, SSI, disability appeals, veterans benefits, SNAP, Medicaid, housing benefits, cash assistance, overpayments, and denial/appeal organization.',
    audience: 'People applying for or appealing benefits and notices.',
    helpsWith: ['SSA disability appeal starter', 'Medical evidence checklist', 'Benefits denial organizer', 'Veterans benefits starting file', 'Public benefits fair-hearing starter'],
    practices: ['disability-benefits','public-benefits','veterans-benefits','healthcare-billing-insurance-appeals'],
    entryActions: ['Upload a denial', 'Start benefits appeal checklist', 'Organize medical evidence'],
    disclosure: 'Benefit approval, timing, and payment amounts are not guaranteed.'
  },
  {
    slug: 'housing-tenant-help',
    name: 'Housing & Tenant Help',
    brandFamily: 'Focused housing, landlord/tenant, and foreclosure-adjacent portal',
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
    name: 'Accident & Injury Help',
    brandFamily: 'Focused accident, injury, insurance, and medical-record organization portal',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_ACCIDENT_INJURY_URL',
    defaultUrl: '',
    summary: 'Vehicle accidents, personal injury, medical malpractice records, workers’ compensation, insurance letters, police reports, medical bills, demand-package organization, and attorney-review routing.',
    audience: 'People injured or dealing with insurance/medical documents after an accident or suspected malpractice.',
    helpsWith: ['Vehicle accident document organizer', 'Personal injury timeline and evidence checklist', 'Medical malpractice records organizer', 'Workers’ compensation notice organization', 'Insurance letter upload path'],
    practices: ['vehicle-accidents','personal-injury','medical-malpractice','workers-compensation','wrongful-death-survivor-claims','toxic-exposure-asbestos-mesothelioma'],
    entryActions: ['Upload insurance letter', 'Start accident organizer', 'Organize medical records'],
    disclosure: 'Injury and malpractice matters are deadline-sensitive and usually need attorney review.'
  },
  {
    slug: 'name-records-employment',
    name: 'Name, Records & Employment Help',
    brandFamily: 'Focused personal-records, expungement, and work-document portal',
    status: 'Coming Soon',
    defaultUrlEnv: 'PORTAL_RECORDS_EMPLOYMENT_URL',
    defaultUrl: '',
    summary: 'Name change, personal records correction, expungement/record sealing, employment/wage claims, unemployment appeals, workplace documents, and identity-record routing.',
    audience: 'People trying to fix records, change a name, respond to work notices, or organize wage/employment claims.',
    helpsWith: ['Name change starter file', 'Record correction checklist', 'Expungement/record cleanup organizer', 'Wage claim/unemployment appeal starter', 'Workplace document review starter'],
    practices: ['name-change-personal-records','expungement-record-cleanup','employment-wage-claims','criminal-defense-traffic-license','education-special-education'],
    entryActions: ['Start records question', 'Upload employment notice', 'Upload court/agency document'],
    disclosure: 'State and agency rules matter. Some matters may require attorney or professional review.'
  },
  {
    slug: 'intellectual-property-desk',
    name: 'Intellectual Property Desk',
    brandFamily: 'Focused trademark, patent, copyright, and brand-protection portal',
    status: 'In Development',
    defaultUrlEnv: 'PORTAL_IP_DESK_URL',
    defaultUrl: '',
    summary: 'Trademarks, patents, copyrights, USPTO office actions, brand protection, specimens, goods/services organization, and review-ready IP starting files.',
    audience: 'Creators, businesses, inventors, and brand owners with IP filing or notice questions.',
    helpsWith: ['Trademark starter file', 'USPTO office-action upload', 'Copyright registration starter', 'Patent/invention organizer', 'IP attorney review recommendation'],
    practices: ['trademarks','patents','copyrights','intellectual-property-general'],
    entryActions: ['Start trademark/IP organizer', 'Upload USPTO notice', 'Start copyright registration starter'],
    disclosure: 'IP filings can affect rights. Attorney or registered patent/trademark professional review may be recommended.'
  },
  {
    slug: 'general-smarter-justice-start',
    name: 'Smarter Justice General Start',
    brandFamily: 'Umbrella starting point for issues that do not fit a focused portal yet',
    status: 'Available Now',
    defaultUrlEnv: 'APP_BASE_URL',
    defaultUrl: '/',
    summary: 'Use the Smarter Justice general start when the user is unsure, the issue crosses categories, or the focused portal is not live yet.',
    audience: 'People who do not know what kind of help they need yet.',
    helpsWith: ['Issue sorting', 'Notice upload', 'Starting file', 'Portal recommendation', 'Human Review Specialist organization'],
    practices: ['other','appeals','administrative-license-appeals','civil-rights-police-misconduct','consumer-protection-identity-theft','education-special-education','guardianship-conservatorship','traffic-license-issues'],
    entryActions: ['Ask where to start', 'Upload a document', 'Get portal recommendation'],
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
  if (portal.status === 'Pilot — Start Here Now') return 'A focused pilot is being prepared. You can start privately through Smarter Justice now.';
  if (portal.status === 'Available Now') return 'This general starting path is available now through Smarter Justice.';
  if (portal.status === 'In Development') return 'The focused portal is being developed. You can still create a private starting file through Smarter Justice.';
  return 'This focused portal is planned. You can still ask where to start or upload a document through Smarter Justice.';
}
function decoratePortal(p){
  return { ...p, publicUrl: publicUrl(p), availabilityMessage: availabilityMessage(p) };
}
function listPortalSummaries(){ return PORTALS.map(decoratePortal); }
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
module.exports = { PORTALS, listPortalSummaries, getPortalBySlug, recommendPortalForPractice, safePortalUrl };
