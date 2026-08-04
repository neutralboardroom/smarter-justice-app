'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const http=require('http');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-evidence-coverage-v1777-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-evidence-coverage-v1777-token-123456789';
const coverage=require('../lib/releaseEvidenceCoverage');
const store=require('../lib/store');
const server=require('../server');
function clone(v){return JSON.parse(JSON.stringify(v));}
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
(async()=>{
 const pkg=require('../package.json'),manifest=require('../portal-manifest.json'),report=require('../PRODUCT_AND_PROMPT_DUAL_IMPROVEMENT_REPORT_V1.7.83.json'),next=require('../NEXT_VERSION_IMPROVEMENT_LIST.json'),truth=require('../CURRENT_RELEASE_TRUTH_V1.7.83.json'),contract=require('../RELEASE_EVIDENCE_COVERAGE_CONTRACT_V1.7.83.json');
 assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.testSuiteParts,146);assert.equal(contract.required_prior_backlog_ids.length,32);
 const valid=coverage.validate();assert.equal(valid.ok,true,valid.errors.join('\n'));assert.equal(valid.requiredBacklogCount,32);assert.equal(valid.currentBacklogCount,34);assert(valid.referencedFileCount>=10);assert.equal(valid.referencedTestCount,3);assert.equal(valid.deploymentAuthorized,false);
 const dropped=clone(next);dropped.items=dropped.items.filter(x=>x.id!==contract.required_prior_backlog_ids[0]);assert(coverage.validate({next:dropped}).errors.some(x=>x.startsWith('dropped-backlog:')));
 const missing=clone(report);missing.product_platform_improvements[0].affected_files_records_or_systems.push('missing/current/evidence.txt');assert(coverage.validate({report:missing}).errors.includes('missing-evidence:missing/current/evidence.txt'));
 const packageWithoutTest=clone(pkg);packageWithoutTest.scripts.test=packageWithoutTest.scripts.test.replace(' && node tests/v14-evidence-readiness-planner-v1782.test.js','');assert(coverage.validate({pkg:packageWithoutTest}).errors.includes('test-counts'));assert(coverage.validate({pkg:packageWithoutTest}).errors.includes('test-not-in-suite:tests/v14-evidence-readiness-planner-v1782.test.js'));
 const unreviewed=clone(report);unreviewed.prior_limitations_reviewed=[];assert(coverage.validate({report:unreviewed}).errors.some(x=>x.startsWith('unreviewed-prior-limitation:')));
 const reused=clone(truth);reused.candidateArtifact.sha256=contract.source_artifact.sha256;assert(coverage.validate({truth:reused}).errors.includes('candidate-source-sha-reuse'));
 await store.init();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;try{assert.equal((await request(base,'/api/owner/release-evidence-coverage')).status,403);const headers={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};const allowed=await request(base,'/api/owner/release-evidence-coverage',headers);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.releaseEvidenceCoverage.validation.ok,true);const cc=await request(base,'/api/owner/control-center',headers);assert.equal(cc.status,200);assert.equal(cc.data.releaseEvidenceCoverage.validation.currentBacklogCount,34);}finally{await new Promise(r=>server.close(r));}
 console.log('release-evidence-coverage-v1777.test.js passed');
})().catch(error=>{console.error(error);try{server.close(()=>{});}catch{}process.exit(1);});
