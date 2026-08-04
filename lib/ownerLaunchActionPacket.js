'use strict';
const data=require('../data/ownerLaunchActionPacketV1775');
function clone(v){return JSON.parse(JSON.stringify(v));}
function validate(packet=data.packet,queue=data.queue,readiness=data.readiness){const errors=[];const requests=new Map((queue.requests||[]).map(x=>[x.requestId,x]));
 if(packet.releaseVersion!=='1.7.75'||queue.releaseVersion!=='1.7.75'||readiness.releaseVersion!=='1.7.75')errors.push('release-version');
 if(packet.sourceQueue!=='OWNER_ACTION_QUEUE_V1.7.75.json'||packet.sourceReadiness!=='OWNER_ACTION_READINESS_V1.7.75.json')errors.push('current-source-binding');
 if(readiness.queueSource!==packet.sourceQueue||readiness.queue!==packet.sourceQueue)errors.push('readiness-queue-source');
 if(packet.selectedBase?.version!=='1.7.73'||packet.selectedBase?.sha256!=='5ed64a1c13de1a536303b07a2277e234a822b9bc316b7ea97cf2547e90811898')errors.push('selected-base');
 if(packet.currentCandidate?.version!=='1.7.75'||packet.currentCandidate?.state!=='SOURCE_ACCEPTANCE_PENDING')errors.push('candidate-boundary');
 const groups=packet.groups||{};const all=[...(groups.readyNow||[]),...(groups.qualifiedReview||[]),...(groups.candidateDependent||[]),...(groups.deferred||[])];
 if(new Set(all).size!==all.length)errors.push('group-duplicate');if(all.length!==requests.size)errors.push('group-coverage');
 const expected={readyNow:'OWNER ACTION REQUESTED',qualifiedReview:'QUALIFIED REVIEWER REQUIRED',candidateDependent:'OWNER ACTION PREPARATION',deferred:'OWNER ACTION DEFERRED'};
 for(const [group,state] of Object.entries(expected))for(const id of groups[group]||[]){const x=requests.get(id);if(!x)errors.push(`${group}:${id}:missing`);else{if(x.state!==state)errors.push(`${group}:${id}:state`);if(group==='readyNow'&&x.builderPrerequisitesComplete!==true)errors.push(`${group}:${id}:prerequisites`);}}
 for(const x of queue.requests||[]){const text=[x.ownerAction,x.where,x.safeConfirmation,x.builderVerification].join(' ');if(/paste\s+(?:the\s+)?(?:api key|password|secret|token|database url|smtp credential)/i.test(text))errors.push(`${x.requestId}:secret-request`);}
 for(const s of packet.requestSummaries||[]){const x=requests.get(s.requestId);if(!x)errors.push(`${s.requestId}:summary-missing-source`);else if(s.state!==x.state||s.deduplicationKey!==x.deduplicationKey)errors.push(`${s.requestId}:summary-mismatch`);const text=[s.ownerAction,s.where,s.safeConfirmation,s.builderVerification].join(' ');if(/paste\s+(?:the\s+)?(?:api key|password|secret|token|database url|smtp credential)/i.test(text))errors.push(`${s.requestId}:secret-request`);}
 if(packet.invariants?.rawSecretsProhibited!==true||packet.invariants?.receivedIsNotVerified!==true||packet.invariants?.exactArtifactBindingRequired!==true)errors.push('invariants');
 if(packet.launchState!=='NO_GO'||packet.deploymentAuthorized!==false)errors.push('launch-deployment-boundary');
 return{ok:errors.length===0,errors,releaseVersion:'1.7.75',requestCount:requests.size,readyNowCount:(groups.readyNow||[]).length,qualifiedReviewCount:(groups.qualifiedReview||[]).length,candidateDependentCount:(groups.candidateDependent||[]).length,deferredCount:(groups.deferred||[]).length,launchState:packet.launchState};}
function ownerView(){return{releaseVersion:'1.7.75',validation:validate(),packet:clone(data.packet)};}
module.exports={validate,ownerView};
