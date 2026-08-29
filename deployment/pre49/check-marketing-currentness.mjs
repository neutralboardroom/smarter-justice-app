#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
function arg(name,fallback=''){const i=args.indexOf(name);return i>=0&&args[i+1]?args[i+1]:fallback;}
const contractPath=path.resolve(arg('--contract',path.join(here,'CURRENTNESS_SOURCE_CONTRACT__PRE49.json')));
const output=arg('--output','');
const allowUnverified=args.includes('--allow-unverified');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));
function plain(input){return String(input||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;|&#34;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&rsquo;|&lsquo;|&#8217;|&#8216;/gi,"'").replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/gi,'"').replace(/\s+/g,' ').trim();}
function norm(input){return plain(input).toLowerCase();}
async function fetchSource(source){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Number(contract.timeoutMs||12000));const checkedAt=new Date().toISOString();
  try{
    const response=await fetch(source.url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; SmarterJusticeRuleCurrentness/1.1; +https://smarterjustice.com)','accept':'text/html,application/xhtml+xml,text/plain,application/pdf;q=0.5,*/*;q=0.1','accept-language':'en-US,en;q=0.9'},signal:controller.signal});
    const body=await response.text(),text=norm(body),missing=(source.markers||[]).filter(marker=>!text.includes(norm(marker)));
    return{sourceId:source.id,url:source.url,finalUrl:response.url||source.url,checkedAt,httpStatus:response.status,reachable:response.ok,markerCount:(source.markers||[]).length,matchedMarkerCount:(source.markers||[]).length-missing.length,missingMarkers:missing,contentSha256:crypto.createHash('sha256').update(body).digest('hex'),verified:Boolean(response.ok&&missing.length===0)};
  }catch(error){return{sourceId:source.id,url:source.url,checkedAt,httpStatus:null,reachable:false,markerCount:(source.markers||[]).length,matchedMarkerCount:0,missingMarkers:[...(source.markers||[])],contentSha256:null,verified:false,error:String(error?.name==='AbortError'?'SOURCE_CHECK_TIMEOUT':error?.message||error)};}finally{clearTimeout(timer);}
}
async function main(){
  const jurisdictions={};
  for(const [code,row] of Object.entries(contract.jurisdictions||{})){
    const sources=await Promise.all((row.sources||[]).map(fetchSource));const deterministicAllowed=sources.length>0&&sources.every(x=>x.verified);
    jurisdictions[code]={label:row.label||code,status:deterministicAllowed?'VERIFIED_CURRENT':'HUMAN_REVIEW_ONLY_SOURCE_CURRENTNESS_UNVERIFIED',deterministicAllowed,attemptedSources:sources.length,verifiedSources:sources.filter(x=>x.verified).length,sources};
  }
  const allVerified=Object.values(jurisdictions).length>0&&Object.values(jurisdictions).every(x=>x.deterministicAllowed);
  const receipt={schemaVersion:'1.0.1',product:'Smarter Justice',tool:'Marketing Compliance Ruleset Source Currentness Monitor',contractId:contract.contractId,rulesetVersion:contract.rulesetVersion,currentnessVersion:contract.currentnessVersion,checkedAt:new Date().toISOString(),cacheTtlSeconds:contract.cacheTtlSeconds,coverageBoundary:contract.coverageBoundary,failClosed:true,draftOrClientDataTransmitted:false,allVerified,jurisdictions};
  const text=JSON.stringify(receipt,null,2)+'\n';if(output){fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(path.resolve(output),text);}process.stdout.write(text);if(!allVerified&&!allowUnverified)process.exitCode=2;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
