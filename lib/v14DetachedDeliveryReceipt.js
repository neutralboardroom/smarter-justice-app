'use strict';
const fs=require('fs');const path=require('path');const crypto=require('crypto');
const ROOT=path.join(__dirname,'..');
const contract=require('../V14_DETACHED_FINAL_DELIVERY_RECEIPT_CONTRACT_V1.7.83.json');
function sha(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function clone(v){return JSON.parse(JSON.stringify(v));}
function readJson(root,name){return JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));}
function fileIdentity(file){const bytes=fs.readFileSync(file);return{sha256:sha(bytes),size_bytes:bytes.length};}
function inventoryIdentity(root,name){const bytes=fs.readFileSync(path.join(root,name));const records=bytes.toString('utf8').trimEnd().split('\n').filter(Boolean).length;return{sha256:sha(bytes),record_count:records};}
function embeddedEvidence(root=ROOT){
 const candidate=readJson(root,contract.embedded_candidate_acceptance);const truth=readJson(root,'CURRENT_RELEASE_TRUTH_V1.7.83.json');
 const payload=inventoryIdentity(root,contract.release_payload_inventory),legacy=inventoryIdentity(root,contract.legacy_inventory);
 return{candidate,truth,payload,legacy,owner_receipt_sha256:sha(fs.readFileSync(path.join(root,contract.embedded_owner_receipt)))};
}
function createReceipt({artifactPath,twinArtifactPath,root=ROOT,issuedAt=new Date().toISOString()}={}){
 if(!artifactPath||!twinArtifactPath)throw new Error('artifact-and-twin-required');
 const finalIdentity=fileIdentity(artifactPath),twinIdentity=fileIdentity(twinArtifactPath),e=embeddedEvidence(root);
 const c=e.candidate?.candidate||e.candidate?.candidate_artifact||e.candidate?.candidateArtifact||{};
 const source=e.truth?.selectedBase||{};const sourcePackage=e.truth?.sourcePackage||{};
 return{schema_id:contract.receipt_schema_id,receipt_location:contract.receipt_location,issued_at:issuedAt,release_version:contract.release_version,final_filename:path.basename(artifactPath),final_sha256:finalIdentity.sha256,final_size_bytes:finalIdentity.size_bytes,deterministic_twin_sha256:twinIdentity.sha256,deterministic_twin_size_bytes:twinIdentity.size_bytes,deterministic_twins_identical:finalIdentity.sha256===twinIdentity.sha256&&finalIdentity.size_bytes===twinIdentity.size_bytes,candidate_sha256:c.sha256||e.truth?.candidateArtifact?.sha256||null,candidate_size_bytes:c.size_bytes||c.sizeBytes||e.truth?.candidateArtifact?.sizeBytes||null,candidate_acceptance_state:e.candidate?.state||e.truth?.candidateArtifact?.state||null,starting_artifact_sha256:source.sha256||contract.exact_source_artifact.sha256,package_json_sha256:sourcePackage.packageJsonSha256||null,package_lock_sha256:sourcePackage.packageLockSha256||null,sbom_sha256:sourcePackage.sbomSha256||null,payload_inventory_sha256:e.payload.sha256,payload_inventory_record_count:e.payload.record_count,legacy_inventory_sha256:e.legacy.sha256,legacy_inventory_record_count:e.legacy.record_count,test_log_sha256:e.truth?.workingTreeAcceptance?.testLogSha256||null,owner_receipt_sha256:e.owner_receipt_sha256,embedded_outer_identity:false,deployment_authorized:false,launch_state:'NO_GO'};
}
function validateReceipt(receipt,{artifactPath,twinArtifactPath,root=ROOT}={}){
 const errors=[];if(receipt?.schema_id!==contract.receipt_schema_id)errors.push('schema');if(receipt?.receipt_location!==contract.receipt_location)errors.push('location');if(receipt?.release_version!==contract.release_version||receipt?.final_filename!==contract.final_filename)errors.push('release-identity');
 if(receipt?.embedded_outer_identity!==false)errors.push('embedded-outer-identity');if(receipt?.deployment_authorized!==false||receipt?.launch_state!=='NO_GO')errors.push('closed-gates');
 if(artifactPath){const id=fileIdentity(artifactPath);if(receipt.final_sha256!==id.sha256||receipt.final_size_bytes!==id.size_bytes)errors.push('final-artifact');}
 if(twinArtifactPath){const id=fileIdentity(twinArtifactPath);if(receipt.deterministic_twin_sha256!==id.sha256||receipt.deterministic_twin_size_bytes!==id.size_bytes)errors.push('twin-artifact');}
 if(receipt?.deterministic_twins_identical!==true||receipt?.final_sha256!==receipt?.deterministic_twin_sha256||receipt?.final_size_bytes!==receipt?.deterministic_twin_size_bytes)errors.push('deterministic-twins');
 const expected=createReceipt({artifactPath,twinArtifactPath,root,issuedAt:receipt?.issued_at});for(const field of contract.required_comparison_fields)if(receipt?.[field]!==expected?.[field])errors.push(`comparison:${field}`);
 if(receipt?.final_sha256===receipt?.candidate_sha256)errors.push('candidate-final-identity-reuse');
 return{ok:errors.length===0,errors,comparisonFieldCount:contract.required_comparison_fields.length,finalSha256:receipt?.final_sha256||null,finalSizeBytes:receipt?.final_size_bytes||null,receiptDetached:true,deploymentAuthorized:false,launchState:'NO_GO'};
}
function ownerView(){return{contract:clone(contract),state:'POST_PACKAGE_GENERATION_READY',receiptPresentInsideArtifact:false,finalIdentityEmbedded:false,deploymentAuthorized:false,launchState:'NO_GO'};}
module.exports={sha,fileIdentity,inventoryIdentity,embeddedEvidence,createReceipt,validateReceipt,ownerView};
