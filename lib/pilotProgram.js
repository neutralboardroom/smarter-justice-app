const store = require('./store');
const operationalReadiness = require('./operationalReadiness');
const professionalMarketplace = require('./professionalMarketplace');

const STORE_KEY = 'pilotProgram.json';
const PROGRAM_VERSION = '1.2.0';
const MEMBERSHIP_TERMS_VERSION = '1.0.0';
const PRIVACY_VERSION = '1.0.0';
const PILOT_ACKNOWLEDGMENT_VERSION = '1.0.0';
const APPLICATION_STATUSES = ['draft','submitted','owner-review','changes-requested','approved-for-payment','active-member','paused','declined','withdrawn'];
const PAYMENT_STATUSES = ['not-started','blocked','ready','checkout-started','paid','failed','cancelled','refunded'];
const SUPPORT_STATUSES = ['open','in-review','waiting-on-professional','resolved','closed'];
const SUPPORT_PRIORITIES = ['normal','high','urgent'];
const EVIDENCE_STATUSES = ['not-started','in-progress','evidence-complete','blocked','not-applicable'];

const REQUIRED_EVIDENCE = [
  ['production_database','Paid production database, persistence, backup, and restore evidence'],
  ['transactional_writes','Awaited transactional writes and idempotency evidence'],
  ['owner_security','Owner account persistence, MFA, recovery, and bootstrap-removal evidence'],
  ['professional_security','Professional login, reset, MFA, recovery, and session-revocation evidence'],
  ['authenticated_email','Authenticated transactional email and real delivery evidence'],
  ['stripe_lifecycle','Stripe test-mode subscription, webhook, refund, cancellation, and failure evidence'],
  ['professional_terms','Professional membership, recurring billing, privacy, and legal-review evidence'],
  ['support_operations','Professional support, escalation, refund, complaint, and incident procedures'],
  ['monitoring_rollback','Monitoring, pause, rollback, and recovery evidence'],
  ['real_device_acceptance','Laptop, tablet, phone, narrow-phone, keyboard, and accessibility evidence'],
  ['first_cohort_approval','Named first cohort, capacity, support ownership, and explicit owner approval']
];

function clean(value, max=3000){ return String(value == null ? '' : value).trim().slice(0,max); }
function list(value, maxItems=100, maxLength=240){
  const source=Array.isArray(value)?value:String(value||'').split(/\r?\n|,/);
  return [...new Set(source.map(item=>clean(item,maxLength)).filter(Boolean))].slice(0,maxItems);
}
function bool(value, fallback=false){
  if(typeof value==='boolean') return value;
  if(value==null || value==='') return fallback;
  return /^(true|1|yes|on)$/i.test(String(value));
}
function int(value,fallback=0,min=0,max=100000){
  const n=Number(value);
  return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;
}
function oneOf(value,allowed,fallback){ return allowed.includes(value)?value:fallback; }
function safeUrl(value){
  const raw=clean(value,1500); if(!raw) return '';
  try { const parsed=new URL(raw); return ['http:','https:'].includes(parsed.protocol)?parsed.toString():''; } catch { return ''; }
}
function clone(value){ return JSON.parse(JSON.stringify(value)); }
function now(){ return store.now(); }
function initialEvidence(){
  return REQUIRED_EVIDENCE.map(([key,title])=>({ key,title,required:true,status:'not-started',summary:'',evidenceUrl:'',verifiedAt:'',verifiedBy:'',updatedAt:'' }));
}
function initialState(){
  return {
    schemaVersion:'1.2.0',
    programVersion:PROGRAM_VERSION,
    controls:{
      applicationsOpen:false,
      paymentGateEnabled:false,
      maxSubmittedApplications:50,
      maxApprovedApplications:25,
      cohortName:'Founding professional pilot',
      ownerApprovalRequired:true,
      notes:'Applications and payments remain closed until required infrastructure, security, legal, support, and first-cohort evidence is complete.',
      updatedAt:''
    },
    applications:[],
    supportTickets:[],
    evidence:initialEvidence(),
    operations:[],
    stateRevision:0,
    updatedAt:''
  };
}
function normalizeState(raw){
  const base=raw && typeof raw==='object' && !Array.isArray(raw)?raw:{};
  const evidenceByKey=new Map((Array.isArray(base.evidence)?base.evidence:[]).map(item=>[item.key,item]));
  return {
    ...initialState(),
    ...base,
    controls:{...initialState().controls,...(base.controls&&typeof base.controls==='object'?base.controls:{})},
    applications:Array.isArray(base.applications)?base.applications:[],
    supportTickets:Array.isArray(base.supportTickets)?base.supportTickets:[],
    evidence:initialEvidence().map(item=>({ ...item,...(evidenceByKey.get(item.key)||{}) })),
    operations:Array.isArray(base.operations)?base.operations:[],
    stateRevision:int(base.stateRevision,0,0,1000000000)
  };
}
function readState(){ return normalizeState(store.readJson(STORE_KEY,initialState())); }
function stampState(state){
  state.schemaVersion='1.2.0';
  state.programVersion=PROGRAM_VERSION;
  state.stateRevision=int(state.stateRevision,0,0,1000000000)+1;
  state.updatedAt=now();
  return state;
}
async function mutateState(mutator,eventFactory){
  const transaction=await store.mutateJson(STORE_KEY,initialState(),async raw=>{
    const state=normalizeState(raw);
    const result=await mutator(state);
    return {value:stampState(state),result};
  },{event:(result,next)=>eventFactory?eventFactory(result,next):null});
  return transaction.result;
}
function addHistory(application,event,actor,details={}){
  application.history=Array.isArray(application.history)?application.history:[];
  application.history.unshift({id:store.uid('pilothistory',7),event,actor:clean(actor,100),details,createdAt:now()});
  application.history=application.history.slice(0,200);
}
function publicApplication(application){
  if(!application) return null;
  return {
    id:application.id,
    status:application.status,
    paymentStatus:application.paymentStatus,
    targetKind:application.targetKind,
    targetId:application.targetId,
    planId:application.planId,
    billingCadence:application.billingCadence,
    seatCount:application.seatCount,
    targetRevision:application.targetRevision||0,
    targetReviewSubmittedAt:application.targetReviewSubmittedAt||'',
    portalInterests:application.portalInterests||[],
    professionalTypes:application.professionalTypes||[],
    goals:application.goals||'',
    supportNeeds:application.supportNeeds||'',
    requiredActions:application.requiredActions||[],
    applicantMessage:application.applicantMessage||'',
    submittedAt:application.submittedAt||'',
    reviewedAt:application.reviewedAt||'',
    approvedAt:application.approvedAt||'',
    createdAt:application.createdAt,
    updatedAt:application.updatedAt,
    acceptances:application.acceptances?{
      membershipTermsVersion:application.acceptances.membershipTermsVersion,
      privacyVersion:application.acceptances.privacyVersion,
      pilotAcknowledgmentVersion:application.acceptances.pilotAcknowledgmentVersion,
      acceptedAt:application.acceptances.acceptedAt||''
    }:null
  };
}
function evidenceSummary(state=readState()){
  const required=state.evidence.filter(item=>item.required);
  const complete=required.filter(item=>item.status==='evidence-complete');
  const blocked=required.filter(item=>item.status==='blocked');
  return {
    requiredCount:required.length,
    completeCount:complete.length,
    blockedCount:blocked.length,
    ready:required.length>0 && complete.length===required.length,
    incompleteKeys:required.filter(item=>item.status!=='evidence-complete').map(item=>item.key)
  };
}
function capacitySummary(state=readState()){
  const submitted=state.applications.filter(item=>['submitted','owner-review','changes-requested'].includes(item.status)).length;
  const approved=state.applications.filter(item=>['approved-for-payment','active-member'].includes(item.status)).length;
  return {
    submitted,
    approved,
    submittedRemaining:Math.max(0,int(state.controls.maxSubmittedApplications,50)-submitted),
    approvedRemaining:Math.max(0,int(state.controls.maxApprovedApplications,25)-approved)
  };
}
function paymentGate(state=readState(),application=null){
  const evidence=evidenceSummary(state);
  const capacity=capacitySummary(state);
  const reasons=[];
  const operationalGate=operationalReadiness.activationGate(evidence);
  if(!state.controls.paymentGateEnabled) reasons.push('Owner payment gate is closed.');
  if(!evidence.ready) reasons.push('Required launch evidence is incomplete.');
  if(!operationalGate.machine.ready) reasons.push('Production machine-readiness checks are incomplete.');
  if(application && application.status!=='approved-for-payment') reasons.push('The application is not approved for payment.');
  if(application && capacity.approved>int(state.controls.maxApprovedApplications,25)) reasons.push('The approved pilot cohort is over capacity.');
  return { available:reasons.length===0,reasons,evidence,capacity,controls:clone(state.controls),operationalGate };
}
function findApplicationForAccount(state,accountId){
  return state.applications.find(item=>item.accountId===accountId && !['withdrawn','declined'].includes(item.status)) || state.applications.find(item=>item.accountId===accountId) || null;
}
function operationResult(state,key,scope){
  if(!key) return null;
  return state.operations.find(item=>item.key===key && item.scope===scope) || null;
}
function recordOperation(state,key,scope,result){
  if(!key) return;
  state.operations.unshift({id:store.uid('pilotop',8),key:clean(key,180),scope,createdAt:now(),result});
  state.operations=state.operations.slice(0,1000);
}
function validateAcceptances(input={}){
  const missing=[];
  if(!bool(input.acceptMembershipTerms)) missing.push('Professional Membership Terms');
  if(!bool(input.acceptPrivacy)) missing.push('Privacy Notice');
  if(!bool(input.acceptRecurringBilling)) missing.push('Recurring billing acknowledgment');
  if(!bool(input.acceptNoGuarantees)) missing.push('No-guarantee acknowledgment');
  if(!bool(input.acceptIndependentProfessional)) missing.push('Independent-professional acknowledgment');
  if(!bool(input.acceptConflicts)) missing.push('Conflict-check and engagement-boundary acknowledgment');
  return missing;
}
function targetSnapshot(kind,id){
  const owner=professionalMarketplace.getOwnerData();
  const record=kind==='firm'?owner.firms.find(row=>row.id===id):owner.professionals.find(row=>row.id===id);
  if(!record)return null;
  const readiness=kind==='firm'?professionalMarketplace.firmProfileReadiness(record):professionalMarketplace.professionalProfileReadiness(record);
  return {record,readiness,revision:Number(record.profileRevision||1),reviewSubmittedAt:record.reviewSubmittedAt||'',reviewStatus:record.reviewStatus||'draft'};
}
function buildApplication(account,input={},current=null){
  const createdAt=current?.createdAt||now();
  return {
    id:current?.id||store.uid('pilotapp',10),
    accountId:account.id,
    applicantEmail:account.email,
    applicantName:account.displayName,
    accountType:account.accountType,
    targetKind:oneOf(input.targetKind,['professional','firm'],current?.targetKind||account.membershipTarget?.kind||'professional'),
    targetId:clean(input.targetId||current?.targetId||account.membershipTarget?.id,180),
    planId:clean(input.planId||current?.planId||account.membershipTarget?.planId||'nyc-founding-professional',120),
    billingCadence:oneOf(input.billingCadence,['monthly','annual'],current?.billingCadence||'monthly'),
    seatCount:int(input.seatCount,current?.seatCount||account.membershipTarget?.seatCount||1,1,10000),
    targetRevision:int(input.targetRevision,current?.targetRevision||0,0,1000000000),
    targetReviewSubmittedAt:clean(input.targetReviewSubmittedAt||current?.targetReviewSubmittedAt,80),
    professionalTypes:list(input.professionalTypes??current?.professionalTypes,20,100),
    portalInterests:list(input.portalInterests??current?.portalInterests,50,140),
    goals:clean(input.goals??current?.goals,4000),
    whyJoin:clean(input.whyJoin??current?.whyJoin,4000),
    supportNeeds:clean(input.supportNeeds??current?.supportNeeds,3000),
    applicantMessage:clean(current?.applicantMessage,3000),
    requiredActions:Array.isArray(current?.requiredActions)?current.requiredActions:[],
    status:current?.status||'draft',
    paymentStatus:current?.paymentStatus||'not-started',
    ownerDecision:current?.ownerDecision||'',
    ownerNotes:current?.ownerNotes||'',
    submittedAt:current?.submittedAt||'',
    reviewedAt:current?.reviewedAt||'',
    approvedAt:current?.approvedAt||'',
    createdAt,
    updatedAt:now(),
    acceptances:current?.acceptances||null,
    history:Array.isArray(current?.history)?current.history:[]
  };
}
async function saveApplication(account,input={},idempotencyKey=''){
  const result=await mutateState(state=>{
    const scope=`save:${account.id}`;
    const existingOperation=operationResult(state,idempotencyKey,scope);
    if(existingOperation) return {...existingOperation.result,idempotentReplay:true};
    let application=findApplicationForAccount(state,account.id);
    if(application && !['draft','changes-requested'].includes(application.status)) return {error:'This application has already been submitted. You can return here for updates.'};
    const next=buildApplication(account,input,application);
    if(application) Object.assign(application,next); else { application=next; state.applications.unshift(application); }
    addHistory(application,'application-saved','professional-account',{status:application.status});
    const response={application:publicApplication(application)};
    recordOperation(state,idempotencyKey,scope,response);
    return response;
  },(result)=>result?.application?{eventType:'pilot_application_saved',action:'pilot_application_saved',accountId:account.id,applicationId:result.application.id}:null);
  if(result?.application) store.addAudit({actor:'professional-account',action:'pilot_application_saved',details:{accountId:account.id,applicationId:result.application.id,status:result.application.status}});
  return result;
}
async function submitApplication(account,input={},idempotencyKey=''){
  const result=await mutateState(state=>{
    const scope=`submit:${account.id}`;
    const existingOperation=operationResult(state,idempotencyKey,scope);
    if(existingOperation) return {...existingOperation.result,idempotentReplay:true};
    if(!state.controls.applicationsOpen) return {error:'Professional membership applications are not open right now. You may continue preparing your profile and account.'};
    const capacity=capacitySummary(state);
    if(capacity.submittedRemaining<1) return {error:'The current application cohort is full.'};
    const missing=validateAcceptances(input);
    if(missing.length) return {error:`Accept the required application terms before submitting: ${missing.join(', ')}.`};
    let application=findApplicationForAccount(state,account.id);
    if(application && !['draft','changes-requested'].includes(application.status)) return {application:publicApplication(application),message:'This application was already submitted.'};
    const next=buildApplication(account,input,application);
    if(!next.targetId) return {error:'Connect or select the professional or firm membership target before submitting.'};
    const snapshot=targetSnapshot(next.targetKind,next.targetId);
    if(!snapshot)return {error:'The selected professional or firm record could not be found.'};
    if(!snapshot.readiness.readyForReview)return {error:'Complete and submit the selected profile for review before submitting the membership application.',profileReadiness:snapshot.readiness};
    if(!snapshot.readiness.currentRevisionSubmitted || !['submitted','approved'].includes(snapshot.reviewStatus))return {error:'Submit the current profile revision for review before submitting the membership application.',profileReadiness:snapshot.readiness};
    next.targetRevision=snapshot.revision; next.targetReviewSubmittedAt=snapshot.reviewSubmittedAt;
    next.status='submitted'; next.paymentStatus='blocked'; next.submittedAt=now(); next.updatedAt=now();
    next.acceptances={membershipTermsVersion:MEMBERSHIP_TERMS_VERSION,privacyVersion:PRIVACY_VERSION,pilotAcknowledgmentVersion:PILOT_ACKNOWLEDGMENT_VERSION,recurringBillingAccepted:true,noGuaranteesAccepted:true,independentProfessionalAccepted:true,conflictsAccepted:true,acceptedAt:now(),acceptanceSource:'professional-dashboard'};
    if(application) Object.assign(application,next); else { application=next; state.applications.unshift(application); }
    addHistory(application,'application-submitted','professional-account',{targetKind:application.targetKind,targetId:application.targetId});
    const response={application:publicApplication(application),message:'Your professional membership application was submitted for review. No payment was taken.'};
    recordOperation(state,idempotencyKey,scope,response);
    return response;
  },(result)=>result?.application?{eventType:'pilot_application_submitted',action:'pilot_application_submitted',accountId:account.id,applicationId:result.application.id}:null);
  if(result?.application && !result.idempotentReplay) store.addAudit({actor:'professional-account',action:'pilot_application_submitted',details:{accountId:account.id,applicationId:result.application.id,targetKind:result.application.targetKind,targetId:result.application.targetId}});
  return result;
}
async function withdrawApplication(account,idempotencyKey=''){
  const result=await mutateState(state=>{
    const application=findApplicationForAccount(state,account.id);
    if(!application) return {error:'No professional membership application was found.'};
    if(application.paymentStatus==='paid' || application.status==='active-member') return {error:'Contact professional support to cancel or change an active paid membership.'};
    const scope=`withdraw:${application.id}`; const existingOperation=operationResult(state,idempotencyKey,scope);
    if(existingOperation) return {...existingOperation.result,idempotentReplay:true};
    application.status='withdrawn'; application.paymentStatus='cancelled'; application.updatedAt=now();
    addHistory(application,'application-withdrawn','professional-account');
    const response={application:publicApplication(application),message:'The professional membership application was withdrawn. No payment was taken.'};
    recordOperation(state,idempotencyKey,scope,response); return response;
  },result=>result?.application?{eventType:'pilot_application_withdrawn',action:'pilot_application_withdrawn',accountId:account.id,applicationId:result.application.id}:null);
  if(result?.application) store.addAudit({actor:'professional-account',action:'pilot_application_withdrawn',details:{accountId:account.id,applicationId:result.application.id}});
  return result;
}
async function ownerReviewApplication(id,input={},idempotencyKey=''){
  const result=await mutateState(state=>{
    const application=state.applications.find(item=>item.id===id);
    if(!application) return {error:'Professional membership application not found.'};
    const scope=`owner-review:${id}:${clean(input.status,80)}`; const existingOperation=operationResult(state,idempotencyKey,scope);
    if(existingOperation) return {...existingOperation.result,idempotentReplay:true};
    const allowed=['owner-review','changes-requested','approved-for-payment','paused','declined'];
    const nextStatus=oneOf(input.status,allowed,application.status);
    if(nextStatus==='approved-for-payment' && !application.acceptances?.acceptedAt) return {error:'The application cannot be approved without recorded versioned acceptances.'};
    if(nextStatus==='approved-for-payment'){
      const snapshot=targetSnapshot(application.targetKind,application.targetId);
      if(!snapshot)return {error:'The application target no longer exists.'};
      if(!snapshot.readiness.readyForReview || !snapshot.readiness.currentRevisionSubmitted || snapshot.reviewStatus!=='approved')return {error:'The current profile revision must be complete, submitted, and approved before payment approval.',profileReadiness:snapshot.readiness,reviewStatus:snapshot.reviewStatus};
      application.targetRevision=snapshot.revision; application.targetReviewSubmittedAt=snapshot.reviewSubmittedAt;
    }
    const priorStatus=application.status;
    application.status=nextStatus; application.ownerDecision=clean(input.ownerDecision||nextStatus,500); application.ownerNotes=clean(input.ownerNotes,5000); application.applicantMessage=clean(input.applicantMessage,3000); application.requiredActions=list(input.requiredActions,50,300); application.reviewedAt=now(); application.updatedAt=now();
    if(nextStatus==='approved-for-payment') application.approvedAt=now();
    const gate=paymentGate(state,application);
    application.paymentStatus=nextStatus==='approved-for-payment'?(gate.available?'ready':'blocked'):(nextStatus==='declined'?'cancelled':application.paymentStatus);
    addHistory(application,'owner-review','owner-control-center',{priorStatus,nextStatus,paymentStatus:application.paymentStatus});
    const response={application:publicApplication(application),paymentGate:gate}; recordOperation(state,idempotencyKey,scope,response); return response;
  },result=>result?.application?{eventType:'pilot_application_reviewed',action:'pilot_application_reviewed',applicationId:result.application.id,status:result.application.status}:null);
  if(result?.application) store.addAudit({actor:'owner-control-center',action:'pilot_application_reviewed',details:{applicationId:result.application.id,status:result.application.status,paymentStatus:result.application.paymentStatus}});
  return result;
}
async function markCheckoutStarted(account,sessionId=''){
  const result=await mutateState(state=>{
    const application=findApplicationForAccount(state,account.id);
    if(!application) return {error:'A professional membership application is required before checkout.'};
    const gate=paymentGate(state,application);
    if(!gate.available) return {error:'Membership checkout is not available yet.',paymentGate:gate};
    application.paymentStatus='checkout-started'; application.checkoutSessionId=clean(sessionId,240); application.updatedAt=now();
    addHistory(application,'checkout-started','professional-account',{sessionReference:application.checkoutSessionId});
    return {application:publicApplication(application),paymentGate:gate};
  },result=>result?.application?{eventType:'pilot_checkout_started',action:'pilot_checkout_started',accountId:account.id,applicationId:result.application.id}:null);
  return result;
}
async function recordPayment(accountId,payment={}){
  const result=await mutateState(state=>{
    const application=findApplicationForAccount(state,accountId);
    if(!application) return {error:'Professional membership application not found for this account.'};
    const status=oneOf(payment.status,['paid','failed','cancelled','refunded'],application.paymentStatus);
    const priorStatus=application.paymentStatus; application.paymentStatus=status;
    if(status==='paid') application.status='active-member';
    if(status==='refunded') application.status='paused';
    application.paymentReference=clean(payment.reference,240); application.paymentUpdatedAt=now(); application.updatedAt=now();
    addHistory(application,'payment-status-updated','stripe',{priorStatus,status,reference:application.paymentReference});
    return {application:publicApplication(application)};
  },result=>result?.application?{eventType:'pilot_membership_payment_status_updated',action:'pilot_membership_payment_status_updated',accountId,applicationId:result.application.id,status:result.application.paymentStatus}:null);
  if(result?.application) store.addAudit({actor:'stripe',action:'pilot_membership_payment_status_updated',details:{applicationId:result.application.id,accountId,status:result.application.paymentStatus}});
  return result;
}
async function createSupportTicket(account,input={},idempotencyKey=''){
  const result=await mutateState(state=>{
    const scope=`support:${account.id}`; const existingOperation=operationResult(state,idempotencyKey,scope);
    if(existingOperation) return {...existingOperation.result,idempotentReplay:true};
    const category=clean(input.category,120); const subject=clean(input.subject,240); const message=clean(input.message,5000);
    if(!category || !subject || message.length<10) return {error:'Add a category, subject, and a clear description of the support request.'};
    const ticket={id:store.uid('prosupport',10),accountId:account.id,applicantName:account.displayName,applicantEmail:account.email,category,subject,message,priority:oneOf(input.priority,SUPPORT_PRIORITIES,'normal'),status:'open',ownerNotes:'',resolutionMessage:'',createdAt:now(),updatedAt:now(),resolvedAt:'',history:[{event:'created',actor:'professional-account',createdAt:now()}]};
    state.supportTickets.unshift(ticket);
    const response={ticket:{...ticket,ownerNotes:undefined},message:'Your professional support request was recorded.'}; recordOperation(state,idempotencyKey,scope,response); return response;
  },result=>result?.ticket?{eventType:'professional_support_ticket_created',action:'professional_support_ticket_created',accountId:account.id,ticketId:result.ticket.id}:null);
  if(result?.ticket && !result.idempotentReplay) store.addAudit({actor:'professional-account',action:'professional_support_ticket_created',details:{accountId:account.id,ticketId:result.ticket.id,category:result.ticket.category,priority:result.ticket.priority}});
  return result;
}
async function ownerUpdateSupportTicket(id,input={},idempotencyKey=''){
  const result=await mutateState(state=>{
    const ticket=state.supportTickets.find(item=>item.id===id); if(!ticket) return {error:'Support ticket not found.'};
    const scope=`support-update:${id}:${clean(input.status,80)}`; const existingOperation=operationResult(state,idempotencyKey,scope); if(existingOperation) return {...existingOperation.result,idempotentReplay:true};
    const priorStatus=ticket.status; ticket.status=oneOf(input.status,SUPPORT_STATUSES,ticket.status); ticket.priority=oneOf(input.priority,SUPPORT_PRIORITIES,ticket.priority); ticket.ownerNotes=clean(input.ownerNotes,5000); ticket.resolutionMessage=clean(input.resolutionMessage,3000); ticket.updatedAt=now(); if(['resolved','closed'].includes(ticket.status))ticket.resolvedAt=now();
    ticket.history=Array.isArray(ticket.history)?ticket.history:[]; ticket.history.unshift({event:'owner-update',actor:'owner-control-center',priorStatus,status:ticket.status,createdAt:now()}); ticket.history=ticket.history.slice(0,100);
    const response={ticket}; recordOperation(state,idempotencyKey,scope,response); return response;
  },result=>result?.ticket?{eventType:'professional_support_ticket_updated',action:'professional_support_ticket_updated',ticketId:id,status:result.ticket.status}:null);
  if(result?.ticket) store.addAudit({actor:'owner-control-center',action:'professional_support_ticket_updated',details:{ticketId:id,status:result.ticket.status,priority:result.ticket.priority}});
  return result;
}
async function updateEvidence(key,input={}){
  const result=await mutateState(state=>{
    const item=state.evidence.find(entry=>entry.key===key); if(!item) return {error:'Readiness evidence item not found.'};
    item.status=oneOf(input.status,EVIDENCE_STATUSES,item.status); item.summary=clean(input.summary,5000); item.evidenceUrl=safeUrl(input.evidenceUrl); item.verifiedBy=clean(input.verifiedBy,180); item.verifiedAt=item.status==='evidence-complete'?(clean(input.verifiedAt,80)||now()):''; item.updatedAt=now();
    return {evidence:item,summary:evidenceSummary(state),paymentGate:paymentGate(state)};
  },result=>result?.evidence?{eventType:'pilot_readiness_evidence_updated',action:'pilot_readiness_evidence_updated',key,status:result.evidence.status}:null);
  if(result?.evidence) store.addAudit({actor:'owner-control-center',action:'pilot_readiness_evidence_updated',details:{key,status:result.evidence.status}});
  return result;
}
async function updateControls(input={}){
  const result=await mutateState(state=>{
    const evidence=evidenceSummary(state); const requestedPayment=bool(input.paymentGateEnabled,state.controls.paymentGateEnabled);
    const operationalGate=operationalReadiness.activationGate(evidence);
    if(requestedPayment && !operationalGate.available) return {error:'Complete every required owner-reviewed evidence item and production machine-readiness check before opening the payment gate.',evidence,operationalGate};
    state.controls={...state.controls,applicationsOpen:bool(input.applicationsOpen,state.controls.applicationsOpen),paymentGateEnabled:requestedPayment,maxSubmittedApplications:int(input.maxSubmittedApplications,state.controls.maxSubmittedApplications,0,10000),maxApprovedApplications:int(input.maxApprovedApplications,state.controls.maxApprovedApplications,0,10000),cohortName:clean(input.cohortName||state.controls.cohortName,180),ownerApprovalRequired:true,notes:clean(input.notes??state.controls.notes,5000),updatedAt:now()};
    for(const application of state.applications.filter(item=>item.status==='approved-for-payment')) application.paymentStatus=paymentGate(state,application).available?'ready':'blocked';
    return ownerView(state);
  },result=>result?.controls?{eventType:'pilot_program_controls_updated',action:'pilot_program_controls_updated',applicationsOpen:result.controls.applicationsOpen,paymentGateEnabled:result.controls.paymentGateEnabled}:null);
  if(result?.controls) store.addAudit({actor:'owner-control-center',action:'pilot_program_controls_updated',details:{applicationsOpen:result.controls.applicationsOpen,paymentGateEnabled:result.controls.paymentGateEnabled,maxSubmittedApplications:result.controls.maxSubmittedApplications,maxApprovedApplications:result.controls.maxApprovedApplications}});
  return result;
}
function professionalView(accountId){
  const state=readState(); const application=findApplicationForAccount(state,accountId); const tickets=state.supportTickets.filter(item=>item.accountId===accountId).map(item=>({id:item.id,category:item.category,subject:item.subject,priority:item.priority,status:item.status,resolutionMessage:item.resolutionMessage||'',createdAt:item.createdAt,updatedAt:item.updatedAt}));
  return {programVersion:PROGRAM_VERSION,controls:{applicationsOpen:state.controls.applicationsOpen,paymentGateEnabled:state.controls.paymentGateEnabled,cohortName:state.controls.cohortName},application:publicApplication(application),supportTickets:tickets,paymentGate:paymentGate(state,application),termsVersions:{membershipTerms:MEMBERSHIP_TERMS_VERSION,privacy:PRIVACY_VERSION,pilotAcknowledgment:PILOT_ACKNOWLEDGMENT_VERSION}};
}
function publicProgramStatus(state=readState()){
  const evidence=evidenceSummary(state);
  const capacity=capacitySummary(state);
  const applicationsOpen=Boolean(state.controls.applicationsOpen);
  const paymentOpen=Boolean(state.controls.paymentGateEnabled && evidence.ready);
  return {
    programVersion:PROGRAM_VERSION,
    applicationsOpen,
    paymentOpen,
    accountPreparationAvailable:true,
    profileClaimPreparationAvailable:true,
    pricingPreviewAvailable:true,
    enrollmentStatus:applicationsOpen?'applications-open':'applications-paused',
    headline:applicationsOpen?'Professional membership applications are open.':'Professional accounts and profile preparation are available; paid membership applications are paused.',
    explanation:applicationsOpen
      ? 'Create a professional account, prepare or claim a profile, and submit an application. Payment remains separate and is available only after approval and all launch requirements are complete.'
      : 'Professionals may create an account and prepare or claim a profile now. A paid membership application cannot be submitted until the controlled professional program is opened.',
    paymentExplanation:paymentOpen
      ? 'Approved applicants may continue to payment through their private dashboard.'
      : 'No membership payment is available or collected while enrollment remains closed.',
    capacity:{submitted:capacity.submitted,approved:capacity.approved},
    updatedAt:state.controls.updatedAt||state.updatedAt||''
  };
}
function ownerQueue(state){
  const applicationQueue=state.applications.filter(item=>['submitted','owner-review','changes-requested','approved-for-payment'].includes(item.status));
  const supportQueue=state.supportTickets.filter(item=>!['resolved','closed'].includes(item.status));
  const blockedEvidence=state.evidence.filter(item=>item.required && item.status!=='evidence-complete');
  return {applicationQueue,supportQueue,blockedEvidence,totalOpen:applicationQueue.length+supportQueue.length+blockedEvidence.length};
}
function ownerView(state=readState()){
  return {programVersion:PROGRAM_VERSION,controls:clone(state.controls),applications:clone(state.applications),supportTickets:clone(state.supportTickets),evidence:clone(state.evidence),evidenceSummary:evidenceSummary(state),capacity:capacitySummary(state),paymentGate:paymentGate(state),queue:ownerQueue(state),termsVersions:{membershipTerms:MEMBERSHIP_TERMS_VERSION,privacy:PRIVACY_VERSION,pilotAcknowledgment:PILOT_ACKNOWLEDGMENT_VERSION}};
}
function exportMarkdown(){
  const data=ownerView();
  const lines=['# Smarter Justice Paid Founding-Professional Pilot Program','','Program version: '+PROGRAM_VERSION,'','## Controls',`- Applications open: ${data.controls.applicationsOpen}`,`- Payment gate enabled: ${data.controls.paymentGateEnabled}`,`- Cohort: ${data.controls.cohortName}`,`- Submitted capacity: ${data.capacity.submitted}/${data.controls.maxSubmittedApplications}`,`- Approved capacity: ${data.capacity.approved}/${data.controls.maxApprovedApplications}`,'','## Readiness evidence',...data.evidence.map(item=>`- **${item.title}** — ${item.status}${item.evidenceUrl?` — ${item.evidenceUrl}`:''}`),'','## Applications',...data.applications.map(item=>`- ${item.id} — ${item.applicantName} — ${item.status} — payment ${item.paymentStatus}`),'','## Open support tickets',...data.supportTickets.filter(item=>!['resolved','closed'].includes(item.status)).map(item=>`- ${item.id} — ${item.subject} — ${item.priority} — ${item.status}`),''];
  return lines.join('\n');
}

module.exports={
  STORE_KEY,PROGRAM_VERSION,MEMBERSHIP_TERMS_VERSION,PRIVACY_VERSION,PILOT_ACKNOWLEDGMENT_VERSION,
  readState,professionalView,publicProgramStatus,ownerView,exportMarkdown,paymentGate,
  saveApplication,submitApplication,withdrawApplication,ownerReviewApplication,markCheckoutStarted,recordPayment,createSupportTicket,ownerUpdateSupportTicket,updateEvidence,updateControls
};
