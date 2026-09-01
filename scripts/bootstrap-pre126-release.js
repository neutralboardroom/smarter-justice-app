'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const predecessorScript = path.join(root, 'scripts', 'bootstrap-pre125-release.js');
const source = path.join(root, '.runtime', 'pre125-live');
const target = path.join(root, '.runtime', 'pre126-live');
const overlayRoot = path.join(root, 'deployment', 'pre126', 'overlay');
const overlayManifestPath = path.join(root, 'deployment', 'pre126', 'overlay-manifest.json');
const fail = message => { console.error(`[PRE126 RELEASE] ${message}`); process.exit(1); };
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

ok(fs.existsSync(predecessorScript), 'PRE125 release bootstrap is missing');
const predecessor = spawnSync(process.execPath, [predecessorScript], { cwd:root, env:process.env, encoding:'utf8' });
if (predecessor.stdout) process.stdout.write(predecessor.stdout);
if (predecessor.status !== 0) fail(predecessor.stderr || 'PRE125 release bootstrap failed');
ok(fs.existsSync(path.join(source, '.pre125-render-bootstrap.json')), 'PRE125 marker is missing');
const predecessorMarker = JSON.parse(fs.readFileSync(path.join(source, '.pre125-render-bootstrap.json'), 'utf8'));
ok(predecessorMarker.release === 'v2.0.0-pre125', 'PRE125 release mismatch');
ok(predecessorMarker.baseRelease === 'v2.0.0-pre124', 'PRE125 base release mismatch');
ok(predecessorMarker.productAuthority === 'SMARTER_JUSTICE_ONLY', 'PRE125 product authority mismatch');
ok(predecessorMarker.newStripeSetup === false, 'PRE125 Stripe boundary mismatch');

const baseFiles = filesUnder(source);
const baseHashes = new Map(baseFiles.map(relative => [relative, sha(path.join(source, relative))]));
fs.rmSync(target, { recursive:true, force:true });
fs.cpSync(source, target, { recursive:true });
const modified = new Set();

ok(fs.existsSync(overlayManifestPath), 'PRE126 overlay manifest is missing');
const overlayManifest = JSON.parse(fs.readFileSync(overlayManifestPath, 'utf8'));
ok(overlayManifest.schemaVersion === 'smarter-justice.pre126.overlay-manifest.v1', 'PRE126 overlay manifest version mismatch');
const overlayFiles = filesUnder(overlayRoot);
const manifestFiles = Array.isArray(overlayManifest.files) ? overlayManifest.files : [];
ok(JSON.stringify(overlayFiles) === JSON.stringify(manifestFiles.map(row => row.path)), 'PRE126 overlay file inventory mismatch');
for (const row of manifestFiles) {
  const from = path.join(overlayRoot, row.path);
  ok(sha(from) === row.sha256, `PRE126 overlay hash mismatch: ${row.path}`);
  const to = path.join(target, row.path);
  fs.mkdirSync(path.dirname(to), { recursive:true });
  fs.copyFileSync(from, to);
  modified.add(row.path);
}

// The compact PRE125 runtime retained receipts that point to these evidence
// files, but did not package the files themselves. Restore the tracked,
// hash-bound dependencies so authenticated owner readiness checks do not fail.
const ownerRuntimeDependencies = [
  'RELEASE_PAYLOAD_INVENTORY_SHA256.txt',
  'FILE_INVENTORY_SHA256.txt',
  'governance/masters/Smarter_Justice_Eighth_Pass_Master.txt',
  'governance/receipts/MASTER_PAIR_COMMIT_RECEIPT_E1_R0.txt',
  'deployment/portfolio-products.json',
  'deployment/central-deploy-config.json',
  'deployment/onboarding-status.json',
  'deployment/deployment-doctor.json',
  'deployment/smoke-routes.json',
  'deployment/migration-classification.json',
  'deployment/release-manifest.json',
  'deployment/last-known-good.json',
  'deployment/current-production.json',
  'deployment/rollback-eligibility.json',
  'deployment/owner-interruption-budget.json',
  'deployment/deployment-runbook.md',
  'deployment/incident-runbook.md',
  'deployment/production-screenshot-matrix.json',
  'deployment/deployment-file-4-binding.json',
  'deployment/launch-cohort-manifest.json',
  'deployment/launch-state-machine.json',
  'deployment/canary-wave-plan.json',
  'deployment/dns-tls-canonical-origin-matrix.json',
  'deployment/external-service-activation-matrix.json',
  'deployment/production-stabilization-watch.json'
];
for (const relative of ownerRuntimeDependencies) {
  const from = path.join(root, relative);
  const to = path.join(target, relative);
  ok(fs.existsSync(from), `owner governance dependency is missing: ${relative}`);
  fs.mkdirSync(path.dirname(to), { recursive:true });
  fs.copyFileSync(from, to);
  modified.add(relative);
}

const retainedSecurityRegressionSuites = [
  'tests/test-port.js',
  'tests/security-boundaries-v177.test.js',
  'tests/security-readiness.test.js'
];
for (const relative of retainedSecurityRegressionSuites) {
  const from = path.join(root, relative);
  const to = path.join(target, relative);
  ok(fs.existsSync(from), `security regression dependency is missing: ${relative}`);
  fs.mkdirSync(path.dirname(to), { recursive:true });
  fs.copyFileSync(from, to);
  modified.add(relative);
}

const serverPath = path.join(target, 'server.js');
let server = fs.readFileSync(serverPath, 'utf8');
const requireAnchor = "const immigrationMigrationPre120 = require('./lib/immigrationMigrationPre120');";
ok(server.includes(requireAnchor), 'Server community require anchor is missing');
server = server.replace(requireAnchor, `${requireAnchor}\nconst legalCommunityNetworkPre126 = require('./lib/legalCommunityNetworkPre126');\nconst legalCommunityMembershipPre126 = require('./lib/legalCommunityMembershipPre126');`);

const publicApiAnchor = "  if (req.method === 'GET' && pathName === '/api/public/professional-source-coverage') {";
ok(server.includes(publicApiAnchor), 'Server public API anchor is missing');
const publicApi = `  if (req.method === 'GET' && pathName === '/api/public/legal-communities') {
    return json(res,200,{ok:true,...legalCommunityNetworkPre126.listPublicCommunities()});
  }
  if (req.method === 'GET' && pathName === '/api/public/legal-community-membership') {
    return json(res,200,{ok:true,membership:legalCommunityNetworkPre126.publicMembership()});
  }
  if (req.method === 'GET' && /^\\/api\\/public\\/legal-communities\\/[^/]+(?:\\/today)?$/.test(pathName)) {
    const parts=pathName.split('/').filter(Boolean);
    const id=decodeURIComponent(parts[3]||'');
    const community=legalCommunityNetworkPre126.getPublicCommunity(id,{audience:urlObj.searchParams.get('audience')||'',now:new Date()});
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
server = server.replace(publicApiAnchor, publicApi + publicApiAnchor);

const professionalApiAnchor = "  if (req.method === 'POST' && pathName === '/api/professional/auth/signup') {";
ok(server.includes(professionalApiAnchor), 'Server professional API anchor is missing');
const professionalApi = `  if (req.method === 'GET' && pathName === '/api/professional/legal-community-preferences') {
    const auth=professionalAccounts.accountFromRequest(req);
    if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'});
    return json(res,200,{ok:true,preferences:legalCommunityMembershipPre126.forAccount(auth.account.id),membership:legalCommunityNetworkPre126.publicMembership()});
  }
  if (req.method === 'POST' && pathName === '/api/professional/legal-community-preferences') {
    const auth=professionalAccounts.accountFromRequest(req);
    if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'});
    const result=legalCommunityMembershipPre126.updateForAccount(auth.account.id,await parseJson(req));
    if(result.error)return json(res,400,{ok:false,error:result.error});
    await store.flush();
    return json(res,200,{ok:true,...result});
  }
`;
server = server.replace(professionalApiAnchor, professionalApi + professionalApiAnchor);
server = server.replaceAll('v2.0.0-pre125', 'v2.0.0-pre126').replaceAll('2.0.0-pre125', '2.0.0-pre126');
write('server.js', server, modified);

const dashboardPath = 'public/professional-dashboard.html';
let dashboard = fs.readFileSync(path.join(target, dashboardPath), 'utf8');
ok(dashboard.includes('</head>') && dashboard.includes('<section class="section pre100-value-wrap"'), 'Professional dashboard patch anchors are missing');
dashboard = dashboard.replace('</head>', '<link rel="stylesheet" href="/pre126-community.css?v=community-1"><script defer src="/pre126-community.js?v=community-1"></script></head>');
dashboard = dashboard.replace('<section class="section pre100-value-wrap"', '<section class="sjc-home-community"><div class="sjc-wrap" data-member-community-home><div class="sjc-home-community__panel"><p>Loading your legal-community home…</p></div></div></section>\n<section class="section pre100-value-wrap"');
dashboard = dashboard.replace('<nav id="pre121-nav" class="pre121-header__nav" aria-label="Protected navigation">', '<nav id="pre121-nav" class="pre121-header__nav" aria-label="Protected navigation"><a href="/communities">Legal communities</a>');
dashboard = dashboard.replace('One central professional workspace', 'Your professional and legal-community workspace');
write(dashboardPath, dashboard, modified);

const spanishHomePath = 'public/es/index.html';
let spanishHome = fs.readFileSync(path.join(target, spanishHomePath), 'utf8');
ok(spanishHome.includes('</head>') && spanishHome.includes('<section id="more-help"'), 'Spanish homepage patch anchors are missing');
spanishHome = spanishHome.replace('</head>', '<link rel="stylesheet" href="/pre126-community.css?v=community-1"></head>');
spanishHome = spanishHome.replace('<nav id="pre121-nav" class="pre121-header__nav" aria-label="Navegación principal">', '<nav id="pre121-nav" class="pre121-header__nav" aria-label="Navegación principal"><a href="/es/comunidades">Comunidades legales</a>');
const spanishLocal = `<section class="pre126-home-local"><div class="sjc-wrap"><div class="pre126-home-local__head"><div><p class="sjc-kicker">La ayuda legal empieza localmente</p><h2>Conozca la comunidad legal alrededor de usted.</h2></div><a class="sjc-text-link" href="/es/comunidades">Explorar comunidades legales</a></div><article class="pre126-home-feature"><p class="sjc-status-line">En organización</p><h3>Comunidad Legal de Downtown Brooklyn / Civic Center</h3><p>Tribunales cercanos, ayuda pública, organizaciones legales, actividad con fuentes y búsqueda independiente de abogados y firmas.</p><div class="sjc-actions"><a class="sjc-button" href="/es/comunidades/downtown-brooklyn">Abrir la comunidad</a><a class="sjc-button sjc-button--secondary" href="/es/profesionales.html?postalCode=11201&amp;state=NY#directorySearch">Buscar perfiles locales</a></div></article></div></section>`;
spanishHome = spanishHome.replace('<section id="more-help"', spanishLocal + '\n<section id="more-help"');
spanishHome = spanishHome.replace('Controle su perfil y su relación profesional.', 'Únase a su comunidad legal local de Smarter Justice.').replace('Reclame o corrija gratis un perfil respaldado por fuentes. Las herramientas profesionales opcionales permanecen separadas de la verificación y del orden orgánico.', 'Mantenga gratis su perfil público. La membresía añade información local, participación comunitaria y herramientas profesionales opcionales.');
spanishHome = spanishHome.replace('</body>', '<script defer src="/pre126-community.js?v=community-1"></script></body>');
write(spanishHomePath, spanishHome, modified);

const sitemapPath = 'public/sitemap.xml';
let sitemap = fs.readFileSync(path.join(target, sitemapPath), 'utf8');
ok(sitemap.includes('</urlset>'), 'Sitemap closing tag is missing');
const sitemapRows = [
  'https://smarterjustice.com/communities',
  'https://smarterjustice.com/communities/downtown-brooklyn',
  'https://smarterjustice.com/community-briefs/downtown-brooklyn',
  'https://smarterjustice.com/es/comunidades',
  'https://smarterjustice.com/es/comunidades/downtown-brooklyn'
].filter(url => !sitemap.includes(`<loc>${url}</loc>`)).map(url => `  <url><loc>${url}</loc></url>`).join('\n');
sitemap = sitemap.replace('</urlset>', `${sitemapRows}\n</urlset>`);
write(sitemapPath, sitemap, modified);

const nextList = `# Smarter Justice — Next Version Improvement List after the legal-community launch

## Completed in this release

1. Repositioned Smarter Justice from primarily selling profile-adjacent growth tools to a connected network of hyperlocal legal communities.
2. Preserved the public task-first Navigator in the first homepage viewport while adding local legal-community discovery and a clearer professional invitation.
3. Launched the Downtown Brooklyn / Civic Center community with nested Kings County, New York City and New York context.
4. Added source-linked local courts, public help, legal-service organizations, professional activity and expiring currentness signals.
5. Added live local directory counts and search paths from the existing read-only Profile Factory snapshot.
6. Added a professional community home with home-community, participating-community and service-area concepts kept separate from office claims.
7. Added durable professional legal-community preferences without storing or exposing private user matters.
8. Reframed the existing Professional, Team and Office prices as community membership while preserving every price amount and making no Stripe catalog or provider change.
9. Added a share-ready Downtown Brooklyn legal-community brief with LinkedIn sharing metadata and source/currentness boundaries.
10. Added English and Spanish community and professional membership paths.
11. Added the founder-supplied Justice Truck origin account without inventing a date, partnership or institutional endorsement.
12. Preserved the exact PRE125 rollback point and hash-verified every unchanged predecessor file.

## Highest-value next improvements

1. Establish a repeatable editorial currentness workflow for weekly community briefs, expiring events and affected-source holds.
2. Research candidate Brooklyn communities against the viability standard and launch only the smallest areas that can stay useful.
3. Add target-specific community preferences for individual professional, firm and office records while preserving account-level simplicity.
4. Add member practice-area personalization and parent-community inheritance without revealing individual user matters.
5. Add organization-submitted event and participation workflows with source, authority, moderation, expiry and correction controls.
6. Add privacy-qualified aggregate public-demand signals only after minimum cohort, suppression and review thresholds are proven.
7. Measure first-value, brief sharing, profile discovery, member activation, recurring use and retention without sensitive matter analytics.
8. Continue accessibility, mobile, source-currentness, security, billing-boundary, no-loss and rollback qualification on every material release.
`;
write('NEXT_VERSION_IMPROVEMENT_LIST.md', nextList, modified);

const packagePath = path.join(target, 'package.json');
const runtimePackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
runtimePackage.name = 'smarter-justice-pre126-runtime';
runtimePackage.version = '2.0.0-pre126';
runtimePackage.description = 'Smarter Justice connected hyperlocal legal-community runtime based on exact PRE125 production.';
runtimePackage.scripts = runtimePackage.scripts || {};
runtimePackage.scripts.sbom = 'node scripts/generate-sbom.js';
runtimePackage.scripts['test:pre126:community'] = 'node tests/pre126-hyperlocal-legal-community.test.js';
runtimePackage.scripts['test:security'] = 'node tests/security-boundaries-v177.test.js && node tests/security-readiness.test.js';
runtimePackage.scripts['qualify:pre126'] = 'npm run test:pre126:community && npm run test:security && npm run deployment:validate';
runtimePackage.scripts['deployment:validate'] = 'node scripts/validate-pre126-deployment-kit.js';
runtimePackage.scripts['deployment:doctor'] = 'node scripts/deployment-doctor-pre126.js';
runtimePackage.scripts.test = 'npm run test:pre126:community && npm run test:security && npm run deployment:validate';
fs.writeFileSync(packagePath, JSON.stringify(runtimePackage, null, 2) + '\n');
modified.add('package.json');

const lockPath = path.join(target, 'package-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
lock.name = 'smarter-justice-pre126-runtime';
lock.version = '2.0.0-pre126';
if (lock.packages && lock.packages['']) {
  lock.packages[''].name = 'smarter-justice-pre126-runtime';
  lock.packages[''].version = '2.0.0-pre126';
}
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
modified.add('package-lock.json');

const sbomRun = spawnSync(process.execPath, [path.join(target, 'scripts', 'generate-sbom.js')], {
  cwd:target,
  env:{ ...process.env, SBOM_CREATED_AT:'2026-09-01T12:00:00.000Z' },
  encoding:'utf8'
});
if (sbomRun.stdout) process.stdout.write(sbomRun.stdout);
if (sbomRun.status !== 0) fail(sbomRun.stderr || 'PRE126 SBOM generation failed');
modified.add('SBOM.spdx.json');

for (const [relative, expected] of baseHashes.entries()) {
  if (modified.has(relative)) continue;
  const absolute = path.join(target, relative);
  ok(fs.existsSync(absolute), `unchanged PRE125 file missing: ${relative}`);
  ok(sha(absolute) === expected, `unchanged PRE125 file mutated: ${relative}`);
}

const testRun = spawnSync(process.execPath, [path.join(target, 'tests', 'pre126-hyperlocal-legal-community.test.js')], { cwd:target, env:process.env, encoding:'utf8' });
if (testRun.stdout) process.stdout.write(testRun.stdout);
if (testRun.status !== 0) fail(testRun.stderr || 'PRE126 community test failed');

const changedHashes = {};
for (const relative of [...modified].sort()) {
  const absolute = path.join(target, relative);
  if (fs.existsSync(absolute)) changedHashes[relative] = sha(absolute);
}
const receipt = {
  schemaVersion: 'smarter-justice.pre126.legal-community-release-receipt.v1',
  release: 'v2.0.0-pre126',
  baseRelease: 'v2.0.0-pre125',
  rollbackCommit: '2e4b90c083c469bc0e055747258fc9521eed06b2',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  noLossFromPredecessor: true,
  predecessorUnchangedFilesHashVerified: true,
  legalCommunityNetworkMutation: true,
  homepageAndVisualDirectionAuthorized: true,
  oneConnectedDomainAndBrand: true,
  launchCommunity: 'downtown-brooklyn',
  founderOriginFirstPartySupplied: true,
  shareReadyLocalBrief: true,
  spanishParity: true,
  restoredOwnerRuntimeDependencies: true,
  retainedSecurityRegressionSuites: true,
  pricesPreserved: { professional:[10,100], team:[29,290], office:[49,490] },
  pricingAmountsChanged: false,
  newStripeSetup: false,
  newStripeCatalogMutation: false,
  newStripeProviderMutation: false,
  environmentVariableMutation: false,
  credentialAndOrganicTruthIndependentOfPayment: true,
  privateMatterCommunityFeed: false,
  unsolicitedOutreachAutomation: false,
  changedHashes,
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, 'PRE126_COMPLETION_RECEIPT.json'), JSON.stringify(receipt, null, 2) + '\n');

const marker = {
  schemaVersion: 'smarter-justice.pre126.render-bootstrap.v1',
  release: 'v2.0.0-pre126',
  baseRelease: 'v2.0.0-pre125',
  rollbackCommit: receipt.rollbackCommit,
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  legalCommunityNetworkMutation: true,
  homepageAndVisualDirectionAuthorized: true,
  oneConnectedDomainAndBrand: true,
  newStripeSetup: false,
  newStripeProviderMutation: false,
  environmentVariableMutation: false,
  productionDeploymentAuthorized: true,
  runtimeFiles: filesUnder(target).length,
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, '.pre126-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');

const bannedVisible = [/\bPRE126\b/i, /ONE_BUILDER/i, /RELEASE_QA/i, /\bNO_GO\b/i, /deployment diagnostics/i, /owner workbench/i];
for (const relative of filesUnder(path.join(target, 'public')).filter(name => name.endsWith('.html'))) {
  const text = visibleText(fs.readFileSync(path.join(target, 'public', relative), 'utf8'));
  for (const pattern of bannedVisible) ok(!pattern.test(text), `internal public language remains in ${relative}: ${pattern}`);
}

const validateRun = spawnSync(process.execPath, [path.join(target, 'scripts', 'validate-pre126-deployment-kit.js')], { cwd:target, env:process.env, encoding:'utf8' });
if (validateRun.stdout) process.stdout.write(validateRun.stdout);
if (validateRun.status !== 0) fail(validateRun.stderr || 'PRE126 deployment validation failed');
console.log('[PRE126 RELEASE] qualified connected hyperlocal legal-community runtime prepared; existing prices and Stripe boundary preserved');
