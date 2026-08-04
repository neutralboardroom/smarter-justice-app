'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const http=require('http');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-workflow-governance-v1775-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-workflow-governance-v1775-token-123456789';
const governance=require('../lib/strategicWorkflowGovernance');
const ledger=require('../DURABLE_RULE_APPLICABILITY_LEDGER_V1.7.75.json');
const scope=require('../MATERIAL_RELEASE_SCOPE_AND_EVIDENCE_CONTRACT_V1.7.75.json');
const report=require('../COMPLETED_MATERIAL_IMPROVEMENTS_REPORT_V1.7.75.json');
const recovery=require('../RECOVERY_LINEAGE_RECEIPT_V1.7.75.json');
const store=require('../lib/store');
const server=require('../server');
function request(base,pathname,headers={}){return new Promise((resolve,reject)=>{const req=http.request(new URL(pathname,base),{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data=null;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}resolve({status:res.statusCode,data});});});req.on('error',reject);req.end();});}
(async()=>{
  const pkg=require('../package.json'); const manifest=require('../portal-manifest.json');
  assert.equal(pkg.version,'1.7.83'); assert.equal(pkg.scripts.test.split(' && ').length,145);
  assert.equal(manifest.capabilities.structuredWorkflowGovernanceV1775,true);
  assert.equal(manifest.capabilities.strategicCapabilityMaturityDashboardV1775,true);
  assert.equal(manifest.capabilities.consentBasedJourneyContractV1775,true);
  assert.equal(manifest.capabilities.automaticSensitiveCrossPlatformSync,false);
  assert.equal(manifest.capabilities.universalSensitiveUserDatabase,false);
  const validation=governance.validateGovernance(); assert.equal(validation.ok,true,validation.errors.join('\n')); assert.equal(validation.workflowCount,5); assert.equal(validation.selectedCapabilityCount,5); assert.equal(validation.runtimeTransferEnabled,false);
  const view=governance.ownerView(); assert.equal(view.validation.ok,true); assert.equal(view.capabilityMaturity.summary.production_capabilities_claimed,0); assert.equal(view.architectureCompatibility.cross_product_transfer.enabled,false);
  const valid=view.consentContract.sample_valid_non_sensitive_receipt; assert.equal(governance.validateConsentReceipt(valid).ok,true);
  assert.equal(governance.validateConsentReceipt({...valid,explicit_user_choice:false}).ok,false);
  assert.equal(governance.validateConsentReceipt({...valid,automatic_sync:true}).ok,false);
  assert.equal(governance.validateConsentReceipt({...valid,data_categories:['full_user_record']}).ok,false);
  assert.equal(governance.validateConsentReceipt({...valid,data_categories:['authentication_secret']}).ok,false);
  assert.equal(governance.validateConsentReceipt({...valid,revocation_path:''}).ok,false);
  assert.equal(ledger.rule_count,206); assert.equal(ledger.shared_rules.length,206); assert.equal(ledger.open_or_blocked_count,0);
  assert.equal(scope.wording_standard,'STRONGEST_JUSTIFIED_SET; smallest-set wording prohibited.');
  assert.equal(report.strongest_justified_set_language_validated,true);
  assert.equal(recovery.unavailable_intermediate.byte_exact_recovery_claimed,false);
  assert.equal(recovery.authoritative_recovery_base.sha256,'5ed64a1c13de1a536303b07a2277e234a822b9bc316b7ea97cf2547e90811898');
  await store.init(); await new Promise(r=>server.listen(0,'127.0.0.1',r)); const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await request(base,'/api/owner/strategic-workflow-governance')).status,403);
    const headers={'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN};
    const allowed=await request(base,'/api/owner/strategic-workflow-governance',headers); assert.equal(allowed.status,200); assert.equal(allowed.data.appVersion,'1.7.83'); assert.equal(allowed.data.strategicWorkflowGovernance.validation.ok,true);
    const cc=await request(base,'/api/owner/control-center',headers); assert.equal(cc.status,200); assert.equal(cc.data.version,'1.7.83'); assert.equal(cc.data.strategicWorkflowGovernance.validation.ok,true);
  }finally{await new Promise(r=>server.close(r));}
  console.log('structured-workflow-governance-v1775.test.js passed');
})().catch(error=>{console.error(error);try{server.close(()=>{});}catch{}process.exit(1);});
