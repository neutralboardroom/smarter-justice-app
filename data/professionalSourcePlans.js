const PROFESSIONAL_SOURCE_PLAN_VERSION = '1.1.0';


const NEW_YORK_ATTORNEY_SOURCE = {
  sourceType:'official licensing dataset',
  sourceName:'NYS Attorney Registrations — dataset eqw2-r5nb',
  authorityLevel:'primary',
  sourceUrl:'https://data.ny.gov/Transparency/NYS-Attorney-Registrations/eqw2-r5nb',
  allowedFacts:['name','New York registration number','registration status','year admitted','judicial department of admission','law school','public business contact and address where provided','company or firm name where provided'],
  notes:'Preferred bulk-seeding source for the New York curated pilot. It does not establish practice area, professional quality, Smarter Justice participation, availability, or suitability for a matter. Use the official New York Courts attorney search for individual follow-up verification and corrections.'
};

const COMMON_ATTORNEY_SOURCES = [
  NEW_YORK_ATTORNEY_SOURCE,
  { sourceType:'official licensing directory', sourceName:'Applicable state or territory bar attorney directory', authorityLevel:'primary', allowedFacts:['name','bar number where public','admission date','license status','public discipline link','public office contact where provided'], notes:'Use the specific jurisdiction’s official directory. Record retrieval date and source URL for every profile fact.' },
  { sourceType:'official court directory', sourceName:'Applicable federal or state court admission directory where publicly available', authorityLevel:'primary', allowedFacts:['court admissions','public status'], notes:'Use only where the court provides a lawful public lookup.' },
  { sourceType:'professional website', sourceName:'Professional or firm website', authorityLevel:'secondary', allowedFacts:['biography','practice areas','languages','office locations','service descriptions','publications','consultation statements'], notes:'Do not treat self-described practice claims or awards as independently verified without another source.' }
];
const COMMON_TAX_SOURCES = [
  { sourceType:'federal credential directory', sourceName:'IRS Directory of Federal Tax Return Preparers with Credentials and Select Qualifications', authorityLevel:'primary', allowedFacts:['name','credential category','city/state','directory inclusion'], notes:'Use current IRS directory records and avoid overstating representation authority.' },
  { sourceType:'state licensing directory', sourceName:'Applicable state board of accountancy license lookup', authorityLevel:'primary', allowedFacts:['CPA name','license status','license number where public','jurisdiction','disciplinary link where public'], notes:'Use the exact state board source and record retrieval date.' },
  { sourceType:'professional website', sourceName:'Tax professional or firm website', authorityLevel:'secondary', allowedFacts:['services','languages','locations','biography','remote availability'], notes:'Service claims remain self-reported until verified.' }
];

const SOURCE_PLANS = {
  'immigration-oasis': {
    professionalTypes:['attorney','accredited representative'],
    preferredSources:[
      ...COMMON_ATTORNEY_SOURCES,
      { sourceType:'federal recognition roster', sourceName:'DOJ Recognition and Accreditation Program roster', authorityLevel:'primary', allowedFacts:['recognized organization','accredited representative','accreditation type','expiration where public'], notes:'Distinguish accredited representatives and recognized organizations from attorneys.' },
      { sourceType:'federal disciplinary list', sourceName:'EOIR List of Currently Disciplined Practitioners', authorityLevel:'primary', allowedFacts:['disciplinary status'], notes:'Use conservatively and link to the official source; do not summarize beyond the official record.' }
    ],
    specialtyNotes:['Keep Immigration Oasis separate and immigration-only.','Do not describe non-attorney representatives as attorneys.','Collect federal and state-bar facts separately.']
  },
  'justice-tax-solutions': {
    professionalTypes:['tax attorney','CPA','enrolled agent','accountant','other approved professional'],
    preferredSources:[...COMMON_TAX_SOURCES,...COMMON_ATTORNEY_SOURCES,{ sourceType:'federal discipline source', sourceName:'IRS Office of Professional Responsibility and Circular 230 public resources', authorityLevel:'primary', allowedFacts:['public disciplinary status where available'], notes:'Do not infer current standing from absence alone.' }],
    specialtyNotes:['Representational authority differs among attorneys, CPAs, enrolled agents, Annual Filing Season Program participants, and unenrolled preparers.','PTIN or credential data should be displayed only when lawful, useful, and current.']
  },
  'estate-planning-probate': { professionalTypes:['attorney','tax attorney','CPA','accountant'], preferredSources:[...COMMON_ATTORNEY_SOURCES,...COMMON_TAX_SOURCES], specialtyNotes:['Map estate-planning, elder-law, probate, trust, guardianship, and tax services separately.','State and county practice coverage matters.'] },
  'business-launch-desk': { professionalTypes:['attorney','tax attorney','CPA','enrolled agent','accountant','registered patent attorney','registered patent agent'], preferredSources:[...COMMON_ATTORNEY_SOURCES,...COMMON_TAX_SOURCES,{ sourceType:'federal practitioner directory', sourceName:'USPTO Office of Enrollment and Discipline practitioner search', authorityLevel:'primary', allowedFacts:['registered patent attorney or agent status','registration number where public'], notes:'Patent agents are not attorneys unless separately bar licensed.' }], specialtyNotes:['Separate business, tax, employment, licensing, nonprofit, trademark, patent, and compliance services.'] },
  'contract-creator': { professionalTypes:['attorney'], preferredSources:COMMON_ATTORNEY_SOURCES, specialtyNotes:['Map contract categories, industries, jurisdictions, negotiation, drafting, and fixed-price review services.'] },
  'bankruptcy-debt-help': { professionalTypes:['attorney','tax attorney','CPA','enrolled agent'], preferredSources:[...COMMON_ATTORNEY_SOURCES,...COMMON_TAX_SOURCES], specialtyNotes:['Separate consumer bankruptcy, business bankruptcy, debt defense, collections, tax debt, and credit counseling referrals where lawful.'] },
  'disability-benefits-help': { professionalTypes:['attorney','accredited representative','other approved professional'], preferredSources:[...COMMON_ATTORNEY_SOURCES,{ sourceType:'federal representative source', sourceName:'Applicable SSA or VA representative and accreditation resources', authorityLevel:'primary', allowedFacts:['authorized representative category','accreditation where public'], notes:'Use the program-specific authority and do not combine unrelated accreditation categories.' }], specialtyNotes:['Distinguish SSDI/SSI, veterans benefits, public benefits, and appeal representation.'] },
  'housing-tenant-help': { professionalTypes:['attorney'], preferredSources:COMMON_ATTORNEY_SOURCES, specialtyNotes:['Map tenant, landlord, eviction, housing court, foreclosure-adjacent, fair housing, and local jurisdiction coverage.'] },
  'accident-injury-help': { professionalTypes:['attorney'], preferredSources:COMMON_ATTORNEY_SOURCES, specialtyNotes:['Keep medical malpractice, workers’ compensation, personal injury, and vehicle accident categories distinct.','Contingency-fee descriptions must be professional-provided and jurisdictionally reviewed.'] },
  'name-records-employment': { professionalTypes:['attorney'], preferredSources:COMMON_ATTORNEY_SOURCES, specialtyNotes:['Separate employment, wage, unemployment, name change, record correction, sealing/expungement, and related jurisdictional services.'] },
  'intellectual-property-desk': { professionalTypes:['attorney','registered patent attorney','registered patent agent'], preferredSources:[...COMMON_ATTORNEY_SOURCES,{ sourceType:'federal practitioner directory', sourceName:'USPTO Office of Enrollment and Discipline practitioner search', authorityLevel:'primary', allowedFacts:['registration status','registration number where public','attorney or agent category'], notes:'Clearly distinguish patent agents from attorneys and trademark practice from patent registration.' }], specialtyNotes:['Map patent, trademark, copyright, licensing, and litigation services separately.'] },
  'general-smarter-justice-start': { professionalTypes:['attorney','tax attorney','CPA','enrolled agent','accountant','registered patent attorney','registered patent agent','accredited representative','other approved professional'], preferredSources:[...COMMON_ATTORNEY_SOURCES,...COMMON_TAX_SOURCES], specialtyNotes:['Use only as a neutral starting router; final professional eligibility must be evaluated in the appropriate focused portal.'] }
};

module.exports = { PROFESSIONAL_SOURCE_PLAN_VERSION, SOURCE_PLANS, NEW_YORK_ATTORNEY_SOURCE };
