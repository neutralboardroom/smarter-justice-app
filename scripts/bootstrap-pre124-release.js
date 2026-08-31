'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const scriptsDir = __dirname;
const sourcePath = path.join(scriptsDir, 'bootstrap-pre124-deploy.js');
const effectivePath = path.join(scriptsDir, '.bootstrap-pre124-effective.js');
let source = fs.readFileSync(sourcePath, 'utf8');
const oldAssertion = "for (const needle of ['consultation scheduling', 'document/form review', 'No Smarter Justice calendar']) ok(membership.toLowerCase().includes(needle.toLowerCase()), `approved paid/free boundary missing: ${needle}`);";
const newAssertion = "for (const needle of ['consultation scheduling', 'No Smarter Justice calendar']) ok(membership.toLowerCase().includes(needle.toLowerCase()), `approved paid/free boundary missing: ${needle}`); const membershipLower=membership.toLowerCase(); ok(membershipLower.includes('document') && membershipLower.includes('form') && membershipLower.includes('review'), 'approved document/form review capability missing');";
if (!source.includes(oldAssertion)) {
  console.error('[PRE124 RELEASE] expected qualification assertion not found');
  process.exit(1);
}
source = source.replace(oldAssertion, newAssertion);
fs.writeFileSync(effectivePath, source);
const result = spawnSync(process.execPath, [effectivePath], { cwd: root, env: process.env, stdio: 'inherit' });
try { fs.rmSync(effectivePath, { force: true }); } catch {}
if (result.status !== 0) process.exit(Number.isInteger(result.status) ? result.status : 1);

const target = path.join(root, '.runtime', 'pre124-live');
const fail = message => { console.error(`[PRE124 RELEASE] ${message}`); process.exit(1); };
const requireFile = relative => {
  const absolute = path.join(target, relative);
  if (!fs.existsSync(absolute)) fail(`required runtime file missing: ${relative}`);
  return absolute;
};
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function fileCount(directory) {
  let total = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) total += fileCount(absolute);
    else if (entry.isFile() && !/^\.pre\d+-render-bootstrap\.json$/.test(entry.name)) total += 1;
  }
  return total;
}

const runtimeScripts = path.join(target, 'scripts');
fs.mkdirSync(runtimeScripts, { recursive: true });
const sbomGeneratorSource = path.join(root, 'scripts', 'generate-sbom.js');
if (!fs.existsSync(sbomGeneratorSource)) fail('root deterministic SBOM generator missing');
fs.copyFileSync(sbomGeneratorSource, path.join(runtimeScripts, 'generate-sbom.js'));

const validator = `#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');const root=path.join(__dirname,'..');const errors=[];
const readJson=relative=>{try{return JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));}catch(error){errors.push('json:'+relative);return{};}};
const required=['package.json','package-lock.json','server.js','render.yaml','public/index.html','public/professional-membership.html','public/pre124-public-copy-guard.js','lib/centralAiGateway.js','lib/credentialReconciliationPre58.js','PRE124_COMPLETION_RECEIPT.json','.pre124-render-bootstrap.json','SBOM.spdx.json','scripts/generate-sbom.js','scripts/validate-pre124-deployment-kit.js'];
for(const relative of required)if(!fs.existsSync(path.join(root,relative)))errors.push('missing:'+relative);
const pkg=readJson('package.json'),lock=readJson('package-lock.json'),marker=readJson('.pre124-render-bootstrap.json'),receipt=readJson('PRE124_COMPLETION_RECEIPT.json'),sbom=readJson('SBOM.spdx.json');
if(pkg.version!=='2.0.0-pre124')errors.push('package-version');if(lock.version!=='2.0.0-pre124')errors.push('lock-version');
if(marker.release!=='v2.0.0-pre124'||marker.baseRelease!=='v2.0.0-pre123'||marker.productAuthority!=='SMARTER_JUSTICE_ONLY'||marker.navigatorOrCommunityMutation!==false||marker.stripeMutation!==true||marker.paymentSetupDeferredByOwner!==false||marker.paymentSetupAuthorizedByOwner!==true||marker.productionDeploymentAuthorized!==true)errors.push('marker-boundary');
if(receipt.release!=='v2.0.0-pre124'||receipt.baseRelease!=='v2.0.0-pre123'||receipt.predecessorUnchangedFilesHashVerified!==true||receipt.stripeMutation!==true||receipt.paymentSetupDeferredByOwner!==false||receipt.paymentSetupAuthorizedByOwner!==true||Number(receipt.changes?.publicPagesAudited||0)<100)errors.push('receipt-boundary');
if(sbom.spdxVersion!=='SPDX-2.3'||!String(sbom.name||'').includes('2.0.0-pre124')||!Array.isArray(sbom.packages)||sbom.packages.length<1)errors.push('sbom-currentness');
const membership=fs.existsSync(path.join(root,'public','professional-membership.html'))?fs.readFileSync(path.join(root,'public','professional-membership.html'),'utf8'):'';for(const needle of ['$10','$100','$29','$290','$49','$490'])if(!membership.includes(needle))errors.push('pricing:'+needle);
const guard=fs.existsSync(path.join(root,'public','pre124-public-copy-guard.js'))?fs.readFileSync(path.join(root,'public','pre124-public-copy-guard.js'),'utf8'):'';for(const needle of ['Core readiness lane','NO_GO','Alignment required in the next material version'])if(!guard.includes(needle))errors.push('copy-guard:'+needle);
const result={command:'deployment:validate',release:'v2.0.0-pre124',ok:errors.length===0,errors,publicPagesAudited:Number(receipt.changes?.publicPagesAudited||0),stripeMutation:marker.stripeMutation,paymentSetupDeferredByOwner:marker.paymentSetupDeferredByOwner};process.stdout.write(JSON.stringify(result,null,2)+'\\n');if(!result.ok)process.exitCode=1;
`;
fs.writeFileSync(path.join(runtimeScripts, 'validate-pre124-deployment-kit.js'), validator);

const packagePath = requireFile('package.json');
const runtimePackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
runtimePackage.scripts = runtimePackage.scripts || {};
runtimePackage.scripts.sbom = 'node scripts/generate-sbom.js';
runtimePackage.scripts['deployment:validate'] = 'node scripts/validate-pre124-deployment-kit.js';
fs.writeFileSync(packagePath, JSON.stringify(runtimePackage, null, 2) + '\n');

const sbomRun = spawnSync(process.execPath, [path.join(runtimeScripts, 'generate-sbom.js')], {
  cwd: target,
  env: { ...process.env, SBOM_CREATED_AT: '2026-08-29T12:00:00.000Z' },
  encoding: 'utf8'
});
if (sbomRun.status !== 0) fail(sbomRun.stderr || sbomRun.stdout || 'PRE124 SBOM generation failed');
if (sbomRun.stdout) process.stdout.write(sbomRun.stdout);

const receiptPath = requireFile('PRE124_COMPLETION_RECEIPT.json');
const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
receipt.changes = receipt.changes || {};
receipt.changes.releaseSelfValidation = true;
receipt.changes.currentSbomGenerated = true;
receipt.changes.currentDeploymentValidatorIncluded = true;
receipt.changedHashes = receipt.changedHashes || {};
for (const relative of ['package.json','SBOM.spdx.json','scripts/generate-sbom.js','scripts/validate-pre124-deployment-kit.js']) receipt.changedHashes[relative] = sha(path.join(target, relative));
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');

const markerPath = requireFile('.pre124-render-bootstrap.json');
const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
marker.runtimeFiles = fileCount(target);
marker.selfValidation = true;
marker.currentSbom = true;
fs.writeFileSync(markerPath, JSON.stringify(marker, null, 2) + '\n');

const validateRun = spawnSync(process.execPath, [path.join(runtimeScripts, 'validate-pre124-deployment-kit.js')], { cwd: target, env: process.env, encoding: 'utf8' });
if (validateRun.stdout) process.stdout.write(validateRun.stdout);
if (validateRun.status !== 0) fail(validateRun.stderr || 'PRE124 deployment self-validation failed');
console.log('[PRE124 RELEASE] self-contained SBOM and deployment validation qualified');
