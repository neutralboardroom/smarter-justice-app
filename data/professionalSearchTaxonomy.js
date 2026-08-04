const PROFESSIONAL_SEARCH_TAXONOMY_VERSION = '1.1.0';

const PRACTICE_SEARCH_GROUPS = [
  { id:'family-law', labels:['family law','divorce','child custody','custody','child support','adoption','separation'], matches:['family law','divorce','child custody','child support','adoption'] },
  { id:'estate-planning', labels:['estate planning','will','wills','trust','trusts','probate','estate administration'], matches:['estate planning','wills','trusts and estates','probate','estate administration'] },
  { id:'bankruptcy-debt', labels:['bankruptcy','debt','debt relief','creditor','consumer debt'], matches:['bankruptcy','debt relief'] },
  { id:'criminal-defense', labels:['criminal defense','criminal law','arrest','charges','crime','appeal'], matches:['criminal defense','criminal law','appeals'] },
  { id:'personal-injury', labels:['personal injury','injury','accident'], matches:['personal injury'] },
  { id:'motor-vehicle-accidents', labels:['car accident','auto accident','motor vehicle accident','vehicle crash'], matches:['motor vehicle accidents','personal injury'] },
  { id:'medical-malpractice', labels:['medical malpractice','medical negligence'], matches:['medical malpractice','personal injury'] },
  { id:'employment-civil-rights', labels:['employment law','work discrimination','job discrimination','wrongful termination','whistleblower','civil rights','police misconduct'], matches:['employment law','civil rights','police misconduct','whistleblower matters'] },
  { id:'workers-compensation', labels:['workers compensation','workers’ compensation','work injury','injured worker'], matches:['workers compensation','workers’ compensation'] },
  { id:'disability-benefits', labels:['social security disability','ssdi','ssi','disability benefits'], matches:['social security disability'] },
  { id:'real-estate', labels:['real estate','property','closing','deed'], matches:['real estate'] }
];

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function practiceSearchTerms(value) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  const terms = new Set([normalized]);
  for (const group of PRACTICE_SEARCH_GROUPS) {
    const labels=group.labels.map(normalizeSearchText);
    if (labels.some(label => normalized.includes(label) || label.includes(normalized))) {
      for (const match of group.matches) terms.add(normalizeSearchText(match));
    }
  }
  return [...terms];
}

function practiceMatches(practiceAreas, query) {
  const terms=practiceSearchTerms(query);
  if (!terms.length) return true;
  return (practiceAreas || []).some(area => {
    const normalized=normalizeSearchText(area);
    return terms.some(term => normalized.includes(term) || term.includes(normalized));
  });
}

function extractUsLocation(value, fallbackState='') {
  const address=String(value || '').trim();
  const postalMatch=address.match(/\b(\d{5})(?:-\d{4})?\b/);
  const stateZipMatch=address.match(/,\s*([A-Za-z .'-]+),\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/);
  const stateOnlyMatch=address.match(/,\s*([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?\s*$/);
  return {
    address,
    city:stateZipMatch ? stateZipMatch[1].trim() : '',
    state:stateZipMatch ? stateZipMatch[2] : (stateOnlyMatch ? stateOnlyMatch[1] : String(fallbackState || '').trim()),
    postalCode:postalMatch ? postalMatch[1] : ''
  };
}

function latestSourceReviewDate(records) {
  let latest='';
  for (const record of records || []) {
    for (const value of [record.lastVerifiedAt,record.retrievedAt]) {
      if (!value || Number.isNaN(Date.parse(value))) continue;
      if (!latest || Date.parse(value) > Date.parse(latest)) latest=new Date(value).toISOString();
    }
  }
  return latest;
}

function normalizedIncludes(value, query) {
  const target=normalizeSearchText(value);
  const needle=normalizeSearchText(query);
  return !needle || target.includes(needle);
}

module.exports = {
  PROFESSIONAL_SEARCH_TAXONOMY_VERSION,
  PRACTICE_SEARCH_GROUPS,
  normalizeSearchText,
  practiceSearchTerms,
  practiceMatches,
  extractUsLocation,
  latestSourceReviewDate,
  normalizedIncludes
};
