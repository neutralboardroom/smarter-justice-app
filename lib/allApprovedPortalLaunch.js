'use strict';
const crypto=require('crypto');
const policy=require('../ALL_APPROVED_PORTAL_LAUNCH_POLICY_V1.7.85.json');
const ALLOWED_STATES=new Set(policy.readiness_states);
const APPROVED_IDS=Object.freeze(policy.approved_legal_portals.map(x=>x.id));
const APPROVED_SET=new Set(APPROVED_IDS);
const SEPARATE_SET=new Set(policy.separately_governed_products_and_initiatives.map(x=>x.id));
const SECRET_PATTERN=/(?:sk_live_|rk_live_|ghp_|github_pat_|postgres(?:ql)?:\/\/[^"\s]+:[^"\s]+@|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY)/i;
const clone=v=>JSON.parse(JSON.stringify(v));
const text=v=>String(v??'').trim();
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
function validatePolicy(){
  const errors=[];
  if(policy.schema_id!=='SJP-ALL-APPROVED-LEGAL-PORTALS-LAUNCH-POLICY-2026-08-04-V1')errors.push('schema-id');
  if(policy.releaseVersion!=='1.7.85')errors.push('release-version');
  if(policy.owner_decision!=='ALL_APPROVED_LEGAL_MICRO_PORTALS_ONE_COORDINATED_LAUNCH_PORTFOLIO')errors.push('owner-decision');
  if(APPROVED_IDS.length<20)errors.push('approved-portal-coverage');
  if(new Set(APPROVED_IDS).size!==APPROVED_IDS.length)errors.push('duplicate-approved-portal');
  for(const id of ['real-estate-law-aid','landlord-tenant-aid','civil-rights-law-aid','domestic-violence-aid'])if(!APPROVED_SET.has(id))errors.push(`missing-approved:${id}`);
  for(const id of SEPARATE_SET)if(APPROVED_SET.has(id))errors.push(`separate-product-in-launch-set:${id}`);
  const rules=policy.binding_rules||{};
  if(rules.initial_four_or_five_priority_rule!==false)errors.push('obsolete-cohort-priority');
  if(rules.independent_product_readiness!==true||rules.cross_blocking_between_portals!==false)errors.push('independent-readiness');
  if(rules.parallel_preparation_allowed!==true||rules.production_release_one_product_at_a_time!==true)errors.push('release-sequencing');
  if(rules.explicit_user_consent_for_cross_portal_handoff!==true||rules.minimum_necessary_handoff_only!==true)errors.push('handoff-consent');
  if(rules.automatic_sensitive_data_transfer!==false||rules.automatic_professional_routing!==false)errors.push('automatic-transfer-boundary');
  if(SECRET_PATTERN.test(JSON.stringify(policy)))errors.push('secret-material');
  if(policy.deployment_authorized!==false||policy.production_request_sent!==false)errors.push('deployment-boundary');
  return{ok:errors.length===0,errors,approvedPortalCount:APPROVED_IDS.length,policyDigest:digest(policy)};
}
function validateReceipt(receipt={}){
  const errors=[];
  const productId=text(receipt.product_id);
  if(!APPROVED_SET.has(productId))errors.push('unapproved-product-id');
  if(!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(text(receipt.version)))errors.push('version');
  if(!text(receipt.artifact_name).toLowerCase().endsWith('.zip'))errors.push('artifact-name');
  if(!/^[a-f0-9]{64}$/.test(text(receipt.artifact_sha256)))errors.push('artifact-sha256');
  if(!ALLOWED_STATES.has(receipt.readiness_state))errors.push('readiness-state');
  if(!Array.isArray(receipt.exact_blockers))errors.push('exact-blockers');
  if(receipt.readiness_state==='BLOCKED_WITH_EXACT_REASON'&&!(receipt.exact_blockers||[]).length)errors.push('blocked-without-reason');
  if(receipt.deployment_authorized!==false)errors.push('deployment-authorized');
  if(receipt.production_request_sent!==false)errors.push('production-request-sent');
  if(SECRET_PATTERN.test(JSON.stringify(receipt)))errors.push('secret-material');
  return{ok:errors.length===0,errors,productId,readinessState:text(receipt.readiness_state),receiptDigest:digest(receipt)};
}
function aggregate(receipts=[]){
  const rows=[];
  const seen=new Set();
  for(const receipt of Array.isArray(receipts)?receipts:[]){
    const validation=validateReceipt(receipt);
    if(validation.productId&&seen.has(validation.productId))validation.errors.push('duplicate-product-receipt');
    validation.ok=validation.errors.length===0;
    if(validation.productId)seen.add(validation.productId);
    rows.push(validation);
  }
  const valid=rows.filter(x=>x.ok);
  const byId=new Map(valid.map(x=>[x.productId,x]));
  const productStates=policy.approved_legal_portals.map(portal=>{
    const receipt=byId.get(portal.id);
    return{productId:portal.id,productName:portal.name,specialty:portal.specialty,readinessState:receipt?.readinessState||'EVIDENCE_REQUIRED',receiptPresent:Boolean(receipt),exactBlocker:portal.exact_blocker||null};
  });
  const eligible=productStates.filter(x=>['DEPLOYMENT_REVIEW_READY','DEPLOYED_DARK','VERIFIED_LIVE'].includes(x.readinessState));
  const next=productStates.find(x=>!x.receiptPresent)||productStates.find(x=>x.readinessState==='BLOCKED_WITH_EXACT_REASON')||null;
  return{
    schemaId:policy.schema_id,
    releaseVersion:policy.releaseVersion,
    ownerDecision:policy.owner_decision,
    productStates,
    summary:{approvedLegalPortals:APPROVED_IDS.length,suppliedReceipts:rows.length,validReceipts:valid.length,invalidReceipts:rows.length-valid.length,deploymentReviewOrBeyond:eligible.length,evidenceRequired:productStates.filter(x=>x.readinessState==='EVIDENCE_REQUIRED').length},
    independentlyEligibleProductIds:eligible.map(x=>x.productId),
    nextExactAction:next?`Obtain and validate the exact current artifact and readiness receipt for ${next.productName}.`:'Review the independently eligible products and release one exact product at a time.',
    crossBlockingApplied:false,
    missingReceiptInferenceApplied:false,
    initialCohortPriorityApplied:false,
    parallelPreparationAllowed:true,
    productionReleaseOneProductAtATime:true,
    deploymentAuthorized:false,
    productionRequestSent:false
  };
}
function ownerView(receipts=[]){return{policy:clone(policy),validation:validatePolicy(),aggregate:aggregate(receipts)};}
module.exports={APPROVED_IDS,validatePolicy,validateReceipt,aggregate,ownerView};
