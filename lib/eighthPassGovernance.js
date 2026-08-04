'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const data=require('../data/eighthPassGovernanceV1775');
const ROOT=path.join(__dirname,'..');
function clone(v){return JSON.parse(JSON.stringify(v));}
function sha256(buf){return crypto.createHash('sha256').update(buf).digest('hex');}
function fileReceipt(rel){const p=path.join(ROOT,rel);const b=fs.readFileSync(p);return{sha256:sha256(b),sizeBytes:b.length,lineCount:b.toString('utf8').split(/\n/).length-(b[b.length-1]===10?1:0),text:b.toString('utf8')};}
function tuple(r){return [Number(r.pairEpoch),Number(r.pairRevision)];}
function compareTuple(a,b){return a[0]-b[0]||a[1]-b[1];}
function classifyReplay(candidate){
 const active=data.activePair;
 const c={...candidate};
 const cmp=compareTuple(tuple(c),tuple(active));
 if(cmp===0){
  if(c.receiptId===active.receiptId&&c.receiptSha256===active.receipt.sha256&&c.transactionId===active.transactionId)return{state:'MASTER_PAIR_COMMITTED_IDEMPOTENT_REPLAY',activeReceiptId:active.receiptId};
  return{state:'MASTER_PAIR_COMMIT_CONFLICT',activeReceiptId:active.receiptId};
 }
 if(cmp<0)return{state:'MASTER_PAIR_RECEIPT_REPLAY_REJECTED',reason:'LOWER_EPOCH_OR_REVISION',activeReceiptId:active.receiptId};
 if(c.predecessorReceiptId!==active.receiptId||c.predecessorReceiptSha256!==active.receipt.sha256)return{state:'MASTER_PAIR_RECEIPT_REPLAY_REJECTED',reason:'UNKNOWN_OR_MISMATCHED_PREDECESSOR',activeReceiptId:active.receiptId};
 return{state:'MASTER_PAIR_PREPARED_VALIDATION_REQUIRED',activeReceiptId:active.receiptId};
}
function discoverActivePair(receipts){
 const rows=(receipts||[]).map(r=>({...r}));
 if(!rows.length)return{state:'INSUFFICIENT_EVIDENCE_COMPATIBILITY_UNPROVEN',active:null,conflicts:[]};
 const groups=new Map();
 for(const r of rows){const k=`${r.pairEpoch}:${r.pairRevision}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
 const conflicts=[];
 for(const [k,group] of groups){const ids=new Set(group.map(x=>`${x.receiptId}:${x.receiptSha256}`));if(ids.size>1)conflicts.push({tuple:k,receipts:group.map(x=>x.receiptId)});}
 if(conflicts.length)return{state:'MASTER_PAIR_COMMIT_CONFLICT',active:null,conflicts};
 rows.sort((a,b)=>compareTuple(tuple(b),tuple(a)));
 const active=rows[0];
 const known=data.activePair;
 if(active.receiptId===known.receiptId&&active.receiptSha256===known.receipt.sha256)return{state:'MASTER_PAIR_COMMITTED',active,conflicts:[]};
 return{state:classifyReplay(active).state,active:null,conflicts:[]};
}
function validate(){
 const errors=[];
 const prompt=fileReceipt(data.activePair.centralMaster.packagedPath);
 const receipt=fileReceipt(data.activePair.receipt.packagedPath);
 if(prompt.sha256!==data.activePair.centralMaster.sha256||prompt.sizeBytes!==data.activePair.centralMaster.sizeBytes||prompt.lineCount!==data.activePair.centralMaster.lineCount)errors.push('central-master-identity');
 if(!prompt.text.startsWith('SMARTER JUSTICE\nEIGHTH-PASS REFINED REUSABLE VERSION-NEUTRAL COMPLETE IMMEDIATE BUILD'))errors.push('central-master-opening-marker');
 if(!prompt.text.trimEnd().endsWith('END OF EIGHTH-PASS REFINED SMARTER JUSTICE REUSABLE VERSION-NEUTRAL COMPLETE IMMEDIATE BUILD MASTER COMMAND'))errors.push('central-master-ending-marker');
 if(receipt.sha256!==data.activePair.receipt.sha256||receipt.sizeBytes!==data.activePair.receipt.sizeBytes||receipt.lineCount!==data.activePair.receipt.lineCount)errors.push('pair-receipt-identity');
 if(data.activePair.state!=='MASTER PAIR COMMITTED — PROMPT COMPATIBILITY ONLY')errors.push('pair-state');
 if(data.activePair.pairEpoch!==1||data.activePair.pairRevision!==0)errors.push('pair-order');
 if(data.activePair.receiptId!=='MPCR-2026-07-31-E1-R0-05F4296ED378')errors.push('receipt-id');
 if(data.activePair.baselineId!=='DRB-2026-07-31-DUR001-DUR043-V2'||data.activePair.semanticCapsuleSha256!=='3d5f7cc4b33980148510834f6b23f902fb5416dbdc9398f106a3b14e81713bf8')errors.push('baseline-binding');
 if((data.baseline.orderedActiveRuleIds||[]).length!==86||!['BASELINE_MATCHED','BASELINE_MATCHED_WITH_AUTHORIZED_DEPLOYMENT_SUCCESSOR','BASELINE_MATCHED_WITH_AUTHORIZED_LAUNCH_DAY_SUCCESSOR'].includes(data.baseline.validationState))errors.push('durable-baseline');
 if(!['BASELINE_MATCHED_WITH_AUTHORIZED_GOVERNANCE_STRENGTHENING','BASELINE_MATCHED_WITH_AUTHORIZED_PACK_SUCCESSOR','BASELINE_MATCHED_WITH_AUTHORIZED_FOUR_FILE_PACK_SUCCESSOR','BASELINE_MATCHED_WITH_AUTHORIZED_LAUNCH_DAY_SUCCESSOR'].includes(data.inheritance.state)||(data.inheritance.exceptions||[]).length)errors.push('inheritance');
 if(data.transactions.appendOnly!==true||(data.transactions.forkMergeConflicts||[]).length)errors.push('transaction-lineage');
 if(!['MASTER PAIR MATCHED','MASTER PAIR MATCHED — COMPATIBLE DESCENDANT WITH PROPAGATION REQUIRED'].includes(data.compatibility.state)||data.compatibility.productAcceptanceCopied!==false)errors.push('compatibility-scope');
 if(!['EIGHTH-PASS','THIRTEENTH-PASS','FOURTEENTH-PASS','FIFTEENTH-PASS'].includes(data.selfIdentity.currentPassLabel)||data.selfIdentity.staleMarkerRegression!=='PASS')errors.push('self-identity');
 if((data.portalBindings.portals||[]).length!==4||data.portalBindings.liveConnectionsOpened!==false)errors.push('portal-bindings');
 const identical=classifyReplay({pairEpoch:1,pairRevision:0,receiptId:data.activePair.receiptId,receiptSha256:data.activePair.receipt.sha256,transactionId:data.activePair.transactionId});
 if(identical.state!=='MASTER_PAIR_COMMITTED_IDEMPOTENT_REPLAY')errors.push('idempotent-replay');
 const low=classifyReplay({pairEpoch:0,pairRevision:99,receiptId:'old',receiptSha256:'0'.repeat(64),transactionId:'old'});
 if(low.state!=='MASTER_PAIR_RECEIPT_REPLAY_REJECTED')errors.push('lower-replay');
 const conflict=classifyReplay({pairEpoch:1,pairRevision:0,receiptId:'different',receiptSha256:'1'.repeat(64),transactionId:'different'});
 if(conflict.state!=='MASTER_PAIR_COMMIT_CONFLICT')errors.push('split-brain');
 return{ok:errors.length===0,errors,releaseVersion:'1.7.75',pairEpoch:data.activePair.pairEpoch,pairRevision:data.activePair.pairRevision,activeReceiptId:data.activePair.receiptId,durableRuleCount:data.baseline.orderedActiveRuleIds.length,launchState:data.activePair.launchState};
}
function ownerView(){return{releaseVersion:'1.7.75',validation:validate(),activePair:clone(data.activePair),receiptBinding:clone(data.receiptBinding),baseline:clone(data.baseline),inheritance:clone(data.inheritance),transactions:clone(data.transactions),compatibility:clone(data.compatibility),selfIdentity:clone(data.selfIdentity),portalBindings:clone(data.portalBindings),replayAcceptance:clone(data.replayAcceptance)};}
module.exports={validate,classifyReplay,discoverActivePair,ownerView};
