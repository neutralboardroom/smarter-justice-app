'use strict';
const data=require('../data/ownerActionReadinessV1775');
function clone(v){return JSON.parse(JSON.stringify(v));}
function validate(queue=data.queue,readiness=data.readiness){const errors=[];const q=queue,r=readiness;const allowed=new Set(r.allowedStates||[]),ids=new Set(),dedup=new Set();
 if(q.releaseVersion!=='1.7.75'||r.releaseVersion!=='1.7.75')errors.push('release-version');
 if(r.queueSource!=='OWNER_ACTION_QUEUE_V1.7.75.json'||r.queue!=='OWNER_ACTION_QUEUE_V1.7.75.json')errors.push('stale-queue-source');
 if(!Array.isArray(q.requests)||q.requests.length<9)errors.push('request-count');
 for(const x of q.requests||[]){for(const f of r.requiredFields||[])if(x[f]===undefined||x[f]===null||x[f]==='')errors.push(`${x.requestId||'unknown'}:missing:${f}`);if(ids.has(x.requestId))errors.push(`${x.requestId}:duplicate-id`);ids.add(x.requestId);if(dedup.has(x.deduplicationKey))errors.push(`${x.requestId}:duplicate-dedup`);dedup.add(x.deduplicationKey);if(!allowed.has(x.state))errors.push(`${x.requestId}:state`);const combined=[x.ownerAction,x.where,x.safeConfirmation,x.builderVerification].join(' ');if(/paste\s+(?:the\s+)?(?:api key|password|secret|token|database url|smtp credential)/i.test(combined))errors.push(`${x.requestId}:secret-request`);if(x.state==='OWNER ACTION REQUESTED'&&x.builderPrerequisitesComplete!==true)errors.push(`${x.requestId}:requested-before-prerequisites`);if(x.state==='OWNER ACTION RECEIVED'&&x.verificationRequiredAfterReceipt!==true)errors.push(`${x.requestId}:received-without-verification`);}
 const requestable=(q.requests||[]).filter(x=>x.state==='OWNER ACTION REQUESTED').map(x=>x.requestId);if(JSON.stringify(requestable)!==JSON.stringify(r.requestableIds||[]))errors.push('requestable-index');
 return{ok:errors.length===0,errors,releaseVersion:'1.7.75',requestCount:(q.requests||[]).length,requestableCount:requestable.length,qualifiedReviewCount:(q.requests||[]).filter(x=>x.state==='QUALIFIED REVIEWER REQUIRED').length,deferredCount:(q.requests||[]).filter(x=>x.state==='OWNER ACTION DEFERRED').length,receivedIsNotVerified:r.receivedIsNotVerified===true,queueSource:r.queueSource};}
function ownerView(){return{releaseVersion:'1.7.75',validation:validate(),queue:clone(data.queue),readiness:clone(data.readiness)};}
module.exports={validate,ownerView};
