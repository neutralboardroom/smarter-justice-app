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
assert.equal(pkg.version,'1.7.18');
assert(pkg.scripts.test.includes('preparation-binder-v1718.test.js'));
assert(pkg.scripts.test.includes('release-governance-v1718.test.js'));
assert(!pkg.scripts.test.includes('release-governance-v1717.test.js'));
assert(text('server.js').includes("const VERSION = '1.7.18'"));

const manifest=readJson('portal-manifest.json');
assert.equal(manifest.currentDevelopmentVersion,'1.7.18');
assert.equal(manifest.latestZipName,'smarter-justice-v1.7.18.zip');
assert.equal(manifest.lastExactArtifactTestVersion,'1.7.18');
assert.equal(manifest.testSuiteParts,32);
for(const cap of ['deviceOnlyPreparationBinder','exactSourceBinderProvenance','separateBinderCorrectionProvenance','localBinderTextAndStructuredDownloads','binderContentsNotTransmitted']) assert.equal(manifest.capabilities[cap],true,`missing ${cap}`);

const improvements=readJson('NEXT_VERSION_IMPROVEMENT_LIST.json');
assert.equal(improvements.releaseVersion,'1.7.18');
assert.equal(improvements.items.length,46);
const item=improvements.items.find(x=>x.id==='SJ-NEXT-046');
assert(item && /preparation binder/i.test(item.title));
assert(/text or structured JSON|plain text or structured JSON|text and JSON/i.test(item.currentStatus));

const evidence=readJson('RELEASE_EVIDENCE_V1.7.18.json');
assert.equal(evidence.release.version,'1.7.18');
assert.equal(evidence.release.rollbackArtifact,'smarter-justice-v1.7.17.zip');
assert.equal(evidence.release.deployment.deployed,false);
assert(evidence.changes.some(x=>x.id==='V1718-PREPARATION-BINDER'));
assert(evidence.changes.some(x=>x.id==='V1718-GOVERNANCE-TRUTH'));
assert(evidence.closedGates.includes('confidential production uploads'));
assert(evidence.closedGates.includes('professional membership applications and payments'));

const readiness=readJson('READINESS_DIMENSIONS_V1.7.18.json');
assert.equal(readiness.releaseVersion,'1.7.18');
assert.equal(readiness.dimensions.length,15);
assert(/preparation binder/i.test(readiness.dimensions.find(x=>x.id==='product').evidence));
assert.equal(readiness.dimensions.find(x=>x.id==='deployment').status,'not deployed');

const registry=require('../data/crossPortalCapabilities');
assert.equal(registry.CAPABILITY_REGISTRY_VERSION,'1.0.7');
assert(registry.CAPABILITY_DEFINITIONS.some(x=>x.id==='device-only-preparation-binder'));
const marketplace=require('../lib/professionalMarketplace');
assert.equal(marketplace.directoryMetrics().publicTotal,27);
assert.equal(marketplace.directoryMetrics().qualifyingTotal,23);

for(const file of ['CHANGE_MAP_V1.7.18.md','AUDIT_REPORT_V1.7.18.md','NO_CHANGE_LEDGER_V1.7.18.md','CONTINUATION_PROMPT_V1.7.18.md']) assert(fs.existsSync(path.join(root,file)),`${file} missing`);
assert(/Smarter Justice v1\.7\.18/.test(text('DEPLOY_RENDER.md')) && /smarter-justice-v1\.7\.17\.zip/.test(text('DEPLOY_RENDER.md')),'deployment guide must identify current release and rollback');
assert(/^# Smarter Justice v1\.7\.18/m.test(text('.env.example')),'environment example must identify current release');
assert(/^# Smarter Justice v1\.7\.18 Current Build Master List/m.test(text('NEXT_BUILD_MASTER_LIST.md')),'current master-list heading must match release truth');
assert(text('NEXT_BUILD_MASTER_LIST.md').includes('227. **[P0/P1 · carried forward] Real-device and connected-service gates.**'));

const port=portForTest(3979);
const base=`http://127.0.0.1:${port}`;
const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1718-governance-'));
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),APP_BASE_URL:base,SMARTER_JUSTICE_STORAGE_DIR:tempStorage,OWNER_CONTROL_CENTER_TOKEN:'owner-v1718-governance-token-1234567890',ADMIN_TOKEN:'admin-v1718-governance-token-1234567890',PORTAL_RULES_API_TOKEN:'rules-v1718-governance-token-1234567890',OWNER_NOTIFICATION_EMAIL:''}});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 try{
  let health;
  for(let i=0;i<60;i++){try{const r=await fetch(`${base}/health`);if(r.ok){health=await r.json();break}}catch{}await wait(100)}
  assert(health,log);
  assert.equal(health.version,'1.7.18');
  assert.equal(health.sensitiveTrafficApproved,false);
  const documentTools=await fetch(`${base}/document-tools.html`);assert.equal(documentTools.status,200);assert((await documentTools.text()).includes('preparation-binder'));
  const free=await fetch(`${base}/free-tools.html`);assert.equal(free.status,200);assert((await free.text()).includes('#preparation-binder'));
  const owner=await fetch(`${base}/api/owner/operational-readiness`);assert.equal(owner.status,403);
  const status=await fetch(`${base}/api/professional-program-status`).then(r=>r.json());assert.equal(status.applicationsOpen,false);assert.equal(status.paymentOpen,false);
  const absent=await fetch(`${base}/api/document-tools`);assert.equal(absent.status,404);
  console.log('v1.7.18 release governance, preparation binder, profile totals, runtime boundaries, and closed gates passed.');
 }catch(error){console.error(log);throw error}finally{child.kill('SIGTERM');fs.rmSync(tempStorage,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
