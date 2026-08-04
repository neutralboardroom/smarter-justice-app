'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const pkg=require('../package.json');
assert.equal(pkg.version,'1.7.83');
assert.equal(pkg.scripts.test.split(' && ').length,145);
assert.equal(require('../server-version-helper').version,'1.7.83');
for(const f of [
  'AUDIT_REPORT_V1.7.34.md','CHANGE_MAP_V1.7.34.md','NO_CHANGE_LEDGER_V1.7.34.md','CONTINUATION_PROMPT_V1.7.34.md',
  'RELEASE_EVIDENCE_V1.7.34.json','PROFILE_GROWTH_REPORT_V1.7.34.json','CURRENT_ENVIRONMENT_REVIEW_V1.7.34.json',
  'CONTINUOUS_IMPROVEMENT_RECORD_V1.7.34.json','CURRENT_WATCHLIST_V1.7.34.json','PORTAL_RELEASE_SNAPSHOT_V1.7.34.json',
  'PORTFOLIO_TRUTH_V1.7.34.json','DASHBOARD_CONTRACTS_V1.7.34.json','DASHBOARD_CONFORMANCE_V1.7.34.json',
  'STORAGE_CONSERVATION_V1.7.34.json','NEUTRAL_BOARDROOM_HANDOFF_V1.7.34.json','LEGAL_NETWORK_ACTION_CENTER_V1.7.34.json'
])assert(fs.existsSync(path.join(root,f)),f);
const evidence=require('../RELEASE_EVIDENCE_V1.7.34.json');
assert.equal(evidence.version,'1.7.34');
assert.equal(evidence.deployment.deployed,false);
assert.equal(evidence.activationGatesChanged,false);
for(const key of ['legalNetworkActionCenter','deterministicRecommendations','ownerDispositions','evidenceFingerprintResurfacing','unifiedPortalTruthRegistry','controlCenterTruthReconciliation','legalWorkspaceTruthReconciliation','detachedSelfArtifactIdentity','neutralBoardroomPrimaryActionHandoff','currentFacingReleaseTruthRepair'])assert.equal(evidence.implementation[key],true,key);
for(const key of ['liveNeutralBoardroomIntegration','automaticNeutralBoardroomWrites','automaticPortalActions','crossPillarAdministration','centralizedPublicUserMatterData','automaticCrossRepositorySynchronization'])assert.equal(evidence.implementation[key],false,key);
assert.equal(evidence.profileGrowth.newProfessionals,0);
assert.equal(evidence.profileGrowth.publicDirectory.total,281);
assert.equal(evidence.testing.suiteParts,90);
const manifest=require('../portal-manifest.json');
assert.equal(manifest.currentDevelopmentVersion,'1.7.83');
assert.equal(manifest.lastExactArtifactTestVersion,'1.7.82');
assert.equal(manifest.testSuiteParts,146);
assert.equal(manifest.releaseEvidence,'RELEASE_EVIDENCE_V1.7.83.json');
assert.equal(manifest.currentDevelopmentArtifactIdentityMode,'DETACHED_AFTER_PACKAGING');
for(const key of ['legalNetworkActionCenterV1734','deterministicOwnerRecommendationsV1734','legalNetworkActionDispositionsV1734','evidenceFingerprintResurfacingV1734','unifiedTwentyFivePortalTruthV1734','controlCenterTruthReconciliationV1734','legalWorkspaceTruthReconciliationV1734','detachedSelfArtifactIdentityV1734','neutralBoardroomPrimaryActionHandoffV1734','currentFacingReleaseTruthRepairV1734'])assert.equal(manifest.capabilities[key],true,key);
for(const key of ['liveNeutralBoardroomIntegrationV1734','automaticNeutralBoardroomWritesV1734','automaticLegalPortalActionsV1734','crossPillarAdministrationV1734','centralizedPublicUserMatterDataV1734','profileGrowthBatchV1734'])assert.equal(manifest.capabilities[key],false,key);
const sbom=require('../SBOM.spdx.json');
assert(sbom.name.includes('1.7.83'));
assert(sbom.documentNamespace.includes('/1.7.83/'));
assert.equal(sbom.packages.length,15);
const next=require('../NEXT_VERSION_IMPROVEMENT_LIST.json');
assert.equal(next.releaseVersion,'1.7.83');
assert(next.baselineArtifact.includes('v1.7.82.zip'));
assert.equal(next.currentReleasePriorities.length,8);
const storage=require('../STORAGE_CONSERVATION_V1.7.34.json');
assert.equal(storage.removedFileCount,1);
assert.equal(storage.removedBytes,125438);
assert(!fs.existsSync(path.join(root,'CONTINUATION_PROMPT_V1.7.11.md')));
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
const notes=fs.readFileSync(path.join(root,'RELEASE_NOTES.md'),'utf8');
assert(readme.startsWith('# Smarter Justice v1.7.83'));
assert(readme.includes('One Smarter Justice professional identity'));
assert(notes.includes('v1.7.34 — Legal-Network Action Center'));
console.log('release-governance-v1734.test.js passed');
