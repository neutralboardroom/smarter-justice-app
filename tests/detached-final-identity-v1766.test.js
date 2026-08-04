'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const http=require('http');
const crypto=require('crypto');
const root=path.join(__dirname,'..');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-detached-v1766-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-detached-v1766-token-123456789';
const detached=require('../lib/detachedFinalIdentity');
const truth=require('../lib/currentReleaseTruth');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
(async()=>{
 const pkg=require('../package.json');const manifest=require('../portal-manifest.json');
 assert.equal(pkg.version,'1.7.67');assert.equal(pkg.scripts.test.split(' && ').length,120);assert.equal(manifest.dependencyIndependentTestParts,120);assert.equal(manifest.testSuiteParts,121);assert.equal(manifest.capabilities.detachedFinalArtifactIdentityVerification,true);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sj-final-id-v1766-'));const artifact=path.join(dir,'smarter-justice-v1.7.67.zip');const bytes=Buffer.from('detached immutable final identity acceptance fixture');fs.writeFileSync(artifact,bytes);const h=crypto.createHash('sha256').update(bytes).digest('hex');
 const receipt={schema:'smarter-justice-detached-final-artifact-identity',schemaVersion:'1.0.0',receiptId:'SJFIR-V1766-TEST-0001',receiptEpoch:1,receiptRevision:0,identityMode:'DETACHED_AFTER_IMMUTABLE_PACKAGING',issuedAt:'2026-08-01T00:35:00-04:00',sourcePackageVersion:'1.7.67',artifact:{version:'1.7.67',filename:'smarter-justice-v1.7.67.zip',hashAlgorithm:'SHA-256',sha256:h,sizeBytes:bytes.length},launchState:'NO_GO',deploymentAuthorized:false,scope:'FINAL_ARCHIVE_IDENTITY_ONLY_NOT_DEPLOYMENT_OR_LIVE_ACCEPTANCE'};
 assert.equal(detached.validateReceiptObject(receipt).ok,true);
 const rp=path.join(dir,'receipt.json');fs.writeFileSync(rp,JSON.stringify(receipt));
 assert.equal(detached.inspect({receiptPath:rp}).state,'DETACHED_RECEIPT_BOUND_ARTIFACT_NOT_REPRODUCED');
 const verified=detached.inspect({receiptPath:rp,artifactPath:artifact});assert.equal(verified.state,'DETACHED_RECEIPT_AND_ARTIFACT_VERIFIED');assert.equal(verified.artifactVerification.ok,true);
 const replay=JSON.parse(JSON.stringify(receipt));replay.artifact.version='1.7.64';replay.artifact.filename='smarter-justice-v1.7.65.zip';assert(detached.validateReceiptObject(replay).errors.includes('replay-or-wrong-release'));
 fs.appendFileSync(artifact,'tamper');assert.equal(detached.inspect({receiptPath:rp,artifactPath:artifact}).state,'DETACHED_RECEIPT_ARTIFACT_MISMATCH');
 assert.equal(truth.validate().ok,true,truth.validate().errors.join('\n'));
 await store.init();const addr=await new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server.address())));const base=`http://127.0.0.1:${addr.port}`;
 try{assert.equal((await request(base,'/api/owner/final-artifact-identity')).status,403);const hds={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};const allowed=await request(base,'/api/owner/final-artifact-identity',hds);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.67');assert.equal(allowed.data.detachedFinalIdentity.inspection.state,'DETACHED_RECEIPT_NOT_CONFIGURED');const cc=await request(base,'/api/owner/control-center',hds);assert.equal(cc.status,200);assert.equal(cc.data.detachedFinalIdentity.inspection.state,'DETACHED_RECEIPT_NOT_CONFIGURED');}
 finally{await new Promise(r=>server.close(r));}
 console.log('detached-final-identity-v1766.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
