
const assert = require('assert');
const { PRACTICE_AREAS } = require('../data/practiceAreas');
const { OFFICIAL_SOURCE_CATALOG, FORM_READINESS_LEVELS, getCatalogForPractice } = require('../data/officialSourceCatalog');
const { FORM_PATHS, recommendFormPaths } = require('../data/formPaths');
const { REVIEW_READY_DRAFT_PATHS, buildReviewReadyDraftEvaluation } = require('../data/reviewReadyDrafts');
const { MATTER_PATHS, buildMatterPathAnalysis } = require('../data/matterPaths');
const { SCHEMAS } = require('../data/intakeSchemas');
const { PORTALS, recommendPortalForPractice, getPortalBySlug, safePortalUrl } = require('../data/portals');
assert(PRACTICE_AREAS.length >= 40, 'expected broad practice-area coverage');
for (const p of PRACTICE_AREAS) {
  assert(p.slug && p.name, 'practice missing slug/name');
  assert(Array.isArray(p.subcategories) && p.subcategories.length >= 5, `${p.name} needs subcategories`);
  assert(Array.isArray(p.minimumFields) && p.minimumFields.includes('stateOrJurisdiction'), `${p.name} missing future field schema`);
  assert(getCatalogForPractice(p.slug).length >= 1, `${p.name} missing official-source catalog row`);
}
const taxes = PRACTICE_AREAS.find(p => p.slug === 'taxes');
assert(taxes.subcategories.includes('Tax preparation'), 'tax prep missing');
assert(taxes.subcategories.includes('Offer in compromise'), 'offer in compromise missing');
assert(taxes.subcategories.some(s => /New York City/.test(s)), 'NYC tax support missing');
assert(OFFICIAL_SOURCE_CATALOG.some(c => c.practiceSlug === 'taxes' && /Offer in Compromise/.test(c.sourceName)), 'OIC source missing');
assert(PRACTICE_AREAS.some(p => p.slug === 'medical-malpractice'), 'medical malpractice missing');
assert(PRACTICE_AREAS.some(p => p.slug === 'business-law'), 'business law missing');
assert(PRACTICE_AREAS.some(p => p.slug === 'real-estate'), 'real estate missing');
assert(PRACTICE_AREAS.some(p => p.slug === 'business-formation-compliance'), 'business formation/compliance missing');

assert(FORM_READINESS_LEVELS.length >= 6, 'form readiness levels missing');
assert(Object.keys(MATTER_PATHS).length >= 15, 'Matter Path Engine should cover high-value areas');
for (const slug of ['divorce-family-law','taxes','bankruptcy-debt','small-claims-consumer-debt','landlord-tenant-housing','business-formation-compliance','nonprofit-formation-compliance','estate-planning','probate-estate-administration','disability-benefits','public-benefits','employment-wage-claims','vehicle-accidents','personal-injury','medical-malpractice','trademarks','patents','copyrights']) {
  assert(MATTER_PATHS[slug], `missing matter path ${slug}`);
  assert(MATTER_PATHS[slug].stages.length >= 2, `${slug} needs stage detection`);
  assert(SCHEMAS[slug], `${slug} needs deeper question schema`);
}
assert(FORM_PATHS.length >= 8, 'verified form path registry missing starter coverage');
assert(REVIEW_READY_DRAFT_PATHS.length >= 5, 'first review-ready draft paths missing');
assert(REVIEW_READY_DRAFT_PATHS.some(p => p.id === 'irs-9465-installment-agreement-review-draft'), 'IRS 9465 review-ready draft missing');
assert(REVIEW_READY_DRAFT_PATHS.some(p => p.id === 'irs-ss4-ein-review-draft'), 'IRS SS-4 review-ready draft missing');
assert(REVIEW_READY_DRAFT_PATHS.some(p => p.id === 'ssa-561-reconsideration-review-draft'), 'SSA-561 review-ready draft missing');
assert(FORM_PATHS.some(p => p.id === 'tax-resolution-oic-starter'), 'OIC verified form path missing');
assert(FORM_PATHS.some(p => p.practiceSlug === 'medical-malpractice'), 'medical malpractice form path missing');
assert(FORM_PATHS.every(p => Array.isArray(p.requiredFields) && p.requiredFields.length >= 5), 'each starter form path should define required fields');
const recs = recommendFormPaths({ practiceSlug:'taxes', question:'I need an offer in compromise for IRS tax debt', subcategory:'Offer in compromise', smartAnswers:{ amountInvolved:'12000' } });
assert(recs.length && recs[0].id === 'tax-resolution-oic-starter', 'OIC recommendation should be first');
const matter = buildMatterPathAnalysis({ question:'I was served with divorce papers and have a hearing deadline', state:'New York', county:'Queens', deadlineDate:'2026-07-01', smartAnswers:{} }, PRACTICE_AREAS.find(p=>p.slug==='divorce-family-law'));
assert.equal(matter.stageId, 'served-or-responding');
assert(matter.dynamicMissingInformation.some(x => x.field === 'dateReceived'), 'matter path should produce dynamic missing-info checklist');
assert(matter.formReadinessScore >= 0 && matter.formReadinessScore <= 100, 'matter path should score readiness');
const draftEval = buildReviewReadyDraftEvaluation({ practiceSlug:'taxes', fullName:'Test User', question:'I need an IRS installment agreement payment plan', jurisdiction:{state:'New York'}, smartAnswers:{ taxYears:'2024', amountInvolved:'9000', proposedMonthlyPayment:'250', noticeNumber:'CP14' }, analysis:{ verifiedFormPaths:[{id:'tax-installment-agreement-9465-starter'}] }, attachments:[{name:'notice.pdf'}] });
assert(draftEval.matched && draftEval.pathId === 'irs-9465-installment-agreement-review-draft', 'IRS 9465 review-ready draft should be selected');
assert(draftEval.mappedFields.some(f => f.key === 'proposedMonthlyPayment' && f.present), 'review-ready draft should map saved answers');
for (const row of OFFICIAL_SOURCE_CATALOG) {
  const decorated = getCatalogForPractice(row.practiceSlug).find(x => x.sourceName === row.sourceName);
  assert(decorated && Number.isInteger(decorated.readinessLevel), `${row.sourceName} missing readiness level`);
}

console.log(`catalog.test.js passed: ${PRACTICE_AREAS.length} practice areas, ${OFFICIAL_SOURCE_CATALOG.length} catalog rows`);

assert(PORTALS.length >= 10, 'expected focused portal family coverage');
assert(recommendPortalForPractice('immigration').slug === 'immigration-oasis', 'immigration should route to separate Immigration Oasis portal');
assert(recommendPortalForPractice('taxes').slug === 'justice-tax-solutions', 'taxes should route to Justice Tax Solutions');
assert(recommendPortalForPractice('estate-planning').slug === 'estate-planning-probate', 'estate planning should route to estate portal');

assert(PORTALS.every(p => ['Live — Separate Platform','Pilot — Start Here Now','In Development','Coming Soon','Available Now'].includes(p.status)), 'portal status labels must be honest customer-facing values');
assert.equal(getPortalBySlug('contract-creator').publicUrl, '', 'planned ContractCreator portal must not look live without a configured URL');
assert.equal(safePortalUrl('javascript:alert(1)'), '', 'unsafe portal protocols must be rejected');
assert.equal(safePortalUrl('data:text/html,test'), '', 'data URLs must be rejected');
assert.equal(safePortalUrl('//evil.example/start'), '', 'protocol-relative portal URLs must be rejected');
assert.equal(safePortalUrl('/portal-router.html'), '/portal-router.html', 'root-relative portal URLs should be allowed');
assert(/^https:\/\//.test(safePortalUrl('https://example.com/start')), 'HTTPS portal URLs should be allowed');
const requestedTaxPortal = recommendPortalForPractice('taxes', 'justice-tax-solutions');
assert.equal(requestedTaxPortal.slug, 'justice-tax-solutions', 'compatible requested portal should be preserved');
console.log('portal catalog checks passed');
