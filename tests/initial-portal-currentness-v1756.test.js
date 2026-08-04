'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.join(__dirname,'..');
function digest(file){return crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');}
const pkg=require('../package.json');
const manifest=require('../portal-manifest.json');
const truth=require('../PORTFOLIO_TRUTH_V1.7.75.json');
const registry=require('../ARTIFACT_REGISTRY_V1.7.68.json');
const receipt=require('../INITIAL_PORTAL_CURRENTNESS_RECEIPT_V1.7.75.json');
const authority=require('../INITIAL_PORTAL_AUTHORITY_V1.7.75.json');
const currentness=require('../lib/initialPortalCurrentness');
assert.equal(pkg.version,'1.7.83');
assert.equal(pkg.scripts.test.split(' && ').length,145);
assert.equal(manifest.currentDevelopmentVersion,'1.7.83');
assert.equal(manifest.dependencyIndependentTestParts,145);
assert.equal(manifest.testSuiteParts,146);
assert.equal(manifest.initialPortalCurrentnessReceipt,'INITIAL_PORTAL_CURRENTNESS_RECEIPT_V1.7.75.json');
assert.equal(truth.currentRelease.sourceBaseline.sha256,'5ed64a1c13de1a536303b07a2277e234a822b9bc316b7ea97cf2547e90811898');
assert.equal(truth.currentRelease.rollbackArtifact,'smarter-justice-v1.7.73.zip');
assert.equal(registry.artifacts[0].version,'1.7.67');
assert.equal(registry.artifacts[0].evidenceState,'CURRENT_CHAT_REPRODUCED');
assert.equal(receipt.portals.length,4);
for(const expected of authority.portals){
  const row=receipt.portals.find(x=>x.portalId===expected.portalId);assert(row,expected.portalId);
  for(const key of ['version','artifactFilename','ownerRecordedSha256','ownerRecordedSizeBytes','identityCompleteness','evidenceState','independentlyVerifiedInThisBuild']){
    assert.deepStrictEqual(row[key],expected[key],`${expected.portalId}:${key}`);
  }
}
const validation=currentness.validate();
assert.equal(validation.ok,true,validation.errors.join('\n'));
assert.equal(validation.status,'CURRENT_RUNTIME_AUTHORITY');
const view=require('../lib/portfolioTruth').ownerView();
assert.equal(view.initialPortalCurrentness.validation.ok,true);
assert.equal(view.summary.initialPortalCurrentnessConflicts,0);
const preservation=require('../PUBLIC_SURFACE_PRESERVATION_ACCEPTANCE_V1.7.75.json');
for(const row of preservation.files){if(row.path==='public/app.js')continue;assert.equal(digest(row.path),row.sha256,row.path);}const currentApp=fs.readFileSync(path.join(root,'public/app.js'),'utf8');assert(currentApp.includes('does not create an attorney-client relationship'));assert(currentApp.includes('non-AI'));
assert.equal(truth.currentRelease.launchState,'NO_GO');
console.log('initial-portal-currentness-v1756.test.js passed');
