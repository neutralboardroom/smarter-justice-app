const store = require('./store');
const professionalPromotionProgram = require('./professionalPromotionProgram');
const { NYC_FOUNDING_FIRM_SEEDS, NYC_FOUNDING_PROFESSIONAL_SEEDS } = require('../data/nycFoundingProfileSeeds');
const { FIRM_SEED_ENRICHMENTS_V1719, THREE_MARKET_FIRM_SEEDS_V1719, THREE_MARKET_PROFESSIONAL_SEEDS_V1719 } = require('../data/threeMarketProfileSeedsV1719');
const { FIRM_SEED_ENRICHMENTS_V1720, THREE_MARKET_FIRM_SEEDS_V1720, THREE_MARKET_PROFESSIONAL_SEEDS_V1720, THREE_MARKET_PROFILE_BATCH_V1720 } = require('../data/threeMarketProfileSeedsV1720');
const { FIRM_SEED_ENRICHMENTS_V1722, THREE_MARKET_FIRM_SEEDS_V1722, THREE_MARKET_PROFESSIONAL_SEEDS_V1722, THREE_MARKET_PROFILE_BATCH_V1722 } = require('../data/threeMarketProfileSeedsV1722');
const { FIRM_SEED_ENRICHMENTS_V1723, THREE_MARKET_FIRM_SEEDS_V1723, THREE_MARKET_PROFESSIONAL_SEEDS_V1723, THREE_MARKET_PROFILE_BATCH_V1723 } = require('../data/threeMarketProfileSeedsV1723');
const { FIRM_SEED_ENRICHMENTS_V1724, THREE_MARKET_FIRM_SEEDS_V1724, THREE_MARKET_PROFESSIONAL_SEEDS_V1724, THREE_MARKET_PROFILE_BATCH_V1724 } = require('../data/threeMarketProfileSeedsV1724');
const { FIRM_SEED_ENRICHMENTS_V1725, THREE_MARKET_FIRM_SEEDS_V1725, THREE_MARKET_PROFESSIONAL_SEEDS_V1725, THREE_MARKET_PROFILE_BATCH_V1725 } = require('../data/threeMarketProfileSeedsV1725');
const { FIRM_SEED_ENRICHMENTS_V1726, THREE_MARKET_FIRM_SEEDS_V1726, THREE_MARKET_PROFESSIONAL_SEEDS_V1726 } = require('../data/threeMarketProfileSeedsV1726');
const { FIRM_SEED_ENRICHMENTS_V1727, THREE_MARKET_FIRM_SEEDS_V1727, THREE_MARKET_PROFESSIONAL_SEEDS_V1727, THREE_MARKET_PROFILE_BATCH_V1727 } = require('../data/threeMarketProfileSeedsV1727');
const { FIRM_SEED_ENRICHMENTS_V1729, SIX_REGION_FIRM_SEEDS_V1729, SIX_REGION_PROFESSIONAL_SEEDS_V1729, SIX_REGION_PROFILE_BATCH_V1729 } = require('../data/sixRegionProfileSeedsV1729');
const { FIRM_SEED_ENRICHMENTS_V1730, SIX_REGION_FIRM_SEEDS_V1730, SIX_REGION_PROFESSIONAL_SEEDS_V1730, SIX_REGION_PROFILE_BATCH_V1730 } = require('../data/sixRegionProfileSeedsV1730');
const { FIRM_SEED_ENRICHMENTS_V1731, SIX_REGION_FIRM_SEEDS_V1731, SIX_REGION_PROFESSIONAL_SEEDS_V1731, SIX_REGION_PROFILE_BATCH_V1731 } = require('../data/sixRegionProfileSeedsV1731');
const { PROFESSIONAL_SEARCH_TAXONOMY_VERSION, normalizeSearchText, practiceMatches, extractUsLocation, latestSourceReviewDate, normalizedIncludes } = require('../data/professionalSearchTaxonomy');
const { PORTALS } = require('../data/portals');
const { DOMAIN_REGISTRY_SEEDS } = require('../data/domainRegistrySeed');
const { CANONICAL_PORTAL_IDS } = require('../data/professionalPortalAliases');
const { PROFESSIONAL_SOURCE_PLAN_VERSION, SOURCE_PLANS } = require('../data/professionalSourcePlans');
const {
  PROFESSIONAL_MARKETPLACE_STANDARD_VERSION,
  MARKETPLACE_REVENUE_STANDARD_VERSION,
  PROFESSIONAL_TYPES,
  PROFILE_STATUSES,
  CLAIM_STATUSES,
  VERIFICATION_STATUSES,
  MEMBERSHIP_STATUSES,
  OWNER_APPROVAL_STATUSES,
  SERVICE_STATUSES,
  CONSULTATION_TYPES,
  CONSULTATION_MODES,
  PROFESSIONAL_SERVICE_ROLES,
  SPONSORSHIP_STATUSES,
  CREDENTIAL_STATUSES,
  PROFILE_REQUEST_TYPES,
  PROFILE_REQUEST_STATUSES,
  SOURCE_AUTHORITY_LEVELS,
  SOURCE_REVIEW_STATUSES,
  REVENUE_PROGRAM_STATUSES,
  OUTREACH_CAMPAIGN_STATUSES,
  OUTREACH_PROSPECT_STATUSES,
  OUTREACH_CHANNELS,
  DEFAULT_FIRM_VOLUME_DISCOUNT_TIERS,
  DEFAULT_MEMBERSHIP_PLANS,
  DEFAULT_REVENUE_PROGRAMS,
  MARKETPLACE_GOVERNANCE
} = require('../data/professionalMarketplaceStandards');

const STORE_KEY = 'professionalMarketplace.json';
const MAX_LIST_ITEMS = 100;
const portalSlugs = new Set([
  ...CANONICAL_PORTAL_IDS,
  ...PORTALS.map(p => p.slug),
  ...DOMAIN_REGISTRY_SEEDS.flatMap(item=>[item.portalSlug,item.canonicalPortfolioSlug]).filter(Boolean)
]);
const AVAILABILITY_STATUSES = ['not configured','available','limited availability','not accepting new matters','temporarily unavailable'];

function clean(value, max = 2500) { return String(value == null ? '' : value).trim().slice(0, max); }
function list(value, maxItems = MAX_LIST_ITEMS, maxLength = 500) {
  const source = Array.isArray(value) ? value : String(value || '').split(/\r?\n|,/);
  return [...new Set(source.map(x => clean(x, maxLength)).filter(Boolean))].slice(0, maxItems);
}
function oneOf(value, allowed, fallback) { return allowed.includes(value) ? value : fallback; }
function bool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value == null || value === '') return fallback;
  return /^(true|1|yes|on)$/i.test(String(value));
}
function int(value, fallback = 0, min = 0, max = 100000000) {
  if (value == null || String(value).trim() === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
}
function nullableMoney(value) { return value === '' || value == null ? null : int(value, 0, 0, 100000000); }
function safeUrl(value) {
  const raw = clean(value, 1500);
  if (!raw) return '';
  try { const u = new URL(raw); return ['http:', 'https:'].includes(u.protocol) ? u.toString() : ''; } catch { return ''; }
}
function slugify(value) { return clean(value, 140).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-').slice(0, 120); }
function normalizedKey(value) { return clean(value, 500).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' '); }
function uniqueProfileSlug(base, id, rows) { const root = slugify(base) || slugify(id) || 'profile'; if (!rows.some(row => row.publicProfileSlug === root)) return root; const suffix = clean(id, 40).replace(/[^a-z0-9]/gi,'').slice(-8).toLowerCase() || store.uid('profile',4); return `${root}-${suffix}`.slice(0,120); }
function focusedPortalIds(values = []) { return list(values, 50, 120).filter(value => portalSlugs.has(value) && value !== 'general-smarter-justice-start'); }
function isoOrBlank(value) {
  const raw = clean(value, 80);
  if (!raw) return '';
  const t = Date.parse(raw);
  return Number.isNaN(t) ? '' : new Date(t).toISOString();
}
function dateExpired(value) { if (!value) return false; const t = Date.parse(value); return !Number.isNaN(t) && t < Date.now(); }
function maskCredentialIdentifier(value) { const raw = clean(value, 180); if (!raw) return ''; return raw.length <= 4 ? '*'.repeat(raw.length) : `${'*'.repeat(Math.min(8, raw.length - 4))}${raw.slice(-4)}`; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function email(value) { const raw = clean(value, 220); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : ''; }
function publicCampaignCode(value) { return clean(value, 100).toUpperCase().replace(/[^A-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }

function initialState() {
  return {
    schemaVersion: '1.7.0',
    standardVersion: PROFESSIONAL_MARKETPLACE_STANDARD_VERSION,
    revenueStandardVersion: MARKETPLACE_REVENUE_STANDARD_VERSION,
    membershipPlans: clone(DEFAULT_MEMBERSHIP_PLANS),
    revenuePrograms: clone(DEFAULT_REVENUE_PROGRAMS),
    firmVolumeDiscountTiers: clone(DEFAULT_FIRM_VOLUME_DISCOUNT_TIERS),
    firms: [], professionals: [], profileRequests: [], appointments: [], reviews: [], complaints: [], consentRecords: [], professionalOpportunities: [],
    outreachCampaigns: [], outreachProspects: [],
    pilotControls:{ status:'paused', maxActiveProfessionalMemberships:25, maxActiveFirmMemberships:10, maxTotalFirmSeats:100, ownerApprovalRequired:true, notes:'Open only after production persistence, owner MFA, Stripe test evidence, and first-cohort approval.', updatedAt:'' },
    updatedAt: ''
  };
}

function mergeUniqueById(current=[], incoming=[]) {
  const out=[...(current || [])];
  const ids=new Set(out.map(x=>x && x.id).filter(Boolean));
  for(const row of incoming || []){ if(row && row.id && !ids.has(row.id)){out.push(row);ids.add(row.id);} }
  return out;
}
function applyFirmSeedEnrichment(firm, seed){
  if(!firm || !seed || !firm.sourceSeeded || firm.claimStatus==='claimed') return firm;
  firm.practiceAreas=unique([...(firm.practiceAreas||[]),...(seed.practiceAreas||[])]);
  firm.languages=unique([...(firm.languages||[]),...(seed.languages||[])]);
  firm.serviceMethods=unique([...(firm.serviceMethods||[]),...(seed.serviceMethods||[])]);
  firm.portalEligibility=unique([...(firm.portalEligibility||[]),...(seed.portalEligibility||[])]).filter(x=>portalSlugs.has(x));
  firm.sourceRecords=mergeUniqueById(firm.sourceRecords,seed.sourceRecords);
  firm.lastPublicSourceReviewAt='2026-07-22T00:00:00.000Z';
  firm.updatedAt='2026-07-22T00:00:00.000Z';
  firm.updatedBy='built-in-v1719-source-enrichment';
  return firm;
}
function mergeBuiltInSeeds(state) {
  const allFirmSeeds=[...NYC_FOUNDING_FIRM_SEEDS,...THREE_MARKET_FIRM_SEEDS_V1719,...THREE_MARKET_FIRM_SEEDS_V1720,...THREE_MARKET_FIRM_SEEDS_V1722,...THREE_MARKET_FIRM_SEEDS_V1723,...THREE_MARKET_FIRM_SEEDS_V1724,...THREE_MARKET_FIRM_SEEDS_V1725,...THREE_MARKET_FIRM_SEEDS_V1726,...THREE_MARKET_FIRM_SEEDS_V1727,...SIX_REGION_FIRM_SEEDS_V1729,...SIX_REGION_FIRM_SEEDS_V1730,...SIX_REGION_FIRM_SEEDS_V1731];
  const allProfessionalSeeds=[...NYC_FOUNDING_PROFESSIONAL_SEEDS,...THREE_MARKET_PROFESSIONAL_SEEDS_V1719,...THREE_MARKET_PROFESSIONAL_SEEDS_V1720,...THREE_MARKET_PROFESSIONAL_SEEDS_V1722,...THREE_MARKET_PROFESSIONAL_SEEDS_V1723,...THREE_MARKET_PROFESSIONAL_SEEDS_V1724,...THREE_MARKET_PROFESSIONAL_SEEDS_V1725,...THREE_MARKET_PROFESSIONAL_SEEDS_V1726,...THREE_MARKET_PROFESSIONAL_SEEDS_V1727,...SIX_REGION_PROFESSIONAL_SEEDS_V1729,...SIX_REGION_PROFESSIONAL_SEEDS_V1730,...SIX_REGION_PROFESSIONAL_SEEDS_V1731];
  const firmIds = new Set(state.firms.map(x => x.id));
  for (const seed of allFirmSeeds) {
    if (firmIds.has(seed.id)) continue;
    const firm = defaultFirm({ ...seed, seededFromPublicInfo:true });
    const v1731Firm=SIX_REGION_FIRM_SEEDS_V1731.some(x=>x.id===seed.id);
    const v1730Firm=SIX_REGION_FIRM_SEEDS_V1730.some(x=>x.id===seed.id);
    const v1729Firm=SIX_REGION_FIRM_SEEDS_V1729.some(x=>x.id===seed.id);
    const priorVersionFirm=THREE_MARKET_FIRM_SEEDS_V1719.some(x=>x.id===seed.id)||THREE_MARKET_FIRM_SEEDS_V1720.some(x=>x.id===seed.id)||THREE_MARKET_FIRM_SEEDS_V1722.some(x=>x.id===seed.id)||THREE_MARKET_FIRM_SEEDS_V1723.some(x=>x.id===seed.id)||THREE_MARKET_FIRM_SEEDS_V1724.some(x=>x.id===seed.id)||THREE_MARKET_FIRM_SEEDS_V1725.some(x=>x.id===seed.id)||THREE_MARKET_FIRM_SEEDS_V1726.some(x=>x.id===seed.id)||THREE_MARKET_FIRM_SEEDS_V1727.some(x=>x.id===seed.id);
    const firmStamp=v1731Firm?'2026-07-24T20:00:00.000Z':v1730Firm?'2026-07-24T18:00:00.000Z':v1729Firm?'2026-07-24T00:00:00.000Z':priorVersionFirm?'2026-07-23T00:00:00.000Z':'2026-07-20T00:00:00.000Z';
    Object.assign(firm,{id:seed.id,publicProfileSlug:slugify(seed.name),publicProfileEnabled:true,profileStatus:'unclaimed public profile',ownerApprovalStatus:'approved',createdAt:firmStamp,updatedAt:firmStamp,updatedBy:v1731Firm?'built-in-six-region-v1731-seed':v1730Firm?'built-in-six-region-v1730-seed':v1729Firm?'built-in-six-region-v1729-seed':THREE_MARKET_FIRM_SEEDS_V1727.some(x=>x.id===seed.id)?'built-in-three-market-v1727-seed':THREE_MARKET_FIRM_SEEDS_V1726.some(x=>x.id===seed.id)?'built-in-three-market-v1726-seed':THREE_MARKET_FIRM_SEEDS_V1725.some(x=>x.id===seed.id)?'built-in-three-market-v1725-seed':THREE_MARKET_FIRM_SEEDS_V1724.some(x=>x.id===seed.id)?'built-in-three-market-v1724-seed':THREE_MARKET_FIRM_SEEDS_V1723.some(x=>x.id===seed.id)?'built-in-three-market-v1723-seed':THREE_MARKET_FIRM_SEEDS_V1722.some(x=>x.id===seed.id)?'built-in-three-market-v1722-seed':'built-in-public-source-seed'});
    state.firms.push(firm); firmIds.add(firm.id);
  }
  for(const enrichment of [...FIRM_SEED_ENRICHMENTS_V1719,...FIRM_SEED_ENRICHMENTS_V1720,...FIRM_SEED_ENRICHMENTS_V1722,...FIRM_SEED_ENRICHMENTS_V1723,...FIRM_SEED_ENRICHMENTS_V1724,...FIRM_SEED_ENRICHMENTS_V1725,...FIRM_SEED_ENRICHMENTS_V1726,...FIRM_SEED_ENRICHMENTS_V1727,...FIRM_SEED_ENRICHMENTS_V1729,...FIRM_SEED_ENRICHMENTS_V1730,...FIRM_SEED_ENRICHMENTS_V1731]){ applyFirmSeedEnrichment(state.firms.find(x=>x.id===enrichment.id),enrichment); }
  const professionalIds = new Set(state.professionals.map(x => x.id));
  for (const seed of allProfessionalSeeds) {
    if (professionalIds.has(seed.id)) continue;
    const professional = defaultProfessional({ ...seed, seededFromPublicInfo:true });
    const v1719=THREE_MARKET_PROFESSIONAL_SEEDS_V1719.some(x=>x.id===seed.id);
    const v1720=THREE_MARKET_PROFESSIONAL_SEEDS_V1720.some(x=>x.id===seed.id);
    const v1722=THREE_MARKET_PROFESSIONAL_SEEDS_V1722.some(x=>x.id===seed.id);
    const v1723=THREE_MARKET_PROFESSIONAL_SEEDS_V1723.some(x=>x.id===seed.id);
    const v1724=THREE_MARKET_PROFESSIONAL_SEEDS_V1724.some(x=>x.id===seed.id);
    const v1725=THREE_MARKET_PROFESSIONAL_SEEDS_V1725.some(x=>x.id===seed.id);
    const v1726=THREE_MARKET_PROFESSIONAL_SEEDS_V1726.some(x=>x.id===seed.id);
    const v1727=THREE_MARKET_PROFESSIONAL_SEEDS_V1727.some(x=>x.id===seed.id);
    const v1729=SIX_REGION_PROFESSIONAL_SEEDS_V1729.some(x=>x.id===seed.id);
    const v1731=SIX_REGION_PROFESSIONAL_SEEDS_V1731.some(x=>x.id===seed.id);
    const v1730=SIX_REGION_PROFESSIONAL_SEEDS_V1730.some(x=>x.id===seed.id);
    const professionalStamp=v1731?'2026-07-24T20:00:00.000Z':v1730?'2026-07-24T18:00:00.000Z':v1729?'2026-07-24T00:00:00.000Z':(v1719||v1720||v1722||v1723||v1724||v1725||v1726||v1727)?'2026-07-23T00:00:00.000Z':'2026-07-20T00:00:00.000Z';
    Object.assign(professional,{id:seed.id,publicProfileSlug:slugify(seed.displayName),publicProfileEnabled:true,profileStatus:'unclaimed public profile',claimStatus:'not claimed',ownerApprovalStatus:'approved',createdAt:professionalStamp,updatedAt:professionalStamp,updatedBy:v1731?'built-in-six-region-v1731-seed':v1730?'built-in-six-region-v1730-seed':v1729?'built-in-six-region-v1729-seed':v1727?'built-in-three-market-v1727-seed':v1726?'built-in-three-market-v1726-seed':v1725?'built-in-three-market-v1725-seed':v1724?'built-in-three-market-v1724-seed':v1723?'built-in-three-market-v1723-seed':v1722?'built-in-three-market-v1722-seed':v1720?'built-in-three-market-v1720-seed':v1719?'built-in-three-market-v1719-seed':'built-in-public-source-seed'});
    state.professionals.push(professional); professionalIds.add(professional.id);
    const firm = state.firms.find(x => x.id === professional.firmId);
    if (firm && !firm.professionalIds.includes(professional.id)) firm.professionalIds.push(professional.id);
  }
  return state;
}
function normalizeState(input) {
  const base = input && typeof input === 'object' && !Array.isArray(input) ? input : initialState();
  return mergeBuiltInSeeds({
    ...initialState(), ...base,
    standardVersion: PROFESSIONAL_MARKETPLACE_STANDARD_VERSION,
    revenueStandardVersion: MARKETPLACE_REVENUE_STANDARD_VERSION,
    membershipPlans: Array.isArray(base.membershipPlans) && base.membershipPlans.length ? base.membershipPlans : clone(DEFAULT_MEMBERSHIP_PLANS),
    revenuePrograms: Array.isArray(base.revenuePrograms) && base.revenuePrograms.length ? base.revenuePrograms : clone(DEFAULT_REVENUE_PROGRAMS),
    firmVolumeDiscountTiers: Array.isArray(base.firmVolumeDiscountTiers) && base.firmVolumeDiscountTiers.length ? base.firmVolumeDiscountTiers : clone(DEFAULT_FIRM_VOLUME_DISCOUNT_TIERS),
    firms: Array.isArray(base.firms) ? base.firms.map(firm=>({ claimStatus:'not claimed', verificationStatus:'not started', ...firm })) : [], professionals: Array.isArray(base.professionals) ? base.professionals : [],
    profileRequests: Array.isArray(base.profileRequests) ? base.profileRequests : [], appointments: Array.isArray(base.appointments) ? base.appointments : [],
    reviews: Array.isArray(base.reviews) ? base.reviews : [], complaints: Array.isArray(base.complaints) ? base.complaints : [],
    consentRecords: Array.isArray(base.consentRecords) ? base.consentRecords : [], professionalOpportunities: Array.isArray(base.professionalOpportunities) ? base.professionalOpportunities : [],
    outreachCampaigns: Array.isArray(base.outreachCampaigns) ? base.outreachCampaigns : [], outreachProspects: Array.isArray(base.outreachProspects) ? base.outreachProspects : [],
    pilotControls:{...initialState().pilotControls,...(base.pilotControls && typeof base.pilotControls==='object' ? base.pilotControls : {})}
  });
}
function readState() { return normalizeState(store.readJson(STORE_KEY, initialState())); }
function stampState(state){ return { ...state, schemaVersion:'1.7.0', standardVersion:PROFESSIONAL_MARKETPLACE_STANDARD_VERSION, revenueStandardVersion:MARKETPLACE_REVENUE_STANDARD_VERSION, updatedAt:store.now() }; }
async function mutateMarketplace(mutator,eventFactory){
  const tx=await store.mutateJson(STORE_KEY,initialState(),async raw=>{const state=normalizeState(raw);const result=await mutator(state);return {value:stampState(state),result};},{event:(result,next)=>eventFactory?eventFactory(result,next):null});
  return tx.result;
}
function writeState(state) {
  const next = { ...state, schemaVersion: '1.5.0', standardVersion: PROFESSIONAL_MARKETPLACE_STANDARD_VERSION, revenueStandardVersion: MARKETPLACE_REVENUE_STANDARD_VERSION, updatedAt: store.now() };
  store.writeJson(STORE_KEY, next);
  return next;
}

function membershipTemplate() {
  return {
    planId: '', status: 'none', billingModel: 'fixed subscription', coveredByFirmId: '',
    seatCount: 1, billingCadence: 'monthly', quotedPerSeatCents: null, discountPercent: 0,
    calculatedMonthlyCents: null, calculatedAnnualCents: null, foundingRate: false,
    startedAt: '', currentPeriodEnd: '', lastPaymentConfirmedAt: '', externalCustomerReference: '', externalSubscriptionReference: '', lastInvoiceReference: '', paymentState:'not configured', cancellationAtPeriodEnd:false, lastBillingEventAt:'', billingIssue:'', notes: ''
  };
}
function sponsorshipTemplate() { return { status: 'none', clearlyLabeled: true, portals: [], jurisdictions: [], placementType: '', startsAt: '', endsAt: '', notes: '' }; }

function sanitizeSourceRecord(input, current = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    id: clean(source.id || current.id, 180) || store.uid('source', 8),
    sourceType: clean(source.sourceType ?? current.sourceType, 180), sourceName: clean(source.sourceName ?? current.sourceName, 240), sourceUrl: safeUrl(source.sourceUrl ?? current.sourceUrl),
    authorityLevel: oneOf(source.authorityLevel, SOURCE_AUTHORITY_LEVELS, current.authorityLevel || 'other'), reviewStatus: oneOf(source.reviewStatus, SOURCE_REVIEW_STATUSES, current.reviewStatus || 'pending review'),
    retrievedAt: isoOrBlank(source.retrievedAt ?? current.retrievedAt) || store.now(), lastVerifiedAt: isoOrBlank(source.lastVerifiedAt ?? current.lastVerifiedAt),
    factsSupported: list(source.factsSupported ?? current.factsSupported, 50, 220), externalSourceId: clean(source.externalSourceId ?? current.externalSourceId, 240),
    datasetId: clean(source.datasetId ?? current.datasetId, 120), publisher: clean(source.publisher ?? current.publisher, 240), sourceRecordUpdatedAt: isoOrBlank(source.sourceRecordUpdatedAt ?? current.sourceRecordUpdatedAt),
    termsOrUseNotes: clean(source.termsOrUseNotes ?? current.termsOrUseNotes, 2500), notes: clean(source.notes ?? current.notes, 2500)
  };
}
function sanitizePublicFacts(input, current = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const allowed = ['registrationNumber','middleName','suffix','companyName','publicBusinessAddress','city','state','county','country','yearAdmitted','judicialDepartmentOfAdmission','lawSchool','registrationStatus','credentialCategory','directoryInclusion'];
  const out = {};
  for (const key of allowed) { const value = clean(source[key] ?? current[key], key === 'publicBusinessAddress' ? 800 : 300); if (value) out[key] = value; }
  return out;
}
function sanitizeMembership(input, current = membershipTemplate()) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    planId: clean(source.planId ?? current.planId, 100), status: oneOf(source.status, MEMBERSHIP_STATUSES, current.status || 'none'), billingModel: 'fixed subscription',
    coveredByFirmId: clean(source.coveredByFirmId ?? current.coveredByFirmId, 180), seatCount: int(source.seatCount ?? current.seatCount, 1, 1, 10000),
    billingCadence: 'monthly', quotedPerSeatCents: nullableMoney(source.quotedPerSeatCents ?? current.quotedPerSeatCents),
    discountPercent: int(source.discountPercent ?? current.discountPercent, 0, 0, 100), calculatedMonthlyCents: nullableMoney(source.calculatedMonthlyCents ?? current.calculatedMonthlyCents),
    calculatedAnnualCents: nullableMoney(source.calculatedAnnualCents ?? current.calculatedAnnualCents), foundingRate: bool(source.foundingRate, current.foundingRate || false),
    startedAt: isoOrBlank(source.startedAt ?? current.startedAt), currentPeriodEnd: isoOrBlank(source.currentPeriodEnd ?? current.currentPeriodEnd),
    lastPaymentConfirmedAt: isoOrBlank(source.lastPaymentConfirmedAt ?? current.lastPaymentConfirmedAt), externalCustomerReference: clean(source.externalCustomerReference ?? current.externalCustomerReference, 240),
    externalSubscriptionReference: clean(source.externalSubscriptionReference ?? current.externalSubscriptionReference, 240), lastInvoiceReference: clean(source.lastInvoiceReference ?? current.lastInvoiceReference, 240),
    paymentState: clean(source.paymentState ?? current.paymentState, 120), cancellationAtPeriodEnd: bool(source.cancellationAtPeriodEnd, current.cancellationAtPeriodEnd || false),
    lastBillingEventAt: isoOrBlank(source.lastBillingEventAt ?? current.lastBillingEventAt), billingIssue: clean(source.billingIssue ?? current.billingIssue, 1500),
    notes: clean(source.notes ?? current.notes, 2500)
  };
}
function sanitizeCredential(input, current = {}) {
  const source = input && typeof input === 'object' ? input : {}; const identifier = clean(source.identifier ?? current.identifier, 180);
  return { id: clean(source.id || current.id, 180) || store.uid('credential', 8), credentialType: clean(source.credentialType ?? current.credentialType, 180), jurisdiction: clean(source.jurisdiction ?? current.jurisdiction, 140), identifier, identifierDisplay: maskCredentialIdentifier(identifier), status: oneOf(source.status, CREDENTIAL_STATUSES, current.status || 'unverified'), verificationSource: safeUrl(source.verificationSource ?? current.verificationSource), verifiedAt: isoOrBlank(source.verifiedAt ?? current.verifiedAt), expirationDate: isoOrBlank(source.expirationDate ?? current.expirationDate), notes: clean(source.notes ?? current.notes, 2500) };
}
function sanitizeService(input, current = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return { id: clean(source.id || current.id, 180) || store.uid('service', 8), title: clean(source.title ?? current.title, 180), serviceType: oneOf(source.serviceType, CONSULTATION_TYPES, current.serviceType || 'free consultation'), status: oneOf(source.status, SERVICE_STATUSES, current.status || 'draft'), durationMinutes: int(source.durationMinutes ?? current.durationMinutes, 30, 5, 480), priceCents: nullableMoney(source.priceCents ?? current.priceCents), currency: 'USD', modes: list(source.modes ?? current.modes, 10, 40).filter(x => CONSULTATION_MODES.includes(x)), portals: list(source.portals ?? current.portals, 50, 120).filter(x => portalSlugs.has(x)), practiceAreas: list(source.practiceAreas ?? current.practiceAreas, 100, 180), jurisdictions: list(source.jurisdictions ?? current.jurisdictions, 100, 120), languages: list(source.languages ?? current.languages, 30, 80), scope: clean(source.scope ?? current.scope, 4000), exclusions: clean(source.exclusions ?? current.exclusions, 4000), schedulingEnabled: bool(source.schedulingEnabled, current.schedulingEnabled || false), bookingPaymentEnabled: false, consultationFeeMerchant: 'professional or firm — live payment flow not activated', cancellationPolicy: clean(source.cancellationPolicy ?? current.cancellationPolicy, 2500), createdAt: current.createdAt || store.now(), updatedAt: store.now() };
}
function sanitizeSponsorship(input, current = sponsorshipTemplate()) {
  const source = input && typeof input === 'object' ? input : {};
  return { status: oneOf(source.status, SPONSORSHIP_STATUSES, current.status || 'none'), clearlyLabeled: true, portals: list(source.portals ?? current.portals, 50, 120).filter(x => portalSlugs.has(x)), jurisdictions: list(source.jurisdictions ?? current.jurisdictions, 100, 120), placementType: clean(source.placementType ?? current.placementType, 180), startsAt: isoOrBlank(source.startsAt ?? current.startsAt), endsAt: isoOrBlank(source.endsAt ?? current.endsAt), notes: clean(source.notes ?? current.notes, 2500) };
}

function defaultFirm(input = {}) {
  const seeded = bool(input.seededFromPublicInfo, false);
  return {
    id: store.uid('firm', 10), name: clean(input.name, 180), publicProfileSlug: slugify(input.publicProfileSlug || input.name), profileStatus: seeded ? 'unclaimed public profile' : 'private draft',
    publicProfileEnabled: false, claimStatus: 'not claimed', verificationStatus: 'not started', sourceSeeded: seeded, sourceRecords: (Array.isArray(input.sourceRecords) ? input.sourceRecords : []).slice(0, 50).map(x => sanitizeSourceRecord(x)),
    lastPublicSourceReviewAt: seeded ? store.now() : '', ownerApprovalStatus: 'draft', sourceOrigin: clean(input.sourceOrigin || (seeded ? 'public-source-seed' : 'manual-entry'), 120), dataAuthority: clean(input.dataAuthority || (seeded ? 'source-supported' : 'professional-supplied'), 120), portalPublicationState: clean(input.portalPublicationState || 'not distributed', 120), website: safeUrl(input.website), email: email(input.email), phone: clean(input.phone, 80),
    locations: list(input.locations, 50, 300), jurisdictions: list(input.jurisdictions, 100, 120), practiceAreas: list(input.practiceAreas, 100, 180), languages: list(input.languages, 30, 80), serviceMethods: list(input.serviceMethods, 20, 80), serviceRegions: list(input.serviceRegions, 100, 160), portalEligibility: list(input.portalEligibility, 50, 120).filter(x => portalSlugs.has(x)),
    professionalIds: [], seatCount: int(input.seatCount, 1, 1, 10000), activeSeatCount: 0, billingAdministratorName: clean(input.billingAdministratorName, 180), billingAdministratorEmail: email(input.billingAdministratorEmail),
    membership: sanitizeMembership(input.membership, { ...membershipTemplate(), planId: 'nyc-founding-firm', seatCount: int(input.seatCount, 1, 1, 10000), foundingRate: true }), outreachCampaignId: clean(input.outreachCampaignId, 180),
    marketplaceTermsAcceptedAt: '', independentProfessionalAcknowledgmentAt: '', conflictsPolicyAcceptedAt: '', suspensionReason: '', notes: clean(input.notes, 5000), profileRevision:1, reviewStatus:'draft', reviewSubmittedAt:'', submittedRevision:0, lastProfessionalEditAt:'', duplicateReviewStatus:'not flagged', canonicalRecordState:'central private record', createdAt: store.now(), updatedAt: store.now(), updatedBy: 'owner'
  };
}
function defaultProfessional(input = {}) {
  const displayName = clean(input.displayName || [input.firstName, input.lastName].filter(Boolean).join(' '), 180); const seeded = bool(input.seededFromPublicInfo, false);
  return {
    id: store.uid('professional', 10), publicProfileSlug: slugify(input.publicProfileSlug || displayName), profileStatus: seeded ? 'unclaimed public profile' : 'private draft', publicProfileEnabled: false,
    sourceSeeded: seeded, sourceRecords: (Array.isArray(input.sourceRecords) ? input.sourceRecords : []).slice(0, 50).map(x => sanitizeSourceRecord(x)),
    externalSourceIds: list(input.externalSourceIds || (input.externalSourceId ? [input.externalSourceId] : []), 50, 240), publicFacts: sanitizePublicFacts(input.publicFacts), lastPublicSourceReviewAt: seeded ? store.now() : '',
    publicSourceDisclaimer: 'Public-source profile. Unclaimed unless expressly marked claimed. Listing does not imply participation, endorsement, membership, consultation availability, or professional quality.',
    sourceOrigin: clean(input.sourceOrigin || (seeded ? 'public-source-seed' : 'manual-entry'), 120), dataAuthority: clean(input.dataAuthority || (seeded ? 'source-supported' : 'professional-supplied'), 120), portalPublicationState: clean(input.portalPublicationState || 'not distributed', 120),
    claimStatus: 'not claimed', professionalType: oneOf(input.professionalType, PROFESSIONAL_TYPES, 'attorney'), displayName, firstName: clean(input.firstName, 100), lastName: clean(input.lastName, 100),
    firmId: clean(input.firmId, 180), email: email(input.email), phone: clean(input.phone, 80), website: safeUrl(input.website), photoUrl: safeUrl(input.photoUrl), biography: clean(input.biography, 8000),
    languages: list(input.languages, 30, 80), officeLocations: list(input.officeLocations, 50, 300), jurisdictions: list(input.jurisdictions, 100, 120), practiceAreas: list(input.practiceAreas, 100, 180),
    serviceRoles: list(input.serviceRoles, 30, 120).filter(x => PROFESSIONAL_SERVICE_ROLES.includes(x)),
    availabilityStatus: oneOf(input.availabilityStatus, AVAILABILITY_STATUSES, 'not configured'), consultationModes: list(input.consultationModes, 20, 80).filter(x => CONSULTATION_MODES.includes(x)), serviceRegions: list(input.serviceRegions, 100, 160), availabilityNote: clean(input.availabilityNote, 1200),
    portalEligibility: list(input.portalEligibility, 50, 120).filter(x => portalSlugs.has(x)), verificationStatus: 'not started', verificationScope: [], credentials: (Array.isArray(input.credentials) ? input.credentials : []).slice(0, 30).map(x => sanitizeCredential(x)),
    ownerApprovalStatus: 'draft', membership: sanitizeMembership(input.membership, { ...membershipTemplate(), planId: 'nyc-founding-professional', foundingRate: true }), marketplaceTermsAcceptedAt: '', independentProfessionalAcknowledgmentAt: '', conflictsPolicyAcceptedAt: '',
    consultationServices: (Array.isArray(input.consultationServices) ? input.consultationServices : []).slice(0, 30).map(x => sanitizeService(x)), sponsorship: sponsorshipTemplate(), suspensionReason: '', ownerNotes: clean(input.ownerNotes, 5000), outreachCampaignId: clean(input.outreachCampaignId, 180), profileRevision:1, reviewStatus:'draft', reviewSubmittedAt:'', submittedRevision:0, lastProfessionalEditAt:'', duplicateReviewStatus:'not flagged', canonicalRecordState:'central private record',
    createdAt: store.now(), updatedAt: store.now(), updatedBy: 'owner'
  };
}

function findFirm(state, id) { return state.firms.find(x => x.id === id || x.publicProfileSlug === id); }
function findProfessional(state, id) { return state.professionals.find(x => x.id === id || x.publicProfileSlug === id); }
function findPlan(state, id) { return state.membershipPlans.find(x => x.id === id); }
function findCampaign(state, idOrCode) { return state.outreachCampaigns.find(x => x.id === idOrCode || x.campaignCode === publicCampaignCode(idOrCode)); }
function findProspect(state, id) { return state.outreachProspects.find(x => x.id === id); }
function activePlan(state, membership, requiredAudience) {
  if (!membership || membership.status !== 'active' || dateExpired(membership.currentPeriodEnd)) return null;
  const plan = findPlan(state, membership.planId); if (!plan || !plan.consultationEligibility) return null;
  if (requiredAudience && plan.audience && ![requiredAudience, 'enterprise'].includes(plan.audience)) return null;
  return plan;
}
function firmMembershipActive(state, firmId) { const firm = findFirm(state, firmId); return Boolean(firm && firm.ownerApprovalStatus === 'approved' && activePlan(state, firm.membership, 'firm') && !firm.suspensionReason && !['suspended','archived'].includes(firm.profileStatus)); }
function activeCredentialCount(professional) { return (professional.credentials || []).filter(c => c.status === 'active' && !dateExpired(c.expirationDate)).length; }

function matchingDiscountTier(state, seatCount) {
  const seats = int(seatCount, 1, 1, 10000);
  return state.firmVolumeDiscountTiers.find(t => seats >= t.minSeats && (t.maxSeats == null || seats <= t.maxSeats)) || { id:'custom', name:'Custom quote', minSeats:seats, maxSeats:null, discountPercent:0, status:'planned', notes:'Owner review required.' };
}
function calculateFirmMembershipQuote(planId, seatCount, state = readState()) {
  const plan = findPlan(state, planId);
  if (!plan || !['firm','enterprise'].includes(plan.audience)) return { error:'Select a firm or enterprise membership plan.' };
  const seats = int(seatCount, 1, 1, 10000);
  const seatMonthlyCents = nullableMoney(plan.monthlyPriceCents);
  const firmProfileMonthlyCents = planId === 'nyc-founding-firm' ? 1500 : 0;
  return {
    planId:plan.id, planName:plan.name, seatCount:seats,
    discountTierId:'binding-no-volume-discount', discountTierName:'Current owner-approved monthly structure', discountPercent:0,
    monthlyPerSeatCents:seatMonthlyCents, annualPerSeatCents:null,
    monthlyDiscountedPerSeatCents:seatMonthlyCents, annualDiscountedPerSeatCents:null,
    firmProfileMonthlyCents,
    monthlyTotalCents:seatMonthlyCents==null?null:firmProfileMonthlyCents+seatMonthlyCents*seats,
    annualTotalCents:null, monthlySavingsCents:0, annualSavingsCents:null,
    pricingIsIllustrative:true,
    disclosure:'Current owner-approved pilot terms are $15 monthly for the claimed firm profile plus $15 monthly for each covered attorney seat. Billing remains closed until exact acceptance.'
  };
}

function professionalProfileReadiness(professional = {}) {
  const credentials = Array.isArray(professional.credentials) ? professional.credentials : [];
  const usableCredentials = credentials.filter(item => clean(item.credentialType,180) && clean(item.jurisdiction,140) && clean(item.identifier,180));
  const focusedPortals = focusedPortalIds(professional.portalEligibility || []);
  const requiredChecks = [
    { key:'displayName', label:'Professional name', complete:clean(professional.displayName,180).length >= 2 },
    { key:'email', label:'Professional email', complete:Boolean(email(professional.email)) },
    { key:'jurisdictions', label:'At least one jurisdiction', complete:Boolean((professional.jurisdictions || []).length) },
    { key:'practiceAreas', label:'At least one practice area', complete:Boolean((professional.practiceAreas || []).length) },
    { key:'locationOrRegion', label:'Office location or service region', complete:Boolean((professional.officeLocations || []).length || (professional.serviceRegions || []).length) },
    { key:'focusedPortal', label:'At least one focused legal portal', complete:Boolean(focusedPortals.length) },
    { key:'credential', label:'At least one license or credential record', complete:Boolean(usableCredentials.length) }
  ];
  const recommendedChecks = [
    { key:'biography', label:'Professional biography', complete:clean(professional.biography,8000).length >= 80 },
    { key:'contact', label:'Website or telephone', complete:Boolean(professional.website || professional.phone) },
    { key:'languages', label:'Languages', complete:Boolean((professional.languages || []).length) },
    { key:'availability', label:'Current availability', complete:Boolean(professional.availabilityStatus && professional.availabilityStatus !== 'not configured') },
    { key:'serviceModes', label:'Consultation or service modes', complete:Boolean((professional.consultationModes || []).length) }
  ];
  const all=[...requiredChecks,...recommendedChecks];
  const completeCount=all.filter(item=>item.complete).length;
  const profileRevision=Math.max(1,Number(professional.profileRevision||1));
  const submittedRevision=Math.max(0,Number(professional.submittedRevision||0));
  return {
    readyForReview:requiredChecks.every(item=>item.complete),
    requiredChecks,
    recommendedChecks,
    missingRequired:requiredChecks.filter(item=>!item.complete).map(item=>item.label),
    missingRecommended:recommendedChecks.filter(item=>!item.complete).map(item=>item.label),
    completenessPercent:Math.round(completeCount/all.length*100),
    focusedPortalIds:focusedPortals,
    credentialRecords:usableCredentials.length,
    profileRevision,
    submittedRevision,
    reviewStatus:professional.reviewStatus || 'draft',
    reviewSubmittedAt:professional.reviewSubmittedAt || '',
    currentRevisionSubmitted:submittedRevision === profileRevision && Boolean(professional.reviewSubmittedAt),
    staleAfterSubmission:submittedRevision > 0 && submittedRevision !== profileRevision
  };
}
function firmProfileReadiness(firm = {}) {
  const focusedPortals=focusedPortalIds(firm.portalEligibility || []);
  const requiredChecks=[
    {key:'name',label:'Firm name',complete:clean(firm.name,180).length>=2},
    {key:'billingEmail',label:'Billing administrator email',complete:Boolean(email(firm.billingAdministratorEmail || firm.email))},
    {key:'jurisdictions',label:'At least one jurisdiction',complete:Boolean((firm.jurisdictions||[]).length)},
    {key:'practiceAreas',label:'At least one practice area',complete:Boolean((firm.practiceAreas||[]).length)},
    {key:'locationOrRegion',label:'Office location or service region',complete:Boolean((firm.locations||[]).length || (firm.serviceRegions||[]).length)},
    {key:'focusedPortal',label:'At least one focused legal portal',complete:Boolean(focusedPortals.length)},
    {key:'seatCount',label:'At least one covered professional seat',complete:Number(firm.seatCount||0)>=1}
  ];
  const recommendedChecks=[
    {key:'contact',label:'Website or telephone',complete:Boolean(firm.website||firm.phone)},
    {key:'languages',label:'Languages',complete:Boolean((firm.languages||[]).length)}
  ];
  const all=[...requiredChecks,...recommendedChecks];
  const profileRevision=Math.max(1,Number(firm.profileRevision||1));
  const submittedRevision=Math.max(0,Number(firm.submittedRevision||0));
  return {
    readyForReview:requiredChecks.every(item=>item.complete), requiredChecks,recommendedChecks,
    missingRequired:requiredChecks.filter(item=>!item.complete).map(item=>item.label),
    missingRecommended:recommendedChecks.filter(item=>!item.complete).map(item=>item.label),
    completenessPercent:Math.round(all.filter(item=>item.complete).length/all.length*100),
    focusedPortalIds:focusedPortals, profileRevision, submittedRevision,
    reviewStatus:firm.reviewStatus || 'draft', reviewSubmittedAt:firm.reviewSubmittedAt || '',
    currentRevisionSubmitted:submittedRevision===profileRevision && Boolean(firm.reviewSubmittedAt),
    staleAfterSubmission:submittedRevision>0 && submittedRevision!==profileRevision
  };
}
function evaluateProfessionalEligibility(professional, state = readState()) {
  const reasons = []; const warnings = [];
  const directPlan = activePlan(state, professional.membership, 'individual'); const coveredFirmId = professional.membership?.coveredByFirmId || professional.firmId;
  const coveredByFirm = coveredFirmId ? firmMembershipActive(state, coveredFirmId) : false; const paidMembership = Boolean(directPlan || coveredByFirm);
  if (!paidMembership) reasons.push('An active qualifying paid Professional Member or approved covered Firm Member subscription is required.');
  if (professional.ownerApprovalStatus !== 'approved') reasons.push('Owner marketplace approval is required.');
  if (professional.verificationStatus !== 'verified') reasons.push('Professional identity and credential verification must be completed.');
  if (activeCredentialCount(professional) < 1) reasons.push('At least one active verified professional credential is required.');
  if (!professional.marketplaceTermsAcceptedAt) reasons.push('Marketplace participation terms have not been accepted.');
  if (!professional.independentProfessionalAcknowledgmentAt) reasons.push('The independent professional judgment acknowledgment has not been accepted.');
  if (!professional.conflictsPolicyAcceptedAt) reasons.push('The conflict-check and engagement policy has not been accepted.');
  if (professional.suspensionReason || ['suspended','archived'].includes(professional.profileStatus) || professional.ownerApprovalStatus === 'suspended') reasons.push('The professional is suspended or archived.');
  if (!(professional.portalEligibility || []).length) reasons.push('At least one approved Smarter Justice portal must be selected.');
  if (!(professional.jurisdictions || []).length) reasons.push('At least one jurisdiction or authorized service area must be recorded.');
  const activeServices = (professional.consultationServices || []).filter(s => s.status === 'active' && s.schedulingEnabled);
  if (!activeServices.length) reasons.push('At least one active scheduling-enabled consultation or review service is required.');
  if (professional.sponsorship?.status === 'active') warnings.push('Sponsorship is ignored for substantive eligibility and must be clearly labeled wherever displayed.');
  if (professional.publicProfileEnabled && !['verified','participating','integrated','unclaimed public profile'].includes(professional.profileStatus)) warnings.push('A public profile should not be enabled until its public status and disclosures are approved.');
  if (professional.sourceSeeded && !(professional.sourceRecords || []).length) warnings.push('A public-information seeded profile should not be published without source records.');
  return { consultationEligible: reasons.length === 0, paidMembership, membershipSource: directPlan ? `individual membership: ${directPlan.name}` : coveredByFirm ? 'covered firm membership' : 'none', activeCredentialCount: activeCredentialCount(professional), activeServiceCount: activeServices.length, reasons, warnings, evaluatedAt: store.now(), sponsorshipAffectsEligibility: false, premiumListingAffectsEligibility: false };
}
function ownerViewProfessional(professional, state) { return { ...professional, credentials: (professional.credentials || []).map(c => ({ ...c, identifierDisplay: maskCredentialIdentifier(c.identifier) })), eligibility: evaluateProfessionalEligibility(professional, state), profileReadiness:professionalProfileReadiness(professional) }; }
function ownerViewFirm(firm, state) { return { ...firm, quote: calculateFirmMembershipQuote(firm.membership?.planId || 'nyc-founding-firm', firm.seatCount || firm.membership?.seatCount || 1, state), profileReadiness:firmProfileReadiness(firm) }; }

function pilotCapacity(state = readState()) {
  const activeProfessionalMemberships = state.professionals.filter(p => p.membership?.status === 'active' && !p.membership?.coveredByFirmId).length;
  const activeFirmMemberships = state.firms.filter(f => f.membership?.status === 'active').length;
  const activeFirmSeats = state.firms.filter(f => f.membership?.status === 'active').reduce((sum,f)=>sum+int(f.membership?.seatCount || f.seatCount,1,1,10000),0);
  const controls=state.pilotControls || initialState().pilotControls;
  return { activeProfessionalMemberships,activeFirmMemberships,activeFirmSeats,professionalSpotsRemaining:Math.max(0,int(controls.maxActiveProfessionalMemberships,25)-activeProfessionalMemberships),firmSpotsRemaining:Math.max(0,int(controls.maxActiveFirmMemberships,10)-activeFirmMemberships),firmSeatsRemaining:Math.max(0,int(controls.maxTotalFirmSeats,100)-activeFirmSeats) };
}
function membershipEnrollmentAvailability(target = {}, state = readState()) {
  const controls=state.pilotControls || initialState().pilotControls; const capacity=pilotCapacity(state);
  if(!['pilot-open','active'].includes(controls.status)) return {available:false,reason:'Founding membership enrollment is not open yet. Your account and profile work remain saved.',controls,capacity};
  if(target.kind==='professional' && capacity.professionalSpotsRemaining<1) return {available:false,reason:'The current individual founding-member cohort is full.',controls,capacity};
  if(target.kind==='firm' && capacity.firmSpotsRemaining<1) return {available:false,reason:'The current firm founding-member cohort is full.',controls,capacity};
  if(target.kind==='firm' && int(target.seatCount,1,1,10000)>capacity.firmSeatsRemaining) return {available:false,reason:'The requested firm seats exceed the remaining approved pilot capacity.',controls,capacity};
  return {available:true,controls,capacity};
}
function updatePilotControls(input = {}) {
  const state=readState(); const current=state.pilotControls || initialState().pilotControls;
  state.pilotControls={ status:oneOf(input.status,['paused','pilot-open','active','closed'],current.status), maxActiveProfessionalMemberships:int(input.maxActiveProfessionalMemberships,current.maxActiveProfessionalMemberships,0,100000), maxActiveFirmMemberships:int(input.maxActiveFirmMemberships,current.maxActiveFirmMemberships,0,100000), maxTotalFirmSeats:int(input.maxTotalFirmSeats,current.maxTotalFirmSeats,0,1000000), ownerApprovalRequired:bool(input.ownerApprovalRequired,current.ownerApprovalRequired), notes:clean(input.notes ?? current.notes,5000), updatedAt:store.now() };
  writeState(state); store.addAudit({actor:'owner-control-center',action:'professional_pilot_controls_updated',details:{status:state.pilotControls.status,maxActiveProfessionalMemberships:state.pilotControls.maxActiveProfessionalMemberships,maxActiveFirmMemberships:state.pilotControls.maxActiveFirmMemberships,maxTotalFirmSeats:state.pilotControls.maxTotalFirmSeats}}); return {pilotControls:state.pilotControls,capacity:pilotCapacity(state)};
}

function summary(state) {
  const evaluated = state.professionals.map(p => evaluateProfessionalEligibility(p, state));
  const activeProspects = state.outreachProspects.filter(x => !['declined','do not contact'].includes(x.status));
  const projectedMonthly = activeProspects.reduce((sum, p) => sum + int(p.estimatedMonthlyRevenueCents, 0, 0, 100000000), 0);
  const capacity=pilotCapacity(state);
  return {
    firms: state.firms.length, professionals: state.professionals.length, sourceSeededProfiles: state.professionals.filter(x => x.sourceSeeded).length,
    activePaidMembers: evaluated.filter(x => x.paidMembership).length, consultationEligible: evaluated.filter(x => x.consultationEligible).length,
    verifiedProfessionals: state.professionals.filter(x => x.verificationStatus === 'verified').length, activeServices: state.professionals.reduce((sum, p) => sum + (p.consultationServices || []).filter(s => s.status === 'active').length, 0),
    publicProfilesEnabled: state.professionals.filter(x => x.publicProfileEnabled).length, sponsoredProfessionals: state.professionals.filter(x => x.sponsorship?.status === 'active').length,
    openProfileRequests: state.profileRequests.filter(x => !['closed','declined'].includes(x.status)).length, revenuePrograms: state.revenuePrograms.length,
    revenueProgramsActive: state.revenuePrograms.filter(x => ['pilot','active'].includes(x.status)).length, standardVersion: PROFESSIONAL_MARKETPLACE_STANDARD_VERSION,
    revenueStandardVersion: MARKETPLACE_REVENUE_STANDARD_VERSION, sourcePlanVersion: PROFESSIONAL_SOURCE_PLAN_VERSION,
    publicDirectoryActivated:false, claimMigrationLookupActivated:true, focusedPortalPublicProfiles:true, publicBookingActivated:false, membershipBillingActivated: Boolean(process.env.STRIPE_SECRET_KEY), appointmentRecords: state.appointments.length,
    reviewRecords: state.reviews.length, complaintRecords: state.complaints.length, consentRecords: state.consentRecords.length, professionalOpportunityRecords: state.professionalOpportunities.length,
    outreachCampaigns: state.outreachCampaigns.length, activeOutreachCampaigns: state.outreachCampaigns.filter(x => ['pilot-ready','active'].includes(x.status)).length,
    outreachProspects: state.outreachProspects.length, activeMemberProspects: state.outreachProspects.filter(x => x.status === 'active member').length,
    potentialFirmSeats: activeProspects.reduce((sum, p) => sum + int(p.potentialSeats, 1, 1, 10000), 0), projectedMonthlyRevenueCents: projectedMonthly, pilotStatus:state.pilotControls?.status || 'paused', ...capacity
  };
}
function getOwnerData() {
  const state = readState();
  return {
    generatedAt: store.now(), governance: MARKETPLACE_GOVERNANCE, profileGrowthBatch: SIX_REGION_PROFILE_BATCH_V1731, sourcePlans: { version: PROFESSIONAL_SOURCE_PLAN_VERSION, portals: SOURCE_PLANS },
    enums: { professionalTypes: PROFESSIONAL_TYPES, professionalServiceRoles:PROFESSIONAL_SERVICE_ROLES, availabilityStatuses:AVAILABILITY_STATUSES, profileStatuses: PROFILE_STATUSES, claimStatuses: CLAIM_STATUSES, verificationStatuses: VERIFICATION_STATUSES, membershipStatuses: MEMBERSHIP_STATUSES, ownerApprovalStatuses: OWNER_APPROVAL_STATUSES, serviceStatuses: SERVICE_STATUSES, consultationTypes: CONSULTATION_TYPES, consultationModes: CONSULTATION_MODES, sponsorshipStatuses: SPONSORSHIP_STATUSES, credentialStatuses: CREDENTIAL_STATUSES, profileRequestTypes: PROFILE_REQUEST_TYPES, profileRequestStatuses: PROFILE_REQUEST_STATUSES, sourceAuthorityLevels: SOURCE_AUTHORITY_LEVELS, sourceReviewStatuses: SOURCE_REVIEW_STATUSES, revenueProgramStatuses: REVENUE_PROGRAM_STATUSES, outreachCampaignStatuses: OUTREACH_CAMPAIGN_STATUSES, outreachProspectStatuses: OUTREACH_PROSPECT_STATUSES, outreachChannels: OUTREACH_CHANNELS, portalSlugs: [...portalSlugs] },
    summary: {...summary(state),directoryMetrics:directoryMetrics(state),professionalSearchTaxonomyVersion:PROFESSIONAL_SEARCH_TAXONOMY_VERSION}, pilotControls:state.pilotControls, pilotCapacity:pilotCapacity(state), membershipPlans: state.membershipPlans, revenuePrograms: state.revenuePrograms, firmVolumeDiscountTiers: state.firmVolumeDiscountTiers,
    firms: state.firms.map(x => ownerViewFirm(x, state)), professionals: state.professionals.map(p => ownerViewProfessional(p, state)), profileRequests: state.profileRequests,
    appointments: state.appointments, reviews: state.reviews, complaints: state.complaints, consentRecords: state.consentRecords, professionalOpportunities: state.professionalOpportunities,
    outreachCampaigns: state.outreachCampaigns, outreachProspects: state.outreachProspects
  };
}

function createFirm(input, actor = 'owner') {
  const state = readState(); const firm = defaultFirm(input);
  if (firm.name.length < 2) return { error:'Add a firm or organization name.' };
  const duplicateFirm = state.firms.find(x => x.profileStatus !== 'archived' && normalizedKey(x.name) === normalizedKey(firm.name) && ((firm.website && x.website === firm.website) || (firm.email && x.email === firm.email) || normalizedKey((x.locations||[])[0]) === normalizedKey((firm.locations||[])[0])));
  if (duplicateFirm) return { error:'A matching firm workspace already exists. Use the existing firm record or request duplicate review.', duplicateFirmId:duplicateFirm.id };
  firm.publicProfileSlug = uniqueProfileSlug(firm.publicProfileSlug || firm.name, firm.id, state.firms);
  const quote = calculateFirmMembershipQuote(firm.membership.planId, firm.seatCount, state);
  if (!quote.error) firm.membership = sanitizeMembership({ ...firm.membership, seatCount: firm.seatCount, quotedPerSeatCents: quote.monthlyDiscountedPerSeatCents, discountPercent: quote.discountPercent, calculatedMonthlyCents: quote.monthlyTotalCents, calculatedAnnualCents: quote.annualTotalCents, foundingRate: Boolean(findPlan(state, firm.membership.planId)?.foundingPlan) }, firm.membership);
  firm.updatedBy = clean(actor, 100) || 'owner'; state.firms.unshift(firm); writeState(state);
  store.addAudit({ actor:'owner-control-center', action:'professional_firm_created', details:{ firmId:firm.id, name:firm.name, sourceSeeded:firm.sourceSeeded, seatCount:firm.seatCount } });
  return { firm: ownerViewFirm(firm, state) };
}
function updateFirm(id, input, actor = 'owner') {
  const state = readState(); const firm = findFirm(state, id); if (!firm) return null;
  const requestedReviewStatus=clean(input.reviewStatus,80);
  if(requestedReviewStatus==='approved' && (Number(firm.submittedRevision||0)!==Number(firm.profileRevision||1) || !firm.reviewSubmittedAt)) return {error:'Approve only the exact firm revision currently submitted for review.'};
  for (const field of ['name','email','phone','notes','suspensionReason','billingAdministratorName','billingAdministratorEmail','outreachCampaignId','sourceOrigin','dataAuthority','portalPublicationState','reviewStatus','reviewSubmittedAt','lastProfessionalEditAt','duplicateReviewStatus','canonicalRecordState']) if (Object.prototype.hasOwnProperty.call(input, field)) firm[field] = field.includes('Email') || field === 'email' ? email(input[field]) : clean(input[field], field === 'notes' ? 5000 : 220);
  if (Object.prototype.hasOwnProperty.call(input, 'website')) firm.website = safeUrl(input.website);
  if (Object.prototype.hasOwnProperty.call(input, 'publicProfileSlug')) firm.publicProfileSlug = slugify(input.publicProfileSlug || firm.name);
  if (Object.prototype.hasOwnProperty.call(input, 'profileStatus')) firm.profileStatus = oneOf(input.profileStatus, PROFILE_STATUSES, firm.profileStatus);
  if (Object.prototype.hasOwnProperty.call(input, 'claimStatus')) firm.claimStatus = oneOf(input.claimStatus, CLAIM_STATUSES, firm.claimStatus || 'not claimed');
  if (Object.prototype.hasOwnProperty.call(input, 'verificationStatus')) firm.verificationStatus = oneOf(input.verificationStatus, VERIFICATION_STATUSES, firm.verificationStatus || 'not started');
  if (Object.prototype.hasOwnProperty.call(input, 'publicProfileEnabled')) firm.publicProfileEnabled = bool(input.publicProfileEnabled, firm.publicProfileEnabled);
  if (Object.prototype.hasOwnProperty.call(input, 'ownerApprovalStatus')) firm.ownerApprovalStatus = oneOf(input.ownerApprovalStatus, OWNER_APPROVAL_STATUSES, firm.ownerApprovalStatus);
  for (const field of ['locations','jurisdictions','serviceRegions','practiceAreas','languages']) if (Object.prototype.hasOwnProperty.call(input, field)) firm[field] = list(input[field], field === 'locations' ? 50 : 100, 300);
  if (Object.prototype.hasOwnProperty.call(input, 'portalEligibility')) firm.portalEligibility = list(input.portalEligibility, 50, 120).filter(x => portalSlugs.has(x));
  if (Object.prototype.hasOwnProperty.call(input, 'seatCount')) firm.seatCount = int(input.seatCount, firm.seatCount || 1, 1, 10000);
  if (Object.prototype.hasOwnProperty.call(input, 'activeSeatCount')) firm.activeSeatCount = int(input.activeSeatCount, firm.activeSeatCount || 0, 0, firm.seatCount || 10000);
  if (Object.prototype.hasOwnProperty.call(input, 'membership')) firm.membership = sanitizeMembership(input.membership, firm.membership);
  if (Object.prototype.hasOwnProperty.call(input, 'sourceRecords')) firm.sourceRecords = (Array.isArray(input.sourceRecords) ? input.sourceRecords : []).slice(0, 50).map((x, i) => sanitizeSourceRecord(x, firm.sourceRecords?.[i] || {}));
  for (const field of ['marketplaceTermsAcceptedAt','independentProfessionalAcknowledgmentAt','conflictsPolicyAcceptedAt']) if (Object.prototype.hasOwnProperty.call(input, field)) firm[field] = isoOrBlank(input[field]);
  const quote = calculateFirmMembershipQuote(firm.membership.planId || 'nyc-founding-firm', firm.seatCount || 1, state);
  if (!quote.error) firm.membership = sanitizeMembership({ ...firm.membership, seatCount: firm.seatCount, quotedPerSeatCents: quote.monthlyDiscountedPerSeatCents, discountPercent: quote.discountPercent, calculatedMonthlyCents: quote.monthlyTotalCents, calculatedAnnualCents: quote.annualTotalCents, foundingRate: Boolean(findPlan(state, firm.membership.planId)?.foundingPlan) }, firm.membership);
  if (clean(actor,100) === 'professional-account') { firm.profileRevision = Math.max(1,Number(firm.profileRevision||1))+1; firm.lastProfessionalEditAt=store.now(); if (firm.reviewSubmittedAt) firm.reviewStatus='changes-pending-review'; }
  if (Object.prototype.hasOwnProperty.call(input,'submittedRevision')) firm.submittedRevision=Math.max(0,Number(input.submittedRevision)||0);
  if(requestedReviewStatus==='approved'){firm.reviewedRevision=Math.max(1,Number(firm.profileRevision||1));firm.reviewDecisionAt=store.now();}
  if(['changes-requested','rejected'].includes(requestedReviewStatus)){firm.portalPublicationState='not distributed';firm.publicProfileEnabled=false;firm.reviewedRevision=0;firm.reviewDecisionAt=store.now();}
  firm.updatedAt = store.now(); firm.updatedBy = clean(actor, 100) || 'owner'; writeState(state);
  store.addAudit({ actor:'owner-control-center', action:'professional_firm_updated', details:{ firmId:firm.id, membershipStatus:firm.membership.status, approvalStatus:firm.ownerApprovalStatus, seatCount:firm.seatCount, discountPercent:firm.membership.discountPercent } });
  return { firm: ownerViewFirm(firm, state) };
}
function createProfessional(input, actor = 'owner') {
  const state = readState(); const professional = defaultProfessional(input);
  if (professional.displayName.length < 2) return { error:'Add a professional display name.' };
  if (professional.firmId && !findFirm(state, professional.firmId)) return { error:'The selected firm record was not found.' };
  const duplicateExternalSourceId = professional.externalSourceIds.find(id => state.professionals.some(x => (x.externalSourceIds || []).includes(id)));
  if (duplicateExternalSourceId) return { error:'That public-source record has already been imported.', duplicateExternalSourceId };
  const credentialIds = professional.credentials.map(x => clean(x.identifier, 180)).filter(Boolean);
  const duplicateCredentialIdentifier = credentialIds.find(id => state.professionals.some(x => (x.credentials || []).some(c => clean(c.identifier, 180) === id)));
  if (duplicateCredentialIdentifier) return { error:'A professional with that credential identifier already exists.', duplicateCredentialIdentifier };
  const duplicateProfessional = state.professionals.find(x => x.profileStatus !== 'archived' && normalizedKey(x.displayName) === normalizedKey(professional.displayName) && professional.email && x.email === professional.email && normalizedKey(x.firmId) === normalizedKey(professional.firmId));
  if (duplicateProfessional) return { error:'A matching professional profile already exists. Use the existing profile or request duplicate review.', duplicateProfessionalId:duplicateProfessional.id };
  professional.publicProfileSlug = uniqueProfileSlug(professional.publicProfileSlug || professional.displayName, professional.id, state.professionals);
  professional.updatedBy = clean(actor, 100) || 'owner'; state.professionals.unshift(professional);
  if (professional.firmId) { const firm = findFirm(state, professional.firmId); if (firm && !firm.professionalIds.includes(professional.id)) firm.professionalIds.push(professional.id); }
  writeState(state); store.addAudit({ actor:'owner-control-center', action:'professional_record_created', details:{ professionalId:professional.id, displayName:professional.displayName, sourceSeeded:professional.sourceSeeded, sourceCount:professional.sourceRecords.length } });
  return { professional: ownerViewProfessional(professional, state) };
}
function updateProfessional(id, input, actor = 'owner') {
  const state = readState(); const professional = findProfessional(state, id); if (!professional) return null;
  const requestedReviewStatus=clean(input.reviewStatus,80);
  if(requestedReviewStatus==='approved' && (Number(professional.submittedRevision||0)!==Number(professional.profileRevision||1) || !professional.reviewSubmittedAt)) return {error:'Approve only the exact profile revision currently submitted for review.'};
  for (const field of ['displayName','firstName','lastName','email','phone','biography','suspensionReason','ownerNotes','firmId','outreachCampaignId','sourceOrigin','dataAuthority','portalPublicationState','reviewStatus','reviewSubmittedAt','lastProfessionalEditAt','duplicateReviewStatus','canonicalRecordState']) if (Object.prototype.hasOwnProperty.call(input, field)) professional[field] = field === 'email' ? email(input[field]) : clean(input[field], ['biography','ownerNotes'].includes(field) ? 8000 : 220);
  if (professional.firmId && !findFirm(state, professional.firmId)) return { error:'The selected firm record was not found.' };
  for (const field of ['website','photoUrl']) if (Object.prototype.hasOwnProperty.call(input, field)) professional[field] = safeUrl(input[field]);
  if (Object.prototype.hasOwnProperty.call(input, 'publicProfileSlug')) professional.publicProfileSlug = slugify(input.publicProfileSlug || professional.displayName);
  if (Object.prototype.hasOwnProperty.call(input, 'publicProfileEnabled')) professional.publicProfileEnabled = bool(input.publicProfileEnabled, professional.publicProfileEnabled);
  if (Object.prototype.hasOwnProperty.call(input, 'claimStatus')) professional.claimStatus = oneOf(input.claimStatus, CLAIM_STATUSES, professional.claimStatus);
  if (Object.prototype.hasOwnProperty.call(input, 'professionalType')) professional.professionalType = oneOf(input.professionalType, PROFESSIONAL_TYPES, professional.professionalType);
  if (Object.prototype.hasOwnProperty.call(input, 'profileStatus')) professional.profileStatus = oneOf(input.profileStatus, PROFILE_STATUSES, professional.profileStatus);
  if (Object.prototype.hasOwnProperty.call(input, 'verificationStatus')) professional.verificationStatus = oneOf(input.verificationStatus, VERIFICATION_STATUSES, professional.verificationStatus);
  if (Object.prototype.hasOwnProperty.call(input, 'ownerApprovalStatus')) professional.ownerApprovalStatus = oneOf(input.ownerApprovalStatus, OWNER_APPROVAL_STATUSES, professional.ownerApprovalStatus);
  for (const field of ['languages','officeLocations','jurisdictions','practiceAreas','verificationScope','serviceRegions']) if (Object.prototype.hasOwnProperty.call(input, field)) professional[field] = list(input[field], 100, 300);
  if (Object.prototype.hasOwnProperty.call(input, 'serviceRoles')) professional.serviceRoles = list(input.serviceRoles, 30, 120).filter(x => PROFESSIONAL_SERVICE_ROLES.includes(x));
  if (Object.prototype.hasOwnProperty.call(input, 'availabilityStatus')) professional.availabilityStatus = oneOf(input.availabilityStatus, AVAILABILITY_STATUSES, professional.availabilityStatus || 'not configured');
  if (Object.prototype.hasOwnProperty.call(input, 'consultationModes')) professional.consultationModes = list(input.consultationModes, 20, 80).filter(x => CONSULTATION_MODES.includes(x));
  if (Object.prototype.hasOwnProperty.call(input, 'availabilityNote')) professional.availabilityNote = clean(input.availabilityNote, 1200);
  if (Object.prototype.hasOwnProperty.call(input, 'portalEligibility')) professional.portalEligibility = list(input.portalEligibility, 50, 120).filter(x => portalSlugs.has(x));
  if (Object.prototype.hasOwnProperty.call(input, 'membership')) professional.membership = sanitizeMembership(input.membership, professional.membership);
  if (Object.prototype.hasOwnProperty.call(input, 'credentials')) professional.credentials = (Array.isArray(input.credentials) ? input.credentials : []).slice(0, 30).map((x, i) => sanitizeCredential(x, professional.credentials?.[i] || {}));
  if (Object.prototype.hasOwnProperty.call(input, 'consultationServices')) professional.consultationServices = (Array.isArray(input.consultationServices) ? input.consultationServices : []).slice(0, 30).map((x, i) => sanitizeService(x, professional.consultationServices?.[i] || {}));
  if (Object.prototype.hasOwnProperty.call(input, 'sourceRecords')) professional.sourceRecords = (Array.isArray(input.sourceRecords) ? input.sourceRecords : []).slice(0, 50).map((x, i) => sanitizeSourceRecord(x, professional.sourceRecords?.[i] || {}));
  if (Object.prototype.hasOwnProperty.call(input, 'externalSourceIds')) professional.externalSourceIds = list(input.externalSourceIds, 50, 240);
  if (Object.prototype.hasOwnProperty.call(input, 'publicFacts')) professional.publicFacts = sanitizePublicFacts(input.publicFacts, professional.publicFacts || {});
  if (Object.prototype.hasOwnProperty.call(input, 'sponsorship')) professional.sponsorship = sanitizeSponsorship(input.sponsorship, professional.sponsorship);
  for (const field of ['marketplaceTermsAcceptedAt','independentProfessionalAcknowledgmentAt','conflictsPolicyAcceptedAt']) if (Object.prototype.hasOwnProperty.call(input, field)) professional[field] = isoOrBlank(input[field]);
  if (clean(actor,100) === 'professional-account') { professional.profileRevision = Math.max(1,Number(professional.profileRevision||1))+1; professional.lastProfessionalEditAt=store.now(); if (professional.reviewSubmittedAt) professional.reviewStatus='changes-pending-review'; }
  if (Object.prototype.hasOwnProperty.call(input,'submittedRevision')) professional.submittedRevision=Math.max(0,Number(input.submittedRevision)||0);
  if(requestedReviewStatus==='approved'){professional.reviewedRevision=Math.max(1,Number(professional.profileRevision||1));professional.reviewDecisionAt=store.now();}
  if(['changes-requested','rejected'].includes(requestedReviewStatus)){professional.portalPublicationState='not distributed';professional.publicProfileEnabled=false;professional.reviewedRevision=0;professional.reviewDecisionAt=store.now();}
  professional.updatedAt = store.now(); professional.updatedBy = clean(actor, 100) || 'owner'; writeState(state);
  const eligibility = evaluateProfessionalEligibility(professional, state);
  store.addAudit({ actor:'owner-control-center', action:'professional_record_updated', details:{ professionalId:professional.id, membershipStatus:professional.membership.status, verificationStatus:professional.verificationStatus, ownerApprovalStatus:professional.ownerApprovalStatus, consultationEligible:eligibility.consultationEligible } });
  return { professional: ownerViewProfessional(professional, state) };
}

function updateMembershipPlan(id, input) {
  const state = readState(); const plan = findPlan(state, id); if (!plan) return null;
  for (const field of ['name','status','description','pricingMode']) if (Object.prototype.hasOwnProperty.call(input, field)) plan[field] = clean(input[field], field === 'description' ? 3000 : 180);
  for (const field of ['monthlyPriceCents','annualPriceCents']) if (Object.prototype.hasOwnProperty.call(input, field)) plan[field] = nullableMoney(input[field]);
  if (Object.prototype.hasOwnProperty.call(input, 'features')) plan.features = list(input.features, 50, 500);
  if (Object.prototype.hasOwnProperty.call(input, 'includedStaffSeats')) plan.includedStaffSeats = input.includedStaffSeats == null ? plan.includedStaffSeats : int(input.includedStaffSeats, 0, 0, 10000);
  if (Object.prototype.hasOwnProperty.call(input, 'foundingPlan')) plan.foundingPlan = bool(input.foundingPlan, plan.foundingPlan || false);
  plan.billingModel = plan.id === 'basic-directory' ? 'free' : clean(plan.billingModel || 'fixed subscription', 180); plan.consultationEligibility = plan.id !== 'basic-directory';
  plan.updatedAt = store.now(); writeState(state); store.addAudit({ actor:'owner-control-center', action:'professional_membership_plan_updated', details:{ planId:id, monthlyPriceCents:plan.monthlyPriceCents, annualPriceCents:plan.annualPriceCents } });
  return { plan };
}
function updateRevenueProgram(id, input) {
  const state = readState(); const program = state.revenuePrograms.find(x => x.id === id); if (!program) return null;
  for (const field of ['name','category','model','complianceGate','description','ownerNotes']) if (Object.prototype.hasOwnProperty.call(input, field)) program[field] = clean(input[field], ['description','complianceGate','ownerNotes'].includes(field) ? 4000 : 240);
  if (Object.prototype.hasOwnProperty.call(input, 'status')) program.status = oneOf(input.status, REVENUE_PROGRAM_STATUSES, program.status);
  if (Object.prototype.hasOwnProperty.call(input, 'priority')) program.priority = oneOf(input.priority, ['critical','high','medium','low'], program.priority || 'medium');
  program.updatedAt = store.now(); writeState(state); store.addAudit({ actor:'owner-control-center', action:'marketplace_revenue_program_updated', details:{ programId:id, status:program.status } });
  return { program };
}
function createProfileRequest(input, actor = 'owner') {
  const state = readState(); const profileId = clean(input.profileId, 180); const professional = findProfessional(state, profileId); const firm = findFirm(state, profileId);
  if (!professional && !firm) return { error:'The professional or firm profile was not found.' };
  const requesterName = clean(input.requesterName,180);
  const requesterEmail = email(input.requesterEmail);
  const details = clean(input.details,6000);
  if (requesterName.length < 2) return { error:'Add your name.' };
  if (!requesterEmail) return { error:'Add a valid email address.' };
  if (details.length < 10) return { error:'Add enough detail for the profile team to understand the request.' };
  const createdAt = store.now();
  const request = {
    id:store.uid('profile_request',10),
    publicReference:`SJ-PROFILE-${createdAt.slice(0,10).replace(/-/g,'')}-${store.uid('',4).replace(/[^a-z0-9]/gi,'').toUpperCase().slice(-6)}`,
    profileId:(professional || firm).id, profileKind:professional ? 'professional' : 'firm',
    requestType:oneOf(input.requestType, PROFILE_REQUEST_TYPES, 'other'), status:'new', requesterName, requesterEmail,
    requesterRelationship:clean(input.requesterRelationship,180), details,
    evidenceUrls:list(input.evidenceUrls,20,1500).map(safeUrl).filter(Boolean),
    sourcePage:safeUrl(input.sourcePage), privacyAcknowledged:Boolean(input.privacyAcknowledged),
    identityVerificationNotes:'', resolutionNotes:'', createdAt, updatedAt:createdAt, createdBy:clean(actor,100) || 'owner'
  };
  state.profileRequests.unshift(request); if (professional && request.requestType === 'claim') { professional.claimStatus = 'claim requested'; professional.profileStatus = 'claim pending'; professional.updatedAt = store.now(); }
  writeState(state); store.addAudit({ actor:clean(actor,100) || 'owner-control-center', action:'professional_profile_request_created', details:{ requestId:request.id, publicReference:request.publicReference, profileId:request.profileId, profileKind:request.profileKind, requestType:request.requestType } }); return { request };
}
function publicProfileRequestReceipt(request) {
  if (!request) return null;
  return { reference:request.publicReference || request.id, status:request.status, requestType:request.requestType, profileKind:request.profileKind, createdAt:request.createdAt };
}
function updateProfileRequest(id, input) {
  const state = readState(); const request = state.profileRequests.find(x => x.id === id); if (!request) return null;
  if (Object.prototype.hasOwnProperty.call(input, 'status')) request.status = oneOf(input.status, PROFILE_REQUEST_STATUSES, request.status);
  for (const field of ['identityVerificationNotes','resolutionNotes','details']) if (Object.prototype.hasOwnProperty.call(input, field)) request[field] = clean(input[field], 6000);
  request.updatedAt = store.now(); const professional = findProfessional(state, request.profileId);
  if (professional && request.requestType === 'claim' && request.status === 'approved') { professional.claimStatus = 'claimed'; professional.profileStatus = professional.verificationStatus === 'verified' ? 'verified' : 'claimed'; professional.updatedAt = store.now(); }
  writeState(state); store.addAudit({ actor:'owner-control-center', action:'professional_profile_request_updated', details:{ requestId:id, status:request.status } }); return { request };
}

function recordCredentialVerification(professionalId, input = {}) {
  const state=readState(); const professional=findProfessional(state,professionalId); if(!professional) return {error:'Professional profile not found.'};
  const credentialId=clean(input.credentialId,180); let credential=(professional.credentials || []).find(item=>item.id===credentialId);
  if(!credential){ credential=sanitizeCredential({id:credentialId || store.uid('credential',8),credentialType:input.credentialType,jurisdiction:input.jurisdiction,identifier:input.identifier,status:'pending',verificationSource:input.verificationSource,notes:input.notes}); professional.credentials=[...(professional.credentials||[]),credential]; }
  credential.status=oneOf(input.status,CREDENTIAL_STATUSES,credential.status || 'pending'); credential.verificationSource=safeUrl(input.verificationSource ?? credential.verificationSource); credential.expirationDate=isoOrBlank(input.expirationDate ?? credential.expirationDate); credential.notes=clean(input.notes ?? credential.notes,4000); credential.verifiedAt=credential.status==='active' ? store.now() : (credential.verifiedAt || ''); credential.verifiedBy='owner-control-center';
  professional.verificationScope=list(input.verificationScope ?? professional.verificationScope,100,300); professional.verificationStatus=activeCredentialCount(professional)>0 ? 'verified' : oneOf(input.verificationStatus,VERIFICATION_STATUSES,professional.verificationStatus || 'in progress'); professional.updatedAt=store.now(); professional.updatedBy='owner-credential-verification'; writeState(state);
  store.addAudit({actor:'owner-control-center',action:'professional_credential_verification_recorded',details:{professionalId:professional.id,credentialId:credential.id,status:credential.status,verificationStatus:professional.verificationStatus}}); return {professional:ownerViewProfessional(professional,state)};
}
function createComplaint(input = {}) {
  const state=readState(); const professional=findProfessional(state,clean(input.professionalId,180)); const firm=findFirm(state,clean(input.firmId,180)); if(!professional && !firm) return {error:'Select a professional or firm record.'};
  const severity=oneOf(input.severity,['low','medium','high','critical'],'medium');
  const complaint={id:store.uid('complaint',10),professionalId:professional?.id || '',firmId:firm?.id || '',status:'new',category:clean(input.category,180),severity,summary:clean(input.summary,5000),source:clean(input.source || 'owner-recorded',180),receivedAt:isoOrBlank(input.receivedAt)||store.now(),ownerNotes:clean(input.ownerNotes,5000),resolution:'',resolvedAt:'',createdAt:store.now(),updatedAt:store.now()};
  if(!complaint.category || !complaint.summary) return {error:'Add a complaint category and private summary.'};
  let suspended=false;
  if(professional && bool(input.suspendImmediately,false)){ professional.preSuspensionProfileStatus=professional.profileStatus; professional.preSuspensionOwnerApprovalStatus=professional.ownerApprovalStatus; professional.suspensionReason=clean(input.suspensionReason || `Immediate hold while complaint ${complaint.id} is reviewed.`,3000); professional.ownerApprovalStatus='suspended'; professional.profileStatus='suspended'; professional.updatedAt=store.now(); professional.updatedBy='owner-compliance-action'; suspended=true; }
  state.complaints.unshift(complaint); writeState(state); store.addAudit({actor:'owner-control-center',action:'professional_complaint_created',details:{complaintId:complaint.id,professionalId:complaint.professionalId,firmId:complaint.firmId,severity,suspended}}); return {complaint,suspended,professional:professional?ownerViewProfessional(professional,state):null};
}
function resolveComplaint(id, input = {}) {
  const state=readState(); const complaint=state.complaints.find(item=>item.id===id); if(!complaint) return null; complaint.status=oneOf(input.status,['new','reviewing','resolved','dismissed','referred'],complaint.status); complaint.ownerNotes=clean(input.ownerNotes ?? complaint.ownerNotes,5000); complaint.resolution=clean(input.resolution ?? complaint.resolution,5000); complaint.updatedAt=store.now(); if(['resolved','dismissed','referred'].includes(complaint.status)) complaint.resolvedAt=store.now(); writeState(state); store.addAudit({actor:'owner-control-center',action:'professional_complaint_updated',details:{complaintId:id,status:complaint.status}}); return {complaint};
}
function setProfessionalSuspension(professionalId, input = {}) {
  const state=readState(); const professional=findProfessional(state,professionalId); if(!professional) return {error:'Professional profile not found.'}; const suspend=bool(input.suspended,true);
  if(suspend){ if(professional.profileStatus!=='suspended') professional.preSuspensionProfileStatus=professional.profileStatus; if(professional.ownerApprovalStatus!=='suspended') professional.preSuspensionOwnerApprovalStatus=professional.ownerApprovalStatus; professional.suspensionReason=clean(input.reason,3000); professional.ownerApprovalStatus='suspended'; professional.profileStatus='suspended'; }
  else { professional.suspensionReason=''; professional.ownerApprovalStatus=oneOf(input.ownerApprovalStatus,OWNER_APPROVAL_STATUSES,professional.preSuspensionOwnerApprovalStatus || 'pending'); professional.profileStatus=professional.preSuspensionProfileStatus || (professional.claimStatus==='claimed'?'claimed':'unclaimed public profile'); professional.preSuspensionProfileStatus=''; professional.preSuspensionOwnerApprovalStatus=''; }
  professional.updatedAt=store.now(); professional.updatedBy='owner-compliance-action'; writeState(state); store.addAudit({actor:'owner-control-center',action:suspend?'professional_suspended':'professional_suspension_cleared',details:{professionalId:professional.id,reason:professional.suspensionReason}}); return {professional:ownerViewProfessional(professional,state)};
}

function importSeededProfessionals(records, options = {}, actor = 'official-source-import') {
  const source = Array.isArray(records) ? records : []; const results = { created:[], duplicates:[], errors:[] };
  const requestedPortals = list(options.portalEligibility,50,120).filter(x => portalSlugs.has(x)); const requestedPracticeAreas = list(options.practiceAreas,100,180);
  for (const record of source.slice(0,50)) {
    const input = { ...record, seededFromPublicInfo:true }; if (requestedPortals.length) input.portalEligibility = requestedPortals; if (requestedPracticeAreas.length) input.practiceAreas = requestedPracticeAreas;
    const result = createProfessional(input, actor);
    if (result.error) { const item = { displayName:clean(input.displayName,180), error:result.error }; if (result.duplicateExternalSourceId || result.duplicateCredentialIdentifier) results.duplicates.push(item); else results.errors.push(item); }
    else results.created.push(result.professional);
  }
  store.addAudit({ actor:'owner-control-center', action:'official_professional_source_import_completed', details:{ requested:source.length, created:results.created.length, duplicates:results.duplicates.length, errors:results.errors.length } }); return results;
}

function campaignPublicOffer(state, campaign) {
  if (!campaign || !['pilot-ready','active'].includes(campaign.status)) return null;
  const plan = findPlan(state, campaign.offerPlanId || 'nyc-founding-professional');
  return {
    campaignCode: campaign.campaignCode, name: campaign.publicName || campaign.name, market: campaign.market, status: campaign.status,
    offerPlanId: plan?.id || '', offerPlanName: plan?.name || '', monthlyPriceCents: plan?.monthlyPriceCents ?? null, annualPriceCents: plan?.annualPriceCents ?? null,
    foundingOffer: Boolean(plan?.foundingPlan), benefits: (plan?.features || []).slice(0,12), firmDiscountTiers: state.firmVolumeDiscountTiers,
    disclosure: 'Submitting interest does not activate a membership, publish a profile, guarantee consultations, create a professional relationship, or change credential and eligibility requirements.'
  };
}
function createOutreachCampaign(input, actor = 'owner') {
  const state = readState(); const baseCode = publicCampaignCode(input.campaignCode || `NYC-FOUNDING-${store.uid('',4).replace(/^_/, '')}`) || `NYC-FOUNDING-${cryptoRandomCode()}`;
  if (state.outreachCampaigns.some(x => x.campaignCode === baseCode)) return { error:'That campaign code is already in use.' };
  const campaign = {
    id: store.uid('campaign',10), campaignCode: baseCode, name: clean(input.name,180) || 'NYC Founding Professional Pilot', publicName: clean(input.publicName,180) || 'NYC Founding Professional Membership',
    status: oneOf(input.status, OUTREACH_CAMPAIGN_STATUSES, 'draft'), market: clean(input.market,180) || 'New York City', channel: oneOf(input.channel, OUTREACH_CHANNELS, 'in-person building outreach'),
    building: clean(input.building,240), address: clean(input.address,400), borough: clean(input.borough,100), targetProfessionalTypes: list(input.targetProfessionalTypes,20,120).filter(x => PROFESSIONAL_TYPES.includes(x)),
    offerPlanId: clean(input.offerPlanId,100) || 'nyc-founding-professional', firmOfferPlanId: clean(input.firmOfferPlanId,100) || 'nyc-founding-firm', startsAt: isoOrBlank(input.startsAt), endsAt: isoOrBlank(input.endsAt),
    enrollmentPath: '/professional-membership.html', notes: clean(input.notes,5000), createdAt: store.now(), updatedAt: store.now(), createdBy: clean(actor,100) || 'owner'
  };
  state.outreachCampaigns.unshift(campaign); writeState(state); store.addAudit({ actor:'owner-control-center', action:'professional_outreach_campaign_created', details:{ campaignId:campaign.id, campaignCode:campaign.campaignCode, market:campaign.market } });
  return { campaign, publicOffer:campaignPublicOffer(state,campaign) };
}
function cryptoRandomCode() { return store.uid('x',4).replace(/[^a-z0-9]/gi,'').toUpperCase().slice(-8); }
function updateOutreachCampaign(id, input, actor = 'owner') {
  const state = readState(); const campaign = findCampaign(state, id); if (!campaign) return null;
  for (const field of ['name','publicName','market','building','address','borough','notes','offerPlanId','firmOfferPlanId']) if (Object.prototype.hasOwnProperty.call(input, field)) campaign[field] = clean(input[field], field === 'notes' ? 5000 : 400);
  if (Object.prototype.hasOwnProperty.call(input, 'status')) campaign.status = oneOf(input.status, OUTREACH_CAMPAIGN_STATUSES, campaign.status);
  if (Object.prototype.hasOwnProperty.call(input, 'channel')) campaign.channel = oneOf(input.channel, OUTREACH_CHANNELS, campaign.channel);
  if (Object.prototype.hasOwnProperty.call(input, 'targetProfessionalTypes')) campaign.targetProfessionalTypes = list(input.targetProfessionalTypes,20,120).filter(x => PROFESSIONAL_TYPES.includes(x));
  if (Object.prototype.hasOwnProperty.call(input, 'startsAt')) campaign.startsAt = isoOrBlank(input.startsAt); if (Object.prototype.hasOwnProperty.call(input, 'endsAt')) campaign.endsAt = isoOrBlank(input.endsAt);
  campaign.updatedAt = store.now(); writeState(state); store.addAudit({ actor:'owner-control-center', action:'professional_outreach_campaign_updated', details:{ campaignId:campaign.id, status:campaign.status } });
  return { campaign, publicOffer:campaignPublicOffer(state,campaign) };
}
function createOutreachProspect(input, actor = 'owner') {
  const state = readState(); const campaign = input.campaignId || input.campaignCode ? findCampaign(state, input.campaignId || input.campaignCode) : null;
  const professionalType = oneOf(input.professionalType, PROFESSIONAL_TYPES, 'attorney'); const contactEmail = email(input.email); const phone = clean(input.phone,80);
  if (actor === 'public-professional-interest' && (!campaign || !['pilot-ready','active'].includes(campaign.status))) return { error:'This founding-member campaign is not accepting interest.' };
  if (clean(input.contactName || input.professionalName,180).length < 2) return { error:'Add the professional or contact name.' };
  if (!contactEmail && !phone) return { error:'Add an email address or phone number.' };
  const seats = int(input.potentialSeats || input.firmSeatEstimate, 1, 1, 10000); const planId = clean(input.proposalPlanId,100) || (seats > 1 ? campaign?.firmOfferPlanId || 'nyc-founding-firm' : campaign?.offerPlanId || 'nyc-founding-professional');
  const plan = findPlan(state, planId); const firmQuote = seats > 1 ? calculateFirmMembershipQuote(planId, seats, state) : null;
  const monthly = seats > 1 ? firmQuote?.monthlyTotalCents : plan?.monthlyPriceCents;
  const prospect = {
    id:store.uid('prospect',10), campaignId:campaign?.id || '', campaignCode:campaign?.campaignCode || '', sourceChannel:oneOf(input.sourceChannel,OUTREACH_CHANNELS,actor === 'public-professional-interest' ? 'website or QR signup' : campaign?.channel || 'in-person building outreach'),
    status:oneOf(input.status,OUTREACH_PROSPECT_STATUSES,actor === 'public-professional-interest' ? 'application started' : 'new'), building:clean(input.building || campaign?.building,240), address:clean(input.address || campaign?.address,400), floor:clean(input.floor,80), borough:clean(input.borough || campaign?.borough,100),
    firmId:clean(input.firmId,180), firmName:clean(input.firmName,240), professionalId:clean(input.professionalId,180), professionalName:clean(input.professionalName || input.contactName,180), contactName:clean(input.contactName || input.professionalName,180),
    professionalType, email:contactEmail, phone, registrationNumber:clean(input.registrationNumber,80), practiceAreas:list(input.practiceAreas,50,180), potentialSeats:seats,
    proposalPlanId:planId, quotedMonthlyPerSeatCents:seats>1 ? firmQuote?.monthlyDiscountedPerSeatCents ?? null : plan?.monthlyPriceCents ?? null,
    quotedAnnualPerSeatCents:seats>1 ? firmQuote?.annualDiscountedPerSeatCents ?? null : plan?.annualPriceCents ?? null, discountPercent:seats>1 ? firmQuote?.discountPercent || 0 : 0,
    estimatedMonthlyRevenueCents:monthly ?? 0, preferredBillingCadence:oneOf(input.preferredBillingCadence,['monthly','annual','undecided'],'undecided'), consultationInterests:list(input.consultationInterests,20,180),
    dateVisited:isoOrBlank(input.dateVisited), lastContactAt:isoOrBlank(input.lastContactAt), nextFollowUpAt:isoOrBlank(input.nextFollowUpAt), objections:list(input.objections,30,500), notes:clean(input.notes,5000),
    consentToContact:actor === 'public-professional-interest' ? bool(input.consentToContact,false) : bool(input.consentToContact,true), createdAt:store.now(), updatedAt:store.now(), createdBy:clean(actor,100) || 'owner'
  };
  if (actor === 'public-professional-interest' && !prospect.consentToContact) return { error:'Consent to contact is required to submit professional membership interest.' };
  state.outreachProspects.unshift(prospect); writeState(state); store.addAudit({ actor:actor === 'public-professional-interest' ? 'professional-interest-form' : 'owner-control-center', action:'professional_outreach_prospect_created', details:{ prospectId:prospect.id, campaignCode:prospect.campaignCode, potentialSeats:prospect.potentialSeats, status:prospect.status } });
  return { prospect, confirmationId:prospect.id };
}
function updateOutreachProspect(id, input, actor = 'owner') {
  const state = readState(); const prospect = findProspect(state,id); if (!prospect) return null;
  for (const field of ['building','address','floor','borough','firmId','firmName','professionalId','professionalName','contactName','email','phone','registrationNumber','proposalPlanId','notes']) if (Object.prototype.hasOwnProperty.call(input,field)) prospect[field] = field === 'email' ? email(input[field]) : clean(input[field],field === 'notes' ? 5000 : 400);
  if (Object.prototype.hasOwnProperty.call(input,'status')) prospect.status = oneOf(input.status,OUTREACH_PROSPECT_STATUSES,prospect.status);
  if (Object.prototype.hasOwnProperty.call(input,'sourceChannel')) prospect.sourceChannel = oneOf(input.sourceChannel,OUTREACH_CHANNELS,prospect.sourceChannel);
  if (Object.prototype.hasOwnProperty.call(input,'professionalType')) prospect.professionalType = oneOf(input.professionalType,PROFESSIONAL_TYPES,prospect.professionalType);
  if (Object.prototype.hasOwnProperty.call(input,'potentialSeats')) prospect.potentialSeats = int(input.potentialSeats,prospect.potentialSeats || 1,1,10000);
  for (const field of ['practiceAreas','consultationInterests','objections']) if (Object.prototype.hasOwnProperty.call(input,field)) prospect[field] = list(input[field],50,500);
  for (const field of ['dateVisited','lastContactAt','nextFollowUpAt']) if (Object.prototype.hasOwnProperty.call(input,field)) prospect[field] = isoOrBlank(input[field]);
  if (Object.prototype.hasOwnProperty.call(input,'preferredBillingCadence')) prospect.preferredBillingCadence = oneOf(input.preferredBillingCadence,['monthly','annual','undecided'],prospect.preferredBillingCadence);
  const plan = findPlan(state,prospect.proposalPlanId); const quote = prospect.potentialSeats>1 ? calculateFirmMembershipQuote(prospect.proposalPlanId,prospect.potentialSeats,state) : null;
  prospect.quotedMonthlyPerSeatCents = prospect.potentialSeats>1 ? quote?.monthlyDiscountedPerSeatCents ?? null : plan?.monthlyPriceCents ?? null;
  prospect.quotedAnnualPerSeatCents = prospect.potentialSeats>1 ? quote?.annualDiscountedPerSeatCents ?? null : plan?.annualPriceCents ?? null;
  prospect.discountPercent = prospect.potentialSeats>1 ? quote?.discountPercent || 0 : 0; prospect.estimatedMonthlyRevenueCents = prospect.potentialSeats>1 ? quote?.monthlyTotalCents || 0 : plan?.monthlyPriceCents || 0;
  prospect.updatedAt = store.now(); writeState(state); store.addAudit({ actor:'owner-control-center', action:'professional_outreach_prospect_updated', details:{ prospectId:id, status:prospect.status, potentialSeats:prospect.potentialSeats } }); return { prospect };
}
function getPublicCampaignOffer(code) { const state=readState(); return campaignPublicOffer(state,findCampaign(state,code)); }
function createPublicMembershipInterest(input) { return createOutreachProspect(input,'public-professional-interest'); }


function publicSourceSummary(source) {
  return { sourceName:source.sourceName || '', sourceUrl:source.sourceUrl || '', authorityLevel:source.authorityLevel || '', reviewStatus:source.reviewStatus || '', retrievedAt:source.retrievedAt || '', lastVerifiedAt:source.lastVerifiedAt || '', factsSupported:source.factsSupported || [], publisher:source.publisher || '' };
}
function unique(values){ return [...new Set((values || []).filter(Boolean))]; }
function locationData(locations=[],jurisdictions=[]){
  const fallbackState=jurisdictions.length===1 && jurisdictions[0]==='New York' ? 'NY' : '';
  return unique(locations).map(value=>extractUsLocation(value,fallbackState));
}
function sourceReviewDate(records=[]){ return latestSourceReviewDate(records); }
function rowStatus(row){
  if(row.participating)return 'participating';
  if(row.verified)return 'verified';
  if(row.claimed)return 'claimed';
  return 'unclaimed';
}
function firmVerification(firm){ return firm?.verificationStatus==='verified'; }
function profileHasQualifyingSource(row){
  return (row.sourceRecords || []).some(source=>source.sourceName && source.sourceUrl && source.retrievedAt && (source.factsSupported || []).length && source.authorityLevel!=='secondary');
}
function isQualifyingProfessionalProfile(row){
  return Boolean(row && row.displayName && row.professionalType && (row.practiceAreas || []).length && (row.officeLocations || []).length && (row.jurisdictions || []).length && profileHasQualifyingSource(row));
}
function isQualifyingFirmProfile(row){
  return Boolean(row && row.name && (row.practiceAreas || []).length && (row.locations || []).length && (row.jurisdictions || []).length && profileHasQualifyingSource(row));
}
function directoryMetrics(state=readState()){
  const professionals=state.professionals.map(x=>publicProfessional(x,state)).filter(Boolean);
  const firms=state.firms.map(x=>publicFirm(x,state)).filter(Boolean);
  const qualifyingProfessionals=professionals.filter(isQualifyingProfessionalProfile).length;
  const qualifyingFirms=firms.filter(isQualifyingFirmProfile).length;
  return { publicProfessionals:professionals.length, publicFirms:firms.length, publicTotal:professionals.length+firms.length, qualifyingProfessionals, qualifyingFirms, qualifyingTotal:qualifyingProfessionals+qualifyingFirms, qualificationRule:'Complete public profile with supported professional type or firm identity, documented practice or service area, business office, jurisdiction, and at least one non-secondary source record with review date and supported facts.' };
}
function publicFirm(firm, state) {
  if (!firm || !firm.publicProfileEnabled || ['suspended','archived'].includes(firm.profileStatus)) return null;
  const professionals=state ? state.professionals.filter(x=>x.firmId===firm.id).map(x=>publicProfessional(x,state)).filter(Boolean) : [];
  const practiceAreas=unique([...(firm.practiceAreas||[]),...professionals.flatMap(x=>x.practiceAreas||[])]).sort((a,b)=>a.localeCompare(b));
  const languages=unique([...(firm.languages||[]),...professionals.flatMap(x=>x.languages||[])]).sort((a,b)=>a.localeCompare(b));
  const serviceMethods=unique([...(firm.serviceMethods||[]),...professionals.flatMap(x=>x.consultationModes||[])]).sort((a,b)=>a.localeCompare(b));
  const sourceRecords=(firm.sourceRecords || []).map(publicSourceSummary);
  const verified=firmVerification(firm);
  const participating=['participating','integrated'].includes(firm.profileStatus);
  const claimed=participating || verified || firm.claimStatus==='claimed' || firm.profileStatus==='claimed';
  const row={ id:firm.publicProfileSlug || firm.id, recordId:firm.id, name:firm.name, profileStatus:firm.profileStatus, claimStatus:firm.claimStatus || 'not claimed', claimed, verified, participating, website:firm.website || '', phone:firm.phone || '', locations:firm.locations || [], locationData:locationData(firm.locations||[],firm.jurisdictions||[]), jurisdictions:firm.jurisdictions || [], serviceRegions:firm.serviceRegions || [], portalEligibility:firm.portalEligibility || [], practiceAreas, languages, serviceMethods, professionalCount:professionals.length, professionals:professionals.map(x=>({id:x.id,displayName:x.displayName,professionalType:x.professionalType,claimed:x.claimed,verified:x.verified,consultationEligible:x.consultationEligible,practiceAreas:x.practiceAreas,serviceRoles:x.serviceRoles||[]})), membershipActive:firm.membership?.status === 'active', sourceRecords, sourceReviewedAt:sourceReviewDate(sourceRecords), disclosure:'Public information profile. Listing does not imply endorsement, participation, availability, or a professional relationship.' };
  row.searchStatus=rowStatus(row);
  row.qualifyingProfile=isQualifyingFirmProfile(row);
  return row;
}
function publicProfessional(professional, state) {
  if (!professional || !professional.publicProfileEnabled || ['suspended','archived'].includes(professional.profileStatus)) return null;
  const firm=findFirm(state,professional.firmId); const eligibility=evaluateProfessionalEligibility(professional,state);
  const paidAccess=professionalPromotionProgram.evaluateProfessional(professional,{paidMembership:eligibility.paidMembership,marketplaceEligible:eligibility.consultationEligible});
  const sourceRecords=(professional.sourceRecords||[]).map(publicSourceSummary);
  const sponsored=Boolean(professional.sponsorship?.status==='active' && paidAccess.sponsoredPlacementEligible);
  const row={ id:professional.publicProfileSlug || professional.id, recordId:professional.id, displayName:professional.displayName, professionalType:professional.professionalType, profileStatus:professional.profileStatus, claimStatus:professional.claimStatus, claimed:['claimed','verified','participating','integrated'].includes(professional.profileStatus)||professional.claimStatus==='claimed', verified:professional.verificationStatus==='verified', participating:['participating','integrated'].includes(professional.profileStatus), consultationEligible:paidAccess.caseOpportunityEligible, leadEligible:paidAccess.caseOpportunityEligible, featured:sponsored, organicRankingNeutral:true, firm:firm?{id:firm.publicProfileSlug||firm.id,name:firm.name}:null, website:professional.website||'', phone:professional.phone||'', photoUrl:professional.photoUrl||'', biography:professional.biography||'', languages:professional.languages||[], officeLocations:professional.officeLocations||[], locationData:locationData(professional.officeLocations||[],professional.jurisdictions||[]), jurisdictions:professional.jurisdictions||[], practiceAreas:professional.practiceAreas||[], serviceRoles:professional.serviceRoles||[], availabilityStatus:professional.availabilityStatus||'not configured', consultationModes:professional.consultationModes||[], serviceRegions:professional.serviceRegions||[], availabilityNote:professional.availabilityNote||'', portalEligibility:professional.portalEligibility||[], publicFacts:professional.publicFacts||{}, services:(professional.consultationServices||[]).filter(x=>x.status==='active').map(x=>({id:x.id,title:x.title,serviceType:x.serviceType,durationMinutes:x.durationMinutes,priceCents:x.priceCents,modes:x.modes,jurisdictions:x.jurisdictions,practiceAreas:x.practiceAreas,schedulingEnabled:x.schedulingEnabled,scope:x.scope,exclusions:x.exclusions})), sponsorship:sponsored?{active:true,clearlyLabeled:true,label:paidAccess.sponsoredLabel,placementType:professional.sponsorship.placementType||'Sponsored profile placement'}:{active:false}, paidGrowth:{sponsoredPlacementEligible:paidAccess.sponsoredPlacementEligible,caseOpportunityEligible:paidAccess.caseOpportunityEligible}, sourceRecords, sourceReviewedAt:sourceReviewDate(sourceRecords), publicSourceDisclaimer:professional.publicSourceDisclaimer, disclosure:'Basic profile claiming and editing are free. Paid visibility is labeled Sponsored and does not change verification, specialty eligibility, organic ordering, or Smarter Justice’s independent legal-help routing. Review current credentials and choose the professional yourself.' };
  row.searchStatus=rowStatus(row);
  row.qualifyingProfile=isQualifyingProfessionalProfile(row);
  return row;
}
function filterLocation(row,input={}){
  const postalCode=clean(input.postalCode,20).replace(/\D/g,'').slice(0,5);
  const city=clean(input.city || input.borough,100);
  const state=clean(input.state,80);
  const county=clean(input.county,100);
  const locations=row.locationData || [];
  const serviceRegions=row.serviceRegions || [];
  if(postalCode && !locations.some(x=>x.postalCode===postalCode))return false;
  if(city && !locations.some(x=>normalizedIncludes(x.city,city) || normalizedIncludes(x.address,city)))return false;
  if(state && !locations.some(x=>normalizedIncludes(x.state,state)) && !(row.jurisdictions||[]).some(x=>normalizedIncludes(x,state)))return false;
  if(county && !locations.some(x=>normalizedIncludes(x.county,county)||normalizedIncludes(x.address,county)) && !serviceRegions.some(x=>normalizedIncludes(x,county)) && !normalizedIncludes(row.publicFacts?.county,county))return false;
  return true;
}
function statusMatches(row,value){ const wanted=normalizeSearchText(value); return !wanted || row.searchStatus===wanted; }
function languageMatches(row,value){ return !value || (row.languages||[]).some(item=>normalizedIncludes(item,value)); }
function serviceMethodMatches(row,value){
  if(!value)return true;
  const requested=normalizeSearchText(String(value).replace(/_/g,' '));
  const aliases=requested==='phone'?['phone','telephone']:requested==='messaging'?['messaging','secure message']:[requested];
  const methods=row.consultationModes || row.serviceMethods || [];
  return methods.some(item=>aliases.some(alias=>normalizedIncludes(String(item).replace(/_/g,' '),alias)));
}
function relevanceScore(row,q,practice,city,postalCode){
  let score=0;
  const name=normalizeSearchText(row.displayName || row.name);
  const query=normalizeSearchText(q);
  if(query){ if(name===query)score+=100; else if(name.startsWith(query))score+=80; else if(name.includes(query))score+=60; }
  if(practice && practiceMatches(row.practiceAreas,practice))score+=30;
  if(postalCode && (row.locationData||[]).some(x=>x.postalCode===postalCode))score+=20;
  if(city && (row.locationData||[]).some(x=>normalizedIncludes(x.city,city)))score+=10;
  return score;
}
function sourceFreshnessDays(value){ const n=int(value,0,0,3650); return [30,90,365,730].includes(n)?n:0; }
function sourceFreshnessMatches(row,days){ if(!days)return true; const reviewed=Date.parse(row.sourceReviewedAt||''); if(Number.isNaN(reviewed))return false; return reviewed >= Date.now()-(days*86400000); }
function commonSearchFilters(input={}){
  return { q:clean(input.q,160), city:clean(input.city || input.borough,100), postalCode:clean(input.postalCode,20), state:clean(input.state,80), county:clean(input.county,100), practice:clean(input.practiceArea,180), language:clean(input.language,100), serviceMethod:clean(input.serviceMethod,100), profileStatus:clean(input.profileStatus,80), sourceFreshness:sourceFreshnessDays(input.sourceFreshness), inquiryAvailability:bool(input.inquiryAvailability,false), portal:clean(input.portal,120) };
}
function publicSearchMeta(state){ return { taxonomyVersion:PROFESSIONAL_SEARCH_TAXONOMY_VERSION, metrics:directoryMetrics(state), distanceSearchAvailable:false, distanceSearchMessage:'Exact ZIP, city, and state filters are available. Radius search is not shown until verified coordinates and distance calculations are available.' }; }
function searchPublicProfessionals(input={}) {
  const state=readState(); const filters=commonSearchFilters(input); const professionalType=clean(input.professionalType,100).toLowerCase(); const limit=int(input.limit,25,1,100); const offset=int(input.offset,0,0,1000000);
  let rows=state.professionals.map(x=>publicProfessional(x,state)).filter(Boolean);
  if(filters.q) rows=rows.filter(x=>normalizeSearchText([x.displayName,x.firm?.name,...x.officeLocations,...x.practiceAreas,...x.languages].join(' ')).includes(normalizeSearchText(filters.q)) || practiceMatches(x.practiceAreas,filters.q));
  rows=rows.filter(x=>filterLocation(x,filters));
  if(filters.practice) rows=rows.filter(x=>practiceMatches(x.practiceAreas,filters.practice));
  if(professionalType) rows=rows.filter(x=>normalizeSearchText(x.professionalType)===normalizeSearchText(professionalType));
  if(filters.language) rows=rows.filter(x=>languageMatches(x,filters.language));
  if(filters.serviceMethod) rows=rows.filter(x=>serviceMethodMatches(x,filters.serviceMethod));
  if(filters.profileStatus) rows=rows.filter(x=>statusMatches(x,filters.profileStatus));
  if(filters.sourceFreshness) rows=rows.filter(x=>sourceFreshnessMatches(x,filters.sourceFreshness));
  if(filters.inquiryAvailability) rows=rows.filter(x=>x.consultationEligible);
  if(filters.portal) rows=rows.filter(x=>x.portalEligibility.includes(filters.portal));
  rows.sort((a,b)=>relevanceScore(b,filters.q,filters.practice,filters.city,filters.postalCode)-relevanceScore(a,filters.q,filters.practice,filters.city,filters.postalCode)||a.displayName.localeCompare(b.displayName));
  return { total:rows.length, offset, limit, professionals:rows.slice(offset,offset+limit), filters, ...publicSearchMeta(state), disclosure:'Results use neutral relevance and alphabetical ordering. Payment, sponsorship, membership, claimed status, and inquiry availability do not secretly improve organic placement.' };
}
function getPublicProfessional(id){ const state=readState(); return publicProfessional(findProfessional(state,id),state); }
function searchPublicFirms(input={}) {
  const state=readState(); const filters=commonSearchFilters(input); const limit=int(input.limit,25,1,100); const offset=int(input.offset,0,0,1000000);
  let firms=state.firms.map(x=>publicFirm(x,state)).filter(Boolean);
  if(filters.q) firms=firms.filter(x=>normalizeSearchText([x.name,...x.locations,...x.practiceAreas,...x.languages,...x.professionals.map(p=>p.displayName)].join(' ')).includes(normalizeSearchText(filters.q)) || practiceMatches(x.practiceAreas,filters.q));
  firms=firms.filter(x=>filterLocation(x,filters));
  if(filters.practice) firms=firms.filter(x=>practiceMatches(x.practiceAreas,filters.practice));
  if(filters.language) firms=firms.filter(x=>languageMatches(x,filters.language));
  if(filters.serviceMethod) firms=firms.filter(x=>serviceMethodMatches(x,filters.serviceMethod));
  if(filters.profileStatus) firms=firms.filter(x=>statusMatches(x,filters.profileStatus));
  if(filters.sourceFreshness) firms=firms.filter(x=>sourceFreshnessMatches(x,filters.sourceFreshness));
  if(filters.inquiryAvailability) firms=firms.filter(x=>x.professionals.some(p=>p.consultationEligible));
  if(filters.portal) firms=firms.filter(x=>x.portalEligibility.includes(filters.portal)||x.professionals.some(p=>(p.portalEligibility||[]).includes(filters.portal)));
  firms.sort((a,b)=>relevanceScore(b,filters.q,filters.practice,filters.city,filters.postalCode)-relevanceScore(a,filters.q,filters.practice,filters.city,filters.postalCode)||a.name.localeCompare(b.name));
  return {total:firms.length,offset,limit,firms:firms.slice(offset,offset+limit),filters,...publicSearchMeta(state),disclosure:'Results use neutral relevance and alphabetical ordering. Payment, sponsorship, membership, claimed status, and inquiry availability do not secretly improve organic placement.'};
}
function getPublicFirm(id){ const state=readState(); return publicFirm(findFirm(state,id),state); }
async function applyMembershipPayment(target, payment={}) {
  return mutateMarketplace(state=>{
    const kind=target?.kind; const id=clean(target?.id,180); const planId=clean(target?.planId,100); const cadence=oneOf(target?.billingCadence,['monthly','annual'],'monthly'); const seatCount=int(target?.seatCount,1,1,10000); const periodEnd=isoOrBlank(payment.currentPeriodEnd)||new Date(Date.now()+(cadence==='annual'?366:32)*86400000).toISOString();
    if(kind==='professional'){
      const professional=findProfessional(state,id); if(!professional) return {error:'Professional membership target was not found.'};
      professional.membership=sanitizeMembership({...professional.membership,planId,status:'active',paymentState:'paid',billingCadence:cadence,seatCount:1,startedAt:professional.membership.startedAt||store.now(),currentPeriodEnd:periodEnd,lastPaymentConfirmedAt:store.now(),externalCustomerReference:payment.customerId||professional.membership.externalCustomerReference||'',externalSubscriptionReference:payment.subscriptionId||professional.membership.externalSubscriptionReference||'',lastInvoiceReference:payment.invoiceId||professional.membership.lastInvoiceReference||'',lastBillingEventAt:store.now(),billingIssue:'',foundingRate:Boolean(findPlan(state,planId)?.foundingPlan)},professional.membership);
      professional.updatedAt=store.now(); professional.updatedBy='stripe'; return {professional:ownerViewProfessional(professional,state),target:{kind,id}};
    }
    if(kind==='firm'){
      const firm=findFirm(state,id); if(!firm) return {error:'Firm membership target was not found.'}; const quote=calculateFirmMembershipQuote(planId,seatCount,state); if(quote.error) return quote; firm.seatCount=seatCount;
      firm.membership=sanitizeMembership({...firm.membership,planId,status:'active',paymentState:'paid',billingCadence:cadence,seatCount,quotedPerSeatCents:cadence==='annual'?quote.annualDiscountedPerSeatCents:quote.monthlyDiscountedPerSeatCents,discountPercent:quote.discountPercent,calculatedMonthlyCents:quote.monthlyTotalCents,calculatedAnnualCents:quote.annualTotalCents,startedAt:firm.membership.startedAt||store.now(),currentPeriodEnd:periodEnd,lastPaymentConfirmedAt:store.now(),externalCustomerReference:payment.customerId||firm.membership.externalCustomerReference||'',externalSubscriptionReference:payment.subscriptionId||firm.membership.externalSubscriptionReference||'',lastInvoiceReference:payment.invoiceId||firm.membership.lastInvoiceReference||'',lastBillingEventAt:store.now(),billingIssue:'',foundingRate:Boolean(findPlan(state,planId)?.foundingPlan)},firm.membership);
      firm.updatedAt=store.now(); firm.updatedBy='stripe'; return {firm:ownerViewFirm(firm,state),target:{kind,id}};
    }
    return {error:'Unsupported membership target.'};
  },result=>result&&!result.error?{eventType:'professional_membership_payment_applied',action:'professional_membership_payment_applied',target:result.target}:null);
}
function findMembershipTargetByExternal(state,input={}){
  const subscriptionId=clean(input.subscriptionId,240); const customerId=clean(input.customerId,240); const kind=clean(input.kind,40); const id=clean(input.id,180);
  if(kind==='professional'&&id){const professional=findProfessional(state,id);if(professional)return {kind,id,record:professional};}
  if(kind==='firm'&&id){const firm=findFirm(state,id);if(firm)return {kind,id,record:firm};}
  for(const professional of state.professionals){const membership=professional.membership||{};if((subscriptionId&&membership.externalSubscriptionReference===subscriptionId)||(customerId&&membership.externalCustomerReference===customerId))return {kind:'professional',id:professional.id,record:professional};}
  for(const firm of state.firms){const membership=firm.membership||{};if((subscriptionId&&membership.externalSubscriptionReference===subscriptionId)||(customerId&&membership.externalCustomerReference===customerId))return {kind:'firm',id:firm.id,record:firm};}
  return null;
}
async function applyMembershipLifecycle(input={}){
  return mutateMarketplace(state=>{
    const found=findMembershipTargetByExternal(state,input); if(!found)return {error:'Membership target could not be reconciled from the billing event.'};
    const membership=found.record.membership||membershipTemplate(); const eventType=clean(input.eventType,180); const stripeStatus=clean(input.stripeStatus,80); let status=membership.status||'pending'; let paymentState=membership.paymentState||'not configured'; let billingIssue='';
    if(eventType==='customer.subscription.deleted'||stripeStatus==='canceled'){status='cancelled';paymentState='cancelled';}
    else if(['past_due','unpaid','incomplete','incomplete_expired'].includes(stripeStatus)||eventType==='invoice.payment_failed'){status='past due';paymentState='payment failed';billingIssue=clean(input.summary,1000)||'A recurring membership payment requires attention.';}
    else if(stripeStatus==='paused'){status='paused';paymentState='paused';}
    else if(['active','trialing'].includes(stripeStatus)||eventType==='invoice.paid'){status=stripeStatus==='trialing'?'trial':'active';paymentState=eventType==='invoice.paid'?'paid':'current';billingIssue='';}
    found.record.membership=sanitizeMembership({...membership,status,paymentState,externalCustomerReference:clean(input.customerId,240)||membership.externalCustomerReference,externalSubscriptionReference:clean(input.subscriptionId,240)||membership.externalSubscriptionReference,lastInvoiceReference:clean(input.invoiceId,240)||membership.lastInvoiceReference,currentPeriodEnd:isoOrBlank(input.currentPeriodEnd)||membership.currentPeriodEnd,lastPaymentConfirmedAt:eventType==='invoice.paid'?store.now():membership.lastPaymentConfirmedAt,cancellationAtPeriodEnd:Boolean(input.cancellationAtPeriodEnd),lastBillingEventAt:store.now(),billingIssue},membership);
    found.record.updatedAt=store.now(); found.record.updatedBy='stripe-lifecycle';
    const publicRecord=found.kind==='professional'?ownerViewProfessional(found.record,state):ownerViewFirm(found.record,state);
    return {target:{kind:found.kind,id:found.id},membership:publicRecord.membership,eventType,stripeStatus};
  },result=>result&&!result.error?{eventType:'professional_membership_lifecycle_applied',action:'professional_membership_lifecycle_applied',target:result.target,billingEventType:result.eventType}:null);
}

function exportData() { return { exportVersion:'1.5.0', ...getOwnerData() }; }
function publicFeatureStatus() {
  const state = readState();
  return { standardVersion:PROFESSIONAL_MARKETPLACE_STANDARD_VERSION, revenueStandardVersion:MARKETPLACE_REVENUE_STANDARD_VERSION, sourcePlanVersion:PROFESSIONAL_SOURCE_PLAN_VERSION, professionalSearchTaxonomyVersion:PROFESSIONAL_SEARCH_TAXONOMY_VERSION, sixRegionProfileBatch:SIX_REGION_PROFILE_BATCH_V1731, threeMarketProfileBatch:SIX_REGION_PROFILE_BATCH_V1729, professionalRecords:state.professionals.length, firmRecords:state.firms.length, directoryMetrics:directoryMetrics(state), profileRequestRecords:state.profileRequests.length, neutralMultiFieldDirectorySearch:true, exactPostalCodeDirectorySearch:true, radiusDirectorySearch:false, privateOwnerFoundation:true, publicSourceSeedingFoundation:true, claimCorrectionWorkflowFoundation:true, membershipEligibilityEngine:true, fixedSubscriptionModel:true, revenueArchitectureTracked:true, firmVolumeDiscountFoundation:true, nycFoundingMemberPilotFoundation:false, freeBasicProfileClaimAndEdit:true, paidSponsoredVisibilityFoundation:true, paidCaseOpportunityAccessFoundation:true, paidGrowthGatesOpen:false, professionalOutreachPipelineFoundation:true, mobileQrEnrollmentInterestFoundation:true, publicDirectoryActivated:false, claimMigrationLookupActivated:true, focusedPortalPublicProfiles:true, publicBookingActivated:false, consultationPaymentsActivated:false, reviewsActivated:false, professionalAccountsActivated:true, controlledPilotCapacity:true, credentialVerificationProcedure:true, complaintAndSuspensionProcedure:true, appointmentDataFoundation:true, verifiedReviewDataFoundation:true, complaintModerationDataFoundation:true, consentAuditDataFoundation:true, structuredOpportunityDataFoundation:true, outreachCampaignRecords:state.outreachCampaigns.length, outreachProspectRecords:state.outreachProspects.length };
}

module.exports = {
  PROFESSIONAL_MARKETPLACE_STANDARD_VERSION, MARKETPLACE_REVENUE_STANDARD_VERSION, PROFESSIONAL_SOURCE_PLAN_VERSION, MARKETPLACE_GOVERNANCE,
  getOwnerData, professionalProfileReadiness, firmProfileReadiness, createFirm, updateFirm, createProfessional, updateProfessional, updateMembershipPlan, updateRevenueProgram, createProfileRequest, publicProfileRequestReceipt, updateProfileRequest, updatePilotControls, pilotCapacity, membershipEnrollmentAvailability, recordCredentialVerification, createComplaint, resolveComplaint, setProfessionalSuspension,
  importSeededProfessionals, evaluateProfessionalEligibility, calculateFirmMembershipQuote, createOutreachCampaign, updateOutreachCampaign, createOutreachProspect, updateOutreachProspect,
  getPublicCampaignOffer, createPublicMembershipInterest, searchPublicProfessionals, getPublicProfessional, searchPublicFirms, getPublicFirm, directoryMetrics, isQualifyingProfessionalProfile, isQualifyingFirmProfile, applyMembershipPayment, applyMembershipLifecycle, exportData, publicFeatureStatus
};
