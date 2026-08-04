'use strict';
const crypto=require('crypto');
const contract=require('../V14_EVIDENCE_BATCH_WORKSPACE_CONTRACT_V1.7.83.json');
const connector=require('./v14LiveEvidenceConnector');
function clone(v){return JSON.parse(JSON.stringify(v));}
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=stable(value[key]);return out;}return value;}
function digest(value){const copy=clone(value||{});delete copy.batch_digest;return crypto.createHash('sha256').update(JSON.stringify(stable(copy))).digest('hex');}
function validateBatch(batch,options={}){
 const errors=[];let bytes=0;
 try{bytes=Buffer.byteLength(JSON.stringify(batch||{}));}catch{errors.push('batch-json');}
 if(bytes>contract.maximum_batch_bytes)errors.push('batch-too-large');
 if(batch?.schema_id!==contract.batch_schema_id)errors.push('schema');
 if(!/^[A-Z0-9][A-Z0-9._:-]{7,127}$/.test(String(batch?.batch_id||'')))errors.push('batch-id');
 const receipts=Array.isArray(batch?.receipts)?batch.receipts:[];
 if(receipts.length<1||receipts.length>contract.maximum_receipts)errors.push('receipt-count');
 const receiptIds=new Set(),receiptDigests=new Set(),components=new Map(),environments=new Set();
 const validations=[];
 for(const receipt of receipts){
  const result=connector.validateReceipt(receipt,options);validations.push(result);
  if(!result.ok)errors.push(...result.errors.map(x=>`receipt:${receipt?.receipt_id||'missing'}:${x}`));
  const id=String(receipt?.receipt_id||'');if(receiptIds.has(id))errors.push(`duplicate-receipt-id:${id}`);else receiptIds.add(id);
  const rd=String(receipt?.receipt_digest||'');if(receiptDigests.has(rd))errors.push(`replayed-receipt-digest:${rd||'missing'}`);else receiptDigests.add(rd);
  const component=String(receipt?.component_id||'');if(components.has(component))errors.push(`component-conflict:${component}`);else components.set(component,receipt);
  if(receipt?.environment)environments.add(receipt.environment);
 }
 if(environments.size>1)errors.push('mixed-environment');
 const expected=digest(batch);if(batch?.batch_digest!==expected)errors.push('batch-digest');
 const orderedReceipts=[...receipts].sort((a,b)=>String(a.component_id).localeCompare(String(b.component_id))||String(a.receipt_id).localeCompare(String(b.receipt_id)));
 return{ok:errors.length===0,errors,batchDigest:expected,receiptCount:receipts.length,componentCount:components.size,environment:environments.size===1?[...environments][0]:null,orderedReceipts,validations,previewOnly:true,persisted:false,registerMutated:false,deploymentAuthorized:false,launchState:'NO_GO'};
}
function previewTransaction(batch,options={}){
 const validation=validateBatch(batch,options);
 const promotions=validation.ok?validation.orderedReceipts.map(receipt=>{
  const preview=connector.previewPromotion(receipt,options);
  return{receiptId:receipt.receipt_id,componentId:receipt.component_id,currentState:preview.currentState,proposedState:preview.proposedState,receiptDigest:receipt.receipt_digest,applied:false};
 }):[];
 const transactionId=validation.ok?crypto.createHash('sha256').update(JSON.stringify({batchDigest:validation.batchDigest,promotions})).digest('hex'):null;
 return{validation,transaction:{schema_id:'SJP-V14-LIVE-EVIDENCE-PROMOTION-PREVIEW-2026-08-03-V1',transaction_id:transactionId,batch_id:batch?.batch_id||null,batch_digest:validation.batchDigest,promotions,all_or_nothing:true,apply_supported:false,applied:false,persisted:false,register_mutated:false,external_calls:false,owner_go_inferred:false,deployment_authorized:false,launch_state:'NO_GO'}};
}
function ownerView(){return{contract:clone(contract),state:'READY_FOR_EXACT_NONSECRET_BATCH_PREVIEW',previewOnly:true,persistenceEnabled:false,registerMutationEnabled:false,externalAdaptersConnected:false,deploymentAuthorized:false,launchState:'NO_GO'};}
module.exports={stable,digest,validateBatch,previewTransaction,ownerView};
