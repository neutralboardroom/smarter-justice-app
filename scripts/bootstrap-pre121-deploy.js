'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const wrapper = path.join(root, 'SMARTER_JUSTICE__ONE_FILE_GITHUB_UPLOAD__PRE117.zip');
const runtimeName = 'SMARTER_JUSTICE__PRE117_DEPLOY_RUNTIME.tgz';
const extracted = path.join(root, '.runtime', runtimeName);
const target = path.join(root, '.runtime', 'pre121-live');
const overlayRoot = path.join(root, 'deployment', 'pre120', 'overlay');
const pre121Overlay = path.join(root, 'SMARTER_JUSTICE__PRE121_RUNTIME_OVERLAY.zip');
const pre121OverlaySize = 614367;
const pre121OverlaySha256 = 'b37300f26b969285a4f061d2cb78840b89496e8aa14a86aa2eb588c087cb2fd7';
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

ok(fs.existsSync(pre121Overlay), 'PRE121 runtime overlay missing');
ok(fs.statSync(pre121Overlay).size === pre121OverlaySize, 'PRE121 runtime overlay size mismatch');
ok(sha(pre121Overlay) === pre121OverlaySha256, 'PRE121 runtime overlay hash mismatch');
const extractPre121 = `import pathlib,sys,zipfile\nsrc=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2])\nwith zipfile.ZipFile(src) as z:\n names=z.namelist()\n assert len(names)==190 and len(set(names))==190\n assert 'public/index.html' in names and 'public/pre118-home.css' in names and 'public/pre121-site.css' in names and 'public/pre121-site.js' in names\n for name in names:\n  p=pathlib.PurePosixPath(name)\n  assert not p.is_absolute() and '..' not in p.parts\n z.extractall(out)`;
const pre121Result = cp.spawnSync(process.env.PYTHON_BIN || 'python3', ['-c', extractPre121, pre121Overlay, target], { encoding: 'utf8' });
if (pre121Result.status !== 0) fail(pre121Result.stderr || pre121Result.stdout || 'PRE121 overlay extraction failed');
count = 0;
walk(target);
ok(count === 4425, `PRE121 runtime count mismatch ${count}`);
const pre121Package = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
ok(pre121Package.version === '2.0.0-pre121', 'PRE121 package version mismatch');
ok(sha(path.join(target, 'public/index.html')) === '1d830095cc96f0169218b01f52c14b4074c0e01dbd26dd8d23f1dda4dd3780a6', 'PRE121 homepage mismatch');
ok(sha(path.join(target, 'public/pre118-home.css')) === '4e2a7b25473ea8e13d6a371936a98e58cd193b93d322d7576cd2b15cca64749b', 'PRE118 homepage style missing');
ok(sha(path.join(target, 'public/pre121-site.css')) === '3cee92e0bd35e0da859bdaf3a6839bd4f4d7133c38fd812c418f96cadfa3fe51', 'PRE121 site style mismatch');
const pre121Probe = `const m=require(${JSON.stringify(path.join(target, 'lib/immigrationMigrationPre120.js'))});const f=require(${JSON.stringify(path.join(target, 'lib/formEnginePre120.js'))});const p=require(${JSON.stringify(path.join(target, 'package.json'))});const s=m.sourceStatus(),x=f.summary();if(p.version!=='2.0.0-pre121'||s.productAuthority!=='SMARTER_JUSTICE_ONLY'||s.navigatorOrCommunityAuthorityImported!==false||s.preservedDonorEvidence.catalogEntries!==112||s.preservedDonorEvidence.formWorkflows!==113||x.version!=='PRE120'||x.verifiedGeneration.length!==12)process.exit(1);`;
const pre121ProbeResult = cp.spawnSync(process.execPath, ['-e', pre121Probe], { cwd: target, encoding: 'utf8' });
if (pre121ProbeResult.status !== 0) fail(pre121ProbeResult.stderr || pre121ProbeResult.stdout || 'PRE121 semantic probe failed');

const marker = {
  schemaVersion: 'smarter-justice.pre121.render-bootstrap.overlay.v1',
  release: 'v2.0.0-pre121',
  baseRelease: 'v2.0.0-pre120',
  recoveryPredecessor: 'v2.0.0-pre120',
  deploymentStrategy: 'EXACT_PRE117_CARRIER_PLUS_HASH_PINNED_PRE120_MIGRATION_PLUS_HASH_PINNED_COMPLETE_PRE121_RUNTIME_OVERLAY',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  navigatorOrCommunityMutation: false,
  pre120OverlayPaths: Object.keys(overlay),
  pre121OverlaySha256,
  pre121OverlaySize,
  pre121OverlayMembers: 190,
  acceptedHomepageFiles: ['public/index.html','public/pre118-home.css'],
  runtimeFiles: count,
  catalogEntries: 112,
  formWorkflows: 113,
  controlledGenerationLanes: 12,
  productionDeploymentAuthorized: true,
  consequentialLiveEffectsRemainProductGated: true,
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, '.pre121-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');
console.log('[PRE121 DEPLOY] exact qualified PRE121 no-loss overlay runtime prepared');
