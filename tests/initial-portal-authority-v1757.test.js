'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const http=require('http');
const root=path.join(__dirname,'..');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-portal-authority-v1757-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-portal-authority-v1757-token-123456789';
const authority=require('../lib/initialPortalAuthority');
const currentness=require('../lib/initialPortalCurrentness');
const operating=require('../lib/legalPortfolioOperatingSystem');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
(async()=>{
  const pkg=require('../package.json');
  const manifest=require('../portal-manifest.json');
  const receipt=require('../INITIAL_PORTAL_CURRENTNESS_RECEIPT_V1.7.75.json');
  const canonical=require('../INITIAL_PORTAL_AUTHORITY_V1.7.75.json');
  assert.equal(pkg.version,'1.7.83');
  assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(manifest.testSuiteParts,146);
  assert.equal(manifest.dependencyIndependentTestParts,145);
  assert.equal(manifest.initialPortalAuthority,'INITIAL_PORTAL_AUTHORITY_V1.7.75.json');
  assert.equal(manifest.capabilities.canonicalInitialPortalAuthorityV1758,true);
  assert.equal(manifest.capabilities.strictPortalSupersessionValidationV1758,true);
  assert.equal(manifest.capabilities.protectedInitialPortalAuthorityApiV1757,true);
  assert.equal(manifest.capabilities.livePortalConnectionsV1761,false);
  assert.equal(canonical.portals.length,4);
  assert.equal(receipt.authoritySource,'INITIAL_PORTAL_AUTHORITY_V1.7.75.json');
  const valid=authority.validate();
  assert.equal(valid.ok,true,valid.errors.join('\n'));
  assert.equal(valid.status,'CURRENT_RUNTIME_AUTHORITY');
  assert.equal(valid.advancedCount,0);
  assert.equal(valid.completeIdentityCount,3);
  assert.equal(valid.versionOnlyCount,1);
  const cv=currentness.validate();
  assert.equal(cv.ok,true,cv.errors.join('\n'));
  assert.equal(cv.authoritySource,'INITIAL_PORTAL_AUTHORITY_V1.7.75.json');
  for(const row of canonical.portals){
    const a=authority.artifactFor(row.portalId);
    const p=operating.PILOTS.find(x=>x.portalId===row.portalId);
    assert.equal(a.version,row.version);
    assert.equal(p.artifact.version,row.version);
    assert.equal(p.artifact.filename,a.filename);
    assert.deepStrictEqual(p.artifact.sha256,a.sha256);
    assert.deepStrictEqual(p.artifact.sizeBytes,a.sizeBytes);
    assert.equal(p.artifact.evidenceState,a.evidenceState);
  }
  const cont=fs.readFileSync(path.join(root,'CONTINUATION_PROMPT_V1.7.66.md'),'utf8');
  assert.equal((cont.match(/EXPECTED NEXT VERSION IF BASE REMAINS CURRENT: v1\.7\.67/g)||[]).length,1);
  assert(!cont.includes('EXPECTED NEXT VERSION IF BASE REMAINS CURRENT: v1.7.63'));
  assert.equal((cont.match(/^SMARTER JUSTICE$/gm)||[]).length,1);
  assert(cont.includes('END OF EIGHTH-PASS REFINED SMARTER JUSTICE REUSABLE VERSION-NEUTRAL COMPLETE IMMEDIATE BUILD MASTER COMMAND'));
  await store.init();
  const addr=await new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server.address())));
  const base=`http://127.0.0.1:${addr.port}`;
  try{
    assert.equal((await request(base,'/api/owner/initial-portal-authority')).status,403);
    const allowed=await request(base,'/api/owner/initial-portal-authority',{'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN});
    assert.equal(allowed.status,200);
    assert.equal(allowed.data.appVersion,'1.7.83');
    assert.equal(allowed.data.initialPortalAuthority.validation.ok,true);
    assert.equal(allowed.data.initialPortalAuthority.validation.advancedCount,0);
  }finally{await new Promise(r=>server.close(r));}
  console.log('initial-portal-authority-v1757.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
