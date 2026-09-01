'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const predecessorScript = path.join(root, 'scripts', 'bootstrap-pre126-release.js');
const source = path.join(root, '.runtime', 'pre126-live');
const target = path.join(root, '.runtime', 'pre127-live');
const overlayRoot = path.join(root, 'deployment', 'pre127', 'overlay');
const overlayManifestPath = path.join(root, 'deployment', 'pre127', 'overlay-manifest.json');
const predecessorLocalCommit = 'c31b139fb5e08b08faf8074b96d0e9a723974045';
const predecessorProductionCommit = '55a7fd1c13353a5c045e72a20cf08a1ce54c208c';
const predecessorTree = '8d62a223cdb8e1f61e37fbef467e3f38e9109159';
const lastKnownGoodPre125Commit = '2e4b90c083c469bc0e055747258fc9521eed06b2';
const fail = message => { console.error(`[PRE127 RELEASE] ${message}`); process.exit(1); };
const ok = (value, message) => { if (!value) fail(message); };
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function filesUnder(directory, prefix = '') {
  const rows = [];
  if (!fs.existsSync(directory)) return rows;
  for (const entry of fs.readdirSync(directory, { withFileTypes:true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...filesUnder(absolute, relative));
    else if (entry.isFile()) rows.push(relative);
  }
  return rows;
}

function write(relative, content, modified) {
  const absolute = path.join(target, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive:true });
  fs.writeFileSync(absolute, content);
  modified.add(relative.replace(/\\/g, '/'));
}

function replaceSection(content, start, end, replacement, label) {
  const from = content.indexOf(start);
  const to = content.indexOf(end, from + start.length);
  ok(from >= 0 && to > from, `${label} anchors are missing`);
  return content.slice(0, from) + replacement + content.slice(to);
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

ok(fs.existsSync(predecessorScript), 'PRE126 release bootstrap is missing');
const predecessor = spawnSync(process.execPath, [predecessorScript], { cwd:root, env:process.env, encoding:'utf8' });
if (predecessor.stdout) process.stdout.write(predecessor.stdout);
if (predecessor.status !== 0) fail(predecessor.stderr || 'PRE126 release bootstrap failed');
ok(fs.existsSync(path.join(source, '.pre126-render-bootstrap.json')), 'PRE126 marker is missing');
const predecessorMarker = JSON.parse(fs.readFileSync(path.join(source, '.pre126-render-bootstrap.json'), 'utf8'));
ok(predecessorMarker.release === 'v2.0.0-pre126', 'PRE126 release mismatch');
ok(predecessorMarker.baseRelease === 'v2.0.0-pre125', 'PRE126 base release mismatch');
ok(predecessorMarker.productAuthority === 'SMARTER_JUSTICE_ONLY', 'PRE126 product authority mismatch');
ok(predecessorMarker.newStripeSetup === false, 'PRE126 Stripe boundary mismatch');
ok(predecessorMarker.oneConnectedDomainAndBrand === true, 'PRE126 connected-brand boundary mismatch');

const baseFiles = filesUnder(source);
const baseHashes = new Map(baseFiles.map(relative => [relative, sha(path.join(source, relative))]));
const predecessorHomepageSha256 = baseHashes.get('public/index.html');
const predecessorSpanishHomepageSha256 = baseHashes.get('public/es/index.html');
ok(Boolean(predecessorHomepageSha256 && predecessorSpanishHomepageSha256), 'PRE126 homepage hashes are missing');
// Keep the staging and retired directories beside the runtime target. The
// final rename is intentionally atomic and therefore must stay on the same
// filesystem (Render mounts /tmp separately from the checked-out repository).
const runtimeRoot = path.dirname(target);
fs.mkdirSync(runtimeRoot, { recursive:true });
const staging = path.join(runtimeRoot, `.pre127-staging-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
const retired = path.join(runtimeRoot, `.pre127-retired-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
fs.rmSync(staging, { recursive:true, force:true, maxRetries:5, retryDelay:100 });
fs.cpSync(source, staging, { recursive:true });
if (fs.existsSync(target)) fs.renameSync(target, retired);
fs.renameSync(staging, target);
try { fs.rmSync(retired, { recursive:true, force:true, maxRetries:5, retryDelay:100 }); } catch {}
const modified = new Set();

ok(fs.existsSync(overlayManifestPath), 'PRE127 overlay manifest is missing');
const overlayManifest = JSON.parse(fs.readFileSync(overlayManifestPath, 'utf8'));
ok(overlayManifest.schemaVersion === 'smarter-justice.pre127.overlay-manifest.v1', 'PRE127 overlay manifest version mismatch');
const overlayFiles = filesUnder(overlayRoot);
const manifestFiles = Array.isArray(overlayManifest.files) ? overlayManifest.files : [];
ok(JSON.stringify(overlayFiles) === JSON.stringify(manifestFiles.map(row => row.path)), 'PRE127 overlay file inventory mismatch');
for (const row of manifestFiles) {
  const from = path.join(overlayRoot, row.path);
  ok(sha(from) === row.sha256, `PRE127 overlay hash mismatch: ${row.path}`);
  const to = path.join(target, row.path);
  fs.mkdirSync(path.dirname(to), { recursive:true });
  fs.copyFileSync(from, to);
  modified.add(row.path);
}

for (const relative of ['tests/test-port.js', 'tests/security-boundaries-v177.test.js', 'tests/security-readiness.test.js']) {
  ok(fs.existsSync(path.join(target, relative)), `inherited security regression dependency is missing: ${relative}`);
}

const serverPath = path.join(target, 'server.js');
let server = fs.readFileSync(serverPath, 'utf8');
const requireAnchor = "const legalCommunityMembershipPre126 = require('./lib/legalCommunityMembershipPre126');";
ok(server.includes(requireAnchor), 'Server community require anchor is missing');
server = server.replace(requireAnchor, `${requireAnchor}\nconst legalCommunityProgramPre127 = require('./lib/legalCommunityProgramPre127');\nconst legalCommunityMembershipPre127 = require('./lib/legalCommunityMembershipPre127');`);

const publicApiStart = "  if (req.method === 'GET' && pathName === '/api/public/legal-communities') {";
const publicApiEnd = "  if (req.method === 'GET' && pathName === '/api/public/professional-source-coverage') {";
const publicApi = `  if (req.method === 'GET' && pathName === '/api/public/legal-communities') {
    return json(res,200,{ok:true,...legalCommunityProgramPre127.listPublicCommunities()});
  }
  if (req.method === 'GET' && pathName === '/api/public/legal-community-membership') {
    return json(res,200,{ok:true,membership:legalCommunityProgramPre127.publicMembership()});
  }
  if (req.method === 'GET' && /^\\/api\\/public\\/legal-communities\\/[^/]+\\/member-preview$/.test(pathName)) {
    const parts=pathName.split('/').filter(Boolean);
    const id=decodeURIComponent(parts[3]||'');
    const base=legalCommunityProgramPre127.getPublicCommunity(id,{audience:'PROFESSIONAL',now:new Date()});
    if(!base)return json(res,404,{ok:false,error:'Legal community not found.'});
    const query=base.directoryQuery||{};
    const professionals=professionalMarketplace.searchPublicProfessionals({postalCode:query.postalCode,state:query.state,limit:1});
    const firms=professionalMarketplace.searchPublicFirms({postalCode:query.postalCode,state:query.state,limit:1});
    const source=professionalMarketplace.profileFactorySourceStatus();
    const directorySnapshot={professionals:Number(professionals.total||0),firms:Number(firms.total||0),postalCode:query.postalCode||'',state:query.state||'',factoryVersion:source.factoryVersion||'',sourceGeneratedAt:source.generatedAt||'',readOnlyDirectorySource:source.readOnlyDirectorySource===true,disclosure:'A location match is not membership, verification, recommendation, availability, or proof of current office status.'};
    const experience=legalCommunityProgramPre127.memberExperience(id,{now:new Date(),practiceAreaIds:urlObj.searchParams.getAll('practice'),directorySnapshot});
    return json(res,200,{ok:true,experience});
  }
  if (req.method === 'GET' && /^\\/api\\/public\\/legal-communities\\/[^/]+\\/share-kit$/.test(pathName)) {
    const parts=pathName.split('/').filter(Boolean);
    const id=decodeURIComponent(parts[3]||'');
    const shareKit=legalCommunityProgramPre127.shareKit(id);
    if(!shareKit)return json(res,404,{ok:false,error:'Current share kit not found.'});
    return json(res,200,{ok:true,shareKit});
  }
  if (req.method === 'GET' && /^\\/api\\/public\\/legal-communities\\/[^/]+(?:\\/today)?$/.test(pathName)) {
    const parts=pathName.split('/').filter(Boolean);
    const id=decodeURIComponent(parts[3]||'');
    const community=legalCommunityProgramPre127.getPublicCommunity(id,{audience:urlObj.searchParams.get('audience')||'',now:new Date(),practiceAreaIds:urlObj.searchParams.getAll('practice')});
    if(!community)return json(res,404,{ok:false,error:'Legal community not found.'});
    const query=community.directoryQuery||{};
    const professionals=professionalMarketplace.searchPublicProfessionals({postalCode:query.postalCode,state:query.state,limit:1});
    const firms=professionalMarketplace.searchPublicFirms({postalCode:query.postalCode,state:query.state,limit:1});
    const source=professionalMarketplace.profileFactorySourceStatus();
    community.directorySnapshot={professionals:Number(professionals.total||0),firms:Number(firms.total||0),postalCode:query.postalCode||'',state:query.state||'',factoryVersion:source.factoryVersion||'',sourceGeneratedAt:source.generatedAt||'',readOnlyDirectorySource:source.readOnlyDirectorySource===true,disclosure:'A location match is not membership, verification, recommendation, availability, or proof of current office status.'};
    if(parts[4]==='today')return json(res,200,{ok:true,communityId:community.id,signals:community.currentSignals,sourceDisclosure:community.sourceDisclosure});
    return json(res,200,{ok:true,community});
  }
`;
server = replaceSection(server, publicApiStart, publicApiEnd, publicApi, 'Server public legal-community API');

const professionalApiStart = "  if (req.method === 'GET' && pathName === '/api/professional/legal-community-preferences') {";
const professionalApiAnchor = "  if (req.method === 'POST' && pathName === '/api/professional/auth/signup') {";
const professionalApi = `  if (req.method === 'GET' && pathName === '/api/professional/legal-community-preferences') {
    const auth=professionalAccounts.accountFromRequest(req);
    if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'});
    return json(res,200,{ok:true,preferences:legalCommunityMembershipPre127.forAccount(auth.account.id),membership:legalCommunityProgramPre127.publicMembership()});
  }
  if (req.method === 'POST' && pathName === '/api/professional/legal-community-preferences') {
    const auth=professionalAccounts.accountFromRequest(req);
    if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'});
    const result=legalCommunityMembershipPre127.updateForAccount(auth.account.id,await parseJson(req));
    if(result.error)return json(res,400,{ok:false,error:result.error});
    await store.flush();
    return json(res,200,{ok:true,...result});
  }
`;
server = replaceSection(server, professionalApiStart, professionalApiAnchor, professionalApi, 'Server professional legal-community API');
server = server.replaceAll('v2.0.0-pre126', 'v2.0.0-pre127').replaceAll('2.0.0-pre126', '2.0.0-pre127');
write('server.js', server, modified);

const dashboardPath = 'public/professional-dashboard.html';
let dashboard = fs.readFileSync(path.join(target, dashboardPath), 'utf8');
ok(dashboard.includes('/pre126-community.css') && dashboard.includes('/pre126-community.js') && dashboard.includes('data-member-community-home'), 'PRE126 professional dashboard anchors are missing');
dashboard = dashboard
  .replaceAll('/pre126-community.css?v=community-1', '/pre127-community.css?v=community-2')
  .replaceAll('/pre126-community.js?v=community-1', '/pre127-community.js?v=community-2');
const dashboardNav = '<nav id="pre121-nav" class="pre121-header__nav" aria-label="Protected navigation"><a href="/communities">Legal communities</a>';
ok(dashboard.includes(dashboardNav), 'PRE126 dashboard navigation anchor is missing');
dashboard = dashboard.replace(dashboardNav, '<nav id="pre121-nav" class="pre121-header__nav" aria-label="Protected navigation"><a href="/professional-community.html">Community home</a><a href="/communities">Legal communities</a>');
write(dashboardPath, dashboard, modified);

const sitemapPath = 'public/sitemap.xml';
let sitemap = fs.readFileSync(path.join(target, sitemapPath), 'utf8');
ok(sitemap.includes('</urlset>'), 'Sitemap closing tag is missing');
const sitemapRows = [
  'https://smarterjustice.com/professional-community.html',
  'https://smarterjustice.com/es/comunidad-profesional.html'
].filter(url => !sitemap.includes(`<loc>${url}</loc>`)).map(url => `  <url><loc>${url}</loc></url>`).join('\n');
sitemap = sitemap.replace('</urlset>', `${sitemapRows}\n</urlset>`);
write(sitemapPath, sitemap, modified);

const nextList = `# Smarter Justice — Next Version Improvement List after PRE127

## Completed in this release

1. Turned the Downtown Brooklyn / Civic Center concept into a working professional community home in English and Spanish.
2. Added source-linked current professional signals, observed dates, review boundaries, expiry, and responsible-source links.
3. Added practice-area filters driven only by professional-selected preferences, never private public-user matters.
4. Upgraded durable community preferences to schema v2 while retaining the PRE126 store key and prior geography data.
5. Added a five-step first-value path and local working-reference panel.
6. Added a copy-ready LinkedIn draft and manual share controls without automatic posting or outreach authorization.
7. Reframed unchanged Professional, Team, and Office amounts as Downtown Brooklyn founding launch prices without promising unimplemented price protection.
8. Added a machine-readable publishing standard, source-currentness evidence, decision log, strategy, implementation notes, and builder handoff.
9. Preserved the homepage first viewport and visual system without a PRE127 redesign.
10. Preserved one domain, one brand, free factual profiles, independent trust facts, the Stripe boundary, inherited security controls, and exact PRE126 rollback evidence.

## Highest-value next improvements

1. Run the editorial review queue before September 8, 2026; renew only verified items and let stale items expire closed.
2. Measure first-value completion, source opens, brief sharing, return use, free-account activation, and confirmed paid activation without sensitive-matter analytics.
3. Test whether civil-litigation, housing, family, and other practice filters create enough recurring relevance.
4. Research candidate Brooklyn micro-communities against the viability standard; launch none until content and professional density are sustainable.
5. Define exact tier capabilities from usage evidence before adding feature promises.
6. Decide whether to implement binding founding-price protection across checkout, billing, terms, receipts, renewals, support, and legal review.
7. Design organization-submitted events with source authority, moderation, expiry, correction, and anti-spam controls.
8. Consider privacy-qualified aggregate demand only under a separately approved cohort, suppression, review, and re-identification standard.
9. Continue accessibility, mobile, source-currentness, security, billing-boundary, no-loss, clean-clone, artifact, and rollback qualification.
`;
write('NEXT_VERSION_IMPROVEMENT_LIST.md', nextList, modified);

const packagePath = path.join(target, 'package.json');
const runtimePackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
runtimePackage.name = 'smarter-justice-pre127-runtime';
runtimePackage.version = '2.0.0-pre127';
runtimePackage.description = 'Smarter Justice connected hyperlocal legal-community runtime based on exact PRE126 production.';
runtimePackage.scripts = runtimePackage.scripts || {};
runtimePackage.scripts.sbom = 'node scripts/generate-sbom.js';
runtimePackage.scripts['test:pre127:community'] = 'node tests/pre127-professional-community.test.js';
runtimePackage.scripts['test:security'] = 'node tests/security-boundaries-v177.test.js && node tests/security-readiness.test.js';
runtimePackage.scripts['qualify:pre127'] = 'npm run test:pre127:community && npm run test:security && npm run deployment:validate';
runtimePackage.scripts['deployment:validate'] = 'node scripts/validate-pre127-deployment-kit.js';
runtimePackage.scripts['deployment:doctor'] = 'node scripts/deployment-doctor-pre127.js';
runtimePackage.scripts.test = 'npm run test:pre127:community && npm run test:security && npm run deployment:validate';
fs.writeFileSync(packagePath, JSON.stringify(runtimePackage, null, 2) + '\n');
modified.add('package.json');

const lockPath = path.join(target, 'package-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
lock.name = 'smarter-justice-pre127-runtime';
lock.version = '2.0.0-pre127';
if (lock.packages && lock.packages['']) {
  lock.packages[''].name = 'smarter-justice-pre127-runtime';
  lock.packages[''].version = '2.0.0-pre127';
}
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
modified.add('package-lock.json');

const sbomRun = spawnSync(process.execPath, [path.join(target, 'scripts', 'generate-sbom.js')], {
  cwd:target,
  env:{ ...process.env, SBOM_CREATED_AT:'2026-09-01T12:00:00.000Z' },
  encoding:'utf8'
});
if (sbomRun.stdout) process.stdout.write(sbomRun.stdout);
if (sbomRun.status !== 0) fail(sbomRun.stderr || 'PRE127 SBOM generation failed');
modified.add('SBOM.spdx.json');

for (const [relative, expected] of baseHashes.entries()) {
  if (modified.has(relative)) continue;
  const absolute = path.join(target, relative);
  ok(fs.existsSync(absolute), `unchanged PRE126 file missing: ${relative}`);
  ok(sha(absolute) === expected, `unchanged PRE126 file mutated: ${relative}`);
}

const testRun = spawnSync(process.execPath, [path.join(target, 'tests', 'pre127-professional-community.test.js')], { cwd:target, env:process.env, encoding:'utf8' });
if (testRun.stdout) process.stdout.write(testRun.stdout);
if (testRun.status !== 0) fail(testRun.stderr || 'PRE127 community test failed');

const changedHashes = {};
for (const relative of [...modified].sort()) {
  const absolute = path.join(target, relative);
  if (fs.existsSync(absolute)) changedHashes[relative] = sha(absolute);
}
const receipt = {
  schemaVersion: 'smarter-justice.pre127.professional-community-release-receipt.v1',
  release: 'v2.0.0-pre127',
  baseRelease: 'v2.0.0-pre126',
  predecessorLocalCommit,
  predecessorProductionCommit,
  predecessorTree,
  rollbackCommit: predecessorProductionCommit,
  rollbackProductionCommit: predecessorProductionCommit,
  lastKnownGoodPre125Commit,
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  noLossFromPredecessor: true,
  predecessorUnchangedFilesHashVerified: true,
  professionalCommunityExperienceMutation: true,
  homepagePreserved: true,
  homepageRedesign: false,
  homepageSha256: predecessorHomepageSha256,
  spanishHomepageSha256: predecessorSpanishHomepageSha256,
  oneConnectedDomainAndBrand: true,
  launchCommunity: 'downtown-brooklyn',
  founderOriginFirstPartySupplied: true,
  coreHyperlocalIdeaAttributedToRoger: true,
  professionalCommunityHome: true,
  practiceFocusPersonalization: true,
  durableCommunityPreferenceSchema: 'smarter-justice.professional-legal-community-preferences.v2',
  shareReadyLocalBrief: true,
  manualLinkedInSharing: true,
  automaticLinkedInPosting: false,
  unsolicitedOutreachAutomation: false,
  spanishParity: true,
  strategyAndBuilderNotesIncluded: true,
  sourceCurrentnessEvidenceIncluded: true,
  publishingStandardIncluded: true,
  inheritedOwnerRuntimeDependencies: true,
  retainedSecurityRegressionSuites: true,
  pricesPreserved: { professional:[10,100], team:[29,290], office:[49,490] },
  pricingAmountsChanged: false,
  foundingPriceProtectionPromised: false,
  newStripeSetup: false,
  newStripeCatalogMutation: false,
  newStripeProviderMutation: false,
  environmentVariableMutation: false,
  credentialAndOrganicTruthIndependentOfPayment: true,
  privateMatterCommunityFeed: false,
  privateMatterCommunityPersonalization: false,
  aggregateDemandSignalsImplemented: false,
  changedHashes,
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, 'PRE127_COMPLETION_RECEIPT.json'), JSON.stringify(receipt, null, 2) + '\n');

const marker = {
  schemaVersion: 'smarter-justice.pre127.render-bootstrap.v1',
  release: 'v2.0.0-pre127',
  baseRelease: 'v2.0.0-pre126',
  predecessorLocalCommit,
  predecessorProductionCommit,
  predecessorTree,
  rollbackCommit: receipt.rollbackCommit,
  rollbackProductionCommit: receipt.rollbackProductionCommit,
  lastKnownGoodPre125Commit,
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  professionalCommunityExperienceMutation: true,
  homepagePreserved: true,
  homepageRedesign: false,
  oneConnectedDomainAndBrand: true,
  newStripeSetup: false,
  newStripeProviderMutation: false,
  environmentVariableMutation: false,
  productionDeploymentAuthorized: true,
  runtimeFiles: filesUnder(target).length,
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, '.pre127-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');

const bannedVisible = [/\bPRE127\b/i, /ONE_BUILDER/i, /RELEASE_QA/i, /\bNO_GO\b/i, /deployment diagnostics/i, /owner workbench/i];
for (const relative of filesUnder(path.join(target, 'public')).filter(name => name.endsWith('.html'))) {
  const text = visibleText(fs.readFileSync(path.join(target, 'public', relative), 'utf8'));
  for (const pattern of bannedVisible) ok(!pattern.test(text), `internal public language remains in ${relative}: ${pattern}`);
}

const validateRun = spawnSync(process.execPath, [path.join(target, 'scripts', 'validate-pre127-deployment-kit.js')], { cwd:target, env:process.env, encoding:'utf8' });
if (validateRun.stdout) process.stdout.write(validateRun.stdout);
if (validateRun.status !== 0) fail(validateRun.stderr || 'PRE127 deployment validation failed');
console.log('[PRE127 RELEASE] qualified connected hyperlocal legal-community runtime prepared; existing prices and Stripe boundary preserved');
