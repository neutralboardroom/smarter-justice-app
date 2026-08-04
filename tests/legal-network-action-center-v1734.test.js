'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sj-action-center-'));
process.env.SMARTER_JUSTICE_STORAGE_DIR=temp;
const actionCenter=require('../lib/legalNetworkActionCenter');

(async()=>{
  const first=actionCenter.ownerView();
  assert.equal(first.releaseVersion,'1.7.75');
  assert(first.validation===undefined);
  assert(first.summary.generated>=25);
  assert(first.summary.now>=1);
  assert(first.primaryAction);
  assert.equal(first.primaryAction.portalId,'divorce-law-aid');
  assert.equal(first.primaryAction.ruleId,'SJ-ACT-004');
  assert.equal(first.primaryAction.automaticAction,false);
  assert(first.actions.every(row=>row.containsUserMatterData===false));
  assert(first.actions.every(row=>/^[a-f0-9]{20}$/.test(row.fingerprint)));
  assert.deepEqual([...new Set(first.actions.map(row=>row.actionId))].length,first.actions.length);

  const id=first.primaryAction.actionId;
  const changed=await actionCenter.updateDisposition(id,{status:'DEFERRED',note:'Wait for the dedicated Divorce pilot artifact and staging handoff. Roger remains the decision owner.',reviewAt:'2026-07-30'});
  assert.equal(changed.disposition.status,'DEFERRED');
  const second=actionCenter.ownerView();
  const saved=second.actions.find(row=>row.actionId===id);
  assert.equal(saved.disposition.status,'DEFERRED');
  assert.equal(saved.disposition.reviewAt,'2026-07-30');
  assert.equal(second.summary.deferred,1);
  assert.equal((await actionCenter.updateDisposition(id,{status:'NOT_A_STATUS'})).error,'Choose a valid action disposition.');
  assert.equal((await actionCenter.updateDisposition(id,{status:'ACTIVE',reviewAt:'July 30'})).error,'Review date must use YYYY-MM-DD.');

  const bundle=actionCenter.exportBundle();
  assert.equal(bundle.automaticActions,false);
  assert.equal(bundle.livePortalWrites,false);
  assert.equal(bundle.containsUserMatterData,false);
  assert.equal(bundle.containsConfidentialData,false);
  assert(/deterministic owner execution guidance/i.test(actionCenter.markdown()));

  const root=path.join(__dirname,'..');
  const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'public','control-center.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'public','app.js'),'utf8');
  for(const route of ['/api/owner/legal-network-action-center','/api/owner/legal-network-action-center/export'])assert(server.includes(route),route);
  assert(server.includes("req.method === 'POST'") && server.includes('legal-network-action-center'));
  for(const id of ['legalNetworkActionCenterSection','legalNetworkActionSummary','legalNetworkPrimaryAction','legalNetworkActionLanes'])assert(html.includes(id),id);
  assert(app.includes('renderLegalNetworkActionCenter'));
  assert(app.includes('data-legal-network-action'));
  fs.rmSync(temp,{recursive:true,force:true});
  console.log('legal-network-action-center-v1734.test.js passed');
})().catch(err=>{fs.rmSync(temp,{recursive:true,force:true});console.error(err);process.exit(1);});
