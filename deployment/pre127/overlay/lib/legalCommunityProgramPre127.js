'use strict';

const pre126 = require('./legalCommunityNetworkPre126');
const { LEGAL_COMMUNITY_PROGRAM_PRE127 } = require('../data/legalCommunityProgramPre127');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function byId(rows, id) { return rows.find(row => row.id === id || row.communityId === id); }
function nowDate(value) { const date = value ? new Date(value) : new Date(); return Number.isNaN(date.getTime()) ? new Date() : date; }
function active(signal, now) { return !signal.expiresAt || new Date(signal.expiresAt).getTime() > now.getTime(); }
function timing(signal, now) { return new Date(signal.startsAt).getTime() > now.getTime() ? 'UPCOMING' : 'CURRENT'; }
function normalizePracticeAreas(value) {
  const allowed = new Set(LEGAL_COMMUNITY_PROGRAM_PRE127.practiceAreas.map(row => row.id));
  const input = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(input.map(row => String(row || '').trim()).filter(row => allowed.has(row)))].slice(0, 10);
}

function mergeSignals(baseSignals, options = {}) {
  const now = nowDate(options.now);
  const audience = String(options.audience || '').toUpperCase();
  const practiceAreaIds = normalizePracticeAreas(options.practiceAreaIds || options.practiceAreaId);
  const corrections = LEGAL_COMMUNITY_PROGRAM_PRE127.sourceCorrections;
  const base = (baseSignals || []).map(signal => ({ ...signal, ...(corrections[signal.id] || {}) }));
  const combined = [...base, ...LEGAL_COMMUNITY_PROGRAM_PRE127.additionalSignals.map(clone)];
  return combined
    .filter(signal => active(signal, now))
    .filter(signal => !audience || (signal.audience || []).includes(audience))
    .filter(signal => !practiceAreaIds.length || !(signal.practiceAreaIds || []).length || signal.practiceAreaIds.some(id => practiceAreaIds.includes(id)))
    .map(signal => ({ ...signal, practiceAreaIds: clone(signal.practiceAreaIds || []), timing: timing(signal, now) }))
    .sort((a, b) => {
      const importance = { HIGH:0, NORMAL:1, LOW:2 };
      const priority = (importance[a.importance] ?? 1) - (importance[b.importance] ?? 1);
      if (priority) return priority;
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });
}

function publicMembership() {
  const base = pre126.publicMembership();
  return {
    ...base,
    plans: clone(LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.plans),
    foundingLaunch: {
      id: LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.id,
      label: LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.label,
      status: LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.status,
      priceAmountsChangedFromPre126: false,
      enrollmentBoundary: LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.enrollmentBoundary,
      guaranteeBoundary: LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.guaranteeBoundary
    },
    positioning: clone(LEGAL_COMMUNITY_PROGRAM_PRE127.strategicPositioning)
  };
}

function listPublicCommunities() {
  return { ...pre126.listPublicCommunities(), positioning: clone(LEGAL_COMMUNITY_PROGRAM_PRE127.strategicPositioning) };
}

function getPublicCommunity(id, options = {}) {
  const community = pre126.getPublicCommunity(id, { ...options, audience:'' });
  if (!community) return null;
  community.currentSignals = mergeSignals(community.currentSignals, options);
  community.currentEdition = clone(byId(LEGAL_COMMUNITY_PROGRAM_PRE127.editions, community.id) || null);
  community.professionalResources = clone(LEGAL_COMMUNITY_PROGRAM_PRE127.professionalResources);
  community.sourceDisclosure = 'Every published item keeps a responsible source, observation date, and review or expiry boundary. Confirm time-sensitive information with the responsible source before relying on it.';
  community.relationshipDisclosure = 'A source link does not imply partnership, endorsement, referral, shared responsibility, or permission to contact anyone for marketing.';
  return community;
}

function linkedinText(edition) {
  const blocks = [edition.linkedin.title, '', edition.linkedin.introduction, ''];
  for (const item of edition.linkedin.highlights) blocks.push(`• ${item}`);
  blocks.push('', edition.linkedin.closing, '', `Read the source-linked brief: ${edition.linkedin.url}`, '', edition.linkedin.hashtags.map(tag => `#${tag}`).join(' '));
  return blocks.join('\n');
}

function shareKit(id) {
  const edition = byId(LEGAL_COMMUNITY_PROGRAM_PRE127.editions, id);
  if (!edition) return null;
  const text = linkedinText(edition);
  return {
    communityId: edition.communityId,
    editionId: edition.id,
    title: edition.linkedin.title,
    linkedinText: text,
    canonicalUrl: edition.linkedin.url,
    publishedAt: edition.publishedAt,
    reviewedAt: edition.reviewedAt,
    reviewDueAt: edition.reviewDueAt,
    correctionsPath: edition.correctionsPath,
    autoPosted: false,
    outreachAuthorized: false,
    privateMatterDataUsed: false,
    characterCount: text.length
  };
}

function memberExperience(id, options = {}) {
  const community = getPublicCommunity(id, { ...options, audience:'PROFESSIONAL', practiceAreaId:'', practiceAreaIds:[] });
  if (!community) return null;
  const practiceAreaIds = normalizePracticeAreas(options.practiceAreaIds || options.practiceAreaId);
  const allProfessionalSignals = community.currentSignals;
  const practiceSignals = practiceAreaIds.length
    ? allProfessionalSignals.filter(signal => !(signal.practiceAreaIds || []).length || signal.practiceAreaIds.some(area => practiceAreaIds.includes(area)))
    : [];
  const resources = LEGAL_COMMUNITY_PROGRAM_PRE127.professionalResources
    .filter(row => !practiceAreaIds.length || !row.practiceAreaIds.length || row.practiceAreaIds.some(area => practiceAreaIds.includes(area)))
    .map(clone);
  return {
    community: {
      id: community.id,
      name: community.name,
      shortName: community.shortName,
      status: community.status,
      canonicalPath: community.canonicalPath,
      parentIds: clone(community.parentIds),
      directorySnapshot: clone(community.directorySnapshot || null)
    },
    edition: clone(community.currentEdition),
    practiceAreaIds,
    practiceAreas: clone(LEGAL_COMMUNITY_PROGRAM_PRE127.practiceAreas),
    todayNearYou: allProfessionalSignals.slice(0, 8),
    forYourPractice: practiceSignals.slice(0, 8),
    professionalResources: resources,
    participationPaths: clone(community.participationPaths),
    firstValueSteps: [
      { id:'review-profile', title:'Review your free public profile', href:'/find-my-profile.html' },
      { id:'choose-community', title:'Choose a home legal community', href:'/professional-community.html#community-settings' },
      { id:'choose-practice', title:'Select the practice areas that shape your local view', href:'/professional-community.html#practice-focus' },
      { id:'read-brief', title:'Review the current source-linked brief', href:'/community-briefs/downtown-brooklyn' },
      { id:'share-brief', title:'Copy a source-linked LinkedIn post when useful', href:'/community-briefs/downtown-brooklyn#share' }
    ],
    privacyBoundary: {
      privateUserMattersUsed: false,
      individualDemandSignalsUsed: false,
      accountPreferencesUsedOnlyWhenSignedIn: true,
      officeLocationServiceAreaAndMembershipSeparate: true
    },
    shareKit: shareKit(id)
  };
}

function validate() {
  const base = pre126.validate();
  const errors = [...base.errors];
  const planMap = Object.fromEntries(LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.plans.map(plan => [plan.id, plan]));
  if (planMap.professional.monthlyDollars !== 10 || planMap.professional.annualDollars !== 100) errors.push('professional-price');
  if (planMap.team.monthlyDollars !== 29 || planMap.team.annualDollars !== 290) errors.push('team-price');
  if (planMap.office.monthlyDollars !== 49 || planMap.office.annualDollars !== 490) errors.push('office-price');
  if (LEGAL_COMMUNITY_PROGRAM_PRE127.foundingOffer.priceProtectionPubliclyPromised !== false) errors.push('price-protection-boundary');
  for (const signal of LEGAL_COMMUNITY_PROGRAM_PRE127.additionalSignals) {
    if (!/^https:\/\//.test(signal.sourceUrl || '')) errors.push(`signal-source:${signal.id}`);
    if (!signal.observedAt || !signal.reviewBy || !signal.expiresAt) errors.push(`signal-currentness:${signal.id}`);
    if (signal.legalAdvice !== false) errors.push(`signal-advice:${signal.id}`);
  }
  for (const edition of LEGAL_COMMUNITY_PROGRAM_PRE127.editions) {
    const kit = shareKit(edition.communityId);
    if (!kit || kit.characterCount > 3000) errors.push(`share-kit:${edition.id}`);
    if (edition.automaticPublishing !== false || edition.humanSourceReviewRequired !== true) errors.push(`editorial-gate:${edition.id}`);
  }
  return { ok:errors.length === 0, errors, activeCommunities:base.communityCount, currentEditions:LEGAL_COMMUNITY_PROGRAM_PRE127.editions.length, additionalSignals:LEGAL_COMMUNITY_PROGRAM_PRE127.additionalSignals.length };
}

module.exports = { validate, listPublicCommunities, getPublicCommunity, publicMembership, memberExperience, shareKit, mergeSignals, normalizePracticeAreas };
