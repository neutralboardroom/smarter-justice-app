'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const runtime = path.join(root, '.runtime', 'pre125-live');
const bootstrap = path.join(root, 'scripts', 'bootstrap-pre125-release.js');
if (!fs.existsSync(path.join(runtime, '.pre125-render-bootstrap.json'))) {
  const build = spawnSync(process.execPath, [bootstrap], { cwd: root, env: process.env, encoding: 'utf8' });
  if (build.stdout) process.stdout.write(build.stdout);
  if (build.status !== 0) throw new Error(build.stderr || 'PRE125 bootstrap failed');
}
const read = relative => fs.readFileSync(path.join(runtime, relative), 'utf8');
const json = relative => JSON.parse(read(relative));

const marker = json('.pre125-render-bootstrap.json');
assert.strictEqual(marker.release, 'v2.0.0-pre125');
assert.strictEqual(marker.baseRelease, 'v2.0.0-pre124');
assert.strictEqual(marker.productAuthority, 'SMARTER_JUSTICE_ONLY');
assert.strictEqual(marker.singleBuilderReleaseOwner, true);
assert.strictEqual(marker.internalLaneCount, 6);
assert.strictEqual(marker.navigatorOrCommunityMutation, false);
assert.strictEqual(marker.newStripeSetup, false);
assert.strictEqual(marker.newStripeProviderMutation, false);
assert.strictEqual(marker.environmentVariableMutation, false);

const receipt = json('PRE125_COMPLETION_RECEIPT.json');
assert.strictEqual(receipt.oneAuthoritativeBuilder, true);
assert.strictEqual(receipt.internalLaneCount, 6);
assert.strictEqual(receipt.noLossFromPredecessor, true);
assert.strictEqual(receipt.predecessorUnchangedFilesHashVerified, true);
assert.strictEqual(receipt.newStripeSetup, false);
assert.strictEqual(receipt.newStripeCatalogMutation, false);
assert.strictEqual(receipt.contactabilityConsentSeparated, true);
assert.strictEqual(receipt.replaceNotAppendProfileQualification, true);

const governance = json('governance/ONE_BUILDER_INTERNAL_LANES.json');
assert.strictEqual(governance.releaseOwner, 'ONE_SMARTER_JUSTICE_BUILDER');
assert.strictEqual(governance.singleAuthoritativeRelease, true);
assert.strictEqual(governance.lanes.length, 6);
assert.deepStrictEqual(governance.lanes.map(row => row.id), [
  'PRODUCT_UX',
  'LEGAL_CURRENTNESS',
  'PROFILE_EVIDENCE',
  'REVENUE_MEMBERSHIP',
  'OPPORTUNITY_INTELLIGENCE',
  'RELEASE_QA'
]);

const operating = require(path.join(runtime, 'lib', 'oneBuilderOperatingSystem.js'));
assert.strictEqual(operating.LANE_IDS.length, 6);
assert.strictEqual(operating.laneRegistry().length, 6);

const freeAccess = operating.normalizeProfessionalAccess({ membershipStatus: 'free' });
assert.strictEqual(freeAccess.freePublicListing, true);
assert.strictEqual(freeAccess.publicBusinessContactVisible, true);
assert.strictEqual(freeAccess.paidMember, false);
assert.strictEqual(freeAccess.consultationScheduling, false);
assert.strictEqual(freeAccess.documentFormReview, false);
assert.strictEqual(freeAccess.opportunityEligible, false);
assert.strictEqual(freeAccess.credentialTruthIndependentOfPayment, true);
assert.strictEqual(freeAccess.organicRelevanceIndependentOfPayment, true);

const paidAccess = operating.normalizeProfessionalAccess({
  membershipStatus: 'active',
  opportunityOptIn: true,
  availability: 'available',
  credentialPointOfUse: 'current',
  jurisdictionReady: true
});
assert.strictEqual(paidAccess.paidMember, true);
assert.strictEqual(paidAccess.consultationScheduling, true);
assert.strictEqual(paidAccess.structuredInquiries, true);
assert.strictEqual(paidAccess.documentFormReview, true);
assert.strictEqual(paidAccess.opportunityEligible, true);
assert.strictEqual(paidAccess.guaranteedClients, false);

const contactRecord = {
  email: 'public@example.org',
  sourceClass: 'FIRST_PARTY',
  routeClass: 'PROFILE_BOUND_UNRESTRICTED_PUBLIC_BUSINESS_ROUTE',
  sourceUrl: 'https://example.org/contact',
  observedAt: '2026-08-31T00:00:00Z'
};
const contactOnly = operating.qualifyContactability(contactRecord, {});
assert.strictEqual(contactOnly.contactable, true);
assert.strictEqual(contactOnly.outreachEligible, false);
assert.strictEqual(contactOnly.contactabilityIsConsent, false);
const authorizedContact = operating.qualifyContactability(contactRecord, {
  campaignAuthorized: true,
  lawfulBasis: 'LEGITIMATE_INTEREST_REVIEWED',
  suppressionChecked: true,
  suppressed: false,
  purpose: 'PROFESSIONAL_MEMBERSHIP_INTRODUCTION',
  frequencyApproved: true
});
assert.strictEqual(authorizedContact.outreachEligible, true);
const guessedContact = operating.qualifyContactability({ ...contactRecord, guessed: true }, {
  campaignAuthorized: true,
  lawfulBasis: 'REVIEWED',
  suppressionChecked: true,
  purpose: 'PROFESSIONAL_MEMBERSHIP_INTRODUCTION',
  frequencyApproved: true
});
assert.strictEqual(guessedContact.contactable, false);
assert.strictEqual(guessedContact.outreachEligible, false);

const projection = operating.validateProfileProjection({
  mode: 'REPLACE_NOT_APPEND',
  records: [
    { profileId: 'NY-OCA-1001', sourceUrl: 'https://official.example/1001', observedAt: '2026-08-31' },
    { profileId: 'NY-OCA-1002', sourceUrl: 'https://official.example/1002', observedAt: '2026-08-31' }
  ],
  retiredProfileIds: ['legacy-1001'],
  redirects: [{ retiredProfileId: 'legacy-1001', canonicalProfileId: 'NY-OCA-1001' }],
  currentnessHolds: [{ profileId: 'NY-OCA-1002', reason: 'TARGETED_RECHECK_REQUIRED' }],
  downstreamState: {
    claims: 'PRESERVE', corrections: 'PRESERVE', suppressions: 'PRESERVE',
    reviews: 'PRESERVE', memberships: 'PRESERVE', customerState: 'PRESERVE'
  }
});
assert.strictEqual(projection.ok, true);
assert.strictEqual(projection.mode, 'REPLACE_NOT_APPEND');
assert.strictEqual(projection.readyProfiles, 2);
assert.strictEqual(projection.redirects, 1);
assert.strictEqual(projection.holds, 1);
assert.strictEqual(projection.downstreamStatePreserved, true);
assert.throws(() => operating.validateProfileProjection({
  mode: 'APPEND', records: []
}), /REPLACE_NOT_APPEND/);
assert.throws(() => operating.validateProfileProjection({
  mode: 'REPLACE_NOT_APPEND',
  records: [
    { profileId: 'duplicate', sourceUrl: 'https://official.example/1', observedAt: '2026-08-31' },
    { profileId: 'duplicate', sourceUrl: 'https://official.example/2', observedAt: '2026-08-31' }
  ]
}), /Duplicate canonical/);

for (const type of operating.OPPORTUNITY_TYPES) {
  const opportunity = operating.createOpportunity({
    opportunityId: `opp_${type.toLowerCase()}`,
    type,
    userConsent: true,
    userConsentAt: '2026-08-31T12:00:00Z',
    userSelectedSharing: true,
    jurisdiction: 'NY',
    practiceArea: 'FAMILY_LAW',
    summary: 'User-prepared request with minimum necessary information.',
    secureDocumentReference: type === 'DOCUMENT_FORM_REVIEW' ? 'secure://doc/reference' : null
  });
  assert.strictEqual(opportunity.status, 'PREPARED_USER_CONTROLLED');
  assert.strictEqual(opportunity.noAttorneyClientRelationshipCreated, true);
  const professional = {
    professionalId: 'NY-OCA-1001',
    membershipStatus: 'active',
    opportunityOptIn: true,
    availability: 'available',
    credentialPointOfUse: 'current',
    jurisdictionReady: true,
    conflictCleared: true,
    jurisdictions: ['NY'],
    practiceAreas: ['FAMILY_LAW']
  };
  const qualification = operating.qualifyProfessionalForOpportunity(professional, opportunity);
  assert.strictEqual(qualification.eligible, true);
  assert.strictEqual(qualification.paymentChangedCredentialTruth, false);
  const assignment = operating.assignOpportunity(opportunity, professional, {
    userAssignmentConsent: true,
    userAssignmentConsentAt: '2026-08-31T12:05:00Z'
  });
  assert.strictEqual(assignment.status, 'ASSIGNED_PENDING_PROFESSIONAL_ACCEPTANCE');
  assert.strictEqual(assignment.noGuaranteedEngagement, true);
}
assert.throws(() => operating.createOpportunity({
  type: 'CONSULTATION', jurisdiction: 'NY', userSelectedSharing: true
}), /Explicit user consent/);

const releaseReceipts = operating.LANE_IDS.map(laneId => ({ laneId, status: 'PASS' }));
const releaseDecision = operating.qualifyMaterialRelease(releaseReceipts);
assert.strictEqual(releaseDecision.ok, true);
assert.strictEqual(releaseDecision.singleReleaseOwner, true);
assert.strictEqual(releaseDecision.authorityMerged, false);
assert.strictEqual(operating.qualifyMaterialRelease(releaseReceipts.slice(1)).ok, false);

const page = read('public/professional-opportunities.html');
for (const phrase of [
  'Free public listings',
  'Active members may turn on scheduling',
  'document or form review opportunities',
  'Membership does not buy credentials',
  'People stay in control',
  'No automatic attorney-client relationship'
]) assert(page.includes(phrase), `public opportunity page is missing: ${phrase}`);
assert(!/PRE125|ONE_BUILDER|RELEASE_QA|NO_GO|deployment diagnostics|owner workbench/i.test(page));

function visibleText(html) {
  return String(html)
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}
const htmlFiles = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(absolute);
  }
};
walk(path.join(runtime, 'public'));
for (const file of htmlFiles) {
  const text = visibleText(fs.readFileSync(file, 'utf8'));
  assert(!/\bPRE125\b|ONE_BUILDER|RELEASE_QA|\bNO_GO\b|deployment diagnostics|owner workbench/i.test(text), `internal language in ${path.relative(runtime, file)}`);
}

const membership = read('public/professional-membership.html');
for (const price of ['$10', '$100', '$29', '$290', '$49', '$490']) assert(membership.includes(price), `approved price missing: ${price}`);
assert(membership.includes('data-professional-opportunity-link="true"'));
assert(read('public/attorney-partner-tour.html').includes('data-professional-opportunity-link="true"'));

const validation = spawnSync(process.execPath, [path.join(runtime, 'scripts', 'validate-pre125-deployment-kit.js')], { cwd: runtime, env: process.env, encoding: 'utf8' });
if (validation.stdout) process.stdout.write(validation.stdout);
assert.strictEqual(validation.status, 0, validation.stderr || 'PRE125 deployment validator failed');

console.log(JSON.stringify({
  ok: true,
  release: marker.release,
  baseRelease: marker.baseRelease,
  internalLanes: governance.lanes.length,
  professionalOpportunityTypes: operating.OPPORTUNITY_TYPES,
  freeListingPreserved: freeAccess.freePublicListing,
  paidOpportunityEligibilityProven: paidAccess.opportunityEligible,
  contactabilityConsentSeparated: contactOnly.contactabilityIsConsent === false,
  replaceNotAppendProjectionProven: projection.ok,
  publicHtmlFilesChecked: htmlFiles.length,
  newStripeSetup: marker.newStripeSetup
}, null, 2));
