'use strict';
const crypto=require('crypto');
const contract=require('../JOURNEY_HANDOFF_PLANNER_CONTRACT_V1.7.77.json');
function clone(v){return JSON.parse(JSON.stringify(v));}
function text(v){return String(v??'').trim();}
function stable(v){if(Array.isArray(v))return `[${v.map(stable).join(',')}]`;if(v&&typeof v==='object')return `{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;return JSON.stringify(v);}
function hash(v){return crypto.createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');}
function choice(value,allowed,name,errors){const v=text(value);if(!allowed.includes(v))errors.push(`invalid:${name}`);return v;}
function forbiddenMaterial(input){const serialized=JSON.stringify(input||{});const keys=Object.keys(input||{}).map(k=>k.toLowerCase());const prohibited=new Set(contract.prohibited_input_fields);if(keys.some(k=>prohibited.has(k)))return true;return /(?:password|secret|token|private[_ -]?key|bank account|medical record|legal narrative|client confidential)/i.test(serialized);}
function exactKeys(value,allowed,prefix,errors){if(!value||typeof value!=='object'||Array.isArray(value)){errors.push(`${prefix}:object-required`);return;}for(const key of Object.keys(value))if(!allowed.includes(key))errors.push(`${prefix}:unknown-field:${key}`);}
function buildPlan(input={},options={}){
 const errors=[];
 if(forbiddenMaterial(input))errors.push('prohibited-or-sensitive-material');
 const destination=choice(input.destination_product,contract.destinations.map(x=>x.id),'destination_product',errors);
 const matter=choice(input.matter_category,contract.matter_categories,'matter_category',errors);
 const step=choice(input.journey_step,contract.journey_steps,'journey_step',errors);
 const language=choice(input.preferred_language||'not-specified',contract.preferred_languages,'preferred_language',errors);
 const access=choice(input.access_preference||'not-specified',contract.access_preferences,'access_preference',errors);
 if(input.explicit_user_choice!==true)errors.push('explicit-user-choice-required');
 const now=options.now instanceof Date?options.now:new Date(options.now||Date.now());
 if(!Number.isFinite(now.getTime()))errors.push('invalid-created-at');
 if(errors.length)return{ok:false,errors,plan:null};
 const created=now.toISOString();const expires=new Date(now.getTime()+contract.maximum_expiry_minutes*60000).toISOString();
 const selections={matter_category:matter,journey_step:step,preferred_language:language,access_preference:access};
 const binding={source_product:'smarter-justice-central',destination_product:destination,selections,created_at:created,expires_at:expires};
 const digest=hash(binding);const plan={schema_id:'SJP-DEVICE-ONLY-JOURNEY-HANDOFF-PLAN-V1',plan_id:`sj-handoff-${digest.slice(0,16)}`,source_product:'smarter-justice-central',destination_product:destination,purpose:'Continue only the user-selected preparation step in a destination product.',selections,data_categories:clone(contract.allowed_data_categories),explicit_user_choice:true,consent_receipt_id:`sj-consent-${digest.slice(16,32)}`,created_at:created,expires_at:expires,automatic_sync:false,server_transmission:false,server_storage:false};
 plan.integrity_sha256=hash(plan);return{ok:true,errors:[],plan};
}
function validatePlan(plan={}){
 const errors=[];
 exactKeys(plan,contract.allowed_plan_fields,'plan',errors);
 exactKeys(plan?.selections,contract.allowed_selection_fields,'selections',errors);
 if(!contract.supported_plan_schemas.includes(plan.schema_id))errors.push('schema');
 const destinationIds=contract.destinations.map(x=>x.id);if(!destinationIds.includes(plan.destination_product))errors.push('destination');
 if(plan.source_product!=='smarter-justice-central')errors.push('source');if(plan.explicit_user_choice!==true)errors.push('explicit-user-choice');
 if(plan.automatic_sync!==false)errors.push('automatic-sync');if(plan.server_transmission!==false)errors.push('server-transmission');if(plan.server_storage!==false)errors.push('server-storage');
 if(!plan.selections||!contract.matter_categories.includes(plan.selections.matter_category))errors.push('matter-category');
 if(!plan.selections||!contract.journey_steps.includes(plan.selections.journey_step))errors.push('journey-step');
 if(!plan.selections||!contract.preferred_languages.includes(plan.selections.preferred_language))errors.push('preferred-language');
 if(!plan.selections||!contract.access_preferences.includes(plan.selections.access_preference))errors.push('access-preference');
 if(JSON.stringify(plan).match(/(?:password|secret|token|private[_ -]?key|bank account|medical record|legal narrative|client confidential)/i))errors.push('sensitive-material');
 const created=Date.parse(text(plan.created_at)),expires=Date.parse(text(plan.expires_at));if(!Number.isFinite(created))errors.push('created-at');if(!Number.isFinite(expires))errors.push('expires-at');if(Number.isFinite(created)&&Number.isFinite(expires)&&(expires<=created||expires-created>contract.maximum_expiry_minutes*60000))errors.push('expiry-window');
 const copy=clone(plan);const claimed=copy.integrity_sha256;delete copy.integrity_sha256;if(!/^[a-f0-9]{64}$/.test(text(claimed))||hash(copy)!==claimed)errors.push('integrity');
 return{ok:errors.length===0,errors,runtimeTransferEnabled:false,serverStorageEnabled:false,localPersistentStorageEnabled:false};
}
function compatibilityFor(destination){return contract.destination_compatibility.find(x=>x.destination_product===destination)||null;}
function fixedNextStep(plan,compatibility){
 const names=Object.fromEntries(contract.destinations.map(x=>[x.id,x.name]));
 const stepText={
  'understand-options':'Review the destination product’s general educational options.',
  'prepare-records':'Use the destination product’s records checklist without adding documents to this pack.',
  'prepare-questions':'Use the destination product to organize questions for a qualified professional.',
  'review-official-sources':'Review dated official sources linked by the destination product.',
  'compare-help-paths':'Compare available self-help, nonprofit, government, and professional paths.',
  'contact-a-professional':'Open the destination product separately and choose whether to contact a professional.'
 };
 return{destination_name:names[plan.destination_product]||plan.destination_product,journey_step:plan.selections.journey_step,next_step:stepText[plan.selections.journey_step]||'Open the destination product separately.',central_compatibility_status:compatibility?.status||'UNKNOWN',portal_import_accepted:false,automatic_destination_open:false,legal_advice:false};
}
function inspectPlan(raw,options={}){
 const errors=[];let plan=raw;
 if(typeof raw==='string'){
  if(Buffer.byteLength(raw,'utf8')>contract.maximum_import_bytes)return{ok:false,state:'INVALID_LOCAL_PACK',errors:['import-too-large'],summary:null,plan:null,serverTransmission:false,serverStorage:false,portalImportAccepted:false};
  try{plan=JSON.parse(raw);}catch{return{ok:false,state:'INVALID_LOCAL_PACK',errors:['invalid-json'],summary:null,plan:null,serverTransmission:false,serverStorage:false,portalImportAccepted:false};}
 }
 if(!plan||typeof plan!=='object'||Array.isArray(plan))return{ok:false,state:'INVALID_LOCAL_PACK',errors:['plan-object-required'],summary:null,plan:null,serverTransmission:false,serverStorage:false,portalImportAccepted:false};
 const validation=validatePlan(plan);errors.push(...validation.errors);
 if(errors.length)return{ok:false,state:'INVALID_LOCAL_PACK',errors:[...new Set(errors)],summary:null,plan:null,serverTransmission:false,serverStorage:false,portalImportAccepted:false};
 const now=options.now instanceof Date?options.now:new Date(options.now||Date.now());if(!Number.isFinite(now.getTime()))return{ok:false,state:'INVALID_LOCAL_PACK',errors:['invalid-inspection-time'],summary:null,plan:null,serverTransmission:false,serverStorage:false,portalImportAccepted:false};
 const created=Date.parse(plan.created_at),expires=Date.parse(plan.expires_at);
 if(created>now.getTime()+5*60000)return{ok:false,state:'INVALID_LOCAL_PACK',errors:['created-in-future'],summary:null,plan:null,serverTransmission:false,serverStorage:false,portalImportAccepted:false};
 const compatibility=compatibilityFor(plan.destination_product);
 if(now.getTime()>=expires)return{ok:false,state:'EXPIRED_LOCAL_PACK',errors:['expired'],summary:fixedNextStep(plan,compatibility),plan:null,serverTransmission:false,serverStorage:false,portalImportAccepted:false};
 if(!compatibility||!compatibility.centrally_supported_matter_categories.includes(plan.selections.matter_category)||!compatibility.centrally_supported_journey_steps.includes(plan.selections.journey_step))return{ok:false,state:'DESTINATION_CATEGORY_MISMATCH',errors:['destination-category-mismatch'],summary:fixedNextStep(plan,compatibility),plan:null,serverTransmission:false,serverStorage:false,portalImportAccepted:false};
 return{ok:true,state:'VALID_LOCAL_PACK',errors:[],summary:{...fixedNextStep(plan,compatibility),matter_category:plan.selections.matter_category,preferred_language:plan.selections.preferred_language,access_preference:plan.selections.access_preference,expires_at:plan.expires_at,minutes_remaining:Math.max(0,Math.ceil((expires-now.getTime())/60000))},plan:clone(plan),serverTransmission:false,serverStorage:false,portalImportAccepted:false};
}
function ownerView(){const built=buildPlan({destination_product:'divorce-law-aid',matter_category:'family',journey_step:'prepare-questions',preferred_language:'English',access_preference:'plain-language',explicit_user_choice:true},{now:'2026-08-03T11:20:00-04:00'});return{contract:clone(contract),validation:validatePlan(built.plan),inspection:inspectPlan(built.plan,{now:'2026-08-03T11:30:00-04:00'}),publicPage:'/journey-handoff-planner.html',runtimeTransferEnabled:false,serverStorageEnabled:false,localPersistentStorageEnabled:false,portalImportAccepted:false,deploymentAuthorized:false,productionRequestSent:false};}
module.exports={stable,hash,buildPlan,validatePlan,inspectPlan,compatibilityFor,fixedNextStep,ownerView};
