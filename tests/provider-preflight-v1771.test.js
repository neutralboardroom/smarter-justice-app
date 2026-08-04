'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const http=require('http');
const cp=require('child_process');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-provider-preflight-v1772-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-provider-preflight-v1772-token-123456789';
const preflight=require('../lib/providerPreflight');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
function completeReceipt(productId,index,risk=1){
  const names={
    'smarter-justice-central':'Smarter Justice',
    'divorce-law-aid':'Divorce Law Aid',
    'estate-law-aid':'Estate Law Aid',
    'personal-injury-law-aid':'Personal Injury Law Aid',
    'domestic-violence-aid':'Domestic Violence Aid'
  };
  const versions={'smarter-justice-central':'1.7.75','divorce-law-aid':'0.48.0','estate-law-aid':'1.1.67','personal-injury-law-aid':'0.71.0','domestic-violence-aid':'0.55.0'};
  return{
    schema_id:'SJP-READ-ONLY-PROVIDER-DISCOVERY-RECEIPT-2026-08-02-V1',
    receipt_id:`fixture-${productId}`,
    observed_at:'2026-08-02T16:00:00-04:00',
    observation_scope:'OWNER_AUTHORIZED_READ_ONLY_DISCOVERY',
    product:{id:productId,name:names[productId],version:versions[productId],artifact_name:`${productId}-v${versions[productId]}.zip`,artifact_sha256:String(index+1).repeat(64).slice(0,64),artifact_size_bytes:100000+index,initial_cutover_track:true},
    repository:{provider:'GITHUB',repository_identifier:`owner/${productId}`,repository_state:'PRESENT',default_branch:'main',default_branch_state:'PRESENT',commit_sha:'a'.repeat(40),commit_state:'PRESENT',tree_sha:'b'.repeat(40),tree_state:'PRESENT'},
    deployment:{provider:'RENDER',workspace_identifier:'wrk_fixture',workspace_state:'PRESENT',service_identifier:`srv_${index}`,service_state:'PRESENT',service_type:'web',auto_deploy_state:'ABSENT',deployment_mode:'MANUAL_PROTECTED'},
    domain:{canonical_origin:`https://${productId}.example.com`,ownership_state:'PRESENT',dns_state:'PRESENT',tls_state:'PRESENT',redirect_state:'PRESENT'},
    secret_presence:{DATABASE_URL:'PRESENT',SMTP_HOST:'PRESENT',SMTP_USER:'PRESENT',SMTP_PASS:'PRESENT',APP_BASE_URL:'PRESENT',OWNER_CONTROL_CENTER_TOKEN:'PRESENT'},
    migration:{classification:'REVERSIBLE',classification_state:'VERIFIED'},
    rollback:{last_known_good:'fixture-lkg',last_known_good_state:'VERIFIED',rollback_candidate:`${productId}-rollback.zip`,rollback_candidate_state:'VERIFIED'},
    discovery_state:'DISCOVERY_COMPLETE',risk_factors:[{code:`RISK_${index}`,severity:risk}],exact_blockers:[],evidence_references:[`receipt-${index}.json`],next_executable_action:'Await exact protected cohort-freeze action.',read_only:true,deployment_requested:false,secret_values_included:false
  };
}
(async()=>{
  const pkg=require('../package.json');const manifest=require('../portal-manifest.json');
  assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(manifest.currentDevelopmentVersion,'1.7.83');assert.equal(manifest.latestZipName,'smarter-justice-v1.7.82.zip');assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.testSuiteParts,146);
  assert.equal(manifest.capabilities.readOnlyProviderDiscoveryReceiptsV1772,true);assert.equal(manifest.capabilities.exactFiveProductCohortFreezeGateV1772,true);assert.equal(manifest.capabilities.evidenceBasedCanaryRecommendationV1772,true);
  const staticValidation=preflight.validateStaticArtifacts();assert.equal(staticValidation.ok,true,staticValidation.errors.join('\n'));assert.equal(staticValidation.aggregate.cohortFreezeEligible,false);assert.equal(staticValidation.aggregate.deploymentAuthorized,false);
  const ids=[...preflight.INITIAL_SCOPE];
  const receipts=ids.map((id,i)=>completeReceipt(id,i,i===2?0:1));
  const aggregate=preflight.aggregateReceipts(receipts,{now:'2026-08-02T16:19:00-04:00'});
  assert.equal(aggregate.summary.validReceipts,5);assert.equal(aggregate.summary.completeReceipts,5);assert.equal(aggregate.cohortFreezeEligible,true);assert.equal(aggregate.cohortFrozen,false);assert.equal(aggregate.recommendedCanaryProductId,'estate-law-aid');assert.equal(aggregate.deploymentAuthorized,false);assert.equal(aggregate.productionRequestSent,false);
  const missing=preflight.aggregateReceipts(receipts.slice(0,4),{now:'2026-08-02T16:19:00-04:00'});assert.equal(missing.cohortFreezeEligible,false);assert.deepEqual(missing.missingInitialCutoverReceipts,['domestic-violence-aid']);assert.equal(missing.recommendedCanaryProductId,null);
  const stale=preflight.aggregateReceipts(receipts.map((x,i)=>i===0?{...x,observed_at:'2026-07-30T16:00:00-04:00'}:x),{now:'2026-08-02T16:19:00-04:00'});assert.equal(stale.cohortFreezeEligible,false);assert.deepEqual(stale.staleInitialProductIds,['smarter-justice-central']);
  const secretLeak=completeReceipt('smarter-justice-central',0);secretLeak.repository.repository_identifier='postgres://user:password@example/db';const invalid=preflight.validateReceipt(secretLeak,{now:'2026-08-02T16:19:00-04:00'});assert.equal(invalid.ok,false);assert(invalid.errors.includes('secret-material'));
  const script=JSON.parse(cp.execFileSync(process.execPath,[path.join(__dirname,'..','scripts','provider-preflight-validate-v1772.js')],{encoding:'utf8'}));assert.equal(script.ok,true);assert.equal(script.productionRequestSent,false);assert.equal(script.secretValuesRead,false);
  await store.init();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  try{assert.equal((await request(base,'/api/owner/provider-preflight')).status,403);const h={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};const allowed=await request(base,'/api/owner/provider-preflight',h);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.providerPreflight.validation.ok,true);assert.equal(allowed.data.providerPreflight.runtimeAggregate.cohortFrozen,false);const cc=await request(base,'/api/owner/control-center',h);assert.equal(cc.status,200);assert.equal(cc.data.version,'1.7.83');assert.equal(cc.data.providerPreflight.validation.ok,true);}finally{await new Promise(r=>server.close(r));}
  console.log('provider-preflight-v1772.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
