'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const serverPath=path.join(root,'server.js');
const receiptPath=path.join(__dirname,'..','deployment','pre58','NY_OFFICIAL_CREDENTIAL_RECONCILIATION__PRE58.json');
const priorPath=path.join(__dirname,'..','deployment','pre57','PROFILE_CURRENTNESS_EXECUTION__PRE57.json');
const MARK='SMARTER_JUSTICE_PRE58_NY_OFFICIAL_CREDENTIAL_RECONCILIATION';
if(!fs.existsSync(serverPath))throw new Error(`PRE58 missing runtime server: ${serverPath}`);
const receipt=JSON.parse(fs.readFileSync(receiptPath,'utf8'));
const prior=JSON.parse(fs.readFileSync(priorPath,'utf8'));
if(receipt.release!=='v2.0.0-pre58'||receipt.marker!==MARK)throw new Error('PRE58 receipt identity mismatch');
if(receipt.newYorkMatches?.length!==18||receipt.pendingNewJerseyProfessionalIds?.length!==7)throw new Error('PRE58 queue partition must remain exactly 18 NY and 7 NJ');
if(new Set(receipt.newYorkMatches.map(x=>x.id)).size!==18)throw new Error('PRE58 NY match ids must be unique');
if(receipt.newYorkMatches.some(x=>!x.officialFirm||!x.registrationNumber||x.officialStatus==='Deceased'))throw new Error('PRE58 official matches require a firm-aligned, non-deceased authority record');
if(receipt.newYorkMatches.some(x=>!x.matchClass.includes('FIRM_ALIGNED')))throw new Error('PRE58 name-only matches are prohibited');
if(Object.entries(receipt.consequentialActionGates||{}).filter(([,value])=>typeof value==='boolean').some(([,value])=>value))throw new Error('PRE58 consequential gates must remain closed');

const moduleSource=`'use strict';
const RECEIPT=${JSON.stringify(receipt)};
const PRIOR=${JSON.stringify(prior)};
function clone(value){return JSON.parse(JSON.stringify(value));}
function ownerView(){return{...clone(RECEIPT),access:'OWNER_ONLY',protectedQueue:{professionals:PRIOR.professionalObservations.map(row=>({...clone(row),credentialResult:RECEIPT.newYorkMatches.find(match=>match.id===row.id)?.result||(RECEIPT.pendingNewJerseyProfessionalIds.includes(row.id)?'NJ_OFFICIAL_MATCH_PENDING_OPERATOR_REVIEW':row.credentialResult)})),firms:clone(PRIOR.firmObservations)},interpretationBoundary:'An official New York match is not public profile acceptance, does not resolve another claimed jurisdiction, and opens no publication, outreach, featuring, opportunity or claim-approval gate.'};}
module.exports={ownerView};
`;
fs.writeFileSync(path.join(root,'lib','credentialReconciliationPre58.js'),moduleSource,'utf8');

let server=fs.readFileSync(serverPath,'utf8');
if(!server.includes(MARK)){
  const requireSeam="const profileCurrentnessPre57 = require('./lib/profileCurrentnessPre57');";
  if(!server.includes(requireSeam))throw new Error('PRE58 profile-currentness require seam missing');
  server=server.replace(requireSeam,`${requireSeam}\nconst credentialReconciliationPre58 = require('./lib/credentialReconciliationPre58');`);
  for(const required of ["release:'v2.0.0-pre57'","deploymentControlRelease:'v2.0.0-pre57'","marker:'SMARTER_JUSTICE_PRE57_PROTECTED_PROFILE_CURRENTNESS_EXECUTION'"])if(!server.includes(required))throw new Error(`PRE58 requires qualified pre57 marker: ${required}`);
  server=server.replace("release:'v2.0.0-pre57'","release:'v2.0.0-pre58'");
  server=server.replace("deploymentControlRelease:'v2.0.0-pre57'","deploymentControlRelease:'v2.0.0-pre58'");
  server=server.replace("marker:'SMARTER_JUSTICE_PRE57_PROTECTED_PROFILE_CURRENTNESS_EXECUTION'",`marker:'${MARK}'`);
  const commentSeam='    // SMARTER_JUSTICE_PRE57_PROTECTED_PROFILE_CURRENTNESS_EXECUTION: 25 professional and 5 firm source observations are dated, owner-only and credential-inconclusive.';
  if(!server.includes(commentSeam))throw new Error('PRE58 release comment seam missing');
  server=server.replace(commentSeam,`${commentSeam}\n    // ${MARK}: 18 NY authority matches are collision-reviewed and owner-only; 7 NJ records and all consequential gates remain closed.`);
  const ownerSeam="  if (req.method === 'GET' && pathName === '/api/owner/profile-currentness-pre57') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...profileCurrentnessPre57.ownerView()}); }";
  if(!server.includes(ownerSeam))throw new Error('PRE58 owner route seam missing');
  server=server.replace(ownerSeam,`${ownerSeam}\n  if (req.method === 'GET' && pathName === '/api/owner/credential-reconciliation-pre58') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...credentialReconciliationPre58.ownerView()}); }`);
  fs.writeFileSync(serverPath,server,'utf8');
}
console.log('PRE58_NY_OFFICIAL_CREDENTIAL_RECONCILIATION_APPLIED');
