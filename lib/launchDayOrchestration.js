'use strict';
const fs=require('fs');
const path=require('path');
const data=require('../data/launchDayOrchestrationV1775');
const ROOT=path.join(__dirname,'..');
function clone(v){return JSON.parse(JSON.stringify(v));}
function readJson(rel){return JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));}
const requiredFiles=['launch-cohort-manifest.json','launch-state-machine.json','canary-wave-plan.json','dns-tls-canonical-origin-matrix.json','external-service-activation-matrix.json','production-stabilization-watch.json'];
function validate(root=ROOT){
 const errors=[];
 if(data.releaseVersion!=='1.7.75')errors.push('release-version');
 if(data.packId!=='SJP-2026-08-02-C15-P37-D11-V13')errors.push('pack-id');
 if(data.baselineId!=='DRB-2026-08-02-DUR001-DUR086-V13')errors.push('baseline');
 if(data.cohortCount!==5||data.currentState!=='PREFLIGHT_REQUIRED')errors.push('cohort-state');
 if(data.allProductPreflightComplete!==false||data.cohortFrozen!==false||data.canarySelected!==false)errors.push('preflight-boundary');
 if(data.portfolioAuthorized!==false||data.deploymentStarted!==false||data.productionDeployed!==false||data.liveAccepted!==false||data.launchState!=='NO_GO')errors.push('deployment-live-boundary');
 for(const f of requiredFiles)if(!fs.existsSync(path.join(root,'deployment',f)))errors.push(`missing:${f}`);
 if(!errors.length){
  const cohort=readJson('deployment/launch-cohort-manifest.json');
  const states=readJson('deployment/launch-state-machine.json');
  const wave=readJson('deployment/canary-wave-plan.json');
  const dns=readJson('deployment/dns-tls-canonical-origin-matrix.json');
  const external=readJson('deployment/external-service-activation-matrix.json');
  const stabilization=readJson('deployment/production-stabilization-watch.json');
  const exact=['smarter-justice-central','divorce-law-aid','estate-law-aid','personal-injury-law-aid','domestic-violence-aid'];
  if(cohort.cohortCount!==5||JSON.stringify(cohort.exactProductIds)!==JSON.stringify(exact))errors.push('exact-cohort');
  if(cohort.state!=='DRAFT_NOT_FROZEN_MISSING_EXACT_PROVIDER_AND_PORTAL_IDENTITIES'||cohort.authorizationState!=='NOT_AUTHORIZED')errors.push('cohort-freeze');
  if((states.products||[]).length!==5||states.products.some(x=>x.state!=='PREFLIGHT_REQUIRED'))errors.push('state-machine');
  if(wave.state!=='CANARY_NOT_SELECTABLE_UNTIL_ALL_PRODUCT_PREFLIGHT_COMPLETE'||wave.parallelizationAllowed!==false)errors.push('wave-plan');
  if((dns.products||[]).length!==5||dns.liveAcceptance!==false)errors.push('dns-tls');
  if((external.products||[]).length!==5||external.rawSecretValuesStored!==false)errors.push('external-services');
  if(stabilization.state!=='NOT_STARTED_PRODUCTION_NOT_DEPLOYED'||stabilization.portfolioDecision!=='NO_GO')errors.push('stabilization');
  const raw=requiredFiles.map(f=>fs.readFileSync(path.join(root,'deployment',f),'utf8')).join('\n');
  if(/(?:sk_live_|rk_live_|ghp_|github_pat_|postgres(?:ql)?:\/\/[^"\s]+:[^"\s]+@|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY)/i.test(raw))errors.push('secret-material');
 }
 return{ok:errors.length===0,errors,releaseVersion:data.releaseVersion,packId:data.packId,cohortCount:data.cohortCount,currentState:data.currentState,cohortFrozen:data.cohortFrozen,portfolioAuthorized:data.portfolioAuthorized,deploymentStarted:data.deploymentStarted,productionDeployed:data.productionDeployed,liveAccepted:data.liveAccepted,launchState:data.launchState};
}
function ownerView(){return{record:clone(data),validation:validate(),cohort:readJson('deployment/launch-cohort-manifest.json'),stateMachine:readJson('deployment/launch-state-machine.json'),wavePlan:readJson('deployment/canary-wave-plan.json'),dnsTls:readJson('deployment/dns-tls-canonical-origin-matrix.json'),externalServices:readJson('deployment/external-service-activation-matrix.json'),stabilization:readJson('deployment/production-stabilization-watch.json')};}
module.exports={requiredFiles,validate,ownerView};
