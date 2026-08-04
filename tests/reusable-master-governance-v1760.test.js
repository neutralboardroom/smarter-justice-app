'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const http=require('http');
const root=path.join(__dirname,'..');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-reusable-v1760-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-reusable-v1760-token-123456789';
const governance=require('../lib/reusableBuildGovernance');
const actions=require('../lib/ownerActionReadiness');
const authority=require('../lib/initialPortalAuthority');
const currentness=require('../lib/initialPortalCurrentness');
const operating=require('../lib/legalPortfolioOperatingSystem');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
(async()=>{
  const pkg=require('../package.json');
  const manifest=require('../portal-manifest.json');
  const intake=require('../REUSABLE_MASTER_COMMAND_INTAKE_V1.7.75.json');
  const learn=require('../NEWEST_ARTIFACT_LEARNING_APPLIED_V1.7.68.json');
  const recon=require('../FINAL_V1.7.63_TRUTH_RECONCILIATION_V1.7.68.json');
  const readiness=require('../OWNER_ACTION_READINESS_V1.7.68.json');
  assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(manifest.testSuiteParts,146);assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.releaseEvidence,'RELEASE_EVIDENCE_V1.7.83.json');assert.equal(manifest.initialPortalAuthority,'INITIAL_PORTAL_AUTHORITY_V1.7.75.json');
  for(const k of ['reusableMasterGovernanceV1760','newestArtifactLearningAppliedV1760','ownerActionReadinessValidationV1760','protectedOwnerActionReadinessApiV1760','exactFinalV1759SourceReconciliationV1760','canonicalInitialPortalAuthorityV1760','fourthPassReusableMasterGovernanceV1761','mondayLaunchOwnerActionEscalationV1761'])assert.equal(manifest.capabilities[k],true,k);
  for(const k of ['livePortalConnectionsV1760','liveBillingV1760','liveExternalAiV1760','livePortalConnectionsV1761','liveBillingV1761','liveExternalAiV1761'])assert.equal(manifest.capabilities[k],false,k);
  assert.equal(intake.prompt.sha256,'5dad361bae18b25dc8193ce32ca4263a72b12ce90316d6b97dbd191ce2b74223');assert.equal(intake.prompt.sizeBytes,383921);assert.equal(intake.prompt.lineCount,8204);assert.equal(intake.implementationTruthSource,'smarter-justice-v1.7.73.zip');assert.equal(intake.nextVersionDerived,'1.7.75');
  assert.equal(recon.sourceArtifact.sha256,'80efad7967acb44f5d28add7f1cadfc3d3a123a1a4a681cc56d13ea061c52f73');assert.equal(recon.sourceArtifact.sizeBytes,6510458);
  assert.equal(learn.source.artifact,'smarter-justice-v1.7.67.zip');assert.equal(learn.source.evidenceState,'CURRENT_CHAT_REPRODUCED');
  const av=actions.validate();assert.equal(av.ok,true,av.errors.join('\n'));assert(av.requestableCount>=2);assert.equal(av.receivedIsNotVerified,true);assert(readiness.requiredFields.includes('safeConfirmation'));assert(readiness.requiredFields.includes('builderVerification'));
  const g=governance.validate();assert.equal(g.ok,true,g.errors.join('\n'));
  const a=authority.validate();assert.equal(a.ok,true,a.errors.join('\n'));assert.equal(a.advancedCount,0);
  const cv=currentness.validate();assert.equal(cv.ok,true,cv.errors.join('\n'));
  for(const row of authority.ownerView().portals){assert.equal(operating.PILOTS.find(x=>x.portalId===row.portalId).artifact.version,row.version);}
  const cont=fs.readFileSync(path.join(root,'CONTINUATION_PROMPT_V1.7.75.md'),'utf8');assert.equal((cont.match(/^SMARTER JUSTICE$/gm)||[]).length,1);assert(cont.includes('EXPECTED NEXT VERSION IF BASE REMAINS CURRENT: v1.7.76'));assert(cont.includes('Current exact source and immediate rollback remain `smarter-justice-v1.7.73.zip`'));assert(cont.includes('END OF SMARTER JUSTICE CENTRAL MASTER FIFTEENTH-PASS SUNDAY LAUNCH-DAY ORCHESTRATION FINAL CONTINUATION'));
  await store.init();const addr=await new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server.address())));const base=`http://127.0.0.1:${addr.port}`;
  try{assert.equal((await request(base,'/api/owner/owner-action-readiness')).status,403);const allowed=await request(base,'/api/owner/owner-action-readiness',{'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN});assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.ownerActionReadiness.validation.ok,true);assert(allowed.data.ownerActionReadiness.validation.requestableCount>=2);assert.equal((await request(base,'/api/owner/reusable-build-governance',{'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN})).data.reusableBuildGovernance.validation.ok,true);}finally{await new Promise(r=>server.close(r));}
  console.log('reusable-master-governance-v1760.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
