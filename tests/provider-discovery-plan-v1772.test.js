'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const http=require('http');
const cp=require('child_process');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-provider-discovery-plan-v1772-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-provider-discovery-plan-v1772-token-123456789';
const discoveryPlan=require('../lib/providerDiscoveryPlan');
const providerPreflight=require('../lib/providerPreflight');
const store=require('../lib/store');
const server=require('../server');
function httpRequest(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
function authorizedRequest(){
  const plan=require('../PROVIDER_DISCOVERY_PLAN_V1.7.75.json');
  const request=JSON.parse(JSON.stringify(plan.products[0].request));
  request.request_id='provider-discovery-smarter-justice-v1.7.71-authorized-fixture';
  request.created_at='2026-08-02T17:05:00-04:00';
  request.expires_at='2026-08-02T23:05:00-04:00';
  request.request_state='AUTHORIZED_READ_ONLY';
  request.authorization_state='AUTHORIZED_READ_ONLY';
  request.next_executable_action='Execute only the exact approved read-only discovery scopes and return a bound receipt.';
  return request;
}
function completeReceipt(request){
  const receipt={
    schema_id:'SJP-READ-ONLY-PROVIDER-DISCOVERY-RECEIPT-2026-08-02-V1',
    receipt_id:'fixture-smarter-justice-authorized-discovery',
    authorization_request_id:request.request_id,
    authorization_request_digest:discoveryPlan.digestRequest(request),
    observed_at:'2026-08-02T17:30:00-04:00',
    observation_scope:'OWNER_AUTHORIZED_READ_ONLY_DISCOVERY',
    product:{...request.product,initial_cutover_track:true},
    repository:{provider:'GITHUB',repository_identifier:'owner/smarter-justice',repository_state:'PRESENT',default_branch:'main',default_branch_state:'PRESENT',commit_sha:'a'.repeat(40),commit_state:'PRESENT',tree_sha:'b'.repeat(40),tree_state:'PRESENT'},
    deployment:{provider:'RENDER',workspace_identifier:'wrk_fixture',workspace_state:'PRESENT',service_identifier:'srv_fixture',service_state:'PRESENT',service_type:'web',auto_deploy_state:'ABSENT',deployment_mode:'MANUAL_PROTECTED'},
    domain:{canonical_origin:'https://smarterjustice.com',ownership_state:'PRESENT',dns_state:'PRESENT',tls_state:'PRESENT',redirect_state:'PRESENT'},
    secret_presence:{DATABASE_URL:'PRESENT',SMTP_HOST:'PRESENT',SMTP_USER:'PRESENT',SMTP_PASS:'PRESENT',APP_BASE_URL:'PRESENT',OWNER_CONTROL_CENTER_TOKEN:'PRESENT'},
    migration:{classification:'REVERSIBLE',classification_state:'VERIFIED'},
    rollback:{last_known_good:'fixture-lkg',last_known_good_state:'VERIFIED',rollback_candidate:'smarter-justice-v1.7.73.zip',rollback_candidate_state:'VERIFIED'},
    discovery_state:'DISCOVERY_COMPLETE',risk_factors:[{code:'FIXTURE_LOW_RISK',severity:1}],exact_blockers:[],evidence_references:['authorized-read-only-provider-receipt.json'],next_executable_action:'Await separate protected cohort-freeze review; do not deploy.',read_only:true,deployment_requested:false,secret_values_included:false
  };
  delete receipt.product.identity_evidence_state;
  return receipt;
}
(async()=>{
  const pkg=require('../package.json');
  const manifest=require('../portal-manifest.json');
  assert.equal(pkg.version,'1.7.83');
  assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(manifest.currentDevelopmentVersion,'1.7.83');
  assert.equal(manifest.latestZipName,'smarter-justice-v1.7.82.zip');
  assert.equal(manifest.dependencyIndependentTestParts,145);
  assert.equal(manifest.testSuiteParts,146);
  assert.equal(manifest.capabilities.artifactBoundProviderDiscoveryAuthorizationV1772,true);
  assert.equal(manifest.capabilities.providerReceiptAuthorizationBindingV1772,true);
  assert.equal(manifest.capabilities.providerReceiptStalenessInvalidationV1772,true);
  const staticValidation=discoveryPlan.validatePlan();
  assert.equal(staticValidation.ok,true,staticValidation.errors.join('\n'));
  assert.deepEqual(staticValidation.summary,{product_count:5,exact_current_chat_verified_count:1,owner_authorization_required_count:1,artifact_currentness_required_count:4,authorized_request_count:0,completed_discovery_count:0});
  assert.equal(staticValidation.requestValidations.length,1);
  assert.equal(staticValidation.requestValidations[0].authorized,false);
  assert.equal(staticValidation.requestValidations[0].executable,false);
  assert.equal(staticValidation.deploymentAuthorized,false);
  const authorizationRequest=authorizedRequest();
  const requestValidation=discoveryPlan.validateRequest(authorizationRequest,{now:'2026-08-02T17:30:00-04:00'});
  assert.equal(requestValidation.ok,true,requestValidation.errors.join('\n'));
  assert.equal(requestValidation.authorized,true);
  assert.equal(requestValidation.executable,true);
  const receipt=completeReceipt(authorizationRequest);
  assert.equal(providerPreflight.validateReceipt(receipt,{now:receipt.observed_at}).ok,true);
  const binding=discoveryPlan.validateReceiptBinding(authorizationRequest,receipt,{now:receipt.observed_at});
  assert.equal(binding.ok,true,binding.errors.join('\n'));
  assert.equal(binding.accepted,true);
  assert.equal(binding.cohortFrozen,false);
  assert.equal(binding.canarySelected,false);
  assert.equal(binding.deploymentAuthorized,false);
  const tampered=JSON.parse(JSON.stringify(receipt));tampered.product.artifact_sha256='c'.repeat(64);
  const rejected=discoveryPlan.validateReceiptBinding(authorizationRequest,tampered,{now:tampered.observed_at});
  assert.equal(rejected.ok,false);assert(rejected.errors.includes('product-identity:artifact_sha256'));
  const wrongDigest=JSON.parse(JSON.stringify(receipt));wrongDigest.authorization_request_digest='d'.repeat(64);
  assert.equal(discoveryPlan.validateReceiptBinding(authorizationRequest,wrongDigest,{now:wrongDigest.observed_at}).ok,false);
  const expired={...authorizationRequest,expires_at:'2026-08-02T17:10:00-04:00'};
  assert.equal(discoveryPlan.validateRequest(expired,{now:'2026-08-02T17:30:00-04:00'}).executable,false);
  const secretLeak={...authorizationRequest,evidence_references:['postgres://user:password@example/db']};
  assert.equal(discoveryPlan.validateRequest(secretLeak,{now:'2026-08-02T17:30:00-04:00'}).ok,false);
  const script=JSON.parse(cp.execFileSync(process.execPath,[path.join(__dirname,'..','scripts','provider-discovery-plan-validate-v1772.js')],{encoding:'utf8'}));
  assert.equal(script.ok,true);assert.equal(script.deploymentAuthorized,false);assert.equal(script.productionRequestSent,false);assert.equal(script.secretValuesRead,false);
  await store.init();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await httpRequest(base,'/api/owner/provider-discovery-plan')).status,403);
    const h={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};
    const allowed=await httpRequest(base,'/api/owner/provider-discovery-plan',h);
    assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.providerDiscoveryPlan.validation.ok,true);assert.equal(allowed.data.providerDiscoveryPlan.plan.summary.authorized_request_count,0);
    const cc=await httpRequest(base,'/api/owner/control-center',h);
    assert.equal(cc.status,200);assert.equal(cc.data.version,'1.7.83');assert.equal(cc.data.providerDiscoveryPlan.validation.ok,true);
  }finally{await new Promise(r=>server.close(r));}
  console.log('provider-discovery-plan-v1772.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
