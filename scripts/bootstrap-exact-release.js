'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..');
const archiveName = 'smarter-justice-v1.7.98-comprehensive-community-value.zip';
const archivePath = path.join(repositoryRoot, archiveName);
const expectedSha256 = '0611f1082bf30244d5ec08a97ccc0de538b3248f19362466389feeb5bc672260';
const expectedSize = 12891048;
const runtimeRoot = path.join(repositoryRoot, '.runtime');
const applicationRoot = path.join(runtimeRoot, 'smarter-justice-v1.7.98');
const polishPartPaths = [
  'homepage-polish.part1.jsfrag',
  'homepage-polish.part2.jsfrag',
  'homepage-polish.part3.jsfrag'
].map((name) => path.join(repositoryRoot, 'scripts', name));

function fail(message) {
  console.error(`[exact-release-bootstrap] ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: process.env,
    ...options
  });
  if (result.error) return { ok: false, error: result.error };
  return { ok: result.status === 0, status: result.status };
}

if (!fs.existsSync(archivePath)) fail(`missing ${archiveName}`);
const stat = fs.statSync(archivePath);
if (stat.size !== expectedSize) fail(`size mismatch: expected ${expectedSize}, received ${stat.size}`);

const digest = crypto.createHash('sha256').update(fs.readFileSync(archivePath)).digest('hex');
if (digest !== expectedSha256) fail(`SHA-256 mismatch: ${digest}`);

for (const partPath of polishPartPaths) {
  if (!fs.existsSync(partPath)) fail(`missing homepage polish overlay part ${path.basename(partPath)}`);
}

fs.rmSync(runtimeRoot, { recursive: true, force: true });
fs.mkdirSync(runtimeRoot, { recursive: true });

const pythonProgram = [
  'import os, pathlib, sys, zipfile',
  'archive=pathlib.Path(sys.argv[1])',
  'target=pathlib.Path(sys.argv[2]).resolve()',
  'with zipfile.ZipFile(archive) as z:',
  '  for info in z.infolist():',
  "    name=info.filename.replace('\\\\','/')",
  '    member=pathlib.PurePosixPath(name)',
  "    if member.is_absolute() or '..' in member.parts:",
  "      raise SystemExit(f'unsafe ZIP member: {name}')",
  '  z.extractall(target)'
].join('\n');

let extraction = run('python3', ['-c', pythonProgram, archivePath, runtimeRoot]);
if (!extraction.ok) {
  fs.rmSync(runtimeRoot, { recursive: true, force: true });
  fs.mkdirSync(runtimeRoot, { recursive: true });
  extraction = run('unzip', ['-q', archivePath, '-d', runtimeRoot]);
}
if (!extraction.ok) fail('neither the Python nor unzip extractor completed successfully');

const packagePath = path.join(applicationRoot, 'package.json');
const lockPath = path.join(applicationRoot, 'package-lock.json');
if (!fs.existsSync(packagePath) || !fs.existsSync(lockPath)) fail('expected v1.7.98 application root was not extracted');

const applicationPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (applicationPackage.version !== '1.7.98') {
  fail(`extracted package version is ${applicationPackage.version || 'missing'}, not 1.7.98`);
}

const combinedPolishPath = path.join(runtimeRoot, 'apply-homepage-polish.js');
const combinedPolish = polishPartPaths.map((partPath) => fs.readFileSync(partPath, 'utf8')).join('\n');
fs.writeFileSync(combinedPolishPath, combinedPolish, 'utf8');

const polish = run(process.execPath, [combinedPolishPath, applicationRoot]);
if (!polish.ok) fail(`homepage polish overlay failed with status ${polish.status ?? 'unknown'}`);

const syntaxCheck = run(process.execPath, ['--check', path.join(applicationRoot, 'public', 'home.js')]);
if (!syntaxCheck.ok) fail(`polished homepage JavaScript syntax check failed with status ${syntaxCheck.status ?? 'unknown'}`);

const install = run('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], {
  cwd: applicationRoot,
  env: {
    ...process.env,
    NPM_CONFIG_AUDIT: 'false',
    NPM_CONFIG_FUND: 'false'
  }
});
if (!install.ok) fail(`locked application dependency installation failed with status ${install.status ?? 'unknown'}`);

const inheritedTests = run('npm', ['test'], { cwd: applicationRoot });
if (!inheritedTests.ok) fail(`complete inherited qualification failed with status ${inheritedTests.status ?? 'unknown'}`);

const polishTest = run(process.execPath, [path.join(applicationRoot, 'tests', 'homepage-launch-polish-v1798.test.js')], {
  cwd: applicationRoot
});
if (!polishTest.ok) fail(`homepage polish acceptance failed with status ${polishTest.status ?? 'unknown'}`);

console.log(`[exact-release-bootstrap] prepared Smarter Justice v${applicationPackage.version} homepage launch polish 1`);
console.log(`[exact-release-bootstrap] sealed source SHA-256 ${digest}`);
console.log('[exact-release-bootstrap] complete inherited suite and homepage polish acceptance passed');
