'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const base = path.join(root, '.runtime', 'pre123-live');
const target = path.join(root, '.runtime', 'pre124-live');
const guardSource = path.join(root, 'deployment', 'pre124', 'pre124-public-copy-guard.js');
const fail = message => { console.error(`[PRE124 DEPLOY] ${message}`); process.exit(1); };
const ok = (value, message) => { if (!value) fail(message); };
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function filesUnder(directory, prefix = '') {
  const rows = [];
  if (!fs.existsSync(directory)) return rows;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...filesUnder(absolute, relative));
    else if (entry.isFile()) rows.push(relative);
  }
  return rows;
}

function isPrivateHtml(relative) {
  const name = relative.replace(/\\/g, '/').toLowerCase();
  return /(^|\/)(admin|owner|staff)(?:[-/]|\.html|$)/.test(name)
    || /(?:professional|firm)-(?:dashboard|workspace)/.test(name)
    || /control-center|workbench|command-center/.test(name);
}

const replacements = [
  [/Core readiness lane/gi, 'Availability'],
  [/Fail-closed launch controls/gi, 'Availability safeguards'],
  [/Owner workbench/gi, 'Administration'],
  [/provider flags/gi, 'service availability'],
  [/control states/gi, 'availability'],
  [/deployment diagnostics/gi, 'service status'],
  [/Alignment required in the next material version/gi, 'Related community help'],
  [/Required alignment in the next material version/gi, 'Related community help'],
  [/Live state not re-affirmed/gi, 'Check the linked service for current availability'],
  [/\bIn development\b/gi, 'More information coming soon'],
  [/Alineaci[oó]n requerida en la pr[oó]xima versi[oó]n material/gi, 'Ayuda comunitaria relacionada'],
  [/Ruta especializada independiente; estado en vivo no reafirmado/gi, 'Ruta especializada; consulte el servicio enlazado para ver la disponibilidad actual'],
  [/estado en vivo no reafirmado/gi, 'consulte el servicio enlazado para ver la disponibilidad actual'],
  [/\bNO_GO\b/g, 'Not available yet'],
  [/\bEn desarrollo\b/gi, 'Más información próximamente']
];
const internalRelease = /\b(?:PRE\d{2,4}|v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?)\b/gi;
const internalTimestamp = /\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})\b/g;

function scrubText(value) {
  let next = String(value || '');
  for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
  next = next.replace(internalRelease, '').replace(internalTimestamp, '');
  return next.replace(/[ \t]{2,}/g, ' ');
}

function scrubHtml(html) {
  const blocks = [];
  let next = html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, block => {
    const token = `__SJ_BLOCK_${blocks.length}__`;
    blocks.push(block);
    return token;
  });
  next = next.replace(/>([^<]+)</g, (all, text) => `>${scrubText(text)}<`);
  next = next.replace(/__SJ_BLOCK_(\d+)__/g, (all, index) => blocks[Number(index)] || all);
  if (!next.includes('/pre124-public-copy-guard.js')) {
    ok(/<\/head>/i.test(next), 'public HTML page has no closing head tag');
    next = next.replace(/<\/head>/i, '<script defer src="/pre124-public-copy-guard.js"></script></head>');
  }
  return next;
}

function visibleText(html) {
  return String(html || '')
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const predecessorBootstrap = path.join(root, 'scripts', 'bootstrap-pre123-deploy.js');
ok(fs.existsSync(predecessorBootstrap), 'PRE123 bootstrap missing');
const predecessor = cp.spawnSync(process.execPath, [predecessorBootstrap], { cwd: root, env: process.env, encoding: 'utf8' });
if (predecessor.status !== 0) fail(predecessor.stderr || predecessor.stdout || 'PRE123 bootstrap failed');
const predecessorMarkerPath = path.join(base, '.pre123-render-bootstrap.json');
ok(fs.existsSync(predecessorMarkerPath), 'PRE123 marker missing');
const predecessorMarker = JSON.parse(fs.readFileSync(predecessorMarkerPath, 'utf8'));
ok(predecessorMarker.release === 'v2.0.0-pre123', 'PRE123 release mismatch');
ok(predecessorMarker.baseRelease === 'v2.0.0-pre122', 'PRE123 base release mismatch');
ok(predecessorMarker.productAuthority === 'SMARTER_JUSTICE_ONLY', 'product authority mismatch');
ok(predecessorMarker.navigatorOrCommunityMutation === false, 'Navigator/community mutation boundary mismatch');
ok(predecessorMarker.productionDeploymentAuthorized === true, 'PRE123 production authorization missing');
ok(fs.existsSync(guardSource), 'PRE124 public-copy guard source missing');

const baseFiles = filesUnder(base).filter(name => !/^\.pre\d+-render-bootstrap\.json$/.test(path.basename(name)));
const baseHashes = new Map(baseFiles.map(relative => [relative, sha(path.join(base, relative))]));
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(base, target, { recursive: true });
const modified = new Set();

const gatewayRelative = 'lib/centralAiGateway.js';
const gatewayPath = path.join(target, gatewayRelative);
ok(fs.existsSync(gatewayPath), 'central AI gateway missing');
let gateway = fs.readFileSync(gatewayPath, 'utf8');
const oldValidator = "const prohibited=/\\b(guarantee|will win|case value is|liable|legal advice|attorney-client relationship|privileged|filed for you|deadline is)\\b/i;if(prohibited.test(JSON.stringify(value)))errors.push('prohibited-claim');";
const newValidator = "const serialized=JSON.stringify(value);const prohibited=/\\b(guarantee|will win|case value is|liable|filed for you|deadline is)\\b/i;const affirmativeBoundary=/(?:\\b(?:this|that|the result|the response) (?:is|constitutes|provides) legal advice\\b|\\b(?:creates|forms|establishes) (?:an )?attorney-client relationship\\b|\\b(?:this|that|the communication|the response) is privileged\\b)/i;if(prohibited.test(serialized)||affirmativeBoundary.test(serialized))errors.push('prohibited-claim');";
ok(gateway.includes(oldValidator), 'expected PRE123 AI output validator needle missing');
gateway = gateway.replace(oldValidator, newValidator);
fs.writeFileSync(gatewayPath, gateway);
modified.add(gatewayRelative);

const runtimePackagePath = path.join(target, 'package.json');
const runtimePackage = JSON.parse(fs.readFileSync(runtimePackagePath, 'utf8'));
runtimePackage.name = 'smarter-justice-pre124-runtime';
runtimePackage.version = '2.0.0-pre124';
runtimePackage.description = 'Smarter Justice PRE124 attorney-launch completion runtime based on exact PRE123.';
fs.writeFileSync(runtimePackagePath, JSON.stringify(runtimePackage, null, 2) + '\n');
modified.add('package.json');

const runtimeLockPath = path.join(target, 'package-lock.json');
const runtimeLock = JSON.parse(fs.readFileSync(runtimeLockPath, 'utf8'));
runtimeLock.name = 'smarter-justice-pre124-runtime';
runtimeLock.version = '2.0.0-pre124';
if (runtimeLock.packages && runtimeLock.packages['']) {
  runtimeLock.packages[''].name = 'smarter-justice-pre124-runtime';
  runtimeLock.packages[''].version = '2.0.0-pre124';
}
fs.writeFileSync(runtimeLockPath, JSON.stringify(runtimeLock, null, 2) + '\n');
modified.add('package-lock.json');

const serverRelative = 'server.js';
const serverPath = path.join(target, serverRelative);
let server = fs.readFileSync(serverPath, 'utf8');
server = server.replaceAll('2.0.0-pre123', '2.0.0-pre124').replaceAll('v2.0.0-pre123', 'v2.0.0-pre124');
fs.writeFileSync(serverPath, server);
modified.add(serverRelative);

const guardRelative = 'public/pre124-public-copy-guard.js';
fs.copyFileSync(guardSource, path.join(target, guardRelative));
modified.add(guardRelative);

let publicPagesScrubbed = 0;
let publicPagesGuarded = 0;
const publicRoot = path.join(target, 'public');
for (const relativeWithinPublic of filesUnder(publicRoot).filter(name => name.toLowerCase().endsWith('.html'))) {
  const productRelative = `public/${relativeWithinPublic}`;
  if (isPrivateHtml(productRelative)) continue;
  const absolute = path.join(publicRoot, relativeWithinPublic);
  const before = fs.readFileSync(absolute, 'utf8');
  const after = scrubHtml(before);
  if (after !== before) {
    fs.writeFileSync(absolute, after);
    modified.add(productRelative);
    publicPagesScrubbed += 1;
  }
  if (after.includes('/pre124-public-copy-guard.js')) publicPagesGuarded += 1;
}
ok(publicPagesGuarded >= 100, `expected broad public-copy guard coverage; got ${publicPagesGuarded}`);

const bannedVisiblePatterns = [
  /Core readiness lane/i,
  /\bNO_GO\b/,
  /Fail-closed launch controls/i,
  /Owner workbench/i,
  /provider flags/i,
  /deployment diagnostics/i,
  /Alignment required in the next material version/i,
  /Required alignment in the next material version/i,
  /Live state not re-affirmed/i,
  /Alineaci[oó]n requerida en la pr[oó]xima versi[oó]n material/i,
  /estado en vivo no reafirmado/i,
  /\bPRE\d{2,4}\b/i,
  /\bv\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?\b/i,
  /\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})\b/
];
let auditedPublicPages = 0;
for (const relativeWithinPublic of filesUnder(publicRoot).filter(name => name.toLowerCase().endsWith('.html'))) {
  const productRelative = `public/${relativeWithinPublic}`;
  if (isPrivateHtml(productRelative)) continue;
  const text = visibleText(fs.readFileSync(path.join(publicRoot, relativeWithinPublic), 'utf8'));
  for (const pattern of bannedVisiblePatterns) ok(!pattern.test(text), `internal public copy remains in ${productRelative}: ${pattern}`);
  auditedPublicPages += 1;
}
ok(auditedPublicPages === publicPagesGuarded, 'public page audit/guard coverage mismatch');

const membershipPath = path.join(publicRoot, 'professional-membership.html');
ok(fs.existsSync(membershipPath), 'professional membership page missing');
const membership = fs.readFileSync(membershipPath, 'utf8');
for (const needle of ['$10', '$100', '$29', '$290', '$49', '$490']) ok(membership.includes(needle), `approved pricing missing: ${needle}`);
for (const needle of ['consultation scheduling', 'document/form review', 'No Smarter Justice calendar']) ok(membership.toLowerCase().includes(needle.toLowerCase()), `approved paid/free boundary missing: ${needle}`);
const preferredPositioning = 'Focused legal starting help, practical tools, and independent professional search in one connected platform.';
ok(fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8').includes(preferredPositioning), 'approved Smarter Justice positioning missing');

const gatewayModulePath = path.join(target, gatewayRelative);
delete require.cache[require.resolve(gatewayModulePath)];
const gatewayModule = require(gatewayModulePath);
const safeOutput = {
  plainLanguageSummary: 'This is a preparation summary, not a legal conclusion.',
  likelyNextPath: 'Review the organized information.',
  missingInformation: [],
  reviewRecommendation: 'Review and correct the information before relying on it.',
  safetyNotes: ['This is not legal advice and does not create an attorney-client relationship.']
};
const unsafeOutput = { ...safeOutput, plainLanguageSummary: 'This is legal advice.' };
ok(gatewayModule.validateOutput(safeOutput).ok, 'safe negative legal disclaimer is still rejected by AI validator');
ok(!gatewayModule.validateOutput(unsafeOutput).ok, 'affirmative legal-advice claim is not rejected by AI validator');

for (const [relative, expected] of baseHashes.entries()) {
  if (modified.has(relative)) continue;
  const deployed = path.join(target, relative);
  ok(fs.existsSync(deployed), `unchanged predecessor file missing: ${relative}`);
  ok(sha(deployed) === expected, `unchanged PRE123 file mutated: ${relative}`);
}

const changedHashes = {};
for (const relative of [...modified].sort()) {
  const absolute = path.join(target, relative);
  if (fs.existsSync(absolute)) changedHashes[relative] = sha(absolute);
}
const receipt = {
  schemaVersion: 'smarter-justice.pre124.completion-receipt.v1',
  release: 'v2.0.0-pre124',
  baseRelease: 'v2.0.0-pre123',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  navigatorOrCommunityMutation: false,
  stripeMutation: false,
  paymentSetupDeferredByOwner: true,
  changes: {
    aiProviderValidation: 'SAFE_NEGATIVE_DISCLAIMERS_ALLOWED_AFFIRMATIVE_LEGAL_CLAIMS_REJECTED',
    publicCopyGuard: true,
    publicPagesScrubbed,
    publicPagesGuarded,
    publicPagesAudited: auditedPublicPages,
    individualMembershipPrice: '$10/month or $100/year',
    otherApprovedPricesPreserved: ['$29/month or $290/year', '$49/month or $490/year'],
    freeListingPaidAccessBoundaryPreserved: true
  },
  changedHashes,
  providerLiveSmokeRequiredAfterDeploy: true,
  predecessorUnchangedFilesHashVerified: true,
  preferredPositioning,
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, 'PRE124_COMPLETION_RECEIPT.json'), JSON.stringify(receipt, null, 2) + '\n');

const marker = {
  schemaVersion: 'smarter-justice.pre124.render-bootstrap.v1',
  release: 'v2.0.0-pre124',
  baseRelease: 'v2.0.0-pre123',
  deploymentStrategy: 'EXACT_PRE123_RUNTIME_PLUS_AUDITED_PRE124_COMPLETION_PATCH',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  navigatorOrCommunityMutation: false,
  stripeMutation: false,
  paymentSetupDeferredByOwner: true,
  providerKeyValueNeverExposed: true,
  providerLiveSmokeRequired: true,
  productionDeploymentAuthorized: true,
  runtimeFiles: filesUnder(target).filter(name => !/^\.pre\d+-render-bootstrap\.json$/.test(path.basename(name))).length,
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, '.pre124-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');
console.log(`[PRE124 DEPLOY] qualified no-loss PRE124 prepared; ${auditedPublicPages} public pages audited; Stripe unchanged`);
