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
assert.equal(pkg.version,'1.7.15');
assert(pkg.scripts.test.includes('professional-directory-search-v1714.test.js'));
assert(pkg.scripts.test.includes('professional-directory-compare-v1715.test.js'));
assert(pkg.scripts.test.includes('release-governance-v1715.test.js'));
assert(text('server.js').includes("const VERSION = '1.7.15'"));

const manifest=readJson('portal-manifest.json');
assert.equal(manifest.currentDevelopmentVersion,'1.7.15');
assert.equal(manifest.latestZipName,'smarter-justice-v1.7.15.zip');
assert.equal(manifest.lastExactArtifactTestVersion,'1.7.15');
assert.equal(manifest.testSuiteParts,29);
assert.equal(manifest.professionalMarketplaceStandardVersion,'1.3.5');
for(const cap of ['neutralMultiFieldProfessionalSearch','exactPostalCodeProfessionalSearch','cityStateProfessionalSearch','professionalPracticeSearchSynonyms','professionalSearchSourceFreshness','strictQualifyingProfileMetrics','accessibleProfessionalSearchRecovery','paidStatusExcludedFromOrganicOrdering','documentedFirmPracticePreservation'])assert.equal(manifest.capabilities[cap],true,`missing ${cap}`);

const improvements=readJson('NEXT_VERSION_IMPROVEMENT_LIST.json');
assert.equal(improvements.releaseVersion,'1.7.15');
assert.equal(improvements.items.length,43);
const item=improvements.items.find(x=>x.id==='SJ-NEXT-042');
assert(item&&/exact ZIP, city, and state/i.test(item.currentStatus));
assert(/does not secretly prioritize payment/i.test(item.currentStatus));
assert(/23 meet the strict complete-profile counting rule/i.test(item.currentStatus));
const compareItem=improvements.items.find(x=>x.id==='SJ-NEXT-043');
assert(compareItem && /capped at three profiles/i.test(compareItem.currentStatus) && /URL-based shortlist/i.test(compareItem.currentStatus) && /documented public facts/i.test(compareItem.userBenefit));

const evidence=readJson('RELEASE_EVIDENCE_V1.7.15.json');
assert.equal(evidence.release.version,'1.7.15');
assert.equal(evidence.release.rollbackArtifact,'smarter-justice-v1.7.14.zip');
assert.equal(evidence.release.deployment.deployed,false);
assert.equal(evidence.release.deployment.liveVerified,false);
assert(evidence.changes.some(x=>x.id==='V1715-PROFILE-COMPARISON'),'v1.7.15 comparison change missing');
assert(evidence.closedGates.includes('confidential production uploads'));
assert(evidence.closedGates.includes('professional membership applications and payments'));

const readiness=readJson('READINESS_DIMENSIONS_V1.7.15.json');
assert.equal(readiness.releaseVersion,'1.7.15');
assert.equal(readiness.dimensions.length,15);
assert(/27 public directory records, 23 strict qualifying profiles/.test(readiness.dimensions.find(x=>x.id==='product').evidence));
assert(/device-only comparison/.test(readiness.dimensions.find(x=>x.id==='product').evidence));
assert.equal(readiness.dimensions.find(x=>x.id==='deployment').status,'not deployed');

const registry=require('../data/crossPortalCapabilities');
assert.equal(registry.CAPABILITY_REGISTRY_VERSION,'1.0.4');
for(const id of ['neutral-multi-field-professional-search','exact-postal-professional-search','professional-practice-search-taxonomy','qualifying-profile-metrics','device-only-professional-comparison'])assert(registry.CAPABILITY_DEFINITIONS.some(x=>x.id===id),`${id} missing from capability registry`);

const standards=require('../data/professionalMarketplaceStandards');
assert.equal(standards.PROFESSIONAL_MARKETPLACE_STANDARD_VERSION,'1.3.5');
const marketplace=require('../lib/professionalMarketplace');
assert.deepEqual(marketplace.directoryMetrics(),{
 publicProfessionals:11,publicFirms:16,publicTotal:27,qualifyingProfessionals:10,qualifyingFirms:13,qualifyingTotal:23,
 qualificationRule:'Complete public profile with supported professional type or firm identity, documented practice or service area, business office, jurisdiction, and at least one non-secondary source record with review date and supported facts.'
});

const port=portForTest(3975);
const base=`http://127.0.0.1:${port}`;
const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1715-'));
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),APP_BASE_URL:base,SMARTER_JUSTICE_STORAGE_DIR:tempStorage,OWNER_CONTROL_CENTER_TOKEN:'owner-v1715-regression-token-1234567890',ADMIN_TOKEN:'admin-v1715-regression-token-1234567890',PORTAL_RULES_API_TOKEN:'rules-v1715-regression-token-1234567890',OWNER_NOTIFICATION_EMAIL:''}});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function result(url,opts={}){const response=await fetch(url,opts);const body=await response.text();let data;try{data=JSON.parse(body)}catch{data=body}return{response,data};}
(async()=>{
 try{
  let health;
  for(let i=0;i<50;i++){try{health=await result(`${base}/health`);if(health.response.ok)break}catch{}await wait(100)}
  assert(health?.response.ok,log);
  assert.equal(health.data.version,'1.7.15');
  assert.equal(health.data.sensitiveTrafficApproved,false);
  const directory=await result(`${base}/professionals.html`);assert.equal(directory.response.status,200);assert(/ZIP code/.test(directory.data)&&/More search filters/.test(directory.data)&&/Compare selected profiles/.test(directory.data));
  let search=await result(`${base}/api/public/professionals?postalCode=11242&practice=car%20accident&limit=100`);assert.equal(search.response.status,200);assert.equal(search.data.metrics.qualifyingTotal,23);assert(search.data.professionals.some(x=>x.displayName==='Michael S. Lamonsoff'));assert.equal(search.data.distanceSearchAvailable,false);
  search=await result(`${base}/api/public/firms?language=Spanish&limit=100`);assert.equal(search.response.status,200);assert.equal(search.data.total,1);
  search=await result(`${base}/api/public/professionals?inquiryAvailability=true`);assert.equal(search.response.status,200);assert.equal(search.data.total,0);
  const owner=await result(`${base}/api/owner/operational-readiness`);assert.equal(owner.response.status,403);
  const status=(await result(`${base}/api/professional-program-status`)).data;assert.equal(status.applicationsOpen,false);assert.equal(status.paymentOpen,false);
  const absentApi=await result(`${base}/api/document-tools`);assert.equal(absentApi.response.status,404);
  console.log('v1.7.15 professional comparison, neutral search, qualifying-profile governance, version records, runtime filters, and closed-gate tests passed.');
 }catch(error){console.error(log);throw error}finally{child.kill('SIGTERM');fs.rmSync(tempStorage,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
