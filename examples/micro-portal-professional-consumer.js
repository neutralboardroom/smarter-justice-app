'use strict';
const crypto=require('crypto');
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.keys(value).sort().reduce((out,key)=>{out[key]=stable(value[key]);return out;},{});return value;}
function digest(value){return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');}
function withoutGeneratedAt(value){if(Array.isArray(value))return value.map(withoutGeneratedAt);if(value&&typeof value==='object')return Object.keys(value).reduce((out,key)=>{out[key]=key==='generatedAt'?null:withoutGeneratedAt(value[key]);return out;},{});return value;}
function verifyHandoff(handoff,portalId){
  if(handoff?.handoffVersion!=='1.4.0')throw new Error('Unsupported handoff version.');
  if(handoff?.destinationPortalId!==portalId)throw new Error('Destination portal mismatch.');
  if(handoff?.automaticWrites!==false||handoff?.liveConnection!==false)throw new Error('Unsafe handoff mode.');
  const expected=digest(withoutGeneratedAt({...handoff,handoffDigest:''}));
  if(handoff.handoffDigest!==expected)throw new Error('Handoff digest mismatch.');
  return true;
}
function applyRecord(localStore,record,kind){
  const id=kind==='firm'?record.firmId:record.professionalId;
  if(!id)throw new Error('Missing immutable central ID.');
  const expected=digest({...record,recordFingerprint:'',generatedAt:null});
  if(record.recordFingerprint!==expected)throw new Error('Record fingerprint mismatch.');
  const current=localStore.get(id);
  if(current&&Number(current.sourceRevision)>Number(record.sourceRevision))return {status:'STALE_REJECTED',id};
  if(current&&current.recordFingerprint===record.recordFingerprint)return {status:'NO_CHANGE',id};
  if(record.publicationEligible===true&&Number(record.approvedSourceRevision||record.sourceRevision)!==Number(record.sourceRevision))throw new Error('Public record is not approved for this exact revision.');
  if(kind!=='firm'&&record.publicationEligible===true&&(Number(record.submittedRevision)!==Number(record.sourceRevision)||record.reviewStatus!=='approved'))throw new Error('Public profile revision was not submitted and approved.');
  const publicVisible=record.distributionAction==='UPSERT_PUBLIC'&&record.publicationEligible===true&&record.suppressionState==='NONE';
  localStore.set(id,{...record,publicVisible,appliedAt:new Date().toISOString()});
  return {status:record.suppressionState==='SUPPRESS'?'SUPPRESSED':publicVisible?'PUBLIC_UPSERTED':'PRIVATE_UPSERTED',id,sourceRevision:record.sourceRevision};
}
module.exports={verifyHandoff,applyRecord};
