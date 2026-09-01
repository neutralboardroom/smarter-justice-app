'use strict';

const store = require('./store');
const { LEGAL_COMMUNITY_NETWORK } = require('../data/legalCommunityNetworkPre126');

const STORE_KEY = 'professionalLegalCommunityPreferences.json';
const activeIds = new Set(LEGAL_COMMUNITY_NETWORK.communities.map(row => row.id));
const knownIds = new Set([...activeIds, ...LEGAL_COMMUNITY_NETWORK.candidateCommunities.map(row => row.id)]);

function clean(value, max = 180) { return String(value == null ? '' : value).trim().slice(0, max); }
function list(value, maxItems = 20) {
  const rows = Array.isArray(value) ? value : String(value || '').split(/\r?\n|,/);
  return [...new Set(rows.map(item => clean(item)).filter(Boolean))].slice(0, maxItems);
}
function initialState() { return { schemaVersion: 'smarter-justice.professional-legal-community-preferences.v1', records: [], updatedAt: '' }; }
function readState() {
  const raw = store.readJson(STORE_KEY, initialState());
  return { ...initialState(), ...(raw && typeof raw === 'object' ? raw : {}), records: Array.isArray(raw?.records) ? raw.records : [] };
}
function writeState(state) {
  const next = { ...state, schemaVersion: 'smarter-justice.professional-legal-community-preferences.v1', updatedAt: store.now() };
  store.writeJson(STORE_KEY, next);
  return next;
}
function empty(accountId) {
  return {
    accountId,
    homeCommunityId: '',
    participatingCommunityIds: [],
    serviceAreas: [],
    localIntelligenceEnabled: true,
    participationUpdatesEnabled: true,
    opportunityUpdatesEnabled: false,
    updatedAt: ''
  };
}
function publicRecord(record) {
  return {
    homeCommunityId: record.homeCommunityId || '',
    participatingCommunityIds: list(record.participatingCommunityIds).filter(id => knownIds.has(id)),
    serviceAreas: list(record.serviceAreas),
    localIntelligenceEnabled: record.localIntelligenceEnabled !== false,
    participationUpdatesEnabled: record.participationUpdatesEnabled !== false,
    opportunityUpdatesEnabled: record.opportunityUpdatesEnabled === true,
    updatedAt: record.updatedAt || '',
    boundaries: {
      officeLocationSeparate: true,
      serviceAreaSeparate: true,
      membershipDoesNotEstablishJurisdiction: true,
      opportunityOptInDoesNotCreateEngagement: true
    }
  };
}
function forAccount(accountId) {
  const id = clean(accountId);
  const state = readState();
  return publicRecord(state.records.find(row => row.accountId === id) || empty(id));
}
function updateForAccount(accountId, input = {}) {
  const id = clean(accountId);
  if (!id) return { error: 'A signed-in professional account is required.' };
  const homeCommunityId = clean(input.homeCommunityId);
  if (homeCommunityId && !activeIds.has(homeCommunityId)) return { error: 'Choose an available home legal community.' };
  const participatingCommunityIds = list(input.participatingCommunityIds).filter(communityId => knownIds.has(communityId) && communityId !== homeCommunityId);
  const serviceAreas = list(input.serviceAreas);
  const state = readState();
  const index = state.records.findIndex(row => row.accountId === id);
  const current = index >= 0 ? state.records[index] : empty(id);
  const next = {
    ...current,
    accountId: id,
    homeCommunityId,
    participatingCommunityIds,
    serviceAreas,
    localIntelligenceEnabled: Object.prototype.hasOwnProperty.call(input, 'localIntelligenceEnabled') ? Boolean(input.localIntelligenceEnabled) : current.localIntelligenceEnabled !== false,
    participationUpdatesEnabled: Object.prototype.hasOwnProperty.call(input, 'participationUpdatesEnabled') ? Boolean(input.participationUpdatesEnabled) : current.participationUpdatesEnabled !== false,
    opportunityUpdatesEnabled: Object.prototype.hasOwnProperty.call(input, 'opportunityUpdatesEnabled') ? Boolean(input.opportunityUpdatesEnabled) : current.opportunityUpdatesEnabled === true,
    updatedAt: store.now()
  };
  if (index >= 0) state.records[index] = next;
  else state.records.push(next);
  writeState(state);
  store.addAudit({
    actor: 'professional-account',
    action: 'professional_legal_community_preferences_updated',
    details: {
      accountId: id,
      homeCommunityId,
      participatingCommunityCount: participatingCommunityIds.length,
      serviceAreaCount: serviceAreas.length,
      opportunityUpdatesEnabled: next.opportunityUpdatesEnabled
    }
  });
  return { preferences: publicRecord(next), message: 'Your legal-community preferences were saved. Office, jurisdiction, service area, membership, and opportunity eligibility remain separate.' };
}

module.exports = { STORE_KEY, forAccount, updateForAccount };
