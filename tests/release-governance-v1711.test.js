const { portForTest } = require('./test-port');
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const {spawn}=require('child_process');
const root=path.join(__dirname,'..');
const text=name=>fs.readFileSync(path.join(root,name),'utf8');
const readJson=name=>JSON.parse(text(name));

const pkg=readJson('package.json');
assert.equal(pkg.version,'1.7.11');
assert(pkg.scripts.test.includes('release-governance-v1711.test.js'));
assert(text('server.js').includes("const VERSION = '1.7.11'"));
const manifest=readJson('portal-manifest.json');
assert.equal(manifest.currentDevelopmentVersion,'1.7.11');
assert.equal(manifest.latestZipName,'smarter-justice-v1.7.11.zip');
assert.equal(manifest.lastExactArtifactTestVersion,'1.7.11');
assert.equal(manifest.testSuiteParts,25);
for(const cap of ['structuredPublicProfileRequests','publicProfileRequestReferences','professionalCommunicationPreferences','essentialProfessionalNoticesProtected','actionableProfessionalOnboarding']) assert.equal(manifest.capabilities[cap],true,`missing ${cap}`);

const improvements=readJson('NEXT_VERSION_IMPROVEMENT_LIST.json');
assert.equal(improvements.releaseVersion,'1.7.11');
assert.equal(improvements.items.length,39);
for(const id of ['SJ-NEXT-016','SJ-NEXT-018','SJ-NEXT-020','SJ-NEXT-039']) assert(improvements.items.some(x=>x.id===id),`${id} missing`);
assert(/v1\.7\.11/i.test(improvements.items.find(x=>x.id==='SJ-NEXT-020').currentStatus));
assert(/v1\.7\.11/i.test(improvements.items.find(x=>x.id==='SJ-NEXT-039').currentStatus));

const evidence=readJson('RELEASE_EVIDENCE_V1.7.11.json');
assert.equal(evidence.release.version,'1.7.11');
assert.equal(evidence.release.deployment.deployed,false);
assert.equal(evidence.release.deployment.liveVerified,false);
assert.equal(evidence.release.rollbackArtifact,'smarter-justice-v1.7.10.zip');
for(const id of ['V1711-PROFILE-REQUESTS','V1711-COMMUNICATION-PREFERENCES','V1711-ACTIONABLE-ONBOARDING']) assert(evidence.changes.some(x=>x.id===id),`${id} missing`);

const readiness=readJson('READINESS_DIMENSIONS_V1.7.11.json');
assert.equal(readiness.dimensions.length,15);
assert(readiness.dimensions.some(x=>x.id==='professionalOperations'));
assert(readiness.dimensions.some(x=>x.id==='email'));

const standards=require('../data/professionalMarketplaceStandards');
for(const type of ['duplicate review','suppression request','employment change']) assert(standards.PROFILE_REQUEST_TYPES.includes(type));
assert.equal(standards.PROFESSIONAL_MARKETPLACE_STANDARD_VERSION,'1.3.4');
const contact=text('public/contact.html');
assert(/data-profile-request-fields/.test(contact));
assert(/privacyAcknowledged/.test(contact));
const professionalJs=text('public/professional.js');
assert(/professionalCommunicationForm/.test(professionalJs));
assert(/Essential security, legal, account, and billing notices/.test(professionalJs));
assert(/actionHref/.test(professionalJs));

const port=portForTest(3971);
const base=`http://127.0.0.1:${port}`;
const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1711-'));
const ownerToken='owner-v1711-regression-token-1234567890';
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),APP_BASE_URL:base,SMARTER_JUSTICE_STORAGE_DIR:tempStorage,OWNER_CONTROL_CENTER_TOKEN:ownerToken,ADMIN_TOKEN:'admin-v1711-regression-token-1234567890',PORTAL_RULES_API_TOKEN:'rules-v1711-regression-token-1234567890',OWNER_NOTIFICATION_EMAIL:''}});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function result(url,opts={}){const response=await fetch(url,opts);const body=await response.text();let data;try{data=JSON.parse(body)}catch{data=body}return{response,data};}
function post(body,headers={}){return{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}}
(async()=>{
  try{
    for(let i=0;i<50;i++){try{const h=await result(`${base}/health`);if(h.response.ok)break}catch{}await wait(100)}
    const directory=(await result(`${base}/api/public/professionals`)).data;
    const profile=directory.professionals.find(x=>x.recordId);
    assert(profile,'public profile seed required');
    const missingAck=await result(`${base}/api/public/profile-requests`,post({profileId:profile.recordId,requestType:'correction',requesterName:'Public Requester',requesterEmail:'requester@example.test',details:'Please correct the office information.'}));
    assert.equal(missingAck.response.status,400);
    const request=await result(`${base}/api/public/profile-requests`,post({profileId:profile.recordId,requestType:'duplicate review',requesterName:'Public Requester',requesterEmail:'requester@example.test',requesterRelationship:'member of the public',details:'This appears to duplicate another public profile and should be reviewed.',evidenceUrls:['https://example.test/public-source'],privacyAcknowledged:true,sourcePage:`${base}/professional-profile.html?id=${encodeURIComponent(profile.id)}`}));
    assert.equal(request.response.status,201,JSON.stringify(request.data));
    assert(/^SJ-PROFILE-\d{8}-/.test(request.data.receipt.reference));
    assert.equal(request.data.receipt.requestType,'duplicate review');
    assert(!Object.prototype.hasOwnProperty.call(request.data.receipt,'requesterEmail'));
    const owner=(await result(`${base}/api/owner/professional-marketplace`,{headers:{'X-Owner-Control-Token':ownerToken}})).data;
    const saved=owner.profileRequests.find(x=>x.publicReference===request.data.receipt.reference);
    assert(saved,'structured request missing from owner workflow');
    assert.equal(saved.requesterEmail,'requester@example.test');
    assert.equal(saved.evidenceUrls[0],'https://example.test/public-source');

    const signup=await result(`${base}/api/professional/auth/signup`,post({accountType:'individual',displayName:'Communication Test Professional',email:'communications@example.test',password:'LongPassword!CommunicationTest',acceptTerms:true,acceptPrivacy:true}));
    assert.equal(signup.response.status,201,JSON.stringify(signup.data));
    const verify=await result(`${base}/api/professional/auth/email-verification/confirm`,post({token:signup.data.verification.testToken}));
    assert.equal(verify.response.status,200,JSON.stringify(verify.data));
    const cookie=String(verify.response.headers.get('set-cookie')||'').split(';')[0];
    const before=(await result(`${base}/api/professional/dashboard`,{headers:{Cookie:cookie}})).data;
    assert.equal(before.account.communicationPreferences.essentialNotices,true);
    const update=await result(`${base}/api/professional/communication-preferences`,post({preferredLanguage:'es',essentialNotices:false,profileAndDirectoryUpdates:false,membershipAndProgramUpdates:false,researchAndFeedbackInvitations:true},{Cookie:cookie}));
    assert.equal(update.response.status,200,JSON.stringify(update.data));
    assert.equal(update.data.communicationPreferences.essentialNotices,true);
    assert.equal(update.data.communicationPreferences.preferredLanguage,'es');
    assert.equal(update.data.communicationPreferences.profileAndDirectoryUpdates,false);
    const after=(await result(`${base}/api/professional/dashboard`,{headers:{Cookie:cookie}})).data;
    assert(after.account.communicationPreferences.updatedAt);
    assert.equal(after.account.communicationPreferences.researchAndFeedbackInvitations,true);
    const status=(await result(`${base}/api/professional-program-status`)).data;
    assert.equal(status.applicationsOpen,false);
    assert.equal(status.paymentOpen,false);
    console.log('v1.7.11 profile operations, communication preferences, and onboarding tests passed.');
  }catch(error){console.error(log);throw error}finally{child.kill('SIGTERM');fs.rmSync(tempStorage,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
