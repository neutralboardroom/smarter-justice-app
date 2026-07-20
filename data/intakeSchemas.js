const DEFAULT_DOCUMENT_TYPES = [
  'Notice or letter',
  'Court paper or lawsuit',
  'Agency notice',
  'Tax notice',
  'Benefits notice or denial',
  'Insurance letter',
  'Demand letter',
  'Contract or agreement',
  'Government form',
  'Photo or screenshot',
  'Medical record or bill',
  'Business filing',
  'Email or message',
  'Other document'
];

const REVIEW_PREFERENCES = [
  'I only want to see where to start',
  'I want an organized file for review',
  'I want completed forms after review if available',
  'I want attorney or professional review if recommended',
  'I have an urgent deadline or notice'
];

const DEFAULT_FOLLOW_UPS = [
  { name: 'documentType', label: 'What kind of document are you uploading?', type: 'select', options: DEFAULT_DOCUMENT_TYPES, optional: true },
  { name: 'dateReceived', label: 'When did you receive the document or notice?', type: 'date', optional: true },
  { name: 'deadlineDate', label: 'What deadline, hearing date, or response date appears on it?', type: 'date', optional: true },
  { name: 'courtOrAgency', label: 'Court, agency, company, office, or other sender', type: 'text', optional: true },
  { name: 'opposingParty', label: 'Other person, company, landlord, agency, insurer, creditor, or employer involved', type: 'text', optional: true },
  { name: 'amountInvolved', label: 'Approximate amount involved, if money is part of the issue', type: 'text', optional: true },
  { name: 'desiredHelp', label: 'What would you like Smarter Justice to help organize first?', type: 'select', options: REVIEW_PREFERENCES, optional: true }
];

const SCHEMAS = {
  taxes: {
    title: 'Tax preparation or tax resolution details',
    note: 'Tax filing questions and tax debt/notice questions stay close together, but the review lane can be different.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'taxPrepOrResolution', label: 'Is this mainly tax preparation or tax resolution?', type: 'select', options: ['Tax preparation', 'Tax resolution / notice / debt', 'Both', 'Not sure'], optional: true },
      { name: 'taxYears', label: 'Tax year or years involved', type: 'text', optional: true },
      { name: 'noticeNumber', label: 'IRS, state, or city notice number if shown', type: 'text', optional: true },
      { name: 'amountInvolved', label: 'Approximate amount the notice says is due or disputed', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'Deadline, response date, hearing date, or levy/garnishment date', type: 'date', optional: true },
      { name: 'desiredHelp', label: 'Preferred help', type: 'select', options: ['Organize a tax notice', 'Prepare for CPA/enrolled agent/accountant review', 'Prepare for tax attorney review', 'Explore payment plan or offer in compromise starting file', 'Tax return preparation help'], optional: true }
    ]
  },
  'divorce-family-law': {
    title: 'Family and divorce starting details',
    note: 'State, county, children, service, and court status matter before any forms are chosen.',
    requiredBeforeSpecificHelp: ['state', 'county', 'question'],
    followUps: [
      { name: 'marriageOrCaseStatus', label: 'Current status', type: 'select', options: ['Not filed yet', 'Papers received', 'Case already filed', 'Need uncontested divorce help', 'Custody/visitation/support issue', 'Protection order concern'], optional: true },
      { name: 'childrenInvolved', label: 'Are children involved?', type: 'select', options: ['Yes', 'No', 'Not sure'], optional: true },
      { name: 'courtOrAgency', label: 'Court name or county if papers were filed', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'Response date, hearing date, or deadline', type: 'date', optional: true }
    ]
  },
  'landlord-tenant-housing': {
    title: 'Housing notice details',
    note: 'Eviction, rent, repair, deposit, and housing-court issues depend heavily on state, county, city, and notice type.',
    requiredBeforeSpecificHelp: ['state', 'county', 'city', 'question'],
    followUps: [
      { name: 'housingRole', label: 'Are you the tenant, landlord, roommate, or property owner?', type: 'select', options: ['Tenant', 'Landlord/property owner', 'Roommate', 'Other'], optional: true },
      { name: 'documentType', label: 'Document type', type: 'select', options: ['Eviction notice', 'Court papers', 'Rent demand', 'Repair/habitability letter', 'Security deposit letter', 'Lease', 'Other housing document'], optional: true },
      { name: 'propertyAddress', label: 'Property address or ZIP', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'Court date, cure date, vacate date, or response deadline', type: 'date', optional: true }
    ]
  },
  'business-formation-compliance': {
    title: 'Business formation and compliance details',
    note: 'The state of formation, business type, and filing goal determine the right official source.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'businessType', label: 'Business type', type: 'select', options: ['LLC', 'Corporation', 'Nonprofit', 'Sole proprietor / DBA', 'Partnership', 'Not sure'], optional: true },
      { name: 'formationStatus', label: 'Where are you in the process?', type: 'select', options: ['Starting a new business', 'Already formed', 'Need EIN', 'Annual report/compliance issue', 'Registered agent issue', 'Beneficial ownership/compliance question', 'License or permit'], optional: true },
      { name: 'businessName', label: 'Business name if known', type: 'text', optional: true },
      { name: 'courtOrAgency', label: 'State office, IRS, FinCEN, city/county, or agency involved', type: 'text', optional: true }
    ]
  },
  'nonprofit-formation-compliance': {
    title: 'Nonprofit starting details',
    note: 'Nonprofit formation, EIN, tax exemption, charity registration, and annual filing paths should be separated clearly.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'nonprofitStage', label: 'What stage is the organization in?', type: 'select', options: ['Idea only', 'State nonprofit already formed', 'Need EIN', 'Need 501(c)(3) starting path', 'Need charity registration', 'Need annual filing/compliance help'], optional: true },
      { name: 'organizationName', label: 'Organization name if known', type: 'text', optional: true },
      { name: 'courtOrAgency', label: 'IRS, state charity office, secretary of state, or other agency', type: 'text', optional: true }
    ]
  },
  'vehicle-accidents': {
    title: 'Vehicle accident and insurance details',
    note: 'Accident files work best when the date, location, injuries, police report, insurer letters, and bills are organized early.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'accidentDate', label: 'Accident date', type: 'date', optional: true },
      { name: 'injuryStatus', label: 'Were there injuries?', type: 'select', options: ['Yes', 'No', 'Not sure yet'], optional: true },
      { name: 'policeReport', label: 'Police report available?', type: 'select', options: ['Yes', 'No', 'Requested but not received', 'Not sure'], optional: true },
      { name: 'insuranceStatus', label: 'Insurance status', type: 'select', options: ['Claim opened', 'Claim denied', 'Settlement offer received', 'No claim yet', 'Not sure'], optional: true },
      { name: 'deadlineDate', label: 'Any insurance, court, or claim deadline shown?', type: 'date', optional: true }
    ]
  },
  'medical-malpractice': {
    title: 'Medical malpractice starting details',
    note: 'Medical malpractice is state-specific, deadline-sensitive, and usually needs attorney review and medical-record organization.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'incidentDate', label: 'Date of medical incident or when you discovered the concern', type: 'date', optional: true },
      { name: 'providerType', label: 'Provider involved', type: 'select', options: ['Doctor', 'Hospital', 'Dentist', 'Nursing facility', 'Clinic', 'Pharmacy', 'Other'], optional: true },
      { name: 'injuryStatus', label: 'Current injury status', type: 'select', options: ['Still treating', 'Recovered', 'Permanent injury concern', 'Death occurred', 'Not sure'], optional: true },
      { name: 'recordsAvailable', label: 'Do you have medical records or bills?', type: 'select', options: ['Yes', 'No', 'Requested but not received', 'Some records'], optional: true }
    ]
  },
  'estate-planning': {
    title: 'Estate planning details',
    note: 'Estate planning documents depend on state law and the user’s goals.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'planningGoal', label: 'Main document or goal', type: 'select', options: ['Will', 'Trust', 'Power of attorney', 'Health care proxy / advance directive', 'Living will', 'Full estate plan', 'Not sure'], optional: true },
      { name: 'familySituation', label: 'Family situation', type: 'select', options: ['Single', 'Married', 'Children', 'Blended family', 'Minor children', 'Special needs planning', 'Other'], optional: true },
      { name: 'assetComplexity', label: 'Asset situation', type: 'select', options: ['Simple', 'Home/real estate', 'Business ownership', 'Multiple properties', 'Taxable estate concern', 'Not sure'], optional: true }
    ]
  },
  'public-benefits': {
    title: 'Public benefits details',
    note: 'Benefits matters usually depend on the agency, state/local office, notice type, and appeal deadline.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'benefitType', label: 'Benefit type', type: 'select', options: ['SNAP/food assistance', 'Medicaid', 'Cash assistance', 'Housing benefit', 'Child care benefit', 'Benefit denial', 'Overpayment', 'Other'], optional: true },
      { name: 'courtOrAgency', label: 'Agency or benefits office', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'Appeal, conference, hearing, or response deadline', type: 'date', optional: true }
    ]
  },
  'trademarks': {
    title: 'Trademark starting details',
    note: 'Trademark Center filings and Office Actions are review-heavy; Smarter Justice can organize owner, mark, goods/services, specimen, and deadline information.',
    requiredBeforeSpecificHelp: ['question'],
    followUps: [
      { name: 'markType', label: 'What are you trying to protect?', type: 'select', options: ['Name/word mark', 'Logo/design', 'Slogan', 'Product name', 'Service name', 'Not sure'], optional: true },
      { name: 'ownerType', label: 'Owner type', type: 'select', options: ['Individual', 'LLC/corporation', 'Nonprofit', 'Not formed yet', 'Not sure'], optional: true },
      { name: 'currentUse', label: 'Is the mark already being used?', type: 'select', options: ['Yes', 'No', 'Planned', 'Not sure'], optional: true },
      { name: 'deadlineDate', label: 'Office Action or USPTO deadline if any', type: 'date', optional: true }
    ]
  },
  'bankruptcy-debt': {
    title: 'Bankruptcy and debt details',
    note: 'Debt and bankruptcy matters need careful review; the first goal is a clean creditor, income, asset, lawsuit, and deadline file.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'debtProblem', label: 'Main debt issue', type: 'select', options: ['Credit-card lawsuit', 'Collection letters/calls', 'Wage garnishment', 'Bank restraint', 'Considering Chapter 7', 'Considering Chapter 13', 'Business debt', 'Not sure'], optional: true },
      { name: 'amountInvolved', label: 'Approximate total debt or amount sued for', type: 'text', optional: true },
      { name: 'courtOrAgency', label: 'Court or creditor/collector name', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'Answer date, court date, garnishment date, or deadline', type: 'date', optional: true }
    ]
  },
  'small-claims-consumer-debt': {
    title: 'Small claims, consumer debt, and lawsuit response details',
    note: 'The platform must know whether you want to start a claim, respond to a lawsuit, organize a debt case, or deal with a judgment/collection notice.',
    requiredBeforeSpecificHelp: ['state', 'county', 'question'],
    followUps: [
      { name: 'issueStage', label: 'Current stage', type: 'select', options: ['Want to start a small claim', 'Demand letter received/sent', 'Served with summons/complaint', 'Need to answer a debt lawsuit', 'Judgment entered', 'Garnishment/collection notice', 'Settlement offer', 'Not sure'], optional: true },
      { name: 'opposingParty', label: 'Person, business, creditor, collector, or law firm on the other side', type: 'text', optional: true },
      { name: 'amountInvolved', label: 'Amount claimed, owed, or disputed', type: 'text', optional: true },
      { name: 'courtOrAgency', label: 'Court name, collector, or agency if shown', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'Answer date, hearing date, payment deadline, or response date', type: 'date', optional: true }
    ]
  },
  'disability-benefits': {
    title: 'Disability benefits and appeal details',
    note: 'Appeal deadlines, doctors, treatment, medications, and work history are usually more important than choosing a form too early.',
    requiredBeforeSpecificHelp: ['question'],
    followUps: [
      { name: 'issueStage', label: 'Current stage', type: 'select', options: ['Initial application', 'Denied and need appeal', 'Reconsideration', 'Hearing scheduled', 'Benefits stopped/reviewed', 'Not sure'], optional: true },
      { name: 'noticeDate', label: 'Date on denial or SSA notice', type: 'date', optional: true },
      { name: 'deadlineDate', label: 'Appeal, hearing, or response deadline', type: 'date', optional: true },
      { name: 'conditions', label: 'Medical or mental health conditions', type: 'text', optional: true },
      { name: 'doctors', label: 'Doctors, hospitals, clinics, therapists, or treatment sources', type: 'text', optional: true },
      { name: 'workHistory', label: 'Recent work history or last date worked', type: 'text', optional: true }
    ]
  },
  'employment-wage-claims': {
    title: 'Employment, wage, unemployment, and workplace-document details',
    note: 'Employment issues depend on state, employer, dates, wage amount, documents, agency deadlines, and whether the issue is wages, unemployment, discrimination, or retaliation.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'issueStage', label: 'Current issue', type: 'select', options: ['Unpaid wages/final paycheck', 'Overtime/minimum wage', 'Unemployment claim/appeal', 'Discrimination agency intake', 'Retaliation/termination concern', 'Workplace document review', 'Not sure'], optional: true },
      { name: 'employerName', label: 'Employer name', type: 'text', optional: true },
      { name: 'employmentDates', label: 'Employment dates or termination date', type: 'text', optional: true },
      { name: 'amountInvolved', label: 'Approximate wages, benefits, or amount involved', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'Agency, appeal, hearing, or response deadline', type: 'date', optional: true }
    ]
  },
  'personal-injury': {
    title: 'Personal injury starting details',
    note: 'A safe injury workflow begins with date, state, type of incident, treatment, insurance, documents, and deadline concerns.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: [
      { name: 'incidentDate', label: 'Incident date', type: 'date', optional: true },
      { name: 'incidentType', label: 'Incident type', type: 'select', options: ['Slip/trip/fall', 'Dog bite', 'Unsafe property', 'Product injury', 'Assault/security issue', 'Other'], optional: true },
      { name: 'injuryStatus', label: 'Injury status', type: 'select', options: ['No injury', 'Treated once', 'Still treating', 'Serious/permanent concern', 'Death occurred', 'Not sure'], optional: true },
      { name: 'treatmentProviders', label: 'Medical providers, bills, or treatment records', type: 'text', optional: true },
      { name: 'insuranceStatus', label: 'Insurance/claim status', type: 'select', options: ['No claim yet', 'Claim opened', 'Claim denied', 'Settlement offer received', 'Lawsuit/court papers', 'Not sure'], optional: true }
    ]
  },
  'probate-estate-administration': {
    title: 'Probate and estate administration details',
    note: 'Probate depends on state, county, will status, estate size, assets, debts, family members, and any court notice.',
    requiredBeforeSpecificHelp: ['state', 'county', 'question'],
    followUps: [
      { name: 'dateOfDeath', label: 'Date of death', type: 'date', optional: true },
      { name: 'willStatus', label: 'Is there a will?', type: 'select', options: ['Yes', 'No', 'Not sure'], optional: true },
      { name: 'estateAssets', label: 'Main assets or property in the estate', type: 'text', optional: true },
      { name: 'familyMembers', label: 'Closest family members/heirs', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'Court date, notice date, or deadline if any', type: 'date', optional: true }
    ]
  },
  'patents': {
    title: 'Patent and invention starting details',
    note: 'Patent matters require careful review of invention details, disclosure dates, USPTO notices, drawings, and patent attorney review needs.',
    requiredBeforeSpecificHelp: ['question'],
    followUps: [
      { name: 'inventionTitle', label: 'Invention title or short description', type: 'text', optional: true },
      { name: 'inventors', label: 'Inventor names', type: 'text', optional: true },
      { name: 'publicDisclosureDate', label: 'First public disclosure, sale, or use date if any', type: 'date', optional: true },
      { name: 'prototypeStatus', label: 'Prototype/status', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'USPTO or response deadline if any', type: 'date', optional: true }
    ]
  },
  'copyrights': {
    title: 'Copyright starting details',
    note: 'Copyright paths depend on work type, author/owner, publication, registration status, DMCA/takedown notices, infringement concerns, and evidence.',
    requiredBeforeSpecificHelp: ['question'],
    followUps: [
      { name: 'workTitle', label: 'Work title or description', type: 'text', optional: true },
      { name: 'workType', label: 'Type of work', type: 'select', options: ['Photo', 'Writing/book/article', 'Music/sound recording', 'Video/film', 'Software', 'Artwork/design', 'Other'], optional: true },
      { name: 'authorName', label: 'Author/creator', type: 'text', optional: true },
      { name: 'ownerName', label: 'Owner/claimant', type: 'text', optional: true },
      { name: 'deadlineDate', label: 'DMCA, takedown, demand, or court deadline if any', type: 'date', optional: true }
    ]
  }

};

function schemaForPractice(slug){
  return SCHEMAS[slug] || {
    title: 'Helpful starting details',
    note: 'These optional questions help Smarter Justice organize your file and choose the right review path.',
    requiredBeforeSpecificHelp: ['state', 'question'],
    followUps: DEFAULT_FOLLOW_UPS
  };
}

module.exports = { DEFAULT_DOCUMENT_TYPES, REVIEW_PREFERENCES, SCHEMAS, schemaForPractice };
