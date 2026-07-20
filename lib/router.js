
const { getPracticeBySlug } = require('../data/practiceAreas');
const { getCatalogForPractice } = require('../data/officialSourceCatalog');
const { recommendFormPaths, readinessByLevel, evaluateFormPathReadiness } = require('../data/formPaths');
const { buildMatterPathAnalysis } = require('../data/matterPaths');
const { recommendPortalForPractice } = require('../data/portals');

const urgentTerms = [
  'default judgment','statute','expires','last day','final notice','deadline','tomorrow','today','court date','hearing','eviction','foreclosure','deportation','removal','rfe','noid','denial','notice of intent','lawsuit','summons','subpoena','levy','lien','garnishment','arrest','warrant','domestic violence','restraining','order of protection','insurance denial','offer deadline','statute of limitations','settlement deadline','answer date','appeal deadline','response date','due date','served','service','complaint','cp504','lt11','notice of deficiency','office action','denied benefits','termination notice'
];
const noticeTerms = ['notice','letter','denial','rfe','noid','court','agency','irs','tax','benefits','eviction','demand','lawsuit','summons','insurance','deadline','audit','lien','levy','garnishment','cp504','lt11','appeal','office action','medical bill','police report','repair','deposit','foreclosure','complaint','subpoena'];
const legalReviewSlugs = new Set(['immigration','bankruptcy-debt','divorce-family-law','domestic-violence-protection-orders','expungement-record-cleanup','criminal-defense-traffic-license','personal-injury','vehicle-accidents','medical-malpractice','civil-rights-police-misconduct','appeals','probate-estate-administration','estate-planning','guardianship-conservatorship','adoption-child-welfare','foreclosure-mortgage','business-law','real-estate','litigation-lawsuits','wrongful-death-survivor-claims','toxic-exposure-asbestos-mesothelioma','white-collar-federal-crimes']);

function includesAny(text, terms){
  const t = String(text || '').toLowerCase();
  return terms.filter(term => t.includes(term));
}
function inferPractice(question, selected){
  if (selected) return getPracticeBySlug(selected);
  const q = String(question || '').toLowerCase();
  const rules = [
    ['taxes',['irs','tax','refund','audit','offer in compromise','installment','lien','levy','1099','1040','nys tax','nyc tax','cp504','lt11','penalty abatement','unfiled return','payroll tax']],
    ['immigration',['uscis','green card','visa','deportation','rfe','noid','asylum','citizenship','work permit','i-90','i-130']],
    ['bankruptcy-debt',['bankruptcy','chapter 7','chapter 13','means test','debt schedule','debt collector','credit card lawsuit','garnishment']],
    ['small-claims-consumer-debt',['small claims','small claim','credit card lawsuit','debt lawsuit','collection lawsuit','summons complaint','judgment creditor']],
    ['landlord-tenant-housing',['eviction','rent','landlord','tenant','housing court','security deposit','repair']],
    ['vehicle-accidents',['car accident','truck accident','rideshare','bike accident','pedestrian','police report']],
    ['medical-malpractice',['malpractice','doctor error','hospital error','misdiagnosis','surgical error','medical negligence','birth injury']],
    ['foreclosure-mortgage',['foreclosure','mortgage default','loan modification','lis pendens']],
    ['healthcare-billing-insurance-appeals',['medical bill','health insurance denial','medicare appeal','medicaid managed care']],
    ['education-special-education',['iep','special education','school discipline','504 plan']],
    ['probate-estate-administration',['probate','executor','administrator','surrogate','small estate']],
    ['domestic-violence-protection-orders',['domestic violence','protection order','restraining order','order of protection']],
    ['business-formation-compliance',['llc','corporation','ein','annual report','registered agent','boi','beneficial ownership']],
    ['business-law',['contract','vendor','customer dispute','partnership dispute','commercial lease']],
    ['real-estate',['deed','title','closing','hoa','condo','boundary','easement']],
    ['trademarks',['trademark','brand name','logo infringement','office action','specimen','uspto refusal']],
    ['patents',['patent','invention','provisional']],
    ['copyrights',['copyright','dmca','takedown']],
    ['public-benefits',['snap','food stamps','medicaid','cash assistance','section 8','benefit denial','overpayment','fair hearing']],
    ['employment-wage-claims',['unpaid wages','final paycheck','paycheck','overtime','unemployment','discrimination','retaliation','fired','eeoc']],
    ['workers-compensation',['workers comp','work injury','comp board']],
    ['disability-benefits',['ssdi','ssi','disability benefits','social security denial','ssa-561','ssa-3441','disability appeal']],
    ['veterans-benefits',['va disability','veterans','va claim']],
  ];
  for (const [slug, terms] of rules) if (terms.some(term => q.includes(term))) return getPracticeBySlug(slug);
  return getPracticeBySlug('other');
}
function determineReview(practice, question, subcategory){
  const matches = includesAny(question, urgentTerms);
  const q = String(question || '').toLowerCase();
  let professionalReview = 'not_required_yet';
  let humanReview = 'recommended';
  if (practice.slug === 'taxes') {
    professionalReview = /offer in compromise|lien|levy|garnish|audit|tax court|criminal|payroll|trust fund|appeal|collection|installment|penalty|innocent spouse/.test(q) || /offer|resolution|audit|lien|levy|collection/i.test(subcategory || '')
      ? 'tax attorney or CPA/enrolled-agent/accountant review recommended'
      : 'CPA/enrolled-agent/accountant review may be helpful';
  } else if (practice.slug === 'business-formation-compliance' || practice.slug === 'nonprofit-formation-compliance') {
    professionalReview = 'attorney, CPA, accountant, or filing professional review may be recommended';
  } else if (legalReviewSlugs.has(practice.slug)) {
    professionalReview = 'attorney review may be recommended or required';
  } else if (/deadline|lawsuit|court|denial|appeal|injury|threat|demand|audit/i.test(q)) {
    professionalReview = 'attorney or qualified professional review may be recommended';
  }
  if (matches.length > 0) humanReview = 'priority human review recommended';
  return { humanReview, professionalReview, urgentMatches: matches };
}
function analyzeNotice(question, attachments=[], documentType=''){
  const matches = includesAny(question, noticeTerms);
  const attachmentNames = attachments.map(a => a.originalName || a.name || '').join(' ').toLowerCase();
  const attachmentMatches = includesAny(attachmentNames, ['pdf','notice','letter','court','irs','tax','denial','rfe','noid','summons','jpg','png','screenshot']);
  const categories = [];
  const text = String(question || '').toLowerCase() + ' ' + attachmentNames + ' ' + String(documentType || '').toLowerCase();
  if (/rfe|noid|uscis|deport|removal|immigration/.test(text)) categories.push('immigration notice');
  if (/irs|tax|audit|lien|levy|offer in compromise|installment|nys|nyc finance/.test(text)) categories.push('tax notice');
  if (/eviction|housing court|rent/.test(text)) categories.push('housing notice');
  if (/summons|lawsuit|complaint|court date/.test(text)) categories.push('court paper');
  if (/insurance|claim|adjuster|settlement|police report|accident/.test(text)) categories.push('insurance/accident letter');
  if (/medical bill|health insurance|medicare|hospital bill/.test(text)) categories.push('healthcare billing or insurance document');
  if (/snap|medicaid|benefit|ssi|ssdi|va|denied benefits/.test(text)) categories.push('benefits notice');
  if (/office action|uspto|trademark|patent/.test(text)) categories.push('intellectual property office notice');
  if (/demand|cease and desist|collection/.test(text)) categories.push('demand or collection letter');
  if (!categories.length && (matches.length || attachmentMatches.length)) categories.push('document or notice needs review');
  return { hasNoticeSignals: Boolean(categories.length), categories, matchedWords: [...new Set([...matches, ...attachmentMatches])] };
}
function buildStartingPoint({question, practiceArea, subcategory, state, county, city, attachments=[], documentType='', smartAnswers={}}){
  const practice = inferPractice(question, practiceArea);
  const catalog = getCatalogForPractice(practice.slug);
  const review = determineReview(practice, question, subcategory);
  const notice = analyzeNotice(question, attachments, documentType);
  const stateNeeded = practice.requiresJurisdiction && !state;
  const location = [city, county, state].filter(Boolean).join(', ');
  const title = `${practice.name}${subcategory ? ' — ' + subcategory : ''}`;
  const mappedRows = catalog.map(row => ({ sourceName: row.sourceName, jurisdiction: row.jurisdiction, catalogStatus: row.catalogStatus, officialUrl: row.officialUrl, readinessLevel: row.readinessLevel, readinessLabel: row.readinessLabel, examples: row.forms.slice(0,3) }));
  const verifiedFormPaths = recommendFormPaths({ question, practiceSlug: practice.slug, subcategory, state, county, city, documentType, smartAnswers });
  const topPath = verifiedFormPaths[0] || null;
  const pathFacts = { ...(smartAnswers || {}), state: state || '', county: county || '', city: city || '', deadlineDate: smartAnswers.deadlineDate || '', documentType: documentType || '' };
  const formPathEvaluation = topPath ? evaluateFormPathReadiness(topPath, pathFacts) : null;
  const pathReadiness = topPath ? readinessByLevel(topPath.readinessLevel) : null;
  const bestReadiness = pathReadiness ? pathReadiness.level : (mappedRows.length ? Math.min(...mappedRows.map(row => Number(row.readinessLevel || 0))) : 0);
  const recommendedPortal = recommendPortalForPractice(practice.slug);
  const matterPath = buildMatterPathAnalysis({ question, practiceArea, subcategory, state, county, city, attachments, documentType, smartAnswers, deadlineDate: smartAnswers.deadlineDate || '', dateReceived: smartAnswers.dateReceived || '', amountInvolved: smartAnswers.amountInvolved || '', courtOrAgency: smartAnswers.courtOrAgency || smartAnswers.agencyOrCourt || '', desiredHelp: smartAnswers.desiredHelp || '', issueStage: smartAnswers.issueStage || '', smartText: JSON.stringify(smartAnswers || {}) }, practice);
  const matterScore = Number(matterPath.formReadinessScore || 0);
  const formReadiness = {
    level: bestReadiness,
    label: pathReadiness?.label || mappedRows[0]?.readinessLabel || 'Source catalog only',
    userMeaning: pathReadiness?.userMeaning || (bestReadiness <= 1 ? 'This path should start as an organized worksheet/starter file. Completed forms should not be promised until source and field mapping are verified.' : 'This path has a future form-drafting foundation, but Human Review Specialist review is still required before delivery.')
  };
  const nextSteps = [];
  nextSteps.push('Save the private continuation link so you can return without starting over.');
  nextSteps.push('Recommended focused portal: ' + recommendedPortal.name + '.');
  if (stateNeeded) nextSteps.push('Choose the state first before relying on state-specific forms, court steps, or deadlines.');
  if (practice.requiresJurisdiction) nextSteps.push('Add county/city and the court or agency name if you have one.');
  if (notice.hasNoticeSignals) nextSteps.push('Upload the full notice/letter, including every page, envelope, deadline page, and instructions page.');
  if (Object.keys(smartAnswers || {}).length) nextSteps.push('Review the extra starting details for accuracy because they may affect the form path or review lane.');
  nextSteps.push('Answer a few starting questions so a Human Review Specialist can organize the file.');
  if (matterPath.userNextPathTitle) nextSteps.push('Next likely path: ' + matterPath.userNextPathTitle + '.');
  if (verifiedFormPaths.length) nextSteps.push('Review the suggested form path and missing information list before expecting any completed forms.');
  nextSteps.push('Use the form readiness level as a safety check before expecting completed forms.');
  if (review.professionalReview !== 'not_required_yet') {
    const reviewStep = review.professionalReview.charAt(0).toUpperCase() + review.professionalReview.slice(1);
    nextSteps.push(reviewStep + '.');
  }
  const concerns = [];
  if (review.urgentMatches.length) concerns.push('Possible deadline or urgent issue mentioned: ' + review.urgentMatches.join(', ') + '.');
  if (notice.categories.length) concerns.push('Document type signals found: ' + notice.categories.join(', ') + '.');
  if (stateNeeded) concerns.push('This area depends on state/local rules; Smarter Justice needs the state before giving state-specific starting steps.');
  if (practice.slug === 'taxes') concerns.push('Tax preparation and tax resolution are handled close together but separately; resolution matters may need CPA, enrolled agent, accountant, or tax attorney review.');
  if (practice.slug === 'medical-malpractice') concerns.push('Medical malpractice is deadline-sensitive, expert-review-heavy, and state-specific. Smarter Justice should organize records and recommend attorney review.');
  if (documentType) concerns.push('Uploaded or selected document type: ' + documentType + '.');
  if (smartAnswers.deadlineDate) concerns.push('Deadline/date provided by user: ' + smartAnswers.deadlineDate + '.');
  for (const signal of matterPath.stageRiskSignals || []) concerns.push(signal);
  if (!concerns.length) concerns.push('No immediate deadline words were detected, but uploaded documents may still contain important dates.');
  return {
    title,
    practiceSlug: practice.slug,
    practiceName: practice.name,
    subcategory: subcategory || '',
    jurisdiction: { state: state || '', county: county || '', city: city || '', location },
    plainLanguageStartingPoint: `This looks like a ${practice.name.toLowerCase()} starting file. Smarter Justice can help organize what happened, save documents, identify likely next steps, and prepare an organized file for human review.`,
    concerns,
    nextSteps,
    humanReview: review.humanReview,
    professionalReview: review.professionalReview,
    formReadiness: { ...formReadiness, matterPathScore: matterScore },
    matterPath,
    correctNextPath: matterPath.userNextPathTitle || '',
    verifiedFormPaths,
    missingInformation: [...new Set([...(topPath?.missingFields || []), ...((matterPath.dynamicMissingInformation || []).map(x => x.field || x.label || x))])],
    dynamicMissingInformation: matterPath.dynamicMissingInformation || [],
    recommendedPortal,
    portalRouting: { umbrella:'Smarter Justice', recommendedPortalSlug: recommendedPortal.slug, recommendedPortalName: recommendedPortal.name, status: recommendedPortal.status, userMessage: recommendedPortal.userRouteMessage },
    formPathEvaluation: formPathEvaluation ? { ...formPathEvaluation, matterPathScore: matterScore } : { completionPercent: matterScore, missingFieldLabels: (matterPath.dynamicMissingInformation || []).map(x => x.label || x), userMessage: matterPath.userNextPathSummary || '' },
    smartAnswers,
    catalogSummary: mappedRows,
    disclaimer: 'Smarter Justice is a private support service, not a law firm and not the government. Official government forms are often free from the government. No approval, timing, tax, benefits, settlement, refund, legal outcome, or case result is guaranteed.'
  };
}
module.exports = { buildStartingPoint, inferPractice, analyzeNotice };
