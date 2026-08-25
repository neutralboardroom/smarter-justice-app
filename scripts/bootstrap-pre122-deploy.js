'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const base = path.join(root, '.runtime', 'pre121-live');
const target = path.join(root, '.runtime', 'pre122-live');
const overlay = path.join(root, '.runtime', 'SMARTER_JUSTICE__PRE122_RUNTIME_OVERLAY.zip');
const manifestPath = path.join(root, 'SMARTER_JUSTICE__PRE122_DEPLOY_OVERLAY_MANIFEST.json');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fail = message => { console.error(`[PRE122 DEPLOY] ${message}`); process.exit(1); };
const ok = (value, message) => { if (!value) fail(message); };
const countProductFiles = directory => {
  let count = 0;
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const item = path.join(current, entry.name);
      if (entry.isDirectory()) walk(item);
      else if (entry.isFile() && !/^\.pre\d+-render-bootstrap\.json$/.test(entry.name)) count += 1;
    }
  };
  walk(directory);
  return count;
};

const predecessorBootstrap = path.join(root, 'scripts', 'bootstrap-pre121-deploy.js');
ok(fs.existsSync(predecessorBootstrap), 'PRE121 bootstrap missing');
const predecessor = cp.spawnSync(process.execPath, [predecessorBootstrap], { cwd: root, env: process.env, encoding: 'utf8' });
if (predecessor.status !== 0) fail(predecessor.stderr || predecessor.stdout || 'PRE121 bootstrap failed');
ok(fs.existsSync(path.join(base, '.pre121-render-bootstrap.json')), 'PRE121 marker missing');
const baseMarker = JSON.parse(fs.readFileSync(path.join(base, '.pre121-render-bootstrap.json'), 'utf8'));
ok(baseMarker.release === 'v2.0.0-pre121' && baseMarker.productAuthority === 'SMARTER_JUSTICE_ONLY' && baseMarker.navigatorOrCommunityMutation === false, 'PRE121 marker mismatch');

ok(fs.existsSync(manifestPath), 'PRE122 manifest missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
ok(manifest.release === 'v2.0.0-pre122' && manifest.baseRuntime.startsWith('v2.0.0-pre121'), 'PRE122 manifest authority mismatch');
ok(manifest.productAuthority === 'SMARTER_JUSTICE_ONLY' && manifest.navigatorOrCommunityMutation === false, 'product boundary mismatch');
fs.mkdirSync(path.dirname(overlay), { recursive: true });
ok(Array.isArray(manifest.archive.base64Parts) && manifest.archive.base64Parts.length > 0, 'PRE122 overlay parts missing');
const encoded = manifest.archive.base64Parts.map(name => {
  const part = path.join(root, name);
  ok(fs.existsSync(part), `PRE122 overlay part missing ${name}`);
  return fs.readFileSync(part, 'utf8');
}).join('');
fs.writeFileSync(overlay, Buffer.from(encoded, 'base64'));
ok(fs.statSync(overlay).size === manifest.archive.sizeBytes && sha(overlay) === manifest.archive.sha256, 'PRE122 overlay mismatch');

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(base, target, { recursive: true });
const baseCount = countProductFiles(base);
const extract = `import json,pathlib,sys,zipfile\nsrc=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);manifest=json.loads(pathlib.Path(sys.argv[3]).read_text())\nwith zipfile.ZipFile(src) as z:\n names=z.namelist(); expected=manifest['overlayPaths']\n assert names==expected and len(names)==manifest['overlayMembers'] and len(set(names))==len(names)\n for name in names:\n  p=pathlib.PurePosixPath(name); assert not p.is_absolute() and '..' not in p.parts\n z.extractall(out)`;
const extraction = cp.spawnSync(process.env.PYTHON_BIN || 'python3', ['-c', extract, overlay, target, manifestPath], { encoding: 'utf8' });
if (extraction.status !== 0) fail(extraction.stderr || extraction.stdout || 'PRE122 overlay extraction failed');
for (const [relative, expected] of Object.entries(manifest.overlayMemberSha256)) {
  const deployed = path.join(target, relative);
  ok(fs.existsSync(deployed) && sha(deployed) === expected, `runtime hash mismatch ${relative}`);
}
ok(countProductFiles(target) === baseCount + manifest.additiveRuntimePaths.length, 'PRE122 runtime file count mismatch');
const packageJson = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
ok(packageJson.version === '2.0.0-pre122', 'PRE122 package version mismatch');
const approved = 'Focused legal starting help, practical tools, and independent professional search in one connected platform.';
ok(fs.readFileSync(path.join(target, 'public', 'module.html'), 'utf8').includes(approved), 'approved positioning line missing');
ok(fs.readFileSync(path.join(target, 'public', 'module.html'), 'utf8').includes('Car and vehicle accidents'), 'vehicle-accident coverage missing');
for (const [relative, expected] of Object.entries(manifest.immigrationCoreSha256)) {
  ok(sha(path.join(target, relative)) === expected, `Immigration Oasis core mismatch ${relative}`);
}

const marker = {
  schemaVersion: 'smarter-justice.pre122.render-bootstrap.overlay.v1',
  release: 'v2.0.0-pre122',
  baseRelease: 'v2.0.0-pre121',
  deploymentStrategy: 'EXACT_PRE121_DEPLOYED_RUNTIME_PLUS_HASH_PINNED_PRE122_RUNTIME_OVERLAY',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  navigatorOrCommunityMutation: false,
  overlaySha256: manifest.archive.sha256,
  overlaySize: manifest.archive.sizeBytes,
  overlayMembers: manifest.overlayMembers,
  runtimeFiles: countProductFiles(target),
  productionDeploymentAuthorized: true,
  preparedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(target, '.pre122-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');
console.log('[PRE122 DEPLOY] exact qualified PRE122 no-loss overlay runtime prepared');
