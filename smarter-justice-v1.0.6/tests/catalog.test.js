
const assert = require('assert');
const { PRACTICE_AREAS } = require('../data/practiceAreas');
const { OFFICIAL_SOURCE_CATALOG, FORM_READINESS_LEVELS, getCatalogForPractice } = require('../data/officialSourceCatalog');
const { FORM_PATHS, recommendFormPaths } = require('../data/formPaths');
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
assert(FORM_PATHS.length >= 8, 'verified form path registry missing starter coverage');
assert(FORM_PATHS.some(p => p.id === 'tax-resolution-oic-starter'), 'OIC verified form path missing');
assert(FORM_PATHS.some(p => p.practiceSlug === 'medical-malpractice'), 'medical malpractice form path missing');
assert(FORM_PATHS.every(p => Array.isArray(p.requiredFields) && p.requiredFields.length >= 5), 'each starter form path should define required fields');
const recs = recommendFormPaths({ practiceSlug:'taxes', question:'I need an offer in compromise for IRS tax debt', subcategory:'Offer in compromise', smartAnswers:{ amountInvolved:'12000' } });
assert(recs.length && recs[0].id === 'tax-resolution-oic-starter', 'OIC recommendation should be first');
for (const row of OFFICIAL_SOURCE_CATALOG) {
  const decorated = getCatalogForPractice(row.practiceSlug).find(x => x.sourceName === row.sourceName);
  assert(decorated && Number.isInteger(decorated.readinessLevel), `${row.sourceName} missing readiness level`);
}

console.log(`catalog.test.js passed: ${PRACTICE_AREAS.length} practice areas, ${OFFICIAL_SOURCE_CATALOG.length} catalog rows`);
