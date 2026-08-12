'use strict';
const fs=require('fs');
const token=String(process.env.RENDER_API_KEY||'').trim();
const serviceId=String(process.env.RENDER_SERVICE_ID||'').trim();
const targetSha=String(process.env.TARGET_SHA||'').trim();
const overrideBase=String(process.env.RENDER_API_BASE_URL||'').trim();
const base=(overrideBase||'https://api.render.com/v1').replace(/\/$/,'');
const evidencePath=String(process.env.RENDER_DEPLOY_EVIDENCE_PATH||'').trim();
function requireId(label,value,prefix){if(!new RegExp(`^${prefix}-[a-z0-9]+$`,'i').test(value))throw new Error(`${label} is missing or invalid`);return value;}
function emit(value){const row={at:new Date().toISOString(),kind:'provider_api_deploy_created',release:'v2.0.0-pre56',serviceId,deployId:value.id,status:value.status||'created',commitId:value.commit?.id||value.commitId||targetSha,credentialMaterialPresent:false,deployHookUsed:false};const line=JSON.stringify(row);if(token&&line.includes(token))throw new Error('Credential material reached the evidence serializer');console.log(line);if(evidencePath)fs.appendFileSync(evidencePath,`${line}\n`,{encoding:'utf8',mode:0o600});}
async function main(){
  if(overrideBase&&process.env.NODE_ENV!=='test')throw new Error('RENDER_API_BASE_URL override is test-only');
  if(!token)throw new Error('RENDER_API_KEY is required');requireId('RENDER_SERVICE_ID',serviceId,'srv');if(!/^[0-9a-f]{40}$/i.test(targetSha))throw new Error('TARGET_SHA is missing or invalid');
  let response;try{response=await fetch(`${base}/services/${serviceId}/deploys`,{method:'POST',headers:{Accept:'application/json',Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({clearCache:'do_not_clear',commitId:targetSha}),signal:AbortSignal.timeout(30000)});}catch(error){throw new Error(`Render deploy request ended without a provider receipt: ${error.message}`);}
  if(![201,202].includes(response.status))throw new Error(`Render API ${response.status} while creating exact deploy`);const raw=await response.text();const parsed=raw?JSON.parse(raw):{};const deploy=parsed&&typeof parsed.deploy==='object'?parsed.deploy:parsed;const deployId=requireId('Render deploy id',String(deploy.id||'').trim(),'dep');const returnedCommit=String(deploy.commit?.id||deploy.commitId||'').trim();if(returnedCommit&&returnedCommit!==targetSha)throw new Error('Created Render deploy does not bind the exact target commit');deploy.id=deployId;emit(deploy);const githubEnv=String(process.env.GITHUB_ENV||'').trim();if(githubEnv)fs.appendFileSync(githubEnv,`RENDER_DEPLOY_ID=${deployId}\n`,'utf8');
}
main().catch(error=>{console.error(`PRE56_RENDER_API_DEPLOY_FAILED: ${error.message}`);process.exit(1);});
