'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const archive = path.join(root, 'PRE89_FULL_DEPLOY_RUNTIME.tgz');
const target = path.join(root, '.runtime', 'pre89-live');
const expectedSha256 = '8b3c65882e8a2c880df45ca22c4f8c4f08182fe64fdbd73f1aa13753e38ccc10';
const expectedBytes = 14646083;

function fail(message) {
  console.error(`[PRE89 DEPLOY] ${message}`);
  process.exit(1);
}
function readJson(rel) {
  const p = path.join(target, rel);
  if (!fs.existsSync(p)) fail(`missing required file: ${rel}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function assert(ok, message) { if (!ok) fail(message); }

assert(fs.existsSync(archive), 'deployment carrier PRE89_FULL_DEPLOY_RUNTIME.tgz is missing');
const stat = fs.statSync(archive);
assert(stat.size === expectedBytes, `carrier size mismatch: ${stat.size} != ${expectedBytes}`);
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
assert(sha256 === expectedSha256, `carrier SHA-256 mismatch: ${sha256}`);

const members = cp.execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
for (const raw of members.split(/\r?\n/)) {
  const name = raw.trim();
  if (!name) continue;
  const normalized = name.replace(/^\.\//, '');
  assert(!path.posix.isAbsolute(normalized), `unsafe absolute archive member: ${name}`);
  assert(!normalized.split('/').includes('..'), `unsafe parent traversal archive member: ${name}`);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
cp.execFileSync('tar', ['-xzf', archive, '-C', target], { stdio: 'inherit' });

const pkg = readJson('package.json');
assert(pkg.name === 'smarter-justice-v1', `unexpected runtime package: ${pkg.name}`);
assert(pkg.version === '1.7.98', `unexpected runtime version: ${pkg.version}`);

const seal = readJson('governance/current/PRE_SEAL_RULE_LOCK_RECEIPT.json');
assert(seal.PRODUCT === 'SMARTER JUSTICE', 'PRE89 product identity mismatch');
assert(seal.PRODUCT_SCOPE === 'SMARTER JUSTICE ONLY', 'PRE89 product scope mismatch');
assert(seal.PRE_BUILD_RULE_LOCK === 'PASS', 'PRE89 pre-build rule lock is not PASS');
assert(seal.PRE_SEAL_RULE_LOCK === 'PASS', 'PRE89 pre-seal rule lock is not PASS');
assert(Number(seal.MISSING_ROGER_RULES) === 0, 'PRE89 missing Roger Rules is nonzero');
assert(Number(seal.UNAUTHORIZED_ROGER_RULE_CHANGES) === 0, 'PRE89 unauthorized Roger Rule changes is nonzero');

const state = readJson('governance/current/CURRENT_RULE_STATE.json');
assert(state.product === 'SMARTER JUSTICE', 'PRE89 current rule state product mismatch');
assert(state.productScope === 'SMARTER JUSTICE ONLY', 'PRE89 current rule state scope mismatch');
assert(state.builderVersion === 'PRE89', `unexpected builder version: ${state.builderVersion}`);
assert(state.productVersion === 'v2.0.0-pre89', `unexpected product version: ${state.productVersion}`);

const factory = readJson('deployment/pre89/PRE89_FACTORY_V026_INTEGRATION_RECEIPT.json');
assert(factory.release === 'v2.0.0-pre89', 'PRE89 Factory receipt release mismatch');
assert(factory.factoryVersion === '0.26.0', `unexpected Factory version: ${factory.factoryVersion}`);
assert(factory.counts && factory.counts.attorneys === 11786, 'PRE89 attorney count mismatch');
assert(factory.counts && factory.counts.firms === 492, 'PRE89 firm count mismatch');
assert(factory.counts && factory.counts.total === 12278, 'PRE89 total profile count mismatch');
assert(factory.boundaries && factory.boundaries.factoryReadOnly === true, 'PRE89 Factory read-only boundary missing');
assert(factory.boundaries && factory.boundaries.staleFactoryMayOverwriteNewerJusticeCorrection === false, 'PRE89 stale Factory overwrite boundary failed');

const design = readJson('deployment/pre89/PRE89_DESIGN_APPLICATION_RECEIPT.json');
assert(design.release === 'v2.0.0-pre89', 'PRE89 design receipt release mismatch');
assert(design.marker === 'SMARTER_JUSTICE_PRE89_SECOND_PASS_DESIGN_REFINEMENT', 'PRE89 design marker mismatch');
assert(design.htmlPagesMarked === 137, `unexpected PRE89 design surface count: ${design.htmlPagesMarked}`);

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
cp.execFileSync(npm, ['--prefix', target, 'ci', '--omit=dev', '--no-audit', '--no-fund', '--ignore-scripts'], {
  stdio: 'inherit',
  env: { ...process.env, NPM_CONFIG_AUDIT: 'false', NPM_CONFIG_FUND: 'false' }
});

const marker = {
  schemaVersion: 'smarter-justice.pre89.render-bootstrap.v1',
  release: 'v2.0.0-pre89',
  carrier: path.basename(archive),
  carrierSha256: sha256,
  carrierBytes: stat.size,
  factoryVersion: factory.factoryVersion,
  profileCounts: factory.counts,
  preSealRuleLock: seal.PRE_SEAL_RULE_LOCK,
  designMarker: design.marker,
  extractedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, '.pre89-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');
console.log(`[PRE89 DEPLOY] verified and prepared ${marker.release}; profiles=${marker.profileCounts.total}; carrier=${sha256}`);
