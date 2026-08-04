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
assert.equal(pkg.version,'1.7.13');
assert(pkg.scripts.test.includes('document-tools-v1712.test.js'));
assert(pkg.scripts.test.includes('document-action-plan-v1713.test.js'));
assert(pkg.scripts.test.includes('release-governance-v1713.test.js'));
assert(text('server.js').includes("const VERSION = '1.7.13'"));

const manifest=readJson('portal-manifest.json');
assert.equal(manifest.currentDevelopmentVersion,'1.7.13');
assert.equal(manifest.latestZipName,'smarter-justice-v1.7.13.zip');
assert.equal(manifest.lastExactArtifactTestVersion,'1.7.13');
assert.equal(manifest.testSuiteParts,27);
for(const cap of ['deviceOnlyDocumentReview','deviceOnlyDocumentComparison','oneBasedSourceLineProvenance','deviceOnlySourceLinkedActionPlan','separateUserCorrectionProvenance','userChosenTargetDatesOnly','localActionPlanTextDownloads','localActionPlanStructuredDownloads','actionPlanContentsNotTransmitted']) assert.equal(manifest.capabilities[cap],true,`missing ${cap}`);

const improvements=readJson('NEXT_VERSION_IMPROVEMENT_LIST.json');
assert.equal(improvements.releaseVersion,'1.7.13');
assert.equal(improvements.items.length,41);
const item=improvements.items.find(x=>x.id==='SJ-NEXT-041');
assert(item,'SJ-NEXT-041 missing');
assert(/source-linked action-plan/i.test(item.currentStatus));
assert(/no network, account storage, browser persistence/i.test(item.currentStatus));
assert(/original source line separately/i.test(item.currentStatus));

const evidence=readJson('RELEASE_EVIDENCE_V1.7.13.json');
assert.equal(evidence.release.version,'1.7.13');
assert.equal(evidence.release.rollbackArtifact,'smarter-justice-v1.7.12.zip');
assert.equal(evidence.release.deployment.deployed,false);
assert.equal(evidence.release.deployment.liveVerified,false);
for(const id of ['V1713-SOURCE-LINKED-ACTION-PLAN','V1713-SEPARATE-CORRECTION-PROVENANCE','V1713-DEVICE-ONLY-EXPORTS-AND-CLEARING','V1713-PUBLIC-WORKFLOW-INTEGRATION']) assert(evidence.changes.some(x=>x.id===id),`${id} missing`);
assert(evidence.closedGates.includes('confidential production uploads'));
assert(evidence.closedGates.includes('professional membership applications and payments'));

const readiness=readJson('READINESS_DIMENSIONS_V1.7.13.json');
assert.equal(readiness.releaseVersion,'1.7.13');
assert.equal(readiness.dimensions.length,15);
assert(/corrections, questions, tasks, and plan exports remain in browser-tab memory/i.test(readiness.dimensions.find(x=>x.id==='privacy').evidence));
assert.equal(readiness.dimensions.find(x=>x.id==='deployment').status,'not deployed');

const registry=require('../data/crossPortalCapabilities');
assert.equal(registry.CAPABILITY_REGISTRY_VERSION,'1.0.2');
for(const id of ['device-only-document-review','device-only-document-comparison','device-only-source-linked-action-plan','separate-user-correction-provenance']) assert(registry.CAPABILITY_DEFINITIONS.some(x=>x.id===id),`${id} missing from shared capability registry`);

const docHtml=text('public/document-tools.html');
const docJs=text('public/document-tools.js');
assert(/Review, compare, and organize next steps without sending text to us/i.test(docHtml));
assert(/Source-linked action plan/i.test(docHtml));
assert(/Original text and your notes stay separate/i.test(docHtml));
assert(/user-chosen target date/i.test(docHtml));
assert(/Download Structured Plan/i.test(docHtml));
assert(!/https?:\/\//.test([...docHtml.matchAll(/<script[^>]+src="([^"]+)"/g)].map(x=>x[1]).join('')), 'document tools must not load remote scripts');
for(const forbidden of [/\bfetch\s*\(/,/XMLHttpRequest/,/localStorage/,/sessionStorage/,/indexedDB/,/navigator\.sendBeacon/]) assert(!forbidden.test(docJs),`device-only document planner must not use ${forbidden}`);
assert(!/\.innerHTML\s*=/.test(docJs));
assert(/textContent/.test(docJs));

const tools=require('../public/document-tools.js');
const sample='NOTICE\nDate: 2026-07-30\nYou must respond.\nOriginal name: Example';
const valid=tools.validateText(sample,'sample');
const analysis=tools.analyzeDocument('sample',valid.text,valid.lines);
const findings=tools.planFindingsFromAnalysis(analysis);
const planItem=tools.createPlanItemRecord('question','What does the issuing office need?','');
const correction=tools.createCorrectionRecord(4,'The spelling may be different.',valid.lines);
const plan=tools.buildActionPlanData('sample',findings.slice(0,2),[planItem.item],[correction.correction]);
assert.equal(plan.separateCorrections[0].originalSourceLine,'Original name: Example');
assert(/IMPORTANT LIMITS/.test(tools.actionPlanAsText(plan)));

const port=portForTest(3973);
const base=`http://127.0.0.1:${port}`;
const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1713-'));
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),APP_BASE_URL:base,SMARTER_JUSTICE_STORAGE_DIR:tempStorage,OWNER_CONTROL_CENTER_TOKEN:'owner-v1713-regression-token-1234567890',ADMIN_TOKEN:'admin-v1713-regression-token-1234567890',PORTAL_RULES_API_TOKEN:'rules-v1713-regression-token-1234567890',OWNER_NOTIFICATION_EMAIL:''}});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function result(url,opts={}){const response=await fetch(url,opts);const body=await response.text();let data;try{data=JSON.parse(body)}catch{data=body}return{response,data};}
(async()=>{
  try{
    let health;
    for(let i=0;i<50;i++){try{health=await result(`${base}/health`);if(health.response.ok)break}catch{}await wait(100)}
    assert(health?.response.ok,log);
    assert.equal(health.data.version,'1.7.13');
    assert.equal(health.data.sensitiveTrafficApproved,false);
    const page=await result(`${base}/document-tools.html`);
    assert.equal(page.response.status,200);
    assert(/organize next steps without sending text to us/i.test(page.data));
    const script=await result(`${base}/document-tools.js`);
    assert.equal(script.response.status,200);
    const absentApi=await result(`${base}/api/document-tools`);
    assert.equal(absentApi.response.status,404,'device-only tool must not add a document-content API');
    const owner=await result(`${base}/api/owner/operational-readiness`);
    assert.equal(owner.response.status,403);
    const status=(await result(`${base}/api/professional-program-status`)).data;
    assert.equal(status.applicationsOpen,false);
    assert.equal(status.paymentOpen,false);
    console.log('v1.7.13 source-linked planning, correction provenance, local exports, public integration, and closed-gate governance tests passed.');
  }catch(error){console.error(log);throw error}finally{child.kill('SIGTERM');fs.rmSync(tempStorage,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
