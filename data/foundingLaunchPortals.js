const FOUNDING_LAUNCH_VERSION = '1.0.0';

const FOUNDING_LAUNCH_PORTALS = [
  {
    id:'FOUNDING-DIVORCE-FAMILY', slug:'divorce-family-law', portfolioSlug:'digital-divorce',
    name:'Divorce and Family Law', brandName:'Divorce Law Aid', officialDomain:'divorcelawaid.com', domainStatus:'owned',
    publicPage:'/divorce-family-law.html', externalUrl:'',
    publicStage:'guided start available', professionalStage:'founding interest and profile preparation',
    professionalTypes:['family-law attorney','divorce attorney','mediator where permitted'],
    publicWorkflows:['Divorce and separation starting questions','Custody, parenting, visitation, and support organization','Property, debt, enforcement, and modification issue sorting','Adoption, guardianship, and protection-related routing'],
    professionalValue:['Focused profile visibility after approval','Divorce and family-law portal participation preferences','Firm-seat and jurisdiction controls','Structured public starting information when future routing is approved'],
    limitations:['State and county rules vary','Court deadlines and contested matters often require counsel','Public booking and unrestricted routing are not active'],
    practiceSlugs:['divorce-family-law'], sortOrder:1
  },
  {
    id:'FOUNDING-TAX', slug:'tax-law', portfolioSlug:'justice-tax-solutions',
    name:'Tax Law and Tax Resolution', brandName:'Justice Tax Solutions', officialDomain:'justicetaxsolutions.com', domainStatus:'owned',
    publicPage:'/taxes.html', externalUrl:'',
    publicStage:'guided start available; separate portal package in testing', professionalStage:'founding interest and profile preparation',
    professionalTypes:['tax attorney','CPA','enrolled agent','accountant'],
    publicWorkflows:['Tax return and organizer starting questions','IRS, state, and NYC notice description','Tax debt, audit, installment agreement, and offer-in-compromise issue sorting','Prior-return and amended-return review preparation'],
    professionalValue:['Tax-professional profile and firm participation','Separate credential-type controls','Tax preparation and tax-resolution interests','Future organized notice and organizer workflows after approval'],
    limitations:['Tax outcomes, refunds, settlements, and agency decisions are not guaranteed','E-file and representation require separately approved professionals and operations'],
    practiceSlugs:['taxes'], sortOrder:2
  },
  {
    id:'FOUNDING-IMMIGRATION', slug:'immigration-law', portfolioSlug:'immigration-oasis',
    name:'Immigration Law', brandName:'Immigration Oasis', officialDomain:'immigrationoasis.com', domainStatus:'owned',
    publicPage:'https://immigrationoasis.com', externalUrl:'https://immigrationoasis.com',
    publicStage:'separate live immigration-only platform', professionalStage:'central Smarter Justice participation not open yet',
    professionalTypes:['immigration attorney','DOJ-accredited representative where appropriate'],
    publicWorkflows:['USCIS form and notice starting help','Family immigration and citizenship organization','RFE, NOID, denial, waiver, and deadline paths','Work authorization and travel-document support'],
    professionalValue:['Future central identity and approved immigration participation','Immigration-specific credentials and jurisdiction controls','Separate-platform professional workflow planning'],
    limitations:['Immigration Oasis remains separate and immigration-only','Smarter Justice does not merge databases or confidential records automatically'],
    practiceSlugs:['immigration'], sortOrder:3
  },
  {
    id:'FOUNDING-PERSONAL-INJURY', slug:'personal-injury-law', portfolioSlug:'accident-injury-help',
    name:'Personal Injury Law', brandName:'Personal Injury Law Aid', officialDomain:'personalinjurylawaid.com', domainStatus:'owned',
    publicPage:'/personal-injury.html', externalUrl:'',
    publicStage:'guided start available', professionalStage:'founding interest and profile preparation',
    professionalTypes:['personal-injury attorney','trial attorney'],
    publicWorkflows:['Incident timeline and evidence checklist','Vehicle, premises, product, and other injury issue sorting','Insurance, medical-treatment, and deadline organization','Wrongful-death and high-risk routing'],
    professionalValue:['Personal-injury profile participation','Geography, case-type, and availability preferences','Future organized intake only after consent and approval','Firm-seat controls for plaintiff firms'],
    limitations:['Limitations periods and notice rules may be short','No settlement, case acceptance, or recovery is guaranteed'],
    practiceSlugs:['personal-injury','vehicle-accidents','wrongful-death-survivor-claims'], sortOrder:4
  },
  {
    id:'FOUNDING-EMPLOYMENT', slug:'employment-law', portfolioSlug:'employment-labor-law-help-center',
    name:'Employment Law', brandName:'Employment Law Aid', officialDomain:'employmentlawaid.com', domainStatus:'owned',
    publicPage:'/employment-wage-claims.html', externalUrl:'',
    publicStage:'guided start available', professionalStage:'founding interest and profile preparation',
    professionalTypes:['employment attorney','labor attorney where appropriate'],
    publicWorkflows:['Unpaid wages and overtime organization','Termination, discrimination, harassment, and retaliation issue sorting','Leave, accommodation, unemployment, and workplace-document starting paths','Agency, contract, and deadline identification'],
    professionalValue:['Employment-law portal profile participation','Employee-side, employer-side, or neutral service preferences','Jurisdiction and service-mode controls','Future organized inquiries after eligibility and consent'],
    limitations:['Agency and court deadlines vary','Labor and employment specialties must be labeled accurately'],
    practiceSlugs:['employment-wage-claims'], sortOrder:5
  },
  {
    id:'FOUNDING-ESTATE', slug:'estate-probate-law', portfolioSlug:'estate-planning-probate',
    name:'Estate and Probate Law', brandName:'Estate Law Aid', officialDomain:'estatelawaid.com', domainStatus:'owned',
    publicPage:'/estate-planning.html', externalUrl:'',
    publicStage:'guided start available; separate portal package in development', professionalStage:'founding interest and profile preparation',
    professionalTypes:['estate-planning attorney','probate attorney','elder-law attorney where appropriate'],
    publicWorkflows:['Will, trust, power-of-attorney, and advance-directive organization','Beneficiary, asset, and fiduciary questionnaires','Probate and estate-administration starting paths','Guardianship-adjacent and complex-estate routing'],
    professionalValue:['Estate and probate profile participation','Planning versus administration preferences','State-specific service-area controls','Future document-review and professional workflow participation'],
    limitations:['Execution, witnessing, notarization, filing, and tax rules vary by jurisdiction','Complex estates require professional judgment'],
    practiceSlugs:['estate-planning','probate-estate-administration','guardianship-conservatorship'], sortOrder:6
  },
  {
    id:'FOUNDING-BUSINESS-CONTRACT', slug:'business-contract-law', portfolioSlug:'business-launch-desk',
    name:'Business and Contract Law', brandName:'Business and Contract Law', officialDomain:'', domainStatus:'domain pending',
    publicPage:'/business-law.html', externalUrl:'',
    publicStage:'guided start available; focused brand and domain being selected', professionalStage:'founding interest and profile preparation',
    professionalTypes:['business attorney','contract attorney','startup attorney','CPA or tax professional where appropriate','registered IP professional where appropriate'],
    publicWorkflows:['LLC, corporation, nonprofit, and startup issue sorting','Founder, operating, service, vendor, employment, and other contract organization','EIN, registration, license, annual-report, and ongoing-compliance checklists','Federal IP starting paths with state and local obligations clearly separated'],
    professionalValue:['Business and contract portal participation','Formation, contracts, compliance, tax, and IP service preferences','Firm-seat controls for multidisciplinary firms','Future organized startup and contract workflows after approval'],
    limitations:['The final official public brand/domain has not been purchased','State and local formation, licensing, tax, and compliance rules must not be treated as purely federal','No filing or legal result is guaranteed'],
    practiceSlugs:['business-law','business-formation-compliance','nonprofit-formation-compliance','contracts-document-review','trademarks','patents','copyrights'], sortOrder:7
  }
];

function publicRecord(item){
  return {
    id:item.id,slug:item.slug,portfolioSlug:item.portfolioSlug,name:item.name,brandName:item.brandName,
    officialDomain:item.officialDomain,domainStatus:item.domainStatus,publicPage:item.publicPage,externalUrl:item.externalUrl,
    publicStage:item.publicStage,professionalStage:item.professionalStage,professionalTypes:item.professionalTypes,
    publicWorkflows:item.publicWorkflows,professionalValue:item.professionalValue,limitations:item.limitations,
    practiceSlugs:item.practiceSlugs,sortOrder:item.sortOrder
  };
}
function listFoundingLaunchPortals(){ return FOUNDING_LAUNCH_PORTALS.slice().sort((a,b)=>a.sortOrder-b.sortOrder).map(publicRecord); }
function getFoundingLaunchPortal(slug){ const item=FOUNDING_LAUNCH_PORTALS.find(x=>x.slug===slug||x.portfolioSlug===slug); return item?publicRecord(item):null; }
module.exports={FOUNDING_LAUNCH_VERSION,FOUNDING_LAUNCH_PORTALS,listFoundingLaunchPortals,getFoundingLaunchPortal};
