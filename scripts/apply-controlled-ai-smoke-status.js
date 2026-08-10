'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || '.');
const gatewayPath = path.join(root, 'lib', 'centralAiGateway.js');
const marker = '// SMARTER JUSTICE CONTROLLED AI SMOKE STATUS';

function fail(message) { throw new Error(`[controlled-ai-smoke-status] ${message}`); }
if (!fs.existsSync(gatewayPath)) fail('missing lib/centralAiGateway.js');
let source = fs.readFileSync(gatewayPath, 'utf8');
if (source.includes(marker)) fail('controlled smoke status overlay already applied');
if (!source.includes('\nmodule.exports={')) fail('central AI gateway export marker missing');

const injection = String.raw`

// SMARTER JUSTICE CONTROLLED AI SMOKE STATUS
// Reads only the redacted startup-smoke receipt. No secret value is persisted or emitted.
const __sjSmokeFs=require('node:fs');
const __sjSmokePath=require('node:path');
const __sjSmokeStatusBase=status;
const __sjSmokePublicStatusBase=publicStatus;
const __sjSmokeOwnerViewBase=ownerView;
function __sjSmokeEvidence(){
  try{
    const file=__sjSmokePath.join(__dirname,'..','AI_CONTROLLED_SMOKE_EVIDENCE.json');
    const row=JSON.parse(__sjSmokeFs.readFileSync(file,'utf8'));
    if(!row||!['PASS','FAIL','SKIPPED'].includes(row.status))return null;
    return {
      status:row.status,
      checkedAt:row.checkedAt||null,
      provider:row.provider||'openai',
      model:row.model||null,
      httpStatus:Number.isInteger(row.httpStatus)?row.httpStatus:null,
      providerRequestId:typeof row.providerRequestId==='string'?row.providerRequestId:null,
      responseStored:row.responseStored===true,
      expectedPhraseObserved:row.expectedPhraseObserved===true,
      errorCategory:row.errorCategory||null,
      secretExposed:false
    };
  }catch{return null;}
}
status=function(){
  const base=__sjSmokeStatusBase();
  const smoke=__sjSmokeEvidence();
  return {...base,liveSmokeState:smoke?smoke.status:(base.liveSmokeState||'PENDING'),controlledSmokeObserved:Boolean(smoke),controlledSmokePassed:Boolean(smoke&&smoke.status==='PASS')};
};
publicStatus=function(){
  const base=__sjSmokePublicStatusBase();
  const smoke=__sjSmokeEvidence();
  return {...base,liveSmokeState:smoke?smoke.status:(base.liveSmokeState||'PENDING'),controlledSmokeObserved:Boolean(smoke),controlledSmokePassed:Boolean(smoke&&smoke.status==='PASS')};
};
ownerView=function(){
  const base=__sjSmokeOwnerViewBase();
  const smoke=__sjSmokeEvidence();
  return {...base,controlledLiveSmoke:smoke||{status:'PENDING',secretExposed:false}};
};
`;

source = source.replace('\nmodule.exports={', `${injection}\nmodule.exports={`);
if (!source.includes(marker)) fail('failed to inject controlled smoke status overlay');
fs.writeFileSync(gatewayPath, source, 'utf8');
console.log('[controlled-ai-smoke-status] dynamic redacted smoke state attached; public AI controls unchanged');
