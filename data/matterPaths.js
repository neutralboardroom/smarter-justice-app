const UNIVERSAL_TRIAGE_QUESTIONS = [
  { name: 'issueStage', label: 'What stage are you in?', type: 'select', options: ['Just starting', 'Received a notice or letter', 'Served with papers', 'Deadline or hearing scheduled', 'Already filed or applied', 'Need to respond or appeal', 'Need forms or documents prepared', 'Not sure'] },
  { name: 'noticeDate', label: 'Date printed on the notice, letter, lawsuit, denial, or agency document', type: 'date', optional: true },
  { name: 'dateReceived', label: 'Date you received it', type: 'date', optional: true },
  { name: 'deadlineDate', label: 'Deadline, hearing date, response date, due date, appointment, or appeal date', type: 'date', optional: true },
  { name: 'courtOrAgency', label: 'Court, agency, company, office, insurer, employer, school, landlord, or other party involved', type: 'text', optional: true },
  { name: 'desiredHelp', label: 'What do you want help with first?', type: 'select', options: ['Understand where to start', 'Organize documents for review', 'Prepare a worksheet or starter file', 'Prepare completed forms after review if available', 'Respond to a notice or deadline', 'Request attorney/professional review if needed'] }
];

function q(name, label, type='text', options=[], optional=true){ return { name, label, type, options, optional }; }

const MATTER_PATHS = {
  'divorce-family-law': {
    name: 'Divorce & Family Law',
    reason: 'Family matters depend on the state, county, court status, service status, children, support, safety concerns, and whether the case is agreed or contested.',
    stages: [
      { id:'thinking-about-divorce', name:'Thinking about divorce or separation', terms:['thinking','not filed','separation','separate','start divorce'], required:['state','county','marriageDate','residency','childrenInvolved','agreementStatus'] },
      { id:'ready-to-file', name:'Ready to file', terms:['file divorce','uncontested','petition','start case','ready to file'], required:['state','county','marriageDate','separationDate','residency','childrenInvolved','propertyDebt','agreementStatus'] },
      { id:'served-or-responding', name:'Papers received or response needed', terms:['served','summons','complaint','response','answer','papers received'], required:['state','county','courtOrAgency','dateReceived','deadlineDate','servedPapers','childrenInvolved'] },
      { id:'children-support-safety', name:'Children, support, custody, or safety issue', terms:['custody','visitation','child support','protection order','domestic violence','restraining','order of protection'], required:['state','county','childrenInvolved','courtOrAgency','safetyConcern','deadlineDate'] },
      { id:'financial-disclosures-agreement', name:'Financial disclosures or settlement agreement', terms:['financial disclosure','asset','debt','agreement','settlement','judgment','final decree'], required:['state','county','income','propertyDebt','retirementAccounts','agreementStatus'] }
    ],
    questions: [q('marriageDate','Date of marriage','date'), q('separationDate','Date of separation if separated','date'), q('residency','How long have you or your spouse lived in this state/county?'), q('childrenInvolved','Are children involved?','select',['Yes','No','Pregnancy involved','Not sure']), q('propertyDebt','Is there property, debt, real estate, retirement, or support to divide?','select',['Yes','No','Not sure']), q('agreementStatus','Is the other person expected to agree?','select',['Yes','No','Partly','Not sure']), q('servedPapers','Have you been served with papers?','select',['Yes','No','Not sure']), q('safetyConcern','Is there a safety/protection-order concern?','select',['Yes','No','Prefer to explain privately'])]
  },
  'taxes': {
    name: 'Taxes',
    reason: 'Tax preparation and tax resolution must be separated because returns, notices, debt, audits, liens, levies, offer in compromise, installment agreements, and appeals require different facts and review lanes.',
    stages: [
      { id:'tax-preparation', name:'Tax preparation organizer', terms:['prepare','file taxes','tax return','1040','w-2','1099','refund','deduction'], required:['taxYear','filingStatus','state','incomeForms','dependents','priorYearFiled'] },
      { id:'tax-notice-review', name:'IRS/state/NYC notice review', terms:['notice','cp','lt11','letter','irs','state tax','nyc tax','deficiency','balance due'], required:['courtOrAgency','noticeNumber','taxYears','amountInvolved','dateReceived','deadlineDate'] },
      { id:'tax-resolution-oic', name:'Tax debt, offer in compromise, or payment plan', terms:['offer in compromise','oic','installment','payment plan','tax debt','lien','levy','garnish','collection','currently not collectible'], required:['taxYears','amountInvolved','noticeNumber','deadlineDate','monthlyIncome','monthlyExpenses','assets','filedAllReturns'] },
      { id:'audit-appeal-tax-court', name:'Audit, appeal, or Tax Court risk', terms:['audit','exam','appeal','tax court','petition','90 day','statutory notice'], required:['courtOrAgency','noticeNumber','taxYears','deadlineDate','recordsAvailable','representativeNeeded'] },
      { id:'payroll-business-tax', name:'Business, payroll, sales, or trust-fund tax issue', terms:['payroll','trust fund','sales tax','business tax','withholding','941','nys sales'], required:['businessName','taxYears','amountInvolved','courtOrAgency','deadlineDate','businessStatus'] }
    ],
    questions: [q('taxYear','Tax year or years involved'), q('filingStatus','Filing status','select',['Single','Married filing jointly','Married filing separately','Head of household','Qualifying surviving spouse','Not sure']), q('incomeForms','Documents received','select',['W-2','1099','Self-employment income','Mixed/other','Not sure']), q('dependents','Dependents or children to claim?','select',['Yes','No','Not sure']), q('priorYearFiled','Have all required prior returns been filed?','select',['Yes','No','Not sure']), q('noticeNumber','Notice or letter number if shown'), q('taxYears','Tax years involved'), q('filedAllReturns','Are all required returns filed?','select',['Yes','No','Not sure']), q('monthlyIncome','Approximate monthly household/business income'), q('monthlyExpenses','Approximate monthly expenses'), q('assets','Major assets such as bank accounts, vehicle, home, business, retirement'), q('recordsAvailable','Do you have records supporting your position?','select',['Yes','No','Some','Not sure']), q('representativeNeeded','Do you want CPA/EA/accountant/tax attorney review?','select',['Yes','Maybe','No, not yet'])]
  },
  'bankruptcy-debt': {
    name: 'Bankruptcy & Debt',
    reason: 'Debt relief depends on lawsuit status, garnishment, assets, income, household size, debt type, foreclosure/repossession risk, and bankruptcy eligibility concerns.',
    stages: [
      { id:'debt-collection-pre-suit', name:'Collection letters or calls before lawsuit', terms:['collector','collection letter','debt collector','calls','demand letter'], required:['state','amountInvolved','creditorName','debtType','dateReceived'] },
      { id:'debt-lawsuit-answer', name:'Debt lawsuit or answer deadline', terms:['served','summons','complaint','credit card lawsuit','answer','court date'], required:['state','county','courtOrAgency','dateReceived','deadlineDate','amountInvolved','creditorName'] },
      { id:'judgment-garnishment', name:'Judgment, garnishment, or bank restraint', terms:['judgment','garnishment','levy','bank restraint','wage','frozen bank'], required:['state','courtOrAgency','amountInvolved','deadlineDate','employerBank','exemptIncome'] },
      { id:'bankruptcy-screening', name:'Bankruptcy screening or debt schedule organizer', terms:['bankruptcy','chapter 7','chapter 13','means test','discharge'], required:['state','householdSize','monthlyIncome','debts','assets','lawsuits','priorBankruptcy'] }
    ],
    questions: [q('creditorName','Creditor, collector, or law firm name'), q('debtType','Type of debt','select',['Credit card','Medical debt','Personal loan','Auto loan','Student loan','Tax debt','Business debt','Other']), q('householdSize','Household size'), q('monthlyIncome','Monthly income'), q('debts','List main debts or upload statements'), q('assets','Major assets: car, home, bank accounts, business, retirement'), q('lawsuits','Any lawsuit, judgment, garnishment, repossession, or foreclosure?'), q('priorBankruptcy','Prior bankruptcy?','select',['Yes','No','Not sure'])]
  },
  'small-claims-consumer-debt': {
    name: 'Small Claims & Consumer Debt',
    reason: 'Small claims and consumer debt paths depend on whether the user is suing, being sued, responding to collection papers, negotiating settlement, or facing a judgment.',
    stages: [
      { id:'small-claim-start', name:'Want to start a small claim or demand letter', terms:['small claim','demand letter','sue','owed money','property damage'], required:['state','county','amountInvolved','opposingParty','evidenceAvailable'] },
      { id:'consumer-debt-lawsuit', name:'Debt collection lawsuit response', terms:['credit card lawsuit','debt lawsuit','summons','complaint','answer'], required:['state','county','courtOrAgency','dateReceived','deadlineDate','amountInvolved','creditorName'] },
      { id:'settlement-or-judgment', name:'Settlement, judgment, or collection notice', terms:['settlement','judgment','garnishment','payment agreement','collection notice'], required:['state','courtOrAgency','amountInvolved','deadlineDate','paymentOffer'] }
    ],
    questions: [q('opposingParty','Person, company, collector, or law firm on the other side'), q('creditorName','Creditor/collector name'), q('amountInvolved','Amount claimed, owed, or disputed'), q('evidenceAvailable','What evidence do you have?','select',['Contract/receipt','Photos','Messages/emails','Court papers','Statements','Not sure']), q('paymentOffer','Any settlement or payment offer?')]
  },
  'landlord-tenant-housing': {
    name: 'Landlord/Tenant & Housing',
    reason: 'Housing matters depend on tenant/landlord role, city/county, notice type, rent amount, repairs, lease status, court date, and local housing rules.',
    stages: [
      { id:'eviction-notice', name:'Eviction notice or court papers', terms:['eviction','notice to quit','pay or quit','holdover','nonpayment','housing court'], required:['state','county','city','housingRole','documentType','dateReceived','deadlineDate','rentAmount'] },
      { id:'repairs-habitability', name:'Repairs, habitability, or services problem', terms:['repair','mold','heat','hot water','habitability','unsafe'], required:['state','county','city','housingRole','propertyAddress','repairProblem','landlordNoticeDate'] },
      { id:'deposit-rent-lease', name:'Security deposit, rent, lease, or move-out issue', terms:['security deposit','lease','rent increase','move out','rent'], required:['state','county','city','housingRole','propertyAddress','amountInvolved'] }
    ],
    questions: [q('housingRole','Your role','select',['Tenant','Landlord/property owner','Roommate','Family member/occupant','Other']), q('propertyAddress','Property address or ZIP'), q('rentAmount','Monthly rent or amount demanded'), q('repairProblem','Repair or condition problem'), q('landlordNoticeDate','Date landlord/property manager was notified','date'), q('leaseStatus','Lease status','select',['Written lease','Month-to-month','No written lease','Sublease/roommate','Not sure'])]
  },
  'business-formation-compliance': {
    name: 'Business Formation & Compliance',
    reason: 'Business formation depends on entity type, state, ownership, registered agent, EIN, annual reports, licenses, tax registrations, and compliance status.',
    stages: [
      { id:'choose-entity', name:'Choosing entity and starting formation', terms:['start business','llc','corporation','entity','formation'], required:['state','businessName','entityType','ownerNames','businessPurpose','registeredAgent'] },
      { id:'ein-tax-registrations', name:'EIN, taxes, and registrations', terms:['ein','ss-4','sales tax','payroll','business tax'], required:['businessName','entityType','state','responsibleParty','businessAddress','einNeeded'] },
      { id:'annual-report-compliance', name:'Annual report, registered agent, or compliance issue', terms:['annual report','registered agent','boi','beneficial ownership','compliance','dissolution'], required:['state','businessName','entityType','courtOrAgency','deadlineDate','formationStatus'] },
      { id:'license-local-filing', name:'License, permit, DBA, or local filing', terms:['license','permit','dba','fictitious','county','city'], required:['state','county','city','businessName','licenseType','courtOrAgency'] }
    ],
    questions: [q('businessName','Business name'), q('entityType','Entity type','select',['LLC','Corporation','S corporation election question','Partnership','Sole proprietor/DBA','Nonprofit','Not sure']), q('ownerNames','Owner/member/shareholder names'), q('businessPurpose','Business activity'), q('registeredAgent','Registered agent name/address'), q('responsibleParty','IRS EIN responsible party'), q('businessAddress','Business address'), q('formationStatus','Current status','select',['Not formed','Filed already','Rejected/deficient filing','Annual report due','Registered agent issue','BOI/compliance issue']), q('licenseType','License, permit, DBA, or local filing type')]
  },
  'nonprofit-formation-compliance': {
    name: 'Nonprofit Formation & Compliance',
    reason: 'Nonprofit work must separate state nonprofit formation, EIN, tax exemption, charity registration, governance, and annual filings.',
    stages: [
      { id:'nonprofit-formation', name:'State nonprofit formation', terms:['nonprofit formation','articles','incorporate nonprofit'], required:['state','organizationName','charitablePurpose','boardMembers','registeredAgent'] },
      { id:'ein-tax-exempt', name:'EIN and tax-exempt starting path', terms:['ein','501c3','1023','1023-ez','tax exempt'], required:['organizationName','state','charitablePurpose','boardMembers','budgetEstimate','activities'] },
      { id:'charity-registration-annual', name:'Charity registration or annual filing', terms:['charity registration','fundraising','990','annual filing','compliance'], required:['state','organizationName','courtOrAgency','deadlineDate','grossReceipts'] }
    ],
    questions: [q('organizationName','Organization name'), q('charitablePurpose','Purpose/mission'), q('boardMembers','Board members/directors'), q('registeredAgent','Registered agent'), q('budgetEstimate','Expected annual budget or revenue'), q('activities','Main programs/activities'), q('grossReceipts','Gross receipts or fundraising amount')]
  },
  'estate-planning': {
    name: 'Estate Planning',
    reason: 'Estate planning depends on state, family situation, assets, children, health-care wishes, powers of attorney, trusts, and beneficiary goals.',
    stages: [
      { id:'simple-will-poa-healthcare', name:'Will, power of attorney, or health-care documents', terms:['will','power of attorney','health care proxy','living will','advance directive'], required:['state','planningGoal','familySituation','beneficiaries','executorChoice','healthCareAgent'] },
      { id:'trust-planning', name:'Trust or asset-transfer planning', terms:['trust','revocable','irrevocable','asset protection','special needs'], required:['state','planningGoal','assetComplexity','realEstate','beneficiaries','trusteeChoice'] },
      { id:'estate-review-update', name:'Review or update existing documents', terms:['update will','review trust','change beneficiary','old will'], required:['state','existingDocuments','planningGoal','changesNeeded'] }
    ],
    questions: [q('planningGoal','Main planning goal','select',['Will','Trust','Power of attorney','Health care proxy/advance directive','Full estate plan','Update existing documents','Not sure']), q('familySituation','Family situation','select',['Single','Married','Children','Minor children','Blended family','Special needs beneficiary','Other']), q('beneficiaries','Main beneficiaries'), q('executorChoice','Executor/personal representative choice'), q('healthCareAgent','Health care agent choice'), q('assetComplexity','Assets','select',['Simple','Home/real estate','Business ownership','Multiple properties','Taxable estate concern','Not sure']), q('trusteeChoice','Trustee choice'), q('existingDocuments','Existing documents?','select',['Yes','No','Not sure']), q('changesNeeded','What needs to change?')]
  },
  'probate-estate-administration': {
    name: 'Probate & Estate Administration',
    reason: 'Probate depends on the state/county, whether there is a will, estate size, assets, debts, family members, and court filing status.',
    stages: [
      { id:'probate-start', name:'Need to start probate or small estate process', terms:['probate','executor','administrator','small estate','letters testamentary'], required:['state','county','dateOfDeath','willStatus','estateAssets','familyMembers'] },
      { id:'probate-notice-court', name:'Court notice or estate administration issue', terms:['surrogate','probate court','citation','notice','estate creditor'], required:['state','county','courtOrAgency','dateReceived','deadlineDate','willStatus'] }
    ],
    questions: [q('dateOfDeath','Date of death','date'), q('willStatus','Is there a will?','select',['Yes','No','Not sure']), q('estateAssets','Main estate assets'), q('familyMembers','Closest family members/heirs'), q('executorNamed','Executor named in will?','select',['Yes','No','Not sure']), q('debtsOfEstate','Known debts or creditor notices')]
  },
  'disability-benefits': {
    name: 'Disability Benefits',
    reason: 'Disability appeals depend on the denial notice, appeal deadline, medical conditions, doctors, treatment, work history, medications, and appeal level.',
    stages: [
      { id:'initial-disability-application', name:'Initial disability application organizer', terms:['apply','ssdi','ssi','disability application'], required:['state','conditions','doctors','medications','workHistory','lastWorkedDate'] },
      { id:'disability-denial-appeal', name:'Denial or appeal deadline', terms:['denied','appeal','reconsideration','hearing','ssa-561','ssa-3441'], required:['noticeDate','deadlineDate','appealLevel','conditions','doctors','medications','workHistory'] },
      { id:'hearing-or-ceased-benefits', name:'Hearing, continuing review, or stopped benefits', terms:['hearing','cessation','continuing disability review','benefits stopped'], required:['deadlineDate','courtOrAgency','conditions','recentTreatment','representativeNeeded'] }
    ],
    questions: [q('conditions','Medical/mental health conditions'), q('doctors','Doctors, hospitals, clinics, therapists, or treatment sources'), q('medications','Medications/treatments'), q('workHistory','Recent work history'), q('lastWorkedDate','Last date worked','date'), q('appealLevel','Appeal level','select',['Initial application','Reconsideration','Hearing','Appeals Council','Federal court','Not sure']), q('recentTreatment','Recent treatment dates'), q('representativeNeeded','Do you want professional review?','select',['Yes','Maybe','No, not yet'])]
  },
  'public-benefits': {
    name: 'Public Benefits',
    reason: 'Public benefits issues depend on benefit type, agency, state/local office, notice, deadline, household, income, and denial/termination/overpayment status.',
    stages: [
      { id:'benefit-application', name:'Applying or renewing benefits', terms:['apply','renew','recertification','snap','medicaid','housing benefit'], required:['state','benefitType','householdSize','income','courtOrAgency'] },
      { id:'benefit-denial-appeal', name:'Denied, reduced, stopped, or overpayment notice', terms:['denied','termination','reduction','overpayment','fair hearing','appeal'], required:['state','benefitType','courtOrAgency','dateReceived','deadlineDate','amountInvolved'] }
    ],
    questions: [q('benefitType','Benefit type','select',['SNAP/food assistance','Medicaid','Housing benefit','Cash assistance','Child care benefit','Unemployment','Other']), q('householdSize','Household size'), q('income','Income or benefit amount'), q('noticeReason','What reason does the notice give?'), q('fairHearing','Fair hearing or appeal requested?','select',['Yes','No','Not sure'])]
  },
  'employment-wage-claims': {
    name: 'Employment & Wage Claims',
    reason: 'Work issues depend on state, employer, wage amount, termination date, agency deadlines, discrimination/retaliation facts, and whether unemployment or wage claim appeals are involved.',
    stages: [
      { id:'unpaid-wages-final-paycheck', name:'Unpaid wages or final paycheck', terms:['unpaid wages','final paycheck','overtime','minimum wage','commissions','tips'], required:['state','employerName','employmentDates','amountInvolved','payRecords','deadlineDate'] },
      { id:'unemployment-appeal', name:'Unemployment claim or appeal', terms:['unemployment','ui','denied benefits','appeal hearing'], required:['state','courtOrAgency','dateReceived','deadlineDate','employmentDates','reasonGiven'] },
      { id:'discrimination-retaliation', name:'Discrimination, retaliation, or workplace complaint', terms:['discrimination','retaliation','harassment','eeoc','human rights','fired'], required:['state','employerName','eventDates','protectedReason','deadlineDate','documentsAvailable'] }
    ],
    questions: [q('employerName','Employer name'), q('employmentDates','Start/end dates or current employment status'), q('amountInvolved','Amount owed or disputed'), q('payRecords','Pay stubs, time records, emails, or texts available?','select',['Yes','No','Some','Not sure']), q('reasonGiven','Reason given by employer/agency'), q('eventDates','Key event dates'), q('protectedReason','Reason/category involved if discrimination is alleged'), q('documentsAvailable','Documents available?','select',['Yes','No','Some','Not sure'])]
  },
  'vehicle-accidents': {
    name: 'Vehicle Accidents',
    reason: 'Vehicle accident support depends on accident date, state, role, injuries, police report, insurance claim status, medical bills, lost wages, and settlement/deadline documents.',
    stages: [
      { id:'accident-new-claim', name:'New accident or insurance claim organizer', terms:['accident','crash','police report','insurance claim'], required:['state','accidentDate','roleInAccident','injuryStatus','policeReport','insuranceStatus'] },
      { id:'injury-treatment-bills', name:'Injuries, treatment, bills, or lost wages', terms:['injury','medical bills','treatment','lost wages','therapy'], required:['state','accidentDate','injuryStatus','medicalBills','treatmentProviders','lostWages'] },
      { id:'settlement-denial-lawsuit', name:'Settlement offer, denial, lawsuit, or deadline', terms:['settlement offer','denied claim','lawsuit','deadline','demand letter'], required:['state','accidentDate','insuranceStatus','amountInvolved','deadlineDate','documentsAvailable'] }
    ],
    questions: [q('accidentDate','Accident date','date'), q('roleInAccident','Your role','select',['Driver','Passenger','Pedestrian','Bicyclist','Motorcyclist','Rideshare passenger/driver','Other']), q('injuryStatus','Injury status','select',['No injury','Minor treatment','Ongoing treatment','Serious injury','Death occurred','Not sure']), q('policeReport','Police report status','select',['Have report','Requested','No report','Not sure']), q('insuranceStatus','Insurance status','select',['No claim yet','Claim opened','Claim denied','Settlement offer','Lawsuit/court papers','Not sure']), q('medicalBills','Medical bills/treatment records available?','select',['Yes','No','Some','Not sure']), q('treatmentProviders','Doctors/hospitals/clinics'), q('lostWages','Lost wages or missed work?','select',['Yes','No','Not sure'])]
  },
  'personal-injury': {
    name: 'Personal Injury',
    reason: 'Injury matters depend on accident type, date, state, injury, treatment, insurance, photos, witnesses, bills, lost wages, and deadline risk.',
    stages: [
      { id:'injury-event-organizer', name:'Injury event organizer', terms:['injury','fall','slip','trip','dog bite','unsafe','accident'], required:['state','incidentDate','incidentType','injuryStatus','location','treatmentProviders'] },
      { id:'claim-insurance-settlement', name:'Insurance claim, demand, settlement, or denial', terms:['insurance','settlement','denied','adjuster','demand'], required:['state','incidentDate','insuranceCompany','claimNumber','amountInvolved','deadlineDate'] },
      { id:'lawsuit-deadline', name:'Lawsuit papers or deadline concern', terms:['lawsuit','summons','complaint','statute','deadline'], required:['state','county','courtOrAgency','dateReceived','deadlineDate','incidentDate'] }
    ],
    questions: [q('incidentDate','Incident date','date'), q('incidentType','Incident type','select',['Slip/trip/fall','Dog bite','Unsafe property','Product injury','Assault/security issue','Other']), q('location','Where did it happen?'), q('injuryStatus','Injury status','select',['Treated once','Still treating','Serious/permanent concern','Death occurred','Not sure']), q('treatmentProviders','Medical providers'), q('insuranceCompany','Insurance company'), q('claimNumber','Claim number'), q('documentsAvailable','Photos, reports, bills, or witnesses?')]
  },
  'medical-malpractice': {
    name: 'Medical Malpractice',
    reason: 'Medical malpractice is state-specific and deadline-sensitive and usually requires attorney review, medical records, provider timeline, injury details, and expert-review awareness.',
    stages: [
      { id:'records-timeline', name:'Medical records and timeline organizer', terms:['records','medical records','timeline','doctor','hospital'], required:['state','incidentDate','providerName','facilityName','injuryDescription','recordsRequested'] },
      { id:'malpractice-review', name:'Possible malpractice review', terms:['malpractice','misdiagnosis','surgery mistake','medical negligence','birth injury','wrongful death'], required:['state','incidentDate','providerName','injuryDescription','treatmentAfterward','recordsAvailable','deadlineDate'] },
      { id:'presuit-notice-deadline', name:'Pre-suit notice, complaint, or deadline concern', terms:['deadline','presuit','certificate','expert','lawsuit','complaint'], required:['state','county','courtOrAgency','deadlineDate','incidentDate','providerName'] }
    ],
    questions: [q('incidentDate','Date of treatment, injury, or discovery','date'), q('providerName','Provider name'), q('facilityName','Hospital/clinic/facility'), q('injuryDescription','What harm or change happened?'), q('treatmentAfterward','Treatment after the incident'), q('recordsRequested','Have records been requested?','select',['Yes','No','Some','Not sure']), q('recordsAvailable','Do you have records/bills?','select',['Yes','No','Some','Not sure']), q('expertReviewNeeded','Expert review may be needed. Do you understand?','select',['Yes','Explain later'])]
  },
  'trademarks': {
    name: 'Trademarks',
    reason: 'Trademark paths depend on owner, mark type, goods/services, use in commerce, specimen, USPTO status, Office Action deadlines, and whether attorney review is needed.',
    stages: [
      { id:'trademark-new-application', name:'Trademark starter file', terms:['trademark','brand','logo','slogan','application'], required:['markText','ownerName','ownerType','goodsServices','currentUse','specimenAvailable'] },
      { id:'trademark-office-action', name:'USPTO Office Action or deadline', terms:['office action','uspto refusal','deadline','response'], required:['markText','serialNumber','deadlineDate','officeActionReason','goodsServices'] },
      { id:'trademark-dispute', name:'Trademark dispute, infringement, or opposition', terms:['infringement','opposition','cease and desist','tm dispute'], required:['markText','opposingParty','dateReceived','deadlineDate','useEvidence'] }
    ],
    questions: [q('markText','Mark/name/logo/slogan'), q('ownerName','Owner name'), q('ownerType','Owner type','select',['Individual','LLC/corporation','Nonprofit','Not formed yet','Not sure']), q('goodsServices','Goods/services'), q('currentUse','Already used in business?','select',['Yes','No','Planned','Not sure']), q('specimenAvailable','Specimen/example of use available?','select',['Yes','No','Not sure']), q('serialNumber','USPTO serial number if any'), q('officeActionReason','Reason/refusal shown'), q('useEvidence','Evidence of use or dispute documents')]
  },
  'patents': {
    name: 'Patents',
    reason: 'Patent matters depend on invention details, public disclosure dates, provisional/nonprovisional status, USPTO notices, drawings, prior art, and patent attorney review.',
    stages: [
      { id:'patent-invention-starter', name:'Invention disclosure starter file', terms:['patent','invention','provisional','prototype'], required:['inventionTitle','inventors','publicDisclosureDate','prototypeStatus','priorArtKnown'] },
      { id:'patent-office-action', name:'USPTO patent notice or Office Action', terms:['office action','uspto','rejection','patent application'], required:['applicationNumber','deadlineDate','inventors','officeActionReason'] }
    ],
    questions: [q('inventionTitle','Invention title'), q('inventors','Inventor names'), q('publicDisclosureDate','First public disclosure/sale/use date','date'), q('prototypeStatus','Prototype/status'), q('priorArtKnown','Known similar products/patents'), q('applicationNumber','Application number if any'), q('officeActionReason','USPTO issue/rejection if any')]
  },
  'copyrights': {
    name: 'Copyrights',
    reason: 'Copyright support depends on work type, authorship, publication, registration status, infringement/DMCA notices, and evidence ownership.',
    stages: [
      { id:'copyright-registration-starter', name:'Copyright registration starter file', terms:['copyright','register','work','photo','music','book','software'], required:['workTitle','workType','authorName','ownerName','publicationStatus','creationDate'] },
      { id:'copyright-dmca-dispute', name:'DMCA, takedown, infringement, or demand letter', terms:['dmca','takedown','infringement','cease and desist','copied'], required:['workTitle','opposingParty','dateReceived','deadlineDate','evidenceAvailable'] }
    ],
    questions: [q('workTitle','Work title'), q('workType','Type of work','select',['Photo','Writing/book/article','Music/sound recording','Video/film','Software','Artwork/design','Other']), q('authorName','Author/creator'), q('ownerName','Owner/claimant'), q('publicationStatus','Published?','select',['Published','Unpublished','Not sure']), q('creationDate','Creation date','date'), q('evidenceAvailable','Ownership/use evidence available?')]
  }
};

function textIncludesAny(text, terms){
  const t = String(text || '').toLowerCase();
  return (terms || []).filter(term => t.includes(String(term).toLowerCase()));
}
function pickStage(path, context){
  if (!path) return null;
  const text = [context.question, context.subcategory, context.documentType, context.smartText, context.issueStage, context.desiredHelp].filter(Boolean).join(' ').toLowerCase();
  let best = path.stages[0]; let bestScore = -1;
  for (const stage of path.stages || []){
    let score = 0;
    for (const term of stage.terms || []) if (text.includes(term.toLowerCase())) score += 3;
    if (context.deadlineDate && /deadline|notice|responding|appeal|lawsuit|court|hearing|denial|office|served/.test(stage.id + ' ' + stage.name)) score += 2;
    if (context.documentType && /notice|papers|document|review|office|lawsuit|denial/i.test(stage.name)) score += 1;
    if (score > bestScore){ best = stage; bestScore = score; }
  }
  return { ...best, matchedScore: Math.max(0, bestScore) };
}
function labelForField(name){
  const labels = {
    state:'State', county:'County', city:'City', courtOrAgency:'Court, agency, company, office, or other party', dateReceived:'Date received', deadlineDate:'Deadline or date shown', noticeDate:'Notice date', amountInvolved:'Amount involved', fullName:'Name', email:'Email', phone:'Phone'
  };
  return labels[name] || String(name || '').replace(/([A-Z])/g,' $1').replace(/^./, c => c.toUpperCase());
}
function present(value){ return String(value || '').trim().length > 0; }
function contextFacts(context){
  return { ...(context.smartAnswers || {}), state:context.state || '', county:context.county || '', city:context.city || '', documentType:context.documentType || '', dateReceived:context.dateReceived || context.smartAnswers?.dateReceived || '', deadlineDate:context.deadlineDate || context.smartAnswers?.deadlineDate || '', amountInvolved:context.amountInvolved || context.smartAnswers?.amountInvolved || '', question:context.question || '', fullName:context.fullName || '', email:context.email || '', phone:context.phone || '', courtOrAgency:context.courtOrAgency || context.smartAnswers?.courtOrAgency || context.agencyOrCourt || '' };
}
function missingForStage(stage, context){
  const facts = contextFacts(context);
  return (stage?.required || []).filter(name => !present(facts[name])).map(name => ({ field:name, label:labelForField(name) }));
}
function timelineFor(path, stage, context){
  const stages = path?.stages || [];
  const currentIndex = Math.max(0, stages.findIndex(s => s.id === stage?.id));
  return stages.map((s, index) => ({
    id:s.id,
    name:s.name,
    status:index < currentIndex ? 'earlier step' : (index === currentIndex ? 'current starting point' : 'possible later step'),
    isCurrent:index === currentIndex
  }));
}
function scoreFromMissing(stage, missing){
  const total = Math.max(1, (stage?.required || []).length);
  const complete = Math.max(0, total - (missing || []).length);
  return Math.round((complete / total) * 100);
}
function buildMatterPathAnalysis(context, practice){
  const path = MATTER_PATHS[practice?.slug] || null;
  const fallback = {
    pathId: practice?.slug || 'other', pathName: practice?.name || 'General starting path', stageId:'general-start', stageName:'General starting file',
    userNextPathTitle:'Start with an organized file',
    userNextPathSummary:'Smarter Justice can organize your question, documents, state/local details, possible deadlines, and review options before any forms are chosen.',
    whyThisPath:['The matter needs basic facts, documents, and jurisdiction details before a specific form path should be chosen.'],
    dynamicMissingInformation: [], timeline:[{id:'general-start',name:'Start free',status:'current starting point',isCurrent:true},{id:'human-review',name:'Human Review Specialist check',status:'possible later step',isCurrent:false},{id:'professional-review',name:'Professional review if needed',status:'possible later step',isCurrent:false}],
    formReadinessScore: 25, stageQuestions: UNIVERSAL_TRIAGE_QUESTIONS, stageRiskSignals: []
  };
  if (!path) return fallback;
  const stage = pickStage(path, context);
  const missing = missingForStage(stage, context);
  const hasDeadline = present(context.deadlineDate || context.smartAnswers?.deadlineDate);
  const hasNotice = /notice|letter|summons|complaint|denial|office action|tax|court|agency|insurance/i.test([context.question, context.documentType, context.subcategory].join(' '));
  const riskSignals = [];
  if (hasDeadline) riskSignals.push('A deadline or date is listed, so the file should be treated carefully.');
  if (hasNotice) riskSignals.push('A notice, letter, lawsuit, denial, or agency/court document may need review.');
  if (/medical-malpractice|personal-injury|vehicle-accidents|divorce-family-law|bankruptcy-debt/.test(practice.slug)) riskSignals.push('State-specific timing and review rules may matter.');
  if (practice.slug === 'taxes') riskSignals.push('Tax preparation and tax resolution should be kept separate, and CPA/enrolled agent/accountant/tax attorney review may be needed.');
  const stageQuestions = [...UNIVERSAL_TRIAGE_QUESTIONS, ...(path.questions || [])];
  return {
    pathId: practice.slug,
    pathName: path.name,
    stageId: stage.id,
    stageName: stage.name,
    stageDescription: path.reason,
    userNextPathTitle: stage.name,
    userNextPathSummary: `Based on the starting details, this should begin as: ${stage.name}. Smarter Justice should collect the missing details, organize documents, and route for Human Review Specialist review before promising completed forms.`,
    whyThisPath: [path.reason, `The words, topic, document type, selected practice area, and saved answers most closely matched “${stage.name}.”`, missing.length ? `${missing.length} important detail(s) are still missing before a completed form path should be considered.` : 'The starter facts are more complete, but review is still required before delivery.'],
    dynamicMissingInformation: missing,
    timeline: timelineFor(path, stage, context),
    formReadinessScore: scoreFromMissing(stage, missing),
    stageQuestions,
    stageRiskSignals: riskSignals
  };
}
function schemaForMatterPath(slug){
  const path = MATTER_PATHS[slug];
  if (!path) return null;
  return { title:`${path.name} path questions`, note:path.reason, universal:UNIVERSAL_TRIAGE_QUESTIONS, stages:path.stages, questions:path.questions };
}
module.exports = { MATTER_PATHS, UNIVERSAL_TRIAGE_QUESTIONS, buildMatterPathAnalysis, schemaForMatterPath, labelForField };
