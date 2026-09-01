'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const network = require('../lib/legalCommunityNetworkPre126');
const { LEGAL_COMMUNITY_NETWORK } = require('../data/legalCommunityNetworkPre126');

const validation = network.validate();
assert.equal(validation.ok, true, validation.errors.join(', '));
assert.equal(validation.communityCount, 1);
assert.equal(LEGAL_COMMUNITY_NETWORK.networkModel, 'ONE_CONNECTED_PLATFORM_WITH_NESTED_HYPERLOCAL_COMMUNITIES');
assert.equal(LEGAL_COMMUNITY_NETWORK.principles.profilesRemainFree, true);
assert.equal(LEGAL_COMMUNITY_NETWORK.principles.membershipBuysParticipationNotTrust, true);
assert.equal(LEGAL_COMMUNITY_NETWORK.principles.officeLocationServiceAreaAndMembershipAreSeparate, true);
assert.equal(LEGAL_COMMUNITY_NETWORK.principles.paidOrganicRankProhibited, true);
assert.equal(LEGAL_COMMUNITY_NETWORK.principles.clientGuaranteesProhibited, true);

const community = network.getPublicCommunity('downtown-brooklyn', {
  now: '2026-09-01T12:00:00-04:00',
  audience: 'PROFESSIONAL',
  directorySnapshot: { professionals: 66, firms: 12 }
});
assert(community);
assert.equal(community.status, 'NOW_ORGANIZING');
assert.equal(community.parentIds.join('>'), 'kings-county>new-york-city>new-york-state');
assert.equal(community.directorySnapshot.professionals, 66);
assert.equal(community.boundary.type, 'COURT_CENTERED_SERVICE_AREA');
assert.equal(community.founderOrigin.sourceType, 'FOUNDER_SUPPLIED_FIRST_PARTY_ACCOUNT');
assert(community.founderOrigin.summary.includes('26 Court Street'));
assert(community.currentSignals.length >= 3);
for (const signal of community.currentSignals) {
  assert(signal.sourceUrl.startsWith('https://'));
  assert(signal.observedAt);
  assert(signal.expiresAt);
}

const membership = network.publicMembership();
const prices = Object.fromEntries(membership.plans.map(plan => [plan.id, [plan.monthlyDollars, plan.annualDollars]]));
assert.deepEqual(prices.professional, [10, 100]);
assert.deepEqual(prices.team, [29, 290]);
assert.deepEqual(prices.office, [49, 490]);
assert(membership.boundaries.includes('no hidden organic rank'));
assert.equal(membership.geographyModel.homeCommunity.includes('does not itself claim an office'), true);

const requiredPages = [
  'public/index.html',
  'public/communities.html',
  'public/communities/downtown-brooklyn.html',
  'public/community-briefs/downtown-brooklyn.html',
  'public/attorney-partner-tour.html',
  'public/professional-membership.html',
  'public/es/comunidades.html',
  'public/es/comunidades/downtown-brooklyn.html',
  'public/es/para-abogados.html',
  'public/es/membresia-profesional.html'
];
for (const relative of requiredPages) assert(fs.existsSync(path.join(root, relative)), relative);

const home = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
assert(home.includes('Tell us what happened.'));
assert(home.includes('Legal help starts local'));
assert(home.includes('Join your local Smarter Justice legal community.'));
assert(home.includes('Free to start'));
assert(home.includes('Not sent to lawyers'));

const local = fs.readFileSync(path.join(root, 'public/communities/downtown-brooklyn.html'), 'utf8');
assert(local.includes('Born in front of the Downtown Brooklyn courthouses.'));
assert(local.includes('Rock and Hammer Tax Services'));
assert(local.includes('26 Court Street'));
assert(local.includes('data-community-signals'));
assert(local.includes('data-community-snapshot'));
assert(local.includes('not a law firm, court, government agency, bar association, lawyer-referral service'));

const brief = fs.readFileSync(path.join(root, 'public/community-briefs/downtown-brooklyn.html'), 'utf8');
assert(brief.includes('Share on LinkedIn'));
assert(brief.includes('data-share-linkedin'));
assert(brief.includes('article:modified_time'));

const membershipHtml = fs.readFileSync(path.join(root, 'public/professional-membership.html'), 'utf8');
for (const needle of ['$10', '$100', '$29', '$290', '$49', '$490']) assert(membershipHtml.includes(needle), needle);
assert(membershipHtml.includes('Join Smarter Justice to participate—not merely to be listed.'));
assert(membershipHtml.includes('changes what membership is for—not the listed price'));
assert(!membershipHtml.includes('Stripe'));

const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
for (const endpoint of ['/api/public/legal-communities', '/api/public/legal-community-membership', '/api/professional/legal-community-preferences']) assert(server.includes(endpoint), endpoint);

console.log(JSON.stringify({
  ok: true,
  suite: 'pre126-hyperlocal-legal-community',
  activeCommunities: validation.communityCount,
  candidateCommunities: validation.candidateCount,
  publicPages: requiredPages.length,
  pricesPreserved: true,
  stripeCatalogMutation: false
}, null, 2));
