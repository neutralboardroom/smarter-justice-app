'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sj-workspace-'));
process.env.SMARTER_JUSTICE_STORAGE_DIR=temp;
const workspace=require('../lib/legalPortalWorkspace');
const truth=require('../lib/portfolioTruth').ownerView();

(async()=>{
  const first=workspace.ownerView();
  assert.equal(first.schemaVersion,'2.4.0');
  assert.equal(first.sourceRelease,'Smarter Justice v1.7.53');
  assert.equal(first.sourceRegistry,'PORTFOLIO_TRUTH_V1.7.75.json');
  assert.equal(first.summary.portalCount,26);
  assert.equal(first.summary.outOfScopeRecords,0);
  assert.equal(first.summary.neutralBoardroomConnection,'DORMANT_OPTIONAL_EXPORT_ONLY');
  assert.equal(first.summary.independentlyExactVerified,0);
  assert.equal(first.summary.candidatePendingExactAcceptance,0);
  assert.equal(first.summary.finalPackageAcceptedDetachedIdentity,1);
  assert(first.activationGates.every(row=>row.open===false));
  assert(!first.portals.some(row=>['smarter-health','smarter-property','smarter-money','neutral-boardroom-portfolio-os'].includes(row.id)));
  const truthById=new Map(truth.portals.map(row=>[row.portalId,row]));
  for(const row of first.portals){
    const current=truthById.get(row.id);
    assert(current,row.id);
    assert.equal(row.latestVersion,current.version,row.id);
    assert.equal(row.artifactName,current.artifact,row.id);
    assert.equal(row.sha256,current.sha256,row.id);
    assert.equal(row.evidenceState,current.evidenceState,row.id);
  }

  const target=first.portals.find(row=>row.id==='immigration-oasis');
  const originalIdentity={version:target.latestVersion,artifact:target.artifactName,sha:target.sha256,size:target.sizeBytes};
  const result=await workspace.updatePortal(target.id,{status:'deployment candidate',priority:'critical',staffLead:'Dedicated Immigration Oasis deployment chat',nextAction:'Return the nonconfidential deployment handoff to Smarter Justice.',operationalNotes:'No user-matter data belongs in this record.'});
  assert.equal(result.portal.status,'deployment candidate');
  assert.equal(result.portal.priority,'critical');
  const updated=workspace.ownerView().portals.find(row=>row.id===target.id);
  assert.deepEqual({version:updated.latestVersion,artifact:updated.artifactName,sha:updated.sha256,size:updated.sizeBytes},originalIdentity);
  assert.equal(updated.staffLead,'Dedicated Immigration Oasis deployment chat');
  assert.equal((await workspace.updatePortal('smarter-health',{status:'active development'})).error,'This platform is outside the Smarter Justice legal-only scope.');

  const bundle=workspace.exportBundle();
  assert.equal(bundle.automaticWrites,false);
  assert(bundle.prohibitedData.some(value=>/legal intake facts/i.test(value)));
  assert(bundle.importRules.some(value=>/dedicated legal-portal artifact/i.test(value)));
  assert(/self-contained legal-portfolio operating/i.test(bundle.portfolioRelationship));
  assert(/Legal-Network Control Center/i.test(workspace.markdown()));
  fs.rmSync(temp,{recursive:true,force:true});
  console.log('legal-workspace-unification-v1734.test.js passed');
})().catch(err=>{fs.rmSync(temp,{recursive:true,force:true});console.error(err);process.exit(1);});
