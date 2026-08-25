'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const wrapper = path.join(root, 'SMARTER_JUSTICE__ONE_FILE_GITHUB_UPLOAD__PRE117.zip');
const runtimeName = 'SMARTER_JUSTICE__PRE117_DEPLOY_RUNTIME.tgz';
const extracted = path.join(root, '.runtime', runtimeName);
const target = path.join(root, '.runtime', 'pre120-live');
const overlayRoot = path.join(root, 'deployment', 'pre120', 'overlay');
const overlay = {
  'package.json': 'c4ef8af3034ea7df9e6b1ccd353e6e7d332bb0880673551a28b345363894645a',
  'package-lock.json': 'e2015a1ff3651ef315c1db763fd863d8b962f9fefc7a675a011ffcb89501d977',
  'server.js': '4e8c9351689d579f6f353211cb99bab48bdcf8fada1fed1f051826b2a5c4c263',
  'lib/immigrationMigrationPre120.js': '9258a08aa48dfe05a83cd0960b1a729779617afc1672d3f25e411aa9c1cb05cd',
  'lib/formEnginePre120.js': '6378720080f46939b001961a9a8d1cb8a73b42e542170fa6d6db837bd1745ce9',
  'public/immigration.html': '2bb700437a06ca0cf9de5bd931040bb1e9d3ca639e6e54cfb8b91771bfddc44b',
  'public/forms-center.html': 'e404c215ccbc86e51405e6e62c8c120dc693bc0f4f637f973b35e07f87fa50a3',
  'public/pre112-forms.js': 'b4bba8075e5ae5f404df4eff201e0c82db697cb571d21b92be04a9398547e73a',
  'public/pre120-immigration.css': 'e27790d4b0fd9955f2829ff0c995444d128f9a14a34195d6a7d76b98aab745f4',
  'public/pre120-immigration.js': '92dedcb14b1669debdf588ba1a4e1e6ceb66506a4fa7b1c86f31c77e56f535ac'
};
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fail = message => { console.error(`[PRE120 DEPLOY] ${message}`); process.exit(1); };
const ok = (value, message) => { if (!value) fail(message); };

ok(fs.existsSync(wrapper), 'PRE117 carrier missing');
ok(fs.statSync(wrapper).size === 14153144, 'carrier size mismatch');
ok(sha(wrapper) === '6e66a8580f075f47c9f029119ac0df04e337a7bd0cead639081bc99ca631872e', 'carrier hash mismatch');

fs.mkdirSync(path.dirname(extracted), { recursive: true });
const extractZip = `import pathlib,sys,zipfile\nsrc=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);name=${JSON.stringify(runtimeName)}\nwith zipfile.ZipFile(src) as z:\n assert z.namelist()==[name]\n out.write_bytes(z.read(name))`;
const result = cp.spawnSync(process.env.PYTHON_BIN || 'python3', ['-c', extractZip, wrapper, extracted], { encoding: 'utf8' });
if (result.status !== 0) fail(result.stderr || result.stdout);
ok(fs.statSync(extracted).size === 14152962, 'runtime size mismatch');
ok(sha(extracted) === '2f1af991887ba4963ef0570ae3da913bdbe34972be5f3fae4164515bc16a20f8', 'runtime hash mismatch');

const names = cp.execFileSync('tar', ['-tzf', extracted], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
for (const raw of names.split(/\r?\n/)) {
  const name = raw.trim().replace(/^\.\//, '');
  if (!name) continue;
  ok(!path.posix.isAbsolute(name) && !name.split('/').includes('..'), `unsafe path ${name}`);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
cp.execFileSync('tar', ['-xzf', extracted, '-C', target], { stdio: 'inherit' });
let count = 0;
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(item);
    else if (entry.isFile()) count += 1;
  }
};
walk(target);
ok(count === 4418, `base runtime count mismatch ${count}`);
const baseReceipt = JSON.parse(fs.readFileSync(path.join(target, 'coordination/pre117/FINAL_QUALIFICATION_RECEIPT.json'), 'utf8'));
ok(baseReceipt.status === 'PASS_QUALIFIED_NONPRODUCTION' && baseReceipt.regressionChecks === 267 && baseReceipt.noLoss.missing === 0 && baseReceipt.noLoss.unauthorizedChanged === 0, 'base qualification mismatch');

for (const [relative, expectedHash] of Object.entries(overlay)) {
  const source = path.join(overlayRoot, relative);
  const destination = path.join(target, relative);
  ok(fs.existsSync(source), `overlay missing ${relative}`);
  ok(sha(source) === expectedHash, `overlay hash mismatch ${relative}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  ok(sha(destination) === expectedHash, `copied overlay mismatch ${relative}`);
}

count = 0;
walk(target);
ok(count === 4422, `PRE120 runtime count mismatch ${count}`);
const packageJson = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
ok(packageJson.version === '2.0.0-pre120', 'package version mismatch');
const probe = `const m=require(${JSON.stringify(path.join(target, 'lib/immigrationMigrationPre120.js'))});const f=require(${JSON.stringify(path.join(target, 'lib/formEnginePre120.js'))});const s=m.sourceStatus(),x=f.summary();if(s.productAuthority!=='SMARTER_JUSTICE_ONLY'||s.navigatorOrCommunityAuthorityImported!==false||s.preservedDonorEvidence.catalogEntries!==112||s.preservedDonorEvidence.formWorkflows!==113||s.preservedDonorEvidence.deployedRuntimeVendorFiles!==7||x.version!=='PRE120'||x.verifiedGeneration.length!==12)process.exit(1);`;
const probeResult = cp.spawnSync(process.execPath, ['-e', probe], { cwd: target, encoding: 'utf8' });
if (probeResult.status !== 0) fail(probeResult.stderr || probeResult.stdout || 'runtime semantic probe failed');

const marker = {
  schemaVersion: 'smarter-justice.pre120.render-bootstrap.overlay.v1',
  release: 'v2.0.0-pre120',
  baseRelease: 'v2.0.0-pre117',
  recoveryPredecessor: 'v2.0.0-pre118',
  deploymentStrategy: 'EXACT_PRE117_CARRIER_PLUS_HASH_PINNED_PRE120_TEXT_OVERLAY',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  navigatorOrCommunityMutation: false,
  overlayPaths: Object.keys(overlay),
  runtimeFiles: count,
  catalogEntries: 112,
  formWorkflows: 113,
  controlledGenerationLanes: 12,
  productionDeploymentAuthorized: true,
  consequentialLiveEffectsRemainProductGated: true,
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, '.pre120-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');
console.log('[PRE120 DEPLOY] exact qualified PRE120 overlay runtime prepared');
