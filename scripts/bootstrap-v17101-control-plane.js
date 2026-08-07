'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const baseArchiveName = 'smarter-justice-v1.7.98-comprehensive-community-value.zip';
const baseArchive = path.join(root, baseArchiveName);
const baseSha256 = '0611f1082bf30244d5ec08a97ccc0de538b3248f19362466389feeb5bc672260';
const baseSize = 12891048;
const targetVersion = '1.7.101';
const runtimeRoot = path.join(root, '.runtime');
const applicationRoot = path.join(runtimeRoot, `smarter-justice-v${targetVersion}`);
const deltaRoot = path.join(root, 'release-delta');

function fail(message) {
  console.error(`[v17101-control-plane-bootstrap] ${message}`);
  process.exit(1);
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    ...options
  });
  if (result.error) return { ok: false, error: result.error };
  return { ok: result.status === 0, status: result.status };
}

function isolatedTestEnvironment(storagePath) {
  const env = { ...process.env, NODE_ENV: 'test', SMARTER_JUSTICE_STORAGE_DIR: storagePath };
  const blockedExact = [
    'RENDER', 'RENDER_SERVICE_ID', 'RENDER_EXTERNAL_HOSTNAME', 'RENDER_DISK_MOUNT_PATH',
    'DATABASE_URL', 'REDIS_URL', 'PORT', 'APP_BASE_URL',
    'OWNER_CONTROL_CENTER_TOKEN', 'ADMIN_TOKEN', 'PORTAL_RULES_API_TOKEN',
    'OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
    'OWNER_NOTIFICATION_EMAIL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_PASS'
  ];
  for (const key of blockedExact) delete env[key];
  for (const key of Object.keys(env)) {
    if (/^(OBJECT_STORAGE_|AWS_|S3_|PG)/.test(key)) delete env[key];
  }
  return env;
}

if (!fs.existsSync(baseArchive)) fail(`missing sealed predecessor carrier ${baseArchiveName}`);
const baseStat = fs.statSync(baseArchive);
if (baseStat.size !== baseSize) fail(`predecessor size mismatch: expected ${baseSize}, received ${baseStat.size}`);
const actualBaseSha = sha256File(baseArchive);
if (actualBaseSha !== baseSha256) fail(`predecessor SHA-256 mismatch: ${actualBaseSha}`);

if (!fs.existsSync(deltaRoot)) fail('missing release-delta directory');
const partNames = fs.readdirSync(deltaRoot)
  .filter((name) => /^v17101-runtime-patch\.part\d+\.b64$/.test(name))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
if (!partNames.length) fail('no v1.7.101 runtime patch parts found');

for (let i = 0; i < partNames.length; i += 1) {
  const expected = `v17101-runtime-patch.part${String(i + 1).padStart(2, '0')}.b64`;
  if (partNames[i] !== expected) fail(`runtime patch sequence gap: expected ${expected}, received ${partNames[i]}`);
}

const encoded = partNames.map((name) => fs.readFileSync(path.join(deltaRoot, name), 'utf8').replace(/\s+/g, '')).join('');
if (!/^[A-Za-z0-9+/=]+$/.test(encoded)) fail('runtime patch contains non-base64 data');
const patchBytes = Buffer.from(encoded, 'base64');
if (!patchBytes.length) fail('decoded runtime patch is empty');
const patchPath = path.join(os.tmpdir(), `sj-v17101-runtime-patch-${process.pid}.bin`);
fs.writeFileSync(patchPath, patchBytes);
console.log(`[v17101-control-plane-bootstrap] decoded ${partNames.length} patch parts; SHA-256 ${sha256File(patchPath)}`);

fs.rmSync(runtimeRoot, { recursive: true, force: true });
fs.mkdirSync(runtimeRoot, { recursive: true });

const safeExtractBase = [
  'import pathlib,sys,zipfile,shutil',
  'archive=pathlib.Path(sys.argv[1])',
  'runtime=pathlib.Path(sys.argv[2]).resolve()',
  'target_name=sys.argv[3]',
  'with zipfile.ZipFile(archive) as z:',
  '  for info in z.infolist():',
  "    name=info.filename.replace('\\\\','/')",
  '    p=pathlib.PurePosixPath(name)',
  "    if p.is_absolute() or '..' in p.parts: raise SystemExit(f'unsafe predecessor member: {name}')",
  '  z.extractall(runtime)',
  "dirs=[p for p in runtime.iterdir() if p.is_dir()]",
  "if len(dirs)!=1: raise SystemExit('predecessor archive did not extract to exactly one source directory')",
  'src=dirs[0]; dst=runtime/target_name',
  'if src!=dst: src.rename(dst)'
].join('\n');
let result = run('python3', ['-c', safeExtractBase, baseArchive, runtimeRoot, `smarter-justice-v${targetVersion}`]);
if (!result.ok) fail(`safe predecessor extraction failed with status ${result.status ?? 'unknown'}`);

const safeApplyPatch = [
  'import pathlib,sys,zipfile,tarfile,shutil',
  'patch=pathlib.Path(sys.argv[1])',
  'target=pathlib.Path(sys.argv[2]).resolve()',
  'def safe_rel(name):',
  "  name=name.replace('\\\\','/')",
  '  p=pathlib.PurePosixPath(name)',
  "  if p.is_absolute() or '..' in p.parts: raise SystemExit(f'unsafe patch member: {name}')",
  '  parts=list(p.parts)',
  "  if parts and parts[0] in ('smarter-justice-v1.7.101','runtime-patch','payload','source'): parts=parts[1:]",
  "  return pathlib.PurePosixPath(*parts) if parts else pathlib.PurePosixPath('.')",
  'def write_file(name,data,mode=None):',
  '  rel=safe_rel(name)',
  "  if str(rel)=='.': return",
  '  out=(target/pathlib.Path(*rel.parts)).resolve()',
  '  if target not in out.parents and out!=target: raise SystemExit(f\"patch escaped target: {name}\")',
  '  out.parent.mkdir(parents=True,exist_ok=True)',
  '  out.write_bytes(data)',
  '  if mode is not None: out.chmod(mode & 0o777)',
  'if zipfile.is_zipfile(patch):',
  '  with zipfile.ZipFile(patch) as z:',
  '    for info in z.infolist():',
  "      if info.is_dir(): continue",
  '      write_file(info.filename,z.read(info), (info.external_attr>>16) or None)',
  'elif tarfile.is_tarfile(patch):',
  "  with tarfile.open(patch,'r:*') as t:",
  '    for m in t.getmembers():',
  '      rel=safe_rel(m.name)',
  "      if str(rel)=='.': continue",
  '      out=(target/pathlib.Path(*rel.parts)).resolve()',
  '      if target not in out.parents and out!=target: raise SystemExit(f\"patch escaped target: {m.name}\")',
  '      if m.isdir(): out.mkdir(parents=True,exist_ok=True); continue',
  "      if not m.isfile(): raise SystemExit(f'unsupported patch member type: {m.name}')",
  '      f=t.extractfile(m)',
  '      if f is None: raise SystemExit(f\"could not read patch member: {m.name}\")',
  '      write_file(m.name,f.read(),m.mode)',
  'else:',
  "  raise SystemExit('runtime patch is neither ZIP nor tar archive')"
].join('\n');
result = run('python3', ['-c', safeApplyPatch, patchPath, applicationRoot]);
fs.rmSync(patchPath, { force: true });
if (!result.ok) fail(`runtime patch application failed with status ${result.status ?? 'unknown'}`);

for (const deleteName of ['v17101-delete-list.txt', 'v17101-runtime-delete-list.txt']) {
  const deletePath = path.join(deltaRoot, deleteName);
  if (!fs.existsSync(deletePath)) continue;
  for (const raw of fs.readFileSync(deletePath, 'utf8').split(/\r?\n/)) {
    const rel = raw.trim();
    if (!rel || rel.startsWith('#')) continue;
    const resolved = path.resolve(applicationRoot, rel);
    if (resolved !== applicationRoot && !resolved.startsWith(applicationRoot + path.sep)) fail(`unsafe delete-list path: ${rel}`);
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}

const packagePath = path.join(applicationRoot, 'package.json');
if (!fs.existsSync(packagePath)) fail('target package.json missing after patch');
const applicationPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (applicationPackage.version !== targetVersion) fail(`patched runtime version is ${applicationPackage.version || 'missing'}, not ${targetVersion}`);

const inventoryCandidates = ['RELEASE_PAYLOAD_INVENTORY_SHA256.txt', 'FILE_INVENTORY_SHA256.txt'];
const inventoryName = inventoryCandidates.find((name) => fs.existsSync(path.join(applicationRoot, name)));
if (!inventoryName) fail('no payload SHA-256 inventory found in patched exact source');
const inventoryPath = path.join(applicationRoot, inventoryName);
const expected = new Map();
for (const line of fs.readFileSync(inventoryPath, 'utf8').split(/\r?\n/)) {
  if (!line.trim()) continue;
  const match = line.match(/^([a-f0-9]{64})\s{2,}(.+)$/i);
  if (!match) fail(`invalid inventory line: ${line.slice(0, 120)}`);
  const rel = match[2].replace(/\\/g, '/');
  if (rel.startsWith('/') || rel.split('/').includes('..')) fail(`unsafe inventory path: ${rel}`);
  expected.set(rel, match[1].toLowerCase());
}
if (!expected.size) fail('payload inventory has zero records');

for (const [rel, digest] of expected) {
  const file = path.join(applicationRoot, ...rel.split('/'));
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) fail(`inventory file missing: ${rel}`);
  const actual = sha256File(file);
  if (actual !== digest) fail(`inventory SHA-256 mismatch for ${rel}: ${actual}`);
}

function walk(dir, prefix = '') {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.runtime') continue;
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full, rel));
    else if (ent.isFile()) out.push(rel);
  }
  return out;
}

const actualSourceFiles = walk(applicationRoot);
const allowedExtras = new Set([inventoryName]);
const extras = actualSourceFiles.filter((rel) => !expected.has(rel) && !allowedExtras.has(rel));
if (extras.length) fail(`patched source has files outside exact inventory: ${extras.slice(0, 20).join(', ')}${extras.length > 20 ? ' ...' : ''}`);
console.log(`[v17101-control-plane-bootstrap] exact payload inventory verified: ${expected.size} records`);

const install = run('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], {
  cwd: applicationRoot,
  env: { ...process.env, NPM_CONFIG_AUDIT: 'false', NPM_CONFIG_FUND: 'false' }
});
if (!install.ok) fail(`locked target dependency installation failed with status ${install.status ?? 'unknown'}`);

const testStorage = fs.mkdtempSync(path.join(os.tmpdir(), 'sj-v17101-carrier-tests-'));
try {
  const testEnv = isolatedTestEnvironment(testStorage);
  const qualification = run('npm', ['test'], { cwd: applicationRoot, env: testEnv });
  if (!qualification.ok) fail(`exact v${targetVersion} qualification failed with status ${qualification.status ?? 'unknown'}`);
} finally {
  fs.rmSync(testStorage, { recursive: true, force: true });
}

console.log(`[v17101-control-plane-bootstrap] exact Smarter Justice v${targetVersion} reconstructed and qualified`);
console.log(`[v17101-control-plane-bootstrap] predecessor carrier SHA-256 ${actualBaseSha}`);
console.log(`[v17101-control-plane-bootstrap] inventory ${inventoryName} records ${expected.size}`);
