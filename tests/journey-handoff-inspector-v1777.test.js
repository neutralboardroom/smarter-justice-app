'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const http=require('http');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-handoff-inspector-v1777-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-handoff-inspector-v1777-token-123456789';
const planner=require('../lib/journeyHandoffPlanner');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
(async()=>{
 const pkg=require('../package.json'),manifest=require('../portal-manifest.json'),contract=require('../JOURNEY_HANDOFF_PLANNER_CONTRACT_V1.7.77.json');
 assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.testSuiteParts,146);
 assert.equal(contract.execution_mode,'DEVICE_ONLY_CREATE_EXPORT_IMPORT_INSPECT');assert.equal(contract.maximum_import_bytes,16384);assert.equal(contract.runtime_effect.destination_portal_import_enabled,false);assert.equal(contract.runtime_effect.local_persistent_storage_enabled,false);
 const built=planner.buildPlan({destination_product:'divorce-law-aid',matter_category:'family',journey_step:'prepare-questions',preferred_language:'English',access_preference:'plain-language',explicit_user_choice:true},{now:'2026-08-03T11:20:00-04:00'});assert.equal(built.ok,true,built.errors.join('\n'));
 const valid=planner.inspectPlan(JSON.stringify(built.plan),{now:'2026-08-03T11:30:00-04:00'});assert.equal(valid.ok,true,valid.errors.join('\n'));assert.equal(valid.state,'VALID_LOCAL_PACK');assert.equal(valid.summary.destination_name,'Divorce Law Aid');assert.equal(valid.summary.portal_import_accepted,false);assert.equal(valid.serverTransmission,false);assert.equal(valid.serverStorage,false);
 assert.equal(planner.inspectPlan({...built.plan,unexpected:'hidden'}).state,'INVALID_LOCAL_PACK');
 assert.equal(planner.inspectPlan('x'.repeat(16385)).errors.includes('import-too-large'),true);
 assert.equal(planner.inspectPlan({...built.plan,selections:{...built.plan.selections,matter_category:'tax'}}).state,'INVALID_LOCAL_PACK');
 const mismatch=planner.buildPlan({destination_product:'divorce-law-aid',matter_category:'tax',journey_step:'prepare-questions',preferred_language:'English',access_preference:'plain-language',explicit_user_choice:true},{now:'2026-08-03T11:20:00-04:00'});assert.equal(mismatch.ok,true);assert.equal(planner.inspectPlan(mismatch.plan,{now:'2026-08-03T11:30:00-04:00'}).state,'DESTINATION_CATEGORY_MISMATCH');
 assert.equal(planner.inspectPlan(built.plan,{now:'2026-08-03T12:21:00-04:00'}).state,'EXPIRED_LOCAL_PACK');
 assert.equal(planner.inspectPlan(built.plan,{now:'2026-08-03T10:00:00-04:00'}).errors.includes('created-in-future'),true);
 assert.equal(planner.inspectPlan({...built.plan,integrity_sha256:'0'.repeat(64)}).errors.includes('integrity'),true);
 const html=fs.readFileSync(path.join(__dirname,'../public/journey-handoff-planner.html'),'utf8'),js=fs.readFileSync(path.join(__dirname,'../public/journey-handoff-planner.js'),'utf8');
 assert(html.includes('journeyHandoffImportFile'));assert(html.includes('aria-live="polite"'));assert(/Central guidance only/i.test(html));assert(/file\.text\(\)/.test(js));assert(/crypto\.subtle\.digest/.test(js));assert(/MAX_IMPORT_BYTES=16384/.test(js));assert(!/(?:fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB)/.test(js));
 await store.init();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;try{assert.equal((await request(base,'/api/owner/journey-handoff-planner')).status,403);const headers={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};const allowed=await request(base,'/api/owner/journey-handoff-planner',headers);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.journeyHandoffPlanner.inspection.state,'VALID_LOCAL_PACK');assert.equal(allowed.data.journeyHandoffPlanner.portalImportAccepted,false);const cc=await request(base,'/api/owner/control-center',headers);assert.equal(cc.status,200);assert.equal(cc.data.journeyHandoffPlanner.inspection.state,'VALID_LOCAL_PACK');}finally{await new Promise(r=>server.close(r));}
 console.log('journey-handoff-inspector-v1777.test.js passed');
})().catch(error=>{console.error(error);try{server.close(()=>{});}catch{}process.exit(1);});
