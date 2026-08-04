'use strict';

const PROFESSIONAL_PORTAL_HANDOFF_SCHEMA_VERSION='1.4.0';
const ADAPTER_FIXTURE_VERSION='1.3.0';
const INTEGRATED_PORTAL_STANDARD_VERSION='1.0.0';
const INTEGRATED_PORTAL_STANDARD_PATH='LEGAL_MICRO_PORTAL_INTEGRATED_STANDARD_V1.0.0.md';
const REQUIRED_HANDOFF_FIELDS=['handoffVersion','handoffDigest','sourceSystem','destinationPortalId','contract','portalBuildStandard','publicationPolicy','assignments','profiles','firms','containsUserMatterData','containsCredentials','containsPaymentData','containsConfidentialData','automaticWrites','liveConnection','generatedAt'];
const REQUIRED_STANDARD_FIELDS=['standardId','standardVersion','standardPath','conformanceState','exactArtifactAuthority','dualMissionRequired','profileMetricsRequired','completeSurfaceAuditRequired','exactArtifactTestingRequired','ownerActivationRequired'];
const REQUIRED_ASSIGNMENT_FIELDS=['contractVersion','assignmentId','sourceRevision','approvedSourceRevision','recordFingerprint','distributionAction','suppressionState','portalId','sourcePortalIds','mappingState','professionalId','organizationId','seatId','officeIds','practiceAssignments','jurisdictions','languages','serviceMethods','publicProfileState','claimState','credentialState','sourceFreshness','participationState','availabilityState','inquiryEligibility','appointmentEligibility','membershipCoverageState','sponsorshipState','evidenceState','sourceOrigin','dataAuthority','portalPublicationState','publicationEligible','generatedAt'];
const PROHIBITED_KEY_PATTERNS=[/password/i,/secret/i,/api.?key/i,/payment.?card/i,/bank.?account/i,/stripe.?secret/i,/webhook.?payload/i,/legal.?matter/i,/intake.?fact/i,/privileged/i,/confidential.?communication/i,/uploaded.?document/i,/private.?claim.?evidence/i,/support.?conversation/i,/database.?credential/i,/automatic.?instruction/i];
module.exports={PROFESSIONAL_PORTAL_HANDOFF_SCHEMA_VERSION,ADAPTER_FIXTURE_VERSION,INTEGRATED_PORTAL_STANDARD_VERSION,INTEGRATED_PORTAL_STANDARD_PATH,REQUIRED_HANDOFF_FIELDS,REQUIRED_STANDARD_FIELDS,REQUIRED_ASSIGNMENT_FIELDS,PROHIBITED_KEY_PATTERNS};
