'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const http=require('http');
const root=path.join(__dirname,'..');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-truth-lifecycle-v1754-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-truth-lifecycle-v1754-token-123456789';
const governance=require('../lib/professionalLifecycleGovernance');
const initialAuthority=require('../lib/initialPortalAuthority');
const truth=require('../PORTFOLIO_TRUTH_V1.7.75.json');
const registry=require('../ARTIFACT_REGISTRY_V1.7.68.json');
const evidenceStates=require('../PORTAL_EVIDENCE_STATE_REGISTER_V1.7.68.json');
const acceptance=require('../PROFESSIONAL_LIFECYCLE_GOVERNANCE_ACCEPTANCE_V1.7.68.json');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,options={}){return new Promise((resolve,reject)=>{const url=new URL(pathname,base);const req=http.request(url,{method:options.method||'GET',headers:options.headers||{}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{const raw=Buffer.concat(chunks).toString('utf8');let data=null;try{data=JSON.parse(raw);}catch{}resolve({status:res.statusCode,headers:res.headers,raw,data});});});req.on('error',reject);req.end(options.body||'');});}
(async()=>{
  const pkg=require('../package.json');
  assert.equal(pkg.version,'1.7.83');
  assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(require('../server-version-helper').version,'1.7.83');
  assert.equal(truth.releaseVersion,'1.7.75');
  assert.equal(truth.currentRelease.sourceBaseline.sha256,'5ed64a1c13de1a536303b07a2277e234a822b9bc316b7ea97cf2547e90811898');
  assert.equal(truth.currentRelease.rollbackArtifact,'smarter-justice-v1.7.73.zip');
  assert.equal(truth.currentRelease.rollbackSha256,'5ed64a1c13de1a536303b07a2277e234a822b9bc316b7ea97cf2547e90811898');
  for(const expected of initialAuthority.ownerView().portals){
    const row=truth.portals.find(x=>x.portalId===expected.portalId);assert(row,expected.portalId);
    assert.equal(row.version,expected.version);assert.equal(row.artifact,expected.artifactFilename);
    assert.deepStrictEqual(row.sha256,expected.ownerRecordedSha256);assert.deepStrictEqual(row.sizeBytes,expected.ownerRecordedSizeBytes);
    assert.equal(row.evidenceState,expected.evidenceState);assert.equal(row.independentlyVerifiedInThisBuild,false);
    assert.equal(row.releaseId,`release:${expected.portalId}:${expected.version}`);
  }
  assert.equal(registry.artifacts[0].evidenceState,'CURRENT_CHAT_REPRODUCED');
  assert.equal(registry.artifacts[0].role,'SOURCE_AND_IMMEDIATE_ROLLBACK');
  assert.equal(evidenceStates.portals.length,4);
  assert.equal(acceptance.releaseVersion,'1.7.68');
  assert.equal(acceptance.billingActivationGateOpen,false);
  assert.equal(acceptance.opportunityDeliveryGateOpen,false);

  const valid=governance.validatePolicy();assert.equal(valid.ok,true,valid.errors.join(','));
  const central=governance.projectionDecision({field:'displayName',centralRevision:4,portalRevision:3,sourceRevision:3});assert.equal(central.accepted,true);assert.equal(central.conflictState,'CENTRAL_NEWER');
  const portal=governance.projectionDecision({field:'portalNarrative',centralRevision:2,portalRevision:5,sourceRevision:4});assert.equal(portal.accepted,true);assert.equal(portal.conflictState,'PORTAL_NEWER');
  const blocked=governance.projectionDecision({field:'portalNarrative',centralRevision:6,portalRevision:5});assert.equal(blocked.accepted,false);assert.equal(blocked.conflictState,'MANUAL_REVIEW_REQUIRED');
  const suppression=governance.projectionDecision({field:'displayName',centralRevision:2,portalRevision:2,centralSuppressed:true,portalSuppressed:false});assert.equal(suppression.conflictState,'SUPPRESSION_CONFLICT');
  const packet=governance.correctionPacket({entityId:'professional:1',portalId:'divorce-law-aid',field:'displayName',priorValue:'Old',proposedValue:'New',centralRevision:4,portalRevision:3,sourceRevision:3,source:'approved claimant correction',sourceDate:'2026-07-30'});assert.equal(packet.automaticWriteBack,false);assert.equal(packet.rollbackAvailable,true);assert(/^[a-f0-9]{64}$/.test(packet.receiptDigest));
  const billing=governance.billingDecision({applicationApproved:true,signedWebhookVerified:true,paymentSucceeded:true,termsVersion:'1',priceVersion:'1',seatCoverageVerified:true,professionalEligible:true});assert.equal(billing.activate,false);assert.equal(billing.state,'GATE_CLOSED');assert.equal(billing.paymentChangesProfileFacts,false);
  const opportunity=governance.opportunityDecision({portalEligible:true,professionalVerified:true,seatEligible:true,membershipThresholdMet:true,conflictCheckReady:true,capacityAvailable:true,userConsent:true,sponsorship:true});assert.equal(opportunity.eligible,false);assert(opportunity.forbiddenInputs.includes('sponsorship'));assert.equal(opportunity.automaticAssignment,false);assert.equal(opportunity.representationCreated,false);
  const envelope=governance.notificationEnvelope('payment_received',{caseId:'case-1',email:'private@example.com',message:'Highly sensitive legal narrative',safeContactChoice:'do not call',checkoutUrl:'https://smarterjustice.com/receipt',amountTotal:1200,currency:'usd',idempotencyKey:'idem-12345678'});assert.equal(envelope.classification,'BILLING_TRANSACTIONAL');assert.equal(envelope.containsMatterNarrative,false);assert.equal(envelope.workflowStateIndependent,true);assert(!JSON.stringify(envelope.safePayload).includes('sensitive legal'));assert(!JSON.stringify(envelope).includes('private@example.com'));assert(!JSON.stringify(envelope).includes('do not call'));assert(/^[a-f0-9]{64}$/.test(envelope.idempotencyKeyHash));
  assert.equal(governance.projectionDecision({field:'unknownField'}).accepted,false);

  const manifest=require('../portal-manifest.json');assert.equal(manifest.currentDevelopmentVersion,'1.7.83');assert.equal(manifest.testSuiteParts,146);assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.latestZipName,'smarter-justice-v1.7.82.zip');assert.equal(manifest.capabilities.livePortalConnectionsV1761,false);
  const sbom=require('../SBOM.spdx.json');assert.equal(sbom.name,'Smarter Justice 1.7.83 dependency SBOM');assert.equal(sbom.creationInfo.created,'2026-08-03T00:00:00.000Z');assert(/^https:\/\/smarterjustice\.com\/sbom\/1\.7\.83\/[a-f0-9]{32}$/.test(sbom.documentNamespace));assert.equal(sbom.packages.length,15);
  const sbomScript=fs.readFileSync(path.join(root,'scripts','generate-sbom.js'),'utf8');assert(!sbomScript.includes('randomUUID'));assert(sbomScript.includes('namespaceDigest'));
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');assert(readme.startsWith('# Smarter Justice v1.7.83'));assert(readme.includes('smarter-justice-v1.7.82.zip'));assert(readme.includes('145 dependency-independent commands'));
  const continuation=fs.readFileSync(path.join(root,'CONTINUATION_PROMPT_V1.7.75.md'),'utf8');assert(continuation.includes('BEGIN NOW'));assert(continuation.includes('EXPECTED NEXT VERSION IF BASE REMAINS CURRENT: v1.7.76'));assert(/(?:final\s+detached|detached\s+final)\s+delivery\s+receipt/i.test(continuation));
  const serverSource=fs.readFileSync(path.join(root,'server.js'),'utf8');assert(serverSource.includes('/api/owner/professional-lifecycle-governance'));assert(serverSource.includes('notificationEnvelope'));assert(serverSource.includes('idempotencyKeyHash'));

  await store.init();
  const address=await new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address())));const base=`http://127.0.0.1:${address.port}`;
  try{
    assert.equal((await request(base,'/api/owner/professional-lifecycle-governance')).status,403);
    const allowed=await request(base,'/api/owner/professional-lifecycle-governance',{headers:{'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN}});assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.governance.validation.ok,true);assert.equal(allowed.data.governance.summary.openCommercialGates.length,0);
    const portfolio=await request(base,'/api/owner/portfolio-truth',{headers:{'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN}});assert.equal(portfolio.status,200);assert.equal(portfolio.data.appVersion,'1.7.83');assert.equal(portfolio.data.portfolioTruth.releaseVersion,'1.7.75');assert.equal(portfolio.data.portfolioTruth.validation.ok,true,portfolio.data.portfolioTruth.validation.errors.join(','));
    const health=await request(base,'/health');assert.equal(health.status,200);assert.equal(health.data.version,'1.7.83');
  }finally{await new Promise(resolve=>server.close(resolve));}
  console.log('truth-lifecycle-governance-v1754.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
