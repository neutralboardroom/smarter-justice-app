const FORM_PATH_READINESS = [
  { level: 0, label: 'Source catalog only', userMeaning: 'Official sources are tracked, but this path should not be guided or completed until source and field mapping are verified.' },
  { level: 1, label: 'Verified worksheet path', userMeaning: 'Smarter Justice can collect organized facts, documents, and review notes for a Human Review Specialist or professional reviewer.' },
  { level: 2, label: 'Field-mapped draft foundation', userMeaning: 'Required facts are organized in a way that can later be mapped to official form fields after verification and review.' },
  { level: 3, label: 'Review-ready completed draft candidate', userMeaning: 'A future version may generate completed drafts after source verification, missing-answer checks, and Human Review Specialist approval.' },
  { level: 4, label: 'Sign-ready after review candidate', userMeaning: 'Only future verified paths can become sign-ready after human/professional review and user verification.' }
];

const FORM_PATHS = [
  {
    id: 'tax-resolution-oic-starter', practiceSlug: 'taxes', title: 'IRS offer in compromise starter file', readinessLevel: 1,
    officialSourceName: 'IRS Offer in Compromise', jurisdiction: 'Federal',
    officialForms: ['Form 656-B', 'Form 656', 'Form 433-A(OIC)', 'Form 433-B(OIC)'],
    matchedTerms: ['offer in compromise','oic','settle tax debt','tax debt','433-a','433-b','656'],
    requiredFields: ['taxYears','amountInvolved','noticeNumber','deadlineDate','incomeSource','householdSize','assets','bankAccounts','monthlyIncome','monthlyExpenses'],
    reviewerChecklist: ['Confirm latest IRS booklet and financial statement requirements.', 'Check whether the user is an individual, self-employed, or business taxpayer.', 'Confirm collection notices, deadlines, liens/levies, and prior submissions.', 'Route to CPA/enrolled agent/accountant or tax attorney review when debt, audit, collection, or dispute risk is significant.'],
    deliveryType: 'worksheet and tax-resolution review file first; no automatic OIC submission in this version'
  },
  {
    id: 'tax-installment-agreement-9465-starter', practiceSlug: 'taxes', title: 'IRS installment agreement starter file', readinessLevel: 2,
    officialSourceName: 'IRS Forms, Instructions & Publications', jurisdiction: 'Federal',
    officialForms: ['Form 9465'],
    matchedTerms: ['installment agreement','payment plan','9465','monthly payment','pay over time'],
    requiredFields: ['taxYears','amountInvolved','noticeNumber','proposedMonthlyPayment','bankAccountPreference','deadlineDate'],
    reviewerChecklist: ['Verify the current IRS payment-plan options and eligibility before preparing any form.', 'Confirm whether online IRS payment agreement may be more appropriate.', 'Escalate for tax professional review when liens, levies, business/payroll tax, audit, or court issues appear.'],
    deliveryType: 'field-organized worksheet; future official draft candidate after verification'
  },
  {
    id: 'tax-preparation-1040-starter', practiceSlug: 'taxes', title: 'Individual tax preparation starter file', readinessLevel: 1,
    officialSourceName: 'IRS Forms, Instructions & Publications', jurisdiction: 'Federal/state/local as selected',
    officialForms: ['Form 1040 family', 'state/local tax forms where applicable'],
    matchedTerms: ['tax preparation','file taxes','1040','w-2','1099','deduction','refund'],
    requiredFields: ['taxYear','filingStatus','dependents','w2Count','form1099Count','state','city','priorYearFiled'],
    reviewerChecklist: ['Separate tax preparation from tax resolution.', 'Confirm federal, state, and local filing needs including New York State and New York City where relevant.', 'Route to CPA/enrolled agent/accountant review before tax filing assistance.'],
    deliveryType: 'tax-preparation organizer; no return filing in this version'
  },
  {
    id: 'bankruptcy-chapter-7-13-starter', practiceSlug: 'bankruptcy-debt', title: 'Bankruptcy debt schedule starter file', readinessLevel: 1,
    officialSourceName: 'United States Courts Bankruptcy Forms', jurisdiction: 'Federal bankruptcy court plus local district rules',
    officialForms: ['Voluntary Petition B 101', 'Schedules A/B-J', 'Statement of Financial Affairs', 'Means Test forms'],
    matchedTerms: ['chapter 7','chapter 13','bankruptcy','means test','creditor','debt schedule'],
    requiredFields: ['state','county','householdSize','income','debts','assets','lawsuits','garnishments','foreclosureStatus'],
    reviewerChecklist: ['Bankruptcy is review-heavy; do not generate completed filing papers without attorney/professional review.', 'Collect debts, assets, income, expenses, lawsuits, garnishments, and foreclosure details.', 'Identify urgent court, wage, bank, utility, repossession, or foreclosure deadlines.'],
    deliveryType: 'organized debt and document worksheet; attorney review recommended'
  },
  {
    id: 'ssa-disability-appeal-starter', practiceSlug: 'disability-benefits', title: 'Social Security disability appeal starter file', readinessLevel: 1,
    officialSourceName: 'Social Security Administration Forms', jurisdiction: 'Federal',
    officialForms: ['SSA-561', 'SSA-3441', 'SSA-827 where applicable'],
    matchedTerms: ['ssdi','ssi','disability appeal','ssa-561','ssa-3441','denied disability'],
    requiredFields: ['noticeDate','deadlineDate','conditions','doctors','medications','workHistory','hospitalizations','appealLevel'],
    reviewerChecklist: ['Confirm appeal deadline from the denial notice.', 'Collect medical providers, treatment dates, medications, work history, and denial reason.', 'Route to benefits professional/attorney review when deadline or hearing risk appears.'],
    deliveryType: 'appeal organizer and medical-evidence checklist first'
  },
  {
    id: 'business-ein-ss4-starter', practiceSlug: 'business-formation-compliance', title: 'Business formation and EIN starter file', readinessLevel: 2,
    officialSourceName: 'IRS and state business filing sources', jurisdiction: 'Federal plus selected state/local filing office',
    officialForms: ['IRS SS-4', 'state entity formation forms', 'beneficial ownership/compliance checklist where applicable'],
    matchedTerms: ['ein','ss-4','llc','corporation','articles of organization','articles of incorporation','annual report','registered agent','beneficial ownership','boi'],
    requiredFields: ['entityType','state','businessName','ownerNames','businessAddress','registeredAgent','einNeeded','licensesNeeded'],
    reviewerChecklist: ['Verify state filing source and current fees before preparing documents.', 'Separate entity formation, EIN, registered agent, annual report, beneficial ownership/compliance, and license needs.', 'Recommend attorney/CPA/accountant/filing professional review when ownership, tax, or compliance issues are complex.'],
    deliveryType: 'field-organized business filing worksheet; future draft candidate after state-source verification'
  },
  {
    id: 'trademark-application-starter', practiceSlug: 'trademarks', title: 'Trademark application starter file', readinessLevel: 1,
    officialSourceName: 'USPTO Trademark Center', jurisdiction: 'Federal',
    officialForms: ['USPTO online trademark application pathway', 'Office Action response organizer'],
    matchedTerms: ['trademark','brand name','logo','office action','specimen','goods and services'],
    requiredFields: ['markText','ownerName','goodsServices','firstUseDate','specimenAvailable','officeActionDeadline'],
    reviewerChecklist: ['Do not promise direct USPTO filing in this version.', 'Collect owner, mark, goods/services, specimen, and deadlines.', 'Recommend trademark attorney review for clearance, refusals, Office Actions, or disputes.'],
    deliveryType: 'USPTO starter file and specimen checklist first'
  },
  {
    id: 'state-family-divorce-starter', practiceSlug: 'divorce-family-law', title: 'State divorce and family starting file', readinessLevel: 1,
    officialSourceName: 'State court self-help and local court forms', jurisdiction: 'Selected state/county/court',
    officialForms: ['state-specific divorce, custody, support, visitation, or family court forms'],
    matchedTerms: ['divorce','custody','visitation','child support','family court','uncontested divorce'],
    requiredFields: ['state','county','marriageDate','children','agreementStatus','servedPapers','courtDate','protectionOrderConcern'],
    reviewerChecklist: ['State and county must be selected before form guidance.', 'Identify whether the matter is uncontested, contested, custody/support-related, or protection-order-related.', 'Recommend attorney review for contested issues, domestic violence, children, property, or urgent court dates.'],
    deliveryType: 'state/county starter file; official form draft only after jurisdiction verification in a future version'
  },
  {
    id: 'vehicle-accident-document-organizer', practiceSlug: 'vehicle-accidents', title: 'Vehicle accident document organizer', readinessLevel: 1,
    officialSourceName: 'Police, insurance, DMV, court, and medical-billing sources selected by jurisdiction', jurisdiction: 'Selected state/county/city',
    officialForms: ['police report request', 'insurance claim documents', 'medical-bill organizer', 'demand-letter support file'],
    matchedTerms: ['car accident','vehicle accident','rideshare','police report','insurance claim','medical bills','settlement'],
    requiredFields: ['state','accidentDate','injuries','policeReport','insuranceCompany','claimNumber','medicalBills','deadlineDate'],
    reviewerChecklist: ['Collect police report, photos, insurance letters, medical bills, treatment records, and settlement communications.', 'Recommend attorney review when injuries, disputed fault, deadline, low offer, or lawsuit risk appears.', 'Do not promise settlement value or outcome.'],
    deliveryType: 'accident/insurance document file and review checklist first'
  },
  {
    id: 'medical-malpractice-records-organizer', practiceSlug: 'medical-malpractice', title: 'Medical malpractice records organizer', readinessLevel: 1,
    officialSourceName: 'State court and medical-record request sources', jurisdiction: 'Selected state/county',
    officialForms: ['medical records requests', 'state-specific pre-suit/court requirements where applicable'],
    matchedTerms: ['medical malpractice','doctor error','hospital error','misdiagnosis','surgery mistake','birth injury'],
    requiredFields: ['state','incidentDate','providerName','injuryDescription','recordsRequested','deadlineDate','expertReviewNeeded'],
    reviewerChecklist: ['Medical malpractice is state-specific and deadline-sensitive.', 'Collect timeline, providers, medical records, bills, photos, and written communications.', 'Attorney review should be recommended before claim decisions.'],
    deliveryType: 'records/timeline organizer; attorney review recommended'
  }
];

function readinessByLevel(level){ return FORM_PATH_READINESS.find(x => x.level === Number(level)) || FORM_PATH_READINESS[0]; }
function labelForField(name){
  return String(name || '').replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}
function missingRequiredFields(path, facts){
  const f = facts || {};
  return (path.requiredFields || []).filter(name => !String(f[name] || f[`smart_${name}`] || '').trim());
}
function evaluateFormPathReadiness(path, facts){
  const missingFields = missingRequiredFields(path, facts);
  const total = (path.requiredFields || []).length || 1;
  const completeCount = Math.max(0, total - missingFields.length);
  const completionPercent = Math.round((completeCount / total) * 100);
  let reviewerStatus = 'worksheet only';
  if (path.readinessLevel >= 2 && completionPercent >= 80) reviewerStatus = 'field-organized for Human Review Specialist check';
  if (path.readinessLevel >= 3 && completionPercent === 100) reviewerStatus = 'review-ready draft candidate';
  return {
    pathId: path.id,
    readinessLevel: path.readinessLevel,
    readinessLabel: readinessByLevel(path.readinessLevel).label,
    completionPercent,
    completeCount,
    totalRequiredFields: total,
    missingFields,
    missingFieldLabels: missingFields.map(labelForField),
    reviewerStatus,
    canPrepareCompletedDraftNow: false,
    userMessage: missingFields.length ? 'More information is needed before any completed form draft should be considered.' : 'The starter facts look more complete, but Human Review Specialist review is still required before any completed form delivery.'
  };
}
function scorePath(path, context){
  const text = [context.question, context.subcategory, context.documentType, JSON.stringify(context.smartAnswers || {})].join(' ').toLowerCase();
  let score = path.practiceSlug === context.practiceSlug ? 4 : 0;
  for (const term of path.matchedTerms || []) if (text.includes(term.toLowerCase())) score += 3;
  if (context.subcategory && path.title.toLowerCase().includes(String(context.subcategory).toLowerCase().split(' ')[0])) score += 1;
  return score;
}
function recommendFormPaths(context){
  const scored = FORM_PATHS.map(path => ({ path, score: scorePath(path, context) }))
    .filter(item => item.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 3)
    .map(item => {
      const readiness = readinessByLevel(item.path.readinessLevel);
      const facts = { ...(context.smartAnswers || {}), state: context.state || '', county: context.county || '', city: context.city || '', deadlineDate: context.deadlineDate || context.smartAnswers?.deadlineDate || '', amountInvolved: context.smartAnswers?.amountInvolved || '', documentType: context.documentType || '' };
      const evaluation = evaluateFormPathReadiness(item.path, facts);
      return { ...item.path, readinessLabel: readiness.label, userMeaning: readiness.userMeaning, missingFields: evaluation.missingFields, missingFieldLabels: evaluation.missingFieldLabels, completionPercent: evaluation.completionPercent, reviewerStatus: evaluation.reviewerStatus, canPrepareCompletedDraftNow: evaluation.canPrepareCompletedDraftNow, matchedScore: item.score };
    });
  return scored;
}
module.exports = { FORM_PATHS, FORM_PATH_READINESS, recommendFormPaths, readinessByLevel, missingRequiredFields, evaluateFormPathReadiness, labelForField };
