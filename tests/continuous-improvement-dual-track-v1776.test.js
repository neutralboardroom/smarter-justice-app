'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const http=require('http');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-dual-track-v1776-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-dual-track-v1776-token-123456789';
const improvement=require('../lib/continuousImprovement');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
(async()=>{
 const pkg=require('../package.json'),manifest=require('../portal-manifest.json'),plan=require('../CONTINUOUS_SELF_IMPROVEMENT_AND_INNOVATION_PLAN_V1.7.82.json'),report=require('../PRODUCT_AND_PROMPT_DUAL_IMPROVEMENT_REPORT_V1.7.82.json'),learning=require('../CROSS_VERSION_LEARNING_LEDGER_V1.7.82.json');
 assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.testSuiteParts,146);assert.equal(manifest.capabilities.continuousSelfImprovementV12,true);assert.equal(manifest.capabilities.productAndPromptDualProgressGateV1776,true);
 assert.equal(plan.governing_packet.sha256,'fce42ce0927748f94189692ef5b3bf8e0fe9f8d12273287f03a68eb7bccdad6f');assert.equal(plan.product.starting_artifact_sha256,'34c1928567993f40ead33fe5335a479e7e3e735f0e3911b3835952668f393d86');assert.equal(plan.strongest_justified_set_selected,true);
 const valid=improvement.validate();assert.equal(valid.ok,true,valid.errors.join('\n'));assert.equal(valid.productPlatformTrackPassed,true);assert.equal(valid.builderPromptSystemTrackPassed,true);assert.equal(valid.ordinaryMaterialReleaseAuthorized,true);assert.equal(valid.deploymentAuthorized,false);
 assert.equal(improvement.validate({...report,product_platform_improvements:[]}).ordinaryMaterialReleaseAuthorized,false);assert.equal(improvement.validate({...report,builder_prompt_system_improvements:[]}).ordinaryMaterialReleaseAuthorized,false);assert.equal(improvement.validate({...report,hard_constraints_preserved:false,dual_track_gate:{...report.dual_track_gate,ordinary_material_release_authorized:false}}).ordinaryMaterialReleaseAuthorized,false);
 const brokenLearning={...learning,lessons:learning.lessons.map((x,i)=>i?x:{...x,builder_prompt_system_change_made:''})};assert.equal(improvement.validate(report,brokenLearning,plan).ordinaryMaterialReleaseAuthorized,false);
 assert(report.product_platform_improvements[0].affected_files_records_or_systems.includes('V14_EVIDENCE_READINESS_PLANNER_CONTRACT_V1.7.82.json'));assert(report.builder_prompt_system_improvements[0].affected_files_or_artifacts.includes('lib/v14SegmentedAcceptanceRunner.js'));assert.equal(learning.lessons.length,2);assert(learning.lessons.every(x=>x.product_change_made&&x.builder_prompt_system_change_made));
 await store.init();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;try{assert.equal((await request(base,'/api/owner/continuous-improvement')).status,403);const headers={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};const allowed=await request(base,'/api/owner/continuous-improvement',headers);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.continuousImprovement.validation.ordinaryMaterialReleaseAuthorized,true);const cc=await request(base,'/api/owner/control-center',headers);assert.equal(cc.status,200);assert.equal(cc.data.continuousImprovement.validation.ok,true);}finally{await new Promise(r=>server.close(r));}
 console.log('continuous-improvement-dual-track-v1776.test.js passed');
})().catch(error=>{console.error(error);try{server.close(()=>{});}catch{}process.exit(1);});
