'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const http=require('http');
const cp=require('child_process');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-provider-authorization-v1773-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-provider-authorization-v1773-token-123456789';
const plan=require('../PROVIDER_DISCOVERY_PLAN_V1.7.75.json');
const discovery=require('../lib/providerDiscoveryPlan');
const authorization=require('../lib/providerDiscoveryAuthorization');
const schema=require('../PROVIDER_DISCOVERY_OWNER_AUTHORIZATION_SCHEMA_V1.7.75.json');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
function decision(overrides={}){
  const req=plan.products[0].request;
  return{
    schema_id:schema.schema_id,
    decision_id:'owner-provider-discovery-v1773-fixture',
    authorization_request_id:req.request_id,
    authorization_request_digest:discovery.digestRequest(req),
    product:{...req.product},
    decision_state:'AUTHORIZED_READ_ONLY',
    issued_at:'2026-08-03T10:30:00-04:00',
    expires_at:'2026-08-03T12:30:00-04:00',
    authorized_scopes:[...req.scopes],
    forbidden_actions_acknowledged:[...req.forbidden_actions],
    owner_confirmation:schema.exactAuthorizationConfirmation,
    execution_nonce:'v1773-single-use-fixture-nonce-000001',
    read_only:true,
    secret_values_forbidden:true,
    write_operations_forbidden:true,
    deployment_authorized:false,
    production_request_sent:false,
    cohort_freeze_authorized:false,
    canary_authorized:false,
    single_use:true,
    ...overrides
  };
}
(async()=>{
  const pkg=require('../package.json');const manifest=require('../portal-manifest.json');
  assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(manifest.currentDevelopmentVersion,'1.7.83');assert.equal(manifest.latestZipName,'smarter-justice-v1.7.82.zip');assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.testSuiteParts,146);
  assert.equal(manifest.capabilities.detachedProviderDiscoveryOwnerAuthorizationV1775,true);
  assert.equal(manifest.capabilities.singleUseProviderDiscoveryExecutionEnvelopeV1775,true);
  assert.equal(manifest.capabilities.providerAuthorizationReplayRejectionV1775,true);
  const packetValidation=authorization.validatePacket();assert.equal(packetValidation.ok,true,packetValidation.errors.join('\n'));assert.equal(packetValidation.authorizationReady,false);assert.equal(packetValidation.executionEnvelopeCreated,false);
  const req=plan.products[0].request;const approved=decision();
  const valid=authorization.validateDecision(req,approved,{now:'2026-08-03T11:00:00-04:00'});assert.equal(valid.ok,true,valid.errors.join('\n'));assert.equal(valid.executable,true);
  const envelope=authorization.buildExecutionEnvelope(req,approved,{now:'2026-08-03T11:00:00-04:00'});assert.equal(envelope.ok,true,envelope.errors.join('\n'));assert.equal(envelope.executionEnvelope.single_use,true);assert.equal(envelope.executionEnvelope.deployment_authorized,false);assert.equal(envelope.executionEnvelope.production_request_sent,false);
  const mutatedRequest={...req,request_state:'AUTHORIZED_READ_ONLY',authorization_state:'AUTHORIZED_READ_ONLY'};assert.equal(authorization.validateDecision(mutatedRequest,approved,{now:'2026-08-03T11:00:00-04:00'}).ok,false);
  const badDigest=decision({authorization_request_digest:'a'.repeat(64)});assert.equal(authorization.validateDecision(req,badDigest,{now:'2026-08-03T11:00:00-04:00'}).ok,false);
  const scopeEscalation=decision({authorized_scopes:[...req.scopes,'CREATE_OR_TRIGGER_DEPLOYMENT']});assert.equal(authorization.validateDecision(req,scopeEscalation,{now:'2026-08-03T11:00:00-04:00'}).ok,false);
  const expired=decision({expires_at:'2026-08-03T10:45:00-04:00'});assert.equal(authorization.validateDecision(req,expired,{now:'2026-08-03T11:00:00-04:00'}).executable,false);
  const replayed=authorization.validateDecision(req,approved,{now:'2026-08-03T11:00:00-04:00',usedNonces:new Set([approved.execution_nonce])});assert.equal(replayed.ok,false);assert(replayed.errors.includes('execution-nonce-replayed'));
  const secretLeak=decision({owner_confirmation:'postgres://user:password@example/db'});assert.equal(authorization.validateDecision(req,secretLeak,{now:'2026-08-03T11:00:00-04:00'}).ok,false);
  const deploymentLeak=decision({deployment_authorized:true});assert.equal(authorization.validateDecision(req,deploymentLeak,{now:'2026-08-03T11:00:00-04:00'}).ok,false);
  const script=JSON.parse(cp.execFileSync(process.execPath,[path.join(__dirname,'..','scripts','provider-discovery-authorization-validate-v1773.js')],{encoding:'utf8'}));assert.equal(script.ok,true);assert.equal(script.authorizationReady,false);assert.equal(script.providerMetadataRead,false);assert.equal(script.productionRequestSent,false);
  await store.init();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await request(base,'/api/owner/provider-discovery-authorization')).status,403);
    const h={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};
    const allowed=await request(base,'/api/owner/provider-discovery-authorization',h);assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.providerDiscoveryAuthorization.validation.ok,true);assert.equal(allowed.data.providerDiscoveryAuthorization.validation.authorizationReady,false);
    const cc=await request(base,'/api/owner/control-center',h);assert.equal(cc.status,200);assert.equal(cc.data.version,'1.7.83');assert.equal(cc.data.providerDiscoveryAuthorization.validation.ok,true);
  }finally{await new Promise(r=>server.close(r));}
  console.log('provider-discovery-authorization-v1773.test.js passed');
})().catch(err=>{console.error(err);try{server.close(()=>{});}catch{}process.exit(1);});
