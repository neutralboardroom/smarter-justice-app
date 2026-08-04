'use strict';
const crypto=require('crypto');
const contract=require('../V14_LIVE_EVIDENCE_CONNECTOR_CONTRACT_V1.7.83.json');
const liveRegister=require('../V14_UNIFIED_LIVE_OPERATIONS_REGISTER_V1.7.83.json');
function clone(v){return JSON.parse(JSON.stringify(v));}
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=stable(value[key]);return out;}return value;}
function digest(value){const copy=clone(value||{});delete copy.receipt_digest;return crypto.createHash('sha256').update(JSON.stringify(stable(copy))).digest('hex');}
function parseTime(value){const ms=Date.parse(String(value||''));return Number.isFinite(ms)?ms:null;}
function ruleFor(id){return (contract.component_rules||[]).find(x=>x.component_id===id)||null;}
function validateReceipt(receipt,options={}){
 const errors=[];const now=parseTime(options.now||new Date().toISOString())||Date.now();
 let bytes=0;try{bytes=Buffer.byteLength(JSON.stringify(receipt||{}));}catch{errors.push('receipt-json');}
 if(bytes>contract.maximum_receipt_bytes)errors.push('receipt-too-large');
 if(receipt?.schema_id!==contract.receipt_schema_id)errors.push('schema');
 if(!/^[A-Z0-9][A-Z0-9._:-]{7,127}$/.test(String(receipt?.receipt_id||'')))errors.push('receipt-id');
 const rule=ruleFor(receipt?.component_id);if(!rule)errors.push('component');
 if(rule&&receipt?.evidence_type!==rule.evidence_type)errors.push('evidence-type');
 if(!contract.accepted_environments.includes(receipt?.environment))errors.push('environment');
 const observed=parseTime(receipt?.observed_at),expires=parseTime(receipt?.expires_at);
 if(observed===null||expires===null||expires<=observed)errors.push('time-window');
 if(observed!==null&&observed>now+5*60*1000)errors.push('future-observation');
 if(expires!==null&&expires<=now)errors.push('expired');
 if(observed!==null&&now-observed>contract.maximum_receipt_age_hours*3600000)errors.push('stale');
 if(receipt?.contains_secrets!==false)errors.push('secret-bearing');
 if(receipt?.write_performed!==false)errors.push('write-bearing');
 if(receipt?.production_activation_performed!==false)errors.push('activation-bearing');
 if(receipt?.owner_go_inferred!==false)errors.push('owner-go-inferred');
 if(receipt?.identities?.source_artifact_sha256!==contract.exact_source_artifact.sha256)errors.push('source-artifact');
 if(receipt?.identities?.release_version!=='1.7.83')errors.push('release-version');
 const checks=Array.isArray(receipt?.checks)?receipt.checks:[];const ids=new Set();
 for(const check of checks){if(!check?.id||ids.has(check.id))errors.push(`check-id:${check?.id||'missing'}`);else ids.add(check.id);if(check?.status!=='PASS')errors.push(`check-status:${check?.id||'missing'}`);if(!String(check?.evidence_ref||'').trim())errors.push(`check-evidence:${check?.id||'missing'}`);if(parseTime(check?.observed_at)===null)errors.push(`check-time:${check?.id||'missing'}`);}
 for(const id of rule?.required_checks||[])if(!ids.has(id))errors.push(`missing-check:${id}`);
 const expected=digest(receipt);if(receipt?.receipt_digest!==expected)errors.push('digest');
 return{ok:errors.length===0,errors,receiptDigest:expected,componentId:receipt?.component_id||null,maximumPromotion:rule?.maximum_promotion||null,previewOnly:true,persisted:false,deploymentAuthorized:false,launchState:'NO_GO'};
}
function previewPromotion(receipt,options={}){const validation=validateReceipt(receipt,options);const current=(liveRegister.dependencies||[]).find(x=>x.id===receipt?.component_id);return{validation,currentState:current?.state||null,proposedState:validation.ok?validation.maximumPromotion:null,applied:false,registerMutated:false,ownerGoInferred:false,deploymentAuthorized:false,launchState:'NO_GO'};}
function ownerView(){return{contract:clone(contract),currentRegisterVersion:liveRegister.release_version,validationState:'READY_FOR_EXACT_NONSECRET_RECEIPT',previewOnly:true,persistenceEnabled:false,registerMutationEnabled:false,deploymentAuthorized:false,launchState:'NO_GO'};}
module.exports={stable,digest,validateReceipt,previewPromotion,ownerView};
