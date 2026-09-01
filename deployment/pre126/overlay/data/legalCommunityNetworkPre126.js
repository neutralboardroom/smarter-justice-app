'use strict';

const LEGAL_COMMUNITY_NETWORK = Object.freeze({
  schemaVersion: 'smarter-justice.legal-community-network.v1',
  product: 'Smarter Justice',
  networkName: 'Smarter Justice Legal Communities',
  networkModel: 'ONE_CONNECTED_PLATFORM_WITH_NESTED_HYPERLOCAL_COMMUNITIES',
  updatedAt: '2026-09-01T00:00:00.000Z',
  principles: Object.freeze({
    smallestViableCommunity: true,
    profilesRemainFree: true,
    membershipBuysParticipationNotTrust: true,
    oneAccountAcrossCommunities: true,
    privateMatterSignalsProhibited: true,
    publicDemandSignalsMustBeAggregated: true,
    officeLocationServiceAreaAndMembershipAreSeparate: true,
    paidOrganicRankProhibited: true,
    clientGuaranteesProhibited: true
  }),
  hierarchy: Object.freeze([
    { id: 'new-york-state', name: 'New York', level: 'STATE', parentId: null },
    { id: 'new-york-city', name: 'New York City', level: 'CITY', parentId: 'new-york-state' },
    { id: 'kings-county', name: 'Brooklyn / Kings County', level: 'COUNTY_BOROUGH', parentId: 'new-york-city' },
    { id: 'downtown-brooklyn', name: 'Downtown Brooklyn / Civic Center', level: 'HYPERLOCAL_LEGAL_COMMUNITY', parentId: 'kings-county' }
  ]),
  communities: Object.freeze([
    Object.freeze({
      id: 'downtown-brooklyn',
      slug: 'downtown-brooklyn',
      name: 'Downtown Brooklyn / Civic Center Legal Community',
      shortName: 'Downtown Brooklyn / Civic Center',
      status: 'NOW_ORGANIZING',
      statusLabel: 'Now organizing',
      language: 'en',
      canonicalPath: '/communities/downtown-brooklyn',
      spanishPath: '/es/comunidades/downtown-brooklyn',
      parentIds: ['kings-county', 'new-york-city', 'new-york-state'],
      primaryPostalCodes: ['11201'],
      directoryQuery: Object.freeze({ postalCode: '11201', state: 'NY' }),
      boundary: Object.freeze({
        type: 'COURT_CENTERED_SERVICE_AREA',
        summary: 'A court-centered local area around Adams Street, Jay Street, Livingston Street, Court Street, Remsen Street, and Schermerhorn Street.',
        disclosure: 'This is a Smarter Justice organizing area, not a government, court, bar-association, neighborhood, office, jurisdiction, or service-area boundary.'
      }),
      publicPromise: 'Understand a local legal problem, find official court and community resources, and choose whether to contact a lawyer or firm.',
      professionalPromise: 'Stay current on the legal community around your practice, participate locally, and manage your professional presence and optional opportunities in one account.',
      founderOrigin: Object.freeze({
        title: 'Born in front of the Downtown Brooklyn courthouses',
        summary: 'Founder Roger’s Justice Truck idea began in the Downtown Brooklyn courthouse area while he operated Rock and Hammer Tax Services, its mobile tax-truck offices, and the office at 26 Court Street.',
        sourceType: 'FOUNDER_SUPPLIED_FIRST_PARTY_ACCOUNT',
        suppliedAt: '2026-09-01',
        noPartnershipClaim: true,
        noDateInferred: true
      }),
      courts: Object.freeze([
        Object.freeze({
          id: 'kings-supreme-civil',
          name: 'Kings County Supreme Court — Civil Term',
          address: '360 Adams Street, Brooklyn, NY 11201',
          url: 'https://www.nycourts.gov/courts/2nd-judicial-district/kings-county-supreme-court-civil-term',
          sourceName: 'New York State Unified Court System',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        }),
        Object.freeze({
          id: 'kings-family-court',
          name: 'Kings County Family Court',
          address: '330 Jay Street, Brooklyn, NY 11201',
          url: 'https://www.nycourts.gov/courts/2nd-judicial-district/kings-county-family-court',
          sourceName: 'New York State Unified Court System',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        }),
        Object.freeze({
          id: 'kings-supreme-criminal',
          name: 'Kings County Supreme Court — Criminal Term',
          address: '320 Jay Street, Brooklyn, NY 11201',
          url: 'https://www.nycourts.gov/courts/2nd-judicial-district/kings-county-supreme-court-criminal-term/general-information',
          sourceName: 'New York State Unified Court System',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        }),
        Object.freeze({
          id: 'kings-criminal-court',
          name: 'Kings County Criminal Court',
          address: '120 Schermerhorn Street, Brooklyn, NY 11201',
          url: 'https://www.nycourts.gov/new-york-city-criminal-court/nyc-criminal-court-general-information-locations',
          sourceName: 'New York State Unified Court System',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        })
      ]),
      publicResources: Object.freeze([
        Object.freeze({
          id: 'kings-civil-help-center',
          name: 'Kings County Supreme Court Civil Help Center',
          description: 'Free procedural information for people without a lawyer. The court lists Room 123 at 360 Adams Street and weekday hours on its official page.',
          address: '360 Adams Street, Room 123, Brooklyn, NY 11201',
          url: 'https://www.nycourts.gov/courts/kings-county-supreme-court-civil-term/help-center',
          sourceName: 'New York State Unified Court System',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        }),
        Object.freeze({
          id: 'kings-court-law-library',
          name: 'Kings County Public Access Law Library',
          description: 'The court lists a public access law library in Room 349 at 360 Adams Street.',
          address: '360 Adams Street, Room 349, Brooklyn, NY 11201',
          url: 'https://www.nycourts.gov/courts/2nd-judicial-district/kings-county-supreme-court-criminal-term/general-information',
          sourceName: 'New York State Unified Court System',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        }),
        Object.freeze({
          id: 'legal-aid-brooklyn',
          name: 'The Legal Aid Society — Brooklyn Neighborhood Office',
          description: 'Civil legal services and program information from The Legal Aid Society.',
          address: '111 Livingston Street, Brooklyn, NY 11201',
          url: 'https://legalaidnyc.org/office/brooklyn-neighborhood-office/',
          sourceName: 'The Legal Aid Society',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        }),
        Object.freeze({
          id: 'brooklyn-legal-services',
          name: 'Brooklyn Legal Services',
          description: 'Free civil legal help information for eligible Brooklyn residents.',
          address: '105 Court Street, Brooklyn, NY 11201',
          url: 'https://www.legalservicesnyc.org/boroughs/brooklyn-legal-services/',
          sourceName: 'Legal Services NYC',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        }),
        Object.freeze({
          id: 'brooklyn-defender-services',
          name: 'Brooklyn Defender Services',
          description: 'Public contact and program information for Brooklyn Defender Services.',
          address: '177 Livingston Street, Brooklyn, NY 11201',
          url: 'https://bds.org/contact',
          sourceName: 'Brooklyn Defender Services',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        }),
        Object.freeze({
          id: 'access-justice-brooklyn',
          name: 'Access Justice Brooklyn',
          description: 'Pro bono civil legal-service and volunteer-program information.',
          address: 'Brooklyn, New York',
          url: 'https://www.accessjusticebrooklyn.org/',
          sourceName: 'Access Justice Brooklyn',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        })
      ]),
      professionalOrganizations: Object.freeze([
        Object.freeze({
          id: 'brooklyn-bar-association',
          name: 'Brooklyn Bar Association',
          description: 'Independent local bar association with programs and events. Smarter Justice is not claiming a partnership.',
          address: '123 Remsen Street, Brooklyn, NY 11201',
          url: 'https://brooklynbar.org/',
          sourceName: 'Brooklyn Bar Association',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        }),
        Object.freeze({
          id: 'brooklyn-bar-lawyer-referral',
          name: 'Brooklyn Bar Association Lawyer Referral Service',
          description: 'An independent certified lawyer-referral service. It is separate from Smarter Justice and has its own screening and terms.',
          address: '123 Remsen Street, Brooklyn, NY 11201',
          url: 'https://referral.brooklynbar.org/',
          sourceName: 'Brooklyn Bar Association Lawyer Referral Service',
          observedAt: '2026-09-01',
          reviewBy: '2026-12-01'
        })
      ]),
      currentSignals: Object.freeze([
        Object.freeze({
          id: 'court-term-nine-2026',
          type: 'COURT_CALENDAR',
          audience: ['PUBLIC', 'PROFESSIONAL'],
          title: 'New York court calendar: Term 9 is underway',
          summary: 'The official 2026 court calendar lists Term 9 from August 17 through September 13.',
          startsAt: '2026-08-17T00:00:00-04:00',
          expiresAt: '2026-09-14T00:00:00-04:00',
          sourceUrl: 'https://www.nycourts.gov/about-us/terms-court-calendar-holidays',
          sourceName: 'New York State Unified Court System',
          observedAt: '2026-09-01'
        }),
        Object.freeze({
          id: 'court-term-ten-2026',
          type: 'COURT_CALENDAR',
          audience: ['PUBLIC', 'PROFESSIONAL'],
          title: 'New York court calendar: Term 10 begins September 14',
          summary: 'The official 2026 court calendar lists Term 10 from September 14 through October 12.',
          startsAt: '2026-09-14T00:00:00-04:00',
          expiresAt: '2026-10-13T00:00:00-04:00',
          sourceUrl: 'https://www.nycourts.gov/about-us/terms-court-calendar-holidays',
          sourceName: 'New York State Unified Court System',
          observedAt: '2026-09-01'
        }),
        Object.freeze({
          id: 'bba-ai-ethics-courtroom-2026',
          type: 'PROFESSIONAL_EVENT',
          audience: ['PROFESSIONAL'],
          title: 'Brooklyn Bar program: AI and Ethics in the Courtroom',
          summary: 'The Brooklyn Bar Association calendar lists this program for September 16, 2026. Confirm details and registration with the organizer.',
          startsAt: '2026-09-16T00:00:00-04:00',
          expiresAt: '2026-09-17T00:00:00-04:00',
          sourceUrl: 'https://brooklynbar.org/?_swft=Conf&panel=browse&pg=semwebCatalog',
          sourceName: 'Brooklyn Bar Association',
          observedAt: '2026-09-01'
        }),
        Object.freeze({
          id: 'ny-attorney-advertising-rules-2026',
          type: 'PROFESSIONAL_RULE_UPDATE',
          audience: ['PROFESSIONAL'],
          title: 'New York attorney-advertising amendments are in effect',
          summary: 'The Appellate Divisions adopted amendments effective June 1, 2026. Lawyers should review the official order and their own obligations before publishing marketing material.',
          startsAt: '2026-06-01T00:00:00-04:00',
          expiresAt: '2026-12-01T00:00:00-05:00',
          sourceUrl: 'https://www.nycourts.gov/rules/requests-public-comment',
          sourceName: 'New York State Unified Court System',
          observedAt: '2026-09-01'
        })
      ]),
      participationPaths: Object.freeze([
        { id: 'local-education', name: 'Community legal education', description: 'Offer or join a clearly described public education program without implying an attorney-client relationship.' },
        { id: 'pro-bono-service', name: 'Pro bono and legal-service participation', description: 'Review opportunities published by the responsible organization and follow its qualification process.' },
        { id: 'professional-events', name: 'Professional events', description: 'Find source-linked local programs and confirm registration with the organizer.' },
        { id: 'user-selected-opportunities', name: 'User-selected Smarter Justice opportunities', description: 'Active members may separately opt in to eligible consultations, structured inquiries, or review requests when available.' }
      ]),
      memberHome: Object.freeze({
        sections: [
          { id: 'today', name: 'Today near you', description: 'Current source-linked court, professional, and community developments.' },
          { id: 'practice', name: 'For your practice', description: 'Local items filtered by the member’s selected practice areas without exposing private user matters.' },
          { id: 'participation', name: 'Ways to participate', description: 'Education, service, events, and other organization-led opportunities.' },
          { id: 'presence', name: 'Your community presence', description: 'Profile, firm, office, home-community, participating-community, and service-area controls kept factually distinct.' },
          { id: 'tools', name: 'Your practice tools', description: 'Scheduling, user-selected inquiries, review requests, follow-up, and team workflows where active.' }
        ],
        noSocialFeed: true,
        noFollowerCounts: true,
        noOpenComments: true
      })
    })
  ]),
  candidateCommunities: Object.freeze([
    { id: 'brooklyn-heights-dumbo', name: 'Brooklyn Heights / DUMBO', parentId: 'kings-county', status: 'RESEARCHING', statusLabel: 'Under research' },
    { id: 'williamsburg-greenpoint', name: 'Williamsburg / Greenpoint', parentId: 'kings-county', status: 'RESEARCHING', statusLabel: 'Under research' },
    { id: 'park-slope-gowanus', name: 'Park Slope / Gowanus', parentId: 'kings-county', status: 'RESEARCHING', statusLabel: 'Under research' },
    { id: 'flatbush-crown-heights', name: 'Flatbush / Crown Heights', parentId: 'kings-county', status: 'RESEARCHING', statusLabel: 'Under research' },
    { id: 'bay-ridge-bensonhurst', name: 'Bay Ridge / Bensonhurst', parentId: 'kings-county', status: 'RESEARCHING', statusLabel: 'Under research' }
  ]),
  viabilityStandard: Object.freeze({
    purpose: 'Name the smallest legal community that can remain useful and current.',
    dimensions: ['documented professional and firm presence', 'courts and legal institutions', 'legal-service organizations', 'professional activity', 'distinct local identity', 'repeatable source-linked content'],
    outcomes: ['LAUNCH_INDEPENDENTLY', 'COMBINE_WITH_NEIGHBORING_AREA', 'KEEP_AS_FILTER'],
    publicNumericScoreProhibited: true
  }),
  membership: Object.freeze({
    freeProfile: Object.freeze({ price: 0, includes: ['source-linked public facts', 'business contact information', 'correction requests', 'approved profile control', 'ordinary organic discovery'] }),
    plans: Object.freeze([
      { id: 'professional', name: 'Professional', monthlyDollars: 10, annualDollars: 100, seats: 1 },
      { id: 'team', name: 'Team', monthlyDollars: 29, annualDollars: 290, seats: 5 },
      { id: 'office', name: 'Office', monthlyDollars: 49, annualDollars: 490, seats: 15 },
      { id: 'enterprise', name: 'Enterprise / Network', monthlyDollars: null, annualDollars: null, seats: null }
    ]),
    includes: ['local legal-community home', 'source-linked local intelligence', 'community participation paths', 'professional presence tools', 'scheduling and follow-up tools where active', 'optional user-selected opportunity tools where active'],
    boundaries: ['no purchased credentials', 'no purchased verification', 'no hidden organic rank', 'no endorsement', 'no guaranteed clients, inquiries, matters, revenue, or results', 'no automatic attorney-client relationship']
  })
});

module.exports = { LEGAL_COMMUNITY_NETWORK };
