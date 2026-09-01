'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const temporaryStorage = fs.mkdtempSync(path.join(os.tmpdir(), 'sj-pre127-test-'));
process.env.NODE_ENV = 'test';
delete process.env.RENDER;
delete process.env.DATABASE_URL;
process.env.SMARTER_JUSTICE_STORAGE_DIR = temporaryStorage;

try {
  const program = require('../lib/legalCommunityProgramPre127');
  const membershipStore = require('../lib/legalCommunityMembershipPre127');
  const { LEGAL_COMMUNITY_PROGRAM_PRE127 } = require('../data/legalCommunityProgramPre127');

  const validation = program.validate();
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(validation.activeCommunities, 1);
  assert.equal(validation.currentEditions, 1);
  assert.equal(LEGAL_COMMUNITY_PROGRAM_PRE127.strategicPositioning.profileRole.includes('free factual identity layer'), true);
  assert.equal(LEGAL_COMMUNITY_PROGRAM_PRE127.strategicPositioning.networkModel, 'ONE_SMARTER_JUSTICE_BRAND_AND_ACCOUNT_WITH_NESTED_HYPERLOCAL_COMMUNITIES');
  assert.equal(LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.priceAmountsChangedFromPre126, false);
  assert.equal(LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.priceProtectionPubliclyPromised, false);
  assert.equal(LEGAL_COMMUNITY_PROGRAM_PRE127.publishingStandard.autoPublish, false);
  assert.equal(LEGAL_COMMUNITY_PROGRAM_PRE127.publishingStandard.privateMatterContentProhibited, true);
  assert.equal(LEGAL_COMMUNITY_PROGRAM_PRE127.publishingStandard.massDirectMessagingNotAuthorized, true);

  const publicMembership = program.publicMembership();
  const prices = Object.fromEntries(publicMembership.plans.map(plan => [plan.id, [plan.monthlyDollars, plan.annualDollars, plan.seats]]));
  assert.deepEqual(prices.professional, [10, 100, 1]);
  assert.deepEqual(prices.team, [29, 290, 5]);
  assert.deepEqual(prices.office, [49, 490, 15]);
  assert.equal(publicMembership.foundingLaunch.priceAmountsChangedFromPre126, false);
  assert(publicMembership.foundingLaunch.guaranteeBoundary.includes('does not guarantee'));

  const community = program.getPublicCommunity('downtown-brooklyn', {
    now:'2026-09-01T12:00:00-04:00',
    audience:'PROFESSIONAL',
    directorySnapshot:{ professionals:66, firms:12 }
  });
  assert(community);
  assert.equal(community.currentEdition.status, 'PUBLISHED_CURRENT');
  assert.equal(community.directorySnapshot.professionals, 66);
  assert(community.currentSignals.length >= 8);
  assert.equal(new Set(community.currentSignals.map(row => row.id)).size, community.currentSignals.length);
  for (const signal of community.currentSignals) {
    assert(signal.sourceUrl.startsWith('https://'), signal.id);
    assert(signal.observedAt, signal.id);
    assert(signal.reviewBy, signal.id);
    assert(signal.expiresAt, signal.id);
    assert.equal(signal.legalAdvice === true, false, signal.id);
  }

  const experience = program.memberExperience('downtown-brooklyn', {
    now:'2026-09-01T12:00:00-04:00',
    practiceAreaIds:['civil-litigation']
  });
  assert(experience);
  assert.deepEqual(experience.practiceAreaIds, ['civil-litigation']);
  assert(experience.forYourPractice.some(row => row.id === 'kings-civil-part-6-update-2026-08'));
  assert(experience.professionalResources.some(row => row.id === 'kings-uniform-motion-rules'));
  assert.equal(experience.privacyBoundary.privateUserMattersUsed, false);
  assert.equal(experience.privacyBoundary.individualDemandSignalsUsed, false);
  assert.equal(experience.firstValueSteps.length, 5);

  const kit = program.shareKit('downtown-brooklyn');
  assert(kit);
  assert(kit.linkedinText.includes('Read the source-linked brief:'));
  assert(kit.linkedinText.includes('#DowntownBrooklyn'));
  assert(kit.characterCount > 200 && kit.characterCount <= 3000);
  assert.equal(kit.autoPosted, false);
  assert.equal(kit.outreachAuthorized, false);
  assert.equal(kit.privateMatterDataUsed, false);

  const saved = membershipStore.updateForAccount('test-professional-pre127', {
    homeCommunityId:'downtown-brooklyn',
    participatingCommunityIds:['downtown-brooklyn', 'williamsburg-greenpoint'],
    serviceAreas:['Brooklyn', 'Queens', 'Brooklyn'],
    practiceAreaIds:['civil-litigation', 'housing', 'unknown'],
    localIntelligenceEnabled:true,
    participationUpdatesEnabled:false,
    opportunityUpdatesEnabled:true
  });
  assert(!saved.error);
  assert.equal(saved.preferences.homeCommunityId, 'downtown-brooklyn');
  assert.deepEqual(saved.preferences.participatingCommunityIds, ['williamsburg-greenpoint']);
  assert.deepEqual(saved.preferences.serviceAreas, ['Brooklyn', 'Queens']);
  assert.deepEqual(saved.preferences.practiceAreaIds, ['civil-litigation', 'housing']);
  assert.equal(saved.preferences.boundaries.privateUserMattersNotUsedForPersonalization, true);
  assert.equal(membershipStore.SCHEMA_VERSION, 'smarter-justice.professional-legal-community-preferences.v2');

  const requiredPages = [
    'public/professional-community.html',
    'public/es/comunidad-profesional.html',
    'public/professional-membership.html',
    'public/es/membresia-profesional.html',
    'public/attorney-partner-tour.html',
    'public/es/para-abogados.html',
    'public/communities.html',
    'public/es/comunidades.html',
    'public/communities/downtown-brooklyn.html',
    'public/es/comunidades/downtown-brooklyn.html',
    'public/community-briefs/downtown-brooklyn.html'
  ];
  for (const relative of requiredPages) assert(fs.existsSync(path.join(root, relative)), relative);

  const memberHome = fs.readFileSync(path.join(root, 'public/professional-community.html'), 'utf8');
  assert(memberHome.includes('data-professional-community-workspace'));
  assert(memberHome.includes('What matters around your local practice today.'));
  assert(memberHome.includes('without using or exposing any private Smarter Justice user matter'));
  assert(memberHome.includes('/pre127-community.js'));

  const spanishMemberHome = fs.readFileSync(path.join(root, 'public/es/comunidad-profesional.html'), 'utf8');
  assert(spanishMemberHome.includes('data-professional-community-workspace'));
  assert(spanishMemberHome.includes('/pre127-community.js'));
  const spanishCommunity = fs.readFileSync(path.join(root, 'public/es/comunidades/downtown-brooklyn.html'), 'utf8');
  assert(spanishCommunity.includes('data-community-updated'));
  assert(spanishCommunity.includes('/es/comunidad-profesional.html'));
  assert(spanishCommunity.includes('/pre127-community.js'));

  const tour = fs.readFileSync(path.join(root, 'public/attorney-partner-tour.html'), 'utf8');
  const membershipPage = fs.readFileSync(path.join(root, 'public/professional-membership.html'), 'utf8');
  for (const amount of ['$10', '$100', '$29', '$290', '$49', '$490']) {
    assert(tour.includes(amount), `tour:${amount}`);
    assert(membershipPage.includes(amount), `membership:${amount}`);
  }
  assert(membershipPage.includes('does not create a new payment product or promise price protection'));
  assert(membershipPage.includes('No plan buys credentials, verification, endorsement, organic rank, guaranteed clients, or results.'));

  const brief = fs.readFileSync(path.join(root, 'public/community-briefs/downtown-brooklyn.html'), 'utf8');
  assert(brief.includes('data-copy-post'));
  assert(brief.includes('data-share-draft'));
  assert(brief.includes('Nothing is posted automatically'));

  const browser = fs.readFileSync(path.join(root, 'public/pre127-community.js'), 'utf8');
  assert(browser.includes("params.append('practice', id)"));
  assert(browser.includes("/^\\d{4}-\\d{2}-\\d{2}$/"));
  assert(browser.includes('/member-preview'));
  assert(browser.includes('/share-kit'));

  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  for (const endpoint of [
    '/api/public/legal-communities',
    '/api/public/legal-community-membership',
    '/member-preview',
    '/share-kit',
    '/api/professional/legal-community-preferences'
  ]) assert(server.includes(endpoint), endpoint);

  const home = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  assert(home.includes('Tell us what happened.'));
  assert(home.includes('Not sent to lawyers'));

  const strategy = fs.readFileSync(path.join(root, 'strategy/SMARTER_JUSTICE_HYPERLOCAL_LEGAL_COMMUNITY_STRATEGY_PRE127.md'), 'utf8');
  assert(strategy.includes("The core idea—organize Smarter Justice as hyperlocal legal communities rather than primarily sell attorney profiles—is Roger's idea."));
  assert(strategy.includes('Rock and Hammer Tax Services'));
  assert(strategy.includes('26 Court Street'));
  assert(strategy.includes('Do not redesign the homepage'));

  console.log(JSON.stringify({
    ok:true,
    suite:'pre127-professional-community',
    activeCommunities:validation.activeCommunities,
    currentSignals:community.currentSignals.length,
    firstValueSteps:experience.firstValueSteps.length,
    pricesPreserved:true,
    privateMatterPersonalization:false,
    automaticLinkedInPosting:false,
    stripeCatalogMutation:false
  }, null, 2));
} finally {
  fs.rmSync(temporaryStorage, { recursive:true, force:true });
}
