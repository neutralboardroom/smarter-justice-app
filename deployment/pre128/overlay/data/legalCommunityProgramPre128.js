'use strict';

const LEGAL_COMMUNITY_PROGRAM_PRE128 = Object.freeze({
  schemaVersion: 'smarter-justice.legal-community-program.v3',
  programName: 'Smarter Justice Legal Communities',
  updatedAt: '2026-09-03T14:48:06.000Z',
  releaseScope: Object.freeze({
    publicCommunityExperience: 'AVAILABLE',
    professionalCommunityPreview: 'AVAILABLE_WITHOUT_PAYMENT',
    newProfessionalAccountRegistration: 'PAUSED_UNTIL_TRANSACTIONAL_EMAIL_IS_READY',
    paidMembershipEnrollment: 'NOT_OPEN',
    checkout: 'NOT_OPEN',
    paidEntitlements: 'NOT_ISSUED'
  }),
  positioning: Object.freeze({
    publicPromise: 'Understand a local legal problem, use practical preparation tools, find local resources, and independently choose whether to contact a professional.',
    professionalPromise: 'Use a local legal-community view for timely information, participation paths, a free professional presence, and practical tools as each becomes available.',
    profileRole: 'A free factual identity and trust layer inside Smarter Justice, not the product being sold.',
    membershipRole: 'A future paid participation relationship that must deliver recurring professional value before enrollment opens.',
    networkModel: 'One Smarter Justice brand, account, and platform with connected hyperlocal legal communities.'
  }),
  pricing: Object.freeze({
    authorityState: 'OWNER_APPROVED_PLANNED_CATALOG_CHECKOUT_NOT_MAPPED',
    publicLabel: 'Planned membership dues',
    enrollmentAvailable: false,
    checkoutAvailable: false,
    priceProtectionPromised: false,
    plans: Object.freeze([
      Object.freeze({ id:'professional', name:'Professional', monthlyDollars:10, annualDollars:100, seats:1 }),
      Object.freeze({ id:'team', name:'Team', monthlyDollars:29, annualDollars:290, seats:5 }),
      Object.freeze({ id:'office', name:'Office', monthlyDollars:49, annualDollars:490, seats:15 }),
      Object.freeze({ id:'enterprise', name:'Enterprise / Network', monthlyDollars:null, annualDollars:null, seats:null })
    ]),
    disclosure: 'These are the approved planned dues. Enrollment and checkout are not open. Before payment opens, the exact plan, price, renewal, cancellation, taxes, benefits, and availability must match the billing provider and accepted terms.'
  }),
  benefitAvailability: Object.freeze([
    Object.freeze({ id:'free-profile', label:'Free factual public profile', state:'AVAILABLE', audience:'PUBLIC_AND_PROFESSIONAL', detail:'Search, review public facts, and submit an eligible correction request without buying membership.' }),
    Object.freeze({ id:'public-community', label:'Downtown Brooklyn public legal-community page', state:'AVAILABLE', audience:'PUBLIC', detail:'Local courts, public resources, independent organizations, lawyer and firm discovery, and original source links.' }),
    Object.freeze({ id:'professional-community-preview', label:'Professional community preview', state:'AVAILABLE', audience:'PROFESSIONAL', detail:'Read the current local brief, filter by practice focus on the device, and prepare a LinkedIn post without paying.' }),
    Object.freeze({ id:'saved-community-settings', label:'Saved community settings', state:'EXISTING_ACCOUNTS_ONLY_WHILE_NEW_REGISTRATION_IS_PAUSED', audience:'SIGNED_IN_PROFESSIONAL', detail:'Existing verified accounts may save a home community, service areas, practice focus, and communication choices.' }),
    Object.freeze({ id:'paid-membership', label:'Paid legal-community membership', state:'NOT_OPEN', audience:'PROFESSIONAL_AND_FIRM', detail:'No payment is accepted and no paid entitlement is issued in this release.' }),
    Object.freeze({ id:'scheduling-inquiries-review', label:'Scheduling, inquiries, and review opportunities', state:'NOT_INCLUDED_AS_AN_ACTIVE_MEMBERSHIP_PROMISE', audience:'PROFESSIONAL_AND_FIRM', detail:'Availability must be shown feature by feature after operational, legal, support, consent, and entitlement checks pass.' }),
    Object.freeze({ id:'peer-connections', label:'Member-to-member introductions', state:'NOT_IMPLEMENTED', audience:'PROFESSIONAL', detail:'No directory export, open member list, or automated introduction is offered.' }),
    Object.freeze({ id:'community-submissions', label:'Member-submitted events or updates', state:'NOT_IMPLEMENTED', audience:'PROFESSIONAL_AND_ORGANIZATION', detail:'A moderation and source-review lifecycle must exist before submissions open.' })
  ]),
  memberClasses: Object.freeze([
    Object.freeze({ id:'professional', label:'Individual professional', eligibility:'A verified professional identity and an accepted active plan when enrollment opens.', votes:0, governingAuthority:false }),
    Object.freeze({ id:'firm-team', label:'Firm or team', eligibility:'Verified authority to act for the firm and an accepted active plan when enrollment opens.', votes:0, governingAuthority:false }),
    Object.freeze({ id:'public-organization', label:'Independent public or nonprofit organization', eligibility:'Listed from public facts or direct permission; listing does not make the organization a member or partner.', votes:0, governingAuthority:false })
  ]),
  organizationBoundary: Object.freeze({
    legalFormClaimed: false,
    barAssociationClaimed: false,
    lawyerReferralServiceClaimed: false,
    courtOrGovernmentAffiliationClaimed: false,
    cleProviderClaimed: false,
    governingBoardClaimed: false,
    chaptersClaimed: false,
    description: '“Legal community” describes a Smarter Justice product experience and organizing area. It does not claim a separate legal entity, professional association, chapter, court program, bar association, referral service, or government affiliation.'
  }),
  competitionBoundary: Object.freeze({
    competitorPriceDiscussionAllowed: false,
    feeCoordinationAllowed: false,
    marketAllocationAllowed: false,
    coordinatedClientAcceptanceAllowed: false,
    collectiveBoycottAllowed: false,
    rosterExportAllowed: false,
    memberContactHarvestingAllowed: false,
    moderationRule: 'Community participation may not be used to coordinate prices, fees, markets, client acceptance, bidding, boycotts, or other competitively sensitive conduct.'
  }),
  geography: Object.freeze({
    launchCommunityId:'downtown-brooklyn',
    publicStatus:'organizing',
    areaKind:'Smarter Justice organizing area',
    homeCommunityMeaning:'The professional’s selected local community view; it does not establish an office, license, service area, membership, or jurisdiction.',
    participatingCommunityMeaning:'A separately chosen published community in which a professional wants to participate. Research candidates cannot be selected.',
    serviceAreaMeaning:'A professional-supplied statement of places they may serve, subject to law, licensing, conflicts, matter fit, availability, and engagement.',
    licenseMeaning:'A separate credential fact supported by its own evidence.',
    candidatePublicationRule:'Candidate communities stay internal until their boundaries, sources, operating capacity, and recurring usefulness are accepted.'
  }),
  sourceReview: Object.freeze({
    editionId:'downtown-brooklyn-2026-09-01',
    lastCheckedAt:'2026-09-01T20:45:00-04:00',
    checkAgainBy:'2026-09-08T23:59:59-04:00',
    automaticPublishing:false,
    staleItemsHidden:true,
    privateMatterDataUsed:false
  })
});

module.exports = { LEGAL_COMMUNITY_PROGRAM_PRE128 };
