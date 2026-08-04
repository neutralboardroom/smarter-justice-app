'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const http=require('http');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(require('path').join(os.tmpdir(),'sj-readiness-v1772-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-readiness-v1772-token-123456789';
const readiness=require('../lib/portfolioLaunchReadiness');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
function receipt(overrides={}){
  const product={id:'consumer-protection-law-aid',name:'Consumer Protection Law Aid',version:'0.22.0',artifact_name:'consumer-protection-law-aid-v0.22.0.zip',artifact_sha256:'a'.repeat(64),artifact_size_bytes:123456,initial_cutover_track:false,build_and_readiness_track:true,...(overrides.product||{})};
  return{
    schema_id:'SJP-PRODUCT-LAUNCH-READINESS-RECEIPT-2026-08-02-V1',
    receipt_id:'fixture-receipt',
    product,
    readiness_state:'LAUNCH_READY_NOT_SCHEDULED',
    gates:{product_quality:'ACCEPTED',practice_specific_legal_and_safety:'ACCEPTED',current_authoritative_sources:'ACCEPTED',profile_growth_and_enrichment:'ACCEPTED',smarter_justice_compatibility:'ACCEPTED',tests_and_exact_release:'ACCEPTED',repository_and_workflow:'ACCEPTED',deployment_contract:'ACCEPTED',provider_service:'READY_FOR_REVIEW',domain_dns_tls:'READY_FOR_REVIEW',migration:'NOT_APPLICABLE',health_and_smoke:'READY_FOR_REVIEW',monitoring_support_incident:'READY_FOR_REVIEW',stabilization_and_rollback:'READY_FOR_REVIEW'},
    exact_blockers:[],builder_controlled_work_remaining:[],protected_owner_actions:['Schedule or authorize exact production deployment.'],next_executable_action:'Await exact production scheduling or authorization.',evidence_files:['example.json'],...overrides,product
  };
}
(async()=>{
  const pkg=require('../package.json');const manifest=require('../portal-manifest.json');
  assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(manifest.currentDevelopmentVersion,'1.7.83');assert.equal(manifest.latestZipName,'smarter-justice-v1.7.82.zip');assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.testSuiteParts,146);
  assert.equal(manifest.capabilities.portfolioNeutralLaunchReadinessReceiptsV1772,true);
  const staticValidation=readiness.validateStaticArtifacts();assert.equal(staticValidation.ok,true,staticValidation.errors.join('\n'));
  assert.deepEqual(readiness.INITIAL_SCOPE,['smarter-justice-central','divorce-law-aid','estate-law-aid','personal-injury-law-aid','domestic-violence-aid']);
  const nonInitial=receipt();const valid=readiness.validateReceipt(nonInitial);assert.equal(valid.ok,true,valid.errors.join('\n'));assert.equal(valid.launchReadyNotScheduled,true);assert.equal(valid.successful,true);
  const blocked=receipt({product:{id:'bankruptcy-debt-law-aid',name:'Bankruptcy & Debt Law Aid',version:'0.25.0',artifact_name:'bankruptcy-debt-law-aid-v0.25.0.zip',artifact_sha256:'b'.repeat(64),artifact_size_bytes:673140,initial_cutover_track:false,build_and_readiness_track:true},readiness_state:'BLOCKED_WITH_EXACT_REASON',exact_blockers:['Provider binding is incomplete.'],next_executable_action:'Bind the named provider environment.'});
  const aggregate=readiness.aggregateReceipts([nonInitial,blocked]);assert.equal(aggregate.summary.validReceipts,2);assert.equal(aggregate.summary.successfulProducts,1);assert.equal(aggregate.summary.blockedProducts,1);assert.deepEqual(aggregate.nonInitialLaunchReadyNotScheduledProductIds,['consumer-protection-law-aid']);assert.deepEqual(aggregate.blockedProductIds,['bankruptcy-debt-law-aid']);assert.equal(aggregate.crossBlockingApplied,false);assert.equal(aggregate.missingReceiptInferenceApplied,false);assert.equal(aggregate.deploymentAuthorized,false);
  const invalid=readiness.validateReceipt(receipt({product:{artifact_sha256:'bad'}}));assert.equal(invalid.ok,false);assert(invalid.errors.includes('artifact-sha256'));
  const initialMisclassified=readiness.validateReceipt(receipt({product:{id:'divorce-law-aid',name:'Divorce Law Aid',initial_cutover_track:true},readiness_state:'LAUNCH_READY_NOT_SCHEDULED'}));assert.equal(initialMisclassified.ok,false);assert(initialMisclassified.errors.includes('launch-ready-not-scheduled-requires-non-initial-product'));
  const mixed=readiness.aggregateReceipts([nonInitial,receipt({product:{id:'invalid-portal',artifact_sha256:'bad'}})]);assert.equal(mixed.summary.validReceipts,1);assert.equal(mixed.summary.invalidReceipts,1);assert.deepEqual(mixed.successfulProductIds,['consumer-protection-law-aid']);
  await store.init();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  try{assert.equal((await request(base,'/api/owner/portfolio-launch-readiness')).status,403);const h={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};const allowed=await request(base,'/api/owner/portfolio-launch-readiness',h);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.portfolioLaunchReadiness.validation.ok,true);const cc=await request(base,'/api/owner/control-center',h);assert.equal(cc.status,200);assert.equal(cc.data.version,'1.7.83');assert.equal(cc.data.portfolioLaunchReadiness.validation.ok,true);}finally{await new Promise(r=>server.close(r));}
  console.log('portfolio-launch-readiness-v1772.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
