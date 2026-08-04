'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const http=require('http');
const root=path.join(__dirname,'..');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-reusable-v1759-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-reusable-v1759-token-123456789';
const governance=require('../lib/reusableBuildGovernance');
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
  const launch=require('../LAUNCH_CAPABILITY_MATRIX_V1.7.68.json');
  const actions=require('../OWNER_ACTION_QUEUE_V1.7.68.json');
  const learning=require('../LEARNING_LINEAGE_AND_PROPAGATION_REGISTER_V1.7.68.json');
  const commercial=require('../CENTRAL_COMMERCIAL_ARCHITECTURE_V1.7.68.json');
  const matterAi=require('../MATTER_PATH_AND_AI_BOUNDARY_V1.7.68.json');
  const recon=require('../FINAL_V1.7.63_TRUTH_RECONCILIATION_V1.7.68.json');
  assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(manifest.testSuiteParts,146);assert.equal(manifest.dependencyIndependentTestParts,145);
  assert.equal(manifest.releaseEvidence,'RELEASE_EVIDENCE_V1.7.83.json');assert.equal(manifest.initialPortalAuthority,'INITIAL_PORTAL_AUTHORITY_V1.7.75.json');
  for(const k of ['reusableMasterCommandIntegrityV1759','launchCapabilityMatrixV1759','activeOwnerActionQueueV1759','learningLineagePropagationV1759','centralCommercialNonduplicationV1759','matterPathAiBoundaryV1759','protectedReusableBuildGovernanceApiV1759','fourthPassReusableMasterGovernanceV1761','versionNeutralPortalAuthorityDiscoveryV1761','bindingMonthly15CommercialManifestV1761','publicFreemiumFloorV1761'])assert.equal(manifest.capabilities[k],true,k);
  for(const k of ['livePortalConnectionsV1759','liveBillingV1759','liveExternalAiV1759','livePortalConnectionsV1761','liveBillingV1761','liveExternalAiV1761'])assert.equal(manifest.capabilities[k],false,k);
  assert.equal(intake.prompt.sha256,'5dad361bae18b25dc8193ce32ca4263a72b12ce90316d6b97dbd191ce2b74223');assert.equal(intake.prompt.sizeBytes,383921);assert.equal(intake.prompt.lineCount,8204);assert.equal(intake.prompt.openingMarkerVerified,true);assert.equal(intake.prompt.finalMarkerVerified,true);assert.equal(intake.implementationTruthSource,'smarter-justice-v1.7.73.zip');assert.equal(intake.nextVersionDerived,'1.7.75');
  assert.equal(recon.sourceArtifact.sha256,'80efad7967acb44f5d28add7f1cadfc3d3a123a1a4a681cc56d13ea061c52f73');
  assert.equal(launch.overallState,'NO_GO');assert.equal(launch.tiers.length,5);assert.equal(launch.deployment.authorized,false);
  assert(actions.requests.length>=9);assert(actions.requests.every(x=>!/(api key|password|webhook secret|database url).*paste/i.test(x.ownerAction||'')));
  assert(learning.items.length>=6);
  assert.equal(commercial.centralRelationship.stripeCustomer,'ONE_CENTRAL_CUSTOMER_WHERE_APPLICABLE');assert.equal(commercial.currentMonthlyStructure.attorneyCents,1500);assert.equal(commercial.currentMonthlyStructure.firmProfileCents,1500);assert.equal(commercial.currentMonthlyStructure.firmCoveredAttorneySeatCents,1500);assert.equal(commercial.currentMonthlyStructure.onePayerPerAttorneySeat,true);assert.equal(commercial.publicCheckout,false);assert.equal(commercial.liveBilling,false);assert.equal(commercial.futureLeadIntegrations.every(x=>x.initialLaunchDependency===false),true);
  assert.equal(matterAi.aiAssistance.externalProviderRequiredForTierA,false);assert.equal(matterAi.aiAssistance.liveExternalAi,false);assert(matterAi.matterPathEngine.capabilities.includes('staff why-this-path-was-chosen explanation'));
  const g=governance.validate();assert.equal(g.ok,true,g.errors.join('\n'));
  const a=authority.validate();assert.equal(a.ok,true,a.errors.join('\n'));assert.equal(a.advancedCount,0);
  const cv=currentness.validate();assert.equal(cv.ok,true,cv.errors.join('\n'));
  for(const row of authority.ownerView().portals){assert.equal(operating.PILOTS.find(x=>x.portalId===row.portalId).artifact.version,row.version);}
  const cont=fs.readFileSync(path.join(root,'CONTINUATION_PROMPT_V1.7.75.md'),'utf8');assert.equal((cont.match(/^SMARTER JUSTICE$/gm)||[]).length,1);assert(cont.includes('EXPECTED NEXT VERSION IF BASE REMAINS CURRENT: v1.7.76'));assert(!cont.includes('EXPECTED NEXT VERSION IF BASE REMAINS CURRENT: v1.7.63'));assert(cont.includes('END OF SMARTER JUSTICE CENTRAL MASTER FIFTEENTH-PASS SUNDAY LAUNCH-DAY ORCHESTRATION FINAL CONTINUATION'));
  await store.init();const addr=await new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server.address())));const base=`http://127.0.0.1:${addr.port}`;
  try{assert.equal((await request(base,'/api/owner/reusable-build-governance')).status,403);const allowed=await request(base,'/api/owner/reusable-build-governance',{'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN});assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.reusableBuildGovernance.validation.ok,true);assert(allowed.data.reusableBuildGovernance.ownerActions.requests.length>=9);}finally{await new Promise(r=>server.close(r));}
  console.log('reusable-master-governance-v1759.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
