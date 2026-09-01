'use strict';

const LEGAL_COMMUNITY_PROGRAM_PRE127 = Object.freeze({
  schemaVersion: 'smarter-justice.legal-community-program.v2',
  programName: 'Smarter Justice Legal Communities',
  updatedAt: '2026-09-01T20:45:00.000Z',
  strategicPositioning: Object.freeze({
    publicPromise: 'Understand a local legal problem, find source-linked help, prepare, and independently choose whether to contact a professional.',
    professionalPromise: 'Join a useful local legal community for recurring intelligence, participation, professional presence, and practical tools.',
    profileRole: 'A free factual identity layer inside the community—not the primary paid product.',
    membershipRole: 'Paid participation and recurring professional value—not purchased trust, credentials, organic rank, endorsement, or guaranteed clients.',
    networkModel: 'ONE_SMARTER_JUSTICE_BRAND_AND_ACCOUNT_WITH_NESTED_HYPERLOCAL_COMMUNITIES'
  }),
  foundingOffer: Object.freeze({
    id: 'downtown-brooklyn-founding-launch',
    label: 'Downtown Brooklyn founding launch',
    status: 'CURRENT_LISTED_LAUNCH_PRICES',
    communityId: 'downtown-brooklyn',
    plans: Object.freeze([
      Object.freeze({ id: 'professional', name: 'Founding Professional', monthlyDollars: 10, annualDollars: 100, seats: 1 }),
      Object.freeze({ id: 'team', name: 'Founding Team', monthlyDollars: 29, annualDollars: 290, seats: 5 }),
      Object.freeze({ id: 'office', name: 'Founding Office', monthlyDollars: 49, annualDollars: 490, seats: 15 }),
      Object.freeze({ id: 'enterprise', name: 'Enterprise / Network', monthlyDollars: null, annualDollars: null, seats: null })
    ]),
    priceAmountsChangedFromPre126: false,
    priceProtectionPubliclyPromised: false,
    priceProtectionReason: 'Any binding price-protection promise must match the checkout, membership terms, billing receipt, renewal behavior, and owner-approved legal review before publication.',
    enrollmentBoundary: 'Account creation, free profile control, paid enrollment, membership activation, and feature availability remain separate states.',
    guaranteeBoundary: 'Membership does not guarantee inquiries, matters, clients, revenue, rankings, or results.'
  }),
  practiceAreas: Object.freeze([
    Object.freeze({ id: 'civil-litigation', name: 'Civil litigation' }),
    Object.freeze({ id: 'family-divorce', name: 'Family and divorce' }),
    Object.freeze({ id: 'housing', name: 'Housing and landlord-tenant' }),
    Object.freeze({ id: 'criminal-defense', name: 'Criminal defense' }),
    Object.freeze({ id: 'personal-injury', name: 'Personal injury' }),
    Object.freeze({ id: 'estate-planning', name: 'Estate planning and probate' }),
    Object.freeze({ id: 'business', name: 'Business and commercial' }),
    Object.freeze({ id: 'employment', name: 'Employment' }),
    Object.freeze({ id: 'immigration', name: 'Immigration' }),
    Object.freeze({ id: 'public-benefits', name: 'Public benefits' })
  ]),
  editions: Object.freeze([
    Object.freeze({
      id: 'downtown-brooklyn-2026-09-01',
      communityId: 'downtown-brooklyn',
      title: 'Downtown Brooklyn Legal Community Brief',
      editionLabel: 'September 1, 2026 edition',
      publishedAt: '2026-09-01T20:45:00-04:00',
      reviewedAt: '2026-09-01T20:45:00-04:00',
      reviewDueAt: '2026-09-08T23:59:59-04:00',
      status: 'PUBLISHED_CURRENT',
      responsiblePublisher: 'Smarter Justice',
      sourceCount: 10,
      automaticPublishing: false,
      humanSourceReviewRequired: true,
      correctionsPath: '/contact.html?topic=community-brief-correction',
      canonicalPath: '/community-briefs/downtown-brooklyn',
      linkedin: Object.freeze({
        title: 'Downtown Brooklyn Legal Community Brief — September 1, 2026',
        introduction: 'A source-linked local update for lawyers and firms around Downtown Brooklyn and the Civic Center.',
        highlights: Object.freeze([
          'New York Court Term 9 continues through September 13; Term 10 begins September 14.',
          'The Brooklyn Bar Association lists an AI and ethics courtroom program for September 16.',
          'Several Kings County Supreme Court Civil Term part-rule pages show recent August updates.'
        ]),
        closing: 'Every item links to the responsible source, includes a review date, and should be confirmed before reliance.',
        url: 'https://smarterjustice.com/community-briefs/downtown-brooklyn',
        hashtags: Object.freeze(['DowntownBrooklyn', 'BrooklynLaw', 'LegalCommunity'])
      })
    })
  ]),
  additionalSignals: Object.freeze([
    Object.freeze({
      id: 'kings-civil-status-conferences-2026-09',
      type: 'COURT_OPERATION_UPDATE',
      audience: Object.freeze(['PROFESSIONAL']),
      title: 'Kings Supreme Civil posts an in-person status-conference notice',
      summary: 'The official Civil Term page says that, until further notice, status conferences are held Thursdays in Room 741 with a 10:00 a.m. calendar call. Review the official page and the case-specific direction before appearing.',
      startsAt: '2026-09-01T00:00:00-04:00',
      expiresAt: '2026-10-02T00:00:00-04:00',
      reviewBy: '2026-09-08',
      sourceUrl: 'https://www.nycourts.gov/courts/2nd-judicial-district/kings-county-supreme-court-civil-term',
      sourceName: 'New York State Unified Court System',
      sourceUpdatedAt: null,
      observedAt: '2026-09-01',
      practiceAreaIds: Object.freeze(['civil-litigation']),
      importance: 'HIGH',
      legalAdvice: false
    }),
    Object.freeze({
      id: 'kings-civil-part-6-update-2026-08',
      type: 'COURT_PART_RULE_UPDATE',
      audience: Object.freeze(['PROFESSIONAL']),
      title: 'Kings Civil Part 6 page reports an August procedure update',
      summary: 'The official IAS Part 6 / CVAP4M page is marked updated August 13, 2026 and identifies a CVAP4M procedure as effective August 19. Review the complete current part rules and case-specific direction rather than relying on this summary.',
      startsAt: '2026-08-19T00:00:00-04:00',
      expiresAt: '2026-10-02T00:00:00-04:00',
      reviewBy: '2026-09-08',
      sourceUrl: 'https://www.nycourts.gov/courts/2nd-judicial-district/kings-county-supreme-court-civil-term/hon-joy-f-campanelli',
      sourceName: 'New York State Unified Court System',
      sourceUpdatedAt: '2026-08-13',
      observedAt: '2026-09-01',
      practiceAreaIds: Object.freeze(['civil-litigation', 'personal-injury']),
      importance: 'HIGH',
      legalAdvice: false
    }),
    Object.freeze({
      id: 'kings-civil-part-17-update-2026-08',
      type: 'COURT_PART_RULE_UPDATE',
      audience: Object.freeze(['PROFESSIONAL']),
      title: 'Kings Civil Part 17 and default-judgment rules page updated',
      summary: 'The official page for IAS Part 17 and the Default Judgment Motion Part is marked updated August 27, 2026. Lawyers should review the full current rules, calendar instructions, and their case-specific notices.',
      startsAt: '2026-08-27T00:00:00-04:00',
      expiresAt: '2026-10-02T00:00:00-04:00',
      reviewBy: '2026-09-08',
      sourceUrl: 'https://www.nycourts.gov/courts/2nd-judicial-district/kings-county-supreme-court-civil-term/hon-saul-stein',
      sourceName: 'New York State Unified Court System',
      sourceUpdatedAt: '2026-08-27',
      observedAt: '2026-09-01',
      practiceAreaIds: Object.freeze(['civil-litigation']),
      importance: 'NORMAL',
      legalAdvice: false
    }),
    Object.freeze({
      id: 'kings-civil-part-80-update-2026-08',
      type: 'COURT_PART_RULE_UPDATE',
      audience: Object.freeze(['PROFESSIONAL']),
      title: 'Kings Civil Part 80 and MMESP-6 rules page updated',
      summary: 'The official Part 80 / MMESP-6 page is marked updated August 18, 2026. Review the complete current page for motion, appearance, conference, and communication requirements.',
      startsAt: '2026-08-18T00:00:00-04:00',
      expiresAt: '2026-10-02T00:00:00-04:00',
      reviewBy: '2026-09-08',
      sourceUrl: 'https://www.nycourts.gov/courts/2nd-judicial-district/kings-county-supreme-court-civil-term/hon-patria-frias-colon',
      sourceName: 'New York State Unified Court System',
      sourceUpdatedAt: '2026-08-18',
      observedAt: '2026-09-01',
      practiceAreaIds: Object.freeze(['civil-litigation', 'personal-injury']),
      importance: 'NORMAL',
      legalAdvice: false
    })
  ]),
  sourceCorrections: Object.freeze({
    'ny-attorney-advertising-rules-2026': Object.freeze({
      sourceUrl: 'https://www.nycourts.gov/LegacyPDFS/RULES/jointappellate/Signed%20Letter%20to%20DOS-Joint%20Order.pdf',
      sourceName: 'New York State Unified Court System — Joint Appellate Division Order',
      reviewBy: '2026-10-01',
      practiceAreaIds: Object.freeze([]),
      importance: 'HIGH'
    }),
    'bba-ai-ethics-courtroom-2026': Object.freeze({
      reviewBy: '2026-09-16',
      practiceAreaIds: Object.freeze([]),
      importance: 'NORMAL'
    }),
    'court-term-nine-2026': Object.freeze({ reviewBy: '2026-09-13', practiceAreaIds: Object.freeze([]), importance: 'NORMAL' }),
    'court-term-ten-2026': Object.freeze({ reviewBy: '2026-10-12', practiceAreaIds: Object.freeze([]), importance: 'NORMAL' })
  }),
  professionalResources: Object.freeze([
    Object.freeze({ id: 'kings-uniform-motion-rules', name: 'Kings County Civil Term uniform rules for papers and motions', description: 'Official general Civil Term rules. Specialized part rules and case-specific directions may differ.', url: 'https://www.nycourts.gov/courts/kings-county-supreme-court-civil-term/uniform-rules-papers-motions', sourceName: 'New York State Unified Court System', observedAt: '2026-09-01', reviewBy: '2026-10-01', practiceAreaIds: Object.freeze(['civil-litigation']) }),
    Object.freeze({ id: 'brooklyn-court-law-library', name: 'Supreme Court Library, Brooklyn', description: 'The official page lists the public law library at 360 Adams Street, Room 349, and links to Ask a Law Librarian.', url: 'https://www.nycourts.gov/courts/2nd-judicial-district/supreme-court-library-brooklyn', sourceName: 'New York State Unified Court System', observedAt: '2026-09-01', reviewBy: '2026-12-01', practiceAreaIds: Object.freeze([]) }),
    Object.freeze({ id: 'nyc-right-to-counsel', name: 'NYC Right to Counsel information', description: 'The official city page explains free legal representation and advice for eligible tenant matters and directs people to call 311.', url: 'https://www.nyc.gov/site/mayorspeu/resources/right-to-counsel.page', sourceName: 'City of New York', observedAt: '2026-09-01', reviewBy: '2026-12-01', practiceAreaIds: Object.freeze(['housing']) })
  ]),
  publishingStandard: Object.freeze({
    cadenceTarget: 'WEEKLY_WHEN_QUALIFIED_CONTENT_EXISTS',
    autoPublish: false,
    sourceRequired: true,
    observedAtRequired: true,
    reviewByRequired: true,
    expiresAtRequiredForTimeSensitiveItems: true,
    primaryOrResponsibleSourcePreferred: true,
    correctionsPathRequired: true,
    staleItemsFailClosed: true,
    privateMatterContentProhibited: true,
    connectionCountClaimsProhibitedWithoutOwnerVerification: true,
    massDirectMessagingNotAuthorized: true,
    manualLinkedInSharingSupported: true
  })
});

module.exports = { LEGAL_COMMUNITY_PROGRAM_PRE127 };
