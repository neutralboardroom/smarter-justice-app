'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const pub=path.join(root,'public'),src=path.resolve(__dirname,'..'),contractPath=path.join(src,'deployment','pre49','CURRENTNESS_SOURCE_CONTRACT__PRE49.json');
if(!fs.existsSync(contractPath))throw new Error('Missing pre49 currentness contract');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));
for(const name of ['professional-growth-pre49-currentness.js']){
  const from=path.join(src,'public',name),to=path.join(pub,name);
  if(!fs.existsSync(from))throw new Error(`Missing pre49 payload ${name}`);
  fs.copyFileSync(from,to);
}
{
  const p=path.join(pub,'professional-growth.html');
  if(!fs.existsSync(p))throw new Error('Missing runtime professional-growth.html');
  let s=fs.readFileSync(p,'utf8');
  if(!s.includes('SMARTER_JUSTICE_PRE49_SOURCE_CURRENTNESS_GATE')){
    const old='<script defer src="/professional-growth.js"></script><script defer src="/professional-growth-pre48-addon.js"></script>';
    const next='<script defer src="/professional-growth.js"></script><script defer src="/professional-growth-pre49-currentness.js"></script><script defer src="/professional-growth-pre48-addon.js"></script>';
    if(!s.includes(old))throw new Error('Pre49 script-order anchor missing');
    s=s.replace(old,next);
    const heading='<div class="section-heading"><p class="eyebrow">Jurisdiction-aware marketing compliance preflight</p><h2>Check the draft before publication.</h2>';
    if(!s.includes(heading))throw new Error('Pre49 currentness-card anchor missing');
    const currentness=`<!-- SMARTER_JUSTICE_PRE49_SOURCE_CURRENTNESS_GATE -->\n      <div class="card" id="marketingCurrentnessCard" aria-live="polite">\n        <p class="eyebrow">Official-source currentness gate</p>\n        <h3>Verify the rule sources before relying on mapped checks.</h3>\n        <p id="marketingCurrentnessSummary">Checking the mapped official rule sources…</p>\n        <div id="marketingCurrentnessList"></div>\n        <div class="hero-actions"><button class="secondary" type="button" id="refreshMarketingCurrentness">Refresh source check</button><button class="secondary" type="button" id="downloadMarketingCurrentnessReceipt" disabled>Download source-check receipt</button></div>\n        <p class="fine-print">Smarter Justice checks official rule sources before allowing mapped automated checks. If a required source cannot be verified, that jurisdiction switches to human-review-only. Your marketing draft is not sent with this source check.</p>\n      </div>\n`;
    s=s.replace(heading,heading+currentness);
    fs.writeFileSync(p,s);
  }
}
{
  const p=path.join(pub,'growth-operations-compliance.html');
  if(!fs.existsSync(p))throw new Error('Missing runtime growth-operations-compliance.html');
  let s=fs.readFileSync(p,'utf8');
  if(!s.includes('SMARTER_JUSTICE_PRE49_SOURCE_CURRENTNESS')){
    const anchor='<!-- SMARTER_JUSTICE_PRE48_FIVE_JURISDICTIONS -->Use the browser-local, source-linked preflight for selected current New York, Florida, Texas, California, and New Jersey issues. Unmapped or uncertain questions require human review.';
    const next=anchor+' <!-- SMARTER_JUSTICE_PRE49_SOURCE_CURRENTNESS -->Before mapped automated checks run, Smarter Justice also verifies the required official rule sources; an unverified source switches that jurisdiction to human review only.';
    if(!s.includes(anchor))throw new Error('Pre49 growth-story anchor missing');
    s=s.replace(anchor,next);fs.writeFileSync(p,s);
  }
}
{
  const p=path.join(root,'server.js');
  if(!fs.existsSync(p))throw new Error('Missing runtime server.js');
  let s=fs.readFileSync(p,'utf8');
  const marker='SMARTER_JUSTICE_PRE49_MARKETING_CURRENTNESS';
  if(!s.includes(marker)){
    const helperNeedle='function json(res, status, data){';
    if(!s.includes(helperNeedle))throw new Error('Pre49 server helper seam missing');
    const embedded=JSON.stringify(contract);
    const helper=`// ${marker}\nconst PRE49_MARKETING_CURRENTNESS_CONTRACT=Object.freeze(${embedded});\nlet pre49MarketingCurrentnessCache=null;\nlet pre49MarketingCurrentnessPending=null;\nfunction pre49MarketingPlain(input){return String(input||'').replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi,' ').replace(/<style\\b[^>]*>[\\s\\S]*?<\\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;|&#34;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&rsquo;|&lsquo;|&#8217;|&#8216;/gi,"'").replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/gi,'"').replace(/\\s+/g,' ').trim().toLowerCase();}\nasync function pre49MarketingCheckSource(source){\n  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Number(PRE49_MARKETING_CURRENTNESS_CONTRACT.timeoutMs||12000));const checkedAt=new Date().toISOString();\n  try{const response=await fetch(source.url,{redirect:'follow',headers:{'user-agent':'SmarterJustice-RuleSourceCurrentness/1.0 (+https://smarterjustice.com)','accept':'text/html,application/xhtml+xml,text/plain,*/*;q=0.1'},signal:controller.signal});const body=await response.text();const text=pre49MarketingPlain(body);const missing=(source.markers||[]).filter(m=>!text.includes(pre49MarketingPlain(m)));return{sourceId:source.id,url:source.url,finalUrl:response.url||source.url,checkedAt,httpStatus:response.status,reachable:response.ok,markerCount:(source.markers||[]).length,matchedMarkerCount:(source.markers||[]).length-missing.length,missingMarkers:missing,contentSha256:crypto.createHash('sha256').update(body).digest('hex'),verified:Boolean(response.ok&&missing.length===0)};}\n  catch(error){return{sourceId:source.id,url:source.url,checkedAt,httpStatus:null,reachable:false,markerCount:(source.markers||[]).length,matchedMarkerCount:0,missingMarkers:[...(source.markers||[])],contentSha256:null,verified:false,error:String(error?.name==='AbortError'?'SOURCE_CHECK_TIMEOUT':error?.message||error)};}finally{clearTimeout(timer);}\n}\nasync function pre49MarketingBuildCurrentness(){\n  const jurisdictions={};const entries=Object.entries(PRE49_MARKETING_CURRENTNESS_CONTRACT.jurisdictions||{});\n  await Promise.all(entries.map(async([code,row])=>{const sources=await Promise.all((row.sources||[]).map(pre49MarketingCheckSource));const deterministicAllowed=sources.length>0&&sources.every(x=>x.verified);jurisdictions[code]={label:row.label||code,status:deterministicAllowed?'VERIFIED_CURRENT':'HUMAN_REVIEW_ONLY_SOURCE_CURRENTNESS_UNVERIFIED',deterministicAllowed,attemptedSources:sources.length,verifiedSources:sources.filter(x=>x.verified).length,sources};}));\n  const allVerified=Object.values(jurisdictions).length>0&&Object.values(jurisdictions).every(x=>x.deterministicAllowed);\n  return{schemaVersion:'1.0.0',product:'Smarter Justice',tool:'Marketing Compliance Ruleset Source Currentness Monitor',contractId:PRE49_MARKETING_CURRENTNESS_CONTRACT.contractId,rulesetVersion:PRE49_MARKETING_CURRENTNESS_CONTRACT.rulesetVersion,currentnessVersion:PRE49_MARKETING_CURRENTNESS_CONTRACT.currentnessVersion,checkedAt:new Date().toISOString(),cacheTtlSeconds:PRE49_MARKETING_CURRENTNESS_CONTRACT.cacheTtlSeconds,coverageBoundary:PRE49_MARKETING_CURRENTNESS_CONTRACT.coverageBoundary,failClosed:true,draftOrClientDataTransmitted:false,allVerified,jurisdictions};\n}\nasync function pre49MarketingCurrentness(){const now=Date.now();if(pre49MarketingCurrentnessCache&&pre49MarketingCurrentnessCache.expiresAt>now)return pre49MarketingCurrentnessCache.value;if(pre49MarketingCurrentnessPending)return pre49MarketingCurrentnessPending;pre49MarketingCurrentnessPending=pre49MarketingBuildCurrentness().then(value=>{pre49MarketingCurrentnessCache={expiresAt:Date.now()+Number(PRE49_MARKETING_CURRENTNESS_CONTRACT.cacheTtlSeconds||21600)*1000,value};return value;}).finally(()=>{pre49MarketingCurrentnessPending=null;});return pre49MarketingCurrentnessPending;}\n\n`;
    s=s.replace(helperNeedle,helper+helperNeedle);
    const apiNeedle="  if (req.method === 'GET' && pathName === '/api/owner/control-center') {";
    if(!s.includes(apiNeedle))throw new Error('Pre49 API insertion seam missing');
    const route=`  // ${marker}\n  if (req.method === 'GET' && pathName === '/api/marketing-compliance/currentness') {\n    try{return json(res,200,await pre49MarketingCurrentness());}\n    catch(error){return json(res,503,{schemaVersion:'1.0.0',product:'Smarter Justice',tool:'Marketing Compliance Ruleset Source Currentness Monitor',currentnessVersion:PRE49_MARKETING_CURRENTNESS_CONTRACT.currentnessVersion,rulesetVersion:PRE49_MARKETING_CURRENTNESS_CONTRACT.rulesetVersion,checkedAt:new Date().toISOString(),coverageBoundary:PRE49_MARKETING_CURRENTNESS_CONTRACT.coverageBoundary,failClosed:true,draftOrClientDataTransmitted:false,allVerified:false,serviceError:'SOURCE_CURRENTNESS_SERVICE_UNAVAILABLE',jurisdictions:Object.fromEntries(Object.entries(PRE49_MARKETING_CURRENTNESS_CONTRACT.jurisdictions||{}).map(([code,row])=>[code,{label:row.label||code,status:'HUMAN_REVIEW_ONLY_SOURCE_CURRENTNESS_UNVERIFIED',deterministicAllowed:false,attemptedSources:0,verifiedSources:0,sources:[]}]))});}\n  }\n\n`;
    s=s.replace(apiNeedle,route+apiNeedle);fs.writeFileSync(p,s);
  }
}
console.log('PRE49_MARKETING_RULE_SOURCE_CURRENTNESS_APPLIED');
