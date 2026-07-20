const REVIEW_READY_DRAFT_LEVELS = [
  { level: 0, label: 'Not selected yet', userMeaning: 'Smarter Justice has not matched this file to a review-ready draft path yet.' },
  { level: 1, label: 'Organizer only', userMeaning: 'Answers are organized for review, but no official-form field map is active yet.' },
  { level: 2, label: 'Form-preparation starter file', userMeaning: 'User answers are mapped to official-form-style fields for Human Review Specialist review.' },
  { level: 3, label: 'Draft organized for human review', userMeaning: 'A Human Review Specialist can check saved answers, missing items, official sources, and supporting documents before anything is delivered.' },
  { level: 4, label: 'Approved for user review after human review', userMeaning: 'Only after staff approval can the draft be delivered for the user to review, correct, sign, and file if appropriate.' }
];

function field(key, label, opts={}){
  return { key, label, required: opts.required !== false, source: opts.source || key, help: opts.help || '', sensitive: Boolean(opts.sensitive), reviewNote: opts.reviewNote || '' };
}

const REVIEW_READY_DRAFT_PATHS = [
  {
    id: 'irs-9465-installment-agreement-review-draft',
    title: 'IRS Form 9465 Installment Agreement review-ready draft',
    practiceSlug: 'taxes',
    relatedFormPathIds: ['tax-installment-agreement-9465-starter'],
    safePathReason: 'Form 9465 is a clearer federal payment-plan request path, but tax professional review may still be needed for liens, levies, business taxes, audits, appeals, or high balances.',
    officialSourceName: 'IRS Form 9465, Installment Agreement Request',
    officialFormNumbers: ['Form 9465'],
    officialUrl: 'https://www.irs.gov/forms-pubs/about-form-9465',
    sourceCheckedDate: '2026-06-19',
    automationBoundary: 'Preliminary draft for review only. No automatic IRS filing and no guarantee the IRS will accept any payment plan.',
    reviewerRequired: true,
    professionalReviewRecommendation: 'CPA, enrolled agent, accountant, or tax attorney review may be recommended when collection risk, levy, lien, audit, appeal, business/payroll tax, or disputed tax is involved.',
    requiredDocuments: ['IRS notice or bill', 'Tax years and balance due', 'Proposed monthly payment', 'Filing status/contact details', 'Payment method preference if available'],
    fields: [
      field('taxpayerName','Taxpayer name',{source:'fullName'}),
      field('taxpayerEmail','Contact email',{source:'email', required:false}),
      field('taxpayerPhone','Contact phone',{source:'phone', required:false}),
      field('taxYears','Tax years involved'),
      field('amountOwed','Approximate amount owed',{source:'amountInvolved'}),
      field('noticeNumber','IRS notice number, if any',{required:false}),
      field('proposedMonthlyPayment','Proposed monthly payment'),
      field('paymentDueDay','Preferred monthly payment day',{required:false}),
      field('bankAccountPreference','Payment method preference',{required:false}),
      field('deadlineDate','Deadline or date shown on notice',{required:false}),
      field('state','State',{source:'jurisdiction.state', required:false})
    ]
  },
  {
    id: 'irs-ss4-ein-review-draft',
    title: 'IRS Form SS-4 EIN review-ready draft',
    practiceSlug: 'business-formation-compliance',
    relatedFormPathIds: ['business-ein-ss4-starter'],
    safePathReason: 'EIN/SS-4 facts can be organized into a clear field map, but entity type, responsible party, and state formation details still require careful review.',
    officialSourceName: 'IRS Form SS-4, Application for Employer Identification Number',
    officialFormNumbers: ['Form SS-4'],
    officialUrl: 'https://www.irs.gov/forms-pubs/about-form-ss-4',
    sourceCheckedDate: '2026-06-19',
    automationBoundary: 'Preliminary draft for review only. The IRS EIN online application may be more appropriate, and state formation must be checked separately.',
    reviewerRequired: true,
    professionalReviewRecommendation: 'Attorney, CPA, accountant, or filing professional review may be recommended for multi-owner entities, tax classification, nonprofit, foreign owners, or regulated businesses.',
    requiredDocuments: ['Entity name', 'Trade name if any', 'Responsible party', 'Business mailing address', 'Entity type', 'Reason for applying', 'State formation details'],
    fields: [
      field('legalName','Legal name of entity or individual',{source:'businessName'}),
      field('tradeName','Trade name / DBA',{required:false}),
      field('executorOrResponsibleParty','Responsible party or owner',{source:'ownerNames'}),
      field('mailingAddress','Mailing address',{source:'businessAddress'}),
      field('state','State where formed or operating',{source:'jurisdiction.state'}),
      field('county','County/local jurisdiction',{source:'jurisdiction.county', required:false}),
      field('entityType','Entity type'),
      field('reasonForApplying','Reason for applying',{source:'einNeeded'}),
      field('registeredAgent','Registered agent',{required:false}),
      field('startDate','Business start or acquisition date',{required:false}),
      field('principalActivity','Principal business activity',{source:'licensesNeeded', required:false})
    ]
  },
  {
    id: 'ssa-561-reconsideration-review-draft',
    title: 'SSA-561 Request for Reconsideration review-ready draft',
    practiceSlug: 'disability-benefits',
    relatedFormPathIds: ['ssa-disability-appeal-starter'],
    safePathReason: 'SSA appeal facts can be organized around the denial notice, appeal deadline, medical conditions, providers, medications, and work history.',
    officialSourceName: 'SSA Form SSA-561, Request for Reconsideration',
    officialFormNumbers: ['SSA-561', 'SSA-3441 where applicable'],
    officialUrl: 'https://www.ssa.gov/forms/ssa-561.html',
    sourceCheckedDate: '2026-06-19',
    automationBoundary: 'Review-ready appeal starter only. Users must verify appeal deadline, upload the denial notice, and decide how to file with SSA.',
    reviewerRequired: true,
    professionalReviewRecommendation: 'Benefits attorney/advocate review may be recommended when the denial deadline is close, the user has a hearing issue, or medical evidence is complex.',
    requiredDocuments: ['SSA denial notice', 'Medical provider list', 'Medication list', 'Treatment dates', 'Work history', 'Any new evidence'],
    fields: [
      field('claimantName','Claimant name',{source:'fullName'}),
      field('claimantEmail','Contact email',{source:'email', required:false}),
      field('noticeDate','SSA notice date'),
      field('deadlineDate','Appeal deadline or date shown'),
      field('appealLevel','Appeal level'),
      field('conditions','Medical conditions'),
      field('doctors','Doctors, clinics, or hospitals'),
      field('medications','Medications'),
      field('workHistory','Work history'),
      field('reasonForDisagreement','Why the user disagrees',{source:'question'}),
      field('newEvidence','New evidence available',{required:false})
    ]
  },

  {
    id: 'irs-1040x-amended-return-review-draft',
    title: 'IRS Form 1040-X amended return review-ready starter draft',
    practiceSlug: 'taxes',
    relatedFormPathIds: ['tax-return-preparation-organizer'],
    safePathReason: 'A prior filed individual return can be organized into an amended-return review worksheet, but corrected tax calculations and filing decisions require careful review.',
    officialSourceName: 'IRS Form 1040-X, Amended U.S. Individual Income Tax Return',
    officialFormNumbers: ['Form 1040-X'],
    officialUrl: 'https://www.irs.gov/forms-pubs/about-form-1040x',
    sourceCheckedDate: '2026-06-30',
    automationBoundary: 'Preliminary amended-return draft for review only. No automatic tax calculation, e-file submission, refund guarantee, or tax advice in this version.',
    reviewerRequired: true,
    professionalReviewRecommendation: 'CPA, enrolled agent, accountant, or tax attorney review may be recommended when the return year, refund claim, audit notice, state return, credit/deduction change, or penalties are involved.',
    requiredDocuments: ['Prior filed return', 'W-2/1099/K-1 documents', 'IRS/state notice if any', 'documents supporting each change', 'refund/balance-due information'],
    fields: [
      field('taxpayerName','Taxpayer name',{source:'fullName'}),
      field('taxYear','Tax year to amend'),
      field('filingStatus','Filing status on original/amended return'),
      field('originalReturnFiled','Was the original return filed?'),
      field('reasonForAmendment','Reason for amendment',{source:'question'}),
      field('changedIncome','Income changes',{required:false}),
      field('changedDeductions','Deduction or credit changes',{required:false}),
      field('expectedRefundOrBalance','Expected refund or balance due',{source:'amountInvolved', required:false}),
      field('irsOrStateNotice','IRS or state notice involved',{source:'noticeNumber', required:false}),
      field('supportingDocuments','Supporting documents available',{source:'documentType'}),
      field('state','State return may also be affected',{source:'jurisdiction.state', required:false})
    ]
  },
  {
    id: 'irs-433a-oic-review-draft',
    title: 'IRS Form 433-A (OIC) collection information review-ready starter draft',
    practiceSlug: 'taxes',
    relatedFormPathIds: ['tax-resolution-oic-starter'],
    safePathReason: 'OIC financial facts can be organized, but the decision to submit an offer and the amount/payment structure are high-risk tax-resolution questions.',
    officialSourceName: 'IRS Form 433-A (OIC), Collection Information Statement for Wage Earners and Self-Employed Individuals',
    officialFormNumbers: ['Form 433-A (OIC)', 'Form 656 where applicable'],
    officialUrl: 'https://www.irs.gov/payments/offer-in-compromise',
    sourceCheckedDate: '2026-06-30',
    automationBoundary: 'Financial organizer and preliminary starter only. No automatic offer recommendation, offer amount, IRS submission, or acceptance prediction.',
    reviewerRequired: true,
    professionalReviewRecommendation: 'CPA, enrolled agent, accountant, or tax attorney review is strongly recommended for OIC, liens, levies, payroll/business tax, appeals, or disputed tax.',
    requiredDocuments: ['IRS balance/notice', 'tax years and filing status', 'income proof', 'bank statements', 'asset list', 'monthly expenses', 'household information', 'self-employment/business details if any'],
    fields: [
      field('taxpayerName','Taxpayer name',{source:'fullName'}),
      field('taxYears','Tax years involved'),
      field('amountOwed','Approximate amount owed',{source:'amountInvolved'}),
      field('householdSize','Household size'),
      field('monthlyIncome','Monthly income'),
      field('monthlyExpenses','Monthly expenses'),
      field('assets','Assets'),
      field('bankAccounts','Bank accounts'),
      field('employmentStatus','Employment/self-employment status',{required:false}),
      field('filingCompliance','All required returns filed?',{required:false}),
      field('levyLienGarnishment','Lien, levy, or garnishment issue',{source:'question', required:false}),
      field('deadlineDate','Deadline/date shown',{required:false})
    ]
  },
  {
    id: 'irs-2848-poa-review-draft',
    title: 'IRS Form 2848 power of attorney review-ready starter draft',
    practiceSlug: 'taxes',
    relatedFormPathIds: [],
    safePathReason: 'Form 2848 facts can be organized for a taxpayer and eligible representative, but eligibility, scope, CAF details, and signatures must be verified carefully.',
    officialSourceName: 'IRS Form 2848, Power of Attorney and Declaration of Representative',
    officialFormNumbers: ['Form 2848'],
    officialUrl: 'https://www.irs.gov/forms-pubs/about-form-2848',
    sourceCheckedDate: '2026-06-30',
    automationBoundary: 'Preliminary starter only. No representative eligibility verification or automatic IRS submission in this version.',
    reviewerRequired: true,
    professionalReviewRecommendation: 'Tax attorney, CPA, enrolled agent, or other eligible representative review may be required before this can be used.',
    requiredDocuments: ['Taxpayer identity/contact', 'representative name and credential', 'tax form/type', 'tax periods', 'scope of authorization', 'signature readiness'],
    fields: [
      field('taxpayerName','Taxpayer name',{source:'fullName'}),
      field('taxpayerAddress','Taxpayer address',{required:false}),
      field('taxpayerPhone','Taxpayer phone',{source:'phone', required:false}),
      field('representativeName','Representative name'),
      field('representativeCredential','Representative credential'),
      field('representativeContact','Representative contact information',{required:false}),
      field('taxMatter','Tax matter/form type',{source:'taxYears'}),
      field('taxPeriods','Tax periods/years',{source:'taxYears'}),
      field('authorizationScope','Authorization scope',{source:'desiredHelp'}),
      field('signatureReady','Taxpayer understands signatures are required',{required:false})
    ]
  },
  {
    id: 'irs-8857-innocent-spouse-review-draft',
    title: 'IRS Form 8857 innocent spouse relief review-ready starter draft',
    practiceSlug: 'taxes',
    relatedFormPathIds: [],
    safePathReason: 'Innocent spouse facts can be organized around the liability, spouse/former spouse, notice, and timeline, but eligibility and supporting facts are review-heavy.',
    officialSourceName: 'IRS Form 8857, Request for Innocent Spouse Relief',
    officialFormNumbers: ['Form 8857'],
    officialUrl: 'https://www.irs.gov/forms-pubs/about-form-8857',
    sourceCheckedDate: '2026-06-30',
    automationBoundary: 'Starter and review organizer only. No eligibility determination, submission, or outcome prediction.',
    reviewerRequired: true,
    professionalReviewRecommendation: 'Tax attorney, CPA, enrolled agent, accountant, or taxpayer advocate-style review may be recommended depending on notices, collections, deadlines, and spouse/former-spouse facts.',
    requiredDocuments: ['IRS notice', 'tax years', 'joint-return facts', 'spouse/former spouse information', 'reason user believes liability should not be theirs', 'collection or deadline documents'],
    fields: [
      field('requesterName','Requester name',{source:'fullName'}),
      field('taxYears','Tax years involved'),
      field('spouseFormerSpouseName','Spouse/former spouse name'),
      field('jointReturnFiled','Joint return filed?'),
      field('noticeNumber','IRS notice number',{required:false}),
      field('amountOwed','Approximate amount involved',{source:'amountInvolved', required:false}),
      field('whyReliefRequested','Why relief is requested',{source:'question'}),
      field('collectionActivity','Collection activity or deadline',{source:'deadlineDate', required:false}),
      field('supportingDocuments','Supporting documents available',{source:'documentType'}),
      field('state','State',{source:'jurisdiction.state', required:false})
    ]
  },
  {
    id: 'copyright-registration-review-draft',
    title: 'Copyright registration review-ready starter draft',
    practiceSlug: 'copyrights',
    relatedFormPathIds: [],
    safePathReason: 'Copyright registration can be organized by work type, title, authorship, ownership, creation/publication facts, and evidence, while official filing remains through the Copyright Office system or forms.',
    officialSourceName: 'U.S. Copyright Office registration forms and eCO portal',
    officialFormNumbers: ['Form TX', 'Form VA', 'Form PA', 'Form SR', 'eCO registration pathway'],
    officialUrl: 'https://www.copyright.gov/forms/',
    sourceCheckedDate: '2026-06-19',
    automationBoundary: 'Registration starter file only. No automatic Copyright Office filing in this version.',
    reviewerRequired: true,
    professionalReviewRecommendation: 'Copyright attorney review may be recommended for infringement, ownership disputes, works made for hire, multiple authors, or DMCA issues.',
    requiredDocuments: ['Copy/deposit of the work', 'Work title', 'Author/creator facts', 'Owner/claimant facts', 'Publication status/date', 'Evidence of ownership'],
    fields: [
      field('workTitle','Title of work'),
      field('workType','Type of work'),
      field('authorName','Author/creator'),
      field('ownerName','Owner/claimant'),
      field('creationDate','Date created',{required:false}),
      field('publicationStatus','Publication status'),
      field('publicationDate','Publication date',{required:false}),
      field('evidenceAvailable','Evidence/deposit available',{required:false}),
      field('opposingParty','Other party, if dispute',{required:false}),
      field('deadlineDate','Deadline/date shown, if any',{required:false})
    ]
  },
  {
    id: 'vehicle-accident-demand-file-review-draft',
    title: 'Vehicle accident demand/support file review-ready draft',
    practiceSlug: 'vehicle-accidents',
    relatedFormPathIds: ['vehicle-accident-document-organizer'],
    safePathReason: 'Accident facts can be organized into a review-ready insurance/demand-support file without giving settlement value or legal advice.',
    officialSourceName: 'Police, DMV, insurance, medical-billing, and court sources by state/local jurisdiction',
    officialFormNumbers: ['Police report request', 'insurance claim file', 'medical-bill organizer'],
    officialUrl: '',
    sourceCheckedDate: '2026-06-19',
    automationBoundary: 'Document organizer only. No settlement value estimate, demand amount guarantee, or attorney substitute.',
    reviewerRequired: true,
    professionalReviewRecommendation: 'Personal injury attorney review may be recommended when injuries, disputed fault, low settlement offer, litigation, minors, death, or deadline risk appears.',
    requiredDocuments: ['Police report', 'Photos/video', 'Insurance letters', 'Medical bills', 'Treatment records', 'Repair estimates', 'Lost wage documents'],
    fields: [
      field('injuredPersonName','Injured/person involved',{source:'fullName'}),
      field('accidentDate','Accident date'),
      field('state','State',{source:'jurisdiction.state'}),
      field('city','City',{source:'jurisdiction.city', required:false}),
      field('roleInAccident','Role in accident'),
      field('injuryStatus','Injury status',{source:'injuries'}),
      field('policeReport','Police report status'),
      field('insuranceCompany','Insurance company'),
      field('claimNumber','Claim number',{required:false}),
      field('medicalBills','Medical bills/treatment records'),
      field('lostWages','Lost wages/missed work',{required:false}),
      field('settlementOffer','Settlement offer or denial',{source:'amountInvolved', required:false})
    ]
  }
];

function getPathById(id){ return REVIEW_READY_DRAFT_PATHS.find(p => p.id === id) || null; }
function pathByPractice(slug){ return REVIEW_READY_DRAFT_PATHS.filter(p => p.practiceSlug === slug); }

function valueAt(obj, dotted){
  if (!dotted) return '';
  if (dotted === 'question') return obj.question || '';
  const parts = String(dotted).split('.');
  let cur = obj;
  for (const p of parts) cur = cur && cur[p] !== undefined ? cur[p] : undefined;
  return cur === undefined || cur === null ? '' : cur;
}
function smartValue(c, key){
  const overrides = c.reviewReadyDraftOverrides || {};
  if (overrides[key] !== undefined && overrides[key] !== null && String(overrides[key]).trim()) return overrides[key];
  const smart = c.smartAnswers || {};
  const future = c.futureLeadFieldsCaptured || {};
  const direct = c[key];
  if (direct !== undefined && direct !== null && String(direct).trim()) return direct;
  if (smart[key] !== undefined && smart[key] !== null && String(smart[key]).trim()) return smart[key];
  if (future[key] !== undefined && future[key] !== null && String(future[key]).trim()) return future[key];
  return '';
}
function mappedValue(c, fieldSpec){
  const source = fieldSpec.source || fieldSpec.key;
  if (source.includes('.')) return valueAt(c, source);
  const smart = smartValue(c, source);
  if (smart !== '') return smart;
  if (fieldSpec.key !== source) return smartValue(c, fieldSpec.key);
  return '';
}
function chooseDraftPath(c){
  const analysisPaths = c.analysis?.verifiedFormPaths || [];
  for (const ap of analysisPaths) {
    const matched = REVIEW_READY_DRAFT_PATHS.find(p => (p.relatedFormPathIds || []).includes(ap.id));
    if (matched) return matched;
  }
  const slug = c.practiceSlug || c.analysis?.practiceSlug || '';
  const candidates = pathByPractice(slug);
  if (!candidates.length) return null;
  const text = [c.question, c.subcategory, c.documentType, c.desiredHelp, Object.values(c.smartAnswers || {}).join(' ')].join(' ').toLowerCase();
  let best = candidates[0]; let bestScore = 0;
  for (const path of candidates) {
    let score = 0;
    for (const term of [...(path.officialFormNumbers || []), path.title, path.officialSourceName]) {
      if (term && text.includes(String(term).toLowerCase())) score += 2;
    }
    if (score > bestScore) { best = path; bestScore = score; }
  }
  return best;
}
function buildReviewReadyDraftEvaluation(c){
  const path = chooseDraftPath(c || {});
  if (!path) {
    return {
      matched:false,
      status:'organizer only',
      level:1,
      label:'Organizer only',
      userMessage:'This file can still be organized for review, but Smarter Justice has not matched it to one of the first review-ready draft paths yet.',
      completionPercent:0,
      mappedFields:[],
      missingRequiredFields:[],
      requiredDocuments:[],
      reviewerRequired:true
    };
  }
  const mappedFields = path.fields.map(f => {
    const value = mappedValue(c, f);
    return { key:f.key, label:f.label, value: String(value || '').slice(0, 1200), present:String(value || '').trim().length > 0, required:f.required !== false, help:f.help || '', reviewNote:f.reviewNote || '' };
  });
  const missingRequiredFields = mappedFields.filter(f => f.required && !f.present).map(f => ({ key:f.key, label:f.label }));
  const requiredTotal = mappedFields.filter(f => f.required).length || 1;
  const completeTotal = mappedFields.filter(f => f.required && f.present).length;
  const completionPercent = Math.round((completeTotal / requiredTotal) * 100);
  const docsUploaded = Array.isArray(c.attachments) ? c.attachments.length : 0;
  const level = completionPercent >= 85 && docsUploaded > 0 ? 3 : 2;
  const label = level >= 3 ? 'Draft organized for human review' : 'Form-preparation starter file';
  const approvalStatus = c.reviewReadyDraftStatus || 'not reviewed yet';
  const approvalGatePassed = /approved for user review|delivered to user/i.test(String(approvalStatus));
  const deliveryBlockers = [
    ...missingRequiredFields.map(f => `Missing: ${f.label}`),
    ...(docsUploaded ? [] : ['No supporting documents uploaded yet']),
    ...(approvalGatePassed ? [] : ['Human Review Specialist approval is not complete'])
  ];
  return {
    matched:true,
    pathId:path.id,
    title:path.title,
    practiceSlug:path.practiceSlug,
    officialSourceName:path.officialSourceName,
    officialFormNumbers:path.officialFormNumbers,
    officialUrl:path.officialUrl,
    sourceCheckedDate:path.sourceCheckedDate,
    automationBoundary:path.automationBoundary,
    safePathReason:path.safePathReason,
    professionalReviewRecommendation:path.professionalReviewRecommendation,
    reviewerRequired:path.reviewerRequired,
    requiredDocuments:path.requiredDocuments,
    level,
    label,
    userMessage: missingRequiredFields.length ? 'Smarter Justice can organize a form-preparation starter file, but more information is needed before it should be reviewed or delivered.' : 'The main required starter fields are present. Human Review Specialist review is still required before delivery.',
    completionPercent,
    mappedFields,
    missingRequiredFields,
    documentsUploaded:docsUploaded,
    approvalStatus,
    approvalGatePassed,
    deliveryBlockers,
    canDeliverForUserReview: deliveryBlockers.length === 0,
    overrideCount: Object.keys(c.reviewReadyDraftOverrides || {}).length,
    staffReviewChecklist:[
      'Verify the latest official source, instructions, fees, filing method, and signature requirements.',
      'Confirm identity, jurisdiction, deadlines, uploaded notices, and supporting documents.',
      'Resolve every missing required field before marking anything ready for delivery.',
      'Escalate to attorney, tax attorney, CPA, enrolled agent, accountant, benefits professional, or injury attorney review when the file is high-risk.',
      'Do not promise approval, outcome, refund, benefit, settlement, or timing.'
    ]
  };
}

module.exports = { REVIEW_READY_DRAFT_LEVELS, REVIEW_READY_DRAFT_PATHS, buildReviewReadyDraftEvaluation, getPathById };
