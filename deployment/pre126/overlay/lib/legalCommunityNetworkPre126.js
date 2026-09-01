'use strict';

const { LEGAL_COMMUNITY_NETWORK } = require('../data/legalCommunityNetworkPre126');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function byId(rows, id) { return rows.find(row => row.id === id || row.slug === id); }
function currentSignals(community, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const audience = String(options.audience || '').toUpperCase();
  return community.currentSignals
    .filter(signal => !audience || signal.audience.includes(audience))
    .filter(signal => !signal.expiresAt || new Date(signal.expiresAt).getTime() > now.getTime())
    .map(signal => ({ ...signal, timing: new Date(signal.startsAt).getTime() > now.getTime() ? 'UPCOMING' : 'CURRENT' }));
}

function validate() {
  const errors = [];
  const communityIds = new Set();
  for (const community of LEGAL_COMMUNITY_NETWORK.communities) {
    if (!community.id || communityIds.has(community.id)) errors.push(`community-id:${community.id || 'missing'}`);
    communityIds.add(community.id);
    if (!community.canonicalPath.startsWith('/communities/')) errors.push(`canonical-path:${community.id}`);
    if (!community.primaryPostalCodes.length) errors.push(`postal-code:${community.id}`);
    for (const collection of ['courts', 'publicResources', 'professionalOrganizations']) {
      for (const row of community[collection]) {
        if (!/^https:\/\//.test(row.url || '')) errors.push(`source-url:${community.id}:${row.id}`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(row.observedAt || '')) errors.push(`observed-at:${community.id}:${row.id}`);
      }
    }
    for (const signal of community.currentSignals) {
      if (!/^https:\/\//.test(signal.sourceUrl || '')) errors.push(`signal-source:${community.id}:${signal.id}`);
      if (!signal.expiresAt) errors.push(`signal-expiry:${community.id}:${signal.id}`);
    }
  }
  if (LEGAL_COMMUNITY_NETWORK.networkModel !== 'ONE_CONNECTED_PLATFORM_WITH_NESTED_HYPERLOCAL_COMMUNITIES') errors.push('network-model');
  if (!LEGAL_COMMUNITY_NETWORK.principles.profilesRemainFree || !LEGAL_COMMUNITY_NETWORK.principles.membershipBuysParticipationNotTrust) errors.push('membership-boundary');
  if (!LEGAL_COMMUNITY_NETWORK.principles.officeLocationServiceAreaAndMembershipAreSeparate) errors.push('geography-boundary');
  return { ok: errors.length === 0, errors, communityCount: communityIds.size, candidateCount: LEGAL_COMMUNITY_NETWORK.candidateCommunities.length };
}

function listPublicCommunities() {
  return {
    networkName: LEGAL_COMMUNITY_NETWORK.networkName,
    model: LEGAL_COMMUNITY_NETWORK.networkModel,
    communities: LEGAL_COMMUNITY_NETWORK.communities.map(community => ({
      id: community.id,
      slug: community.slug,
      name: community.name,
      shortName: community.shortName,
      status: community.status,
      statusLabel: community.statusLabel,
      canonicalPath: community.canonicalPath,
      parentIds: clone(community.parentIds),
      boundary: clone(community.boundary)
    })),
    candidateCommunities: clone(LEGAL_COMMUNITY_NETWORK.candidateCommunities),
    hierarchy: clone(LEGAL_COMMUNITY_NETWORK.hierarchy),
    viabilityStandard: clone(LEGAL_COMMUNITY_NETWORK.viabilityStandard)
  };
}

function getPublicCommunity(id, options = {}) {
  const community = byId(LEGAL_COMMUNITY_NETWORK.communities, id);
  if (!community) return null;
  const result = clone(community);
  result.currentSignals = currentSignals(community, options);
  result.directorySnapshot = options.directorySnapshot || null;
  result.sourceDisclosure = 'Court, event, and organization details are source-linked and date-stamped. Confirm time-sensitive details with the responsible source before relying on them.';
  result.relationshipDisclosure = 'Listing an organization or event does not imply a partnership, endorsement, referral relationship, or shared responsibility.';
  return result;
}

function publicMembership() {
  return {
    ...clone(LEGAL_COMMUNITY_NETWORK.membership),
    geographyModel: {
      homeCommunity: 'The member’s primary local professional community. It does not itself claim an office.',
      participatingCommunities: 'Other communities in which the member chooses to participate.',
      serviceAreas: 'Places the professional says they may serve, subject to jurisdiction, matter fit, conflicts, availability, and engagement.',
      parentCommunities: 'Broader county, city, and state information inherited from the home community.'
    }
  };
}

module.exports = { validate, listPublicCommunities, getPublicCommunity, currentSignals, publicMembership };
