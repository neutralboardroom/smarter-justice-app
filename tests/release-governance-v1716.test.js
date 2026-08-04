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
assert.equal(pkg.version,'1.7.16');
assert(pkg.scripts.test.includes('seo-performance-v1716.test.js'));
assert(pkg.scripts.test.includes('release-governance-v1716.test.js'));
assert(!pkg.scripts.test.includes('release-governance-v1715.test.js'));
assert(text('server.js').includes("const VERSION = '1.7.16'"));

const manifest=readJson('portal-manifest.json');
assert.equal(manifest.currentDevelopmentVersion,'1.7.16');
assert.equal(manifest.latestZipName,'smarter-justice-v1.7.16.zip');
assert.equal(manifest.lastExactArtifactTestVersion,'1.7.16');
assert.equal(manifest.testSuiteParts,30);
for(const cap of ['unifiedFreeToolsJourney','publicCapabilityTruthPage','canonicalMetadataCoverage','homepageStructuredData','staticAssetCaching','protectedPageRobotsHeaders'])assert.equal(manifest.capabilities[cap],true,`missing ${cap}`);

const improvements=readJson('NEXT_VERSION_IMPROVEMENT_LIST.json');
assert.equal(improvements.releaseVersion,'1.7.16');
assert.equal(improvements.items.length,44);
const item=improvements.items.find(x=>x.id==='SJ-NEXT-044');
assert(item && /Free Tools/i.test(item.title));
assert(/canonical/i.test(item.currentStatus) && /static asset caching/i.test(item.currentStatus));

const evidence=readJson('RELEASE_EVIDENCE_V1.7.16.json');
assert.equal(evidence.release.version,'1.7.16');
assert.equal(evidence.release.rollbackArtifact,'smarter-justice-v1.7.15.zip');
assert.equal(evidence.release.deployment.deployed,false);
for(const id of ['V1716-FREE-TOOLS-JOURNEY','V1716-CANONICAL-SEO','V1716-STRUCTURED-DATA','V1716-STATIC-CACHING','V1716-PROTECTED-ROBOTS'])assert(evidence.changes.some(x=>x.id===id),`${id} missing`);
assert(evidence.closedGates.includes('confidential production uploads'));
assert(evidence.closedGates.includes('professional membership applications and payments'));

const readiness=readJson('READINESS_DIMENSIONS_V1.7.16.json');
assert.equal(readiness.releaseVersion,'1.7.16');
assert.equal(readiness.dimensions.length,15);
assert(/61 public HTML pages/.test(readiness.dimensions.find(x=>x.id==='product').evidence));
assert.equal(readiness.dimensions.find(x=>x.id==='deployment').status,'not deployed');

const registry=require('../data/crossPortalCapabilities');
assert.equal(registry.CAPABILITY_REGISTRY_VERSION,'1.0.5');
for(const id of ['free-tools-journey','public-capability-truth','canonical-seo-metadata','static-asset-caching','protected-page-robots-headers'])assert(registry.CAPABILITY_DEFINITIONS.some(x=>x.id===id),`${id} missing from capability registry`);
const marketplace=require('../lib/professionalMarketplace');
assert.equal(marketplace.directoryMetrics().publicTotal,27);
assert.equal(marketplace.directoryMetrics().qualifyingTotal,23);

for(const file of ['CHANGE_MAP_V1.7.16.md','AUDIT_REPORT_V1.7.16.md','NO_CHANGE_LEDGER_V1.7.16.md','CONTINUATION_PROMPT_V1.7.16.md'])assert(fs.existsSync(path.join(root,file)),`${file} missing`);
assert(/Smarter Justice v1\.7\.16/.test(text('DEPLOY_RENDER.md')) && /smarter-justice-v1\.7\.15\.zip/.test(text('DEPLOY_RENDER.md')),'deployment guide must identify current release and rollback');
assert(/^# Smarter Justice v1\.7\.16/m.test(text('.env.example')),'environment example must identify the current release');
const port=portForTest(3977);
const base=`http://127.0.0.1:${port}`;
const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1716-governance-'));
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),APP_BASE_URL:base,SMARTER_JUSTICE_STORAGE_DIR:tempStorage,OWNER_CONTROL_CENTER_TOKEN:'owner-v1716-governance-token-1234567890',ADMIN_TOKEN:'admin-v1716-governance-token-1234567890',PORTAL_RULES_API_TOKEN:'rules-v1716-governance-token-1234567890',OWNER_NOTIFICATION_EMAIL:''}});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 try{
  let health;
  for(let i=0;i<60;i++){try{const r=await fetch(`${base}/health`);if(r.ok){health=await r.json();break}}catch{}await wait(100)}
  assert(health,log);
  assert.equal(health.version,'1.7.16');
  assert.equal(health.sensitiveTrafficApproved,false);
  const free=await fetch(`${base}/free-tools.html`);assert.equal(free.status,200);
  const owner=await fetch(`${base}/api/owner/operational-readiness`);assert.equal(owner.status,403);
  const status=await fetch(`${base}/api/professional-program-status`).then(r=>r.json());assert.equal(status.applicationsOpen,false);assert.equal(status.paymentOpen,false);
  const absent=await fetch(`${base}/api/document-tools`);assert.equal(absent.status,404);
  console.log('v1.7.16 release governance, free-tools truth, SEO, performance, profile totals, runtime boundaries, and closed gates passed.');
 }catch(error){console.error(log);throw error}finally{child.kill('SIGTERM');fs.rmSync(tempStorage,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
