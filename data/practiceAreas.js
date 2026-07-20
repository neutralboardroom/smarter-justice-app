const PRACTICE_AREAS = [
  {
    "slug": "immigration",
    "name": "Immigration",
    "summary": "Immigration forms, notices, status questions, family, work, citizenship, court and urgent document organization.",
    "requiresJurisdiction": false,
    "review": "attorney",
    "subcategories": [
      "Green card renewal or replacement",
      "Family immigration",
      "Work authorization",
      "Citizenship and naturalization",
      "Visas and consular processing",
      "Removal/court notices",
      "Asylum and humanitarian help",
      "RFE/NOID/denial notices",
      "Travel documents",
      "General immigration document review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "agency",
      "formOrNotice",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "taxes",
    "name": "Taxes",
    "summary": "Tax preparation and tax resolution kept close together but shown separately.",
    "requiresJurisdiction": true,
    "review": "tax_professional_or_tax_attorney",
    "subcategories": [
      "Tax preparation",
      "Federal income tax return questions",
      "State tax return questions",
      "New York State tax issues",
      "New York City tax issues",
      "Tax notices",
      "IRS audit or examination",
      "State tax audit",
      "Offer in compromise",
      "Installment agreement",
      "Currently not collectible",
      "Penalty abatement",
      "Tax liens",
      "Tax levies",
      "Wage garnishment",
      "Unfiled returns",
      "Payroll tax problems",
      "Business tax compliance",
      "Tax court or tax litigation concern",
      "Innocent spouse relief",
      "Tax transcript request",
      "Tax identity theft"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "taxYears",
      "agency",
      "amountClaimedDue",
      "noticeNumber",
      "taxPrepOrResolution",
      "businessOrIndividual",
      "bestContactTime"
    ]
  },
  {
    "slug": "bankruptcy-debt",
    "name": "Bankruptcy & Debt",
    "summary": "Chapter 7, Chapter 13, business bankruptcy starting files, creditor notices, debt settlement and collection organization.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Chapter 7 bankruptcy",
      "Chapter 13 bankruptcy",
      "Chapter 11 or small business bankruptcy",
      "Creditor lawsuit",
      "Debt settlement",
      "Debt collection calls or letters",
      "Garnishment or bank restraint",
      "Judgment or collection notice",
      "Proof of claim",
      "Credit repair",
      "Bankruptcy discharge questions",
      "Emergency bankruptcy concerns"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "disability-benefits",
    "name": "Disability Benefits",
    "summary": "Social Security Disability, SSI, appeals, medical evidence organization and benefit notices.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "SSDI application",
      "SSI application",
      "Disability denial appeal",
      "Reconsideration",
      "Hearing preparation",
      "Continuing disability review",
      "Overpayment notice",
      "Medical records checklist",
      "Work history summary",
      "Representative review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "business-formation-compliance",
    "name": "Business Formation & Compliance",
    "summary": "LLCs, corporations, EINs, annual reports, registered agent issues, beneficial ownership/compliance and state/local filings.",
    "requiresJurisdiction": true,
    "review": "professional_or_attorney",
    "subcategories": [
      "LLC formation",
      "Corporation formation",
      "EIN/SS-4",
      "Operating agreement starting file",
      "Bylaws starting file",
      "Annual report",
      "Registered agent issue",
      "Foreign qualification",
      "Dissolution or withdrawal",
      "Business licenses and permits",
      "Beneficial ownership/compliance",
      "State/local business filing",
      "DBA/fictitious name",
      "Sales tax registration",
      "Corporate records cleanup"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "nonprofit-formation-compliance",
    "name": "Nonprofit Formation & Compliance",
    "summary": "Nonprofit corporation, EIN, 501(c)(3) starting path, charity registration, annual filings and compliance calendars.",
    "requiresJurisdiction": true,
    "review": "professional_or_attorney",
    "subcategories": [
      "Nonprofit corporation formation",
      "EIN for nonprofit",
      "501(c)(3) starting path",
      "Form 1023",
      "Form 1023-EZ",
      "Form 990/990-EZ/990-N",
      "Charity registration",
      "Fundraising compliance",
      "Board governance documents",
      "Annual state filings",
      "Fiscal sponsorship questions"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "business-law",
    "name": "Business Law",
    "summary": "Contracts, business disputes, customer/vendor issues, collections, leases, employment-facing business issues and compliance problems.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Contract review",
      "Customer dispute",
      "Vendor dispute",
      "Business debt collection",
      "Partnership dispute",
      "Shareholder/member dispute",
      "Commercial lease issue",
      "Terms and conditions",
      "Privacy policy/business website terms",
      "Employment issue for business owner",
      "Noncompete or confidentiality agreement",
      "Business sale or purchase",
      "Franchise issue",
      "Commercial litigation starting file",
      "Admiralty and maritime",
      "Advertising",
      "Agriculture",
      "Antitrust and trade law",
      "Aviation",
      "Banking",
      "Communications and media",
      "Employee benefits",
      "Energy and utilities",
      "Entertainment",
      "Equipment finance and leasing",
      "Financial markets and services",
      "Franchising",
      "Gaming",
      "Government contracts",
      "Health care business",
      "Insurance business",
      "Internet business",
      "Licensing",
      "Life sciences and biotechnology",
      "Mergers and acquisitions",
      "Oil and gas",
      "Partnership",
      "Project finance",
      "Public finance and tax-exempt finance",
      "Securities offerings",
      "Telecommunications",
      "Transportation",
      "Venture capital"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "real-estate",
    "name": "Real Estate",
    "summary": "Purchase/sale, deeds, title, HOA/condo, boundary, closing, property disputes and real-estate notices.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Buying or selling property",
      "Deed question",
      "Title issue",
      "Closing document review",
      "HOA/condo dispute",
      "Boundary or easement issue",
      "Property damage dispute",
      "Real estate contract",
      "Seller disclosure issue",
      "Mortgage/refinance document review",
      "Zoning or land use",
      "Construction defect",
      "Quiet title concern",
      "Commercial real estate",
      "Construction and development",
      "Land use and zoning",
      "Residential real estate",
      "Quiet title",
      "Easement/boundary"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "trademarks",
    "name": "Trademarks",
    "summary": "Trademark search, application starting file, Office Action organization, renewals and brand protection.",
    "requiresJurisdiction": false,
    "review": "ip_attorney",
    "subcategories": [
      "Trademark search starting file",
      "New trademark application",
      "Office Action",
      "Statement of use",
      "Extension request",
      "Trademark renewal",
      "Change owner/address",
      "Opposition or cancellation concern",
      "Trademark infringement letter",
      "Brand clearance checklist"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "agency",
      "formOrNotice",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "patents",
    "name": "Patents",
    "summary": "Patent idea organization, provisional/nonprovisional starting file, USPTO notices and patent attorney review routing.",
    "requiresJurisdiction": false,
    "review": "patent_attorney",
    "subcategories": [
      "Patent idea organization",
      "Provisional patent starting file",
      "Nonprovisional patent starting file",
      "USPTO notice",
      "Office Action",
      "Patent search notes",
      "Inventor assignment",
      "Maintenance fee question",
      "Design patent",
      "Patent attorney review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "agency",
      "formOrNotice",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "copyrights",
    "name": "Copyrights",
    "summary": "Copyright registration starting files, takedown notices, infringement letters and Copyright Office source routing.",
    "requiresJurisdiction": false,
    "review": "ip_attorney",
    "subcategories": [
      "Copyright registration",
      "Literary work",
      "Visual art",
      "Music or sound recording",
      "Software/code",
      "DMCA takedown",
      "Infringement letter",
      "License agreement review",
      "Copyright assignment",
      "Copyright Office notice"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "agency",
      "formOrNotice",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "estate-planning",
    "name": "Estate Planning",
    "summary": "Wills, trusts, health care proxies, living wills, advance directives, powers of attorney and related planning documents.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Will",
      "Revocable living trust",
      "Irrevocable trust",
      "Special needs trust",
      "Health care proxy",
      "Living will",
      "Advance directive",
      "Power of attorney",
      "Guardianship planning",
      "Beneficiary review",
      "Estate tax planning concern",
      "Pet trust",
      "Digital asset planning"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "probate-estate-administration",
    "name": "Probate & Estate Administration",
    "summary": "Probate, administration, small-estate affidavits, executor questions and estate document organization.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Probate starting file",
      "Administration without will",
      "Small estate affidavit",
      "Executor/administrator question",
      "Inventory/accounting",
      "Creditor claim",
      "Beneficiary dispute",
      "Will contest concern",
      "Letters testamentary/administration",
      "Estate closing checklist"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "divorce-family-law",
    "name": "Divorce & Family Law",
    "summary": "Uncontested divorce, custody, visitation, child support, family court petitions and state-specific starting help.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Uncontested divorce",
      "Contested divorce",
      "Separation agreement",
      "Custody",
      "Visitation/parenting time",
      "Child support",
      "Spousal support/alimony",
      "Family court petition",
      "Modification request",
      "Enforcement request",
      "Paternity",
      "Prenuptial/postnuptial agreement",
      "Protection-order related family issue",
      "LGBTQ+ family issue",
      "Marriage and prenuptials",
      "Alimony/spousal support",
      "Child abuse concern",
      "Adoption-adjacent family issue",
      "Custody/visitation"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "domestic-violence-protection-orders",
    "name": "Domestic Violence & Protection Orders",
    "summary": "Protection orders, safety-related notices, family offense petitions, stalking/harassment concerns and urgent review routing.",
    "requiresJurisdiction": true,
    "review": "attorney_or_advocate",
    "subcategories": [
      "Order of protection",
      "Restraining order",
      "Family offense petition",
      "Stalking or harassment",
      "Safety planning documents",
      "Violation of order",
      "Emergency court help",
      "Domestic violence support referral",
      "Documenting incidents"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "landlord-tenant-housing",
    "name": "Landlord/Tenant & Housing",
    "summary": "Eviction notices, repairs, rent, security deposits, housing court documents and tenant/landlord letters.",
    "requiresJurisdiction": true,
    "review": "attorney_or_housing_advocate",
    "subcategories": [
      "Eviction notice",
      "Nonpayment rent case",
      "Holdover/lease termination",
      "Repair issue",
      "Warranty of habitability",
      "Security deposit",
      "Rent increase",
      "Lease review",
      "Roommate issue",
      "Illegal lockout",
      "Housing court papers",
      "Landlord letter",
      "Tenant letter",
      "Subsidized housing issue"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "small-claims-consumer-debt",
    "name": "Small Claims & Consumer Debt",
    "summary": "Small claims, demand letters, credit-card lawsuits, settlement organization and judgment/collection notices.",
    "requiresJurisdiction": true,
    "review": "attorney_or_self_help",
    "subcategories": [
      "Small claims court",
      "Demand letter",
      "Debt collection lawsuit",
      "Credit-card lawsuit",
      "Settlement organization",
      "Judgment notice",
      "Collection notice",
      "Bank account restraint",
      "Wage garnishment",
      "Answer starting file",
      "Evidence checklist"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "consumer-protection-identity-theft",
    "name": "Consumer Protection & Identity Theft",
    "summary": "Scams, credit reporting, identity theft, bad products/services, chargebacks, warranties and consumer complaints.",
    "requiresJurisdiction": true,
    "review": "attorney_or_agency",
    "subcategories": [
      "Identity theft",
      "Credit report dispute",
      "Scam/fraud complaint",
      "Defective product",
      "Warranty dispute",
      "Chargeback/dispute",
      "Unfair business practice",
      "Auto dealer dispute",
      "Home improvement contractor dispute",
      "Consumer agency complaint",
      "Data breach notice",
      "Computer fraud",
      "Credit card fraud",
      "Health insurance consumer issue",
      "Insurance fraud",
      "Lemon law",
      "Life insurance dispute",
      "Medicaid/Medicare consumer issue",
      "Securities and investment fraud",
      "Tax fraud/tax evasion concern",
      "Defective or dangerous product consumer issue"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "name-change-personal-records",
    "name": "Name Change & Personal Records",
    "summary": "Adult/child name change, correcting records, birth certificate issues and identity-document routing.",
    "requiresJurisdiction": true,
    "review": "self_help_or_attorney",
    "subcategories": [
      "Adult name change",
      "Child name change",
      "Birth certificate correction",
      "Marriage/divorce record correction",
      "Gender marker update",
      "Driver license/ID update",
      "Passport name issue",
      "School/medical record correction",
      "Identity document checklist"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "expungement-record-cleanup",
    "name": "Expungement & Record Cleanup",
    "summary": "Expungement, record sealing, certificates of relief and criminal-record cleanup starting help.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Expungement",
      "Record sealing",
      "Certificate of relief",
      "Certificate of good conduct",
      "Pardon/clemency starting file",
      "Arrest record correction",
      "Employment background-check issue",
      "Criminal record review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "criminal-defense-traffic-license",
    "name": "Criminal Defense, Traffic & License",
    "summary": "Traffic tickets, suspended licenses, DUI/DWI notices, criminal court papers and urgent attorney routing.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Traffic ticket",
      "Suspended license",
      "DUI/DWI",
      "Misdemeanor charge",
      "Felony charge",
      "Court date notice",
      "Warrant concern",
      "Probation/parole issue",
      "Driver responsibility or DMV notice",
      "Commercial driver issue",
      "Cannabis law",
      "Drug crime",
      "Federal crime",
      "Juvenile law",
      "Sex crime",
      "Violent crime",
      "White collar crime",
      "Warrants and criminal charges",
      "Speeding and traffic ticket"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "employment-wage-claims",
    "name": "Employment & Wage Claims",
    "summary": "Unpaid wages, final paycheck, unemployment appeals, discrimination agency starting help, retaliation and workplace document review.",
    "requiresJurisdiction": true,
    "review": "attorney_or_agency",
    "subcategories": [
      "Unpaid wages",
      "Final paycheck",
      "Overtime",
      "Minimum wage",
      "Unemployment claim",
      "Unemployment appeal",
      "Discrimination agency starting form",
      "Retaliation concern",
      "Wrongful termination",
      "Severance agreement review",
      "Workplace harassment",
      "Family/medical leave issue",
      "Independent contractor misclassification",
      "Sexual harassment",
      "Employee benefits",
      "Discrimination",
      "Retaliation",
      "Wage and hour claim"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "workers-compensation",
    "name": "Workers’ Compensation",
    "summary": "Work injury notices, claim forms, medical bills, wage loss, denials and workers’ compensation review routing.",
    "requiresJurisdiction": true,
    "review": "attorney_or_comp_professional",
    "subcategories": [
      "New work injury",
      "Claim denial",
      "Medical treatment issue",
      "Lost wages",
      "Employer dispute",
      "Independent medical exam",
      "Settlement document review",
      "Workers’ comp board notice",
      "Return-to-work issue"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "incidentDate",
      "injuryType",
      "medicalTreatment",
      "insuranceCarrier",
      "representedAlready",
      "bestContactTime"
    ]
  },
  {
    "slug": "personal-injury",
    "name": "Personal Injury",
    "summary": "Injury claims, premises liability, slip/fall, dog bites, product injuries, medical bills and settlement support.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Slip/trip/fall",
      "Premises liability",
      "Dog bite",
      "Negligence claim",
      "Wrongful death",
      "Product injury",
      "Insurance claim",
      "Medical bills organization",
      "Demand letter support",
      "Settlement document review",
      "Statute-of-limitations concern",
      "Animal and dog bites",
      "Birth injury",
      "Brain injury",
      "Defective and dangerous products",
      "Libel/slander injury claim",
      "Mesothelioma and asbestos",
      "Motorcycle accident",
      "Nursing home abuse and neglect",
      "Slip and fall accident",
      "Spinal cord injury",
      "Trucking accident"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "incidentDate",
      "injuryType",
      "medicalTreatment",
      "insuranceCarrier",
      "representedAlready",
      "bestContactTime"
    ]
  },
  {
    "slug": "vehicle-accidents",
    "name": "Vehicle Accidents",
    "summary": "Car, pedestrian, bicycle, truck, rideshare accidents, police reports, insurance letters, medical bills and settlement support.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Car accident",
      "Truck accident",
      "Motorcycle accident",
      "Pedestrian accident",
      "Bicycle accident",
      "Rideshare accident",
      "Hit and run",
      "Police report organization",
      "No-fault/PIP",
      "Property damage claim",
      "Insurance adjuster letter",
      "Medical bill summary",
      "Demand letter support"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "incidentDate",
      "injuryType",
      "medicalTreatment",
      "insuranceCarrier",
      "representedAlready",
      "bestContactTime"
    ]
  },
  {
    "slug": "medical-malpractice",
    "name": "Medical Malpractice",
    "summary": "Possible medical negligence, dental malpractice, hospital issues, records checklist and attorney/expert review routing.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Possible medical malpractice",
      "Surgical error",
      "Delayed diagnosis",
      "Misdiagnosis",
      "Birth injury",
      "Medication error",
      "Dental malpractice",
      "Hospital injury",
      "Nursing home neglect",
      "Medical records checklist",
      "Expert review awareness",
      "Deadline concern"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "incidentDate",
      "injuryType",
      "medicalTreatment",
      "insuranceCarrier",
      "representedAlready",
      "bestContactTime"
    ]
  },
  {
    "slug": "veterans-benefits",
    "name": "Veterans Benefits",
    "summary": "VA disability, pension, appeals, supporting forms, medical records and benefits notices.",
    "requiresJurisdiction": false,
    "review": "veterans_benefits_professional_or_attorney",
    "subcategories": [
      "VA disability claim",
      "VA disability increase",
      "Supplemental claim",
      "Higher-level review",
      "Board appeal",
      "VA pension",
      "Aid and attendance",
      "Dependency/indemnity compensation",
      "Medical records release",
      "Military records request",
      "VA overpayment",
      "Military law issue",
      "Discharge upgrade starting file"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "agency",
      "formOrNotice",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "public-benefits",
    "name": "Public Benefits",
    "summary": "SNAP, Medicaid, housing benefits, cash assistance, benefit denials, notices and appeal-starting help.",
    "requiresJurisdiction": true,
    "review": "benefits_advocate_or_attorney",
    "subcategories": [
      "SNAP/food stamps",
      "Medicaid",
      "Cash assistance",
      "Housing benefits",
      "Section 8/public housing",
      "Benefit denial",
      "Benefit reduction/termination",
      "Fair hearing",
      "Overpayment notice",
      "Document checklist",
      "Local agency notice",
      "Medicaid and Medicare",
      "Social Security and retirement",
      "Food assistance"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "foreclosure-mortgage",
    "name": "Foreclosure & Mortgage",
    "summary": "Foreclosure notices, mortgage servicer letters, loss mitigation, loan modification and court papers.",
    "requiresJurisdiction": true,
    "review": "attorney_or_housing_counselor",
    "subcategories": [
      "Foreclosure notice",
      "Mortgage default letter",
      "Loan modification",
      "Loss mitigation package",
      "Short sale/deed in lieu",
      "Surplus funds",
      "Tax lien foreclosure",
      "HOA foreclosure",
      "Mortgage servicing dispute",
      "Court papers"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "healthcare-billing-insurance-appeals",
    "name": "Healthcare Billing & Insurance Appeals",
    "summary": "Medical bills, insurance denials, prior authorization, surprise bills and healthcare appeal organization.",
    "requiresJurisdiction": true,
    "review": "advocate_or_attorney",
    "subcategories": [
      "Medical bill dispute",
      "Insurance denial",
      "Prior authorization denial",
      "Out-of-network/surprise bill",
      "Hospital financial assistance",
      "Medicaid/Medicare billing issue",
      "Appeal letter starting file",
      "EOB review",
      "Collection from medical bill"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "education-special-education",
    "name": "Education & Special Education",
    "summary": "IEP/504, school discipline, tuition/services disputes, student rights and education-document organization.",
    "requiresJurisdiction": true,
    "review": "attorney_or_education_advocate",
    "subcategories": [
      "IEP issue",
      "504 plan issue",
      "Special education evaluation",
      "Due process complaint",
      "School discipline/suspension",
      "Bullying/harassment at school",
      "College/student issue",
      "Student records request",
      "Services denial",
      "Education agency complaint"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "guardianship-conservatorship",
    "name": "Guardianship & Conservatorship",
    "summary": "Adult/child guardianship, conservatorship, incapacity planning and court document organization.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Adult guardianship",
      "Child guardianship",
      "Conservatorship",
      "Emergency guardianship",
      "Accounting/reporting",
      "Incapacity concern",
      "Contest/objection",
      "Supported decision-making",
      "Caregiver authority documents"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "contracts-document-review",
    "name": "Contracts & Document Review",
    "summary": "General document review, demand letters, settlement agreements, releases, waivers and plain-language summaries.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Contract summary",
      "Demand letter review",
      "Settlement agreement",
      "Settlement/waiver document",
      "Lease document",
      "Employment document",
      "Business contract",
      "Consumer contract",
      "Deadline in document",
      "Plain-language document summary"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "civil-rights-police-misconduct",
    "name": "Civil Rights & Police Misconduct",
    "summary": "Civil rights complaints, police misconduct, discrimination, jail/prison issues and agency/court routing.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Police misconduct",
      "Excessive force",
      "False arrest",
      "Civil rights complaint",
      "Jail/prison issue",
      "Public accommodation discrimination",
      "Government misconduct",
      "First Amendment issue",
      "Disability rights",
      "Housing discrimination",
      "Constitutional rights",
      "Native peoples law",
      "Equal protection issue"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "administrative-license-appeals",
    "name": "Administrative & License Appeals",
    "summary": "Agency notices, license discipline, professional licensing, permits and administrative hearings.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Agency notice",
      "Professional license issue",
      "License denial",
      "License discipline",
      "Permit denial",
      "Administrative hearing",
      "Appeal deadline",
      "Board complaint",
      "Government benefits agency issue",
      "Regulatory compliance",
      "Federal regulation",
      "Election/campaign agency notice",
      "Military benefits/admin issue",
      "State, local and municipal law",
      "Professional board complaint"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "appeals",
    "name": "Appeals",
    "summary": "Appeal notices, deadlines, administrative/court appeal organization and transcript/record checklists.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Civil appeal",
      "Family court appeal",
      "Administrative appeal",
      "Small claims appeal",
      "Benefits appeal",
      "Notice of appeal deadline",
      "Record/transcript checklist",
      "Post-judgment motion",
      "Appeal consultation file",
      "Arbitration appeal concern",
      "Class action notice",
      "Litigation appeal",
      "Court appeal"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "elder-law",
    "name": "Elder Law",
    "summary": "Long-term care planning, elder abuse, Medicaid planning, guardianship-adjacent issues and senior-benefits documents.",
    "requiresJurisdiction": true,
    "review": "attorney_or_advocate",
    "subcategories": [
      "Long-term care planning",
      "Elder abuse/neglect",
      "Medicaid planning",
      "Nursing home issue",
      "Power of attorney concern",
      "Advance directive concern",
      "Senior benefits",
      "Financial exploitation",
      "Caregiver agreement"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "insurance-claims",
    "name": "Insurance Claims",
    "summary": "Home, auto, disability, life, health and business insurance claim letters and denials.",
    "requiresJurisdiction": true,
    "review": "attorney_or_claim_professional",
    "subcategories": [
      "Home insurance claim",
      "Auto insurance claim",
      "Disability insurance claim",
      "Life insurance claim",
      "Business insurance claim",
      "Insurance denial",
      "Reservation of rights letter",
      "Proof of loss",
      "Bad faith concern",
      "Settlement offer review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "privacy-internet-technology",
    "name": "Privacy, Internet & Technology",
    "summary": "Online privacy, defamation, takedowns, account issues, data breaches and technology contracts.",
    "requiresJurisdiction": true,
    "review": "attorney_or_tech_professional",
    "subcategories": [
      "Online defamation",
      "Content takedown",
      "Data breach notice",
      "Privacy complaint",
      "Account/platform dispute",
      "Cyber incident organization",
      "Software/SaaS contract",
      "Online harassment",
      "Right of publicity/image use",
      "AI/content rights concern",
      "Internet law",
      "Data privacy and cybersecurity",
      "Computer fraud",
      "Defamation and reputation",
      "Platform/account dispute"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "adoption-child-welfare",
    "name": "Adoption, Juvenile & Child Welfare",
    "summary": "Adoption starting files, child welfare notices, juvenile court documents and family-agency routing.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Adoption starting file",
      "Stepparent adoption",
      "Adult adoption",
      "Agency adoption",
      "Foster care/adoption",
      "Child welfare notice",
      "Juvenile court papers",
      "Kinship caregiver issue",
      "Termination of parental rights concern"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "mediation-adr",
    "name": "Mediation & Alternative Dispute Resolution",
    "summary": "Mediation preparation, dispute summaries, settlement terms and neutral document organization.",
    "requiresJurisdiction": true,
    "review": "mediator_or_attorney",
    "subcategories": [
      "Mediation preparation",
      "Settlement terms summary",
      "Neighbor dispute",
      "Family mediation",
      "Business mediation",
      "Consumer mediation",
      "Community mediation",
      "Arbitration notice",
      "Negotiation checklist",
      "Arbitration",
      "Mediation",
      "Collaborative law",
      "Negotiation preparation",
      "Settlement conference"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "litigation-lawsuits",
    "name": "Litigation & Lawsuits",
    "summary": "General lawsuits, disputes, summonses, complaints, motions, discovery, class actions, and court-document organization.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Summons or complaint",
      "Answer deadline",
      "Civil litigation starting file",
      "Discovery request",
      "Motion papers",
      "Settlement demand",
      "Class action notice",
      "Small business lawsuit",
      "Neighbor dispute lawsuit",
      "Post-judgment issue",
      "Court date preparation",
      "Litigation document summary"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "personal-finance-retirement",
    "name": "Personal Finance & Retirement",
    "summary": "Personal finance notices, retirement account questions, pension/beneficiary paperwork, credit/debt organization, and planning-document routing.",
    "requiresJurisdiction": true,
    "review": "professional_or_attorney",
    "subcategories": [
      "Retirement account document review",
      "Pension notice",
      "Beneficiary designation issue",
      "Life insurance beneficiary issue",
      "Credit report issue",
      "Personal finance debt plan",
      "Retirement benefits denial",
      "401(k)/IRA rollover question",
      "Financial exploitation concern",
      "Consumer finance notice",
      "Personal finance document organization"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "animal-law",
    "name": "Animal Law",
    "summary": "Pet, animal-control, service/emotional-support animal, veterinary, dog-bite-adjacent, rescue, and animal-business issues.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Pet custody or ownership dispute",
      "Animal control citation",
      "Dangerous dog notice",
      "Service animal issue",
      "Emotional support animal housing issue",
      "Veterinary bill or malpractice concern",
      "Animal rescue/nonprofit issue",
      "Breeder or seller dispute",
      "Boarding/grooming dispute",
      "Animal business license or compliance"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "environmental-natural-resources",
    "name": "Environmental & Natural Resources",
    "summary": "Environmental notices, property contamination, permits, natural-resource disputes, and agency correspondence.",
    "requiresJurisdiction": true,
    "review": "attorney_or_environmental_professional",
    "subcategories": [
      "Environmental agency notice",
      "Property contamination concern",
      "Wetlands or protected land issue",
      "Water or air permit notice",
      "Hazardous materials notice",
      "Neighbor pollution concern",
      "Natural resources permit",
      "Environmental cleanup demand",
      "Oil/gas/mineral impact",
      "Environmental appeal deadline"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "agriculture-farm-law",
    "name": "Agriculture & Farm Law",
    "summary": "Farm business, agricultural leases, USDA/FSA notices, crop/livestock issues, land-use, and rural compliance questions.",
    "requiresJurisdiction": true,
    "review": "attorney_or_agriculture_professional",
    "subcategories": [
      "Farm lease issue",
      "USDA/FSA notice",
      "Crop insurance claim",
      "Livestock dispute",
      "Agricultural business formation",
      "Farm labor issue",
      "Agricultural zoning",
      "Conservation program notice",
      "Equipment finance dispute",
      "Food/produce compliance notice"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "transportation-aviation-maritime",
    "name": "Transportation, Aviation & Maritime",
    "summary": "Aviation, trucking, shipping, admiralty/maritime, transportation contracts, and regulatory notices.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Trucking business compliance",
      "Transportation contract",
      "DOT/FMCSA notice",
      "Aviation matter",
      "FAA notice",
      "Admiralty/maritime issue",
      "Shipping/cargo dispute",
      "Transportation accident document organization",
      "Equipment leasing issue",
      "Transportation license or permit"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "financial-markets-securities",
    "name": "Banking, Finance & Securities",
    "summary": "Banking disputes, lending agreements, securities, investment fraud, financial services, and financing-document review.",
    "requiresJurisdiction": true,
    "review": "attorney_or_financial_professional",
    "subcategories": [
      "Banking dispute",
      "Debt or lending agreement",
      "Investment fraud concern",
      "Securities offering",
      "Broker or advisor complaint",
      "FINRA/arbitration notice",
      "Equipment finance",
      "Project finance",
      "Public finance/tax-exempt finance",
      "Financial markets/service issue",
      "Venture capital document review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "antitrust-trade-regulation",
    "name": "Antitrust & Trade Regulation",
    "summary": "Competition, trade regulation, unfair business practices, supplier/distributor restrictions, and regulatory notices.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Antitrust concern",
      "Unfair competition",
      "Trade regulation notice",
      "Supplier/distributor restriction",
      "Price-fixing concern",
      "Market allocation concern",
      "Franchise/trade practice concern",
      "Regulatory inquiry",
      "Cease-and-desist letter",
      "Business competition dispute"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "communications-media-advertising",
    "name": "Communications, Media & Advertising",
    "summary": "Advertising, media, telecommunications, influencer, publication, communications-regulatory, and content-rights questions.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Advertising claim review",
      "FTC advertising concern",
      "Media/publication dispute",
      "Communications regulatory issue",
      "Telecommunications notice",
      "Influencer/sponsorship agreement",
      "Right of publicity",
      "Content licensing",
      "Defamation/reputation concern",
      "Website/app content dispute"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "entertainment-sports-creative",
    "name": "Entertainment, Sports & Creative",
    "summary": "Creative contracts, music/film/media, sports, talent, licensing, royalties, sponsorships, and rights organization.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Talent agreement",
      "Music contract",
      "Film/media agreement",
      "Sports contract",
      "Sponsorship deal",
      "Royalty statement",
      "Licensing agreement",
      "Creative collaboration dispute",
      "Manager/agent issue",
      "Name/image/likeness concern",
      "Event contract"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "construction-development",
    "name": "Construction & Development",
    "summary": "Construction contracts, contractor disputes, mechanic liens, development approvals, defects, delays, and payment claims.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Construction contract",
      "Contractor payment dispute",
      "Mechanic lien notice",
      "Construction defect",
      "Project delay claim",
      "Change order dispute",
      "Subcontractor issue",
      "Development approval",
      "Permit or inspection problem",
      "Home improvement contractor issue",
      "Commercial development dispute"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "franchise-licensing-distribution",
    "name": "Franchise, Licensing & Distribution",
    "summary": "Franchise documents, licensing, distribution, dealer relationships, termination notices, and compliance review.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Franchise disclosure document",
      "Franchise agreement",
      "Dealer/distributor agreement",
      "License agreement",
      "Termination notice",
      "Territory dispute",
      "Royalty/payment issue",
      "Brand compliance issue",
      "Renewal/nonrenewal",
      "Franchise sale or transfer"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "government-contracts-procurement",
    "name": "Government Contracts & Procurement",
    "summary": "Bids, RFPs, procurement disputes, contract compliance, certifications, debarment notices, and payment claims.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "RFP/bid review",
      "Government contract notice",
      "Procurement protest",
      "Payment claim",
      "Change order with agency",
      "Certification issue",
      "Debarment/suspension notice",
      "Set-aside or MWBE/DBE issue",
      "Contract compliance",
      "Grant/contract reporting"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "health-care-business-regulatory",
    "name": "Health Care Business & Regulatory",
    "summary": "Healthcare business, provider licensing, payer audits, compliance notices, facility issues, and professional-board matters.",
    "requiresJurisdiction": true,
    "review": "attorney_or_healthcare_professional",
    "subcategories": [
      "Provider license notice",
      "Healthcare business compliance",
      "Medicare/Medicaid provider issue",
      "Payer audit",
      "Credentialing issue",
      "HIPAA/privacy notice",
      "Facility license issue",
      "Professional board complaint",
      "Healthcare contract",
      "Overpayment/recoupment notice"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "international-law",
    "name": "International Law",
    "summary": "Cross-border documents, international business, foreign judgments, consular documents, treaties, and multi-country issue organization.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Cross-border contract",
      "Foreign judgment/document",
      "Consular document issue",
      "International business dispute",
      "International family document",
      "Apostille/authentication issue",
      "Treaty-related question",
      "Import/export document",
      "International tax/legal overlap",
      "Foreign entity document review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "lemon-law-auto-consumer",
    "name": "Lemon Law & Auto Consumer Issues",
    "summary": "Vehicle defects, dealer disputes, warranty claims, repossession notices, financing disputes, and auto-consumer letters.",
    "requiresJurisdiction": true,
    "review": "attorney_or_consumer_professional",
    "subcategories": [
      "Lemon law claim",
      "Vehicle warranty dispute",
      "Dealer misrepresentation",
      "Auto finance dispute",
      "Repossession notice",
      "Defective vehicle repair",
      "Extended warranty issue",
      "Title/odometer issue",
      "Recall-related issue",
      "Demand letter to dealer/manufacturer"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "defamation-reputation-harassment",
    "name": "Defamation, Reputation & Harassment",
    "summary": "Libel, slander, online reputation, harassment, takedown requests, demand letters, and platform reports.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Online defamation",
      "Libel or slander",
      "Harassment messages",
      "Reputation damage",
      "Demand letter received",
      "Cease-and-desist letter",
      "Content takedown",
      "Impersonation/account issue",
      "Business review dispute",
      "Cyberbullying/stalking concern"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "nursing-home-abuse-neglect",
    "name": "Nursing Home Abuse & Neglect",
    "summary": "Nursing-home injuries, neglect, billing, discharge notices, care plans, elder abuse, and long-term-care document organization.",
    "requiresJurisdiction": true,
    "review": "attorney_or_eldercare_professional",
    "subcategories": [
      "Nursing home neglect",
      "Pressure sore/injury",
      "Fall in facility",
      "Medication error",
      "Improper discharge notice",
      "Care plan concern",
      "Long-term-care billing",
      "Elder abuse concern",
      "Financial exploitation",
      "Facility complaint",
      "Medical records request"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "product-liability-dangerous-products",
    "name": "Product Liability & Dangerous Products",
    "summary": "Defective products, dangerous drugs/devices, recalls, warnings, injuries, and claim-document organization.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Defective product injury",
      "Dangerous drug or device",
      "Recall notice",
      "Failure to warn",
      "Product fire/burn injury",
      "Child product injury",
      "Workplace product injury",
      "Warranty/safety dispute",
      "Evidence preservation checklist",
      "Manufacturer demand letter"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "toxic-exposure-asbestos-mesothelioma",
    "name": "Toxic Exposure, Asbestos & Mesothelioma",
    "summary": "Asbestos, mesothelioma, chemical exposure, toxic tort, environmental injury, and exposure-history organization.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Asbestos exposure",
      "Mesothelioma concern",
      "Chemical exposure",
      "Toxic tort starting file",
      "Workplace exposure",
      "Environmental exposure",
      "Medical record checklist",
      "Exposure timeline",
      "Product/source identification",
      "Family/wrongful death concern"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "wrongful-death-survivor-claims",
    "name": "Wrongful Death & Survivor Claims",
    "summary": "Fatal accidents, survivor claims, estate/family coordination, insurance letters, and attorney review routing.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Fatal accident",
      "Wrongful death claim",
      "Survivor benefits",
      "Estate representative issue",
      "Insurance letter",
      "Medical record checklist",
      "Police/incident report",
      "Work-related death",
      "Vehicle fatality",
      "Medical malpractice death",
      "Settlement document review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "white-collar-federal-crimes",
    "name": "White Collar & Federal Criminal Issues",
    "summary": "Fraud allegations, subpoenas, federal investigations, white-collar charges, and urgent attorney-review routing.",
    "requiresJurisdiction": true,
    "review": "attorney",
    "subcategories": [
      "Federal investigation notice",
      "Grand jury subpoena",
      "Fraud allegation",
      "Tax fraud/tax evasion concern",
      "Securities/investment allegation",
      "Healthcare fraud allegation",
      "Business records subpoena",
      "Interview request from investigators",
      "White collar charge",
      "Urgent defense review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "lgbtq-legal-issues",
    "name": "LGBTQ+ Legal Issues",
    "summary": "Family, name/gender-marker, discrimination, benefits, health, housing, employment, and document issues that may need state-specific review.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Name or gender-marker document",
      "Family or parentage issue",
      "Discrimination concern",
      "Employment issue",
      "Housing issue",
      "Healthcare document",
      "Benefits or insurance issue",
      "Safety/protection order",
      "Estate planning documents",
      "School/education issue"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "state-local-municipal-law",
    "name": "State, Local & Municipal Law",
    "summary": "Local agency notices, municipal tickets, permits, code enforcement, local hearings, and city/county paperwork.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "City/county agency notice",
      "Code enforcement ticket",
      "Local permit issue",
      "Municipal hearing",
      "Local tax/fee notice",
      "Zoning/local board issue",
      "Business license issue",
      "Property violation",
      "Local appeal deadline",
      "Public records request"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "election-campaign-political-law",
    "name": "Election, Campaign & Political Law",
    "summary": "Election notices, campaign filings, ballot/access questions, political committee compliance, and public-office paperwork.",
    "requiresJurisdiction": true,
    "review": "attorney_or_compliance_professional",
    "subcategories": [
      "Campaign finance filing",
      "Political committee registration",
      "Ballot access issue",
      "Election board notice",
      "Disclosure report",
      "Contribution/refund issue",
      "Campaign vendor contract",
      "Ethics complaint",
      "Public office paperwork",
      "Deadline checklist"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "native-tribal-law",
    "name": "Native, Tribal & Indigenous Law",
    "summary": "Tribal, federal, state, benefits, family, land, business, and administrative documents involving Native/tribal issues.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Tribal court document",
      "Enrollment or benefits issue",
      "ICWA/child welfare issue",
      "Tribal business document",
      "Land/resource matter",
      "Federal agency notice",
      "State/tribal jurisdiction question",
      "Housing or benefits issue",
      "Appeal/hearing notice",
      "Document organization for review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "ethics-professional-responsibility",
    "name": "Ethics & Professional Responsibility",
    "summary": "Professional ethics complaints, licensing-board matters, fee disputes, grievance responses, and compliance-document organization.",
    "requiresJurisdiction": true,
    "review": "attorney_or_professional",
    "subcategories": [
      "Professional ethics complaint",
      "Licensing board grievance",
      "Fee dispute",
      "Conflicts disclosure",
      "Professional discipline notice",
      "Response deadline",
      "Client file request",
      "Trust/accounting concern",
      "Compliance checklist",
      "Professional conduct document review"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  },
  {
    "slug": "other",
    "name": "Other Legal, Tax, Benefits or Government Problem",
    "summary": "A safe starting place when the user is not sure which category fits.",
    "requiresJurisdiction": true,
    "review": "human_review_first",
    "subcategories": [
      "Not sure where to start",
      "Urgent notice or deadline",
      "Document summary",
      "Need professional review",
      "Government letter",
      "Court paper",
      "Business compliance question",
      "Benefits notice",
      "Tax or legal confusion"
    ],
    "minimumFields": [
      "fullName",
      "email",
      "phone",
      "stateOrJurisdiction",
      "zipCode",
      "issueSummary",
      "urgency",
      "noticeOrDeadline",
      "consentToContact"
    ],
    "futureLeadFields": [
      "county",
      "city",
      "opposingParty",
      "courtOrAgency",
      "deadlineDate",
      "bestContactTime"
    ]
  }
];

function getPracticeBySlug(slug){return PRACTICE_AREAS.find(p=>p.slug===slug)||PRACTICE_AREAS[PRACTICE_AREAS.length-1];}
function listPracticeSummaries(){return PRACTICE_AREAS.map(({slug,name,summary,requiresJurisdiction,review,subcategories,minimumFields,futureLeadFields})=>({slug,name,summary,requiresJurisdiction,review,subcategories,minimumFields,futureLeadFields}));}
module.exports={PRACTICE_AREAS,getPracticeBySlug,listPracticeSummaries};
