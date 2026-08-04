const store = require('./store');
const { FOUNDING_LAUNCH_PORTALS } = require('../data/foundingLaunchPortals');
const {
  SHARED_REVENUE_ACCESS_STANDARD_VERSION,
  CORE_PRINCIPLES,
  PUBLIC_ACCESS_PLANS,
  HUMAN_REVIEW_SERVICE_CATEGORIES,
  PROFESSIONAL_REVENUE_MODEL,
  FEE_SEPARATION
} = require('../data/sharedRevenueAccessModel');

const STORE_KEY = 'revenueAccessModel.json';
const PLAN_STATUSES = ['approved foundation','future option — not active','planned — not for sale','pilot-ready','active','paused','retired'];
const ADOPTION_STATUSES = ['not reviewed','adopted','adapted','planned','deferred','not applicable'];

function clean(value,max=4000){return String(value==null?'':value).trim().slice(0,max);}
function oneOf(value,allowed,fallback){return allowed.includes(value)?value:fallback;}
function list(value,max=100,maxLength=500){const src=Array.isArray(value)?value:String(value||'').split(/\r?\n|,/);return [...new Set(src.map(x=>clean(x,maxLength)).filter(Boolean))].slice(0,max);}
function clone(value){return JSON.parse(JSON.stringify(value));}
function initialState(){
  return {
    schemaVersion:'1.0.0',
    standardVersion:SHARED_REVENUE_ACCESS_STANDARD_VERSION,
    publicPlans:clone(PUBLIC_ACCESS_PLANS),
    humanReviewServices:clone(HUMAN_REVIEW_SERVICE_CATEGORIES),
    professionalModel:clone(PROFESSIONAL_REVENUE_MODEL),
    portalAdoptions:(FOUNDING_LAUNCH_PORTALS||[]).map(portal=>({
      portalSlug:portal.slug,
      portfolioSlug:portal.portfolioSlug || '',
      portalName:portal.name,
      adoptionStatus:'planned',
      freeAiStartingHelp:true,
      publicMembershipStatus:'not active',
      humanReviewStatus:'not active',
      professionalMembershipStatus:'central Smarter Justice pilot foundation',
      professionalServiceBoundary:'separate professional engagement',
      notes:'Portal-specific pricing, scope, staffing, and legal boundaries require separate approval.',
      updatedAt:''
    })),
    ownerNotes:'',
    updatedAt:'',
    stateRevision:0
  };
}
function normalize(raw){
  const base=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const defaults=initialState();
  const planById=new Map((Array.isArray(base.publicPlans)?base.publicPlans:[]).map(x=>[x.id,x]));
  const reviewById=new Map((Array.isArray(base.humanReviewServices)?base.humanReviewServices:[]).map(x=>[x.id,x]));
  const adoptionRows=Array.isArray(base.portalAdoptions)?base.portalAdoptions:[];
  const adoptionBySlug=new Map();
  for(const row of adoptionRows){
    if(row.portalSlug) adoptionBySlug.set(row.portalSlug,row);
    if(row.portfolioSlug) adoptionBySlug.set(row.portfolioSlug,row);
  }
  return {
    ...defaults,...base,
    standardVersion:SHARED_REVENUE_ACCESS_STANDARD_VERSION,
    publicPlans:defaults.publicPlans.map(item=>({...item,...(planById.get(item.id)||{})})),
    humanReviewServices:defaults.humanReviewServices.map(item=>({...item,...(reviewById.get(item.id)||{})})),
    professionalModel:{...defaults.professionalModel,...(base.professionalModel||{})},
    portalAdoptions:defaults.portalAdoptions.map(item=>({...item,...(adoptionBySlug.get(item.portalSlug)||adoptionBySlug.get(item.portfolioSlug)||{})})),
    stateRevision:Number.isFinite(Number(base.stateRevision))?Number(base.stateRevision):0
  };
}
function readState(){return normalize(store.readJson(STORE_KEY,initialState()));}
function stamp(state){state.schemaVersion='1.0.0';state.standardVersion=SHARED_REVENUE_ACCESS_STANDARD_VERSION;state.updatedAt=store.now();state.stateRevision=(Number(state.stateRevision)||0)+1;return state;}
async function mutate(mutator,eventFactory){const tx=await store.mutateJson(STORE_KEY,initialState(),async raw=>{const state=normalize(raw);const result=await mutator(state);return {value:stamp(state),result};},{event:(result,next)=>eventFactory?eventFactory(result,next):null});return tx.result;}
function publicView(){
  const state=readState();
  return {
    standardVersion:state.standardVersion,
    principles:clone(CORE_PRINCIPLES),
    publicPlans:state.publicPlans.map(({id,name,status,monthlyPriceCents,activeForBilling,audience,includes,excludes,fairUse})=>({id,name,status,monthlyPriceCents,activeForBilling:Boolean(activeForBilling),audience,includes,excludes,fairUse})),
    humanReviewServices:state.humanReviewServices.map(({id,name,status,priceCents,scope})=>({id,name,status,priceCents,scope})),
    professionalModel:clone(state.professionalModel),
    feeSeparation:clone(FEE_SEPARATION),
    disclosures:[
      'Meaningful free AI-guided help remains available.',
      'Optional public plans are not active unless a page and checkout explicitly say otherwise.',
      'Human review and independently engaged professional services are separate from AI platform access.',
      'No plan guarantees a filing, approval, benefit, tax result, settlement, client, matter, or professional outcome.'
    ]
  };
}
function ownerView(){const state=readState();return {...state,principles:clone(CORE_PRINCIPLES),feeSeparation:clone(FEE_SEPARATION),enums:{planStatuses:PLAN_STATUSES,adoptionStatuses:ADOPTION_STATUSES},summary:{publicPlans:state.publicPlans.length,activePublicPlans:state.publicPlans.filter(x=>x.activeForBilling).length,humanReviewServices:state.humanReviewServices.length,activeHumanReviewServices:state.humanReviewServices.filter(x=>x.status==='active').length,portalAdoptions:state.portalAdoptions.length,adoptedPortals:state.portalAdoptions.filter(x=>['adopted','adapted'].includes(x.adoptionStatus)).length}};}
async function updatePublicPlan(id,input={}){return mutate(state=>{const plan=state.publicPlans.find(x=>x.id===clean(id,120));if(!plan)return {error:'Public plan not found.'};if(Object.prototype.hasOwnProperty.call(input,'name'))plan.name=clean(input.name,240);plan.status=oneOf(input.status,PLAN_STATUSES,plan.status);if(Object.prototype.hasOwnProperty.call(input,'monthlyPriceCents'))plan.monthlyPriceCents=Math.max(0,Math.min(100000,Number(input.monthlyPriceCents)||0));if(Object.prototype.hasOwnProperty.call(input,'activeForBilling'))plan.activeForBilling=Boolean(input.activeForBilling);if(Object.prototype.hasOwnProperty.call(input,'includes'))plan.includes=list(input.includes,100,500);if(Object.prototype.hasOwnProperty.call(input,'excludes'))plan.excludes=list(input.excludes,100,500);if(Object.prototype.hasOwnProperty.call(input,'fairUse'))plan.fairUse=clean(input.fairUse,3000);if(plan.activeForBilling&&plan.status!=='active')return {error:'A public plan cannot be billable unless its status is active.'};return {plan:clone(plan)};},result=>result?.plan?{eventType:'revenue_public_plan_updated',action:'revenue_public_plan_updated',planId:result.plan.id,status:result.plan.status}:null);}
async function updateHumanReviewService(id,input={}){return mutate(state=>{const service=state.humanReviewServices.find(x=>x.id===clean(id,120));if(!service)return {error:'Human review service not found.'};if(Object.prototype.hasOwnProperty.call(input,'name'))service.name=clean(input.name,240);service.status=oneOf(input.status,PLAN_STATUSES,service.status);if(Object.prototype.hasOwnProperty.call(input,'priceCents'))service.priceCents=input.priceCents===''||input.priceCents==null?null:Math.max(0,Math.min(10000000,Number(input.priceCents)||0));if(Object.prototype.hasOwnProperty.call(input,'activeForBilling'))service.activeForBilling=Boolean(input.activeForBilling);for(const key of ['scope','turnaround','revisionPolicy','termsVersion'])if(Object.prototype.hasOwnProperty.call(input,key))service[key]=clean(input[key],key==='scope'?5000:1000);if(service.activeForBilling&&!['pilot-ready','active'].includes(service.status))return {error:'A Human Review Specialist service cannot be billable unless its status is pilot-ready or active.'};if((service.activeForBilling||service.status==='active')&&(!Number.isInteger(Number(service.priceCents))||Number(service.priceCents)<=0))return {error:'A billable Human Review Specialist service requires an approved positive price.'};if(service.activeForBilling&&(!service.scope||!service.turnaround||!service.revisionPolicy||!service.termsVersion))return {error:'A billable Human Review Specialist service requires scope, turnaround, revision, and terms-version details.'};return {service:clone(service)};},result=>result?.service?{eventType:'human_review_service_updated',action:'human_review_service_updated',serviceId:result.service.id,status:result.service.status}:null);}
async function updatePortalAdoption(slug,input={}){return mutate(state=>{const key=clean(slug,180);const row=state.portalAdoptions.find(x=>x.portalSlug===key||x.portfolioSlug===key);if(!row)return {error:'Portal adoption record not found.'};row.adoptionStatus=oneOf(input.adoptionStatus,ADOPTION_STATUSES,row.adoptionStatus);for(const key of ['freeAiStartingHelp'])if(Object.prototype.hasOwnProperty.call(input,key))row[key]=Boolean(input[key]);for(const key of ['publicMembershipStatus','humanReviewStatus','professionalMembershipStatus','professionalServiceBoundary','notes'])if(Object.prototype.hasOwnProperty.call(input,key))row[key]=clean(input[key],key==='notes'?5000:500);row.updatedAt=store.now();return {adoption:clone(row)};},result=>result?.adoption?{eventType:'portal_revenue_adoption_updated',action:'portal_revenue_adoption_updated',portalSlug:result.adoption.portalSlug,status:result.adoption.adoptionStatus}:null);}
function exportMarkdown(){const data=ownerView();const lines=[`# Smarter Justice Shared Revenue and Access Model`,``,`Standard version: ${data.standardVersion}`,``,`## Principles`,...data.principles.map(x=>`- ${x}`),``,`## Public access plans`,...data.publicPlans.map(x=>`- **${x.name}** — ${x.status}; ${x.monthlyPriceCents===0?'free':`$${(x.monthlyPriceCents/100).toFixed(2)}/month`}; billing active: ${x.activeForBilling?'yes':'no'}`),``,`## Human Review Specialist services`,...data.humanReviewServices.map(x=>`- **${x.name}** — ${x.status}; price: ${x.priceCents==null?'not approved':`$${(x.priceCents/100).toFixed(2)}`}`),``,`## Portal adoption`,...data.portalAdoptions.map(x=>`- **${x.portalName}** — ${x.adoptionStatus}; free AI: ${x.freeAiStartingHelp?'yes':'no'}; public membership: ${x.publicMembershipStatus}; human review: ${x.humanReviewStatus}; professional membership: ${x.professionalMembershipStatus}`),``,`## Fee separation`,...data.feeSeparation.map(x=>`- **${x.label}:** ${x.rule}`)];return lines.join('\n');}
module.exports={STORE_KEY,SHARED_REVENUE_ACCESS_STANDARD_VERSION,PLAN_STATUSES,ADOPTION_STATUSES,readState,publicView,ownerView,updatePublicPlan,updateHumanReviewService,updatePortalAdoption,exportMarkdown};
