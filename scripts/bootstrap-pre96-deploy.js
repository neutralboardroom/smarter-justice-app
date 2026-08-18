'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const root=path.resolve(__dirname,'..');
const candidates=['PRE96_DEPLOY_RUNTIME.tgz','PRE96_DEPLOY_RUNTIME(1).tgz','PRE96_DEPLOY_RUNTIME(2).tgz'].map(n=>path.join(root,n));
const archive=candidates.find(p=>fs.existsSync(p));
const target=path.join(root,'.runtime','pre96-live');
const expectedSha256='a506ac9c1c0447b97f412da30341ea616e089be423a3c43addf6ca3813f7a9bc';
const expectedBytes=14393357;
function fail(message){console.error(`[PRE96 DEPLOY] ${message}`);process.exit(1)}
function assert(ok,message){if(!ok)fail(message)}
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
function readJson(rel){const p=path.join(target,rel);assert(fs.existsSync(p),`missing required file: ${rel}`);return JSON.parse(fs.readFileSync(p,'utf8'))}
function countHtml(dir){let n=0;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())n+=countHtml(p);else if(e.isFile()&&e.name.endsWith('.html'))n++;}return n}
assert(archive,'PRE96 deployment carrier is missing');
const stat=fs.statSync(archive);assert(stat.size===expectedBytes,`carrier size mismatch: ${stat.size} != ${expectedBytes}`);
const digest=sha(archive);assert(digest===expectedSha256,`carrier SHA-256 mismatch: ${digest}`);
const members=cp.execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:64*1024*1024});
for(const raw of members.split(/\r?\n/)){const name=raw.trim();if(!name)continue;const normalized=name.replace(/^\.\//,'');assert(!path.posix.isAbsolute(normalized),`unsafe absolute archive member: ${name}`);assert(!normalized.split('/').includes('..'),`unsafe parent traversal archive member: ${name}`)}
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});
cp.execFileSync('tar',['-xzf',archive,'-C',target],{stdio:'inherit'});
const pkg=readJson('package.json');assert(pkg.name==='smarter-justice-v1','unexpected runtime package identity');assert(pkg.version==='2.0.0-pre96',`unexpected runtime version: ${pkg.version}`);
const seal=readJson('governance/current/PRE_SEAL_RULE_LOCK_RECEIPT.json');
assert(seal.PRODUCT==='SMARTER JUSTICE','product identity mismatch');assert(seal.PRODUCT_SCOPE==='SMARTER JUSTICE ONLY','product scope mismatch');assert(seal.PRE_BUILD_RULE_LOCK==='PASS'&&seal.PRE_SEAL_RULE_LOCK==='PASS','Roger Rule lock not PASS');assert(Number(seal.MISSING_ROGER_RULES)===0&&Number(seal.UNAUTHORIZED_ROGER_RULE_CHANGES)===0,'Roger Rule preservation failure');assert(Number(seal.ROGER_RULE_RECORDS)===650&&Number(seal.ACTIVE_ROGER_REQUIREMENTS)===646,'Roger Rule count mismatch');assert(seal.NATIONAL_OWNER_RULE==='SJ-RGR-PRE92-NATIONAL-USA-SCOPE','national USA Roger Rule missing');assert(seal.MAXIMUM_REASONABLE_OWNER_RULE==='SJ-RGR-PRE87-MAXIMUM-REASONABLE-BUILD-BREADTH','maximum-reasonable Roger Rule missing');
const summary=readJson('deployment/pre96/PRE96_RELEASE_SUMMARY.json');assert(summary.release==='v2.0.0-pre96','release summary mismatch');assert(summary.overallAssertions===665&&summary.runtimeSmokeChecks===177&&summary.sameOriginLinksChecked===6005,'qualification summary mismatch');assert(summary.attorneyDirectory?.factoryVersion==='0.31.0'&&summary.attorneyDirectory?.professionals===12121&&summary.attorneyDirectory?.firms===503&&summary.attorneyDirectory?.factoryTotal===12624,'release Factory summary mismatch');
const factory=readJson('data/profile-factory/manifest.json');assert(factory.producer?.version==='0.31.0','Factory version mismatch');assert(factory.counts?.professionals===12121&&factory.counts?.firms===503&&factory.counts?.total===12624,'Factory counts mismatch');
assert(countHtml(path.join(target,'public'))===168,'public HTML surface count mismatch');
for(const rel of ['server.js','public/index.html','public/professionals.html','public/attorney-partner-tour.html','public/professional-signup.html','public/professional-firm-operations.html','public/legal-workbench.html','public/es/profesionales.html','public/es/operaciones-firma.html','public/es/mesa-legal.html'])assert(fs.existsSync(path.join(target,rel)),`missing deploy-critical surface: ${rel}`);
for(const rel of ['server.js','lib/professionalMarketplace.js','lib/professionalAccounts.js','lib/firmOperationsPre96.js'])cp.execFileSync(process.execPath,['--check',path.join(target,rel)],{stdio:'inherit'});
const npm=process.platform==='win32'?'npm.cmd':'npm';cp.execFileSync(npm,['--prefix',target,'ci','--omit=dev','--no-audit','--no-fund','--ignore-scripts'],{stdio:'inherit',env:{...process.env,NPM_CONFIG_AUDIT:'false',NPM_CONFIG_FUND:'false'}});
const marker={schemaVersion:'smarter-justice.pre96.render-bootstrap.v1',release:'v2.0.0-pre96',carrier:path.basename(archive),carrierSha256:digest,carrierBytes:stat.size,rogerRuleRecords:seal.ROGER_RULE_RECORDS,activeRogerRequirements:seal.ACTIVE_ROGER_REQUIREMENTS,nationalOwnerRule:seal.NATIONAL_OWNER_RULE,maximumReasonableOwnerRule:seal.MAXIMUM_REASONABLE_OWNER_RULE,factoryVersion:factory.producer.version,factoryCounts:factory.counts,htmlSurfaces:168,preparedAt:new Date().toISOString()};
fs.writeFileSync(path.join(target,'.pre96-render-bootstrap.json'),JSON.stringify(marker,null,2)+'\n');
console.log(`[PRE96 DEPLOY] verified ${marker.release}; Factory=${marker.factoryCounts.total}; pages=${marker.htmlSurfaces}; carrier=${digest}`);
