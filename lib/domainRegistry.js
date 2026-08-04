const store = require('./store');
const { DOMAIN_REGISTRY_VERSION, DOMAIN_STATUS_OPTIONS, DOMAIN_REGISTRY_SEEDS } = require('../data/domainRegistrySeed');

function clean(v,max=2000){ return String(v == null ? '' : v).trim().slice(0,max); }
function bool(v){ return v === true || v === 'true' || v === 'on' || v === 1 || v === '1'; }
function one(v, allowed, fallback){ return allowed.includes(v) ? v : fallback; }
function now(){ return store.now(); }
function defaultRecords(){ return { schemaVersion:DOMAIN_REGISTRY_VERSION, overrides:{}, customRecords:[], history:[], updatedAt:'' }; }
function records(){ const saved=store.readJson('domainRegistry.json',null); return saved && typeof saved==='object' ? {...defaultRecords(),...saved} : defaultRecords(); }
function save(data){ data.schemaVersion=DOMAIN_REGISTRY_VERSION; data.updatedAt=now(); store.writeJson('domainRegistry.json',data); return data; }
function normalizeDomain(value){
  const raw=clean(value,253).toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'');
  if(!raw) return '';
  if(!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(raw)) return null;
  return raw;
}
function normalizeUrl(value){
  const raw=clean(value,1000); if(!raw)return '';
  try{const u=new URL(raw); return u.protocol==='https:'?u.toString().replace(/\/$/,''):null;}catch{return null;}
}
function merged(){
  const data=records();
  const base=[...DOMAIN_REGISTRY_SEEDS,...(data.customRecords||[])];
  return base.map(item=>({...item,...((data.overrides||{})[item.id]||{})})).sort((a,b)=>(Number(a.sortOrder||999)-Number(b.sortOrder||999))||String(a.brandName).localeCompare(String(b.brandName)));
}
function summary(items){
  const liveVerified=items.filter(x=>x.deploymentStatus==='live verified'||x.deploymentStatus==='separate live platform').length;
  const inDevelopment=items.filter(x=>['development package','staging','deployed unverified'].includes(x.deploymentStatus)||['testing','in development'].includes(x.portalStatus)).length;
  const planned=items.filter(x=>!['live verified','separate live platform','development package','staging','deployed unverified'].includes(x.deploymentStatus)&&!['testing','in development'].includes(x.portalStatus)).length;
  return {
    total:items.length,
    officialDomains:items.filter(x=>x.ownershipStatus==='owned').length,
    owned:items.filter(x=>x.ownershipStatus==='owned').length,
    purchasePlanned:items.filter(x=>x.ownershipStatus==='purchase planned').length,
    liveVerified,
    liveWebsites:liveVerified,
    inDevelopment,
    planned,
    sslVerified:items.filter(x=>x.sslStatus==='active verified').length,
    canonicalVerified:items.filter(x=>x.canonicalStatus==='verified').length,
    professionalOpen:items.filter(x=>['controlled pilot','open'].includes(x.professionalParticipationStatus)).length,
    applicationsOpen:items.filter(x=>['applications only','controlled pilot','open'].includes(x.professionalParticipationStatus)).length,
    publicVisible:items.filter(x=>x.publicVisible).length
  };
}
function publicRecord(item){
  const live=Boolean(item.liveUrl) && ['live verified','separate live platform'].includes(item.deploymentStatus);
  return {
    id:item.id, portalSlug:item.portalSlug, canonicalPortfolioSlug:item.canonicalPortfolioSlug||'',
    participationPortalSlug:item.canonicalPortfolioSlug||item.portalSlug,
    brandName:item.brandName, domain:item.domain, domainRole:item.domainRole||'primary',
    ownershipStatus:item.ownershipStatus, portalStatus:item.portalStatus,
    dnsStatus:item.dnsStatus, sslStatus:item.sslStatus, deploymentStatus:item.deploymentStatus,
    canonicalStatus:item.canonicalStatus, professionalParticipationStatus:item.professionalParticipationStatus,
    publicUserStatus:item.publicUserStatus, publicSummary:item.publicSummary,
    liveUrl:live?item.liveUrl:'', isLive:live
  };
}
function getPublicData(){
  const items=merged().filter(x=>x.publicVisible && ['owned','domain pending'].includes(x.ownershipStatus)).map(publicRecord);
  const publicSummary=summary(items);
  publicSummary.publicVisible=items.length;
  return { registryVersion:DOMAIN_REGISTRY_VERSION, generatedAt:now(), summary:publicSummary, domains:items };
}
function getOwnerData(){ const items=merged(); const data=records(); return {registryVersion:DOMAIN_REGISTRY_VERSION,generatedAt:now(),enums:DOMAIN_STATUS_OPTIONS,summary:summary(items),domains:items,history:data.history||[]}; }
function normalize(input,current={}){
  const domain=normalizeDomain(input.domain??current.domain); if(domain===null)return {error:'Enter a valid domain name without a path.'};
  const liveUrl=normalizeUrl(input.liveUrl??current.liveUrl); if(liveUrl===null)return {error:'Live URL must use HTTPS.'};
  return {value:{...current,
    id:clean(input.id||current.id,120).toUpperCase().replace(/[^A-Z0-9._-]/g,'-'),
    portalSlug:clean(input.portalSlug??current.portalSlug,160), canonicalPortfolioSlug:clean(input.canonicalPortfolioSlug??current.canonicalPortfolioSlug,160),
    brandName:clean(input.brandName??current.brandName,300), domain,
    ownershipStatus:one(input.ownershipStatus,DOMAIN_STATUS_OPTIONS.ownership,current.ownershipStatus||'domain pending'),
    domainRole:clean(input.domainRole??current.domainRole,120),
    portalStatus:one(input.portalStatus,DOMAIN_STATUS_OPTIONS.portal,current.portalStatus||'planned'),
    dnsStatus:one(input.dnsStatus,DOMAIN_STATUS_OPTIONS.dns,current.dnsStatus||'not configured'),
    sslStatus:one(input.sslStatus,DOMAIN_STATUS_OPTIONS.ssl,current.sslStatus||'not requested'),
    deploymentStatus:one(input.deploymentStatus,DOMAIN_STATUS_OPTIONS.deployment,current.deploymentStatus||'not deployed'),
    canonicalStatus:one(input.canonicalStatus,DOMAIN_STATUS_OPTIONS.canonical,current.canonicalStatus||'not configured'),
    professionalParticipationStatus:one(input.professionalParticipationStatus,DOMAIN_STATUS_OPTIONS.participation,current.professionalParticipationStatus||'not open'),
    publicUserStatus:clean(input.publicUserStatus??current.publicUserStatus,500), publicSummary:clean(input.publicSummary??current.publicSummary,1500),
    liveUrl, sourceNote:clean(input.sourceNote??current.sourceNote,2000), ownerNotes:clean(input.ownerNotes??current.ownerNotes,4000),
    publicVisible:bool(input.publicVisible??current.publicVisible), sortOrder:Number(input.sortOrder??current.sortOrder??999),
    updatedAt:now(), createdAt:current.createdAt||now()
  }};
}
function upsert(input,actor='owner'){
  const data=records(); const all=merged(); let id=clean(input.id,120).toUpperCase();
  if(!id) id=`DOMAIN-CUSTOM-${String((data.customRecords||[]).length+1).padStart(3,'0')}`;
  const current=all.find(x=>x.id===id)||{}; const result=normalize({...input,id},current); if(result.error)return result;
  const next=result.value; if(!next.brandName)return {error:'Add a portal or brand name.'};
  const changedFields=['domain','ownershipStatus','portalStatus','dnsStatus','sslStatus','deploymentStatus','canonicalStatus','professionalParticipationStatus','publicVisible','liveUrl'].filter(key=>String(current[key]??'')!==String(next[key]??''));
  if(DOMAIN_REGISTRY_SEEDS.some(x=>x.id===id)){ data.overrides=data.overrides||{}; data.overrides[id]={...(data.overrides[id]||{}),...next}; }
  else { data.customRecords=data.customRecords||[]; const index=data.customRecords.findIndex(x=>x.id===id); if(index>=0)data.customRecords[index]=next; else data.customRecords.push(next); }
  if(changedFields.length){ data.history=data.history||[]; data.history.unshift({id:`DOMAIN-HISTORY-${Date.now().toString(36).toUpperCase()}`,domainId:id,brandName:next.brandName,changedFields,from:Object.fromEntries(changedFields.map(k=>[k,current[k]??''])),to:Object.fromEntries(changedFields.map(k=>[k,next[k]??''])),actor:clean(actor,120)||'owner',createdAt:now()}); data.history=data.history.slice(0,2000); }
  save(data); store.addAudit({actor,action:'domain_registry_updated',details:{id,domain:next.domain,changedFields}}); return {domain:next,changedFields};
}
function markdown(){
  const data=getOwnerData();
  return ['# Smarter Justice Portal Domain Registry','',`Registry version: ${data.registryVersion}`,`Generated: ${data.generatedAt}`,'','Domain ownership is separate from DNS, SSL, deployment, canonical configuration, live verification, professional participation, and launch approval.','',...data.domains.map(x=>`- **${x.id} — ${x.brandName}**: ${x.domain||'domain pending'}; ownership ${x.ownershipStatus}; portal ${x.portalStatus}; DNS ${x.dnsStatus}; SSL ${x.sslStatus}; deployment ${x.deploymentStatus}; canonical ${x.canonicalStatus}; professional participation ${x.professionalParticipationStatus}; public visible ${Boolean(x.publicVisible)}.`)].join('\n');
}
module.exports={DOMAIN_REGISTRY_VERSION,DOMAIN_STATUS_OPTIONS,getPublicData,getOwnerData,upsert,markdown};
