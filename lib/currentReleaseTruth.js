'use strict';
const truth=require('../data/currentReleaseTruthV1783');
const pair=require('./eighthPassGovernance');
const authority=require('./initialPortalAuthority');
const launchPacket=require('./ownerLaunchActionPacket');
const deployment=require('./deploymentReadiness');
const detached=require('./detachedFinalIdentity');
const unifiedLiveOperations=require('./unifiedLiveOperations');
const v14ReleaseGovernance=require('./v14ReleaseGovernance');
function clone(v){return JSON.parse(JSON.stringify(v));}
function validate(){
 const errors=[];
 if(truth.releaseVersion!=='1.7.83')errors.push('release-version');
 if(truth.selectedBase.version!=='1.7.82'||truth.selectedBase.filename!=='smarter-justice-v1.7.82.zip'||truth.selectedBase.sha256!=='61fea278a69055915e9b4b916e4b64ec514614f1746cacf659a6931ccd0228b1')errors.push('selected-base');
 if(truth.rollbackArtifact.sha256!==truth.selectedBase.sha256)errors.push('rollback-source-mismatch');
 if(truth.sourcePackage.filename!=='smarter-justice-v1.7.83.zip'||truth.sourcePackage.dependencyIndependentParts!==145)errors.push('source-package');
 if(truth.finalArchive.identityState!=='REPORTED_AFTER_IMMUTABLE_PACKAGING'||truth.finalArchive.sha256!==null||truth.finalArchive.sizeBytes!==null)errors.push('detached-final-boundary');
 if(truth.candidateArtifact.sha256&&truth.candidateArtifact.sha256===truth.selectedBase.sha256)errors.push('candidate-source-identity-reuse');
 if(truth.launchState!=='NO_GO'||truth.deploymentAuthorized!==false||truth.production.deploymentAuthorized!==false)errors.push('launch-deployment-boundary');
 if(truth.currentPromptPack?.packetSha256!=='fce42ce0927748f94189692ef5b3bf8e0fe9f8d12273287f03a68eb7bccdad6f'||truth.currentPromptPack?.packetId!=='SJP-LMP-UNIVERSAL-ONE-STEP-2026-08-03-V14-ALL-CHAT-MODES')errors.push('v14-packet');
 if(truth.v14?.mode!=='MODE_B_EXISTING_CHAT_PACKET_ONLY'||truth.v14?.finalDeliveryIdentity!=='REPORTED_AFTER_PACKAGING')errors.push('v14-boundary');
 if(truth.openAiLaunch?.launchBatchId!=='SJP-OPENAI-LIVE-2026-08-03-BATCH-02'||truth.openAiLaunch?.vendorPolicy!=='OPENAI_ONLY'||truth.openAiLaunch?.liveSmokePassed!==false)errors.push('openai-overlay');
 const p=pair.validate();if(!p.ok||p.activeReceiptId!==truth.activeMasterPair.receiptId)errors.push('active-master-pair');
 const a=authority.validate();if(!a.ok)errors.push('portal-authority');
 const l=launchPacket.validate();if(!l.ok)errors.push('owner-launch-action-packet');
 const dep=deployment.validate();if(!dep.ok)errors.push('deployment-readiness');
 const d=detached.inspect();if(d.state==='DETACHED_RECEIPT_REJECTED'||d.state==='DETACHED_RECEIPT_ARTIFACT_MISMATCH')errors.push('detached-final-identity');
 const u=unifiedLiveOperations.validate();if(!u.ok)errors.push('unified-live-operations');
 const v14=v14ReleaseGovernance.validate();if(!v14.ok)errors.push('v14-release-governance');
 return{ok:errors.length===0,errors,releaseVersion:truth.releaseVersion,sourceVersion:truth.selectedBase.version,launchState:truth.launchState,deploymentAuthorized:truth.deploymentAuthorized,portalAdvancedCount:a.advancedCount,portalUnchangedCount:a.unchangedCount,readyOwnerActionCount:l.readyNowCount,deploymentReadinessState:dep.state,finalIdentityState:d.state,aiLaunchBatchId:truth.openAiLaunch.launchBatchId,aiLiveSmokePassed:false,v14Mode:truth.v14.mode,payloadState:v14.payloadState};
}
function ownerView(){const view=clone(truth);const d=detached.inspect();view.finalArchive={...view.finalArchive,receiptState:d.state,receiptId:d.receiptId||null,receiptSha256:d.receiptSha256||null,sha256:d.artifact?.sha256||null,sizeBytes:d.artifact?.sizeBytes||null,artifactVerification:d.artifactVerification||null};return{...view,validation:validate(),portalAuthorityValidation:authority.validate(),masterPairValidation:pair.validate(),ownerLaunchActionPacketValidation:launchPacket.validate(),deploymentReadinessValidation:deployment.validate(),detachedFinalIdentity:d,unifiedLiveOperations:unifiedLiveOperations.ownerView(),v14ReleaseGovernance:v14ReleaseGovernance.ownerView()};}
module.exports={validate,ownerView};
