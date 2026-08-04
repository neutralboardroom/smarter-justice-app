'use strict';

const FOUR_PORTAL_LAUNCH_VERSION = '1.0.0';
const TARGET_RELEASE_VERSION = '1.7.75';
const HISTORICAL_THREE_PORTAL_IDS = Object.freeze([
  'divorce-law-aid',
  'estate-law-aid',
  'personal-injury-law-aid'
]);

const FOUR_PORTAL_LAUNCH = Object.freeze([
  Object.freeze({
    order:1,
    portalId:'divorce-law-aid',
    name:'Divorce Law Aid',
    domain:'divorcelawaid.com',
    centralInterestId:'digital-divorce',
    profileClasses:['attorney','law-firm'],
    artifact:Object.freeze({version:'0.22.0',filename:'divorce-law-aid-v0.22.0.zip',sha256:'094e1a0c7caea90265e0cecfd3ad5044320596ea7ddc76f9edae987cfd6f4333',sizeBytes:2228140,evidenceState:'OWNER_RECORDED_NOT_STAGED'}),
    simpleScope:Object.freeze(['Divorce','Separation','Child custody and parenting','Child support','Spousal support','Property and financial issues'])
  }),
  Object.freeze({
    order:2,
    portalId:'estate-law-aid',
    name:'Estate Law Aid',
    domain:'estatelawaid.com',
    centralInterestId:'estate-planning-probate',
    profileClasses:['attorney','law-firm'],
    artifact:Object.freeze({version:'1.1.47',filename:'estate-law-aid-v1.1.47.zip',sha256:'0dd5fd612de991ba06d3f20e30ba49e436ead4b94bbe70d1ab4638cb50a849ec',sizeBytes:6846171,evidenceState:'OWNER_RECORDED_NOT_STAGED'}),
    simpleScope:Object.freeze(['Wills','Trusts','Probate','Estate administration','Guardianship','Estate planning'])
  }),
  Object.freeze({
    order:3,
    portalId:'personal-injury-law-aid',
    name:'Personal Injury Law Aid',
    domain:'personalinjurylawaid.com',
    centralInterestId:'accident-injury-help',
    profileClasses:['attorney','law-firm'],
    artifact:Object.freeze({version:'0.40.0',filename:'personal-injury-law-aid-v0.40.0.zip',sha256:'c559032649018abc9b3a31c55c7ddece213f060eae7a79079e0e38de3e454692',sizeBytes:2580441,evidenceState:'OWNER_RECORDED_NOT_STAGED'}),
    simpleScope:Object.freeze(['Vehicle accidents','Premises injuries','Defective products','Wrongful death','Other personal injuries']),
    vehicleAccidentsIncluded:true,
    workersCompensationSeparate:true,
    medicalMalpracticeSeparate:true
  }),
  Object.freeze({
    order:4,
    portalId:'domestic-violence-aid',
    name:'Domestic Violence Aid',
    domain:'',
    centralInterestId:'domestic-violence-aid',
    profileClasses:['attorney','law-firm','legal-aid-organization','advocate','victim-service-organization','nonprofit','community-organization','public-agency','shelter','service-provider','prevention-education-organization'],
    artifact:Object.freeze({version:'0.31.0',filename:'domestic-violence-aid-v0.31.0.zip',sha256:'e39ac3c2bb5952e539ff8740a107c847fbb14882deabf7c45ca852fd3546191f',sizeBytes:1034010,evidenceState:'OWNER_RECORDED_NOT_STAGED'}),
    simpleScope:Object.freeze(['Survivor-centered legal information','Attorney and legal-aid discovery','Approved organization and resource discovery','Court and agency navigation','Prevention and education','Safe cross-portal starting paths']),
    embeddedInitiative:Object.freeze({name:'The Stop Sign Project',relationship:'A Domestic Violence Aid Community Initiative',domain:'stopsignproject.org',automaticRecordReassignment:false}),
    safetyCritical:true
  })
]);

const PORTAL_BY_ID = new Map(FOUR_PORTAL_LAUNCH.map(item=>[item.portalId,item]));
const INTEREST_TO_PORTAL = new Map(FOUR_PORTAL_LAUNCH.map(item=>[item.centralInterestId,item.portalId]));

const DOMESTIC_VIOLENCE_SAFETY_REQUIREMENTS = Object.freeze([
  Object.freeze({key:'evidence:domestic_violence_safety',label:'Domestic Violence survivor-safety acceptance'}),
  Object.freeze({key:'evidence:domestic_violence_privacy',label:'Domestic Violence privacy and data-minimization acceptance'}),
  Object.freeze({key:'evidence:domestic_violence_emergency_resources',label:'Current jurisdiction-appropriate emergency and resource information acceptance'}),
  Object.freeze({key:'evidence:domestic_violence_safe_contact',label:'Safe-contact and notification acceptance'}),
  Object.freeze({key:'evidence:domestic_violence_confidential_locations',label:'Confidential-location suppression acceptance'}),
  Object.freeze({key:'evidence:domestic_violence_quick_exit',label:'Quick-exit behavior and limitation acceptance'}),
  Object.freeze({key:'evidence:domestic_violence_legacy_records',label:'Legacy domestic-violence record review acceptance'}),
  Object.freeze({key:'evidence:domestic_violence_stop_sign_preservation',label:'Stop Sign Project preservation acceptance'}),
  Object.freeze({key:'evidence:domestic_violence_exact_portal_staging',label:'Exact Domestic Violence Aid portal staging and rollback acceptance'})
]);

function clone(value){ return JSON.parse(JSON.stringify(value)); }
function listFourPortalLaunch(){ return clone(FOUR_PORTAL_LAUNCH); }
function getFourPortal(id){ const item=PORTAL_BY_ID.get(String(id||'').trim()); return item?clone(item):null; }
function fourPortalIds(){ return FOUR_PORTAL_LAUNCH.map(item=>item.portalId); }
function isFourPortal(id){ return PORTAL_BY_ID.has(String(id||'').trim()); }
function portalIdForInterest(id){ return INTEREST_TO_PORTAL.get(String(id||'').trim())||''; }

module.exports={
  FOUR_PORTAL_LAUNCH_VERSION,
  TARGET_RELEASE_VERSION,
  HISTORICAL_THREE_PORTAL_IDS,
  FOUR_PORTAL_LAUNCH,
  DOMESTIC_VIOLENCE_SAFETY_REQUIREMENTS,
  listFourPortalLaunch,
  getFourPortal,
  fourPortalIds,
  isFourPortal,
  portalIdForInterest
};
