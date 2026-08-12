'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const serverPath=path.join(root,'server.js');
const receiptPath=path.join(__dirname,'..','deployment','pre57','PROFILE_CURRENTNESS_EXECUTION__PRE57.json');
const MARK='SMARTER_JUSTICE_PRE57_PROTECTED_PROFILE_CURRENTNESS_EXECUTION';
if(!fs.existsSync(serverPath))throw new Error(`PRE57 missing runtime server: ${serverPath}`);
const receipt=JSON.parse(fs.readFileSync(receiptPath,'utf8'));
if(receipt.release!=='v2.0.0-pre57'||receipt.marker!==MARK)throw new Error('PRE57 receipt identity mismatch');
if(receipt.professionalObservations?.length!==25||receipt.firmObservations?.length!==5)throw new Error('PRE57 receipt must contain exactly 25 professional and 5 firm observations');
if(receipt.professionalObservations.some(x=>x.credentialResult!=='NOT_INDEPENDENTLY_VERIFIED'))throw new Error('PRE57 cannot convert source observation into credential verification');
if(Object.entries(receipt.consequentialActionGates||{}).filter(([,value])=>typeof value==='boolean').some(([,value])=>value))throw new Error('PRE57 consequential gates must remain closed');

const moduleSource=`'use strict';
const RECEIPT=${JSON.stringify(receipt)};
function clone(value){return JSON.parse(JSON.stringify(value));}
function ownerView(){return{...clone(RECEIPT),access:'OWNER_ONLY',interpretationBoundary:'Current professional-controlled and firm-controlled source presence is not independent credential verification. No publication, outreach, featuring, opportunity or claim-approval gate is opened by this receipt.'};}
module.exports={ownerView};
`;
fs.writeFileSync(path.join(root,'lib','profileCurrentnessPre57.js'),moduleSource,'utf8');

let server=fs.readFileSync(serverPath,'utf8');
if(!server.includes(MARK)){
  const requireSeam="const privateAcquisitionMeasurementPre56 = require('./lib/privateAcquisitionMeasurementPre56');";
  if(!server.includes(requireSeam))throw new Error('PRE57 private-measurement require seam missing');
  server=server.replace(requireSeam,`${requireSeam}\nconst profileCurrentnessPre57 = require('./lib/profileCurrentnessPre57');`);
  for(const required of ["release:'v2.0.0-pre56'","deploymentControlRelease:'v2.0.0-pre56'","marker:'SMARTER_JUSTICE_PRE56_PRIVACY_MINIMIZED_MEASUREMENT'"])if(!server.includes(required))throw new Error(`PRE57 requires qualified pre56 marker: ${required}`);
  server=server.replace("release:'v2.0.0-pre56'","release:'v2.0.0-pre57'");
  server=server.replace("deploymentControlRelease:'v2.0.0-pre56'","deploymentControlRelease:'v2.0.0-pre57'");
  server=server.replace("marker:'SMARTER_JUSTICE_PRE56_PRIVACY_MINIMIZED_MEASUREMENT'",`marker:'${MARK}'`);
  const commentSeam='    // SMARTER_JUSTICE_PRE56_PRIVACY_MINIMIZED_MEASUREMENT: consent-first, first-party acquisition measurement stores only bounded daily aggregates.';
  if(!server.includes(commentSeam))throw new Error('PRE57 release comment seam missing');
  server=server.replace(commentSeam,`${commentSeam}\n    // ${MARK}: 25 professional and 5 firm source observations are dated, owner-only and credential-inconclusive.`);
  const ownerSeam="  if (req.method === 'GET' && pathName === '/api/owner/private-acquisition-measurement') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...privateAcquisitionMeasurementPre56.ownerView()}); }";
  if(!server.includes(ownerSeam))throw new Error('PRE57 owner route seam missing');
  server=server.replace(ownerSeam,`${ownerSeam}\n  if (req.method === 'GET' && pathName === '/api/owner/profile-currentness-pre57') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...profileCurrentnessPre57.ownerView()}); }`);
  fs.writeFileSync(serverPath,server,'utf8');
}
console.log('PRE57_PROTECTED_PROFILE_CURRENTNESS_EXECUTION_APPLIED');

