'use strict';

const PROFESSIONAL_NETWORK_STANDARD_VERSION = '1.4.0';
const PROFESSIONAL_NETWORK_SCHEMA_VERSION = '1.4.0';
const PORTAL_PROFESSIONAL_CONTRACT_VERSION = '1.4.0';

const ORGANIZATION_TYPES = ['individual practice','law firm','professional firm','legal services organization','enterprise or institution'];
const ORGANIZATION_STATUSES = ['draft','unclaimed','claim pending','claimed','verified','participating','suspended','archived'];
const OFFICE_STATUSES = ['draft','active','temporarily closed','closed','unverified'];
const SEAT_STATUSES = ['invited','pending','active','inactive','suspended','removed'];
const SEAT_ROLES = ['professional','firm administrator','billing administrator','staff','read only'];
const ASSIGNMENT_STATUSES = ['draft','evidence pending','owner review','approved','paused','rejected','superseded'];
const BILLING_ACCOUNT_STATUSES = ['not configured','pilot blocked','ready for approved checkout','active','past due','paused','cancelled','suspended'];
const ENTITLEMENT_STATUSES = ['not entitled','eligible after independent gates','active','paused','suspended','expired'];
const CONTRACT_STATES = ['D0_CONCEPT_ONLY','D1_CONTRACT_DOCUMENTED','D2_SCHEMAS_FIXTURES_AND_TESTS_PASS','D3_ADAPTER_TESTS_PASS','D4_STAGING_VERIFIED','D5_PRODUCTION_VERIFIED'];

const PROFESSIONAL_NETWORK_RULES = Object.freeze({
  oneAccount: 'A professional should use one Smarter Justice account across every qualifying legal portal.',
  oneFirmOrganization: 'A firm should use one Smarter Justice organization account for its professionals, offices, practice groups, seats, billing, and permissions.',
  perSeatModel: 'Firm membership is designed around active covered professional seats with owner-approved volume discounts, not a separate full base subscription for every portal.',
  evidenceBeforePlacement: 'Each individual portal assignment requires individual-level practice evidence. A firm practice page alone does not establish every individual professional specialty.',
  paymentSeparation: 'Payment never establishes identity, credential status, practice evidence, firm authority, availability, organic rank, endorsement, inquiry eligibility, or outcome.',
  correctionAccess: 'A professional or firm never has to pay to correct, dispute, suppress, or remove an inaccurate public fact.',
  portalExperience: 'Users discover and interact with professionals through the relevant legal portal; account, organization, seat, and billing administration remains centralized in Smarter Justice.',
  portalIndependence: 'Each legal portal remains authoritative for its own user journey, specialty safeguards, source evidence, public profile rendering, and local deployment.',
  noAutomaticWrites: 'Smarter Justice coordination exports are read-only by default and never mutate a legal portal repository, database, deployment, or user record automatically.',
  fixedFeesOnly: 'The architecture supports fixed subscription or platform charges where lawful and approved; it does not support percentage-of-fee or outcome-based compensation.',
  integratedPortalStandard: 'Every portal handoff carries the mandatory integrated legal-portal standard identity and release-conformance requirements without claiming portal implementation or deployment.'
});

const PORTAL_CONTRACT_ALLOWED_FIELDS = [
  'contractVersion','assignmentId','sourceRevision','approvedSourceRevision','recordFingerprint','distributionAction','suppressionState','portalId','portalName','sourcePortalIds','mappingState','professionalId','organizationId','seatId','officeIds','practiceAssignments','jurisdictions','languages','serviceMethods','publicProfileState','claimState','credentialState','sourceFreshness','participationState','availabilityState','inquiryEligibility','appointmentEligibility','membershipCoverageState','sponsorshipState','evidenceState','sourceOrigin','dataAuthority','portalPublicationState','publicationEligible','generatedAt'
];

const PORTAL_CONTRACT_PROHIBITED_FIELDS = [
  'password hashes or authentication secrets','payment card or bank data','Stripe secret identifiers or webhook payloads','user legal matters or intake facts','privileged or confidential communications','uploaded user documents','private professional claim evidence','private correction or dispute evidence','internal support conversations','production database credentials','automatic instructions to change portal data'
];

const PROFESSIONAL_NETWORK_GATES = Object.freeze({
  publicCheckout: false,
  liveBilling: false,
  publicInquiries: false,
  appointmentBooking: false,
  sponsoredPlacement: false,
  unrestrictedProfessionalRouting: false,
  automaticPortalWrites: false,
  crossPortalUserMatterTransfer: false,
  productionPortalAdapters: false,
  deployment: false
});

module.exports = {
  PROFESSIONAL_NETWORK_STANDARD_VERSION,
  PROFESSIONAL_NETWORK_SCHEMA_VERSION,
  PORTAL_PROFESSIONAL_CONTRACT_VERSION,
  ORGANIZATION_TYPES,
  ORGANIZATION_STATUSES,
  OFFICE_STATUSES,
  SEAT_STATUSES,
  SEAT_ROLES,
  ASSIGNMENT_STATUSES,
  BILLING_ACCOUNT_STATUSES,
  ENTITLEMENT_STATUSES,
  CONTRACT_STATES,
  PROFESSIONAL_NETWORK_RULES,
  PORTAL_CONTRACT_ALLOWED_FIELDS,
  PORTAL_CONTRACT_PROHIBITED_FIELDS,
  PROFESSIONAL_NETWORK_GATES
};
