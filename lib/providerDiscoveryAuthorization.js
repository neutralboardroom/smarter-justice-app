'use strict';
const crypto=require('crypto');
const schema=require('../PROVIDER_DISCOVERY_OWNER_AUTHORIZATION_SCHEMA_V1.7.75.json');
const packet=require('../PROVIDER_DISCOVERY_OWNER_AUTHORIZATION_PACKET_V1.7.75.json');
const providerDiscoveryPlan=require('./providerDiscoveryPlan');
function clone(v){return JSON.parse(JSON.stringify(v));}
function text(v){return String(v??'').trim();}
function isoMs(v){const n=Date.parse(text(v));return Number.isFinite(n)?n:null;}
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v);}
function digest(v){return crypto.createHash('sha256').update(stable(v)).digest('hex');}
function hasSecretMaterial(v){return /(?:sk_live_|rk_live_|ghp_|github_pat_|postgres(?:ql)?:\/\/[^"\s]+:[^"\s]+@|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|smtp_pass\s*[:=]\s*["'][^"']{6,})/i.test(JSON.stringify(v));}
function sameSet(values,required){return Array.isArray(values)&&Array.isArray(required)&&values.length===required.length&&values.every(v=>required.includes(v))&&new Set(values).size===values.length;}
function validateDecision(request={},decision={},options={}){
  const errors=[];
  const requestValidation=providerDiscoveryPlan.validateRequest(request,{now:decision.issued_at||options.now});
  if(!requestValidation.ok)errors.push(...requestValidation.errors.map(x=>`request:${x}`));
  if(request.request_state!=='OWNER_AUTHORIZATION_REQUIRED'||request.authorization_state!=='NOT_AUTHORIZED')errors.push('immutable-request-state');
  if(decision.schema_id!==schema.schema_id)errors.push('schema-id');
  if(!text(decision.decision_id))errors.push('decision-id');
  if(!schema.allowedDecisionStates.includes(decision.decision_state))errors.push('decision-state');
  if(decision.authorization_request_id!==request.request_id)errors.push('authorization-request-id');
  if(decision.authorization_request_digest!==providerDiscoveryPlan.digestRequest(request))errors.push('authorization-request-digest');
  const rp=request.product||{},dp=decision.product||{};
  for(const key of ['id','version','artifact_name','artifact_sha256','artifact_size_bytes'])if(rp[key]!==dp[key])errors.push(`product-identity:${key}`);
  const issued=isoMs(decision.issued_at),expires=isoMs(decision.expires_at),requestCreated=isoMs(request.created_at),requestExpires=isoMs(request.expires_at),now=isoMs(options.now||decision.issued_at);
  if(!issued)errors.push('issued-at');if(!expires)errors.push('expires-at');
  if(issued&&expires&&expires<=issued)errors.push('authorization-window-order');
  if(issued&&expires&&(expires-issued)>schema.maximumAuthorizationWindowHours*3600000)errors.push('authorization-window-too-long');
  if(issued&&requestCreated&&issued<requestCreated)errors.push('decision-before-request');
  if(expires&&requestExpires&&expires>requestExpires)errors.push('decision-after-request-expiration');
  if(!sameSet(decision.authorized_scopes,request.scopes))errors.push('authorized-scopes');
  if(!sameSet(decision.forbidden_actions_acknowledged,request.forbidden_actions))errors.push('forbidden-actions-acknowledged');
  const authorized=decision.decision_state==='AUTHORIZED_READ_ONLY';
  if(authorized&&decision.owner_confirmation!==schema.exactAuthorizationConfirmation)errors.push('owner-confirmation');
  if(!authorized&&decision.owner_confirmation)errors.push('nonauthorization-confirmation');
  if(authorized&&!/^[A-Za-z0-9_-]{32,128}$/.test(text(decision.execution_nonce)))errors.push('execution-nonce');
  if(decision.read_only!==true)errors.push('read-only');
  if(decision.secret_values_forbidden!==true)errors.push('secret-values-forbidden');
  if(decision.write_operations_forbidden!==true)errors.push('write-operations-forbidden');
  if(decision.deployment_authorized!==false)errors.push('deployment-authorized');
  if(decision.production_request_sent!==false)errors.push('production-request-sent');
  if(decision.cohort_freeze_authorized!==false)errors.push('cohort-freeze-authorized');
  if(decision.canary_authorized!==false)errors.push('canary-authorized');
  if(decision.single_use!==true)errors.push('single-use');
  if(hasSecretMaterial({request,decision}))errors.push('secret-material');
  const replayed=authorized&&options.usedNonces instanceof Set&&options.usedNonces.has(text(decision.execution_nonce));
  if(replayed)errors.push('execution-nonce-replayed');
  const current=Boolean(now&&issued&&expires&&now>=issued&&now<=expires);
  const executable=errors.length===0&&authorized&&current&&!replayed;
  return{ok:errors.length===0,errors,decisionId:text(decision.decision_id),decisionState:text(decision.decision_state),authorized,current,replayed,executable,requestDigest:providerDiscoveryPlan.digestRequest(request),decisionDigest:digest(decision),deploymentAuthorized:false,productionRequestSent:false,cohortFrozen:false,canarySelected:false,secretValuesRead:false};
}
function buildExecutionEnvelope(request={},decision={},options={}){
  const validation=validateDecision(request,decision,options);
  if(!validation.executable)return{ok:false,errors:[...validation.errors],validation,executionEnvelope:null};
  const envelope={
    schema:'smarter-justice-provider-discovery-single-use-execution-envelope',
    releaseVersion:'1.7.75',
    authorization_request_id:request.request_id,
    authorization_request_digest:validation.requestDigest,
    owner_decision_id:decision.decision_id,
    owner_decision_digest:validation.decisionDigest,
    product:clone(request.product),
    scopes:[...request.scopes],
    execution_nonce:decision.execution_nonce,
    valid_from:decision.issued_at,
    valid_until:decision.expires_at,
    single_use:true,
    read_only:true,
    secret_values_forbidden:true,
    write_operations_forbidden:true,
    deployment_authorized:false,
    production_request_sent:false,
    cohort_freeze_authorized:false,
    canary_authorized:false
  };
  return{ok:true,errors:[],validation,executionEnvelope:envelope,envelopeDigest:digest(envelope)};
}
function validatePacket(value=packet){
  const errors=[];
  const plan=require('../PROVIDER_DISCOVERY_PLAN_V1.7.75.json');
  const request=plan.products?.[0]?.request||{};
  const requestDigest=providerDiscoveryPlan.digestRequest(request);
  if(value.schema!=='smarter-justice-provider-discovery-owner-authorization-packet')errors.push('packet-schema');
  if(value.releaseVersion!=='1.7.75')errors.push('release-version');
  if(value.packId!=='SJP-2026-08-02-C15-P37-D11-V13')errors.push('pack-id');
  if(value.source?.artifact_name!=='smarter-justice-v1.7.73.zip'||value.source?.artifact_sha256!=='5ed64a1c13de1a536303b07a2277e234a822b9bc316b7ea97cf2547e90811898'||value.source?.artifact_size_bytes!==8196348)errors.push('source-identity');
  if(value.request_reference?.authorization_request_id!==request.request_id)errors.push('request-id');
  if(value.request_reference?.authorization_request_digest!==requestDigest)errors.push('request-digest');
  for(const key of ['id','version','artifact_name','artifact_sha256','artifact_size_bytes'])if(value.request_reference?.product?.[key]!==request.product?.[key])errors.push(`request-product:${key}`);
  if(value.decision_state!=='OWNER_DECISION_REQUIRED'||value.decision!==null||value.authorizationReady!==false||value.executionEnvelope!==null)errors.push('pending-decision-boundary');
  if(value.providerMetadataRead!==false||value.secretValuesRead!==false||value.deploymentAuthorized!==false||value.productionRequestSent!==false||value.cohortFrozen!==false||value.canarySelected!==false)errors.push('protected-boundary');
  const template=value.decision_template||{};
  if(template.schema_id!==schema.schema_id||template.authorization_request_id!==request.request_id||template.authorization_request_digest!==requestDigest)errors.push('decision-template-binding');
  if(hasSecretMaterial(value))errors.push('secret-material');
  const requestValidation=providerDiscoveryPlan.validateRequest(request,{now:value.generatedAt});
  if(!requestValidation.ok)errors.push(...requestValidation.errors.map(x=>`request:${x}`));
  if(requestValidation.authorized||requestValidation.executable)errors.push('request-must-remain-unexecuted');
  return{ok:errors.length===0,errors,releaseVersion:'1.7.75',packetId:text(value.packet_id),requestId:request.request_id,requestDigest,decisionState:value.decision_state,authorizationReady:false,executionEnvelopeCreated:false,deploymentAuthorized:false,productionRequestSent:false,cohortFrozen:false,canarySelected:false,providerMetadataRead:false,secretValuesRead:false};
}
function ownerView(){return{schema:clone(schema),packet:clone(packet),validation:validatePacket(),providerDiscoveryPlan:providerDiscoveryPlan.ownerView(),deploymentAuthorized:false,productionRequestSent:false};}
module.exports={digest,validateDecision,buildExecutionEnvelope,validatePacket,ownerView};
