'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const config=require('../data/detachedFinalIdentityV1783');
function sha256Buffer(b){return crypto.createHash('sha256').update(b).digest('hex');}
function clone(v){return JSON.parse(JSON.stringify(v));}
function isSha(v){return /^[a-f0-9]{64}$/.test(String(v||''));}
function validateReceiptObject(receipt,expected=config.expectedArtifact){
 const errors=[];
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))return{ok:false,errors:['receipt-object']};
 if(receipt.schema!==config.receiptSchema||receipt.schemaVersion!==config.schemaVersion)errors.push('schema');
 if(!/^SJFIR-[A-Z0-9-]{8,96}$/.test(String(receipt.receiptId||'')))errors.push('receipt-id');
 if(!Number.isInteger(receipt.receiptEpoch)||receipt.receiptEpoch<1||!Number.isInteger(receipt.receiptRevision)||receipt.receiptRevision<0)errors.push('receipt-order');
 if(receipt.identityMode!=='DETACHED_AFTER_IMMUTABLE_PACKAGING')errors.push('identity-mode');
 const a=receipt.artifact||{};
 if(a.version!==expected.version||a.filename!==expected.filename)errors.push('replay-or-wrong-release');
 if(a.hashAlgorithm!=='SHA-256'||!isSha(a.sha256))errors.push('artifact-sha256');
 if(!Number.isSafeInteger(a.sizeBytes)||a.sizeBytes<=0)errors.push('artifact-size');
 if(receipt.sourcePackageVersion!==expected.version)errors.push('source-version');
 if(receipt.launchState!=='NO_GO'||receipt.deploymentAuthorized!==false)errors.push('launch-deployment-boundary');
 return{ok:errors.length===0,errors,receiptId:receipt.receiptId||null,receiptEpoch:receipt.receiptEpoch??null,receiptRevision:receipt.receiptRevision??null,artifact:clone(a)};
}
function verifyArtifactFile(artifactPath,receipt){
 try{
  const st=fs.statSync(artifactPath);if(!st.isFile())return{ok:false,errors:['artifact-not-file']};
  const b=fs.readFileSync(artifactPath);const h=sha256Buffer(b);const a=receipt.artifact||{};const errors=[];
  if(path.basename(artifactPath)!==a.filename)errors.push('artifact-filename');
  if(h!==a.sha256)errors.push('artifact-sha256-mismatch');
  if(b.length!==a.sizeBytes)errors.push('artifact-size-mismatch');
  return{ok:errors.length===0,errors,sha256:h,sizeBytes:b.length,filename:path.basename(artifactPath)};
 }catch(err){return{ok:false,errors:['artifact-read-failed'],detail:err.code||err.message};}
}
function inspect(options={}){
 const receiptPath=String(options.receiptPath||process.env[config.env.receiptPath]||'').trim();
 const artifactPath=String(options.artifactPath||process.env[config.env.artifactPath]||'').trim();
 if(!receiptPath)return{state:'DETACHED_RECEIPT_NOT_CONFIGURED',configured:false,releaseVersion:config.releaseVersion,expectedArtifact:clone(config.expectedArtifact),launchState:'NO_GO',deploymentAuthorized:false};
 let bytes;try{bytes=fs.readFileSync(receiptPath);}catch(err){return{state:'DETACHED_RECEIPT_REJECTED',configured:true,errors:['receipt-read-failed'],detail:err.code||err.message,releaseVersion:config.releaseVersion};}
 if(bytes.length>config.maxReceiptBytes)return{state:'DETACHED_RECEIPT_REJECTED',configured:true,errors:['receipt-too-large'],releaseVersion:config.releaseVersion};
 let receipt;try{receipt=JSON.parse(bytes.toString('utf8'));}catch{return{state:'DETACHED_RECEIPT_REJECTED',configured:true,errors:['receipt-json'],receiptSha256:sha256Buffer(bytes),releaseVersion:config.releaseVersion};}
 const validation=validateReceiptObject(receipt);
 if(!validation.ok)return{state:'DETACHED_RECEIPT_REJECTED',configured:true,errors:validation.errors,receiptSha256:sha256Buffer(bytes),releaseVersion:config.releaseVersion};
 const base={state:'DETACHED_RECEIPT_BOUND_ARTIFACT_NOT_REPRODUCED',configured:true,receiptSha256:sha256Buffer(bytes),receiptId:receipt.receiptId,receiptEpoch:receipt.receiptEpoch,receiptRevision:receipt.receiptRevision,artifact:clone(receipt.artifact),releaseVersion:config.releaseVersion,launchState:'NO_GO',deploymentAuthorized:false};
 if(!artifactPath)return base;
 const artifactVerification=verifyArtifactFile(artifactPath,receipt);
 return{...base,state:artifactVerification.ok?'DETACHED_RECEIPT_AND_ARTIFACT_VERIFIED':'DETACHED_RECEIPT_ARTIFACT_MISMATCH',artifactVerification};
}
function receiptTemplate(){return{schema:config.receiptSchema,schemaVersion:config.schemaVersion,receiptId:'SJFIR-REPLACE-AFTER-PACKAGING',receiptEpoch:1,receiptRevision:0,identityMode:'DETACHED_AFTER_IMMUTABLE_PACKAGING',issuedAt:null,sourcePackageVersion:config.releaseVersion,artifact:{version:config.expectedArtifact.version,filename:config.expectedArtifact.filename,hashAlgorithm:'SHA-256',sha256:null,sizeBytes:null},launchState:'NO_GO',deploymentAuthorized:false,scope:'FINAL_ARCHIVE_IDENTITY_ONLY_NOT_DEPLOYMENT_OR_LIVE_ACCEPTANCE'};}
function ownerView(options){return{releaseVersion:config.releaseVersion,configuration:{receiptEnvironmentVariable:config.env.receiptPath,artifactEnvironmentVariable:config.env.artifactPath,maxReceiptBytes:config.maxReceiptBytes},inspection:inspect(options),template:receiptTemplate()};}
module.exports={validateReceiptObject,verifyArtifactFile,inspect,receiptTemplate,ownerView};
