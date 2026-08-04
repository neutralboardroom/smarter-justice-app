'use strict';

const readiness = require('../ATTORNEY_OUTREACH_READINESS_V1.7.75.json');
const boothTruth = require('../JUSTICE_BOOTH_TRUTH_MODEL_V1.7.52.json');
const documentHelp = require('../DOCUMENT_HELP_CAPABILITY_MATRIX_V1.7.52.json');
const fieldKit = require('../ATTORNEY_FIELD_OUTREACH_KIT_V1.7.75.json');
const domainRegistry = require('./domainRegistry');

const PRACTICES = Object.freeze([
  {
    id:'divorce-law-aid',
    query:'divorce',
    label:'Divorce and family law',
    portalName:'Divorce Law Aid',
    specialtyRoute:'/divorce-family-law.html',
    specialtySummary:'Divorce, separation, custody, parenting time, support, property, and related family-law starting paths.',
    profileEvidence:'Family-law experience and portal-specific evidence must be reviewed separately from attorney registration.',
    tool:{route:'/document-tools.html',label:'Device-only document preparation tools',summary:'Use synthetic text to show local review, comparison, action planning, or drafting without creating an account.'}
  },
  {
    id:'estate-law-aid',
    query:'estate',
    label:'Estate planning and probate',
    portalName:'Estate Law Aid',
    specialtyRoute:'/estate-planning.html',
    specialtySummary:'Wills, trusts, probate, estate administration, guardianship, and related estate-law starting paths.',
    profileEvidence:'Estate-planning or probate evidence must be reviewed separately from attorney registration and payment.',
    tool:{route:'/document-tools.html',label:'Device-only document preparation tools',summary:'Use synthetic text to show local document review and preparation boundaries without uploading confidential client material.'}
  },
  {
    id:'personal-injury-law-aid',
    query:'personal-injury',
    label:'Personal injury',
    portalName:'Personal Injury Law Aid',
    specialtyRoute:'/personal-injury.html',
    specialtySummary:'Vehicle accidents and other general personal-injury matters. Workers’ compensation and medical malpractice remain separate portals.',
    profileEvidence:'Personal-injury evidence must be reviewed separately; broad accident eligibility does not create workers’ compensation or medical-malpractice eligibility.',
    tool:{route:'/date-deadline-organizer.html',label:'Date and deadline organizer',summary:'Use synthetic dates to demonstrate organization and reminders without claiming that software calculated a legal deadline.'}
  },
  {
    id:'domestic-violence-aid',
    query:'domestic-violence',
    label:'Domestic-violence-related legal or community service',
    portalName:'Domestic Violence Aid',
    specialtyRoute:'/domestic-violence-aid.html',
    specialtySummary:'Survivor-centered legal information, attorney and resource discovery, court and agency navigation, and safe starting paths.',
    profileEvidence:'Attorney specialty, organization authority, safe public contact, service evidence, and confidential-location review remain separate.',
    safetyNote:'Use only synthetic demonstration details. Do not demonstrate with a survivor narrative, precise location, confidential shelter information, or an automatic contact path.',
    tool:{route:'/communication-evidence-log.html',label:'Device-only communication and evidence log',summary:'Use synthetic entries only. The demonstration must explain local-device limits and must not imply a safety plan or emergency response.'}
  }
]);

function cleanPractice(value){
  const raw=String(value||'').trim().toLowerCase();
  return PRACTICES.find(item=>item.query===raw || item.id===raw) || PRACTICES[0];
}

function publicTourData(practiceValue=''){
  const selected=cleanPractice(practiceValue);
  const domains=domainRegistry.getPublicData().domains || [];
  const domain=domains.find(item=>item.portalSlug===selected.id || item.canonicalPortfolioSlug===selected.id) || null;
  const verifiedLive=Boolean(domain && domain.isLive && domain.liveUrl);
  const handoff=fieldKit.practiceHandoffs.find(item=>item.practice===selected.query) || fieldKit.practiceHandoffs[0];
  return {
    releaseVersion:readiness.releaseVersion,
    launchState:readiness.launchState,
    canonicalRoute:readiness.canonicalTour.route,
    shortPath:readiness.canonicalTour.shortPath,
    campaignCode:readiness.canonicalTour.campaignCode,
    modes:[...fieldKit.modes],
    fieldKit:{shortPath:handoff.shortPath,qrAsset:handoff.qrAsset,printPath:handoff.printPath,trackingEnabled:fieldKit.privacy.trackingEnabled},
    practices:PRACTICES.map(item=>({id:item.id,query:item.query,label:item.label,portalName:item.portalName})),
    selected:{
      ...selected,
      tool:{...selected.tool,route:`${selected.tool.route}?tour=1&practice=${encodeURIComponent(selected.query)}`},
      portalAvailability:{
        liveVerified:verifiedLive,
        liveUrl:verifiedLive?domain.liveUrl:'',
        status:verifiedLive?'VERIFIED_LIVE':'NOT_VERIFIED_LIVE_IN_THIS_ARTIFACT',
        message:verifiedLive?'A verified live portal destination is available.':'Use the Smarter Justice specialty overview and clearly labeled demonstration fallback until exact portal staging is accepted.'
      }
    },
    profileShowcase:{
      demonstrationOnly:true,
      professionalName:'Example Attorney — Demonstration Record',
      firmName:'Example Law Firm — Demonstration Record',
      statuses:['Synthetic demonstration data','Profile control separate from verification','Portal publication separate from membership'],
      fields:[
        {label:'Identity and registration',value:'Reviewed through separate evidence and authority steps'},
        {label:'Firm and office relationship',value:'Shown only after relationship authority is supported'},
        {label:'Jurisdictions and languages',value:'Published only from approved source-backed fields'},
        {label:'Practice evidence',value:selected.profileEvidence},
        {label:'Public contact',value:'Displayed only when supported, approved, and safe'},
        {label:'Corrections and removal',value:'Available independently of payment'}
      ]
    },
    membershipTruth:{
      heading:'One central professional system, with optional paid products kept separate.',
      benefits:[
        'Create or claim one central professional identity and core profile.',
        'Manage corrections, firm and office relationships, and participating portal preparation centrally where supported.',
        'Keep basic profile control free; payment does not buy verification, publication, eligibility, ranking, trust, or endorsement.',
        'Use ordinary firm intake processes only where a portal inquiry workflow is operational and approved.',
        'Review the approved monthly $15 structure while checkout and live payment remain closed until exact operational acceptance.'
      ],
      disclosure:'No leads, clients, revenue, case value, ranking, appointments, or return on investment are guaranteed.'
    },
    safetyBoundary:selected.safetyNote || '',
    continuation:{
      revisitPath:readiness.canonicalTour.shortPath,
      profilePath:`/attorney-launch.html?campaign=${encodeURIComponent(readiness.canonicalTour.campaignCode)}&portal=${encodeURIComponent(selected.id)}`,
      membershipPath:'/professional-membership.html',
      supportPath:'/contact.html?topic=professional-profile'
    }
  };
}

function shortRouteForPath(pathname){
  const value=String(pathname||'');
  const handoff=fieldKit.practiceHandoffs.find(item=>item.shortPath===value);
  return handoff?handoff.canonicalDestination:'';
}

function ownerView(){
  const items=readiness.readinessItems || [];
  const summary={
    total:items.length,
    readyForReview:items.filter(item=>item.status==='READY_FOR_REVIEW').length,
    accepted:items.filter(item=>item.status==='ACCEPTED').length,
    blocked:items.filter(item=>item.status==='BLOCKED').length,
    ownerDecisionRequired:items.filter(item=>item.status==='OWNER_DECISION_REQUIRED').length,
    launchState:readiness.launchState,
    justiceBoothPublicClaimsAllowed:Boolean(boothTruth.summary?.publicClaimsAllowed),
    documentHelpAdoptionStatus:documentHelp.status
  };
  return {readiness,summary,justiceBooth:boothTruth,documentHelp,fieldKit};
}

module.exports={PRACTICES,cleanPractice,publicTourData,shortRouteForPath,ownerView};
