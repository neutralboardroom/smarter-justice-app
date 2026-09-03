'use strict';

const pre127 = require('./legalCommunityProgramPre127');
const { LEGAL_COMMUNITY_PROGRAM_PRE128 } = require('../data/legalCommunityProgramPre128');

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function cleanSourceLanguage(value) {
  return String(value || '')
    .replace(/source-linked/gi, 'source-backed')
    .replace(/\bresponsible sources\b/gi, 'original sources')
    .replace(/\bresponsible source\b/gi, 'original source')
    .replace(/\breview or expiry boundary\b/gi, 'date to check or remove the item')
    .replace(/\breview boundary\b/gi, 'next review date')
    .replace(/\ba original source\b/gi, 'an original source')
    .replace(/first[- ]value/gi, 'getting started');
}

function sanitizeSignal(signal) {
  const row = clone(signal);
  row.title = cleanSourceLanguage(row.title);
  row.summary = cleanSourceLanguage(row.summary);
  return row;
}

function publicMembership() {
  const config = LEGAL_COMMUNITY_PROGRAM_PRE128;
  return {
    enrollmentAvailable:false,
    checkoutAvailable:false,
    statusLabel:'Membership enrollment is not open',
    statusMessage:'The community experience is available to explore without payment. Smarter Justice is not accepting membership payments or issuing paid access in this release.',
    freeProfile:{
      price:0,
      includes:['public facts with original source links','business contact information where published','eligible correction requests','profile-control review','ordinary unpaid discovery']
    },
    plannedPlans:clone(config.pricing.plans),
    pricingDisclosure:config.pricing.disclosure,
    availableNow:clone(config.benefitAvailability.filter(row => row.state === 'AVAILABLE')),
    notOpen:clone(config.benefitAvailability.filter(row => row.state !== 'AVAILABLE')),
    boundaries:[
      'Payment never establishes identity, credentials, verification, specialty, office location, license, endorsement, or organic position.',
      'No plan guarantees inquiries, matters, clients, fees, revenue, or results.',
      'A user chooses whether to contact a professional. A professional independently decides whether to respond or accept a matter.',
      'An attorney-client relationship requires separate mutual acceptance and terms.'
    ],
    geographyModel:clone(config.geography),
    organizationBoundary:clone(config.organizationBoundary)
  };
}

function listPublicCommunities() {
  const base = pre127.listPublicCommunities();
  return {
    networkName:'Smarter Justice Legal Communities',
    model:'One connected Smarter Justice platform with hyperlocal community views.',
    communities:(base.communities || []).map(row => ({
      id:row.id,
      slug:row.slug,
      name:row.name,
      shortName:row.shortName,
      statusLabel:'Organizing',
      canonicalPath:row.canonicalPath,
      parentPlaces:['Brooklyn / Kings County','New York City','New York'],
      boundary:{ summary:row.boundary?.summary || '', disclosure:row.boundary?.disclosure || LEGAL_COMMUNITY_PROGRAM_PRE128.organizationBoundary.description }
    })),
    availability:{ publishedCommunities:(base.communities || []).length, otherAreasPublished:0, explanation:'Downtown Brooklyn / Civic Center is the only published community. Other possible areas remain unpublished research, not active communities or chapters.' },
    positioning:clone(LEGAL_COMMUNITY_PROGRAM_PRE128.positioning)
  };
}

function getPublicCommunity(id, options = {}) {
  const base = pre127.getPublicCommunity(id, options);
  if (!base) return null;
  const community = clone(base);
  community.statusLabel = 'Organizing';
  delete community.status;
  if (community.boundary) delete community.boundary.type;
  community.currentSignals = (community.currentSignals || []).map(sanitizeSignal);
  community.sourceDisclosure = 'Each published item links to its original source and shows when Smarter Justice last checked it. Confirm time-sensitive information with that source before relying on it.';
  community.relationshipDisclosure = 'Linking to an organization does not mean it sponsors, endorses, or partners with Smarter Justice, and it does not authorize marketing contact.';
  if (community.currentEdition) {
    community.currentEdition = {
      title:community.currentEdition.title,
      editionLabel:community.currentEdition.editionLabel,
      publishedAt:community.currentEdition.publishedAt,
      lastCheckedAt:community.currentEdition.reviewedAt,
      checkAgainBy:community.currentEdition.reviewDueAt,
      correctionsPath:community.currentEdition.correctionsPath
    };
  }
  community.participationPaths = (community.participationPaths || []).map(row => ({
    id:row.id,
    name:row.name,
    description:cleanSourceLanguage(row.description)
  }));
  return community;
}

function shareKit(id) {
  const base = pre127.shareKit(id);
  if (!base) return null;
  return {
    communityId:base.communityId,
    title:base.title,
    linkedinText:cleanSourceLanguage(base.linkedinText),
    canonicalUrl:base.canonicalUrl,
    publishedAt:base.publishedAt,
    lastCheckedAt:base.reviewedAt,
    checkAgainBy:base.reviewDueAt,
    correctionUrl:base.correctionsPath,
    disclosure:'Review the draft and every original source before posting. Nothing is posted or messaged automatically.'
  };
}

function memberExperience(id, options = {}) {
  const base = pre127.memberExperience(id, options);
  if (!base) return null;
  const community = getPublicCommunity(id, { now:options.now, audience:'PROFESSIONAL' });
  const selected = pre127.normalizePracticeAreas(options.practiceAreaIds || options.practiceAreaId);
  const allSignals = community.currentSignals || [];
  const practiceSignals = selected.length
    ? allSignals.filter(signal => !(signal.practiceAreaIds || []).length || signal.practiceAreaIds.some(area => selected.includes(area)))
    : [];
  return {
    preview:true,
    previewLabel:'Free professional community preview',
    membershipRequired:false,
    paidBenefitsActive:false,
    community:{
      id:community.id,
      name:community.name,
      shortName:community.shortName,
      statusLabel:community.statusLabel,
      canonicalPath:community.canonicalPath,
      parentPlaces:['Brooklyn / Kings County','New York City','New York'],
      directorySnapshot:clone(options.directorySnapshot || base.community?.directorySnapshot || null)
    },
    edition:clone(community.currentEdition),
    practiceAreaIds:selected,
    practiceAreas:clone(base.practiceAreas || []),
    todayNearYou:allSignals.slice(0, 8),
    forYourPractice:practiceSignals.slice(0, 8),
    professionalResources:clone(base.professionalResources || []).map(row => ({ ...row, description:cleanSourceLanguage(row.description) })),
    participationPaths:clone(community.participationPaths || []),
    gettingStarted:[
      { id:'review-profile', title:'Review your free public profile', href:'/find-my-profile.html' },
      { id:'choose-practice', title:'Choose practice areas for this local view', href:'/professional-community.html#practice-focus' },
      { id:'read-brief', title:'Open the current brief and its original sources', href:'/community-briefs/downtown-brooklyn' },
      { id:'share-brief', title:'Copy the LinkedIn draft when it is useful to your network', href:'/community-briefs/downtown-brooklyn#share' }
    ],
    availability:clone(LEGAL_COMMUNITY_PROGRAM_PRE128.benefitAvailability),
    privacyBoundary:{
      privateUserMattersUsed:false,
      individualDemandSignalsUsed:false,
      accountPreferencesUsedOnlyWhenSignedIn:true,
      officeLocationServiceAreaLicenseCommunityAndMembershipSeparate:true
    },
    shareKit:shareKit(id)
  };
}

function validate() {
  const errors = [];
  const base = pre127.validate();
  if (!base.ok) errors.push(...base.errors.map(error => `predecessor:${error}`));
  const membership = publicMembership();
  if (membership.enrollmentAvailable || membership.checkoutAvailable || membership.paidBenefitsActive) errors.push('paid-enrollment-boundary');
  const prices = Object.fromEntries(membership.plannedPlans.map(plan => [plan.id, [plan.monthlyDollars, plan.annualDollars]]));
  if (JSON.stringify(prices.professional) !== '[10,100]') errors.push('professional-price');
  if (JSON.stringify(prices.team) !== '[29,290]') errors.push('team-price');
  if (JSON.stringify(prices.office) !== '[49,490]') errors.push('office-price');
  const communities = listPublicCommunities();
  if (communities.communities.length !== 1 || communities.availability.otherAreasPublished !== 0) errors.push('community-publication-scope');
  const experience = memberExperience('downtown-brooklyn', { now:'2026-09-03T12:00:00-04:00' });
  if (!experience?.preview || experience?.paidBenefitsActive) errors.push('preview-truth');
  return { ok:errors.length === 0, errors, publishedCommunities:communities.communities.length, paidEnrollmentOpen:false, checkoutOpen:false };
}

module.exports = { validate, listPublicCommunities, getPublicCommunity, publicMembership, memberExperience, shareKit, normalizePracticeAreas:pre127.normalizePracticeAreas };
