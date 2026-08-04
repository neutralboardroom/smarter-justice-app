'use strict';

const PORTAL_PROFILE_STANDARD_VERSION='1.1.0';

const INITIAL_PORTAL_PROFILE_STANDARDS=Object.freeze({
  'divorce-law-aid':Object.freeze({
    portalId:'divorce-law-aid',name:'Divorce Law Aid',domain:'divorcelawaid.com',centralInterestId:'digital-divorce',
    allowedMatterTypes:Object.freeze(['Divorce','Separation','Child custody','Parenting arrangements','Child support','Spousal support','Property and financial issues','Prenuptial and postnuptial agreements','Other divorce and family-law matters']),
    excludedMatterPatterns:Object.freeze([]),
    publicProfileAuthority:'Divorce Law Aid'
  }),
  'estate-law-aid':Object.freeze({
    portalId:'estate-law-aid',name:'Estate Law Aid',domain:'estatelawaid.com',centralInterestId:'estate-planning-probate',
    allowedMatterTypes:Object.freeze(['Wills','Trusts','Probate','Estate administration','Guardianship','Estate planning','Powers of attorney','Advance directives','Other estate-law matters']),
    excludedMatterPatterns:Object.freeze([]),
    publicProfileAuthority:'Estate Law Aid'
  }),
  'personal-injury-law-aid':Object.freeze({
    portalId:'personal-injury-law-aid',name:'Personal Injury Law Aid',domain:'personalinjurylawaid.com',centralInterestId:'accident-injury-help',
    allowedMatterTypes:Object.freeze(['Car accidents','Truck accidents','Motorcycle accidents','Bicycle accidents','Pedestrian accidents','Rideshare accidents','Delivery-vehicle accidents','Other motor-vehicle accidents','Premises injuries','Slip-and-fall matters','Trip-and-fall matters','Negligent-security injuries','Defective-product injuries','Wrongful-death starting paths','Other general personal-injury matters']),
    excludedMatterPatterns:Object.freeze([/workers?['’]?\s*comp(?:ensation)?/i,/medical\s+malpractice/i]),
    publicProfileAuthority:'Personal Injury Law Aid',vehicleAccidentsIncluded:true,workersCompensationSeparate:true,medicalMalpracticeSeparate:true
  }),
  'domestic-violence-aid':Object.freeze({
    portalId:'domestic-violence-aid',name:'Domestic Violence Aid',domain:'',centralInterestId:'domestic-violence-aid',
    allowedMatterTypes:Object.freeze(['Orders of protection and restraining orders','Family-offense proceedings','Domestic-violence-related family-law matters','Stalking and harassment matters','Victim-rights and crime-victim matters','Housing and relocation legal issues related to domestic violence','Employment or benefits legal issues related to domestic violence','Other domestic-violence-related legal matters']),
    excludedMatterPatterns:Object.freeze([]),
    publicProfileAuthority:'Domestic Violence Aid',safetyCritical:true,organizationAuthoritySupportedCentrally:false,
    requiredSafetyReview:Object.freeze(['Specialty evidence','Public-safe contact','Safe-contact practices','No confidential location','No unsupported emergency, capacity, availability, eligibility, quality, endorsement, or outcome claim'])
  })
});

function getInitialPortalProfileStandard(portalId){
  const row=INITIAL_PORTAL_PROFILE_STANDARDS[String(portalId||'').trim()];
  return row?{...row,allowedMatterTypes:[...row.allowedMatterTypes],excludedMatterPatterns:[...row.excludedMatterPatterns]}:null;
}
function listInitialPortalProfileStandards(){return Object.keys(INITIAL_PORTAL_PROFILE_STANDARDS).map(getInitialPortalProfileStandard);}
function isInitialPortalProfilePortal(portalId){return Boolean(INITIAL_PORTAL_PROFILE_STANDARDS[String(portalId||'').trim()]);}

module.exports={PORTAL_PROFILE_STANDARD_VERSION,INITIAL_PORTAL_PROFILE_STANDARDS,getInitialPortalProfileStandard,listInitialPortalProfileStandards,isInitialPortalProfilePortal};
