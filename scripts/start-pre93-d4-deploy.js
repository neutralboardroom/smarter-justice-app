'use strict';
const fs=require('fs');
const path=require('path');
const http=require('http');
const {spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
const runtime=path.join(root,'.runtime','pre93-live');
const d4Receipt=path.join(runtime,'deployment','pre93','PRE93_D4_RUNTIME_HOTFIX_RECEIPT.json');
const port=Number(process.env.PORT||10000);
function request(pathname){return new Promise((resolve,reject)=>{const req=http.get({hostname:'127.0.0.1',port,path:pathname,timeout:8000,headers:{'user-agent':'smarter-justice-pre93-d4-readiness-diagnostic/1'}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(chunks).toString('utf8')}));});req.on('timeout',()=>req.destroy(new Error(`timeout ${pathname}`)));req.on('error',reject);});}
async function wait(pathname){let last;for(let i=0;i<160;i++){try{return await request(pathname);}catch(e){last=e;await new Promise(r=>setTimeout(r,500));}}throw last||new Error('diagnostic endpoint did not become reachable');}
if(!fs.existsSync(d4Receipt)){console.error('[PRE93-D4 START] D4 receipt missing');process.exit(1);}
const d4=JSON.parse(fs.readFileSync(d4Receipt,'utf8'));
if(d4.deploymentAmendment!=='PRE93-D4-NATIONAL-LAUNCH-CONFIG-AND-READINESS-DIAGNOSTICS'||d4.nationalRogerRule!=='SJ-RGR-PRE92-NATIONAL-USA-SCOPE'){console.error('[PRE93-D4 START] D4 receipt identity mismatch');process.exit(1);}
const child=spawn(process.execPath,[path.join(root,'scripts','start-pre93-deploy.js')],{cwd:root,env:process.env,stdio:'inherit'});
child.on('error',e=>{console.error(`[PRE93-D4 START] child start failed: ${e.message}`);process.exit(1);});
child.on('exit',(code,signal)=>{if(signal){console.error(`[PRE93-D4 START] child exited via ${signal}`);process.exit(1);}process.exit(code==null?1:code);});
(async()=>{try{
  await wait('/health');
  const readiness=await request('/readyz?lane=free-professional-profiles');
  let r={};try{r=JSON.parse(readiness.body);}catch{}
  const owner=await request('/api/owner/auth/status');let o={};try{o=JSON.parse(owner.body);}catch{}
  const blocked=Array.isArray(r.blocked)?r.blocked.map(x=>x.key):[];
  console.log(`[PRE93-D4 READINESS] lane=free-professional-profiles status=${r.status||'unknown'} http=${readiness.status} passed=${r.lane?.passedChecks??'?'}/${r.lane?.requiredChecks??'?'} blocked=${blocked.length}`);
  console.log(`[PRE93-D4 READINESS BLOCKED] ${JSON.stringify(blocked)}`);
  console.log(`[PRE93-D4 READINESS DEPENDENCIES] ${JSON.stringify(r.dependencies||{})}`);
  console.log(`[PRE93-D4 OWNER SECURITY] ${JSON.stringify({accountAuthenticationReady:Boolean(o.accountAuthenticationReady),mfaRequiredForAll:Boolean(o.mfaRequiredForAll),legacyTokenAllowed:Boolean(o.legacyTokenAllowed)})}`);
 }catch(e){console.error(`[PRE93-D4 READINESS DIAGNOSTIC] ${e.message}`);}})();
