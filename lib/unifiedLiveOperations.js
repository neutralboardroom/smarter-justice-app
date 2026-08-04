'use strict';
const crypto=require('crypto');
const register=require('../V14_UNIFIED_LIVE_OPERATIONS_REGISTER_V1.7.83.json');
const ALLOWED=new Set(['VERIFIED_LIVE','VERIFIED_SANDBOX','IMPLEMENTED_DEPLOYED_DARK','CONTRACT_READY_NOT_CONNECTED','OWNER_ACTION_READY','BLOCKED','CLOSED_BY_DESIGN','NOT_APPLICABLE']);
function clone(v){return JSON.parse(JSON.stringify(v));}
function sha(value){return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');}
function validate(value=register){
 const errors=[];
 if(value.schema_id!=='SJP-V14-UNIFIED-LIVE-OPERATIONS-REGISTER-2026-08-03-V1')errors.push('schema');
 if(value.release_version!=='1.7.83')errors.push('release-version');
 if(value.packet?.id!=='SJP-LMP-UNIVERSAL-ONE-STEP-2026-08-03-V14-ALL-CHAT-MODES'||value.packet?.sha256!=='fce42ce0927748f94189692ef5b3bf8e0fe9f8d12273287f03a68eb7bccdad6f')errors.push('v14-identity');
 const ids=new Set();
 for(const row of value.dependencies||[]){
  if(!row?.id||ids.has(row.id))errors.push(`dependency-id:${row?.id||'missing'}`);else ids.add(row.id);
  if(!ALLOWED.has(row?.state))errors.push(`dependency-state:${row?.id||'missing'}`);
  if(!String(row?.evidence||'').trim())errors.push(`dependency-evidence:${row?.id||'missing'}`);
  if(row?.state==='VERIFIED_LIVE'&&!row?.live_evidence)errors.push(`unsupported-live:${row.id}`);
 }
 for(const required of ['neutral-boardroom-billing','openai-central-gateway','postgres-database','transactional-email','github-canonical-repository','render-central-service','domains-dns-tls-health','sensitive-document-ai','production-deployment'])if(!ids.has(required))errors.push(`missing-dependency:${required}`);
 const boundaries=value.identity_boundaries||{};
 if(boundaries.starting_artifact?.sha256!=='61fea278a69055915e9b4b916e4b64ec514614f1746cacf659a6931ccd0228b1')errors.push('starting-artifact');
 if(boundaries.release_payload?.inventory!=='RELEASE_PAYLOAD_INVENTORY_SHA256.txt')errors.push('payload-identity');
 if(boundaries.source_commit?.sha256!==null||boundaries.source_commit?.state!=='BLOCKED')errors.push('source-commit-truth');
 if(boundaries.deployment?.identity!==null||boundaries.deployment?.state!=='BLOCKED')errors.push('deployment-truth');
 if(boundaries.final_delivery_zip?.state!=='REPORTED_AFTER_PACKAGING'||boundaries.final_delivery_zip?.sha256!==null||boundaries.final_delivery_zip?.size_bytes!==null)errors.push('final-delivery-boundary');
 if(value.one_exact_owner_action?.required!==true||!String(value.one_exact_owner_action?.action||'').trim())errors.push('one-owner-action');
 if(value.production_request_sent!==false||value.deployment_authorized!==false||value.launch_state!=='NO_GO')errors.push('closed-gates');
 return{ok:errors.length===0,errors,releaseVersion:value.release_version,stateCounts:(value.dependencies||[]).reduce((a,x)=>(a[x.state]=(a[x.state]||0)+1,a),{}),registerSha256:sha(value),oneExactOwnerAction:value.one_exact_owner_action?.action||null,deploymentAuthorized:false,launchState:'NO_GO'};
}
function ownerView(){return{register:clone(register),validation:validate(),sensitiveContentIncluded:false,secretsIncluded:false,deploymentAuthorized:false,launchState:'NO_GO'};}
module.exports={ALLOWED,validate,ownerView};
