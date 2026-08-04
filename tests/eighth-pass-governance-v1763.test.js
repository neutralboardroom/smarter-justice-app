'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const http=require('http');
const root=path.join(__dirname,'..');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-eighth-pass-v1763-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-eighth-pass-v1763-token-123456789';
const governance=require('../lib/eighthPassGovernance');
const reusable=require('../lib/reusableBuildGovernance');
const authority=require('../lib/initialPortalAuthority');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
(async()=>{
 const pkg=require('../package.json');const manifest=require('../portal-manifest.json');const intake=require('../REUSABLE_MASTER_COMMAND_INTAKE_V1.7.75.json');
 assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.testSuiteParts,146);assert.equal(manifest.latestZipName,'smarter-justice-v1.7.82.zip');
 assert.equal(intake.prompt.sha256,'5dad361bae18b25dc8193ce32ca4263a72b12ce90316d6b97dbd191ce2b74223');assert.equal(intake.prompt.sizeBytes,383921);assert.equal(intake.prompt.lineCount,8204);assert.equal(intake.implementationTruthSource,'smarter-justice-v1.7.73.zip');assert.equal(intake.nextVersionDerived,'1.7.75');
 const v=governance.validate();assert.equal(v.ok,true,v.errors.join('\n'));assert.equal(v.pairEpoch,1);assert.equal(v.pairRevision,0);assert.equal(v.durableRuleCount,86);assert.equal(v.launchState,'NO_GO');
 const active=require('../CANONICAL_ACTIVE_MASTER_PAIR_V1.7.75.json');
 assert.equal(governance.classifyReplay({pairEpoch:1,pairRevision:0,receiptId:active.receiptId,receiptSha256:active.receipt.sha256,transactionId:active.transactionId}).state,'MASTER_PAIR_COMMITTED_IDEMPOTENT_REPLAY');
 assert.equal(governance.classifyReplay({pairEpoch:0,pairRevision:99,receiptId:'old',receiptSha256:'0'.repeat(64),transactionId:'old'}).state,'MASTER_PAIR_RECEIPT_REPLAY_REJECTED');
 assert.equal(governance.classifyReplay({pairEpoch:1,pairRevision:0,receiptId:'other',receiptSha256:'1'.repeat(64),transactionId:'other'}).state,'MASTER_PAIR_COMMIT_CONFLICT');
 assert.equal(governance.classifyReplay({pairEpoch:1,pairRevision:1,receiptId:'next',receiptSha256:'2'.repeat(64),transactionId:'next',predecessorReceiptId:'unknown',predecessorReceiptSha256:'3'.repeat(64)}).state,'MASTER_PAIR_RECEIPT_REPLAY_REJECTED');
 assert.equal(governance.classifyReplay({pairEpoch:1,pairRevision:1,receiptId:'next',receiptSha256:'2'.repeat(64),transactionId:'next',predecessorReceiptId:active.receiptId,predecessorReceiptSha256:active.receipt.sha256}).state,'MASTER_PAIR_PREPARED_VALIDATION_REQUIRED');
 assert.equal(governance.discoverActivePair([{pairEpoch:1,pairRevision:0,receiptId:active.receiptId,receiptSha256:active.receipt.sha256,transactionId:active.transactionId}]).state,'MASTER_PAIR_COMMITTED');
 assert.equal(governance.discoverActivePair([{pairEpoch:1,pairRevision:0,receiptId:'a',receiptSha256:'a'.repeat(64)},{pairEpoch:1,pairRevision:0,receiptId:'b',receiptSha256:'b'.repeat(64)}]).state,'MASTER_PAIR_COMMIT_CONFLICT');
 const a=authority.validate();assert.equal(a.ok,true,a.errors.join('\n'));assert.equal(a.advancedCount,0);assert.equal(a.unchangedCount,4);assert.equal(authority.artifactFor('divorce-law-aid').version,'0.44.0');assert.equal(authority.artifactFor('personal-injury-law-aid').version,'0.66.0');
 assert.equal(reusable.validate().ok,true,reusable.validate().errors.join('\n'));
 const cont=fs.readFileSync(path.join(root,'CONTINUATION_PROMPT_V1.7.75.md'),'utf8');assert.equal((cont.match(/^SMARTER JUSTICE$/gm)||[]).length,1);assert(cont.includes('EXPECTED NEXT VERSION IF BASE REMAINS CURRENT: v1.7.76'));assert(cont.includes('SJP-2026-08-02-C15-P37-D11-V13'));assert(cont.includes('`DUR-001` through `DUR-086`'));assert(cont.trimEnd().endsWith('END OF SMARTER JUSTICE CENTRAL MASTER FIFTEENTH-PASS SUNDAY LAUNCH-DAY ORCHESTRATION FINAL CONTINUATION'));
 await store.init();const addr=await new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server.address())));const base=`http://127.0.0.1:${addr.port}`;
 try{assert.equal((await request(base,'/api/owner/eighth-pass-governance')).status,403);const h={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};const allowed=await request(base,'/api/owner/eighth-pass-governance',h);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.eighthPassGovernance.validation.ok,true);assert.equal(allowed.data.eighthPassGovernance.activePair.state,'MASTER PAIR COMMITTED — PROMPT COMPATIBILITY ONLY');}finally{await new Promise(r=>server.close(r));}
 console.log('eighth-pass-governance-v1763.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
