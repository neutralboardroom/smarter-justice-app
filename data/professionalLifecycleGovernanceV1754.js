'use strict';

const RELEASE_VERSION='1.7.61';
const STANDARD_VERSION='1.0.0';

const FIELD_OWNERSHIP_CATEGORIES=Object.freeze([
  'CENTRAL_IDENTITY_OWNED','CENTRAL_ACCOUNT_OWNED','CENTRAL_CLAIMANT_CONTROLLED_AFTER_APPROVAL',
  'CENTRAL_SOURCE_GOVERNED','PORTAL_SPECIALTY_OWNED','PORTAL_PRESENTATION_OWNED',
  'PORTAL_SOURCE_CURRENTNESS_OWNED','DERIVED','READ_ONLY_PROJECTION','OWNER_STAFF_CONTROLLED',
  'SENSITIVE_NEVER_EXPORTED','DEPRECATED'
]);
const CONFLICT_STATES=Object.freeze([
  'NO_CONFLICT','CENTRAL_NEWER','PORTAL_NEWER','SOURCE_DISAGREEMENT','CLAIMANT_DISPUTE',
  'AUTHORITY_DISPUTE','SPECIALTY_DISPUTE','SUPPRESSION_CONFLICT','MANUAL_REVIEW_REQUIRED','RESOLVED_WITH_RECEIPT'
]);
const PROFILE_STATES=Object.freeze([
  'SOURCE_DISCOVERY','CANDIDATE_NORMALIZATION','DUPLICATE_REVIEW','SOURCE_REVIEW','SPECIALTY_REVIEW',
  'ACCEPTED_PRIVATE_CANDIDATE','PUBLIC_UNCLAIMED','CORRECTION_REQUESTED','CLAIM_REQUESTED',
  'CLAIMANT_IDENTITY_PENDING','CLAIMANT_AUTHORITY_PENDING','PROFESSIONAL_STATUS_PENDING','SPECIALTY_ELIGIBILITY_PENDING',
  'STAFF_REVIEW','CLAIMED','VERIFIED_CLAIMANT','APPROVED_EDIT','SUPPRESSED','REMOVED','PAID_MEMBERSHIP',
  'OPPORTUNITY_ELIGIBLE','OUTREACH','OPPORTUNITY_OFFERED','PRELIMINARY_ATTORNEY_ACCEPTANCE','REPRESENTATION_EXTERNAL'
]);
const FIRM_STATES=Object.freeze(['DISCOVERED','PRIVATE_CANDIDATE','PUBLIC_UNCLAIMED','CLAIM_REQUESTED','AUTHORITY_PENDING','CLAIMED','VERIFIED','SUSPENDED','SUPPRESSED','REMOVED','CLOSED','MERGED','RENAMED']);
const OFFICE_STATES=Object.freeze(['PROPOSED','SOURCE_SUPPORTED','ACTIVE_PUBLIC','PRIVATE','MOVED','CLOSED','DUPLICATE','SUPERSEDED','REMOVED']);
const SEAT_STATES=Object.freeze(['UNASSIGNED','INVITED','INVITATION_EXPIRED','CLAIMED','IDENTITY_PENDING','ACTIVE','PAUSED','SUSPENDED','REMOVED','TRANSFERRED','CANCELED','HISTORICAL']);
const ROSTER_STATES=Object.freeze(['SOURCE_SUPPORTED','CLAIMANT_ASSERTED','ATTORNEY_CONFIRMED','FIRM_CONFIRMED','DISPUTED','ENDED','STALE','SUPPRESSED','REMOVED']);
const BILLING_STATES=Object.freeze([
  'PLAN_DEFINED','PRICE_VERSIONED','APPLICATION_PENDING','APPLICATION_APPROVED','CHECKOUT_CREATED','PAYMENT_PENDING',
  'PAYMENT_SUCCEEDED','PAYMENT_FAILED','WEBHOOK_VERIFIED','MEMBERSHIP_PENDING_ACTIVATION','ACTIVE_MEMBERSHIP',
  'GRACE_PERIOD','PAST_DUE','PAUSED','CANCELED_AT_PERIOD_END','CANCELED_IMMEDIATELY','REFUNDED',
  'PARTIALLY_REFUNDED','DISPUTED_CHARGEBACK','RESTORED','EXPIRED','HISTORICAL'
]);
const NOTIFICATION_CLASSES=Object.freeze([
  'SECURITY_CRITICAL','ACCOUNT_TRANSACTIONAL','PROFILE_CLAIM_TRANSACTIONAL','BILLING_TRANSACTIONAL',
  'OPPORTUNITY_TRANSACTIONAL','APPOINTMENT_TRANSACTIONAL','SUPPORT_COMPLAINT_TRANSACTIONAL',
  'OPERATIONAL_INCIDENT','LEGALLY_REQUIRED','PROFESSIONAL_OUTREACH','MARKETING','OWNER_STAFF_INTERNAL'
]);
const GATES=Object.freeze({
  publicProfilePublication:false, publicCheckout:false, liveBilling:false, paidGrowth:false,
  opportunityDelivery:false, publicAppointments:false, publicReviews:false, automaticPortalWrites:false,
  livePortalConnections:false, confidentialUploads:false, sensitiveExternalAI:false, deployment:false
});

const FIELD_OWNERSHIP_MATRIX=Object.freeze([
  {field:'professionalId',owner:'CENTRAL_IDENTITY_OWNED',export:'READ_ONLY_PROJECTION',conflictPolicy:'central stable identifier never changes through portal edits'},
  {field:'legalName',owner:'CENTRAL_IDENTITY_OWNED',export:'READ_ONLY_PROJECTION',conflictPolicy:'authority evidence and manual review required'},
  {field:'displayName',owner:'CENTRAL_CLAIMANT_CONTROLLED_AFTER_APPROVAL',export:'READ_ONLY_PROJECTION',conflictPolicy:'newer accepted central revision controls shared projection'},
  {field:'verifiedAccountLink',owner:'CENTRAL_ACCOUNT_OWNED',export:'READ_ONLY_PROJECTION',conflictPolicy:'never accepted from portal write-back'},
  {field:'firmAuthority',owner:'CENTRAL_ACCOUNT_OWNED',export:'SENSITIVE_NEVER_EXPORTED',conflictPolicy:'separate organization and roster evidence required'},
  {field:'billingState',owner:'CENTRAL_ACCOUNT_OWNED',export:'SENSITIVE_NEVER_EXPORTED',conflictPolicy:'payment never changes profile facts'},
  {field:'publicBusinessContact',owner:'CENTRAL_CLAIMANT_CONTROLLED_AFTER_APPROVAL',export:'READ_ONLY_PROJECTION',conflictPolicy:'source refresh cannot erase approved claimant correction'},
  {field:'credentialSourceStatus',owner:'CENTRAL_SOURCE_GOVERNED',export:'READ_ONLY_PROJECTION',conflictPolicy:'source disagreement requires dated evidence and review'},
  {field:'portalSpecialtyEligibility',owner:'PORTAL_SPECIALTY_OWNED',export:'READ_ONLY_PROJECTION',conflictPolicy:'one portal cannot activate another portal'},
  {field:'portalNarrative',owner:'PORTAL_PRESENTATION_OWNED',export:'READ_ONLY_PROJECTION',conflictPolicy:'central shared edits cannot overwrite specialty narrative'},
  {field:'portalCanonicalUrl',owner:'PORTAL_PRESENTATION_OWNED',export:'READ_ONLY_PROJECTION',conflictPolicy:'one canonical attorney and one canonical firm page per applicable portal'},
  {field:'portalSourceCurrentness',owner:'PORTAL_SOURCE_CURRENTNESS_OWNED',export:'READ_ONLY_PROJECTION',conflictPolicy:'portal retains local source date and correction path'},
  {field:'organicRank',owner:'DERIVED',export:'READ_ONLY_PROJECTION',conflictPolicy:'payment, sponsorship and advertising spend are prohibited inputs'},
  {field:'supportNarrative',owner:'SENSITIVE_NEVER_EXPORTED',export:'SENSITIVE_NEVER_EXPORTED',conflictPolicy:'minimum necessary internal access only'},
  {field:'survivorNarrative',owner:'SENSITIVE_NEVER_EXPORTED',export:'SENSITIVE_NEVER_EXPORTED',conflictPolicy:'never enters portfolio, tour, analytics, logs or portal handoff'},
  {field:'safeContactChoice',owner:'SENSITIVE_NEVER_EXPORTED',export:'SENSITIVE_NEVER_EXPORTED',conflictPolicy:'never enters notification provider metadata'}
]);

const COMMUNICATION_KIND_CLASS=Object.freeze({
  professional_email_verification:'SECURITY_CRITICAL', professional_password_reset:'SECURITY_CRITICAL',
  free_question_received:'ACCOUNT_TRANSACTIONAL', private_continuation_link_requested:'ACCOUNT_TRANSACTIONAL',
  more_information_needed:'ACCOUNT_TRANSACTIONAL', file_ready:'ACCOUNT_TRANSACTIONAL', case_upload_added:'ACCOUNT_TRANSACTIONAL',
  payment_step_requested:'BILLING_TRANSACTIONAL', payment_requested:'BILLING_TRANSACTIONAL', payment_received:'BILLING_TRANSACTIONAL',
  payment_received_webhook:'BILLING_TRANSACTIONAL', professional_review_recommended:'ACCOUNT_TRANSACTIONAL',
  community_partner_credit_update:'ACCOUNT_TRANSACTIONAL', support_update:'SUPPORT_COMPLAINT_TRANSACTIONAL',
  complaint_update:'SUPPORT_COMPLAINT_TRANSACTIONAL', opportunity_update:'OPPORTUNITY_TRANSACTIONAL',
  appointment_update:'APPOINTMENT_TRANSACTIONAL', operational_incident:'OPERATIONAL_INCIDENT',
  professional_outreach:'PROFESSIONAL_OUTREACH', marketing:'MARKETING'
});

const PUBLIC_HEALTH_MODEL=Object.freeze({
  liveness:{meaning:'process can answer a minimal request',mayBePublic:true},
  readiness:{meaning:'required production dependencies and migrations are accepted',mayBePublic:false},
  dependencyHealth:{meaning:'database, email, queue, monitoring, backup and restore state',mayBePublic:false},
  publicStatus:{meaning:'privacy-minimized service availability without secrets, identities or raw errors',mayBePublic:true}
});

const RETENTION_MODEL=Object.freeze({
  profileEvidence:'retain while current plus governed historical receipts',
  accountSecurity:'retain only for security, legal and recovery needs under approved schedule',
  notificationMetadata:'retain minimum delivery truth; never retain message secrets or unnecessary matter narrative',
  support:'retain minimum necessary case facts and decisions; avoid legal narratives',
  deletion:'state-specific deletion or suppression with receipt; backups age out through documented rotation',
  legalHold:'explicit scoped hold blocks destructive deletion without converting data into public truth',
  export:'authenticated, authorized, scoped, receipted and privacy-minimized'
});

module.exports={RELEASE_VERSION,STANDARD_VERSION,FIELD_OWNERSHIP_CATEGORIES,CONFLICT_STATES,PROFILE_STATES,FIRM_STATES,OFFICE_STATES,SEAT_STATES,ROSTER_STATES,BILLING_STATES,NOTIFICATION_CLASSES,GATES,FIELD_OWNERSHIP_MATRIX,COMMUNICATION_KIND_CLASS,PUBLIC_HEALTH_MODEL,RETENTION_MODEL};
