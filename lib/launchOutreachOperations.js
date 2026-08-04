'use strict';
const crypto = require('crypto');
const store = require('./store');
const launchCohortOperations = require('./launchCohortOperations');
const { TARGET_RELEASE_VERSION, fourPortalIds } = require('../data/fourPortalLaunchV1751');

const STORE_KEY = 'launchOutreachOperations.json';
const STANDARD_VERSION = '1.0.0';
const CAMPAIGN_AUDIENCES = Object.freeze(['public','professional','mixed']);
const CAMPAIGN_STATUSES = Object.freeze(['draft','rehearsal','active','paused','closed']);
const INVITATION_STATUSES = Object.freeze(['issued','opened','redeemed','revoked','expired']);
const EVENT_TYPES = Object.freeze([
  'landing-view','public-start-submitted','portal-direction-shown','professional-search-opened',
  'attorney-launch-view','attorney-interest-submitted','attorney-invitation-opened','attorney-invitation-redeemed'
]);
const PORTAL_IDS = Object.freeze(fourPortalIds());
const MAX_CAMPAIGNS = 500;
const MAX_INVITATIONS = 10000;
const MAX_AGGREGATES = 20000;

function clean(value,max=500){return String(value??'').trim().slice(0,max);}
function code(value){return clean(value,80).toUpperCase().replace(/[^A-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);}
function oneOf(value,allowed,fallback){const v=clean(value,100);return allowed.includes(v)?v:fallback;}
function bool(value){return value===true||/^(1|true|yes|on)$/i.test(String(value||''));}
function int(value,fallback=0,min=0,max=10000){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;}
function list(value,maxItems=20,maxLength=200){const src=Array.isArray(value)?value:String(value||'').split(/\r?\n|,/);return [...new Set(src.map(x=>clean(x,maxLength)).filter(Boolean))].slice(0,maxItems);}
function safePath(value,fallback='/'){const v=clean(value,300);return /^\/[A-Za-z0-9_./?=&%-]*$/.test(v)&&!v.startsWith('//')?v:fallback;}
function safeBase(value){try{const u=new URL(clean(value,1000));return ['https:','http:'].includes(u.protocol)?u.origin:'';}catch{return'';}}
function hashToken(token){return crypto.createHash('sha256').update(String(token||'')).digest('hex');}
function now(){return store.now();}
function clone(value){return JSON.parse(JSON.stringify(value));}
function day(value=new Date()){return new Date(value).toISOString().slice(0,10);}
function portalId(value){const v=clean(value,80);return PORTAL_IDS.includes(v)?v:'';}
function canonicalBase(){return safeBase(process.env.PUBLIC_BASE_URL||process.env.APP_BASE_URL||'https://smarterjustice.com')||'https://smarterjustice.com';}

function defaultState(){return{
  schemaVersion:'1.0.0',standardVersion:STANDARD_VERSION,releaseVersion:TARGET_RELEASE_VERSION,
  campaigns:[
    {code:'ATTORNEY-LAUNCH-NYC',name:'Initial NYC Attorney Outreach',audience:'professional',status:'rehearsal',channel:'in-person, QR and direct follow-up',location:'New York City',landingPath:'/attorney-launch.html',owner:'Roger',notes:'Free basic profile control first. Paid growth remains closed.',createdAt:'',updatedAt:''},
    {code:'PUBLIC-LAUNCH-NYC',name:'Initial NYC Public Launch',audience:'public',status:'rehearsal',channel:'QR, direct outreach and local promotion',location:'New York City',landingPath:'/',owner:'Roger',notes:'Aggregate event counts only. No legal narrative, IP address, device fingerprint or cross-site identifier is stored.',createdAt:'',updatedAt:''},
    {code:'DOMESTIC-VIOLENCE-PROFESSIONAL-NYC',name:'Domestic Violence Aid Professional Outreach',audience:'professional',status:'draft',channel:'owner-reviewed direct outreach only',location:'New York City',landingPath:'/attorney-launch.html',owner:'Roger',notes:'Attorney and approved organization outreach only. Do not collect survivor narratives, safe-contact choices, confidential locations, shelter capacity, or client information. Publication and paid growth remain closed.',createdAt:'',updatedAt:''}
  ],
  invitations:[],aggregates:[],updatedAt:''
};}
function normalizeState(raw){const base={...defaultState(),...(raw||{})};base.campaigns=(Array.isArray(raw?.campaigns)?raw.campaigns:defaultState().campaigns).slice(0,MAX_CAMPAIGNS);base.invitations=(Array.isArray(raw?.invitations)?raw.invitations:[]).slice(0,MAX_INVITATIONS);base.aggregates=(Array.isArray(raw?.aggregates)?raw.aggregates:[]).slice(0,MAX_AGGREGATES);return base;}
function readState(){return normalizeState(store.readJson(STORE_KEY,defaultState()));}
function writeState(state){state.releaseVersion=TARGET_RELEASE_VERSION;state.updatedAt=now();store.writeJson(STORE_KEY,state);return state;}
function publicCampaign(c){return{code:c.code,name:c.name,audience:c.audience,status:c.status,channel:c.channel,location:c.location,landingPath:c.landingPath};}
function effectiveInvitationStatus(inv){if(inv.status==='revoked'||inv.status==='redeemed')return inv.status;if(inv.expiresAt&&Date.parse(inv.expiresAt)<=Date.now())return'expired';return inv.status;}
function publicInvitationRecord(inv,contact){return{id:inv.id,status:effectiveInvitationStatus(inv),campaignCode:inv.campaignCode,professionalName:contact?.professionalName||'',firmName:contact?.firmName||'',portalIds:contact?.portalIds||inv.portalIds||[],expiresAt:inv.expiresAt,openedAt:inv.openedAt||'',redeemedAt:inv.redeemedAt||'',message:'This invitation only helps Smarter Justice locate or prepare a free basic professional profile. It does not verify credentials, approve a specialty, publish a profile, activate payment, change ranking, or guarantee clients.'};}
function findContact(id){return launchCohortOperations.ownerView().contacts.find(x=>x.id===clean(id,180))||null;}
function upsertCampaign(input={},actor='owner'){
  const state=readState();const campaignCode=code(input.code||input.campaignCode);if(!campaignCode)return{error:'Add a campaign code.'};
  let c=state.campaigns.find(x=>x.code===campaignCode);const created=!c;if(!c){c={code:campaignCode,createdAt:now()};state.campaigns.unshift(c);}
  c.name=clean(input.name||c.name||campaignCode,240);c.audience=oneOf(input.audience,CAMPAIGN_AUDIENCES,c.audience||'mixed');c.status=oneOf(input.status,CAMPAIGN_STATUSES,c.status||'draft');c.channel=clean(input.channel||c.channel,240);c.location=clean(input.location||c.location,240);c.landingPath=safePath(input.landingPath,c.landingPath||'/');c.owner=clean(input.owner||c.owner,180);c.notes=clean(input.notes||c.notes,3000);c.updatedAt=now();
  state.campaigns=state.campaigns.slice(0,MAX_CAMPAIGNS);writeState(state);store.addAudit({actor,action:created?'launch_campaign_created':'launch_campaign_updated',details:{campaignCode:c.code,audience:c.audience,status:c.status}});return{campaign:clone(c)};
}
function issueInvitation(contactId,input={},actor='owner'){
  const contact=findContact(contactId);if(!contact)return{error:'Launch cohort contact was not found.'};
  const state=readState();const campaignCode=code(input.campaignCode||contact.campaignCode||'ATTORNEY-LAUNCH-NYC');const campaign=state.campaigns.find(x=>x.code===campaignCode);if(!campaign)return{error:'Create or select a recognized outreach campaign first.'};if(['paused','closed'].includes(campaign.status))return{error:'This campaign is not accepting new invitations.'};
  for(const prior of state.invitations.filter(x=>x.contactId===contact.id&&!['revoked','redeemed'].includes(effectiveInvitationStatus(x)))){prior.status='revoked';prior.revokedAt=now();prior.revokedReason='Superseded by a newer invitation.';}
  const token=crypto.randomBytes(32).toString('base64url');const days=int(input.expiresInDays,14,1,60);const createdAt=now();const expiresAt=new Date(Date.now()+days*86400000).toISOString();const id=store.uid('launch-invite',10);
  const inv={id,contactId:contact.id,campaignCode,portalIds:contact.portalIds||[],tokenHash:hashToken(token),tokenHint:token.slice(-6),status:'issued',createdAt,createdBy:clean(actor,100)||'owner',expiresAt,openedAt:'',openCount:0,redeemedAt:'',confirmationId:'',revokedAt:'',revokedReason:'',lastEventAt:createdAt};
  state.invitations.unshift(inv);state.invitations=state.invitations.slice(0,MAX_INVITATIONS);writeState(state);launchCohortOperations.updateContact(contact.id,{status:'invited',nextAction:'Open the personalized free-profile invitation and submit the professional follow-up form.'},actor);
  const link=`${canonicalBase()}/attorney-launch.html?campaign=${encodeURIComponent(campaignCode)}&invite=${encodeURIComponent(token)}`;
  store.addAudit({actor,action:'attorney_launch_invitation_issued',details:{invitationId:id,contactId:contact.id,campaignCode,expiresAt,rawTokenStored:false,paidGrowthActivated:false}});
  return{invitation:publicInvitationRecord(inv,contact),link,oneTimeDisplay:true};
}
function resolveInvitation(token){const state=readState();const h=hashToken(token);const inv=state.invitations.find(x=>x.tokenHash===h);if(!inv)return{error:'This invitation could not be verified.'};const status=effectiveInvitationStatus(inv);if(status==='expired')return{error:'This invitation has expired. Request a new free-profile follow-up link.'};if(status==='revoked')return{error:'This invitation is no longer active. Request a new free-profile follow-up link.'};const contact=findContact(inv.contactId);return{invitation:publicInvitationRecord({...inv,status},contact),contactId:inv.contactId};}
function recordInvitationOpen(token){const state=readState();const h=hashToken(token);const inv=state.invitations.find(x=>x.tokenHash===h);if(!inv)return{error:'This invitation could not be verified.'};const status=effectiveInvitationStatus(inv);if(['expired','revoked'].includes(status))return{error:`This invitation is ${status}.`};inv.openCount=int(inv.openCount,0,0,100000)+1;if(!inv.openedAt)inv.openedAt=now();if(inv.status==='issued')inv.status='opened';inv.lastEventAt=now();writeState(state);recordEvent({campaignCode:inv.campaignCode,eventType:'attorney-invitation-opened',audience:'professional'},'public-invitation');store.addAudit({actor:'attorney-invitation',action:'attorney_launch_invitation_opened',details:{invitationId:inv.id,contactId:inv.contactId,openCount:inv.openCount,visitorIdentifiersStored:false}});return{invitation:publicInvitationRecord(inv,findContact(inv.contactId))};}
function redeemInvitation(token,confirmationId,actor='attorney-launch-interest'){const state=readState();const h=hashToken(token);const inv=state.invitations.find(x=>x.tokenHash===h);if(!inv)return{error:'This invitation could not be verified.'};const status=effectiveInvitationStatus(inv);if(['expired','revoked'].includes(status))return{error:`This invitation is ${status}.`};inv.status='redeemed';inv.redeemedAt=now();inv.confirmationId=clean(confirmationId,180);inv.lastEventAt=now();writeState(state);recordEvent({campaignCode:inv.campaignCode,eventType:'attorney-invitation-redeemed',audience:'professional'},actor);store.addAudit({actor,action:'attorney_launch_invitation_redeemed',details:{invitationId:inv.id,contactId:inv.contactId,confirmationId:inv.confirmationId,profilePublished:false,paymentActivated:false}});return{invitation:publicInvitationRecord(inv,findContact(inv.contactId))};}
function revokeInvitation(id,input={},actor='owner'){const state=readState();const inv=state.invitations.find(x=>x.id===clean(id,180));if(!inv)return{error:'Invitation was not found.'};if(inv.status==='redeemed')return{error:'A redeemed invitation cannot be revoked.'};inv.status='revoked';inv.revokedAt=now();inv.revokedReason=clean(input.reason||'Revoked by owner.',1000);inv.lastEventAt=now();writeState(state);store.addAudit({actor,action:'attorney_launch_invitation_revoked',details:{invitationId:inv.id,contactId:inv.contactId}});return{invitation:publicInvitationRecord(inv,findContact(inv.contactId))};}
function recordEvent(input={},actor='public-launch'){
  const state=readState();const campaignCode=code(input.campaignCode);const eventType=oneOf(input.eventType,EVENT_TYPES,'');if(!campaignCode||!eventType)return{ignored:true,reason:'Campaign code and allowlisted event type are required.'};const campaign=state.campaigns.find(x=>x.code===campaignCode);if(!campaign||['paused','closed'].includes(campaign.status))return{ignored:true,reason:'Campaign is not recognized or is not collecting aggregate events.'};
  const audience=oneOf(input.audience,CAMPAIGN_AUDIENCES,campaign.audience);const p=portalId(input.portalId);const eventDay=day();let row=state.aggregates.find(x=>x.day===eventDay&&x.campaignCode===campaignCode&&x.eventType===eventType&&x.portalId===p&&x.audience===audience);if(!row){row={id:store.uid('launch-aggregate',8),day:eventDay,campaignCode,eventType,portalId:p,audience,count:0,firstAt:now(),lastAt:''};state.aggregates.unshift(row);}row.count=int(row.count,0,0,100000000)+1;row.lastAt=now();state.aggregates=state.aggregates.slice(0,MAX_AGGREGATES);writeState(state);return{recorded:true,campaignCode,eventType,count:row.count,privacy:{storesLegalNarrative:false,storesIpAddress:false,storesUserAgent:false,storesCookieIdentifier:false,storesEmail:false}};
}
function totals(state){const byCampaign={};const byEvent={};for(const row of state.aggregates){byCampaign[row.campaignCode]=(byCampaign[row.campaignCode]||0)+row.count;byEvent[row.eventType]=(byEvent[row.eventType]||0)+row.count;}return{campaigns:state.campaigns.length,invitations:state.invitations.length,activeInvitations:state.invitations.filter(x=>['issued','opened'].includes(effectiveInvitationStatus(x))).length,openedInvitations:state.invitations.filter(x=>Boolean(x.openedAt)).length,redeemedInvitations:state.invitations.filter(x=>Boolean(x.redeemedAt)).length,aggregateEvents:state.aggregates.reduce((s,x)=>s+x.count,0),byCampaign,byEvent};}
function ownerView(){const state=readState();const contacts=new Map(launchCohortOperations.ownerView().contacts.map(x=>[x.id,x]));return{standardVersion:STANDARD_VERSION,releaseVersion:TARGET_RELEASE_VERSION,campaigns:state.campaigns.map(clone),invitations:state.invitations.map(inv=>({...publicInvitationRecord(inv,contacts.get(inv.contactId)),contactId:inv.contactId,tokenHint:inv.tokenHint,createdAt:inv.createdAt,openCount:inv.openCount,revokedAt:inv.revokedAt,revokedReason:inv.revokedReason})),aggregates:state.aggregates.map(clone),summary:totals(state),enums:{campaignAudiences:CAMPAIGN_AUDIENCES,campaignStatuses:CAMPAIGN_STATUSES,eventTypes:EVENT_TYPES},privacyBoundary:{aggregateOnly:true,storesLegalNarratives:false,storesIpAddresses:false,storesUserAgents:false,storesCrossSiteIdentifiers:false,storesInvitationRawTokens:false,storesSafeContactChoices:false,storesSensitiveLocations:false,statement:'Launch measurement stores allowlisted aggregate event counts only. Personalized attorney invitations use one-time bearer links whose raw tokens are shown once and never stored.'},activationBoundary:{canPublishProfiles:false,canVerifyCredentials:false,canApproveSpecialty:false,canOpenPaidGrowth:false,canDeploy:false}};}
function exportCsv(){const state=readState();const header=['day','campaignCode','audience','eventType','portalId','count'];const rows=state.aggregates.map(x=>[x.day,x.campaignCode,x.audience,x.eventType,x.portalId,x.count]);const quote=v=>`"${String(v??'').replace(/"/g,'""')}"`;return[header,...rows].map(r=>r.map(quote).join(',')).join('\n');}
module.exports={STORE_KEY,STANDARD_VERSION,TARGET_RELEASE_VERSION,CAMPAIGN_AUDIENCES,CAMPAIGN_STATUSES,INVITATION_STATUSES,EVENT_TYPES,readState,upsertCampaign,issueInvitation,resolveInvitation,recordInvitationOpen,redeemInvitation,revokeInvitation,recordEvent,ownerView,exportCsv};
