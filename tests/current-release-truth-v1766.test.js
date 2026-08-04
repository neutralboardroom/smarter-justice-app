'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const http=require('http');
const root=path.join(__dirname,'..');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-current-release-v1766-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-current-release-v1766-token-123456789';
const truth=require('../lib/currentReleaseTruth');
const authority=require('../lib/initialPortalAuthority');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data,text:Buffer.concat(chunks).toString('utf8')});});});req.on('error',reject);req.end();});}
(async()=>{
 const pkg=require('../package.json');const manifest=require('../portal-manifest.json');
 assert.equal(pkg.version,'1.7.68');assert.equal(pkg.scripts.test.split(' && ').length,122);
 assert.equal(manifest.currentDevelopmentVersion,'1.7.68');assert.equal(manifest.latestZipName,'smarter-justice-v1.7.67.zip');assert.equal(manifest.dependencyIndependentTestParts,122);assert.equal(manifest.testSuiteParts,123);
 const html=fs.readFileSync(path.join(root,'public/control-center.html'),'utf8');const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
 assert(!html.includes('Smarter Justice v1.7.53 is the current development candidate'));
 assert(html.includes('currentReleaseTruthNotice'));assert(html.includes('currentReleaseTruthText'));assert(app.includes('renderCurrentReleaseTruth'));assert(app.includes('result.data.currentReleaseTruth'));
 const v=truth.validate();assert.equal(v.ok,true,v.errors.join('\n'));assert.equal(v.releaseVersion,'1.7.68');assert.equal(v.sourceVersion,'1.7.67');assert.equal(v.launchState,'NO_GO');assert.equal(v.deploymentAuthorized,false);
 const a=authority.validate();assert.equal(a.ok,true,a.errors.join('\n'));assert.equal(a.advancedCount,0);assert.equal(a.unchangedCount,4);assert.equal(a.completeIdentityCount,3);assert.equal(a.versionOnlyCount,1);
 assert.equal(authority.artifactFor('divorce-law-aid').version,'0.44.0');assert.equal(authority.artifactFor('divorce-law-aid').identityCompleteness,'VERSION_AND_FILENAME_ONLY');
 assert.equal(authority.artifactFor('estate-law-aid').version,'1.1.67');assert.equal(authority.artifactFor('estate-law-aid').sha256,'1b939b3d651bb3a58fd12a0366ea174f2d7d05adffbd9cebbed40d4c141f8bd3');
 assert.equal(authority.artifactFor('personal-injury-law-aid').version,'0.66.0');assert.equal(authority.artifactFor('domestic-violence-aid').version,'0.49.0');
 const cont=fs.readFileSync(path.join(root,'CONTINUATION_PROMPT_V1.7.68.md'),'utf8');assert.equal((cont.match(/^SMARTER JUSTICE$/gm)||[]).length,1);assert(cont.includes('EXPECTED NEXT VERSION IF BASE REMAINS CURRENT: v1.7.72'));assert(cont.includes('smarter-justice-v1.7.67.zip'));assert(cont.includes('SJP-2026-08-01-C14-P36-D10-V12'));assert(cont.trimEnd().endsWith('END OF SMARTER JUSTICE CENTRAL MASTER FOURTEENTH-PASS ACTIVE DEPLOYMENT FILE 4 FINAL CONTINUATION'));
 await store.init();const addr=await new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server.address())));const base=`http://127.0.0.1:${addr.port}`;
 try{
  assert.equal((await request(base,'/api/owner/current-release-truth')).status,403);
  const h={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};
  const allowed=await request(base,'/api/owner/current-release-truth',h);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.68');assert.equal(allowed.data.currentReleaseTruth.validation.ok,true);assert.equal(allowed.data.currentReleaseTruth.selectedBase.version,'1.7.67');
  const cc=await request(base,'/api/owner/control-center',h);assert.equal(cc.status,200);assert.equal(cc.data.version,'1.7.68');assert.equal(cc.data.currentReleaseTruth.validation.ok,true);assert.equal(cc.data.currentReleaseTruth.publicDisplay.currentVersion,'1.7.68');
 }finally{await new Promise(r=>server.close(r));}
 console.log('current-release-truth-v1766.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
