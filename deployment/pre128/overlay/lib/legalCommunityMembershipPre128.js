'use strict';

const store = require('./store');
const pre127 = require('./legalCommunityMembershipPre127');
const program = require('./legalCommunityProgramPre128');

const STORE_KEY = pre127.STORE_KEY;
const SCHEMA_VERSION = 'smarter-justice.professional-legal-community-preferences.v3';
const publishedCommunityIds = new Set(program.listPublicCommunities().communities.map(row => row.id));
const practiceAreaIds = new Set(program.memberExperience('downtown-brooklyn', { now:'2026-09-03T12:00:00-04:00' }).practiceAreas.map(row => row.id));
const has = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

function clean(value, max = 180) { return String(value == null ? '' : value).trim().slice(0, max); }
function list(value, maxItems = 20) {
  const rows = Array.isArray(value) ? value : String(value || '').split(/\r?\n|,/);
  return [...new Set(rows.map(item => clean(item)).filter(Boolean))].slice(0, maxItems);
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
function readState() {
  const raw = store.readJson(STORE_KEY, { schemaVersion:SCHEMA_VERSION, records:[], updatedAt:'' });
  return {
    schemaVersion:SCHEMA_VERSION,
    records:Array.isArray(raw?.records) ? raw.records : [],
    updatedAt:raw?.updatedAt || ''
  };
}
function writeState(state) {
  const next = { ...state, schemaVersion:SCHEMA_VERSION, updatedAt:store.now() };
  store.writeJson(STORE_KEY, next);
  return next;
}
function publicRecord(record) {
  const row = { ...empty(clean(record?.accountId)), ...(record || {}) };
  return {
    homeCommunityId:publishedCommunityIds.has(row.homeCommunityId) ? row.homeCommunityId : '',
    participatingCommunityIds:list(row.participatingCommunityIds).filter(id => publishedCommunityIds.has(id) && id !== row.homeCommunityId),
    serviceAreas:list(row.serviceAreas),
    practiceAreaIds:list(row.practiceAreaIds, 10).filter(id => practiceAreaIds.has(id)),
    localIntelligenceEnabled:row.localIntelligenceEnabled !== false,
    participationUpdatesEnabled:row.participationUpdatesEnabled !== false,
    opportunityUpdatesEnabled:row.opportunityUpdatesEnabled === true,
    updatedAt:row.updatedAt || '',
    meanings:{
      homeCommunity:'A selected local community view; not an office, license, service area, membership, or jurisdiction claim.',
      participatingCommunities:'Other published communities selected separately. Unpublished research areas cannot be selected.',
      serviceAreas:'Professional-supplied places the professional may serve, subject to law, licensing, conflicts, fit, availability, and engagement.'
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
  const state = readState();
  const index = state.records.findIndex(row => row.accountId === id);
  const current = { ...empty(id), ...(index >= 0 ? state.records[index] : {}) };

  const homeCommunityId = has(input, 'homeCommunityId') ? clean(input.homeCommunityId) : clean(current.homeCommunityId);
  if (homeCommunityId && !publishedCommunityIds.has(homeCommunityId)) return { error:'Choose a published home legal community.' };

  const participatingCommunityIds = has(input, 'participatingCommunityIds')
    ? list(input.participatingCommunityIds).filter(communityId => publishedCommunityIds.has(communityId) && communityId !== homeCommunityId)
    : list(current.participatingCommunityIds).filter(communityId => publishedCommunityIds.has(communityId) && communityId !== homeCommunityId);
  const serviceAreas = has(input, 'serviceAreas') ? list(input.serviceAreas) : list(current.serviceAreas);
  const selectedPracticeAreaIds = has(input, 'practiceAreaIds')
    ? list(input.practiceAreaIds, 10).filter(practiceAreaId => practiceAreaIds.has(practiceAreaId))
    : list(current.practiceAreaIds, 10).filter(practiceAreaId => practiceAreaIds.has(practiceAreaId));

  const next = {
    ...current,
    accountId:id,
    homeCommunityId,
    participatingCommunityIds,
    serviceAreas,
    practiceAreaIds:selectedPracticeAreaIds,
    localIntelligenceEnabled:has(input, 'localIntelligenceEnabled') ? Boolean(input.localIntelligenceEnabled) : current.localIntelligenceEnabled !== false,
    participationUpdatesEnabled:has(input, 'participationUpdatesEnabled') ? Boolean(input.participationUpdatesEnabled) : current.participationUpdatesEnabled !== false,
    opportunityUpdatesEnabled:has(input, 'opportunityUpdatesEnabled') ? Boolean(input.opportunityUpdatesEnabled) : current.opportunityUpdatesEnabled === true,
    updatedAt:store.now()
  };
  if (index >= 0) state.records[index] = next;
  else state.records.push(next);
  writeState(state);
  store.addAudit({
    actor:'professional-account',
    action:'professional_legal_community_preferences_updated',
    details:{
      accountId:id,
      fieldsSupplied:Object.keys(input).filter(key => ['homeCommunityId','participatingCommunityIds','serviceAreas','practiceAreaIds','localIntelligenceEnabled','participationUpdatesEnabled','opportunityUpdatesEnabled'].includes(key)).sort(),
      homeCommunityId,
      participatingCommunityCount:participatingCommunityIds.length,
      serviceAreaCount:serviceAreas.length,
      practiceAreaCount:selectedPracticeAreaIds.length,
      privateMatterDataUsed:false
    }
  });
  return {
    preferences:publicRecord(next),
    message:'Your community view and practice-focus settings were saved. Office, license, jurisdiction, service area, community selection, profile facts, membership, and opportunity eligibility remain separate.'
  };
}

module.exports = { STORE_KEY, SCHEMA_VERSION, forAccount, updateForAccount };
