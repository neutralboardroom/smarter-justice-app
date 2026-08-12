'use strict';
const fs=require('fs'),path=require('path');
const runtime=path.join(process.cwd(),'.runtime','smarter-justice-v1.7.98');
const serverPath=path.join(runtime,'server.js');
const receiptPath=path.join(process.cwd(),'deployment','pre57','PROFILE_CURRENTNESS_EXECUTION__PRE57.json');
const failures=[];
if(!fs.existsSync(serverPath))failures.push('RUNTIME_SERVER_MISSING');
if(!fs.existsSync(path.join(runtime,'lib','profileCurrentnessPre57.js')))failures.push('PRE57_RUNTIME_MODULE_MISSING');
if(!fs.existsSync(receiptPath))failures.push('PRE57_RECEIPT_MISSING');
const server=fs.existsSync(serverPath)?fs.readFileSync(serverPath,'utf8'):'';
for(const marker of ["release:'v2.0.0-pre57'","demoPathRelease:'v2.0.0-pre52'","deploymentControlRelease:'v2.0.0-pre57'","SMARTER_JUSTICE_PRE57_PROTECTED_PROFILE_CURRENTNESS_EXECUTION","process.env.PORT","server.listen(port"])if(!server.includes(marker))failures.push(`SERVER_MARKER_MISSING:${marker}`);
let receipt={};
try{receipt=JSON.parse(fs.readFileSync(receiptPath,'utf8'));}catch{failures.push('PRE57_RECEIPT_INVALID');}
if(receipt.summary?.protectedRecordsAttempted!==30)failures.push('PRE57_RECORD_COUNT_INVALID');
if(receipt.summary?.officialCredentialMatchesCompleted!==0)failures.push('PRE57_CREDENTIAL_TRUTH_INVALID');
const result={ok:failures.length===0,release:'v2.0.0-pre57',runtimeVersion:'v1.7.98',port:Number(process.env.PORT||3000),render:Boolean(process.env.RENDER),protectedRecords:receipt.summary?.protectedRecordsAttempted||0,credentialMatches:receipt.summary?.officialCredentialMatchesCompleted??null,consequentialGates:'CLOSED',fullQualificationLocation:'BUILD_AND_CI_NOT_RUNTIME_START',failures};
console.log(JSON.stringify(result));
if(failures.length)process.exit(1);

