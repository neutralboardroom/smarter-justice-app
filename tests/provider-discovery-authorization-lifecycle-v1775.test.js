'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
process.env.NODE_ENV = 'test';
process.env.SMARTER_JUSTICE_STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sj-provider-lifecycle-v1775-'));
process.env.OWNER_CONTROL_CENTER_TOKEN = 'owner-provider-lifecycle-v1775-token-123456789';
const plan = require('../PROVIDER_DISCOVERY_PLAN_V1.7.75.json');
const schema = require('../PROVIDER_DISCOVERY_OWNER_AUTHORIZATION_SCHEMA_V1.7.75.json');
const discovery = require('../lib/providerDiscoveryPlan');
const lifecycle = require('../lib/providerDiscoveryAuthorizationLifecycle');
const store = require('../lib/store');
const server = require('../server');
function request(base, pathname, headers = {}) { return new Promise((resolve, reject) => { const req = http.request(new URL(pathname, base), { headers }, res => { const chunks=[]; res.on('data', c => chunks.push(c)); res.on('end', () => { let data=null; try { data=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch {} resolve({status:res.statusCode,data}); }); }); req.on('error',reject); req.end(); }); }
function decision(state='AUTHORIZED_READ_ONLY', overrides={}) {
  const req=plan.products[0].request;
  const authorized=state==='AUTHORIZED_READ_ONLY';
  return {
    schema_id:schema.schema_id,
    decision_id:`owner-lifecycle-${state.toLowerCase()}-fixture`,
    authorization_request_id:req.request_id,
    authorization_request_digest:discovery.digestRequest(req),
    product:{...req.product}, decision_state:state,
    issued_at:'2026-08-03T11:00:00-04:00', expires_at:'2026-08-03T12:00:00-04:00',
    authorized_scopes:[...req.scopes], forbidden_actions_acknowledged:[...req.forbidden_actions],
    owner_confirmation:authorized?schema.exactAuthorizationConfirmation:null,
    execution_nonce:authorized?'v1775-read-only-lifecycle-single-use-nonce-000001':null,
    read_only:true, secret_values_forbidden:true, write_operations_forbidden:true,
    deployment_authorized:false, production_request_sent:false, cohort_freeze_authorized:false,
    canary_authorized:false, single_use:true, ...overrides
  };
}
(async()=>{
  const pkg=require('../package.json'); const manifest=require('../portal-manifest.json');
  assert.equal(pkg.version,'1.7.83'); assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(manifest.capabilities.providerDiscoveryAuthorizationLifecycleV1775,true);
  const staticValidation=lifecycle.validateStatic(); assert.equal(staticValidation.ok,true,staticValidation.errors.join('\n'));
  const req=plan.products[0].request;
  let events=lifecycle.registerRequest(req); assert.equal(lifecycle.validateChain(events).ok,true);
  const approved=decision();
  let result=lifecycle.recordDecision(events,req,approved,{now:'2026-08-03T11:05:00-04:00'}); assert.equal(result.ok,true,result.errors.join('\n')); events=result.events;
  assert.equal(lifecycle.deriveState(events).state,'AUTHORIZED_READ_ONLY');
  result=lifecycle.issueEnvelope(events,req,approved,{now:'2026-08-03T11:10:00-04:00'}); assert.equal(result.ok,true,result.errors.join('\n')); events=result.events;
  const envelope=result.executionEnvelope; assert.equal(lifecycle.deriveState(events).state,'ENVELOPE_ISSUED');
  assert.equal(lifecycle.issueEnvelope(events,req,approved,{now:'2026-08-03T11:11:00-04:00'}).ok,false);
  const receipt={schema:'smarter-justice-provider-discovery-execution-receipt',observed_at:'2026-08-03T11:20:00-04:00',authorization_request_id:envelope.authorization_request_id,authorization_request_digest:envelope.authorization_request_digest,owner_decision_id:envelope.owner_decision_id,owner_decision_digest:envelope.owner_decision_digest,execution_nonce:envelope.execution_nonce,execution_envelope_digest:lifecycle.digest(envelope),read_only:true,secret_values_read:false,writes_performed:false,deployment_authorized:false,production_request_sent:false};
  result=lifecycle.acceptReceipt(events,envelope,receipt); assert.equal(result.ok,true,result.errors.join('\n')); events=result.events;
  assert.equal(lifecycle.validateChain(events).ok,true,lifecycle.validateChain(events).errors.join('\n'));
  assert.equal(lifecycle.deriveState(events).state,'COMPLETED');
  assert.equal(lifecycle.acceptReceipt(events,envelope,receipt).ok,false);
  const tampered=JSON.parse(JSON.stringify(events)); tampered[1].decision_id='tampered'; assert.equal(lifecycle.validateChain(tampered).ok,false);
  let declined=lifecycle.registerRequest(req); result=lifecycle.recordDecision(declined,req,decision('DECLINED'),{now:'2026-08-03T11:05:00-04:00'}); assert.equal(result.ok,true); assert.equal(lifecycle.deriveState(result.events).state,'DECLINED'); assert.equal(lifecycle.validateChain(result.events).ok,true);
  let expired=lifecycle.registerRequest(req); result=lifecycle.recordExpiry(expired,req,'2026-08-03T18:21:00-04:00'); assert.equal(result.ok,true); assert.equal(lifecycle.deriveState(result.events).state,'EXPIRED');
  let revoked=lifecycle.registerRequest(req); revoked=lifecycle.recordDecision(revoked,req,approved,{now:'2026-08-03T11:05:00-04:00'}).events; result=lifecycle.recordRevocation(revoked,req,approved,'2026-08-03T11:15:00-04:00'); assert.equal(result.ok,true); assert.equal(lifecycle.deriveState(result.events).state,'REVOKED'); assert.equal(lifecycle.validateChain(result.events).ok,true);
  const leaked=decision('AUTHORIZED_READ_ONLY',{owner_confirmation:'postgres://user:password@example/db'}); assert.equal(lifecycle.recordDecision(lifecycle.registerRequest(req),req,leaked,{now:'2026-08-03T11:05:00-04:00'}).ok,false);
  await store.init(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); const base=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await request(base,'/api/owner/provider-discovery-authorization-lifecycle')).status,403);
    const headers={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};
    const allowed=await request(base,'/api/owner/provider-discovery-authorization-lifecycle',headers); assert.equal(allowed.status,200); assert.equal(allowed.data.appVersion,'1.7.83'); assert.equal(allowed.data.providerDiscoveryAuthorizationLifecycle.validation.ok,true);
    const cc=await request(base,'/api/owner/control-center',headers); assert.equal(cc.status,200); assert.equal(cc.data.providerDiscoveryAuthorizationLifecycle.validation.ok,true);
  } finally { await new Promise(resolve=>server.close(resolve)); }
  console.log('provider-discovery-authorization-lifecycle-v1775.test.js passed');
})().catch(error=>{console.error(error); try{server.close(()=>{});}catch{} process.exit(1);});
