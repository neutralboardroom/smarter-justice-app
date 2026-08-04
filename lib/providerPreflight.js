'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const schema=require('../PROVIDER_DISCOVERY_RECEIPT_SCHEMA_V1.7.75.json');
const policy=require('../COHORT_FREEZE_AND_CANARY_POLICY_V1.7.75.json');
const staticAggregate=require('../PROVIDER_PREFLIGHT_AGGREGATE_V1.7.75.json');
const sourceReceipt=require('../PROVIDER_DISCOVERY_RECEIPT_SMARTER_JUSTICE_SOURCE_V1.7.72.json');
const ROOT=path.join(__dirname,'..');
const INITIAL_SCOPE=Object.freeze([...schema.initialCutoverScope]);
const INITIAL_SET=new Set(INITIAL_SCOPE);
const DISCOVERY_STATES=new Set(schema.allowedDiscoveryStates);
const PRESENCE_STATES=new Set(schema.allowedPresenceStates);
const VERIFICATION_STATES=new Set(schema.allowedVerificationStates);
const SECRET_KEYS=Object.freeze([...schema.requiredSecretPresenceKeys]);
function clone(v){return JSON.parse(JSON.stringify(v));}
function text(v){return String(v??'').trim();}
function hasSecretMaterial(v){return /(?:sk_live_|rk_live_|ghp_|github_pat_|postgres(?:ql)?:\/\/[^"\s]+:[^"\s]+@|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|smtp_pass\s*[:=]\s*["'][^"']{6,})/i.test(JSON.stringify(v));}
function isoMs(v){const ms=Date.parse(text(v));return Number.isFinite(ms)?ms:null;}
function receiptDigest(receipt){return crypto.createHash('sha256').update(JSON.stringify(receipt)).digest('hex');}
function validateReceipt(receipt={},options={}){
  const errors=[];
  const product=receipt.product||{};
  if(receipt.schema_id!==schema.schema_id)errors.push('schema-id');
  if(!text(receipt.receipt_id))errors.push('receipt-id');
  if(!isoMs(receipt.observed_at))errors.push('observed-at');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(product.id)))errors.push('product-id');
  if(!text(product.name))errors.push('product-name');
  if(!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(text(product.version)))errors.push('product-version');
  if(!text(product.artifact_name).toLowerCase().endsWith('.zip'))errors.push('artifact-name');
  if(!/^[a-f0-9]{64}$/.test(text(product.artifact_sha256)))errors.push('artifact-sha256');
  if(!Number.isInteger(product.artifact_size_bytes)||product.artifact_size_bytes<1)errors.push('artifact-size');
  if(typeof product.initial_cutover_track!=='boolean')errors.push('initial-cutover-track');
  if(product.initial_cutover_track&&!INITIAL_SET.has(product.id))errors.push('initial-cutover-scope-mismatch');
  if(INITIAL_SET.has(product.id)&&product.initial_cutover_track!==true)errors.push('initial-cutover-flag-mismatch');
  if(!DISCOVERY_STATES.has(receipt.discovery_state))errors.push('discovery-state');
  const repository=receipt.repository||{};
  for(const key of ['repository_state','default_branch_state','commit_state','tree_state'])if(!PRESENCE_STATES.has(repository[key]))errors.push(`repository:${key}`);
  const deployment=receipt.deployment||{};
  for(const key of ['workspace_state','service_state','auto_deploy_state'])if(!PRESENCE_STATES.has(deployment[key]))errors.push(`deployment:${key}`);
  const domain=receipt.domain||{};
  for(const key of ['ownership_state','dns_state','tls_state','redirect_state'])if(!PRESENCE_STATES.has(domain[key]))errors.push(`domain:${key}`);
  if(!/^https:\/\/[A-Za-z0-9.-]+\/?$/.test(text(domain.canonical_origin)))errors.push('canonical-origin');
  const presence=receipt.secret_presence||{};
  for(const key of SECRET_KEYS)if(!PRESENCE_STATES.has(presence[key]))errors.push(`secret-presence:${key}`);
  if(Object.keys(presence).some(k=>!SECRET_KEYS.includes(k)))errors.push('unexpected-secret-presence-key');
  if(!VERIFICATION_STATES.has(receipt.migration?.classification_state))errors.push('migration-classification-state');
  if(!VERIFICATION_STATES.has(receipt.rollback?.last_known_good_state))errors.push('rollback-last-known-good-state');
  if(!VERIFICATION_STATES.has(receipt.rollback?.rollback_candidate_state))errors.push('rollback-candidate-state');
  if(!Array.isArray(receipt.risk_factors))errors.push('risk-factors');
  else for(const risk of receipt.risk_factors){if(!text(risk?.code)||!schema.allowedRiskSeverities.includes(risk?.severity))errors.push('risk-factor');}
  for(const key of ['exact_blockers','evidence_references'])if(!Array.isArray(receipt[key]))errors.push(key);
  if(!text(receipt.next_executable_action))errors.push('next-executable-action');
  if(receipt.read_only!==true)errors.push('read-only');
  if(receipt.deployment_requested!==false)errors.push('deployment-requested');
  if(receipt.secret_values_included!==false)errors.push('secret-values-included');
  if(receipt.discovery_state==='BLOCKED_WITH_EXACT_REASON'&&!(receipt.exact_blockers||[]).length)errors.push('blocked-without-exact-reason');
  if(receipt.discovery_state==='DISCOVERY_COMPLETE'&&(receipt.exact_blockers||[]).length)errors.push('complete-with-blockers');
  if(hasSecretMaterial(receipt))errors.push('secret-material');
  const nowMs=isoMs(options.now||new Date().toISOString());
  const observedMs=isoMs(receipt.observed_at);
  const ageHours=observedMs&&nowMs?Math.max(0,(nowMs-observedMs)/3600000):null;
  const current=ageHours!==null&&ageHours<=schema.maximumReceiptAgeHours;
  const severeRisk=Array.isArray(receipt.risk_factors)&&receipt.risk_factors.some(x=>x?.severity===3);
  const complete=errors.length===0&&receipt.discovery_state==='DISCOVERY_COMPLETE'&&!(receipt.exact_blockers||[]).length;
  const canaryEligible=complete&&current&&!severeRisk&&repository.repository_state==='PRESENT'&&repository.commit_state==='PRESENT'&&repository.tree_state==='PRESENT'&&deployment.service_state==='PRESENT'&&domain.ownership_state==='PRESENT'&&domain.dns_state==='PRESENT'&&domain.tls_state==='PRESENT'&&receipt.rollback?.rollback_candidate_state==='VERIFIED';
  const riskScore=Array.isArray(receipt.risk_factors)?receipt.risk_factors.reduce((n,x)=>n+(Number.isInteger(x?.severity)?x.severity:0),0):null;
  return{ok:errors.length===0,errors,productId:text(product.id),productName:text(product.name),version:text(product.version),initialCutoverTrack:product.initial_cutover_track===true,discoveryState:text(receipt.discovery_state),ageHours,current,complete,canaryEligible,riskScore,digest:receiptDigest(receipt)};
}
function aggregateReceipts(receipts=[],options={}){
  const now=options.now||new Date().toISOString();
  const seen=new Set();
  const rows=[];
  for(const receipt of Array.isArray(receipts)?receipts:[]){
    const validation=validateReceipt(receipt,{now});
    if(validation.productId&&seen.has(validation.productId))validation.errors.push('duplicate-product-receipt');
    validation.ok=validation.errors.length===0;
    if(validation.productId)seen.add(validation.productId);
    rows.push({...validation,receiptId:text(receipt?.receipt_id)});
  }
  const valid=rows.filter(x=>x.ok);
  const validIds=new Set(valid.map(x=>x.productId));
  const missingInitialCutoverReceipts=INITIAL_SCOPE.filter(id=>!validIds.has(id));
  const initialRows=INITIAL_SCOPE.map(id=>valid.find(x=>x.productId===id)).filter(Boolean);
  const incompleteInitialProductIds=initialRows.filter(x=>!x.complete).map(x=>x.productId);
  const staleInitialProductIds=initialRows.filter(x=>!x.current).map(x=>x.productId);
  const ineligibleInitialProductIds=initialRows.filter(x=>!x.canaryEligible).map(x=>x.productId);
  const cohortFreezeEligible=missingInitialCutoverReceipts.length===0&&incompleteInitialProductIds.length===0&&staleInitialProductIds.length===0&&ineligibleInitialProductIds.length===0;
  const candidates=cohortFreezeEligible?[...initialRows].sort((a,b)=>a.riskScore-b.riskScore||INITIAL_SCOPE.indexOf(a.productId)-INITIAL_SCOPE.indexOf(b.productId)):[];
  return{
    schema:'smarter-justice-provider-preflight-runtime-aggregate',releaseVersion:'1.7.75',generatedAt:now,
    rows,
    summary:{suppliedReceipts:rows.length,validReceipts:valid.length,invalidReceipts:rows.length-valid.length,completeReceipts:valid.filter(x=>x.complete).length,currentReceipts:valid.filter(x=>x.current).length,canaryEligibleReceipts:valid.filter(x=>x.canaryEligible).length},
    missingInitialCutoverReceipts,incompleteInitialProductIds,staleInitialProductIds,ineligibleInitialProductIds,
    cohortFreezeEligible,cohortFrozen:false,canaryEligibleProductIds:candidates.map(x=>x.productId),recommendedCanaryProductId:candidates[0]?.productId||null,
    crossBlockingApplied:false,missingReceiptInferenceApplied:false,deploymentAuthorized:false,productionRequestSent:false,secretValuesRead:false,
    nextExecutableAction:cohortFreezeEligible?'Request the exact protected cohort-freeze action; do not deploy.':'Complete or refresh the exact missing and ineligible read-only provider discovery receipts.'
  };
}
function validateStaticArtifacts(root=ROOT){
  const errors=[];
  if(schema.releaseVersion!=='1.7.75')errors.push('schema-release-version');
  if(policy.releaseVersion!=='1.7.75')errors.push('policy-release-version');
  if(staticAggregate.releaseVersion!=='1.7.75')errors.push('aggregate-release-version');
  if(JSON.stringify(INITIAL_SCOPE)!==JSON.stringify(['smarter-justice-central','divorce-law-aid','estate-law-aid','personal-injury-law-aid','domestic-violence-aid']))errors.push('initial-cutover-scope');
  for(const file of ['PROVIDER_DISCOVERY_RECEIPT_SCHEMA_V1.7.75.json','PROVIDER_DISCOVERY_RECEIPT_SMARTER_JUSTICE_SOURCE_V1.7.72.json','COHORT_FREEZE_AND_CANARY_POLICY_V1.7.75.json','PROVIDER_PREFLIGHT_AGGREGATE_V1.7.75.json'])if(!fs.existsSync(path.join(root,file)))errors.push(`missing:${file}`);
  const source=validateReceipt(sourceReceipt,{now:'2026-08-02T16:19:00-04:00'});
  if(!source.ok)errors.push(...source.errors.map(x=>`source-receipt:${x}`));
  const aggregate=aggregateReceipts([sourceReceipt],{now:'2026-08-02T16:19:00-04:00'});
  if(aggregate.cohortFreezeEligible!==false||aggregate.cohortFrozen!==false||aggregate.recommendedCanaryProductId!==null)errors.push('current-preflight-boundary');
  if(aggregate.deploymentAuthorized!==false||aggregate.productionRequestSent!==false||aggregate.secretValuesRead!==false)errors.push('deployment-secret-boundary');
  if(hasSecretMaterial({schema,policy,staticAggregate,sourceReceipt}))errors.push('secret-material');
  return{ok:errors.length===0,errors,releaseVersion:'1.7.75',sourceReceipt:source,aggregate};
}
function ownerView(){return{schema:clone(schema),policy:clone(policy),staticAggregate:clone(staticAggregate),sourceReceipt:clone(sourceReceipt),validation:validateStaticArtifacts(),runtimeAggregate:aggregateReceipts([sourceReceipt],{now:'2026-08-02T16:19:00-04:00'})};}
module.exports={INITIAL_SCOPE,validateReceipt,aggregateReceipts,validateStaticArtifacts,ownerView};
