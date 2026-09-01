#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const errors = [];
const exists = relative => fs.existsSync(path.join(root, relative));
const read = relative => exists(relative) ? fs.readFileSync(path.join(root, relative), 'utf8') : '';
const sha = relative => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const json = relative => { try { return JSON.parse(read(relative)); } catch { errors.push(`json:${relative}`); return {}; } };
const required = [
  'package.json', 'package-lock.json', 'server.js', 'SBOM.spdx.json',
  'PRE127_COMPLETION_RECEIPT.json', '.pre127-render-bootstrap.json',
  'data/legalCommunityProgramPre127.js', 'lib/legalCommunityProgramPre127.js', 'lib/legalCommunityMembershipPre127.js',
  'public/pre127-community.css', 'public/pre127-community.js',
  'public/professional-community.html', 'public/es/comunidad-profesional.html',
  'public/professional-membership.html', 'public/es/membresia-profesional.html',
  'public/attorney-partner-tour.html', 'public/es/para-abogados.html',
  'public/communities.html', 'public/es/comunidades.html',
  'public/communities/downtown-brooklyn.html', 'public/es/comunidades/downtown-brooklyn.html',
  'public/community-briefs/downtown-brooklyn.html',
  'governance/HYPERLOCAL_LEGAL_COMMUNITY_PUBLISHING_STANDARD_PRE127.json',
  'release-evidence/PRE127_SOURCE_CURRENTNESS.json', 'release-evidence/PRE127_IMPLEMENTATION_NOTES.md',
  'strategy/SMARTER_JUSTICE_HYPERLOCAL_LEGAL_COMMUNITY_STRATEGY_PRE127.md',
  'strategy/PRE127_BUILDER_ANALYSIS_AND_HANDOFF.md', 'strategy/PRE127_DECISION_LOG.json',
  'tests/pre127-professional-community.test.js', 'tests/security-boundaries-v177.test.js', 'tests/security-readiness.test.js',
  'scripts/deployment-doctor-pre127.js', 'scripts/validate-pre127-deployment-kit.js'
];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);

const pkg = json('package.json');
const lock = json('package-lock.json');
const marker = json('.pre127-render-bootstrap.json');
const receipt = json('PRE127_COMPLETION_RECEIPT.json');
const sbom = json('SBOM.spdx.json');
const standard = json('governance/HYPERLOCAL_LEGAL_COMMUNITY_PUBLISHING_STANDARD_PRE127.json');
const evidence = json('release-evidence/PRE127_SOURCE_CURRENTNESS.json');

if (pkg.version !== '2.0.0-pre127' || lock.version !== '2.0.0-pre127') errors.push('runtime-version');
if (marker.release !== 'v2.0.0-pre127' || marker.baseRelease !== 'v2.0.0-pre126' || marker.productAuthority !== 'SMARTER_JUSTICE_ONLY') errors.push('marker-release');
if (marker.predecessorProductionCommit !== '55a7fd1c13353a5c045e72a20cf08a1ce54c208c') errors.push('predecessor-production-commit');
if (marker.predecessorTree !== '8d62a223cdb8e1f61e37fbef467e3f38e9109159') errors.push('predecessor-tree');
if (marker.homepagePreserved !== true || marker.homepageRedesign !== false || marker.oneConnectedDomainAndBrand !== true) errors.push('product-boundary');
if (marker.newStripeSetup !== false || marker.newStripeProviderMutation !== false || marker.environmentVariableMutation !== false) errors.push('marker-provider-boundary');
if (receipt.release !== 'v2.0.0-pre127' || receipt.baseRelease !== 'v2.0.0-pre126' || receipt.noLossFromPredecessor !== true) errors.push('receipt-release');
if (receipt.predecessorUnchangedFilesHashVerified !== true || receipt.rollbackProductionCommit !== marker.predecessorProductionCommit) errors.push('rollback-evidence');
if (receipt.homepageSha256 !== sha('public/index.html') || receipt.spanishHomepageSha256 !== sha('public/es/index.html')) errors.push('homepage-hash');
if (receipt.pricingAmountsChanged !== false || receipt.newStripeSetup !== false || receipt.privateMatterCommunityPersonalization !== false || receipt.automaticLinkedInPosting !== false) errors.push('commercial-privacy-boundary');
if (receipt.strategyAndBuilderNotesIncluded !== true || receipt.sourceCurrentnessEvidenceIncluded !== true) errors.push('documentation-evidence');
if (sbom.spdxVersion !== 'SPDX-2.3' || !String(sbom.name || '').includes('2.0.0-pre127')) errors.push('sbom-currentness');
if (standard.currentnessPolicy?.automaticPublication !== false || standard.privacyPolicy?.privateUserMatterContent !== 'PROHIBITED') errors.push('publishing-standard');
if (evidence.sources?.length !== 10 || evidence.reviewDueAt !== '2026-09-08T23:59:59-04:00') errors.push('source-currentness');

try {
  const program = require(path.join(root, 'lib', 'legalCommunityProgramPre127.js'));
  const validation = program.validate();
  if (!validation.ok || validation.activeCommunities !== 1 || validation.currentEditions !== 1) errors.push(`program:${validation.errors.join(',')}`);
  const plans = Object.fromEntries(program.publicMembership().plans.map(plan => [plan.id, [plan.monthlyDollars, plan.annualDollars]]));
  if (JSON.stringify(plans.professional) !== '[10,100]' || JSON.stringify(plans.team) !== '[29,290]' || JSON.stringify(plans.office) !== '[49,490]') errors.push('pricing');
  const kit = program.shareKit('downtown-brooklyn');
  if (!kit || kit.autoPosted !== false || kit.outreachAuthorized !== false || kit.characterCount > 3000) errors.push('share-kit');
} catch (error) { errors.push(`program-module:${error.message}`); }

const server = read('server.js');
for (const endpoint of ['/api/public/legal-communities', '/member-preview', '/share-kit', '/api/professional/legal-community-preferences']) if (!server.includes(endpoint)) errors.push(`endpoint:${endpoint}`);
const dashboard = read('public/professional-dashboard.html');
if (!dashboard.includes('data-member-community-home') || !dashboard.includes('/pre127-community.js') || !dashboard.includes('/professional-community.html')) errors.push('member-dashboard');
const sitemap = read('public/sitemap.xml');
for (const url of ['/professional-community.html</loc>', '/es/comunidad-profesional.html</loc>']) if (!sitemap.includes(url)) errors.push(`sitemap:${url}`);
const home = read('public/index.html');
if (!home.includes('Tell us what happened.') || !home.includes('Not sent to lawyers')) errors.push('homepage-task-first');
const membership = read('public/professional-membership.html');
for (const amount of ['$10', '$100', '$29', '$290', '$49', '$490']) if (!membership.includes(amount)) errors.push(`membership-price:${amount}`);

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
const banned = [/\bPRE127\b/i, /ONE_BUILDER/i, /RELEASE_QA/i, /\bNO_GO\b/i, /deployment diagnostics/i, /owner workbench/i];
for (const file of publicHtml) {
  const visible = fs.readFileSync(file, 'utf8').replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const pattern of banned) if (pattern.test(visible)) errors.push(`public-internal-language:${path.relative(root, file)}:${pattern}`);
}

const result = {
  command:'deployment:validate',
  release:'v2.0.0-pre127',
  ok:errors.length === 0,
  errors,
  activeLegalCommunities:1,
  currentEditions:1,
  homepagePreserved:true,
  pricesPreserved:true,
  newStripeSetup:false,
  predecessorProductionCommit:marker.predecessorProductionCommit || ''
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ok) process.exitCode = 1;
