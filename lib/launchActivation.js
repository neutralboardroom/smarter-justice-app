const store = require('./store');
const launchCommandCenter = require('./launchCommandCenter');
const professionalMarketplace = require('./professionalMarketplace');
const portalPresenceManagement = require('./portalPresenceManagement');
const { TARGET_RELEASE_VERSION, listFourPortalLaunch, DOMESTIC_VIOLENCE_SAFETY_REQUIREMENTS } = require('../data/fourPortalLaunchV1751');

const STORE_KEY = 'launchActivation.json';
const STANDARD_VERSION = '1.0.0';
const PORTALS = Object.freeze(listFourPortalLaunch().map(item=>Object.freeze({ id:item.portalId, name:item.name, domain:item.domain||'Domain not owner-confirmed', safetyCritical:item.safetyCritical===true })));
const EVIDENCE_STATUSES = Object.freeze(['draft','recorded','accepted','rejected','superseded']);
const REHEARSAL_TYPES = Object.freeze(['public-start','attorney-account','profile-claim','profile-edit','portal-export-import','support','incident','rollback','mobile-qr','accessibility','domestic-violence-safe-entry','domestic-violence-quick-exit','domestic-violence-confidential-location','domestic-violence-safe-contact','stop-sign-project-continuity']);
const REHEARSAL_STATUSES = Object.freeze(['planned','in-progress','passed','failed','blocked']);
const ISSUE_SEVERITIES = Object.freeze(['low','medium','high','critical']);
const ISSUE_STATUSES = Object.freeze(['open','investigating','resolved','accepted-risk']);

function clean(value, max=500){ return String(value ?? '').trim().slice(0,max); }
function list(value, maxItems=30, maxLength=500){
  const input = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  return input.map(x=>clean(x,maxLength)).filter(Boolean).slice(0,maxItems);
}
function bool(value){ return value === true || /^(1|true|yes|on)$/i.test(String(value || '')); }
function int(value, fallback=0, min=0, max=10000){ const n=Number(value); return Number.isInteger(n) ? Math.max(min,Math.min(max,n)) : fallback; }
function oneOf(value, allowed, fallback){ const normalized=clean(value,80); return allowed.includes(normalized) ? normalized : fallback; }
function defaultState(){
  return {
    schemaVersion:'1.0.0', standardVersion:STANDARD_VERSION, releaseVersion:TARGET_RELEASE_VERSION,
    plan:{
      name:'Initial Four-Portal Launch', status:'planning', targetDate:'', owner:'Roger',
      cohortName:'NYC Attorney Launch Cohort', cohortCap:25, supportOwner:'', incidentOwner:'',
      supportHours:'', rollbackArtifact:'', rollbackSha256:'', notes:'',
      publicAudience:'People seeking a clear starting point for divorce and family, estate, personal-injury, or domestic-violence-related legal and resource needs.',
      professionalAudience:'Attorneys and law firms participating in Divorce Law Aid, Estate Law Aid, Personal Injury Law Aid, or Domestic Violence Aid; supported Domestic Violence organizations remain subject to separate authority and safety review.',
      launchPortals:PORTALS.map(x=>x.id), updatedAt:''
    },
    evidence:[], rehearsals:[], issues:[], updatedAt:''
  };
}
function normalizeState(raw){
  const base={...defaultState(),...(raw||{})};
  base.plan={...defaultState().plan,...(raw?.plan||{})};
  base.plan.launchPortals=list(base.plan.launchPortals,4,80).filter(x=>PORTALS.some(p=>p.id===x));
  if(!base.plan.launchPortals.length) base.plan.launchPortals=PORTALS.map(x=>x.id);
  base.evidence=Array.isArray(raw?.evidence)?raw.evidence:[];
  base.rehearsals=Array.isArray(raw?.rehearsals)?raw.rehearsals:[];
  base.issues=Array.isArray(raw?.issues)?raw.issues:[];
  return base;
}
function readState(){ return normalizeState(store.readJson(STORE_KEY,defaultState())); }
function writeState(state){ state.updatedAt=store.now(); store.writeJson(STORE_KEY,state); return state; }

function evidenceMap(state){ return new Map(state.evidence.filter(x=>x.status==='accepted').map(x=>[x.checkKey,x])); }
function blockerPriority(check){
  if(check.key.startsWith('evidence:domestic_violence')) return 'P0';
  if(check.key.startsWith('machine:database') || ['machine:production_runtime','machine:https_canonical_base','machine:owner_account','machine:owner_mfa','machine:smtp_configured'].includes(check.key)) return 'P0';
  if(['evidence:support_owner','evidence:support_runbook','evidence:incident_owner','evidence:incident_runbook','evidence:privacy','evidence:accessibility','evidence:cohort','evidence:monitoring','evidence:rollback_artifact','approval:public_free','approval:free_profiles'].includes(check.key)) return 'P0';
  if(check.key.includes('stripe') || check.key.includes('refund') || check.key.includes('paid') || check.key.includes('professional_growth') || check.key.includes('attorney_advertising') || check.key.includes('fee_sharing') || check.key.includes('sponsored')) return 'P1';
  return 'P1';
}
function actionFor(check){
  const key=check.key;
  if(key.startsWith('evidence:domestic_violence')) return 'Complete the named survivor-safety acceptance with dated evidence; keep the portal and affected action closed until accepted.';
  if(key.startsWith('machine:')) return 'Configure and verify the production environment; attach machine-generated evidence.';
  if(key.startsWith('approval:')) return 'Complete all prerequisite evidence, then record explicit owner approval outside this workbench.';
  if(key.includes('support')) return 'Name the support owner, hours, response target, escalation path, and complaint process.';
  if(key.includes('incident')) return 'Name the incident owner and rehearse detection, containment, recovery, and communication.';
  if(key.includes('accessibility')) return 'Complete phone, tablet, desktop, keyboard, zoom, and assistive-technology acceptance.';
  if(key.includes('privacy')) return 'Review only the data flows that will launch and record the accepted privacy reference.';
  if(key.includes('cohort')) return 'Define a bounded first attorney cohort, cap, outreach source, and pause criteria.';
  if(key.includes('monitoring')) return 'Configure an external HTTPS health monitor and alert destination.';
  if(key.includes('rollback')) return 'Identify the exact rollback ZIP, SHA-256, operator, and restore procedure.';
  return 'Complete the required external evidence and record its authoritative reference.';
}
function derivedBlockers(command,state){
  const accepted=evidenceMap(state);
  const seen=new Map();
  for(const lane of command.lanes||[]){
    for(const check of lane.checks||[]){
      if(check.ready) continue;
      const current=seen.get(check.key)||{...check,lanes:[]};
      if(!current.lanes.includes(lane.name)) current.lanes.push(lane.name);
      seen.set(check.key,current);
    }
  }
  if(state.plan.launchPortals.includes('domestic-violence-aid')){
    for(const requirement of DOMESTIC_VIOLENCE_SAFETY_REQUIREMENTS){
      if(accepted.has(requirement.key)) continue;
      if(!seen.has(requirement.key)) seen.set(requirement.key,{key:requirement.key,label:requirement.label,category:'domestic-violence-safety',ready:false,reason:'Required survivor-safety evidence has not been accepted.',lanes:['Initial Four-Portal Launch']});
    }
  }
  return [...seen.values()].map(check=>({
    ...check, priority:blockerPriority(check), action:actionFor(check),
    workbenchEvidenceAccepted:accepted.has(check.key),
    workbenchEvidenceId:accepted.get(check.key)?.id||''
  })).sort((a,b)=>a.priority.localeCompare(b.priority)||String(a.category||'').localeCompare(String(b.category||''))||String(a.label||'').localeCompare(String(b.label||'')));
}
function rehearsalSummary(state){
  const byStatus=Object.fromEntries(REHEARSAL_STATUSES.map(x=>[x,0]));
  for(const item of state.rehearsals) byStatus[item.status]=(byStatus[item.status]||0)+1;
  const required=new Set(REHEARSAL_TYPES);
  const passedTypes=new Set(state.rehearsals.filter(x=>x.status==='passed').map(x=>x.type));
  return {total:state.rehearsals.length,byStatus,requiredTypes:[...required],passedTypes:[...passedTypes],missingTypes:[...required].filter(x=>!passedTypes.has(x))};
}
function ownerView(){
  const state=readState();
  const command=launchCommandCenter.ownerView();
  const marketplace=professionalMarketplace.getOwnerData();
  const presence=portalPresenceManagement.ownerView();
  const blockers=derivedBlockers(command,state);
  const openIssues=state.issues.filter(x=>!['resolved','accepted-risk'].includes(x.status));
  const criticalIssues=openIssues.filter(x=>x.severity==='critical');
  const rehearsals=rehearsalSummary(state);
  return {
    standardVersion:STANDARD_VERSION,releaseVersion:TARGET_RELEASE_VERSION,generatedAt:store.now(),
    plan:state.plan,portals:PORTALS,evidence:state.evidence,rehearsals:state.rehearsals,issues:state.issues,
    launchCommand:{overallStatus:command.overallStatus,summary:command.summary,lanes:command.lanes,evidenceDigest:command.evidenceDigest},
    blockers,summary:{
      p0Blockers:blockers.filter(x=>x.priority==='P0').length,p1Blockers:blockers.filter(x=>x.priority==='P1').length,
      acceptedWorkbenchEvidence:state.evidence.filter(x=>x.status==='accepted').length,
      openIssues:openIssues.length,criticalIssues:criticalIssues.length,
      rehearsalPasses:rehearsals.byStatus.passed||0,rehearsalMissingTypes:rehearsals.missingTypes.length,
      outreachCampaigns:marketplace.outreachCampaigns?.length||0,outreachProspects:marketplace.outreachProspects?.length||0,
      portalAcceptanceRecords:presence.acceptanceRecords?.length||presence.summary?.acceptanceRecords||0
    },
    rehearsalSummary:rehearsals,
    activationBoundary:{
      canOpenLiveGate:false,
      reason:'This workbench records launch preparation only. Environment flags, legal review, exact portal evidence, and explicit owner activation remain separate fail-closed controls.',
      closed:['Deployment','Live portal imports','Paid membership','Sponsored placement','Case opportunities','Automatic portal writes','Domestic Violence confidential uploads','Domestic Violence automatic notifications','Domestic Violence organization publication without accepted authority and safety evidence']
    },
    enums:{evidenceStatuses:EVIDENCE_STATUSES,rehearsalTypes:REHEARSAL_TYPES,rehearsalStatuses:REHEARSAL_STATUSES,issueSeverities:ISSUE_SEVERITIES,issueStatuses:ISSUE_STATUSES}
  };
}
function updatePlan(input,actor='owner-control-center'){
  const state=readState(); const prior={...state.plan};
  for(const field of ['name','targetDate','owner','cohortName','supportOwner','incidentOwner','supportHours','rollbackArtifact','rollbackSha256','notes','publicAudience','professionalAudience']) if(Object.prototype.hasOwnProperty.call(input,field)) state.plan[field]=clean(input[field],field==='notes'?5000:500);
  if(Object.prototype.hasOwnProperty.call(input,'cohortCap')) state.plan.cohortCap=int(input.cohortCap,state.plan.cohortCap,1,500);
  if(Object.prototype.hasOwnProperty.call(input,'status')) state.plan.status=oneOf(input.status,['planning','evidence-in-progress','rehearsal','ready-for-owner-decision','paused','launched','rolled-back'],'planning');
  if(Object.prototype.hasOwnProperty.call(input,'launchPortals')){
    const selected=list(input.launchPortals,4,80).filter(x=>PORTALS.some(p=>p.id===x));
    if(selected.length) state.plan.launchPortals=selected;
  }
  state.plan.updatedAt=store.now(); writeState(state);
  store.addAudit({actor,action:'launch_activation_plan_updated',details:{priorStatus:prior.status,status:state.plan.status,cohortCap:state.plan.cohortCap}});
  return {plan:state.plan};
}
function recordEvidence(input,actor='owner-control-center'){
  const state=readState(); const checkKey=clean(input.checkKey,180); if(!checkKey) return {error:'Choose a launch check.'};
  const item={id:store.uid('launch_evidence',8),checkKey,title:clean(input.title,240)||checkKey,status:oneOf(input.status,EVIDENCE_STATUSES,'recorded'),owner:clean(input.owner,180),reference:clean(input.reference,1000),evidence:list(input.evidence,30,1000),notes:clean(input.notes,5000),recordedAt:store.now(),reviewedAt:['accepted','rejected'].includes(input.status)?store.now():''};
  state.evidence.unshift(item); writeState(state); store.addAudit({actor,action:'launch_activation_evidence_recorded',details:{id:item.id,checkKey:item.checkKey,status:item.status}}); return {evidence:item};
}
function recordRehearsal(input,actor='owner-control-center'){
  const state=readState(); const type=oneOf(input.type,REHEARSAL_TYPES,'public-start');
  const item={id:store.uid('launch_rehearsal',8),type,status:oneOf(input.status,REHEARSAL_STATUSES,'planned'),title:clean(input.title,240)||type,device:clean(input.device,180),operator:clean(input.operator,180),startedAt:clean(input.startedAt,80),completedAt:clean(input.completedAt,80),evidence:list(input.evidence,30,1000),findings:list(input.findings,30,1000),notes:clean(input.notes,5000),recordedAt:store.now()};
  state.rehearsals.unshift(item); writeState(state); store.addAudit({actor,action:'launch_activation_rehearsal_recorded',details:{id:item.id,type:item.type,status:item.status}}); return {rehearsal:item};
}
function recordIssue(input,actor='owner-control-center'){
  const state=readState(); const title=clean(input.title,240); if(!title) return {error:'Add an issue title.'};
  const item={id:store.uid('launch_issue',8),title,severity:oneOf(input.severity,ISSUE_SEVERITIES,'medium'),status:oneOf(input.status,ISSUE_STATUSES,'open'),owner:clean(input.owner,180),area:clean(input.area,180),description:clean(input.description,5000),pauseTrigger:bool(input.pauseTrigger),resolution:clean(input.resolution,5000),createdAt:store.now(),updatedAt:store.now()};
  state.issues.unshift(item); writeState(state); store.addAudit({actor,action:'launch_activation_issue_recorded',details:{id:item.id,severity:item.severity,status:item.status,pauseTrigger:item.pauseTrigger}}); return {issue:item};
}
function exportMarkdown(){
  const view=ownerView(); const lines=[`# Smarter Justice Four-Portal Launch Activation Packet`,``,`Release: ${view.releaseVersion}`,`Generated: ${view.generatedAt}`,`Plan: ${view.plan.name}`,`Status: ${view.plan.status}`,`Target date: ${view.plan.targetDate||'Not set'}`,`Cohort: ${view.plan.cohortName} (cap ${view.plan.cohortCap})`,`Owner: ${view.plan.owner||'Not set'}`,`Support owner: ${view.plan.supportOwner||'Not set'}`,`Incident owner: ${view.plan.incidentOwner||'Not set'}`,``,`## Launch portals`,...view.portals.map(x=>`- ${x.name} — ${x.domain}`),``,`## Fail-closed status`,`- Overall preflight: ${view.launchCommand.overallStatus}`,`- P0 blockers: ${view.summary.p0Blockers}`,`- P1 blockers: ${view.summary.p1Blockers}`,`- Open issues: ${view.summary.openIssues}`,`- Missing rehearsal types: ${view.summary.rehearsalMissingTypes}`,``,`## Prioritized blockers`,...view.blockers.map(x=>`- **${x.priority} ${x.label}** (${x.key}) — ${x.action}`),``,`## Rehearsals`,...view.rehearsals.map(x=>`- ${x.type}: ${x.status} — ${x.title}`),``,`## Issues`,...view.issues.map(x=>`- ${x.severity.toUpperCase()} ${x.status}: ${x.title}`),``,`## Activation boundary`,view.activationBoundary.reason]; return lines.join('\n');
}
module.exports={STORE_KEY,STANDARD_VERSION,TARGET_RELEASE_VERSION,PORTALS,EVIDENCE_STATUSES,REHEARSAL_TYPES,REHEARSAL_STATUSES,ISSUE_SEVERITIES,ISSUE_STATUSES,readState,ownerView,updatePlan,recordEvidence,recordRehearsal,recordIssue,exportMarkdown};
