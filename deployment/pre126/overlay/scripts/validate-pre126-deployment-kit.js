#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];
const exists = relative => fs.existsSync(path.join(root, relative));
const read = relative => exists(relative) ? fs.readFileSync(path.join(root, relative), 'utf8') : '';
const json = relative => { try { return JSON.parse(read(relative)); } catch { errors.push(`json:${relative}`); return {}; } };
const required = [
  'package.json', 'package-lock.json', 'server.js', 'SBOM.spdx.json',
  'PRE126_COMPLETION_RECEIPT.json', '.pre126-render-bootstrap.json',
  'RELEASE_PAYLOAD_INVENTORY_SHA256.txt', 'FILE_INVENTORY_SHA256.txt',
  'governance/masters/Smarter_Justice_Eighth_Pass_Master.txt',
  'governance/receipts/MASTER_PAIR_COMMIT_RECEIPT_E1_R0.txt',
  'deployment/portfolio-products.json', 'deployment/central-deploy-config.json', 'deployment/onboarding-status.json',
  'deployment/deployment-doctor.json', 'deployment/smoke-routes.json', 'deployment/migration-classification.json',
  'deployment/release-manifest.json', 'deployment/last-known-good.json', 'deployment/current-production.json',
  'deployment/rollback-eligibility.json', 'deployment/owner-interruption-budget.json',
  'deployment/deployment-runbook.md', 'deployment/incident-runbook.md',
  'deployment/production-screenshot-matrix.json', 'deployment/deployment-file-4-binding.json',
  'deployment/launch-cohort-manifest.json', 'deployment/launch-state-machine.json', 'deployment/canary-wave-plan.json',
  'deployment/dns-tls-canonical-origin-matrix.json', 'deployment/external-service-activation-matrix.json',
  'deployment/production-stabilization-watch.json',
  'data/legalCommunityNetworkPre126.js', 'lib/legalCommunityNetworkPre126.js', 'lib/legalCommunityMembershipPre126.js',
  'public/index.html', 'public/pre126-community.css', 'public/pre126-community.js',
  'public/communities.html', 'public/communities/downtown-brooklyn.html',
  'public/community-briefs/downtown-brooklyn.html', 'public/attorney-partner-tour.html', 'public/professional-membership.html',
  'public/es/comunidades.html', 'public/es/comunidades/downtown-brooklyn.html', 'public/es/para-abogados.html', 'public/es/membresia-profesional.html',
  'tests/pre126-hyperlocal-legal-community.test.js', 'tests/test-port.js',
  'tests/security-boundaries-v177.test.js', 'tests/security-readiness.test.js',
  'scripts/deployment-doctor-pre126.js', 'scripts/validate-pre126-deployment-kit.js'
];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);

const pkg = json('package.json');
const lock = json('package-lock.json');
const marker = json('.pre126-render-bootstrap.json');
const receipt = json('PRE126_COMPLETION_RECEIPT.json');
const sbom = json('SBOM.spdx.json');
if (pkg.version !== '2.0.0-pre126' || lock.version !== '2.0.0-pre126') errors.push('runtime-version');
if (marker.release !== 'v2.0.0-pre126' || marker.baseRelease !== 'v2.0.0-pre125' || marker.productAuthority !== 'SMARTER_JUSTICE_ONLY') errors.push('marker-release');
if (marker.newStripeSetup !== false || marker.newStripeProviderMutation !== false || marker.environmentVariableMutation !== false) errors.push('marker-provider-boundary');
if (marker.homepageAndVisualDirectionAuthorized !== true || marker.legalCommunityNetworkMutation !== true) errors.push('marker-authority');
if (receipt.release !== 'v2.0.0-pre126' || receipt.baseRelease !== 'v2.0.0-pre125' || receipt.noLossFromPredecessor !== true) errors.push('receipt-release');
if (receipt.predecessorUnchangedFilesHashVerified !== true || receipt.rollbackCommit !== '2e4b90c083c469bc0e055747258fc9521eed06b2') errors.push('rollback-evidence');
if (receipt.restoredOwnerRuntimeDependencies !== true) errors.push('owner-runtime-dependencies');
if (receipt.retainedSecurityRegressionSuites !== true || !pkg.scripts || !pkg.scripts['test:security']) errors.push('security-regression-suites');
if (receipt.newStripeSetup !== false || receipt.pricingAmountsChanged !== false) errors.push('commercial-boundary');
if (sbom.spdxVersion !== 'SPDX-2.3' || !String(sbom.name || '').includes('2.0.0-pre126')) errors.push('sbom-currentness');

try {
  const network = require(path.join(root, 'lib', 'legalCommunityNetworkPre126.js'));
  const validation = network.validate();
  if (!validation.ok || validation.communityCount !== 1) errors.push(`network:${validation.errors.join(',')}`);
  const membership = network.publicMembership();
  const prices = Object.fromEntries(membership.plans.map(plan => [plan.id, [plan.monthlyDollars, plan.annualDollars]]));
  if (JSON.stringify(prices.professional) !== '[10,100]' || JSON.stringify(prices.team) !== '[29,290]' || JSON.stringify(prices.office) !== '[49,490]') errors.push('pricing');
} catch (error) { errors.push(`network-module:${error.message}`); }

const server = read('server.js');
for (const endpoint of ['/api/public/legal-communities', '/api/public/legal-community-membership', '/api/professional/legal-community-preferences']) if (!server.includes(endpoint)) errors.push(`endpoint:${endpoint}`);
const dashboard = read('public/professional-dashboard.html');
if (!dashboard.includes('data-member-community-home') || !dashboard.includes('/pre126-community.js')) errors.push('member-dashboard');
const sitemap = read('public/sitemap.xml');
for (const url of ['/communities</loc>', '/communities/downtown-brooklyn</loc>', '/community-briefs/downtown-brooklyn</loc>', '/es/comunidades</loc>', '/es/comunidades/downtown-brooklyn</loc>']) if (!sitemap.includes(url)) errors.push(`sitemap:${url}`);
const home = read('public/index.html');
if (!home.includes('Tell us what happened.') || !home.includes('Legal help starts local') || !home.includes('Not sent to lawyers')) errors.push('homepage-task-first');
const local = read('public/communities/downtown-brooklyn.html');
if (!local.includes('Rock and Hammer Tax Services') || !local.includes('26 Court Street')) errors.push('founder-origin');
const brief = read('public/community-briefs/downtown-brooklyn.html');
if (!brief.includes('Share on LinkedIn') || !brief.includes('Official source')) errors.push('share-brief');
const membershipHtml = read('public/professional-membership.html');
for (const amount of ['$10', '$100', '$29', '$290', '$49', '$490']) if (!membershipHtml.includes(amount)) errors.push(`membership-price:${amount}`);

const publicHtml = [];
function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes:true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && entry.name.endsWith('.html')) publicHtml.push(absolute);
  }
}
walk(path.join(root, 'public'));
const banned = [/\bPRE126\b/i, /ONE_BUILDER/i, /RELEASE_QA/i, /\bNO_GO\b/i, /deployment diagnostics/i, /owner workbench/i];
for (const file of publicHtml) {
  const visible = read(path.relative(root, file)).replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const pattern of banned) if (pattern.test(visible)) errors.push(`public-internal-language:${path.relative(root, file)}:${pattern}`);
}

const result = {
  command: 'deployment:validate',
  release: 'v2.0.0-pre126',
  ok: errors.length === 0,
  errors,
  activeLegalCommunities: 1,
  homepageTaskFirst: true,
  pricesPreserved: true,
  newStripeSetup: false,
  rollbackCommit: receipt.rollbackCommit || ''
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ok) process.exitCode = 1;
