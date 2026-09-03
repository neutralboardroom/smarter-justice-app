#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const evidenceRoot = path.join(root, 'release-evidence', 'pre128');
const errors = [];
const exists = relative => fs.existsSync(path.join(root, relative));
const read = relative => exists(relative) ? fs.readFileSync(path.join(root, relative), 'utf8') : '';
const json = relative => { try { return JSON.parse(read(relative)); } catch { errors.push(`invalid-json:${relative}`); return {}; } };
const sha = relative => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const walk = (directory, rows = []) => {
  if (!fs.existsSync(directory)) return rows;
  for (const entry of fs.readdirSync(directory, { withFileTypes:true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, rows);
    else if (entry.isFile()) rows.push(absolute);
  }
  return rows;
};

const required = [
  'package.json','package-lock.json','server.js','SBOM.spdx.json','PRE128_COMPLETION_RECEIPT.json','.pre128-render-bootstrap.json',
  'data/legalCommunityProgramPre128.js','lib/legalCommunityProgramPre128.js','lib/legalCommunityMembershipPre128.js','lib/publicLegalAreasPre128.js',
  'public/community-experience.js','public/community.css','public/professional-community.html','public/es/comunidad-profesional.html',
  'public/professional-membership.html','public/es/membresia-profesional.html','public/professional-signup.html','public/find-my-profile.html',
  'strategy/SMARTER_JUSTICE_STRATEGY_AND_PRODUCT_CONSTITUTION.md','strategy/PRE128_BUILDER_ANALYSIS_AND_HANDOFF.md',
  'governance/PROFESSIONAL_COMMUNITY_CHARTER_PRE128.json','NEXT_VERSION_IMPROVEMENT_LIST.md',
  'tests/pre128-universal-successor.test.js','tests/pre128-http-contract.test.js','tests/pre128-system-qualification.test.js','tests/security-boundaries-v177.test.js','tests/security-readiness.test.js',
  'scripts/deployment-doctor-pre128.js','scripts/validate-pre128-deployment-kit.js'
];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);

const pkg = json('package.json');
const lock = json('package-lock.json');
const marker = json('.pre128-render-bootstrap.json');
const receipt = json('PRE128_COMPLETION_RECEIPT.json');
const sbom = json('SBOM.spdx.json');
if (pkg.version !== '2.0.0-pre128' || lock.version !== '2.0.0-pre128') errors.push('runtime-version');
if (marker.release !== 'v2.0.0-pre128' || marker.baseRelease !== 'v2.0.0-pre127' || marker.productAuthority !== 'SMARTER_JUSTICE_ONLY') errors.push('release-marker');
if (marker.sourceCommit !== 'a746c2d689c03ba713d9d31dd952bc9fd2137dbb' || marker.sourceTree !== '966152d3e62f4a4df45dcfb7241f3a444a90f97d') errors.push('source-lineage');
if (marker.rollbackProductionCommit !== marker.sourceCommit || marker.oneConnectedDomainAndBrand !== true) errors.push('rollback-or-topology');
if (marker.newStripeSetup !== false || marker.providerMutation !== false || marker.environmentVariableMutation !== false) errors.push('provider-boundary');
if (marker.paidMembershipEnrollmentOpen !== false || marker.checkoutOpen !== false || marker.newProfessionalRegistrationOpen !== false) errors.push('commercial-availability');
if (receipt.releaseState !== 'QUALIFIED_SUCCESSOR' || receipt.noLossFromPredecessor !== true || receipt.homepageVisualSystemPreserved !== true) errors.push('completion-receipt');
if (receipt.paidMembershipEnrollmentOpen !== false || receipt.checkoutOpen !== false || receipt.privateMatterCommunityPersonalization !== false) errors.push('truth-or-privacy-boundary');
if (sbom.spdxVersion !== 'SPDX-2.3' || !String(sbom.name || '').includes('2.0.0-pre128')) errors.push('sbom');
if (receipt.homepageSha256 !== sha('public/index.html') || receipt.spanishHomepageSha256 !== sha('public/es/index.html')) errors.push('homepage-hash');

const evidenceFiles = walk(evidenceRoot).filter(file => file.endsWith('.json'));
if (evidenceFiles.length !== 66) errors.push(`evidence-count:${evidenceFiles.length}`);
const requiredEvidenceFields = ['product','roleAuthority','ownerCommandId','candidateId','predecessor','source','environment','recordedAt','evidenceProducer','independentReviewer','actions','outputs','status','limitations','retainedLocators','proves'];
for (const file of evidenceFiles) {
  let row;
  try { row = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { errors.push(`evidence-json:${path.basename(file)}`); continue; }
  for (const field of requiredEvidenceFields) if (!(field in row)) errors.push(`evidence-field:${path.basename(file)}:${field}`);
}

try {
  const program = require(path.join(root, 'lib', 'legalCommunityProgramPre128.js'));
  const validation = program.validate();
  if (!validation.ok || validation.publishedCommunities !== 1 || validation.paidEnrollmentOpen || validation.checkoutOpen) errors.push(`community-program:${validation.errors.join(',')}`);
  const membership = program.publicMembership();
  const plans = Object.fromEntries(membership.plannedPlans.map(plan => [plan.id, [plan.monthlyDollars, plan.annualDollars]]));
  if (JSON.stringify(plans.professional) !== '[10,100]' || JSON.stringify(plans.team) !== '[29,290]' || JSON.stringify(plans.office) !== '[49,490]') errors.push('planned-price-authority');
} catch (error) { errors.push(`community-module:${error.message}`); }

const server = read('server.js');
for (const endpoint of ['/api/public/legal-communities','/professional-preview','/api/legal-areas','/api/professional/legal-community-preferences']) if (!server.includes(endpoint)) errors.push(`endpoint:${endpoint}`);
for (const unsafe of ['X-Smarter-Justice-Demo-Path','polishPublicHtmlForLaunch(data.toString']) if (server.includes(unsafe)) errors.push(`runtime-copy-rewrite:${unsafe}`);
const home = read('public/index.html');
if (!home.includes('Tell us what happened.') || !home.includes('Not sent to lawyers')) errors.push('homepage-first-encounter');
const membershipPage = read('public/professional-membership.html');
for (const amount of ['$10','$100','$29','$290','$49','$490']) if (!membershipPage.includes(amount)) errors.push(`planned-price:${amount}`);
if (!membershipPage.includes('Enrollment not open') || !membershipPage.includes('No payment is accepted today')) errors.push('membership-availability-copy');
const signup = read('public/professional-signup.html');
if (!signup.includes('New registration is temporarily paused.')) errors.push('signup-fail-closed-copy');

for (const file of walk(path.join(root, 'public'))) {
  const extension = path.extname(file).toLowerCase();
  if (!['.html','.js','.css','.xml','.json','.txt','.webmanifest'].includes(extension)) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (/\bPRE\d{2,4}\b/i.test(source)) errors.push(`public-release-identifier:${path.relative(root, file)}`);
  if (/pre124-public-copy-guard|pre124-launch/i.test(source)) errors.push(`public-copy-guard:${path.relative(root, file)}`);
}
const sitemap = read('public/sitemap.xml');
for (const obsolete of ['founding-portals','portal-router','portal-preparation','professional-signup','professional-community.html']) if (sitemap.includes(obsolete)) errors.push(`sitemap-obsolete:${obsolete}`);
for (const canonical of ['https://smarterjustice.com/communities/downtown-brooklyn','https://smarterjustice.com/professional-membership.html']) if (!sitemap.includes(canonical)) errors.push(`sitemap-missing:${canonical}`);

const result = {
  command:'deployment:validate', release:'v2.0.0-pre128', ok:errors.length === 0, errors,
  releaseState:errors.length ? 'NO_RELEASE' : 'QUALIFIED_SUCCESSOR',
  publicCommunityPreview:true, paidMembershipEnrollmentOpen:false, checkoutOpen:false,
  oneConnectedDomainAndBrand:true, publicEvidenceArtifacts:evidenceFiles.length,
  sourceCommit:marker.sourceCommit || '', sourceTree:marker.sourceTree || '', rollbackProductionCommit:marker.rollbackProductionCommit || ''
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ok) process.exitCode = 1;
