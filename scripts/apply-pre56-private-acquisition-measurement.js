'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const serverPath=path.join(root,'server.js');
const publicDir=path.join(root,'public');
const MARK='SMARTER_JUSTICE_PRE56_PRIVACY_MINIMIZED_MEASUREMENT';
if(!fs.existsSync(serverPath)) throw new Error(`PRE56 missing runtime server: ${serverPath}`);

const moduleSource=`'use strict';
const store=require('./store');
const STORE_KEY='privateAcquisitionMeasurementPre56.json';
const STANDARD_VERSION='1.0.0';
const CONSENT_VERSION='1.0.0';
const RETENTION_DAYS=30;
const MINIMUM_RATIO_DENOMINATOR=20;
const MAX_ROWS=10000;
const EVENT_TYPES=Object.freeze([
  'landing-view','navigator-view','professional-directory-view','professional-growth-view',
  'attorney-quick-tour-view','attorney-tour-view','membership-view','navigator-opened',
  'professional-directory-opened','professional-growth-opened','attorney-quick-tour-opened',
  'attorney-tour-opened','membership-opened','enrollment-started'
]);
const PAGE_PATHS=Object.freeze([
  '/','/navigator','/navigator.html','/professionals.html','/professional-growth.html',
  '/attorney-call-tour.html','/attorney-partner-tour.html','/professional-membership.html',
  '/professional-signup.html','/referral-program.html'
]);
const CHANNELS=Object.freeze(['direct','organic','partner','qr','email','social','community','internal']);
function enabled(){return /^(1|true|yes|on)$/i.test(String(process.env.SJ_PRIVACY_MINIMIZED_MEASUREMENT_ENABLED||''));}
function clean(value,max=120){return String(value??'').trim().slice(0,max);}
function oneOf(value,allowed){const v=clean(value);return allowed.includes(v)?v:'';}
function day(value=new Date()){return new Date(value).toISOString().slice(0,10);}
function now(){return store.now();}
function clone(value){return JSON.parse(JSON.stringify(value));}
function defaultState(){return{schemaVersion:'1.0.0',standardVersion:STANDARD_VERSION,release:'v2.0.0-pre56',retentionDays:RETENTION_DAYS,rows:[],updatedAt:''};}
function cutoffDay(){return day(new Date(Date.now()-(RETENTION_DAYS-1)*86400000));}
function normalize(raw){const base={...defaultState(),...(raw||{})};base.rows=(Array.isArray(raw?.rows)?raw.rows:[]).filter(row=>row&&row.day>=cutoffDay()).slice(0,MAX_ROWS);return base;}
function status(){const storage=store.storageStatus();return{
  enabled:enabled(),release:'v2.0.0-pre56',standardVersion:STANDARD_VERSION,consentVersion:CONSENT_VERSION,
  consentRequired:true,defaultConsent:'not-granted',retentionDays:RETENTION_DAYS,
  durableAggregateStorageReady:storage.productionRuntime?Boolean(storage.databaseReady&&storage.databaseSchemaCurrent):true,
  measurementBoundary:{aggregateOnly:true,firstPartyOnly:true,thirdPartyTrackers:false,storesLegalNarratives:false,storesSearchTerms:false,storesQueryStrings:false,storesReferrers:false,storesIpAddressInMeasurementRows:false,storesUserAgent:false,storesCookieIdentifier:false,storesDeviceFingerprint:false,storesEmail:false,storesName:false,storesSessionIdentifier:false},
  statement:'Measurement is off by default and records only allowlisted daily aggregate counts after a visitor explicitly opts in. Security rate limiting may process a network address transiently, but it is not written to measurement rows.'
};}
async function record(input={}){
  if(!enabled())return{ignored:true,reason:'Privacy-minimized measurement is not enabled.'};
  if(input.measurementConsent!==true||clean(input.consentVersion,30)!==CONSENT_VERSION)return{ignored:true,reason:'Current explicit measurement consent is required.'};
  const eventType=oneOf(input.eventType,EVENT_TYPES),pagePath=oneOf(input.pagePath,PAGE_PATHS),channel=oneOf(input.channel,CHANNELS);
  if(!eventType||!pagePath||!channel)return{ignored:true,reason:'Only allowlisted aggregate dimensions are accepted.'};
  const storage=store.storageStatus();
  if(storage.productionRuntime&&(!storage.databaseReady||!storage.databaseSchemaCurrent))return{error:'Durable aggregate storage is not ready; nothing was recorded.',code:'MEASUREMENT_STORAGE_NOT_READY'};
  const eventDay=day();
  const mutation=await store.mutateJson(STORE_KEY,defaultState(),async current=>{
    const state=normalize(current);let row=state.rows.find(x=>x.day===eventDay&&x.eventType===eventType&&x.pagePath===pagePath&&x.channel===channel);
    if(!row){row={day:eventDay,eventType,pagePath,channel,count:0};state.rows.unshift(row);}
    row.count=Math.min(1000000000,Math.max(0,Number(row.count)||0)+1);state.rows=state.rows.slice(0,MAX_ROWS);state.updatedAt=now();
    return{value:state,result:{recorded:true,eventType,pagePath,channel,day:eventDay,count:row.count}};
  });
  return{...mutation.result,privacy:status().measurementBoundary};
}
function sum(rows,eventType){return rows.filter(x=>x.eventType===eventType).reduce((total,row)=>total+(Number(row.count)||0),0);}
function ratio(rows,numeratorEvent,denominatorEvent,label){const numerator=sum(rows,numeratorEvent),denominator=sum(rows,denominatorEvent);return{label,numeratorEvent,denominatorEvent,numerator,denominator,minimumDenominator:MINIMUM_RATIO_DENOMINATOR,value:denominator>=MINIMUM_RATIO_DENOMINATOR?Number((numerator/denominator).toFixed(4)):null,claimable:denominator>=MINIMUM_RATIO_DENOMINATOR,note:denominator>=MINIMUM_RATIO_DENOMINATOR?'Aggregate directional ratio; it is not person-level or cohort attribution.':'Withheld because the aggregate denominator is below the reporting threshold.'};}
function ownerView(){const state=normalize(store.readJson(STORE_KEY,defaultState()));const totals={};const byChannel={};const byPage={};for(const row of state.rows){totals[row.eventType]=(totals[row.eventType]||0)+row.count;byChannel[row.channel]=(byChannel[row.channel]||0)+row.count;byPage[row.pagePath]=(byPage[row.pagePath]||0)+row.count;}return{
  ...status(),stateUpdatedAt:state.updatedAt,windowStart:cutoffDay(),windowEnd:day(),rows:state.rows.map(clone),totals,byChannel,byPage,
  ratios:[
    ratio(state.rows,'navigator-opened','landing-view','Home to Navigator interest'),
    ratio(state.rows,'enrollment-started','attorney-tour-view','Attorney tour to enrollment interest'),
    ratio(state.rows,'enrollment-started','professional-growth-view','Professional growth to enrollment interest'),
    ratio(state.rows,'enrollment-started','membership-view','Membership to enrollment interest')
  ],
  interpretationBoundary:'Counts are daily aggregates without people, sessions or cohort joins. Ratios are directional only and are withheld below the minimum denominator.'
};}
module.exports={STORE_KEY,STANDARD_VERSION,CONSENT_VERSION,RETENTION_DAYS,MINIMUM_RATIO_DENOMINATOR,EVENT_TYPES,PAGE_PATHS,CHANNELS,status,record,ownerView};
`;
fs.writeFileSync(path.join(root,'lib','privateAcquisitionMeasurementPre56.js'),moduleSource,'utf8');

const clientSource=`'use strict';
(()=>{
  const MARK='${MARK}',CONSENT_KEY='sj_private_measurement_consent_v1',CHANNEL_KEY='sj_private_measurement_channel_v1';
  const allowedChannels=new Set(['direct','organic','partner','qr','email','social','community','internal']);
  const normalizedPath=location.pathname==='/'?'/':location.pathname.replace(/\\/$/,'');
  const viewEvents={'/':'landing-view','/navigator':'navigator-view','/navigator.html':'navigator-view','/professionals.html':'professional-directory-view','/professional-growth.html':'professional-growth-view','/attorney-call-tour.html':'attorney-quick-tour-view','/attorney-partner-tour.html':'attorney-tour-view','/professional-membership.html':'membership-view'};
  const targetEvents={'/navigator':'navigator-opened','/navigator.html':'navigator-opened','/professionals.html':'professional-directory-opened','/professional-growth.html':'professional-growth-opened','/attorney-call-tour.html':'attorney-quick-tour-opened','/attorney-partner-tour.html':'attorney-tour-opened','/professional-membership.html':'membership-opened','/professional-signup.html':'enrollment-started'};
  function consent(){try{return localStorage.getItem(CONSENT_KEY)==='granted';}catch{return false;}}
  function channel(){try{const candidate=new URLSearchParams(location.search).get('sj_channel');if(candidate&&allowedChannels.has(candidate)){sessionStorage.setItem(CHANNEL_KEY,candidate);return candidate;}const saved=sessionStorage.getItem(CHANNEL_KEY);return allowedChannels.has(saved)?saved:'direct';}catch{return'direct';}}
  async function status(){try{const response=await fetch('/api/public/private-measurement/status',{credentials:'same-origin',headers:{'Accept':'application/json'}});return response.ok?await response.json():null;}catch{return null;}}
  async function record(eventType,pagePath=normalizedPath){if(!consent()||!eventType)return;const current=await status();if(!current?.enabled)return;try{await fetch('/api/public/private-measurement',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({measurementConsent:true,consentVersion:'1.0.0',eventType,pagePath,channel:channel()})});}catch{}}
  function addChoiceLink(){const footer=document.querySelector('footer');if(!footer||footer.querySelector('[data-sj-measurement-choices]'))return;const a=document.createElement('a');a.href='/measurement-privacy.html';a.textContent='Privacy choices';a.dataset.sjMeasurementChoices=MARK;a.style.cssText='display:inline-block;margin:.5rem .75rem .5rem 0;color:inherit;text-decoration:underline;text-underline-offset:3px';footer.appendChild(a);}
  function bindClicks(){document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link)return;let target;try{target=new URL(link.href,location.origin);}catch{return;}if(target.origin!==location.origin)return;const targetPath=target.pathname==='/'?'/':target.pathname.replace(/\\/$/,'');const eventType=targetEvents[targetPath];if(eventType)record(eventType,normalizedPath);},{capture:true});}
  function renderControls(){const root=document.querySelector('[data-private-measurement-controls]');if(!root)return;const result=root.querySelector('[data-private-measurement-result]');const enabledText=root.querySelector('[data-private-measurement-status]');const grant=root.querySelector('[data-private-measurement-grant]');const decline=root.querySelector('[data-private-measurement-decline]');const paint=async message=>{const current=await status();if(enabledText)enabledText.textContent=current?.enabled?'Aggregate measurement is available when you opt in.':'Aggregate measurement is currently unavailable, so no events are being recorded.';if(result)result.textContent=message||('Your current choice on this device: '+(consent()?'Allow aggregate measurement':'Do not allow aggregate measurement')+'.');};grant?.addEventListener('click',()=>{try{localStorage.setItem(CONSENT_KEY,'granted');}catch{}paint('Choice saved on this device: allow aggregate measurement. You can change it here at any time.');});decline?.addEventListener('click',()=>{try{localStorage.setItem(CONSENT_KEY,'denied');sessionStorage.removeItem(CHANNEL_KEY);}catch{}paint('Choice saved on this device: do not allow aggregate measurement. No measurement event was sent for this choice.');});paint();}
  document.addEventListener('DOMContentLoaded',()=>{addChoiceLink();renderControls();bindClicks();const view=viewEvents[normalizedPath];if(view)record(view,normalizedPath);});
})();
`;
fs.writeFileSync(path.join(publicDir,'private-measurement-pre56.js'),clientSource,'utf8');

const privacyPage=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy choices | Smarter Justice</title><meta name="description" content="Choose whether Smarter Justice may record privacy-minimized daily aggregate usage counts on this device."><link rel="canonical" href="https://smarterjustice.com/measurement-privacy.html"><link rel="stylesheet" href="/styles.css"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><script defer src="/app.js"></script><script defer src="/private-measurement-pre56.js"></script></head><body><!-- ${MARK} --><a class="skip" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/" aria-label="Smarter Justice home"><img src="/logo.svg" alt="Smarter Justice"></a><button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-nav-toggle>Menu</button><nav data-nav><a href="/">Home</a><a href="/privacy.html">Privacy notice</a><a href="/professionals.html">Find a professional</a></nav></header><main id="main"><section class="page-hero"><p class="eyebrow">Privacy choices</p><h1>You decide whether anonymous aggregate measurement is allowed.</h1><p class="lead">Smarter Justice does not need your legal story, name, email, search terms, IP address, device fingerprint, cookie identifier, or session identifier to understand which public paths are useful.</p></section><section class="section narrow" data-private-measurement-controls><h2>First-party aggregate measurement</h2><p id="measurement-explanation">The default is off. If you choose “Allow,” this browser may send only an allowlisted page, action, acquisition channel, UTC day, and the current consent version. The server combines those values into daily counts and removes rows outside a 30-day window. Smarter Justice does not use a third-party analytics tracker for this feature.</p><p><strong data-private-measurement-status>Checking availability…</strong></p><div class="button-row" role="group" aria-label="Aggregate measurement choice"><button class="primary" type="button" data-private-measurement-grant>Allow aggregate measurement</button><button class="secondary" type="button" data-private-measurement-decline>Do not allow</button></div><p class="notice" data-private-measurement-result aria-live="polite"></p><h2>What this choice does not cover</h2><p>This choice is only for the privacy-minimized aggregate measurement described here. It is separate from contact requests, professional enrollment, account terms, Navigator conversations, and any consent required for those services. Security systems may process a network address transiently to prevent abuse, but it is not written into measurement rows.</p><h2>Change or withdraw your choice</h2><p>Return to this page at any time. Choosing “Do not allow” stops future measurement from this browser. Because the server stores only combined daily counts without a person, device, cookie, or session identifier, a prior aggregate count cannot be linked back to you for individual deletion.</p><p><a href="/privacy.html">Read the full privacy notice</a> · <a href="/privacy-request.html">Privacy request form</a></p></section></main><footer class="site-footer"><p><strong>Smarter Justice</strong><br>One connected legal starting-help and professional-profile network. Not a law firm or government agency.</p><div class="footer-links"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/security.html">Security</a><a href="/disclaimer.html">Disclaimer</a></div></footer></body></html>`;
fs.writeFileSync(path.join(publicDir,'measurement-privacy.html'),privacyPage,'utf8');

let server=fs.readFileSync(serverPath,'utf8');
if(!server.includes(MARK)){
  const requireSeam="const launchOutreachOperations = require('./lib/launchOutreachOperations');";
  if(!server.includes(requireSeam))throw new Error('PRE56 server require seam missing');
  server=server.replace(requireSeam,`${requireSeam}\nconst privateAcquisitionMeasurementPre56 = require('./lib/privateAcquisitionMeasurementPre56');`);
  for(const required of ["release:'v2.0.0-pre55'","deploymentControlRelease:'v2.0.0-pre55'","marker:'SMARTER_JUSTICE_PRE55_PROTECTED_CREDENTIAL_ROTATION_DRILL'"])if(!server.includes(required))throw new Error(`PRE56 requires qualified pre55 marker: ${required}`);
  server=server.replace("release:'v2.0.0-pre55'","release:'v2.0.0-pre56'");
  server=server.replace("deploymentControlRelease:'v2.0.0-pre55'","deploymentControlRelease:'v2.0.0-pre56'");
  server=server.replace("marker:'SMARTER_JUSTICE_PRE55_PROTECTED_CREDENTIAL_ROTATION_DRILL'",`marker:'${MARK}'`);
  const commentSeam='    // SMARTER_JUSTICE_PRE55_PROTECTED_CREDENTIAL_ROTATION_DRILL: time-bounded credential rotation is protected, redacted and outside the public runtime.';
  if(!server.includes(commentSeam))throw new Error('PRE56 release comment seam missing');
  server=server.replace(commentSeam,`${commentSeam}\n    // ${MARK}: consent-first, first-party acquisition measurement stores only bounded daily aggregates.`);
  const publicSeam="  if (req.method === 'POST' && pathName === '/api/public/launch-event') { const result=launchOutreachOperations.recordEvent(await parseJson(req),'public-launch'); return json(res,200,{ok:true,...result}); }";
  if(!server.includes(publicSeam))throw new Error('PRE56 public route seam missing');
  server=server.replace(publicSeam,`${publicSeam}\n  if (req.method === 'GET' && pathName === '/api/public/private-measurement/status') return json(res,200,{ok:true,...privateAcquisitionMeasurementPre56.status()});\n  if (req.method === 'POST' && pathName === '/api/public/private-measurement') { const result=await privateAcquisitionMeasurementPre56.record(await parseJson(req)); return json(res,result.error?503:200,{ok:!result.error,...result}); }`);
  const ownerSeam="  if (req.method === 'GET' && pathName === '/api/owner/launch-outreach') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...launchOutreachOperations.ownerView()}); }";
  if(!server.includes(ownerSeam))throw new Error('PRE56 owner route seam missing');
  server=server.replace(ownerSeam,`${ownerSeam}\n  if (req.method === 'GET' && pathName === '/api/owner/private-acquisition-measurement') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...privateAcquisitionMeasurementPre56.ownerView()}); }`);
  fs.writeFileSync(serverPath,server,'utf8');
}

const canonicalRepairs={'navigator.html':'https://smarterjustice.com/navigator','attorney-call-tour.html':'https://smarterjustice.com/attorney-call-tour.html'};
for(const name of ['index.html','navigator.html','professionals.html','professional-growth.html','professional-membership.html','attorney-call-tour.html','attorney-partner-tour.html','referral-program.html','professional-signup.html','privacy.html']){
  const file=path.join(publicDir,name);if(!fs.existsSync(file))throw new Error(`PRE56 missing working public page: ${name}`);let html=fs.readFileSync(file,'utf8'),changed=false;
  if(canonicalRepairs[name]&&!/<link[^>]+rel=["']canonical["']/i.test(html)){if(!html.includes('</head>'))throw new Error(`PRE56 canonical head seam missing: ${name}`);html=html.replace('</head>',`<link rel="canonical" href="${canonicalRepairs[name]}"><!-- SMARTER_JUSTICE_PRE56_CLEAN_REBUILD_CANONICAL_CONTINUITY --></head>`);changed=true;}
  if(!html.includes('/private-measurement-pre56.js')){if(!html.includes('</body>'))throw new Error(`PRE56 body seam missing: ${name}`);html=html.replace('</body>',`<script defer src="/private-measurement-pre56.js"></script></body>`);changed=true;}
  if(changed)fs.writeFileSync(file,html,'utf8');
}
const sitemapPath=path.join(publicDir,'sitemap.xml');let sitemap=fs.readFileSync(sitemapPath,'utf8');
if(!sitemap.includes('<loc>https://smarterjustice.com/measurement-privacy.html</loc>'))sitemap=sitemap.replace('</urlset>','  <url><loc>https://smarterjustice.com/measurement-privacy.html</loc></url>\n</urlset>');
for(const held of ['/portals.html','/growth-operations-compliance.html'])if(sitemap.includes(`<loc>https://smarterjustice.com${held}</loc>`))throw new Error(`PRE56 sitemap exposes held route: ${held}`);
fs.writeFileSync(sitemapPath,sitemap,'utf8');
console.log('PRE56_PRIVACY_MINIMIZED_ACQUISITION_MEASUREMENT_APPLIED');
require('./apply-pre57-profile-currentness-execution');
