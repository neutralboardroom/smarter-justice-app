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

const install = run('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], {
  cwd: applicationRoot,
  env: {
    ...process.env,
    NPM_CONFIG_AUDIT: 'false',
    NPM_CONFIG_FUND: 'false'
  }
});
if (!install.ok) fail(`locked application dependency installation failed with status ${install.status ?? 'unknown'}`);

console.log(`[exact-release-bootstrap] prepared Smarter Justice v${applicationPackage.version}`);
console.log(`[exact-release-bootstrap] sealed source SHA-256 ${digest}`);
