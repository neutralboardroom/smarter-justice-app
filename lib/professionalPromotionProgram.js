'use strict';

const store = require('./store');
const { isInitialLaunchPilot } = require('../data/initialLaunchPilots');

const STORE_KEY = 'professionalPromotionProgram.json';
const PROGRAM_VERSION = '1.0.0';
const OPEN_CONFIRMATION = 'OPEN PAID PROFESSIONAL GROWTH';
const PROMOTION_STATUSES = ['not requested','requested','approved','suspended','cancelled'];

function clean(value, max = 1500) { return String(value == null ? '' : value).trim().slice(0, max); }
function list(value, max = 100, maxLength = 300) {
  const source = Array.isArray(value) ? value : String(value || '').split(/\r?\n|,/);
  return [...new Set(source.map(item => clean(item, maxLength)).filter(Boolean))].slice(0, max);
}
function bool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value == null || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value));
}
function now() { return store.now(); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function initialState() {
  return {
    schemaVersion:'1.0.0',
    programVersion:PROGRAM_VERSION,
    controls:{
      sponsoredPlacementsOpen:false,
      caseOpportunityAccessOpen:false,
      legalComplianceApproved:false,
      jurisdictionCounselReviewRecorded:false,
      fixedFeeOnly:true,
      percentageOfLegalFeesProhibited:true,
      outcomeContingentChargesProhibited:true,
      payToVerifyProhibited:true,
      organicRankingNeutral:true,
      sponsoredLabel:'Sponsored',
      termsVersion:'',
      complianceReference:'',
      ownerApprovalRequired:true,
      notes:'Free basic profile claiming and editing remain separate from paid prominence and opportunity access. Paid products are closed until legal, billing, support, and launch evidence are approved.',
      updatedAt:''
    },
    promotions:[],
    operations:[],
    stateRevision:0,
    updatedAt:''
  };
}
function normalize(raw) {
  const base = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const defaults = initialState();
  return {
    ...defaults,
    ...base,
    controls:{...defaults.controls,...(base.controls || {}),fixedFeeOnly:true,percentageOfLegalFeesProhibited:true,outcomeContingentChargesProhibited:true,payToVerifyProhibited:true,organicRankingNeutral:true},
    promotions:Array.isArray(base.promotions) ? base.promotions : [],
    operations:Array.isArray(base.operations) ? base.operations : [],
    stateRevision:Number(base.stateRevision || 0)
  };
}
function readState() { return normalize(store.readJson(STORE_KEY, initialState())); }
function stamp(state) { state.schemaVersion='1.0.0';state.programVersion=PROGRAM_VERSION;state.stateRevision=Number(state.stateRevision||0)+1;state.updatedAt=now();return state; }
async function mutate(mutator, eventFactory) {
  const tx = await store.mutateJson(STORE_KEY, initialState(), async raw => {
    const state = normalize(raw);
    const result = await mutator(state);
    return {value:stamp(state),result};
  }, {event:(result,next)=>eventFactory?eventFactory(result,next):null});
  return tx.result;
}
function activePaidMembership(professional, context={}) {
  return Boolean(context.paidMembership || professional?.membership?.status === 'active');
}
function promotionFor(state, professionalId) {
  return state.promotions.find(row => row.professionalId === professionalId) || null;
}
function verifiedForPaidBenefits(professional) {
  return Boolean(
    professional &&
    professional.claimStatus === 'claimed' &&
    professional.verificationStatus === 'verified' &&
    professional.ownerApprovalStatus === 'approved' &&
    !professional.suspensionReason &&
    !['suspended','archived','removed'].includes(professional.profileStatus)
  );
}
function evaluateProfessional(professional, context={}) {
  const state = readState();
  const promotion = promotionFor(state, professional?.id || '');
  const portalId = clean(context.portalId, 120);
  const portalApproved = !portalId || ((professional?.portalEligibility || []).includes(portalId) && isInitialLaunchPilot(portalId));
  const paid = activePaidMembership(professional, context);
  const verified = verifiedForPaidBenefits(professional);
  const termsAccepted = Boolean(professional?.marketplaceTermsAcceptedAt && professional?.independentProfessionalAcknowledgmentAt && professional?.conflictsPolicyAcceptedAt);
  const promotionApproved = promotion?.status === 'approved';
  const promotionPortalApproved = !portalId || (promotion?.portalIds || []).includes(portalId);
  const complianceReady = Boolean(state.controls.legalComplianceApproved && state.controls.jurisdictionCounselReviewRecorded && state.controls.termsVersion && state.controls.complianceReference);
  const basicProfileControl = Boolean(professional && professional.claimStatus === 'claimed');
  const paidFoundationReady = Boolean(paid && verified && portalApproved && termsAccepted && promotionApproved && promotionPortalApproved && complianceReady);
  const sponsoredPlacementEligible = Boolean(paidFoundationReady && state.controls.sponsoredPlacementsOpen);
  const caseOpportunityEligible = Boolean(paidFoundationReady && state.controls.caseOpportunityAccessOpen && context.marketplaceEligible !== false);
  const reasons = [];
  if (!paid) reasons.push('An active paid professional or covered firm membership is required for paid visibility and case opportunities.');
  if (!verified) reasons.push('Identity, credentials, claim authority, and owner approval must be complete.');
  if (!portalApproved) reasons.push('The professional is not approved for the selected specialty portal.');
  if (!termsAccepted) reasons.push('Marketplace, independence, and conflict-check terms must be accepted.');
  if (!promotionApproved) reasons.push('Paid visibility and opportunity access require an approved promotion record.');
  if (!promotionPortalApproved) reasons.push('The approved promotion does not cover the selected portal.');
  if (!complianceReady) reasons.push('Jurisdiction-specific legal compliance, terms, and owner evidence remain incomplete.');
  return {
    programVersion:PROGRAM_VERSION,
    basicProfileControl,
    basicProfilePriceCents:0,
    paidMembership:paid,
    verifiedForPaidBenefits:verified,
    sponsoredPlacementEligible,
    caseOpportunityEligible,
    sponsoredLabel:state.controls.sponsoredLabel || 'Sponsored',
    organicRankingNeutral:true,
    fixedFeeOnly:true,
    percentageOfLegalFeesProhibited:true,
    outcomeContingentChargesProhibited:true,
    payToVerifyProhibited:true,
    promotion:promotion ? {id:promotion.id,status:promotion.status,portalIds:[...(promotion.portalIds||[])],placementType:promotion.placementType,opportunityAccess:promotion.opportunityAccess,approvedAt:promotion.approvedAt} : null,
    reasons
  };
}
function publicPolicy() {
  const state = readState();
  return {
    programVersion:PROGRAM_VERSION,
    basicProfile:{claimFree:true,editFree:true,verificationFree:true,publicationSubjectToReview:true},
    paidProducts:{
      sponsoredVisibility:{available:Boolean(state.controls.sponsoredPlacementsOpen && state.controls.legalComplianceApproved),label:state.controls.sponsoredLabel || 'Sponsored',organicRankUnaffected:true},
      caseOpportunityAccess:{available:Boolean(state.controls.caseOpportunityAccessOpen && state.controls.legalComplianceApproved),billingModel:'fixed subscription or fixed opportunity-access charge',percentageOfLegalFees:false,outcomeContingent:false}
    },
    boundaries:{paymentDoesNotVerify:true,paymentDoesNotCreateSpecialtyEligibility:true,paymentDoesNotCreateEndorsement:true,paymentDoesNotChangeOrganicRanking:true},
    disclosure:'Claiming, verifying, and editing a basic profile is free. Paid products may add clearly labeled sponsored visibility and access to case opportunities after all independent eligibility and compliance requirements are satisfied.'
  };
}
function ownerView() {
  const state = readState();
  return {
    ...clone(state),
    publicPolicy:publicPolicy(),
    summary:{
      promotions:state.promotions.length,
      approvedPromotions:state.promotions.filter(row=>row.status==='approved').length,
      sponsoredPlacementsOpen:Boolean(state.controls.sponsoredPlacementsOpen),
      caseOpportunityAccessOpen:Boolean(state.controls.caseOpportunityAccessOpen),
      legalComplianceApproved:Boolean(state.controls.legalComplianceApproved),
      launchReady:Boolean(state.controls.sponsoredPlacementsOpen && state.controls.caseOpportunityAccessOpen && state.controls.legalComplianceApproved && state.controls.jurisdictionCounselReviewRecorded)
    }
  };
}
async function updateControls(input={}, actor='owner') {
  return mutate(state => {
    const requestedOpen = Boolean(input.sponsoredPlacementsOpen || input.caseOpportunityAccessOpen);
    if (requestedOpen && !(state.controls.sponsoredPlacementsOpen || state.controls.caseOpportunityAccessOpen)) {
      if (clean(input.confirmation,160) !== OPEN_CONFIRMATION) return {error:`Type ${OPEN_CONFIRMATION} to open paid professional growth.`};
      if (clean(input.reason,800).length < 12) return {error:'Record a meaningful reason before opening paid professional growth.'};
      if (!list(input.evidence).length) return {error:'Add at least one evidence reference before opening paid professional growth.'};
      if (!Boolean(input.legalComplianceApproved) || !Boolean(input.jurisdictionCounselReviewRecorded)) return {error:'Legal compliance and jurisdiction-specific counsel review must be recorded before opening paid professional growth.'};
      if (!clean(input.termsVersion,120) || !clean(input.complianceReference,800)) return {error:'Record the controlling terms version and compliance reference before opening paid professional growth.'};
    }
    state.controls = {
      ...state.controls,
      sponsoredPlacementsOpen:Boolean(input.sponsoredPlacementsOpen),
      caseOpportunityAccessOpen:Boolean(input.caseOpportunityAccessOpen),
      legalComplianceApproved:Boolean(input.legalComplianceApproved),
      jurisdictionCounselReviewRecorded:Boolean(input.jurisdictionCounselReviewRecorded),
      fixedFeeOnly:true,
      percentageOfLegalFeesProhibited:true,
      outcomeContingentChargesProhibited:true,
      payToVerifyProhibited:true,
      organicRankingNeutral:true,
      sponsoredLabel:clean(input.sponsoredLabel || state.controls.sponsoredLabel,80) || 'Sponsored',
      termsVersion:clean(input.termsVersion,120),
      complianceReference:clean(input.complianceReference,800),
      notes:clean(input.notes ?? state.controls.notes,3000),
      updatedAt:now()
    };
    state.operations.unshift({id:store.uid('growthop',8),action:'controls-updated',actor,reason:clean(input.reason,800),evidence:list(input.evidence),createdAt:now()});
    return {controls:clone(state.controls),summary:ownerView().summary};
  }, result => result?.controls ? {eventType:'professional_growth_controls_updated',action:'professional_growth_controls_updated'} : null);
}
async function upsertPromotion(professionalId, input={}, actor='owner') {
  return mutate(state => {
    const id = clean(professionalId,180);
    if (!id) return {error:'Professional ID is required.'};
    const status = PROMOTION_STATUSES.includes(input.status) ? input.status : 'requested';
    const portalIds = list(input.portalIds,10,120).filter(isInitialLaunchPilot);
    if (status === 'approved' && !portalIds.length) return {error:'Approve at least one initial specialty portal.'};
    if (status === 'approved' && clean(input.reason,800).length < 8) return {error:'Record an approval reason.'};
    const current = promotionFor(state,id) || {id:store.uid('growth',8),professionalId:id,createdAt:now()};
    const row = {
      ...current,
      status,
      portalIds,
      placementType:clean(input.placementType,160) || 'Sponsored profile placement',
      opportunityAccess:Boolean(input.opportunityAccess),
      fixedFeeOnly:true,
      percentageOfLegalFeesProhibited:true,
      outcomeContingentChargesProhibited:true,
      notes:clean(input.notes,1800),
      approvedAt:status==='approved' ? (current.approvedAt || now()) : '',
      approvedBy:status==='approved' ? actor : '',
      updatedAt:now()
    };
    state.promotions = [row,...state.promotions.filter(item=>item.professionalId!==id)].slice(0,1000);
    state.operations.unshift({id:store.uid('growthop',8),action:'promotion-upserted',actor,professionalId:id,status,portalIds,reason:clean(input.reason,800),createdAt:now()});
    return {promotion:clone(row)};
  }, result => result?.promotion ? {eventType:'professional_growth_promotion_updated',action:'professional_growth_promotion_updated',professionalId:result.promotion.professionalId,status:result.promotion.status} : null);
}

module.exports = {STORE_KEY,PROGRAM_VERSION,OPEN_CONFIRMATION,PROMOTION_STATUSES,readState,publicPolicy,ownerView,evaluateProfessional,updateControls,upsertPromotion};
