const SHARED_REVENUE_ACCESS_STANDARD_VERSION = '1.0.0';

const CORE_PRINCIPLES = [
  'Meaningful AI-guided public starting help remains free or extremely low cost.',
  'Optional Human Review Specialist services are separately scoped, priced, and staffed.',
  'Attorneys, tax professionals, and other qualified professionals provide separately engaged professional services.',
  'Professional membership does not guarantee clients, matters, ranking, revenue, or outcomes.',
  'Claiming, verifying, correcting, and editing a basic professional or firm profile is free.',
  'Optional paid professional products may add clearly labeled Sponsored visibility, enhanced prominence, lead eligibility, and access to case or attorney-review opportunities after every independent gate is satisfied.',
  'Professional-growth charges use disclosed fixed subscription, advertising, platform, software, or opportunity-access fees; they are not a percentage of legal fees, recoveries, settlements, refunds, or outcomes and are not contingent on case results.',
  'Payment never purchases identity or credential verification, specialty eligibility, organic ranking, endorsement, reviews, or a guarantee of work.',
  'A future public supporter or continuity membership may add convenience and higher fair-use limits without removing meaningful free access.',
  'Every price must distinguish platform access, human review, professional fees, government or court fees, taxes, premiums, and third-party costs.',
  'No plan may be described as unlimited unless capacity, abuse controls, and actual terms support that claim.'
];

const PUBLIC_ACCESS_PLANS = [
  {
    id: 'public-free',
    name: 'Free AI-Guided Starting Help',
    status: 'approved foundation',
    monthlyPriceCents: 0,
    activeForBilling: false,
    audience: 'public users',
    includes: [
      'Practice and portal starting guidance',
      'Plain-language checklists and next-step explanations',
      'Non-saved story routing while private account infrastructure is incomplete',
      'Basic form, notice, document, and deadline organization where supported',
      'Professional-directory browsing'
    ],
    excludes: [
      'Attorney or tax-professional advice',
      'Representation',
      'Human Review Specialist labor',
      'Government, court, tax, premium, or third-party fees',
      'Guaranteed filing acceptance, eligibility, result, or professional availability'
    ],
    fairUse: 'Generous ordinary personal use, subject to reasonable safeguards against automated, abusive, or commercial-volume activity.'
  },
  {
    id: 'public-supporter-5',
    name: 'Supporter and Continuity Plan',
    status: 'future option — not active',
    monthlyPriceCents: 500,
    activeForBilling: false,
    audience: 'public users',
    includes: ['Higher fair-use limits', 'Longer history and saved progress when secure accounts are approved', 'Additional exports and continuity tools', 'Supporter recognition or other non-substantive benefits'],
    excludes: ['Human review', 'Professional services', 'Government or third-party fees', 'Unlimited automated or commercial-volume use'],
    fairUse: 'Future plan subject to capacity, security, billing, cancellation, support, and owner approval.'
  },
  {
    id: 'public-continuity-10',
    name: 'Expanded Continuity Plan',
    status: 'future option — not active',
    monthlyPriceCents: 1000,
    activeForBilling: false,
    audience: 'public users',
    includes: ['Higher fair-use limits than the supporter plan', 'Multiple organized matters when secure accounts are approved', 'Advanced comparison, drafting, reminders, and export tools where supported', 'Possible Human Review Specialist discounts after pricing approval'],
    excludes: ['Attorney or tax-professional advice', 'Representation', 'Unlimited human labor', 'Government or third-party fees'],
    fairUse: 'Future plan subject to capacity, security, billing, cancellation, support, and owner approval.'
  }
];

const HUMAN_REVIEW_SERVICE_CATEGORIES = [
  {
    id: 'starting-file-completeness-review',
    name: 'Starting Information Completeness Review',
    status: 'planned — not for sale',
    priceCents: null,
    activeForBilling: false,
    checkoutCode: 'starter_review',
    priceEnvKey: 'STRIPE_STARTER_REVIEW_PRICE_ID',
    termsVersion: 'public-paid-services-1.0.0',
    turnaround: 'Set and publish a realistic service window before activation.',
    revisionPolicy: 'Set and publish the included revision policy before activation.',
    scope: 'A Human Review Specialist checks whether the user supplied the requested starting information and identifies missing items. No legal, tax, accounting, insurance, or other professional advice.'
  },
  {
    id: 'form-organization-review',
    name: 'Form and Supporting-Document Organization Review',
    status: 'planned — not for sale',
    priceCents: null,
    activeForBilling: false,
    checkoutCode: 'form_prep',
    priceEnvKey: 'STRIPE_FORM_PREP_PRICE_ID',
    termsVersion: 'public-paid-services-1.0.0',
    turnaround: 'Set and publish a realistic service window before activation.',
    revisionPolicy: 'Set and publish the included revision policy before activation.',
    scope: 'A Human Review Specialist checks organization, obvious blanks, requested supporting items, and readiness for professional or user review. Filing acceptance and legal sufficiency are not guaranteed.'
  },
  {
    id: 'notice-and-deadline-organization-review',
    name: 'Notice and Deadline Organization Review',
    status: 'planned — not for sale',
    priceCents: null,
    activeForBilling: false,
    checkoutCode: 'notice_review',
    priceEnvKey: 'STRIPE_NOTICE_REVIEW_PRICE_ID',
    termsVersion: 'public-paid-services-1.0.0',
    turnaround: 'Set and publish a realistic service window before activation.',
    revisionPolicy: 'Set and publish the included revision policy before activation.',
    scope: 'A Human Review Specialist organizes visible dates, requested actions, and questions for the user or an independently engaged professional. The specialist does not decide legal rights or strategy.'
  },
  {
    id: 'professional-review-preparation',
    name: 'Professional Review Preparation',
    status: 'planned — not for sale',
    priceCents: null,
    activeForBilling: false,
    checkoutCode: 'professional_review_preparation',
    priceEnvKey: 'STRIPE_PROFESSIONAL_REVIEW_PREP_PRICE_ID',
    termsVersion: 'public-paid-services-1.0.0',
    turnaround: 'Set and publish a realistic service window before activation.',
    revisionPolicy: 'Set and publish the included revision policy before activation.',
    scope: 'A Human Review Specialist organizes the user’s facts, questions, documents, and missing items before a separate attorney, tax professional, or other qualified professional engagement.'
  }
];

const PROFESSIONAL_REVENUE_MODEL = {
  status: 'free basic profiles implemented; paid growth foundation closed pending acceptance',
  basicProfilePriceCents: 0,
  foundingIndividualMonthlyCents: 1500,
  foundingIndividualAnnualCents: 15000,
  firmSeatDiscounts: 'configured through the professional marketplace and subject to owner approval',
  freeBasicProfile: [
    'Claim, verify, correct, and edit the basic professional or firm profile without payment',
    'Use the central dashboard for approved basic profile information',
    'Request correction, suppression, or removal without payment',
    'No Sponsored placement, lead eligibility, or case-opportunity access is implied'
  ],
  optionalPaidGrowth: [
    'Clearly labeled Sponsored or Featured visibility',
    'Enhanced prominence that is separate from organic ordering',
    'Lead eligibility after independent verification, specialty, conflicts, privacy, support, compliance, and owner gates',
    'Fixed-fee access to case or attorney-review opportunities after all gates are satisfied'
  ],
  prohibitedCommercialTerms: [
    'No percentage of legal fees, settlements, recoveries, refunds, or outcomes',
    'No charge contingent on retention, recovery, settlement, fees, or case result',
    'No pay-to-verify, pay-to-qualify, pay-to-endorse, or paid organic ranking',
    'No guaranteed clients, inquiries, matters, ranking, revenue, or results'
  ],
  activationBoundary: 'Paid professional growth remains closed until pricing, terms, Stripe, Sponsored disclosures, attorney-advertising, solicitation, referral, fee-sharing, conflicts, privacy, support, qualified-counsel review, and owner approval are recorded.'
};

const FEE_SEPARATION = [
  {key:'aiPlatformAccess', label:'AI-guided platform access', rule:'Show what is free and what optional public membership adds.'},
  {key:'humanReview', label:'Human Review Specialist service', rule:'Show the exact scope, price, timing, revision policy, and limitations.'},
  {key:'professionalServices', label:'Attorney, tax, accounting, insurance, or other professional service', rule:'Separately engaged, independently scoped, and separately priced by the professional unless an approved compliant model says otherwise.'},
  {key:'governmentAndCourt', label:'Government, court, filing, tax, premium, and agency fees', rule:'Always separate from Smarter Justice platform and review charges.'},
  {key:'thirdParty', label:'Third-party expenses', rule:'Disclose separately and do not silently bundle or mark up without approval and disclosure.'}
];

module.exports = {
  SHARED_REVENUE_ACCESS_STANDARD_VERSION,
  CORE_PRINCIPLES,
  PUBLIC_ACCESS_PLANS,
  HUMAN_REVIEW_SERVICE_CATEGORIES,
  PROFESSIONAL_REVENUE_MODEL,
  FEE_SEPARATION
};
