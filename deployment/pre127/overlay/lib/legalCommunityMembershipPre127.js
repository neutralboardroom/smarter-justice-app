'use strict';

const store = require('./store');
const pre126 = require('./legalCommunityMembershipPre126');
const program = require('./legalCommunityProgramPre127');

const STORE_KEY = pre126.STORE_KEY;
const SCHEMA_VERSION = 'smarter-justice.professional-legal-community-preferences.v2';
const activeCommunityIds = new Set(program.listPublicCommunities().communities.map(row => row.id));
const knownCommunityIds = new Set([
  ...activeCommunityIds,
  ...program.listPublicCommunities().candidateCommunities.map(row => row.id)
]);
const practiceAreaIds = new Set(program.memberExperience('downtown-brooklyn', { now:'2026-09-01T12:00:00-04:00' }).practiceAreas.map(row => row.id));

function clean(value, max = 180) { return String(value == null ? '' : value).trim().slice(0, max); }
function list(value, maxItems = 20) {
  const rows = Array.isArray(value) ? value : String(value || '').split(/\r?\n|,/);
  return [...new Set(rows.map(item => clean(item)).filter(Boolean))].slice(0, maxItems);
}
function initialState() { return { schemaVersion:SCHEMA_VERSION, records:[], updatedAt:'' }; }
function readState() {
  const raw = store.readJson(STORE_KEY, initialState());
  return { ...initialState(), ...(raw && typeof raw === 'object' ? raw : {}), records:Array.isArray(raw?.records) ? raw.records : [] };
}
function writeState(state) {
  const next = { ...state, schemaVersion:SCHEMA_VERSION, updatedAt:store.now() };
  store.writeJson(STORE_KEY, next);
  return next;
}
function empty(accountId) {
  return {
    accountId,
    homeCommunityId:'',
    participatingCommunityIds:[],
    serviceAreas:[],
    practiceAreaIds:[],
    localIntelligenceEnabled:true,
    participationUpdatesEnabled:true,
    opportunityUpdatesEnabled:false,
    updatedAt:''
  };
}
function publicRecord(record) {
  return {
    homeCommunityId:activeCommunityIds.has(record.homeCommunityId) ? record.homeCommunityId : '',
    participatingCommunityIds:list(record.participatingCommunityIds).filter(id => knownCommunityIds.has(id)),
    serviceAreas:list(record.serviceAreas),
    practiceAreaIds:list(record.practiceAreaIds, 10).filter(id => practiceAreaIds.has(id)),
    localIntelligenceEnabled:record.localIntelligenceEnabled !== false,
    participationUpdatesEnabled:record.participationUpdatesEnabled !== false,
    opportunityUpdatesEnabled:record.opportunityUpdatesEnabled === true,
    updatedAt:record.updatedAt || '',
    boundaries:{
      officeLocationSeparate:true,
      serviceAreaSeparate:true,
      membershipDoesNotEstablishJurisdiction:true,
      opportunityOptInDoesNotCreateEngagement:true,
      privateUserMattersNotUsedForPersonalization:true
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
  if (!id) return { error:'A signed-in professional account is required.' };
  const homeCommunityId = clean(input.homeCommunityId);
  if (homeCommunityId && !activeCommunityIds.has(homeCommunityId)) return { error:'Choose an available home legal community.' };
  const participatingCommunityIds = list(input.participatingCommunityIds).filter(communityId => knownCommunityIds.has(communityId) && communityId !== homeCommunityId);
  const serviceAreas = list(input.serviceAreas);
  const selectedPracticeAreaIds = list(input.practiceAreaIds, 10).filter(practiceAreaId => practiceAreaIds.has(practiceAreaId));
  const state = readState();
  const index = state.records.findIndex(row => row.accountId === id);
  const current = index >= 0 ? state.records[index] : empty(id);
  const next = {
    ...current,
    accountId:id,
    homeCommunityId,
    participatingCommunityIds,
    serviceAreas,
    practiceAreaIds:selectedPracticeAreaIds,
    localIntelligenceEnabled:Object.prototype.hasOwnProperty.call(input, 'localIntelligenceEnabled') ? Boolean(input.localIntelligenceEnabled) : current.localIntelligenceEnabled !== false,
    participationUpdatesEnabled:Object.prototype.hasOwnProperty.call(input, 'participationUpdatesEnabled') ? Boolean(input.participationUpdatesEnabled) : current.participationUpdatesEnabled !== false,
    opportunityUpdatesEnabled:Object.prototype.hasOwnProperty.call(input, 'opportunityUpdatesEnabled') ? Boolean(input.opportunityUpdatesEnabled) : current.opportunityUpdatesEnabled === true,
    updatedAt:store.now()
  };
  if (index >= 0) state.records[index] = next;
  else state.records.push(next);
  writeState(state);
  store.addAudit({
    actor:'professional-account',
    action:'professional_legal_community_preferences_v2_updated',
    details:{
      accountId:id,
      homeCommunityId,
      participatingCommunityCount:participatingCommunityIds.length,
      serviceAreaCount:serviceAreas.length,
      practiceAreaCount:selectedPracticeAreaIds.length,
      opportunityUpdatesEnabled:next.opportunityUpdatesEnabled,
      privateMatterDataUsed:false
    }
  });
  return {
    preferences:publicRecord(next),
    message:'Your legal-community and practice-focus settings were saved. Office, jurisdiction, service area, membership, profile evidence, and opportunity eligibility remain separate.'
  };
}

module.exports = { STORE_KEY, SCHEMA_VERSION, forAccount, updateForAccount };
