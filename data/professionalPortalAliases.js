'use strict';

const PROFESSIONAL_PORTAL_ALIAS_VERSION = '1.2.0';

const CANONICAL_PORTAL_IDS = Object.freeze([
  'general-smarter-justice-start','domestic-violence-aid','immigration-oasis','justice-tax-solutions','estate-law-aid','business-launch-desk','contract-creator','employment-law-aid','divorce-law-aid','landlord-tenant-aid','personal-injury-law-aid','criminal-law-aid','disability-law-aid','workers-compensation-law-aid','consumer-protection-law-aid','veterans-law-aid','trademark-patent-ip-law-aid','medical-malpractice-law-aid','insurance-claim-law-aid','education-law-aid','bankruptcy-debt-law-aid','coverednyc','car-accident-law-aid','justice-truck','stop-sign-project','attorneyride'
]);

const PROFESSIONAL_PORTAL_ALIASES = Object.freeze({
  'general-smarter-justice-start': { canonicalPortalId:'general-smarter-justice-start', state:'CANONICAL_ID', reason:'Current Smarter Justice professional-network identifier.' },
  'domestic-violence-aid': { canonicalPortalId:'domestic-violence-aid', state:'CANONICAL_ID', reason:'Current Domestic Violence Aid launch identifier. Attorney and organization participation remain separate authority and safety-review paths.' },
  'immigration-oasis': { canonicalPortalId:'immigration-oasis', state:'CANONICAL_ID', reason:'Current legal-portal identifier.' },
  'justice-tax-solutions': { canonicalPortalId:'justice-tax-solutions', state:'CANONICAL_ID', reason:'Current legal-portal identifier.' },
  'business-launch-desk': { canonicalPortalId:'business-launch-desk', state:'CANONICAL_ID', reason:'Current legal-portal identifier.' },
  'contract-creator': { canonicalPortalId:'contract-creator', state:'CANONICAL_ID', reason:'Current legal-portal identifier.' },
  'accident-injury-help': { canonicalPortalId:'personal-injury-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy broad accident-and-injury professional grouping maps to the current Personal Injury Law Aid contract. It does not automatically establish Car Accident Law Aid eligibility.' },
  'motor-vehicle-personal-injury': { canonicalPortalId:'personal-injury-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'The initial pilot includes vehicle accidents within Personal Injury Law Aid. This compatibility mapping does not merge or supersede the separate Car Accident Law Aid repository.' },
  'motor-vehicle-personal-injury-help-center': { canonicalPortalId:'personal-injury-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy portal identifier maps to the Personal Injury Law Aid pilot, which includes vehicle accidents and keeps workers’ compensation separate.' },
  'estate-planning-probate': { canonicalPortalId:'estate-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy estate and probate identifier maps to Estate Law Aid.' },
  'bankruptcy-debt-help': { canonicalPortalId:'bankruptcy-debt-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy bankruptcy and debt identifier maps to Bankruptcy & Debt Law Aid.' },
  'employment-labor-law-help-center': { canonicalPortalId:'employment-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy employment and labor identifier maps to Employment Law Aid.' },
  'criminal-law-help-center': { canonicalPortalId:'criminal-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy criminal-law identifier maps to Criminal Law Aid.' },
  'intellectual-property-desk': { canonicalPortalId:'trademark-patent-ip-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy intellectual-property identifier maps to Trademark, Patent & IP Law Aid.' },
  'digital-divorce': { canonicalPortalId:'divorce-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy divorce identifier maps to Divorce Law Aid.' },
  'disability-benefits-help': { canonicalPortalId:'disability-law-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy disability-benefits identifier maps to Disability Law Aid.' },
  'housing-tenant-help': { canonicalPortalId:'landlord-tenant-aid', state:'LEGACY_ALIAS_MAPPED', reason:'Legacy housing and tenant identifier maps to Landlord Tenant Aid.' },
  'name-records-employment': { canonicalPortalId:null, state:'UNRESOLVED_LEGACY_ALIAS', reason:'This mixed legacy grouping combined employment, name-change, record-correction, and related services. It cannot be safely assigned to one current portal without individual review.' },
  'name-records-employment-help': { canonicalPortalId:null, state:'UNRESOLVED_LEGACY_ALIAS', reason:'This mixed legacy grouping cannot be safely assigned to one current portal without individual review.' },
  'domestic-violence-safety-support': { canonicalPortalId:null, state:'UNRESOLVED_LEGACY_ALIAS', reason:'A safety-support initiative is not automatically an attorney-placement portal. Professional assignment requires a separately approved current destination and safeguards.' }
});

function clean(value){ return String(value == null ? '' : value).trim().toLowerCase(); }
function resolveProfessionalPortalId(value){
  const sourcePortalId=clean(value);
  const record=PROFESSIONAL_PORTAL_ALIASES[sourcePortalId];
  if(record) return { sourcePortalId, ...record };
  if(CANONICAL_PORTAL_IDS.includes(sourcePortalId)) return { sourcePortalId, canonicalPortalId:sourcePortalId, state:'CANONICAL_ID', reason:'Current legal-portal identifier.' };
  return { sourcePortalId, canonicalPortalId:null, state:'UNKNOWN_PORTAL_ID', reason:'No approved professional-network mapping exists for this identifier.' };
}
function aliasRegistry(){ return Object.entries(PROFESSIONAL_PORTAL_ALIASES).map(([sourcePortalId,row])=>({sourcePortalId,...row})); }

const PILOT_COMPATIBILITY_POLICY=Object.freeze({personalInjuryIncludesVehicleAccidents:true,workersCompensationSeparate:true,carAccidentPortalState:'PRESERVED_NOT_SEPARATELY_LAUNCHED',domesticViolenceAidIsFourthLaunchPortal:true,stopSignProjectRelationship:'EMBEDDED_COMMUNITY_INITIATIVE_PRESERVED',legacyDomesticViolenceRecordsRequireIndividualReview:true,automaticRecordReassignment:false});

module.exports={PROFESSIONAL_PORTAL_ALIAS_VERSION,CANONICAL_PORTAL_IDS,PROFESSIONAL_PORTAL_ALIASES,PILOT_COMPATIBILITY_POLICY,resolveProfessionalPortalId,aliasRegistry};
