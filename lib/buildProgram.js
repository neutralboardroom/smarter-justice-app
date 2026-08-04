const fs = require('fs');
const path = require('path');
const store = require('./store');

const PROGRAM_VERSION = '1.0.0';
const STATUSES = ['proposed','under review','approved','planned','in progress','code complete','automated tests passed','exact artifact tested','staged','deployed','live verified','operationally accepted','pilot approved','broad launch approved','closed and monitored','blocked','paused','deferred','rejected','superseded','rolled back','deprecated','not applicable'];
const PRIORITIES = ['critical','high','medium','low','backlog'];
const CATEGORIES = ['experience','professional','public user','forms','dashboard','identity','security','privacy','legal','payments','email','infrastructure','deployment','support','operations','analytics','accessibility','mobile','marketing','governance','technical debt','other'];
const TYPES = ['shared master','portal specific','current release','launch evidence','bug','risk','decision','technical debt','deprecation'];

function clean(v,max=5000){ return String(v == null ? '' : v).trim().slice(0,max); }
function list(v){ return Array.isArray(v) ? v.map(x=>clean(x,1000)).filter(Boolean).slice(0,100) : clean(v,10000).split(/\r?\n|\s*;\s*/).map(x=>x.trim()).filter(Boolean).slice(0,100); }
function one(v, allowed, fallback){ return allowed.includes(v) ? v : fallback; }
function bool(v){ return v === true || v === 'true' || v === 'on' || v === 1 || v === '1'; }
function now(){ return store.now(); }

function inferredStatus(tag){
  const t=tag.toLowerCase();
  if(t.includes('exact artifact tested')) return 'exact artifact tested';
  if(t.includes('automated tests passed') || t.includes('automated in v1.7.0')) return 'automated tests passed';
  if(t.includes('code complete')) return 'code complete';
  if(t.includes('completed in v1.7.0') || t.includes('strengthened in v1.7.0') || t.includes('completed in v1.7.1') || t.includes('completed in v1.7.2') || t.includes('existing foundation')) return 'exact artifact tested';
  if(t.includes('completed in v1.7.4')) return 'code complete';
  if(t.includes('planned: v1.7.3') || t.includes('planned: v1.7.4') || t.includes('planned: v1.7.5')) return 'planned';
  if(t.includes('deferred')) return 'deferred';
  if(t.includes('post-pilot') || t.includes('future only')) return 'deferred';
  if(t.includes('ongoing governance')) return 'approved';
  return 'proposed';
}
function inferredTarget(tag){
  const m=tag.match(/v\d+\.\d+\.\d+/i); return m ? m[0] : (tag.toLowerCase().includes('post-pilot') ? 'Post-pilot' : 'Backlog');
}
function inferredCategory(text){
  const t=text.toLowerCase();
  const rules=[['payment','payments'],['stripe','payments'],['billing','payments'],['email','email'],['database','infrastructure'],['postgres','infrastructure'],['deploy','deployment'],['rollback','deployment'],['security','security'],['mfa','security'],['privacy','privacy'],['consent','privacy'],['legal','legal'],['attorney advertising','legal'],['dashboard','dashboard'],['professional','professional'],['firm','professional'],['public','public user'],['portal','governance'],['control center','governance'],['accessib','accessibility'],['mobile','mobile'],['marketing','marketing'],['sales','marketing'],['support','support'],['refund','operations'],['operations','operations'],['analytics','analytics'],['form','forms'],['identity','identity']];
  for(const [needle,cat] of rules) if(t.includes(needle)) return cat;
  return 'other';
}
function seedMasterItems(){
  const file=path.join(__dirname,'..','NEXT_BUILD_MASTER_LIST.md');
  let text=''; try{text=fs.readFileSync(file,'utf8');}catch{}
  return text.split(/\r?\n/).map(line=>{
    const standard=line.match(/^(\d+)\.\s+\*\*\[([^\]]+)\]\*\*\s+(.+)$/);
    const wrapped=line.match(/^(\d+)\.\s+\*\*\[([^\]]+)\]\s+(.+?)\*\*\s*(.*)$/);
    const m=standard||wrapped; if(!m)return null;
    const number=m[1], tag=m[2], title=clean(m[3],500), detail=wrapped?clean(`${m[3]} ${m[4]}`,5000):clean(m[3],5000);
    const id=`SJ-MASTER-${String(number).padStart(3,'0')}`;
    return { id, type:'shared master', portalSlug:'general-smarter-justice-start', title, description:detail, sourceTag:tag, priority:Number(number)<=50?'critical':Number(number)<=111?'high':'medium', targetRelease:inferredTarget(tag), status:inferredStatus(tag), category:inferredCategory(detail), acceptanceCriteria:[], requiredTests:[], dependencies:[], evidence:[], blockers:[], ownerDecision:'Approved master-list item', createdAt:'2026-07-20T00:00:00.000Z', updatedAt:'2026-07-20T00:00:00.000Z', systemSeed:true };
  }).filter(Boolean);
}
function defaultRecords(){ return { customItems:[], itemOverrides:{}, releaseRecords:[
  {id:'SJ-REL-1.7.9',version:'1.7.9',portalSlug:'general-smarter-justice-start',title:'Predeployment Governance, Portal Truth, Readiness, and Workflow Inventory',status:'exact artifact tested',zipName:'smarter-justice-v1.7.9.zip',sha256:'',gitCommit:'',deployed:false,liveVerified:false,notes:'Maintained improvement queue, structured release evidence, readiness dimensions, truthful specialty-portal registration, capability deviations, official-form workflow inventory, profile-data operations standard, and professional application clarity. Production remains last verified v1.6.1.',createdAt:'2026-07-21T00:00:00.000Z',updatedAt:'2026-07-21T00:00:00.000Z'},
  {id:'SJ-REL-1.7.8',version:'1.7.8',portalSlug:'general-smarter-justice-start',title:'Customer Experience, Dashboard, Funnel, Form Completion, and Responsive UX Refinement',status:'exact artifact tested',zipName:'smarter-justice-v1.7.8.zip',sha256:'',gitCommit:'',deployed:false,liveVerified:false,notes:'Evidence-based refinements to the public-first homepage, quick-start examples, story-route actions, saved-work dashboard, focused portal availability language, professional dashboard, form-support explanations, kiosk messages, practice-area status panels, mobile action stacking, and customer-language regression coverage. v1.7.7 remains rollback. Paid and sensitive gates remain closed.',createdAt:'2026-07-21T00:00:00.000Z',updatedAt:'2026-07-21T00:00:00.000Z'},
  {id:'SJ-REL-1.7.7',version:'1.7.7',portalSlug:'general-smarter-justice-start',title:'Security, Privacy, Durability, and Controlled Deployment Corrections',status:'exact artifact tested',zipName:'smarter-justice-v1.7.7.zip',sha256:'',gitCommit:'',deployed:false,liveVerified:false,notes:'Corrective release addressing sensitive-traffic emergency shutdown, CSRF protection, restricted internal page delivery, verified Stop Sign Project destination links, runtime customer language, awaited serialized mutations, upload-content validation, continuation-link lifecycle, controlled Render deployment, migration tooling, and SBOM generation. Paid and sensitive gates remain closed.',createdAt:'2026-07-21T00:00:00.000Z',updatedAt:'2026-07-21T00:00:00.000Z'},
  {id:'SJ-REL-1.7.6',version:'1.7.6',portalSlug:'general-smarter-justice-start',title:'Customer Experience, Public Language, Funnel, and Responsive UX Refinement',status:'exact artifact tested',zipName:'smarter-justice-v1.7.6.zip',sha256:'',gitCommit:'',deployed:false,liveVerified:false,notes:'Evidence-based public copy and funnel refinement; customer-facing staff, launch, readiness, and technical language removal; clearer free-public and professional actions; professional dashboard plain-language states; responsive touch-target, overflow, and input-zoom safeguards; and an active reciprocal Justice Truck and Smarter Justice brand relationship. Paid, sensitive, booking, review, and unrestricted matching gates remain closed.',createdAt:'2026-07-21T00:00:00.000Z',updatedAt:'2026-07-21T00:00:00.000Z'},
  {id:'SJ-REL-1.7.5',version:'1.7.5',portalSlug:'general-smarter-justice-start',title:'Production Paid-Pilot Evidence and Controlled Activation Readiness',status:'exact artifact tested',zipName:'smarter-justice-v1.7.5.zip',sha256:'',gitCommit:'',deployed:false,liveVerified:false,notes:'Versioned PostgreSQL migrations, cross-instance advisory transaction locking, database health and reconnect checks, explicit sensitive-traffic and professional-payment activation flags, professional email verification before account access or marketplace record creation, authenticated sender readiness, owner operational-readiness panel, and a truthful bridge to the separately built StopSignProject.org domestic-violence portal. External production evidence and deployment remain pending.',createdAt:'2026-07-20T00:00:00.000Z',updatedAt:'2026-07-20T00:00:00.000Z'},
  {id:'SJ-REL-1.7.2',version:'1.7.2',portalSlug:'general-smarter-justice-start',title:'Official Portal Domain Network and Professional Participation Visibility',status:'exact artifact tested',zipName:'smarter-justice-v1.7.2.zip',sha256:'',gitCommit:'',deployed:false,liveVerified:false,notes:'Exact-artifact-tested official portal-domain network release; production remains v1.6.1 until controlled deployment and live verification.',createdAt:'2026-07-20T00:00:00.000Z',updatedAt:'2026-07-20T00:00:00.000Z'},
  {id:'SJ-REL-1.7.3',version:'1.7.3',portalSlug:'general-smarter-justice-start',title:'Paid Founding-Professional Pilot and Seven-Practice Launch Readiness',status:'exact artifact tested',zipName:'smarter-justice-v1.7.3.zip',sha256:'',gitCommit:'',deployed:false,liveVerified:false,notes:'Exact-artifact-tested pilot application, evidence gate, support, and seven-practice launch-readiness release; external launch evidence and deployment remain pending.',createdAt:'2026-07-20T00:00:00.000Z',updatedAt:'2026-07-20T00:00:00.000Z'},
  {id:'SJ-REL-1.7.4',version:'1.7.4',portalSlug:'general-smarter-justice-start',title:'Paid Pilot Operating Foundation, Shared Revenue Model, and NYC Field Launch',status:'exact artifact tested',zipName:'smarter-justice-v1.7.4.zip',sha256:'',gitCommit:'',deployed:false,liveVerified:false,notes:'Transactional pilot records, Stripe event ledger, recurring billing lifecycle handling, fail-closed public Human Review service/order/refund operations, shared free-AI/paid-human-review model, NYC two-sided field launch, physical-material registry, Justice Truck origin story, and Stop Sign Project foundation. The final ZIP passed fresh-extraction testing on Node 22; external operating evidence and deployment remain pending.',createdAt:'2026-07-20T00:00:00.000Z',updatedAt:'2026-07-20T00:00:00.000Z'},
  {id:'SJ-REL-1.7.1',version:'1.7.1',portalSlug:'general-smarter-justice-start',title:'Visible Build Program Control Center',status:'exact artifact tested',zipName:'smarter-justice-v1.7.1.zip',sha256:'e356e0d3248300fb197109a1cc8f7a5a2910f3bae56cf8afc41dfa073d3fa5ba',gitCommit:'',deployed:false,liveVerified:false,notes:'Exact-artifact-tested Build Program Control Center release; production remained v1.6.1.',createdAt:'2026-07-20T00:00:00.000Z',updatedAt:'2026-07-20T00:00:00.000Z'},
  {id:'SJ-REL-1.7.0',version:'1.7.0',portalSlug:'general-smarter-justice-start',title:'Professional Pilot Experience and Homepage Rebuild',status:'exact artifact tested',zipName:'smarter-justice-v1.7.0.zip',sha256:'454d5c7ebf35937da7e733db897b53b0730f21653ba5bc5c52d8da34e3056850',gitCommit:'',deployed:false,liveVerified:false,notes:'Exact-artifact-tested professional-first experience release; production remained v1.6.1.',createdAt:'2026-07-20T00:00:00.000Z',updatedAt:'2026-07-20T00:00:00.000Z'}
], evidenceRecords:[], decisions:[], risks:[], portalListPolicies:[] }; }
function records(){ const saved=store.readJson('buildProgram.json',null); return saved && typeof saved==='object' ? {...defaultRecords(),...saved} : defaultRecords(); }
function save(data){ store.writeJson('buildProgram.json',data); return data; }
function mergedItems(){
  const data=records();
  return [...seedMasterItems(),...(data.customItems||[])].map(item=>({...item,...((data.itemOverrides||{})[item.id]||{})})).sort((a,b)=>String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
}
function summary(items,releases,evidence,risks){
  const count=status=>items.filter(x=>x.status===status).length;
  return { totalItems:items.length, critical:items.filter(x=>x.priority==='critical').length, inProgress:count('in progress'), blocked:count('blocked'), exactArtifactTested:count('exact artifact tested'), deployed:count('deployed'), liveVerified:count('live verified'), pilotApproved:count('pilot approved'), releases:releases.length, evidenceRecords:evidence.length, openRisks:risks.filter(x=>!['closed','accepted','superseded'].includes(x.status)).length, missingAcceptanceCriteria:items.filter(x=>!(x.acceptanceCriteria||[]).length && !x.systemSeed).length, missingTests:items.filter(x=>!(x.requiredTests||[]).length && !x.systemSeed).length };
}
function getData(){ const data=records(); const items=mergedItems(); return {programVersion:PROGRAM_VERSION,generatedAt:now(),enums:{statuses:STATUSES,priorities:PRIORITIES,categories:CATEGORIES,types:TYPES},summary:summary(items,data.releaseRecords||[],data.evidenceRecords||[],data.risks||[]),items,releases:data.releaseRecords||[],evidence:data.evidenceRecords||[],decisions:data.decisions||[],risks:data.risks||[],portalListPolicies:data.portalListPolicies||[]}; }
function normalizeItem(input,current={}){
  const id=clean(input.id||current.id,100).toUpperCase().replace(/[^A-Z0-9._-]/g,'-');
  return {...current,id,type:one(input.type,TYPES,current.type||'portal specific'),portalSlug:clean(input.portalSlug||current.portalSlug||'general-smarter-justice-start',120),title:clean(input.title||current.title,500),description:clean(input.description??current.description,5000),priority:one(input.priority,PRIORITIES,current.priority||'medium'),targetRelease:clean(input.targetRelease??current.targetRelease,120),status:one(input.status,STATUSES,current.status||'proposed'),category:one(input.category,CATEGORIES,current.category||'other'),userTypes:list(input.userTypes??current.userTypes),problem:clean(input.problem??current.problem,3000),expectedBenefit:clean(input.expectedBenefit??current.expectedBenefit,3000),dependencies:list(input.dependencies??current.dependencies),externalDependencies:list(input.externalDependencies??current.externalDependencies),acceptanceCriteria:list(input.acceptanceCriteria??current.acceptanceCriteria),requiredTests:list(input.requiredTests??current.requiredTests),testResults:list(input.testResults??current.testResults),evidence:list(input.evidence??current.evidence),blockers:list(input.blockers??current.blockers),ownerDecision:clean(input.ownerDecision??current.ownerDecision,3000),gitCommit:clean(input.gitCommit??current.gitCommit,100),zipName:clean(input.zipName??current.zipName,300),sha256:clean(input.sha256??current.sha256,100),rollback:clean(input.rollback??current.rollback,3000),notes:clean(input.notes??current.notes,5000),updatedAt:now(),createdAt:current.createdAt||now(),systemSeed:Boolean(current.systemSeed)};
}
function upsertItem(input,actor='owner'){
  const data=records(); const all=mergedItems(); const existing=all.find(x=>x.id===clean(input.id,100).toUpperCase());
  if(!existing && !clean(input.title,500)) return {error:'Add a build-item title.'};
  let id=clean(input.id,100).toUpperCase(); if(!id) id=`SJ-CUSTOM-${String((data.customItems||[]).length+1).padStart(3,'0')}`;
  const normalized=normalizeItem({...input,id},existing||{});
  if(!normalized.id || !normalized.title) return {error:'Add a valid item ID and title.'};
  if(existing?.systemSeed){ data.itemOverrides=data.itemOverrides||{}; data.itemOverrides[id]={...(data.itemOverrides[id]||{}),...normalized,systemSeed:undefined}; }
  else { data.customItems=data.customItems||[]; const i=data.customItems.findIndex(x=>x.id===id); if(i>=0)data.customItems[i]=normalized; else data.customItems.push(normalized); }
  save(data); store.addAudit({actor,action:'build_program_item_upserted',details:{id,status:normalized.status,targetRelease:normalized.targetRelease,portalSlug:normalized.portalSlug}}); return {item:normalized};
}
function addRecord(kind,input,actor='owner'){
  const map={release:'releaseRecords',evidence:'evidenceRecords',decision:'decisions',risk:'risks',policy:'portalListPolicies'}; const key=map[kind]; if(!key)return {error:'Unknown record type.'};
  const data=records(); data[key]=data[key]||[];
  const prefix={release:'REL',evidence:'EVID',decision:'DEC',risk:'RISK',policy:'POLICY'}[kind]; const id=clean(input.id,100)||`SJ-${prefix}-${Date.now().toString(36).toUpperCase()}`;
  const record={...input,id,title:clean(input.title,500),portalSlug:clean(input.portalSlug||'general-smarter-justice-start',120),status:clean(input.status||'open',100),description:clean(input.description||input.notes,5000),version:clean(input.version,100),zipName:clean(input.zipName,300),sha256:clean(input.sha256,100),gitCommit:clean(input.gitCommit,100),evidenceType:clean(input.evidenceType,120),itemIds:list(input.itemIds),ownerApproved:bool(input.ownerApproved),deployed:bool(input.deployed),liveVerified:bool(input.liveVerified),createdAt:input.createdAt||now(),updatedAt:now()};
  const i=data[key].findIndex(x=>x.id===id); if(i>=0)data[key][i]={...data[key][i],...record}; else data[key].unshift(record);
  save(data); store.addAudit({actor,action:`build_program_${kind}_upserted`,details:{id,portalSlug:record.portalSlug,status:record.status}}); return {record};
}
function exportMarkdown(){ const d=getData(); const lines=[`# Smarter Justice Build Program Export`,``,`Generated: ${d.generatedAt}`,`Program version: ${d.programVersion}`,``,`## Summary`,``,...Object.entries(d.summary).map(([k,v])=>`- ${k}: ${v}`),``,`## Build items`,``,...d.items.map(i=>`- **${i.id}** [${i.status}] [${i.priority}] [${i.targetRelease||'Unassigned'}] ${i.title}`),``,`## Releases`,``,...d.releases.map(r=>`- **${r.version||r.id}** — ${r.status}; ZIP ${r.zipName||'not recorded'}; deployed ${Boolean(r.deployed)}; live verified ${Boolean(r.liveVerified)}`),``,`## Decisions`,``,...d.decisions.map(x=>`- **${x.id}** [${x.status}] ${x.title||x.description}`),``,`## Risks and blockers`,``,...d.risks.map(x=>`- **${x.id}** [${x.status}] ${x.title||x.description}`)]; return lines.join('\n'); }
module.exports={PROGRAM_VERSION,STATUSES,PRIORITIES,CATEGORIES,TYPES,getData,upsertItem,addRecord,exportMarkdown};
