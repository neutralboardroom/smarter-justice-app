const store = require('./store');
const revenueAccessModel = require('./revenueAccessModel');

const STORE_KEY = 'publicPaidServices.json';
const STANDARD_VERSION = '1.0.0';
const CONTROL_STATUSES = ['paused','planning','pilot-ready','active','suspended','retired'];
const ORDER_STATUSES = ['checkout requested','checkout created','paid — queued','assigned','in review','changes requested','completed','delivered','cancelled','refunded','payment failed','checkout expired'];
const POLICY_STATUSES = ['draft','review','approved','superseded'];
const REQUIRED_ACKNOWLEDGMENTS = ['scopeUnderstood','notProfessionalAdvice','feesSeparate','refundPolicyAccepted','electronicCommunicationsAccepted'];

function clean(value,max=4000){return String(value==null?'':value).trim().slice(0,max);}
function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
function oneOf(value,allowed,fallback){return allowed.includes(value)?value:fallback;}
function now(){return store.now();}
function initialState(){return {
  schemaVersion:'1.0.0', standardVersion:STANDARD_VERSION,
  controls:{
    status:'paused', ownerApproved:false, liveChargesAllowed:false,
    termsVersion:'public-paid-services-1.0.0', refundPolicyStatus:'draft', supportOperationsStatus:'draft',
    requireSensitiveTrafficApproval:true, requireAuthenticatedEmail:true,
    notes:'Public paid services remain fail-closed until owner approval, secure persistence, email, Stripe, support, refund, and operating evidence are complete.'
  },
  orders:[], updatedAt:'', stateRevision:0
};}
function normalize(raw){const base=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};const defaults=initialState();return {...defaults,...base,controls:{...defaults.controls,...(base.controls||{})},orders:Array.isArray(base.orders)?base.orders:[],stateRevision:Number(base.stateRevision)||0};}
function readState(){return normalize(store.readJson(STORE_KEY,initialState()));}
function stamp(state){state.schemaVersion='1.0.0';state.standardVersion=STANDARD_VERSION;state.updatedAt=now();state.stateRevision=(Number(state.stateRevision)||0)+1;return state;}
async function mutate(mutator,eventFactory){const tx=await store.mutateJson(STORE_KEY,initialState(),async raw=>{const state=normalize(raw);const result=await mutator(state);return {value:stamp(state),result};},{event:(result,next)=>eventFactory?eventFactory(result,next):null});return tx.result;}
function serviceById(id){return revenueAccessModel.readState().humanReviewServices.find(x=>x.id===clean(id,160)||x.checkoutCode===clean(id,160))||null;}
function publicService(service){if(!service)return null;return {id:service.id,checkoutCode:service.checkoutCode||'',name:service.name,status:service.status,priceCents:service.priceCents,activeForBilling:Boolean(service.activeForBilling),scope:service.scope,turnaround:service.turnaround||'',revisionPolicy:service.revisionPolicy||'',termsVersion:service.termsVersion||'public-paid-services-1.0.0'};}
function readinessReasons(service,env={}){
  const state=readState(); const reasons=[];
  if(!service) reasons.push('That Human Review Specialist service is not in the approved catalog.');
  if(!['pilot-ready','active'].includes(state.controls.status)) reasons.push('Public paid-service operations are not pilot-ready.');
  if(!state.controls.ownerApproved) reasons.push('Owner approval for public paid services is incomplete.');
  if(!state.controls.liveChargesAllowed) reasons.push('The public live-charge control is paused.');
  if(state.controls.refundPolicyStatus!=='approved') reasons.push('The public refund policy is not approved.');
  if(state.controls.supportOperationsStatus!=='approved') reasons.push('Paid-service support operations are not approved.');
  if(!env.publicPaidServicesEnabled) reasons.push('The production public-paid-services kill switch is off.');
  if(state.controls.requireSensitiveTrafficApproval && !env.sensitiveTrafficApproved) reasons.push('Sensitive paid-traffic storage and owner-security approval is incomplete.');
  if(!env.stripeConfigured) reasons.push('Stripe Checkout is not configured.');
  if(!env.webhookConfigured) reasons.push('The signed Stripe webhook is not configured.');
  if(!env.smtpConfigured) reasons.push('Authenticated service email is not configured.');
  if(!env.ownerEmailConfigured) reasons.push('The owner alert recipient is not configured.');
  if(service){
    if(!['pilot-ready','active'].includes(service.status)) reasons.push('This service is not approved for sale.');
    if(!service.activeForBilling) reasons.push('Billing is not active for this service.');
    if(!Number.isInteger(Number(service.priceCents))||Number(service.priceCents)<=0) reasons.push('The public price is not approved.');
    if(!env.priceConfigured) reasons.push('The matching Stripe Price ID is not configured.');
  }
  return reasons;
}
function availability(serviceId,env={}){const service=serviceById(serviceId);const reasons=readinessReasons(service,env);return {available:reasons.length===0,reasons,service:publicService(service),controls:clone(readState().controls)};}
function publicCatalog(envFactory){const state=revenueAccessModel.readState();return {standardVersion:STANDARD_VERSION,controls:{status:readState().controls.status,termsVersion:readState().controls.termsVersion},services:state.humanReviewServices.map(service=>{const env=typeof envFactory==='function'?envFactory(service):envFactory||{};const gate=availability(service.id,env);return {...publicService(service),available:gate.available,availabilityMessage:gate.available?'Available for secure checkout.':gate.reasons[0]||'Not available yet.'};}),disclosures:['Human Review Specialists do not provide legal, tax, accounting, insurance, or other licensed professional advice.','Professional services, government or court fees, and third-party costs are separate.','No filing acceptance, approval, benefit, refund, settlement, timing, or outcome is guaranteed.']};}
function validateAcknowledgments(input={}){const missing=REQUIRED_ACKNOWLEDGMENTS.filter(key=>input[key]!==true);return {ok:missing.length===0,missing};}
async function createOrder(input={},env={}){
  const service=serviceById(input.serviceId||input.serviceType); const gate=availability(service?.id||'',env);
  if(!gate.available)return {error:'This paid service is not open for checkout.',availability:gate};
  const acknowledgments=input.acknowledgments||{}; const ack=validateAcknowledgments(acknowledgments);
  if(!ack.ok)return {error:'Accept the paid-service scope, fee separation, refund policy, and electronic communication terms before checkout.',missingAcknowledgments:ack.missing};
  const caseId=clean(input.caseId,180); const publicToken=clean(input.publicToken,240); const email=clean(input.email,240).toLowerCase();
  if(!caseId||!publicToken)return {error:'Valid saved work is required before paid review checkout.'};
  if(readState().controls.requireAuthenticatedEmail&&(!email||!/@/.test(email)))return {error:'A valid email address is required for paid-service confirmations and support.'};
  return mutate(state=>{
    const existing=state.orders.find(x=>x.caseId===caseId&&x.serviceId===service.id&&!['cancelled','refunded','payment failed','checkout expired','delivered'].includes(x.status));
    if(existing)return {order:clone(existing),duplicate:true};
    const order={id:store.uid('publicorder',10),caseId,publicTokenHash:require('crypto').createHash('sha256').update(publicToken).digest('hex'),email,serviceId:service.id,serviceName:service.name,serviceScope:service.scope,priceCents:Number(service.priceCents),termsVersion:state.controls.termsVersion,acknowledgments:Object.fromEntries(REQUIRED_ACKNOWLEDGMENTS.map(k=>[k,true])),status:'checkout requested',paymentStatus:'not started',stripeSessionId:'',stripePaymentIntentId:'',assignedTo:'',dueAt:'',userFacingStatus:'Checkout requested',ownerNotes:'',staffNotes:'',deliveryReference:'',refundReference:'',createdAt:now(),updatedAt:now(),paidAt:'',completedAt:'',deliveredAt:'',refundedAt:'',history:[{at:now(),status:'checkout requested',actor:'public-user',note:'Paid-service terms accepted and checkout requested.'}]};
    state.orders.unshift(order);state.orders=state.orders.slice(0,3000);return {order:clone(order),duplicate:false};
  },result=>result?.order?{eventType:'public_paid_service_order_created',action:'public_paid_service_order_created',caseId:result.order.caseId,orderId:result.order.id,serviceId:result.order.serviceId}:null);
}
async function markCheckoutCreated(orderId,session={}){return mutate(state=>{const order=state.orders.find(x=>x.id===clean(orderId,220));if(!order)return {error:'Paid-service order not found.'};order.status='checkout created';order.paymentStatus='checkout open';order.stripeSessionId=clean(session.id,240);order.updatedAt=now();order.history.unshift({at:now(),status:order.status,actor:'system',note:'Stripe Checkout session created.'});return {order:clone(order)};},result=>result?.order?{eventType:'public_paid_service_checkout_created',action:'public_paid_service_checkout_created',caseId:result.order.caseId,orderId:result.order.id}:null);}
async function applyCheckoutSession(session,eventType='checkout.session.completed'){
  const orderId=clean(session?.metadata?.orderId,220);if(!orderId)return {error:'Stripe session does not identify a public paid-service order.'};
  return mutate(state=>{const order=state.orders.find(x=>x.id===orderId);if(!order)return {error:'Paid-service order not found.'};
    const paid=(eventType==='checkout.session.completed'||session.status==='complete')&&['paid','no_payment_required'].includes(session.payment_status);
    if(paid){order.status='paid — queued';order.paymentStatus='paid';order.paidAt=order.paidAt||now();order.userFacingStatus='Payment received — queued for Human Review Specialist assignment';}
    else if(eventType==='checkout.session.expired'){order.status='checkout expired';order.paymentStatus='expired';order.userFacingStatus='Checkout expired — no payment recorded';}
    else if(/failed|async_payment_failed/.test(eventType)){order.status='payment failed';order.paymentStatus='failed';order.userFacingStatus='Payment was not completed';}
    order.stripeSessionId=clean(session.id,240)||order.stripeSessionId;order.stripePaymentIntentId=clean(typeof session.payment_intent==='string'?session.payment_intent:'',240)||order.stripePaymentIntentId;order.updatedAt=now();
    order.history.unshift({at:now(),status:order.status,actor:'stripe',note:`Stripe event ${clean(eventType,180)} applied.`});return {order:clone(order),paid};
  },result=>result?.order?{eventType:'public_paid_service_payment_applied',action:'public_paid_service_payment_applied',caseId:result.order.caseId,orderId:result.order.id,status:result.order.status}:null);
}
async function updateControls(input={}){return mutate(state=>{state.controls.status=oneOf(input.status,CONTROL_STATUSES,state.controls.status);for(const key of ['ownerApproved','liveChargesAllowed','requireSensitiveTrafficApproval','requireAuthenticatedEmail'])if(Object.prototype.hasOwnProperty.call(input,key))state.controls[key]=Boolean(input[key]);state.controls.refundPolicyStatus=oneOf(input.refundPolicyStatus,POLICY_STATUSES,state.controls.refundPolicyStatus);state.controls.supportOperationsStatus=oneOf(input.supportOperationsStatus,POLICY_STATUSES,state.controls.supportOperationsStatus);if(Object.prototype.hasOwnProperty.call(input,'termsVersion'))state.controls.termsVersion=clean(input.termsVersion,120);if(Object.prototype.hasOwnProperty.call(input,'notes'))state.controls.notes=clean(input.notes,5000);return {controls:clone(state.controls)};},result=>result?.controls?{eventType:'public_paid_service_controls_updated',action:'public_paid_service_controls_updated',status:result.controls.status}:null);}
async function updateOrder(id,input={}){return mutate(state=>{const order=state.orders.find(x=>x.id===clean(id,220));if(!order)return {error:'Paid-service order not found.'};const old=order.status;order.status=oneOf(input.status,ORDER_STATUSES,order.status);for(const key of ['assignedTo','dueAt','userFacingStatus','ownerNotes','staffNotes','deliveryReference','refundReference'])if(Object.prototype.hasOwnProperty.call(input,key))order[key]=clean(input[key],key.includes('Notes')?5000:500);if(order.status==='completed'&&!order.completedAt)order.completedAt=now();if(order.status==='delivered'&&!order.deliveredAt)order.deliveredAt=now();if(order.status==='refunded'){order.paymentStatus='refunded';order.refundedAt=order.refundedAt||now();}order.updatedAt=now();if(old!==order.status)order.history.unshift({at:now(),status:order.status,actor:'owner-or-staff',note:clean(input.historyNote,1000)||'Order status updated.'});return {order:clone(order)};},result=>result?.order?{eventType:'public_paid_service_order_updated',action:'public_paid_service_order_updated',caseId:result.order.caseId,orderId:result.order.id,status:result.order.status}:null);}
function findOrder(id){return clone(readState().orders.find(x=>x.id===id)||null);}
function ordersForCase(caseId){return clone(readState().orders.filter(x=>x.caseId===caseId));}
function summary(state=readState()){return {orders:state.orders.length,paidQueued:state.orders.filter(x=>x.status==='paid — queued').length,inReview:state.orders.filter(x=>['assigned','in review','changes requested'].includes(x.status)).length,completed:state.orders.filter(x=>['completed','delivered'].includes(x.status)).length,refunded:state.orders.filter(x=>x.status==='refunded').length,openValueCents:state.orders.filter(x=>['paid — queued','assigned','in review','changes requested','completed'].includes(x.status)).reduce((sum,x)=>sum+Number(x.priceCents||0),0)};}
function ownerView(){const state=readState();return {...clone(state),summary:summary(state),enums:{controlStatuses:CONTROL_STATUSES,orderStatuses:ORDER_STATUSES,policyStatuses:POLICY_STATUSES},catalog:revenueAccessModel.readState().humanReviewServices.map(publicService)};}
function publicOrdersForCase(caseId){return ordersForCase(caseId).map(x=>({id:x.id,serviceId:x.serviceId,serviceName:x.serviceName,priceCents:x.priceCents,status:x.status,paymentStatus:x.paymentStatus,userFacingStatus:x.userFacingStatus,createdAt:x.createdAt,paidAt:x.paidAt,completedAt:x.completedAt,deliveredAt:x.deliveredAt}));}
function exportMarkdown(){const data=ownerView();return ['# Public Paid-Service Operations','',`Standard version: ${STANDARD_VERSION}`,`Status: ${data.controls.status}`,`Live charges allowed: ${data.controls.liveChargesAllowed?'yes':'no'}`,'',`- Orders: ${data.summary.orders}`,`- Paid and queued: ${data.summary.paidQueued}`,`- In review: ${data.summary.inReview}`,`- Completed/delivered: ${data.summary.completed}`,`- Refunded: ${data.summary.refunded}`,'','## Orders',...data.orders.map(x=>`- ${x.id} — ${x.serviceName} — ${x.status} — $${(Number(x.priceCents||0)/100).toFixed(2)}`),''].join('\n');}
module.exports={STORE_KEY,STANDARD_VERSION,CONTROL_STATUSES,ORDER_STATUSES,POLICY_STATUSES,REQUIRED_ACKNOWLEDGMENTS,readState,publicCatalog,availability,createOrder,markCheckoutCreated,applyCheckoutSession,updateControls,updateOrder,findOrder,ordersForCase,publicOrdersForCase,summary,ownerView,exportMarkdown};
