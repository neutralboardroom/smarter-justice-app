'use strict';
const crypto=require('crypto');
const policy=require('../data/professionalLifecycleGovernanceV1754');

function clean(value,max=1200){return String(value==null?'':value).trim().slice(0,max);}
function clone(value){return JSON.parse(JSON.stringify(value));}
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.keys(value).sort().reduce((o,k)=>{o[k]=stable(value[k]);return o;},{});return value;}
function digest(value){return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');}
function int(value){return Math.max(0,Number(value)||0);}

function fieldRule(field){return policy.FIELD_OWNERSHIP_MATRIX.find(row=>row.field===field)||null;}
function projectionDecision(input={}){
  const rule=fieldRule(clean(input.field,120));
  if(!rule)return {accepted:false,conflictState:'MANUAL_REVIEW_REQUIRED',reason:'Field is not present in the versioned ownership matrix.'};
  const central=int(input.centralRevision), portal=int(input.portalRevision), source=int(input.sourceRevision);
  const suppression=Boolean(input.centralSuppressed)||Boolean(input.portalSuppressed);
  if(suppression && Boolean(input.centralSuppressed)!==Boolean(input.portalSuppressed)) return {accepted:false,conflictState:'SUPPRESSION_CONFLICT',reason:'Suppression disagreement must fail closed.',rule};
  if(input.authorityDisputed) return {accepted:false,conflictState:'AUTHORITY_DISPUTE',reason:'Authority dispute requires manual review.',rule};
  if(input.claimantDisputed) return {accepted:false,conflictState:'CLAIMANT_DISPUTE',reason:'Claimant dispute requires manual review.',rule};
  if(input.specialtyDisputed) return {accepted:false,conflictState:'SPECIALTY_DISPUTE',reason:'Portal specialty eligibility is disputed.',rule};
  if(input.sourceDisagrees) return {accepted:false,conflictState:'SOURCE_DISAGREEMENT',reason:'Dated source evidence disagrees with accepted state.',rule};
  if(rule.owner.startsWith('PORTAL_')){
    if(portal>central)return {accepted:true,conflictState:'PORTAL_NEWER',winner:'PORTAL',reason:'Portal-owned field uses the newer accepted portal revision.',rule};
    if(central>portal)return {accepted:false,conflictState:'MANUAL_REVIEW_REQUIRED',winner:'NONE',reason:'Central revision cannot overwrite a portal-owned field.',rule};
  } else if(rule.owner.startsWith('CENTRAL_')){
    if(central>portal)return {accepted:true,conflictState:'CENTRAL_NEWER',winner:'CENTRAL',reason:'Central-owned field uses the newer accepted central revision.',rule};
    if(portal>central)return {accepted:false,conflictState:'MANUAL_REVIEW_REQUIRED',winner:'NONE',reason:'Portal revision cannot overwrite a central-owned field.',rule};
  }
  if(source>Math.max(central,portal)) return {accepted:false,conflictState:'SOURCE_DISAGREEMENT',reason:'A newer source revision requires review before projection.',rule};
  return {accepted:true,conflictState:'NO_CONFLICT',winner:rule.owner.startsWith('PORTAL_')?'PORTAL':'CENTRAL',reason:'No material revision conflict exists.',rule};
}

function correctionPacket(input={}){
  const decision=projectionDecision(input);
  const packet={
    packetVersion:'1.0.0', packetId:clean(input.packetId,160)||`correction:${digest(input).slice(0,20)}`,
    entityId:clean(input.entityId,180), portalId:clean(input.portalId,180), field:clean(input.field,120),
    priorValue:clean(input.priorValue,2000), proposedValue:clean(input.proposedValue,2000),
    fieldOwner:decision.rule?.owner||'UNKNOWN', source:clean(input.source,600), sourceDate:clean(input.sourceDate,40),
    sourceRevision:int(input.sourceRevision), centralRevision:int(input.centralRevision), portalRevision:int(input.portalRevision),
    conflictState:decision.conflictState, automaticWriteBack:false, requiresManualReview:!decision.accepted||decision.conflictState!=='NO_CONFLICT',
    suppressionState:Boolean(input.centralSuppressed)||Boolean(input.portalSuppressed)?'FAIL_CLOSED':'NONE',
    rollbackAvailable:true, reason:decision.reason
  };
  packet.receiptDigest=digest(packet);
  return packet;
}

function billingDecision(input={}){
  const missing=[];
  if(!input.applicationApproved)missing.push('application approval');
  if(!input.signedWebhookVerified)missing.push('signed webhook');
  if(!input.paymentSucceeded)missing.push('confirmed payment');
  if(!input.termsVersion)missing.push('versioned terms');
  if(!input.priceVersion)missing.push('versioned price');
  if(!input.seatCoverageVerified)missing.push('verified seat coverage');
  if(!input.professionalEligible)missing.push('professional eligibility');
  if(input.suspended)missing.push('account not suspended');
  return {activate:missing.length===0 && policy.GATES.liveBilling===true,state:missing.length?'MEMBERSHIP_PENDING_ACTIVATION':'GATE_CLOSED',missing,gateOpen:policy.GATES.liveBilling===true,paymentChangesProfileFacts:false,organicRankAffected:false};
}

function opportunityDecision(input={}){
  const exclusions=[];
  for(const [ok,label] of [[input.portalEligible,'portal eligibility'],[input.professionalVerified,'professional verification'],[input.seatEligible,'covered eligible seat'],[input.membershipThresholdMet,'membership threshold'],[input.conflictCheckReady,'conflict check readiness'],[input.capacityAvailable,'capacity'],[input.userConsent,'user consent']]) if(!ok)exclusions.push(label);
  if(input.suspended)exclusions.push('suspension');
  const forbiddenInputs=['paidTierBeyondThreshold','sponsorship','advertisingSpend','unverifiedRatings','expectedLegalFee','platformRevenue'].filter(k=>input[k]);
  return {eligible:exclusions.length===0&&forbiddenInputs.length===0&&policy.GATES.opportunityDelivery===true,gateOpen:policy.GATES.opportunityDelivery===true,exclusions,forbiddenInputs,userChoiceRequired:true,automaticAssignment:false,representationCreated:false};
}

function notificationClass(kind){return policy.COMMUNICATION_KIND_CLASS[clean(kind,100)]||'OWNER_STAFF_INTERNAL';}
function sanitizeLink(value){const s=clean(value,1200);if(!s)return '';try{const u=new URL(s,'https://smarterjustice.com');return ['https:','http:'].includes(u.protocol)?s:'';}catch{return '';}}
function redactedPayload(payload={}){
  const out={};
  for(const key of ['caseId','practice','serviceType','sessionId','currency','amountTotal','actionLabel']) if(payload[key]!=null&&payload[key]!=='')out[key]=clean(payload[key],key==='caseId'?180:240);
  for(const key of ['actionLink','continuationLink','checkoutUrl']){const v=sanitizeLink(payload[key]);if(v)out[key]=v;}
  if(payload.entityId)out.entityId=clean(payload.entityId,180);
  if(payload.revision!=null)out.revision=int(payload.revision);
  return out;
}
function notificationEnvelope(kind,payload={},options={}){
  const classification=notificationClass(kind);
  const safePayload=redactedPayload(payload);
  const supplied=clean(options.idempotencyKey||payload.idempotencyKey,220);
  const material={kind:clean(kind,100),classification,entityId:safePayload.entityId||safePayload.caseId||'',revision:safePayload.revision||0,purpose:clean(options.purpose,300),safePayload};
  const idempotencyKey=supplied||`notification:${digest(material).slice(0,32)}`;
  return {
    envelopeVersion:'1.0.0',templateVersion:clean(options.templateVersion,80)||'1.0.0',classification,
    purpose:clean(options.purpose,300)||'Minimum necessary Smarter Justice workflow notice.',
    idempotencyKey,idempotencyKeyHash:digest(idempotencyKey),safePayload,
    containsMatterNarrative:false,containsDocuments:false,containsPaymentCredentials:false,containsRecoveryCodes:false,
    containsConfidentialLocations:false,containsSafeContactChoices:false,workflowStateIndependent:true,
    preferenceBasis:classification==='MARKETING'||classification==='PROFESSIONAL_OUTREACH'?'CONSENT_AND_SUPPRESSION_REQUIRED':'TRANSACTIONAL_OR_REQUIRED',
    retryPolicy:'bounded provider retry with suppression and complaint handling',status:'QUEUED_OR_SPOOLED'
  };
}

function validatePolicy(){
  const errors=[];
  const cats=new Set(policy.FIELD_OWNERSHIP_CATEGORIES);
  for(const row of policy.FIELD_OWNERSHIP_MATRIX){if(!cats.has(row.owner))errors.push(`invalid-owner:${row.field}`);if(!cats.has(row.export))errors.push(`invalid-export:${row.field}`);}
  const fields=policy.FIELD_OWNERSHIP_MATRIX.map(x=>x.field);if(new Set(fields).size!==fields.length)errors.push('duplicate-field');
  for(const key of ['publicCheckout','liveBilling','paidGrowth','opportunityDelivery','publicAppointments','publicReviews','automaticPortalWrites','livePortalConnections','deployment'])if(policy.GATES[key]!==false)errors.push(`unsafe-open-gate:${key}`);
  return {ok:errors.length===0,errors};
}
function ownerView(){return {...clone(policy),validation:validatePolicy(),summary:{fieldRules:policy.FIELD_OWNERSHIP_MATRIX.length,conflictStates:policy.CONFLICT_STATES.length,profileStates:policy.PROFILE_STATES.length,firmStates:policy.FIRM_STATES.length,officeStates:policy.OFFICE_STATES.length,seatStates:policy.SEAT_STATES.length,rosterStates:policy.ROSTER_STATES.length,billingStates:policy.BILLING_STATES.length,notificationClasses:policy.NOTIFICATION_CLASSES.length,openCommercialGates:Object.entries(policy.GATES).filter(([,v])=>v).map(([k])=>k)}};}
module.exports={fieldRule,projectionDecision,correctionPacket,billingDecision,opportunityDecision,notificationClass,redactedPayload,notificationEnvelope,validatePolicy,ownerView};
