'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const base = path.join(root, '.runtime', 'pre122-live');
const target = path.join(root, '.runtime', 'pre123-live');
const overlay = path.join(root, '.runtime', 'SMARTER_JUSTICE__PRE123_RUNTIME_OVERLAY.zip');
const manifestPath = path.join(root, 'SMARTER_JUSTICE__PRE123_DEPLOY_OVERLAY_MANIFEST.json');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fail = message => { console.error(`[PRE123 DEPLOY] ${message}`); process.exit(1); };
const ok = (value, message) => { if (!value) fail(message); };

const productFiles = directory => {
  const rows = [];
  const walk = (current, prefix = '') => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const item = path.join(current, entry.name);
      if (entry.isDirectory()) walk(item, relative);
      else if (entry.isFile() && !/^\.pre\d+-render-bootstrap\.json$/.test(entry.name)) rows.push(relative);
    }
  };
  walk(directory);
  return rows;
};

const predecessorBootstrap = path.join(root, 'scripts', 'bootstrap-pre122-deploy.js');
ok(fs.existsSync(predecessorBootstrap), 'PRE122 bootstrap missing');
const predecessor = cp.spawnSync(process.execPath, [predecessorBootstrap], { cwd: root, env: process.env, encoding: 'utf8' });
if (predecessor.status !== 0) fail(predecessor.stderr || predecessor.stdout || 'PRE122 bootstrap failed');
ok(fs.existsSync(path.join(base, '.pre122-render-bootstrap.json')), 'PRE122 marker missing');
const baseMarker = JSON.parse(fs.readFileSync(path.join(base, '.pre122-render-bootstrap.json'), 'utf8'));
ok(baseMarker.release === 'v2.0.0-pre122' && baseMarker.productAuthority === 'SMARTER_JUSTICE_ONLY' && baseMarker.navigatorOrCommunityMutation === false, 'PRE122 marker mismatch');

ok(fs.existsSync(manifestPath), 'PRE123 manifest missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
ok(manifest.release === 'v2.0.0-pre123' && manifest.baseRuntime === 'v2.0.0-pre122', 'PRE123 manifest authority mismatch');
ok(manifest.productAuthority === 'SMARTER_JUSTICE_ONLY' && manifest.navigatorOrCommunityMutation === false, 'product boundary mismatch');
for (const [relative, expected] of Object.entries(manifest.predecessorMemberSha256)) {
  const source = path.join(base, relative);
  ok(fs.existsSync(source) && sha(source) === expected, `PRE122 predecessor mismatch ${relative}`);
}

fs.mkdirSync(path.dirname(overlay), { recursive: true });
ok(Array.isArray(manifest.archive.base64Parts) && manifest.archive.base64Parts.length > 0, 'PRE123 overlay parts missing');
const encoded = manifest.archive.base64Parts.map(name => {
  const part = path.join(root, name);
  ok(fs.existsSync(part), `PRE123 overlay part missing ${name}`);
  return fs.readFileSync(part, 'utf8');
}).join('');
fs.writeFileSync(overlay, Buffer.from(encoded, 'base64'));
ok(fs.statSync(overlay).size === manifest.archive.sizeBytes && sha(overlay) === manifest.archive.sha256, 'PRE123 overlay mismatch');

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(base, target, { recursive: true });
const baseFiles = productFiles(base);
const overlaySet = new Set(manifest.overlayPaths);
const extract = `import json,pathlib,sys,zipfile\nsrc=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);manifest=json.loads(pathlib.Path(sys.argv[3]).read_text())\nwith zipfile.ZipFile(src) as z:\n names=z.namelist(); expected=manifest['overlayPaths']\n assert names==expected and len(names)==manifest['overlayMembers'] and len(set(names))==len(names)\n for name in names:\n  p=pathlib.PurePosixPath(name); assert not p.is_absolute() and '..' not in p.parts\n z.extractall(out)`;
const extraction = cp.spawnSync(process.env.PYTHON_BIN || 'python3', ['-c', extract, overlay, target, manifestPath], { encoding: 'utf8' });
if (extraction.status !== 0) fail(extraction.stderr || extraction.stdout || 'PRE123 overlay extraction failed');
for (const [relative, expected] of Object.entries(manifest.overlayMemberSha256)) {
  const deployed = path.join(target, relative);
  ok(fs.existsSync(deployed) && sha(deployed) === expected, `runtime hash mismatch ${relative}`);
}
for (const relative of baseFiles) {
  if (overlaySet.has(relative)) continue;
  ok(sha(path.join(base, relative)) === sha(path.join(target, relative)), `unchanged predecessor file mutated ${relative}`);
}
ok(productFiles(target).length === baseFiles.length + manifest.additiveRuntimePaths.length, 'PRE123 runtime file count mismatch');
const packageJson = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
ok(packageJson.version === '2.0.0-pre123', 'PRE123 package version mismatch');
const approved = manifest.preservationAssertions.approvedPositioning;
for (const relative of ['public/index.html', 'public/module.html', 'public/attorney-partner-tour.html', 'public/find-my-profile.html']) {
  ok(fs.readFileSync(path.join(target, relative), 'utf8').includes(approved), `approved positioning missing ${relative}`);
}
ok(fs.readFileSync(path.join(target, 'data', 'practiceAreas.js'), 'utf8').includes(manifest.preservationAssertions.vehicleCoverageNeedle), 'vehicle-accident coverage missing');
const qualification = cp.spawnSync(process.execPath, [path.join(target, 'tests', 'pre123-polish.test.js')], { cwd: target, env: process.env, encoding: 'utf8' });
if (qualification.status !== 0) fail(qualification.stderr || qualification.stdout || 'PRE123 qualification failed');

const marker = {
  schemaVersion: 'smarter-justice.pre123.render-bootstrap.overlay.v1',
  release: 'v2.0.0-pre123',
  baseRelease: 'v2.0.0-pre122',
  deploymentStrategy: 'EXACT_PRE122_DEPLOYED_RUNTIME_PLUS_HASH_PINNED_PRE123_RUNTIME_OVERLAY',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  navigatorOrCommunityMutation: false,
  overlaySha256: manifest.archive.sha256,
  overlaySize: manifest.archive.sizeBytes,
  overlayMembers: manifest.overlayMembers,
  runtimeFiles: productFiles(target).length,
  productionDeploymentAuthorized: true,
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, '.pre123-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');
console.log('[PRE123 DEPLOY] exact qualified PRE123 no-loss overlay runtime prepared');
