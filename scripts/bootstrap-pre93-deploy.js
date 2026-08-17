'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const root=path.resolve(__dirname,'..');
const archive=path.join(root,'PRE93_D1_DEPLOY_RUNTIME.tgz');
const target=path.join(root,'.runtime','pre93-live');
const expectedSha256='62597eaa30f484bcafb8de73553d2cf5225c7eb06514c4ca39f3a3b4d151ce5b';
const expectedBytes=12947259;
function fail(message){console.error(`[PRE93-D1 DEPLOY] ${message}`);process.exit(1)}
function assert(ok,message){if(!ok)fail(message)}
function readJson(rel){const p=path.join(target,rel);assert(fs.existsSync(p),`missing required file: ${rel}`);return JSON.parse(fs.readFileSync(p,'utf8'))}
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
assert(fs.existsSync(archive),'deployment carrier PRE93_D1_DEPLOY_RUNTIME.tgz is missing');
const stat=fs.statSync(archive);assert(stat.size===expectedBytes,`carrier size mismatch: ${stat.size} != ${expectedBytes}`);
const digest=sha(archive);assert(digest===expectedSha256,`carrier SHA-256 mismatch: ${digest}`);
const members=cp.execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:32*1024*1024});
for(const raw of members.split(/\r?\n/)){const name=raw.trim();if(!name)continue;const normalized=name.replace(/^\.\//,'');assert(!path.posix.isAbsolute(normalized),`unsafe absolute archive member: ${name}`);assert(!normalized.split('/').includes('..'),`unsafe parent traversal archive member: ${name}`)}
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});cp.execFileSync('tar',['-xzf',archive,'-C',target],{stdio:'inherit'});
const pkg=readJson('package.json');assert(pkg.name==='smarter-justice-v1',`unexpected runtime package: ${pkg.name}`);assert(pkg.version==='2.0.0-pre93',`unexpected runtime version: ${pkg.version}`);
const seal=readJson('governance/current/PRE_SEAL_RULE_LOCK_RECEIPT.json');assert(seal.PRODUCT==='SMARTER JUSTICE','product identity mismatch');assert(seal.PRODUCT_SCOPE==='SMARTER JUSTICE ONLY','product scope mismatch');assert(seal.PRE_BUILD_RULE_LOCK==='PASS','pre-build lock is not PASS');assert(seal.PRE_SEAL_RULE_LOCK==='PASS','pre-seal lock is not PASS');assert(Number(seal.MISSING_ROGER_RULES)===0,'missing Roger Rules is nonzero');assert(Number(seal.UNAUTHORIZED_ROGER_RULE_CHANGES)===0,'unauthorized Roger Rule changes is nonzero');assert(seal.NATIONAL_OWNER_RULE==='SJ-RGR-PRE92-NATIONAL-USA-SCOPE','national USA Roger Rule is missing');
const state=readJson('governance/current/CURRENT_RULE_STATE.json');assert(state.builderVersion==='PRE93',`unexpected builder version: ${state.builderVersion}`);assert(state.productVersion==='v2.0.0-pre93',`unexpected product version: ${state.productVersion}`);assert(state.preSealRuleLock==='PASS','current rule state pre-seal lock is not PASS');
const factory=readJson('data/profile-factory/manifest.json');assert(factory.producer?.version==='0.27.0',`unexpected Factory version: ${factory.producer?.version}`);assert(factory.counts?.professionals===12082,'Factory professional count mismatch');assert(factory.counts?.firms===496,'Factory firm count mismatch');assert(factory.counts?.total===12578,'Factory total mismatch');assert(factory.boundary?.factoryReadOnly===true,'Factory read-only boundary missing');assert(factory.boundary?.staleFactoryMayOverwriteNewerJusticeCorrection===false,'Factory overwrite boundary failed');
const amendment=readJson('deployment/pre93/PRE93_D1_DEPLOYMENT_AMENDMENT_RECEIPT.json');assert(amendment.release==='v2.0.0-pre93','deployment amendment release mismatch');assert(amendment.nationalRogerRulePreserved===true,'national Roger Rule amendment assertion missing');assert(amendment.search?.everyFieldOptional===true,'optional-field search amendment missing');assert(amendment.search?.paidOrganicBoost===false,'organic ranking boundary failed');
for(const row of amendment.changedFiles||[]){const file=path.join(target,row.path);assert(fs.existsSync(file),`amendment file missing: ${row.path}`);assert(fs.statSync(file).size===row.bytes,`amendment file size mismatch: ${row.path}`);assert(sha(file)===row.sha256,`amendment file hash mismatch: ${row.path}`)}
const npm=process.platform==='win32'?'npm.cmd':'npm';cp.execFileSync(npm,['--prefix',target,'ci','--omit=dev','--no-audit','--no-fund','--ignore-scripts'],{stdio:'inherit',env:{...process.env,NPM_CONFIG_AUDIT:'false',NPM_CONFIG_FUND:'false'}});
const marker={schemaVersion:'smarter-justice.pre93-d1.render-bootstrap.v1',release:'v2.0.0-pre93',amendment:amendment.amendment,carrier:path.basename(archive),carrierSha256:digest,carrierBytes:stat.size,factoryVersion:factory.producer.version,factoryCounts:factory.counts,nationalOwnerRule:seal.NATIONAL_OWNER_RULE,preSealRuleLock:seal.PRE_SEAL_RULE_LOCK,preparedAt:new Date().toISOString()};
fs.writeFileSync(path.join(target,'.pre93-d1-render-bootstrap.json'),JSON.stringify(marker,null,2)+'\n');
console.log(`[PRE93-D1 DEPLOY] verified ${marker.release} ${marker.amendment}; Factory=${marker.factoryCounts.total}; carrier=${digest}`);
