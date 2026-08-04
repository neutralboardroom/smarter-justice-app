'use strict';
const crypto=require('crypto');
const schema=require('../PROVIDER_DISCOVERY_AUTHORIZATION_REQUEST_SCHEMA_V1.7.75.json');
const policy=require('../PROVIDER_DISCOVERY_INTAKE_POLICY_V1.7.75.json');
const staticPlan=require('../PROVIDER_DISCOVERY_PLAN_V1.7.75.json');
const providerPreflight=require('./providerPreflight');
const REQUEST_STATES=new Set(schema.allowedRequestStates);
const IDENTITY_STATES=new Set(schema.allowedIdentityEvidenceStates);
const AUTHORIZATION_STATES=new Set(['NOT_AUTHORIZED','AUTHORIZED_READ_ONLY','EXPIRED','REVOKED','COMPLETED']);
const REQUIRED_SCOPES=Object.freeze([...schema.requiredScopes]);
const REQUIRED_SCOPE_SET=new Set(REQUIRED_SCOPES);
const FORBIDDEN_ACTIONS=Object.freeze([...schema.forbiddenActions]);
const FORBIDDEN_ACTION_SET=new Set(FORBIDDEN_ACTIONS);
function clone(v){return JSON.parse(JSON.stringify(v));}
function text(v){return String(v??'').trim();}
function isoMs(v){const n=Date.parse(text(v));return Number.isFinite(n)?n:null;}
function stable(v){
  if(Array.isArray(v))return '['+v.map(stable).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
function digestRequest(request){return crypto.createHash('sha256').update(stable(request)).digest('hex');}
function hasSecretMaterial(v){return /(?:sk_live_|rk_live_|ghp_|github_pat_|postgres(?:ql)?:\/\/[^"\s]+:[^"\s]+@|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|smtp_pass\s*[:=]\s*["'][^"']{6,})/i.test(JSON.stringify(v));}
function sameSet(values,required){return Array.isArray(values)&&values.length===required.length&&values.every(v=>required.includes(v))&&new Set(values).size===values.length;}
function validateRequest(request={},options={}){
  const errors=[];
  const nowMs=isoMs(options.now||new Date().toISOString());
  const createdMs=isoMs(request.created_at);const expiresMs=isoMs(request.expires_at);
  if(request.schema_id!==schema.schema_id)errors.push('schema-id');
  if(!text(request.request_id))errors.push('request-id');
  if(!createdMs)errors.push('created-at');
  if(!expiresMs)errors.push('expires-at');
  if(createdMs&&expiresMs&&expiresMs<=createdMs)errors.push('authorization-window-order');
  if(createdMs&&expiresMs&&(expiresMs-createdMs)>schema.maximumAuthorizationWindowHours*3600000)errors.push('authorization-window-too-long');
  if(!REQUEST_STATES.has(request.request_state))errors.push('request-state');
  if(!AUTHORIZATION_STATES.has(request.authorization_state))errors.push('authorization-state');
  const p=request.product||{};
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(p.id)))errors.push('product-id');
  if(!text(p.name))errors.push('product-name');
  if(!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(text(p.version)))errors.push('product-version');
  if(!text(p.artifact_name).toLowerCase().endsWith('.zip'))errors.push('artifact-name');
  if(!/^[a-f0-9]{64}$/.test(text(p.artifact_sha256)))errors.push('artifact-sha256');
  if(!Number.isInteger(p.artifact_size_bytes)||p.artifact_size_bytes<1)errors.push('artifact-size');
  if(!IDENTITY_STATES.has(p.identity_evidence_state))errors.push('identity-evidence-state');
  if(request.request_state!=='EXACT_ARTIFACT_CURRENTNESS_REQUIRED'&&p.identity_evidence_state!=='EXACT_CURRENT_CHAT_VERIFIED')errors.push('exact-current-artifact-required');
  if(!sameSet(request.scopes,REQUIRED_SCOPES))errors.push('scopes');
  if(!sameSet(request.forbidden_actions,FORBIDDEN_ACTIONS))errors.push('forbidden-actions');
  if(request.read_only!==true)errors.push('read-only');
  if(request.secret_values_forbidden!==true)errors.push('secret-values-forbidden');
  if(request.write_operations_forbidden!==true)errors.push('write-operations-forbidden');
  if(request.deployment_requested!==false)errors.push('deployment-requested');
  if(request.production_request_sent!==false)errors.push('production-request-sent');
  if(!Array.isArray(request.evidence_references)||request.evidence_references.length===0)errors.push('evidence-references');
  if(!text(request.next_executable_action))errors.push('next-executable-action');
  if(hasSecretMaterial(request))errors.push('secret-material');
  const current=Boolean(nowMs&&createdMs&&expiresMs&&nowMs>=createdMs&&nowMs<=expiresMs);
  const exactIdentity=p.identity_evidence_state==='EXACT_CURRENT_CHAT_VERIFIED';
  const authorized=request.request_state==='AUTHORIZED_READ_ONLY'&&request.authorization_state==='AUTHORIZED_READ_ONLY';
  const executable=errors.length===0&&current&&exactIdentity&&authorized;
  return{ok:errors.length===0,errors,requestId:text(request.request_id),productId:text(p.id),requestState:text(request.request_state),authorizationState:text(request.authorization_state),current,exactIdentity,authorized,executable,digest:digestRequest(request),readOnly:true,deploymentAuthorized:false,productionRequestSent:false,secretValuesRead:false};
}
function validatePlan(plan=staticPlan,options={}){
  const errors=[];const now=options.now||plan.generatedAt;
  if(plan.schema!=='smarter-justice-provider-discovery-authorization-plan')errors.push('plan-schema');
  if(plan.releaseVersion!=='1.7.75')errors.push('release-version');
  if(!text(plan.plan_id))errors.push('plan-id');
  if(!isoMs(plan.generatedAt))errors.push('generated-at');
  const rows=Array.isArray(plan.products)?plan.products:[];
  if(JSON.stringify(rows.map(x=>x.product_id))!==JSON.stringify(schema.initialCutoverScope))errors.push('initial-scope-order');
  const seen=new Set();let verified=0,ownerRequired=0,currentnessRequired=0,authorized=0,completed=0;
  const validations=[];
  for(const row of rows){
    if(seen.has(row.product_id))errors.push('duplicate-product');seen.add(row.product_id);
    if(!IDENTITY_STATES.has(row.identity_evidence_state))errors.push(`identity-state:${row.product_id}`);
    if(!REQUEST_STATES.has(row.request_state))errors.push(`request-state:${row.product_id}`);
    if(!Array.isArray(row.exact_blockers))errors.push(`blockers:${row.product_id}`);
    if(row.identity_evidence_state==='EXACT_CURRENT_CHAT_VERIFIED')verified++;
    if(row.request_state==='OWNER_AUTHORIZATION_REQUIRED')ownerRequired++;
    if(row.request_state==='EXACT_ARTIFACT_CURRENTNESS_REQUIRED')currentnessRequired++;
    if(row.request_state==='AUTHORIZED_READ_ONLY')authorized++;
    if(row.request_state==='COMPLETED')completed++;
    if(row.request){
      const v=validateRequest(row.request,{now});validations.push(v);
      if(!v.ok)errors.push(...v.errors.map(x=>`${row.product_id}:${x}`));
      if(v.productId!==row.product_id)errors.push(`${row.product_id}:request-product-mismatch`);
      if(row.request_state!==row.request.request_state)errors.push(`${row.product_id}:request-state-mismatch`);
    }else if(row.request_state!=='EXACT_ARTIFACT_CURRENTNESS_REQUIRED')errors.push(`${row.product_id}:missing-request`);
  }
  const expected={product_count:rows.length,exact_current_chat_verified_count:verified,owner_authorization_required_count:ownerRequired,artifact_currentness_required_count:currentnessRequired,authorized_request_count:authorized,completed_discovery_count:completed};
  for(const [k,v] of Object.entries(expected))if(plan.summary?.[k]!==v)errors.push(`summary:${k}`);
  if(plan.cohortFreezeEligible!==false||plan.cohortFrozen!==false||plan.recommendedCanaryProductId!==null)errors.push('cohort-boundary');
  if(plan.deploymentAuthorized!==false||plan.productionRequestSent!==false||plan.secretValuesRead!==false)errors.push('deployment-secret-boundary');
  if(hasSecretMaterial({schema,policy,plan}))errors.push('secret-material');
  return{ok:errors.length===0,errors,releaseVersion:'1.7.75',planId:text(plan.plan_id),summary:expected,requestValidations:validations,draftRequestDigests:validations.map(x=>({requestId:x.requestId,productId:x.productId,digest:x.digest})),cohortFreezeEligible:false,cohortFrozen:false,deploymentAuthorized:false,productionRequestSent:false,secretValuesRead:false};
}
function validateReceiptBinding(request={},receipt={},options={}){
  const errors=[];
  const requestValidation=validateRequest(request,{now:receipt.observed_at||options.now});
  if(!requestValidation.ok)errors.push(...requestValidation.errors.map(x=>`request:${x}`));
  if(!requestValidation.authorized)errors.push('request-not-authorized-read-only');
  if(!requestValidation.current)errors.push('authorization-not-current');
  const receiptValidation=providerPreflight.validateReceipt(receipt,{now:options.now||receipt.observed_at});
  if(!receiptValidation.ok)errors.push(...receiptValidation.errors.map(x=>`receipt:${x}`));
  if(receipt.authorization_request_id!==request.request_id)errors.push('authorization-request-id');
  if(receipt.authorization_request_digest!==requestValidation.digest)errors.push('authorization-request-digest');
  if(receipt.observation_scope!==policy.receiptObservationScope)errors.push('observation-scope');
  const rp=request.product||{}, pp=receipt.product||{};
  for(const key of ['id','version','artifact_name','artifact_sha256','artifact_size_bytes'])if(rp[key]!==pp[key])errors.push(`product-identity:${key}`);
  const observed=isoMs(receipt.observed_at),created=isoMs(request.created_at),expires=isoMs(request.expires_at);
  if(observed&&created&&observed<created)errors.push('receipt-before-authorization');
  if(observed&&expires&&observed>expires)errors.push('receipt-after-expiration');
  if(receipt.read_only!==true||receipt.deployment_requested!==false||receipt.secret_values_included!==false)errors.push('receipt-safety-boundary');
  if(hasSecretMaterial({request,receipt}))errors.push('secret-material');
  const accepted=errors.length===0&&receiptValidation.complete;
  return{ok:errors.length===0,accepted,errors,request:requestValidation,receipt:receiptValidation,invalidated:errors.length>0,invalidationReasons:[...errors],cohortFrozen:false,canarySelected:false,deploymentAuthorized:false,productionRequestSent:false,secretValuesRead:false};
}
function ownerView(){return{schema:clone(schema),policy:clone(policy),plan:clone(staticPlan),validation:validatePlan(),draftRequestDigest:validatePlan().draftRequestDigests[0]?.digest||null,providerPreflight:providerPreflight.ownerView(),deploymentAuthorized:false,productionRequestSent:false};}
module.exports={REQUIRED_SCOPES,FORBIDDEN_ACTIONS,digestRequest,validateRequest,validatePlan,validateReceiptBinding,ownerView};
