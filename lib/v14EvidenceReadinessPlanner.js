'use strict';
const crypto=require('crypto');
const contract=require('../V14_EVIDENCE_READINESS_PLANNER_CONTRACT_V1.7.83.json');
const connectorContract=require('../V14_LIVE_EVIDENCE_CONNECTOR_CONTRACT_V1.7.83.json');
const workspace=require('./v14EvidenceBatchWorkspace');
function clone(v){return JSON.parse(JSON.stringify(v));}
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=stable(value[key]);return out;}return value;}
function hash(value){return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');}
function plan(batch,options={}){
 const preview=workspace.previewTransaction(batch,options);const receipts=Array.isArray(batch?.receipts)?batch.receipts:[];
 const byComponent=new Map(receipts.map(x=>[String(x?.component_id||''),x]));
 const validationByComponent=new Map((preview.validation.validations||[]).map((v,i)=>[String(receipts[i]?.component_id||''),v]));
 const rules=new Map((connectorContract.component_rules||[]).map(x=>[x.component_id,x]));
 const components=contract.priority_order.map((componentId,index)=>{
  const receipt=byComponent.get(componentId)||null;const validation=validationByComponent.get(componentId)||null;const dependencies=contract.dependencies[componentId]||[];
  const missingDependencies=dependencies.filter(id=>{const v=validationByComponent.get(id);return !v?.ok;});
  const status=!receipt?'MISSING_RECEIPT':validation?.ok?'VALID_RECEIPT':'INVALID_RECEIPT';
  const rule=rules.get(componentId)||{};
  return{component_id:componentId,priority:index+1,status,receipt_id:receipt?.receipt_id||null,receipt_digest:receipt?.receipt_digest||null,proposed_state:validation?.ok?validation.maximumPromotion:null,validation_errors:validation?.errors||[],dependencies,missing_dependencies:missingDependencies,required_checks:rule.required_checks||[],owner_action:contract.owner_actions[componentId],promotion_preview_only:true};
 });
 const validCount=components.filter(x=>x.status==='VALID_RECEIPT').length;
 const invalidCount=components.filter(x=>x.status==='INVALID_RECEIPT').length;
 const gaps=components.filter(x=>x.status!=='VALID_RECEIPT').map(x=>({component_id:x.component_id,status:x.status,missing_dependencies:x.missing_dependencies,validation_errors:x.validation_errors,owner_action:x.owner_action}));
 const firstAction=gaps[0]?.owner_action||'Review the complete valid evidence set; deployment and production remain separately authorized.';
 const payload={schema_id:'SJP-V14-EVIDENCE-READINESS-PLAN-2026-08-03-V1',release_version:contract.release_version,batch_id:batch?.batch_id||null,batch_digest:preview.validation.batchDigest||null,batch_valid:preview.validation.ok,component_count:components.length,valid_receipt_count:validCount,invalid_receipt_count:invalidCount,missing_receipt_count:components.length-validCount-invalidCount,evidence_coverage_percent:Math.floor((validCount/components.length)*100),components,gaps,one_exact_owner_action:firstAction,all_required_evidence_present:validCount===components.length&&preview.validation.ok,apply_supported:false,applied:false,persisted:false,register_mutated:false,external_calls:false,owner_go_inferred:false,deployment_authorized:false,launch_state:'NO_GO'};
 payload.plan_digest=hash(payload);return{ok:preview.validation.ok,validation:preview.validation,plan:payload};
}
function ownerView(){return{contract:clone(contract),state:'READY_FOR_PREVIEW_ONLY_EVIDENCE_GAP_PLANNING',componentCount:contract.priority_order.length,externalAdaptersConnected:false,persistenceEnabled:false,registerMutationEnabled:false,applySupported:false,deploymentAuthorized:false,launchState:'NO_GO'};}
module.exports={stable,hash,plan,ownerView};
