'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const root=path.resolve(__dirname,'..');
const candidates=['PRE103_DEPLOY_RUNTIME.tgz','PRE103_DEPLOY_RUNTIME (1).tgz','PRE103_DEPLOY_RUNTIME(1).tgz','PRE103_DEPLOY_RUNTIME (2).tgz','PRE103_DEPLOY_RUNTIME(2).tgz'].map(n=>path.join(root,n));
const archive=candidates.find(p=>fs.existsSync(p));
const target=path.join(root,'.runtime','pre103-live');
const expectedSha256='62fbabf584cf2b98b03c8d1cc5428fed818bd5e5f088dcd2d65eb1a58b18f967';
const expectedBytes=11291396;
const BRAND='Free legal help first. Professional help when it makes sense.';
function fail(message){console.error(`[PRE103 DEPLOY] ${message}`);process.exit(1)}
function assert(ok,message){if(!ok)fail(message)}
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
function readJson(rel){const p=path.join(target,rel);assert(fs.existsSync(p),`missing required file: ${rel}`);return JSON.parse(fs.readFileSync(p,'utf8'))}
function read(rel){const p=path.join(target,rel);assert(fs.existsSync(p),`missing required file: ${rel}`);return fs.readFileSync(p,'utf8')}
function countHtml(dir){let n=0;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())n+=countHtml(p);else if(e.isFile()&&e.name.endsWith('.html'))n++;}return n}
assert(archive,'PRE103 deployment carrier is missing');
const stat=fs.statSync(archive);assert(stat.size===expectedBytes,`carrier size mismatch: ${stat.size} != ${expectedBytes}`);
const digest=sha(archive);assert(digest===expectedSha256,`carrier SHA-256 mismatch: ${digest}`);
const members=cp.execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:64*1024*1024});
for(const raw of members.split(/\r?\n/)){const name=raw.trim();if(!name)continue;const normalized=name.replace(/^\.\//,'');assert(!path.posix.isAbsolute(normalized),`unsafe absolute archive member: ${name}`);assert(!normalized.split('/').includes('..'),`unsafe parent traversal archive member: ${name}`)}
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});
cp.execFileSync('tar',['-xzf',archive,'-C',target],{stdio:'inherit'});
const pkg=readJson('package.json');assert(pkg.name==='smarter-justice-v1','unexpected runtime package identity');assert(pkg.version==='2.0.0-pre103',`unexpected runtime version: ${pkg.version}`);
const seal=readJson('governance/current/PRE_SEAL_RULE_LOCK_RECEIPT.json');assert(seal.PRODUCT==='SMARTER JUSTICE','product identity mismatch');assert(seal.PRODUCT_SCOPE==='SMARTER JUSTICE ONLY','product scope mismatch');assert(seal.PRE_BUILD_RULE_LOCK==='PASS'&&seal.PRE_SEAL_RULE_LOCK==='PASS','Roger Rule lock not PASS');assert(Number(seal.ROGER_RULE_RECORDS)===684&&Number(seal.ACTIVE_ROGER_REQUIREMENTS)===680,'Roger Rule count mismatch');assert(Number(seal.MISSING_ROGER_RULES)===0&&Number(seal.UNAUTHORIZED_ROGER_RULE_CHANGES)===0,'Roger Rule preservation failure');assert(seal.BRAND_PROMISE_OWNER_RULE==='SJ-RGR-PRE102-NAV-013','brand promise Roger Rule missing');
const summary=readJson('deployment/pre103/PRE103_RELEASE_SUMMARY.json');assert(summary.release==='v2.0.0-pre103','release summary mismatch');assert(summary.qualification?.releaseAssertions==='41/41 PASS','release assertions mismatch');assert(summary.qualification?.sameOriginReferences==='6395/6395 PASS','link qualification mismatch');assert(summary.qualification?.runtimeChecks==='246/246 PASS','runtime qualification mismatch');assert(summary.qualification?.chromiumWidthChecks==='332/332 PASS','rendered qualification mismatch');assert(Number(summary.qualification?.highConfidenceSecretFindings)===0,'secret scan mismatch');assert(summary.noLoss?.result==='PASS'&&Number(summary.noLoss?.predecessorPathsRemoved)===0&&Number(summary.noLoss?.fileModeChanges)===0,'no-loss qualification mismatch');
const factory=readJson('data/profile-factory/manifest.json');assert(factory.producer?.version==='0.36.0','Factory version mismatch');assert(factory.counts?.professionals===12356&&factory.counts?.firms===521&&factory.counts?.total===12877,'Factory counts mismatch');
for(const rel of ['public/index.html','public/navigator.html'])assert(read(rel).includes(BRAND),`${rel} brand promise missing`);
assert(read('public/es/index.html').includes('Ayuda legal gratuita primero. Ayuda profesional cuando tenga sentido.'),'Spanish home brand promise missing');
assert(read('public/es/navegador.html').includes('Ayuda legal gratuita primero. Ayuda profesional cuando tenga sentido.'),'Spanish Navigator brand promise missing');
assert(countHtml(path.join(target,'public'))===168,'public HTML surface count mismatch');
for(const rel of ['server.js','public/pre103.css','public/index.html','public/navigator.html','public/es/index.html','public/es/navegador.html','public/professionals.html','public/professional-firm-operations.html','public/legal-workbench.html','lib/neutralResourceNavigatorPre103.js'])assert(fs.existsSync(path.join(target,rel)),`missing deploy-critical file: ${rel}`);
for(const rel of ['server.js','lib/neutralResourceNavigatorPre103.js','public/home.js','public/navigator.js','public/es/inicio.js'])cp.execFileSync(process.execPath,['--check',path.join(target,rel)],{stdio:'inherit'});
if(process.env.PRE103_BOOTSTRAP_SKIP_TARGET_NPM_CI!=='1'){
 const npm=process.platform==='win32'?'npm.cmd':'npm';cp.execFileSync(npm,['--prefix',target,'ci','--omit=dev','--no-audit','--no-fund','--ignore-scripts'],{stdio:'inherit',env:{...process.env,NPM_CONFIG_AUDIT:'false',NPM_CONFIG_FUND:'false'}});
}
const marker={schemaVersion:'smarter-justice.pre103.render-bootstrap.v1',release:'v2.0.0-pre103',carrier:path.basename(archive),carrierSha256:digest,carrierBytes:stat.size,rogerRuleRecords:seal.ROGER_RULE_RECORDS,activeRogerRequirements:seal.ACTIVE_ROGER_REQUIREMENTS,brandPromise:BRAND,factoryVersion:factory.producer.version,factoryCounts:factory.counts,htmlSurfaces:168,qualification:{releaseAssertions:summary.qualification.releaseAssertions,sameOriginReferences:summary.qualification.sameOriginReferences,runtimeChecks:summary.qualification.runtimeChecks,chromiumWidthChecks:summary.qualification.chromiumWidthChecks,highConfidenceSecretFindings:summary.qualification.highConfidenceSecretFindings},preparedAt:new Date().toISOString()};
fs.writeFileSync(path.join(target,'.pre103-render-bootstrap.json'),JSON.stringify(marker,null,2)+'\n');
console.log(`[PRE103 DEPLOY] verified ${marker.release}; Factory=${marker.factoryCounts.total}; rules=${marker.rogerRuleRecords}/${marker.activeRogerRequirements}; pages=${marker.htmlSurfaces}; carrier=${digest}`);
