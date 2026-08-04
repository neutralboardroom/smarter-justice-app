'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const http=require('http');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-handoff-v1776-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-handoff-v1776-token-123456789';
const planner=require('../lib/journeyHandoffPlanner');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
(async()=>{
 const pkg=require('../package.json'),manifest=require('../portal-manifest.json'),contract=require('../JOURNEY_HANDOFF_PLANNER_CONTRACT_V1.7.76.json');
 assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);assert.equal(manifest.capabilities.deviceOnlyJourneyHandoffPlannerV1776,true);assert.equal(manifest.capabilities.journeyHandoffServerTransmissionV1776,false);assert.equal(manifest.capabilities.journeyHandoffServerStorageV1776,false);
 assert.equal(contract.execution_mode,'DEVICE_ONLY_EXPORT');assert.equal(contract.runtime_effect.cross_product_transfer_enabled,false);assert.equal(contract.runtime_effect.server_endpoint_accepting_plan,false);assert.equal(contract.invariants.free_text_absent,true);
 const built=planner.buildPlan({destination_product:'divorce-law-aid',matter_category:'family',journey_step:'prepare-questions',preferred_language:'English',access_preference:'plain-language',explicit_user_choice:true},{now:'2026-08-03T15:20:00.000Z'});assert.equal(built.ok,true,built.errors.join('\n'));assert.equal(planner.validatePlan(built.plan).ok,true);assert.equal(built.plan.server_transmission,false);assert.equal(built.plan.server_storage,false);assert.equal(built.plan.automatic_sync,false);assert.equal(Object.hasOwn(built.plan,'legal_narrative'),false);
 const again=planner.buildPlan({access_preference:'plain-language',explicit_user_choice:true,journey_step:'prepare-questions',matter_category:'family',preferred_language:'English',destination_product:'divorce-law-aid'},{now:'2026-08-03T15:20:00.000Z'});assert.deepEqual(again.plan,built.plan);
 for(const bad of [
  {destination_product:'divorce-law-aid',matter_category:'family',journey_step:'prepare-questions',explicit_user_choice:false},
  {destination_product:'unknown',matter_category:'family',journey_step:'prepare-questions',explicit_user_choice:true},
  {destination_product:'divorce-law-aid',matter_category:'family',journey_step:'prepare-questions',explicit_user_choice:true,notes:'private facts'},
  {destination_product:'divorce-law-aid',matter_category:'family',journey_step:'prepare-questions',explicit_user_choice:true,authentication_secret:'x'}
 ])assert.equal(planner.buildPlan(bad,{now:'2026-08-03T15:20:00.000Z'}).ok,false);
 assert.equal(planner.validatePlan({...built.plan,selections:{...built.plan.selections,matter_category:'unknown'}}).ok,false);assert.equal(planner.validatePlan({...built.plan,integrity_sha256:'0'.repeat(64)}).ok,false);
 const html=fs.readFileSync(path.join(__dirname,'../public/journey-handoff-planner.html'),'utf8');const js=fs.readFileSync(path.join(__dirname,'../public/journey-handoff-planner.js'),'utf8');
 assert(/Nothing entered or created here is sent/i.test(html));assert(/No name, email, phone number, or address/i.test(html));assert(/explicit_user_choice/.test(html));assert(!/textarea/i.test(html));assert(/crypto\.subtle\.digest/.test(js));assert(!/(?:fetch\(|XMLHttpRequest|sendBeacon|WebSocket)/.test(js));assert(/server_transmission:false/.test(js));assert(/server_storage:false/.test(js));
 const free=fs.readFileSync(path.join(__dirname,'../public/free-tools.html'),'utf8');const sitemap=fs.readFileSync(path.join(__dirname,'../public/sitemap.xml'),'utf8');assert(free.includes('/journey-handoff-planner.html'));assert(sitemap.includes('/journey-handoff-planner.html'));
 await store.init();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;try{assert.equal((await request(base,'/api/owner/journey-handoff-planner')).status,403);const headers={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};const allowed=await request(base,'/api/owner/journey-handoff-planner',headers);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.journeyHandoffPlanner.validation.ok,true);const cc=await request(base,'/api/owner/control-center',headers);assert.equal(cc.status,200);assert.equal(cc.data.journeyHandoffPlanner.validation.ok,true);}finally{await new Promise(r=>server.close(r));}
 console.log('journey-handoff-planner-v1776.test.js passed');
})().catch(error=>{console.error(error);try{server.close(()=>{});}catch{}process.exit(1);});
