'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..');
const archiveName = 'smarter-justice-v1.7.98-comprehensive-community-value.zip';
const archivePath = path.join(repositoryRoot, archiveName);
const expectedSha256 = '0611f1082bf30244d5ec08a97ccc0de538b3248f19362466389feeb5bc672260';
const expectedSize = 12891048;
const runtimeRoot = path.join(repositoryRoot, '.runtime');
const applicationRoot = path.join(runtimeRoot, 'smarter-justice-v1.7.98');
const homepagePartPaths = [
  'homepage-polish.part1.jsfrag',
  'homepage-polish.part2.jsfrag',
  'homepage-polish.part3.jsfrag'
].map((name) => path.join(repositoryRoot, 'scripts', name));
const sitewideOverlayPath = path.join(repositoryRoot, 'scripts', 'apply-sitewide-polish-safe.js');
const originalSitewideOverlayPath = path.join(repositoryRoot, 'scripts', 'apply-sitewide-polish.js');

function fail(message) {
  console.error(`[sitewide-release-bootstrap] ${message}`);
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

function isolatedTestEnvironment(storagePath) {
  const env = { ...process.env, NODE_ENV: 'test', SMARTER_JUSTICE_STORAGE_DIR: storagePath };
  // npm sets NODE_ENV=production for lifecycle commands when --omit=dev is
  // active. Do not let that outer Render build choice contaminate the nested
  // inherited qualification suite, which must run against isolated test data.
  delete env.npm_config_omit;
  delete env.NPM_CONFIG_OMIT;
  delete env.npm_config_production;
  delete env.NPM_CONFIG_PRODUCTION;
  const blockedExact = [
    'RENDER', 'RENDER_SERVICE_ID', 'RENDER_EXTERNAL_HOSTNAME', 'RENDER_DISK_MOUNT_PATH',
    'DATABASE_URL', 'REDIS_URL', 'PORT', 'APP_BASE_URL',
    'OWNER_CONTROL_CENTER_TOKEN', 'ADMIN_TOKEN', 'PORTAL_RULES_API_TOKEN',
    'OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
    'OWNER_NOTIFICATION_EMAIL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'
  ];
  for (const key of blockedExact) delete env[key];
  for (const key of Object.keys(env)) {
    if (/^(OBJECT_STORAGE_|AWS_|S3_|PG)/.test(key)) delete env[key];
  }
  return env;
}

if (!fs.existsSync(archivePath)) fail(`missing ${archiveName}`);
const stat = fs.statSync(archivePath);
if (stat.size !== expectedSize) fail(`size mismatch: expected ${expectedSize}, received ${stat.size}`);
const digest = crypto.createHash('sha256').update(fs.readFileSync(archivePath)).digest('hex');
if (digest !== expectedSha256) fail(`SHA-256 mismatch: ${digest}`);

for (const partPath of homepagePartPaths) {
  if (!fs.existsSync(partPath)) fail(`missing homepage overlay part ${path.basename(partPath)}`);
}
if (!fs.existsSync(originalSitewideOverlayPath)) fail('missing original site-wide overlay script');
if (!fs.existsSync(sitewideOverlayPath)) fail('missing corrected site-wide overlay wrapper');

fs.rmSync(runtimeRoot, { recursive: true, force: true });
fs.mkdirSync(runtimeRoot, { recursive: true });

const pythonProgram = [
  'import pathlib, sys, zipfile',
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
if (applicationPackage.version !== '1.7.98') fail(`extracted package version is ${applicationPackage.version || 'missing'}, not 1.7.98`);

const install = run('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], {
  cwd: applicationRoot,
  env: { ...process.env, NPM_CONFIG_AUDIT: 'false', NPM_CONFIG_FUND: 'false' }
});
if (!install.ok) fail(`locked application dependency installation failed with status ${install.status ?? 'unknown'}`);

const testStorage = fs.mkdtempSync(path.join(os.tmpdir(), 'sj-v1798-build-tests-'));
const testEnv = isolatedTestEnvironment(testStorage);
try {
  const inherited = run('npm', ['test'], { cwd: applicationRoot, env: testEnv });
  if (!inherited.ok) fail(`sealed-source inherited qualification failed with status ${inherited.status ?? 'unknown'}`);

  const combinedHomepagePath = path.join(runtimeRoot, 'apply-homepage-polish.js');
  fs.writeFileSync(combinedHomepagePath, homepagePartPaths.map((partPath) => fs.readFileSync(partPath, 'utf8')).join('\n'), 'utf8');
  const homepage = run(process.execPath, [combinedHomepagePath, applicationRoot], { env: testEnv });
  if (!homepage.ok) fail(`homepage overlay failed with status ${homepage.status ?? 'unknown'}`);

  const sitewide = run(process.execPath, [sitewideOverlayPath, applicationRoot], { env: testEnv });
  if (!sitewide.ok) fail(`site-wide overlay failed with status ${sitewide.status ?? 'unknown'}`);

  const syntax = run(process.execPath, ['--check', path.join(applicationRoot, 'public', 'home.js')], { env: testEnv });
  if (!syntax.ok) fail(`polished homepage JavaScript syntax check failed with status ${syntax.status ?? 'unknown'}`);

  for (const testFile of ['homepage-launch-polish-v1798.test.js', 'sitewide-visual-polish-v1798.test.js']) {
    const result = run(process.execPath, [path.join(applicationRoot, 'tests', testFile)], { cwd: applicationRoot, env: testEnv });
    if (!result.ok) fail(`${testFile} failed with status ${result.status ?? 'unknown'}`);
  }
} finally {
  fs.rmSync(testStorage, { recursive: true, force: true });
}

console.log(`[sitewide-release-bootstrap] prepared Smarter Justice v${applicationPackage.version} coordinated visual polish`);
console.log(`[sitewide-release-bootstrap] sealed source SHA-256 ${digest}`);
console.log('[sitewide-release-bootstrap] sealed-source suite passed before overlays; focused homepage and 95-page visual audits passed after overlays');
