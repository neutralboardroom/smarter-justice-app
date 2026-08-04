'use strict';

const store = require('./store');
const crypto = require('crypto');
const marketplace = require('./professionalMarketplace');
const portfolioTruth = require('./portfolioTruth');
const portalPresence = require('./portalPresenceManagement');
const {
  PROFESSIONAL_NETWORK_STANDARD_VERSION,
  PROFESSIONAL_NETWORK_SCHEMA_VERSION,
  PORTAL_PROFESSIONAL_CONTRACT_VERSION,
  ORGANIZATION_STATUSES,
  OFFICE_STATUSES,
  SEAT_STATUSES,
  SEAT_ROLES,
  ASSIGNMENT_STATUSES,
  BILLING_ACCOUNT_STATUSES,
  ENTITLEMENT_STATUSES,
  PROFESSIONAL_NETWORK_RULES,
  PORTAL_CONTRACT_ALLOWED_FIELDS,
  PORTAL_CONTRACT_PROHIBITED_FIELDS,
  PROFESSIONAL_NETWORK_GATES
} = require('../data/professionalNetworkStandard');
const { resolveProfessionalPortalId, PROFESSIONAL_PORTAL_ALIAS_VERSION } = require('../data/professionalPortalAliases');

const STORE_KEY = 'professionalNetwork.json';
const MAX_LIST = 250;

function clean(value, max = 1200) { return String(value == null ? '' : value).trim().slice(0, max); }
function list(value, maxItems = MAX_LIST, maxLength = 300) {
  const source = Array.isArray(value) ? value : String(value || '').split(/\r?\n|,/);
  return [...new Set(source.map((item) => clean(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}
function oneOf(value, allowed, fallback) { return allowed.includes(value) ? value : fallback; }
function bool(value, fallback = false) { if (typeof value === 'boolean') return value; if (value == null || value === '') return fallback; return /^(1|true|yes|on)$/i.test(String(value)); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function slug(value) { return clean(value, 160).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-').slice(0, 140); }
function stableId(prefix, value) { return `${prefix}:${slug(value) || store.uid(prefix, 8)}`; }
function now() { return store.now(); }
function stable(value){ if(Array.isArray(value))return value.map(stable); if(value&&typeof value==='object')return Object.keys(value).sort().reduce((out,key)=>{out[key]=stable(value[key]);return out;},{}); return value; }
function digest(value){return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');}
function withoutGeneratedAt(value){if(Array.isArray(value))return value.map(withoutGeneratedAt);if(value&&typeof value==='object')return Object.keys(value).reduce((out,key)=>{out[key]=key==='generatedAt'?null:withoutGeneratedAt(value[key]);return out;},{});return value;}
function initialState() {
  return {
    schemaVersion: PROFESSIONAL_NETWORK_SCHEMA_VERSION,
    standardVersion: PROFESSIONAL_NETWORK_STANDARD_VERSION,
    contractVersion: PORTAL_PROFESSIONAL_CONTRACT_VERSION,
    organizations: [], offices: [], seats: [], practiceAssignments: [], portalAssignments: [], billingAccounts: [], entitlementRecords: [], contractOverrides: [], synchronizationRuns: [], updatedAt: ''
  };
}
function normalize(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    ...initialState(),
    ...source,
    schemaVersion: PROFESSIONAL_NETWORK_SCHEMA_VERSION,
    standardVersion: PROFESSIONAL_NETWORK_STANDARD_VERSION,
    contractVersion: PORTAL_PROFESSIONAL_CONTRACT_VERSION,
    organizations: Array.isArray(source.organizations) ? source.organizations : [],
    offices: Array.isArray(source.offices) ? source.offices : [],
    seats: Array.isArray(source.seats) ? source.seats : [],
    practiceAssignments: Array.isArray(source.practiceAssignments) ? source.practiceAssignments : [],
    portalAssignments: Array.isArray(source.portalAssignments) ? source.portalAssignments : [],
    billingAccounts: Array.isArray(source.billingAccounts) ? source.billingAccounts : [],
    entitlementRecords: Array.isArray(source.entitlementRecords) ? source.entitlementRecords : [],
    contractOverrides: Array.isArray(source.contractOverrides) ? source.contractOverrides : [],
    synchronizationRuns: Array.isArray(source.synchronizationRuns) ? source.synchronizationRuns.slice(0, 50) : []
  };
}
function readState() { return normalize(store.readJson(STORE_KEY, initialState())); }
function writeState(state) { const next = { ...normalize(state), updatedAt: now() }; store.writeJson(STORE_KEY, next); return next; }
function mergeById(derived, stored, overrideFields = []) {
  const byId = new Map((stored || []).map((row) => [row.id, row]));
  return derived.map((row) => {
    const saved = byId.get(row.id) || {};
    const overrides = {};
    for (const field of overrideFields) if (Object.prototype.hasOwnProperty.call(saved, field)) overrides[field] = saved[field];
    return { ...row, ...overrides, id: row.id, sourceRecordId: row.sourceRecordId || saved.sourceRecordId || '' };
  });
}
function officeParts(value) {
  const raw = clean(value, 400);
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const postalMatch = raw.match(/\b\d{5}(?:-\d{4})?\b/);
  return { addressLine: raw, city: parts.length >= 3 ? parts[parts.length - 3] : '', state: parts.length >= 2 ? parts[parts.length - 2].replace(/\s+\d{5}(?:-\d{4})?$/, '') : '', postalCode: postalMatch ? postalMatch[0] : '' };
}
function derivedOrganizations(owner) {
  const firmOrgs = (owner.firms || []).map((firm) => ({
    id: `organization:firm:${firm.id}`, sourceRecordId: firm.id, organizationType: 'law firm', name: firm.name, status: firm.claimStatus === 'claimed' ? 'claimed' : firm.verificationStatus === 'verified' ? 'verified' : 'unclaimed', accountModel: 'one Smarter Justice firm organization account', billingModel: 'fixed per-covered-professional seat subscription', seatCount: Math.max(Number(firm.seatCount || 0), (firm.professionalIds || []).length, 1), activeSeatCount: Number(firm.activeSeatCount || 0), professionalIds: [...(firm.professionalIds || [])], officeIds: (firm.locations || []).map((location, index) => `office:firm:${firm.id}:${index + 1}`), practiceAreas: [...(firm.practiceAreas || [])], portalEligibility: [...(firm.portalEligibility || [])], claimState: firm.claimStatus || 'not claimed', verificationState: firm.verificationStatus || 'not started', authorityState: firm.ownerApprovalStatus || 'draft', membershipState: firm.membership?.status || 'none', billingAdministratorName: firm.billingAdministratorName || '', billingAdministratorEmail: firm.billingAdministratorEmail || '', evidenceState: firm.sourceSeeded ? 'SOURCE_OBSERVED' : 'OWNER_RECORDED', updatedAt: firm.updatedAt || ''
  }));
  const individualOrgs = (owner.professionals || []).filter((professional) => !professional.firmId).map((professional) => ({
    id: `organization:individual:${professional.id}`, sourceRecordId: professional.id, organizationType: 'individual practice', name: professional.displayName, status: professional.claimStatus === 'claimed' ? 'claimed' : professional.verificationStatus === 'verified' ? 'verified' : 'unclaimed', accountModel: 'one Smarter Justice professional account', billingModel: 'fixed individual subscription', seatCount: 1, activeSeatCount: professional.membership?.status === 'active' ? 1 : 0, professionalIds: [professional.id], officeIds: (professional.officeLocations || []).map((location, index) => `office:professional:${professional.id}:${index + 1}`), practiceAreas: [...(professional.practiceAreas || [])], portalEligibility: [...(professional.portalEligibility || [])], claimState: professional.claimStatus || 'not claimed', verificationState: professional.verificationStatus || 'not started', authorityState: professional.ownerApprovalStatus || 'draft', membershipState: professional.membership?.status || 'none', billingAdministratorName: professional.displayName, billingAdministratorEmail: professional.email || '', evidenceState: professional.sourceSeeded ? 'SOURCE_OBSERVED' : 'OWNER_RECORDED', updatedAt: professional.updatedAt || ''
  }));
  return [...firmOrgs, ...individualOrgs];
}
function derivedOffices(owner) {
  const rows = [];
  for (const firm of owner.firms || []) {
    (firm.locations || []).forEach((location, index) => rows.push({ id:`office:firm:${firm.id}:${index + 1}`, organizationId:`organization:firm:${firm.id}`, sourceRecordId:firm.id, label:index === 0 ? 'Primary office' : `Office ${index + 1}`, status:'unverified', ...officeParts(location), jurisdictions:[...(firm.jurisdictions || [])], serviceRegions:[...(firm.serviceRegions || [])], portalAssignments:[...(firm.portalEligibility || [])], sourceOfTruth:'Professional marketplace firm record', evidenceState:firm.sourceSeeded?'SOURCE_OBSERVED':'OWNER_RECORDED', updatedAt:firm.updatedAt || '' }));
  }
  for (const professional of owner.professionals || []) {
    if (professional.firmId) continue;
    (professional.officeLocations || []).forEach((location, index) => rows.push({ id:`office:professional:${professional.id}:${index + 1}`, organizationId:`organization:individual:${professional.id}`, sourceRecordId:professional.id, label:index === 0 ? 'Primary office' : `Office ${index + 1}`, status:'unverified', ...officeParts(location), jurisdictions:[...(professional.jurisdictions || [])], serviceRegions:[...(professional.serviceRegions || [])], portalAssignments:[...(professional.portalEligibility || [])], sourceOfTruth:'Professional marketplace individual record', evidenceState:professional.sourceSeeded?'SOURCE_OBSERVED':'OWNER_RECORDED', updatedAt:professional.updatedAt || '' }));
  }
  return rows;
}
function organizationIdForProfessional(professional) { return professional.firmId ? `organization:firm:${professional.firmId}` : `organization:individual:${professional.id}`; }
function officeIdsForProfessional(owner, professional) {
  if (!professional.firmId) return (professional.officeLocations || []).map((location, index) => `office:professional:${professional.id}:${index + 1}`);
  const firm = (owner.firms || []).find((row) => row.id === professional.firmId);
  return (firm?.locations || []).map((location, index) => `office:firm:${professional.firmId}:${index + 1}`);
}
function derivedSeats(owner) {
  return (owner.professionals || []).map((professional) => ({
    id:`seat:professional:${professional.id}`, organizationId:organizationIdForProfessional(professional), professionalId:professional.id, sourceRecordId:professional.id, displayName:professional.displayName, seatRole:'professional', status:professional.membership?.status === 'active' ? 'active' : 'pending', coveredByFirmId:professional.membership?.coveredByFirmId || professional.firmId || '', directMembershipPlanId:professional.membership?.planId || '', membershipCoverageState:professional.membership?.status === 'active' ? 'active' : professional.firmId ? 'firm coverage not active' : 'individual coverage not active', verificationState:professional.verificationStatus || 'not started', credentialState:(professional.credentials || []).some((credential) => credential.status === 'active') ? 'active credential recorded' : 'no active credential recorded', participationState:professional.profileStatus === 'participating' ? 'participating' : 'not participating', portalAssignmentIds:(professional.portalEligibility || []).map((portalId) => `portal-assignment:${professional.id}:${portalId}`), officeIds:officeIdsForProfessional(owner, professional), evidenceState:professional.sourceSeeded?'SOURCE_OBSERVED':'OWNER_RECORDED', updatedAt:professional.updatedAt || ''
  }));
}
function derivedPracticeAssignments(owner) {
  const rows=[];
  for (const professional of owner.professionals || []) {
    for (const practiceArea of professional.practiceAreas || []) rows.push({ id:`practice-assignment:${professional.id}:${slug(practiceArea)}`, professionalId:professional.id, organizationId:organizationIdForProfessional(professional), practiceArea, status:(professional.sourceRecords || []).length ? 'evidence pending' : 'draft', evidenceRequirement:'Individual-level professional or firm-team source supporting this professional’s practice. A firm practice page alone is insufficient.', sourceRecordIds:(professional.sourceRecords || []).map((source) => source.id).filter(Boolean), evidenceState:(professional.sourceRecords || []).length ? 'SOURCE_OBSERVED' : 'MISSING', ownerApproved:false, updatedAt:professional.updatedAt || '' });
  }
  return rows;
}
function derivedPortalAssignments(owner) {
  const rows=[];
  for (const professional of owner.professionals || []) {
    const grouped=new Map();
    for (const sourcePortalId of professional.portalEligibility || []) {
      const resolution=resolveProfessionalPortalId(sourcePortalId);
      if(!resolution.canonicalPortalId) continue;
      const key=resolution.canonicalPortalId;
      const current=grouped.get(key)||{canonicalPortalId:key,sourcePortalIds:[],mappingStates:[]};
      current.sourcePortalIds.push(resolution.sourcePortalId);
      current.mappingStates.push(resolution.state);
      grouped.set(key,current);
    }
    for (const group of grouped.values()) {
      const portalId=group.canonicalPortalId;
      const sourcePortalIds=[...new Set(group.sourcePortalIds)].sort();
      const mappingState=group.mappingStates.some((state)=>state==='LEGACY_ALIAS_MAPPED')?'LEGACY_ALIAS_MAPPED':'CANONICAL_ID';
      const sourceObserved=(professional.sourceRecords || []).length > 0;
      rows.push({ id:`portal-assignment:${professional.id}:${portalId}`, portalId, sourcePortalIds, mappingState, mappingVersion:PROFESSIONAL_PORTAL_ALIAS_VERSION, professionalId:professional.id, organizationId:organizationIdForProfessional(professional), seatId:`seat:professional:${professional.id}`, status:'evidence pending', practiceAssignmentIds:(professional.practiceAreas || []).map((practiceArea) => `practice-assignment:${professional.id}:${slug(practiceArea)}`), officeIds:officeIdsForProfessional(owner, professional), jurisdictions:[...(professional.jurisdictions || [])], languages:[...(professional.languages || [])], serviceMethods:[...(professional.consultationModes || professional.serviceMethods || [])], publicProfileState:professional.publicProfileEnabled ? professional.profileStatus : 'not published', claimState:professional.claimStatus || 'not claimed', credentialState:professional.verificationStatus || 'not started', sourceFreshness:{ state:sourceObserved?'SOURCE_OBSERVED':'PROFESSIONAL_SUPPLIED', reviewedAt:professional.updatedAt || null, sourceCount:(professional.sourceRecords || []).length }, participationState:professional.profileStatus === 'participating' ? 'participating' : 'not participating', availabilityState:professional.availabilityStatus || 'not configured', inquiryEligibility:Boolean(professional.eligibility?.consultationEligible), appointmentEligibility:false, membershipCoverageState:professional.eligibility?.paidMembership ? 'qualifying coverage present' : 'no qualifying active coverage', sponsorshipState:professional.sponsorship?.status || 'none', paymentAffectsAssignment:false, sourceRevision:Math.max(1,Number(professional.profileRevision||1)), approvedSourceRevision:0, evidenceState:sourceObserved ? 'SOURCE_OBSERVED' : 'PROFESSIONAL_SUPPLIED', sourceOrigin:professional.sourceOrigin || (professional.sourceSeeded ? 'public-source-seed' : 'manual-entry'), dataAuthority:professional.dataAuthority || (professional.sourceSeeded ? 'source-supported' : 'professional-supplied'), portalPublicationState:professional.portalPublicationState || 'not distributed', publicationEligible:false, updatedAt:professional.updatedAt || '' });
    }
  }
  return rows;
}
function unresolvedPortalAssignments(owner) {
  const rows=[];
  for (const professional of owner.professionals || []) {
    for (const sourcePortalId of professional.portalEligibility || []) {
      const resolution=resolveProfessionalPortalId(sourcePortalId);
      if(resolution.canonicalPortalId) continue;
      rows.push({id:`unresolved-portal-assignment:${professional.id}:${slug(resolution.sourcePortalId)}`,professionalId:professional.id,displayName:professional.displayName,organizationId:organizationIdForProfessional(professional),sourcePortalId:resolution.sourcePortalId,mappingState:resolution.state,reason:resolution.reason,evidenceState:(professional.sourceRecords||[]).length?'SOURCE_OBSERVED':'MISSING',nextAction:'Review the individual professional evidence and choose a current destination explicitly. Do not infer or auto-map.',automaticWrites:false});
    }
  }
  return rows;
}
function derivedBillingAccounts(owner) {
  const organizations=derivedOrganizations(owner);
  return organizations.map((organization) => ({ id:`billing:${organization.id}`, organizationId:organization.id, billingOwner:'Smarter Justice professional business layer', billingModel:organization.billingModel, status:organization.membershipState === 'active' ? 'active' : 'pilot blocked', planId:'', seatCount:organization.seatCount, activeSeatCount:organization.activeSeatCount, volumeDiscountState:organization.organizationType === 'law firm' ? 'owner-approved tier foundation available' : 'not applicable', externalCustomerReferencePresent:false, paymentActivation:false, pricingActivation:false, publicCheckout:false, disclosure:'No live charge, subscription, portal placement, inquiry, appointment, verification, or ranking is activated by this record.', evidenceState:'OWNER_RECORDED', updatedAt:organization.updatedAt || '' }));
}
function derivedEntitlements(owner) {
  return (owner.professionals || []).map((professional) => ({ id:`entitlement:professional:${professional.id}`, professionalId:professional.id, organizationId:organizationIdForProfessional(professional), status:professional.eligibility?.consultationEligible ? 'eligible after independent gates' : 'not entitled', membershipCoverage:Boolean(professional.eligibility?.paidMembership), identityAndCredentialVerified:professional.verificationStatus === 'verified' && (professional.credentials || []).some((credential) => credential.status === 'active'), ownerApproved:professional.ownerApprovalStatus === 'approved', termsAccepted:Boolean(professional.marketplaceTermsAcceptedAt && professional.independentProfessionalAcknowledgmentAt && professional.conflictsPolicyAcceptedAt), portalAssignments:(professional.portalEligibility || []).length, activeServices:Number(professional.eligibility?.activeServiceCount || 0), inquiryEligibility:Boolean(professional.eligibility?.consultationEligible), appointmentEligibility:false, sponsorshipAffectsEntitlement:false, paymentAloneSufficient:false, reasons:[...(professional.eligibility?.reasons || [])], warnings:[...(professional.eligibility?.warnings || [])], evidenceState:'OWNER_RECORDED', evaluatedAt:professional.eligibility?.evaluatedAt || now() }));
}
function portalContracts(state) {
  const overrides=new Map((state.contractOverrides || []).map((row) => [row.portalId,row]));
  return portfolioTruth.enrichedPortals().map((portal) => ({
    contractId:`professional-contract:${portal.portalId}:v${PORTAL_PROFESSIONAL_CONTRACT_VERSION}`,
    contractVersion:PORTAL_PROFESSIONAL_CONTRACT_VERSION,
    portalId:portal.portalId,
    portalName:portal.name,
    portalEvidenceState:portal.evidenceState,
    contractState:'D3_ADAPTER_TESTS_PASS',
    adapterMode:'LOCAL_READ_ONLY_CONSUMER_SIMULATION',
    sourceSystem:'Smarter Justice centralized professional business layer',
    destinationSystem:`Independent legal portal: ${portal.name}`,
    direction:'Smarter Justice to portal — read-only export by default',
    userExperienceOwner:portal.portalId === 'general-smarter-justice-start' ? 'Smarter Justice' : portal.name,
    accountAndBillingOwner:'Smarter Justice',
    professionalRecordOwner:'Dedicated portal for specialty rendering and source-specific public facts; Smarter Justice for shared account, organization, seat, and billing metadata.',
    allowedFields:[...PORTAL_CONTRACT_ALLOWED_FIELDS],
    prohibitedFields:[...PORTAL_CONTRACT_PROHIBITED_FIELDS],
    rules:{ paymentDoesNotBuyVerification:true, paymentDoesNotBuyPracticeAssignment:true, paymentDoesNotBuyOrganicRank:true, individualEvidenceRequired:true, correctionNeverRequiresPayment:true, noAutomaticWrites:true, noUserMatterTransfer:true },
    liveConnection:false,
    automaticWrites:false,
    stagingVerified:false,
    productionVerified:false,
    ...(overrides.get(portal.portalId) || {})
  }));
}
function buildView() {
  const owner=marketplace.getOwnerData();
  const state=readState();
  const organizations=mergeById(derivedOrganizations(owner),state.organizations,['ownerNotes']);
  const offices=mergeById(derivedOffices(owner),state.offices,['label','status','addressLine','city','state','postalCode','jurisdictions','serviceRegions','portalAssignments','evidenceState','ownerNotes','updatedAt']);
  const seats=mergeById(derivedSeats(owner),state.seats,['seatRole','status','officeIds','ownerNotes','updatedAt']);
  const practiceAssignments=mergeById(derivedPracticeAssignments(owner),state.practiceAssignments,['status','sourceRecordIds','evidenceRequirement','evidenceState','ownerApproved','ownerNotes','updatedAt']);
  const portalAssignments=mergeById(derivedPortalAssignments(owner),state.portalAssignments,['status','practiceAssignmentIds','officeIds','evidenceState','ownerApproved','portalPublicationState','approvedSourceRevision','ownerNotes','updatedAt']).map((assignment)=>{
    const professional=(owner.professionals || []).find((row)=>row.id===assignment.professionalId);
    const portalPublicationState=assignment.portalPublicationState || professional?.portalPublicationState || 'not distributed';
    const readiness=professional?marketplace.professionalProfileReadiness(professional):null; const publicationEligible=Boolean(professional && readiness?.currentRevisionSubmitted && readiness.reviewStatus==='approved' && Number(assignment.approvedSourceRevision||0)===Number(readiness.profileRevision||0) && assignment.status==='approved' && assignment.ownerApproved && professional.ownerApprovalStatus==='approved' && professional.verificationStatus==='verified' && ['approved for distribution','distributed','published'].includes(String(portalPublicationState).toLowerCase()));
    return {...assignment,portalPublicationState,publicationEligible};
  });
  const unresolvedAssignments=unresolvedPortalAssignments(owner);
  const billingAccounts=mergeById(derivedBillingAccounts(owner),state.billingAccounts);
  const entitlementRecords=mergeById(derivedEntitlements(owner),state.entitlementRecords);
  const contracts=portalContracts(state);
  const summary={ organizations:organizations.length, firmOrganizations:organizations.filter((row)=>row.organizationType==='law firm').length, individualOrganizations:organizations.filter((row)=>row.organizationType==='individual practice').length, offices:offices.length, seats:seats.length, activeSeats:seats.filter((row)=>row.status==='active').length, practiceAssignments:practiceAssignments.length, approvedPracticeAssignments:practiceAssignments.filter((row)=>row.status==='approved').length, portalAssignments:portalAssignments.length, approvedPortalAssignments:portalAssignments.filter((row)=>row.status==='approved').length, billingAccounts:billingAccounts.length, activeBillingAccounts:billingAccounts.filter((row)=>row.status==='active').length, entitlementRecords:entitlementRecords.length, inquiryEligible:entitlementRecords.filter((row)=>row.inquiryEligibility).length, portalContracts:contracts.length, livePortalConnections:contracts.filter((row)=>row.liveConnection).length, automaticPortalWrites:contracts.filter((row)=>row.automaticWrites).length, unresolvedPortalAssignments:unresolvedAssignments.length, canonicalPortalAssignments:portalAssignments.length, publicCheckout:PROFESSIONAL_NETWORK_GATES.publicCheckout, liveBilling:PROFESSIONAL_NETWORK_GATES.liveBilling };
  return { generatedAt:now(), schemaVersion:PROFESSIONAL_NETWORK_SCHEMA_VERSION, standardVersion:PROFESSIONAL_NETWORK_STANDARD_VERSION, contractVersion:PORTAL_PROFESSIONAL_CONTRACT_VERSION, scope:'One Smarter Justice professional account and firm organization system across the independent legal portal network.', rules:PROFESSIONAL_NETWORK_RULES, gates:PROFESSIONAL_NETWORK_GATES, summary, organizations, offices, seats, practiceAssignments, portalAssignments, billingAccounts, entitlementRecords, portalContracts:contracts, unresolvedPortalAssignments:unresolvedAssignments, synchronizationRuns:state.synchronizationRuns, updatedAt:state.updatedAt };
}
function ownerView() { return buildView(); }
function professionalView(account = {}) {
  const view=buildView();
  const professionalIds=new Set(account.professionalIds || []); const firmIds=new Set(account.firmIds || []);
  const organizationIds=new Set([...firmIds].map((id)=>`organization:firm:${id}`));
  for(const id of professionalIds) organizationIds.add(`organization:individual:${id}`);
  for(const seat of view.seats) if(professionalIds.has(seat.professionalId)) organizationIds.add(seat.organizationId);
  const seats=view.seats.filter((row)=>professionalIds.has(row.professionalId)||organizationIds.has(row.organizationId));
  const visibleProfessionalIds=new Set(seats.map((row)=>row.professionalId));
  return { generatedAt:view.generatedAt, standardVersion:view.standardVersion, contractVersion:view.contractVersion, rules:view.rules, gates:view.gates, summary:{ organizations:view.organizations.filter((row)=>organizationIds.has(row.id)).length, offices:view.offices.filter((row)=>organizationIds.has(row.organizationId)).length, seats:seats.length, practiceAssignments:view.practiceAssignments.filter((row)=>visibleProfessionalIds.has(row.professionalId)).length, portalAssignments:view.portalAssignments.filter((row)=>visibleProfessionalIds.has(row.professionalId)).length, activeBillingAccounts:view.billingAccounts.filter((row)=>organizationIds.has(row.organizationId)&&row.status==='active').length, inquiryEligible:view.entitlementRecords.filter((row)=>visibleProfessionalIds.has(row.professionalId)&&row.inquiryEligibility).length }, organizations:view.organizations.filter((row)=>organizationIds.has(row.id)), offices:view.offices.filter((row)=>organizationIds.has(row.organizationId)), seats, practiceAssignments:view.practiceAssignments.filter((row)=>visibleProfessionalIds.has(row.professionalId)), portalAssignments:view.portalAssignments.filter((row)=>visibleProfessionalIds.has(row.professionalId)), billingAccounts:view.billingAccounts.filter((row)=>organizationIds.has(row.organizationId)), entitlementRecords:view.entitlementRecords.filter((row)=>visibleProfessionalIds.has(row.professionalId)), disclosure:'One Smarter Justice account can manage qualifying participation across multiple legal portals. Payment, profile control, credential verification, practice evidence, portal assignment, participation, availability, inquiries, appointments, and organic ranking remain separate states.' };
}
function sanitizeOffice(input={},current={}) { return { ...current, id:clean(input.id || current.id,220), organizationId:clean(input.organizationId || current.organizationId,220), sourceRecordId:clean(input.sourceRecordId || current.sourceRecordId,220), label:clean(input.label ?? current.label,180), status:oneOf(input.status,OFFICE_STATUSES,current.status||'draft'), addressLine:clean(input.addressLine ?? current.addressLine,500), city:clean(input.city ?? current.city,120), state:clean(input.state ?? current.state,80), postalCode:clean(input.postalCode ?? current.postalCode,20), jurisdictions:list(input.jurisdictions ?? current.jurisdictions,100,120), serviceRegions:list(input.serviceRegions ?? current.serviceRegions,100,180), portalAssignments:list(input.portalAssignments ?? current.portalAssignments,100,160), evidenceState:clean(input.evidenceState || current.evidenceState,80)||'OWNER_RECORDED', ownerNotes:clean(input.ownerNotes ?? current.ownerNotes,3000), updatedAt:now() }; }
function sanitizeSeat(input={},current={}) { return { ...current, id:clean(input.id || current.id,220), organizationId:clean(input.organizationId || current.organizationId,220), professionalId:clean(input.professionalId || current.professionalId,220), sourceRecordId:clean(input.sourceRecordId || current.sourceRecordId,220), displayName:clean(input.displayName ?? current.displayName,200), seatRole:oneOf(input.seatRole,SEAT_ROLES,current.seatRole||'professional'), status:oneOf(input.status,SEAT_STATUSES,current.status||'pending'), officeIds:list(input.officeIds ?? current.officeIds,100,220), ownerNotes:clean(input.ownerNotes ?? current.ownerNotes,3000), updatedAt:now() }; }
function sanitizePracticeAssignment(input={},current={}) { return { ...current, id:clean(input.id || current.id,260), professionalId:clean(input.professionalId || current.professionalId,220), organizationId:clean(input.organizationId || current.organizationId,220), practiceArea:clean(input.practiceArea ?? current.practiceArea,220), status:oneOf(input.status,ASSIGNMENT_STATUSES,current.status||'draft'), sourceRecordIds:list(input.sourceRecordIds ?? current.sourceRecordIds,100,220), evidenceRequirement:clean(input.evidenceRequirement ?? current.evidenceRequirement,2000), evidenceState:clean(input.evidenceState || current.evidenceState,80)||'OWNER_RECORDED', ownerApproved:bool(input.ownerApproved,current.ownerApproved||false), ownerNotes:clean(input.ownerNotes ?? current.ownerNotes,3000), updatedAt:now() }; }
function sanitizePortalAssignment(input={},current={}) { return { ...current, id:clean(input.id || current.id,300), portalId:clean(input.portalId || current.portalId,180), professionalId:clean(input.professionalId || current.professionalId,220), organizationId:clean(input.organizationId || current.organizationId,220), status:oneOf(input.status,ASSIGNMENT_STATUSES,current.status||'draft'), practiceAssignmentIds:list(input.practiceAssignmentIds ?? current.practiceAssignmentIds,100,260), officeIds:list(input.officeIds ?? current.officeIds,100,220), evidenceState:clean(input.evidenceState || current.evidenceState,80)||'OWNER_RECORDED', ownerApproved:bool(input.ownerApproved,current.ownerApproved||false), portalPublicationState:clean(input.portalPublicationState ?? current.portalPublicationState,80)||'not distributed', approvedSourceRevision:Math.max(0,Number(input.approvedSourceRevision??current.approvedSourceRevision)||0), publicationEligible:false, paymentAffectsAssignment:false, ownerNotes:clean(input.ownerNotes ?? current.ownerNotes,3000), updatedAt:now() }; }
async function upsert(collectionName,id,input,sanitizer,eventType) {
  const tx=await store.mutateJson(STORE_KEY,initialState(),async(raw)=>{ const state=normalize(raw); const collection=state[collectionName]; const index=collection.findIndex((row)=>row.id===id); const current=index>=0?collection[index]:{id}; const next=sanitizer({...input,id},current); if(index>=0)collection[index]=next; else collection.push(next); state.updatedAt=now(); return {value:state,result:{record:next}}; },{event:(result)=>({eventType,recordId:id,payload:{id,status:result?.record?.status||''}})}); return tx.result;
}
async function updateOffice(id,input) { return upsert('offices',id,input,sanitizeOffice,'professional_network_office_updated'); }
async function updateSeat(id,input) { return upsert('seats',id,input,sanitizeSeat,'professional_network_seat_updated'); }
async function updatePracticeAssignment(id,input) { return upsert('practiceAssignments',id,input,sanitizePracticeAssignment,'professional_network_practice_assignment_updated'); }
async function updatePortalAssignment(id,input={}) {
  const current=buildView().portalAssignments.find(row=>row.id===id);
  if(!current)return null;
  const professional=marketplace.getOwnerData().professionals.find(row=>row.id===current.professionalId);
  const sourceRevision=Math.max(1,Number(professional?.profileRevision||1));
  const approving=oneOf(input.status,ASSIGNMENT_STATUSES,current.status)==='approved' && bool(input.ownerApproved,current.ownerApproved||false);
  const payload={...input};
  if(approving) payload.approvedSourceRevision=sourceRevision;
  if(!approving && (Object.prototype.hasOwnProperty.call(input,'status') || Object.prototype.hasOwnProperty.call(input,'ownerApproved'))) payload.approvedSourceRevision=0;
  return upsert('portalAssignments',id,payload,sanitizePortalAssignment,'professional_network_portal_assignment_updated');
}
async function synchronize(actor='owner') {
  const view=buildView();
  const tx=await store.mutateJson(STORE_KEY,initialState(),async(raw)=>{ const state=normalize(raw); state.organizations=view.organizations; state.offices=view.offices; state.seats=view.seats; state.practiceAssignments=view.practiceAssignments; state.portalAssignments=view.portalAssignments; state.billingAccounts=view.billingAccounts; state.entitlementRecords=view.entitlementRecords; const run={id:store.uid('pro-network-sync',8),actor:clean(actor,100),createdAt:now(),summary:view.summary,source:'professionalMarketplace owner view and current portal truth',automaticPortalWrites:false}; state.synchronizationRuns=[run,...state.synchronizationRuns].slice(0,50); state.updatedAt=run.createdAt; return {value:state,result:{run}}; },{event:(result)=>({eventType:'professional_network_synchronized',payload:result?.run||{}})}); return { ...tx.result, view:buildView() };
}
function portalSafeProfessionalRecord(professional,assignment,owner) {
  const firm=(owner.firms || []).find((row)=>row.id===professional.firmId);
  const sourceRevision=Math.max(1,Number(professional.profileRevision||1));
  const portalSpecific=portalPresence.approvedProjection('professional',professional.id,assignment.portalId,sourceRevision);
  return {
    recordVersion:PORTAL_PROFESSIONAL_CONTRACT_VERSION,
    professionalId:professional.id,
    sourceRevision,
    submittedRevision:Math.max(0,Number(professional.submittedRevision||0)),
    reviewStatus:professional.reviewStatus||'draft',
    displayName:professional.displayName || '',
    professionalType:professional.professionalType || '',
    firmId:professional.firmId || '',
    firmName:firm?.name || '',
    biography:professional.biography || '',
    phone:professional.phone || '',
    website:professional.website || '',
    photoUrl:professional.photoUrl || '',
    officeLocations:[...(professional.officeLocations || [])],
    jurisdictions:[...(professional.jurisdictions || [])],
    practiceAreas:[...(professional.practiceAreas || [])],
    serviceRoles:[...(professional.serviceRoles || [])],
    languages:[...(professional.languages || [])],
    consultationModes:[...(professional.consultationModes || [])],
    serviceRegions:[...(professional.serviceRegions || [])],
    availabilityStatus:professional.availabilityStatus || 'not configured',
    availabilityNote:professional.availabilityNote || '',
    portalSpecificProfileState:portalSpecific.state,
    portalSpecificProfileRevision:Number(portalSpecific.portalProfileRevision||0),
    portalSpecificProfile:portalSpecific.profile,
    sourceOrigin:assignment.sourceOrigin || professional.sourceOrigin || (professional.sourceSeeded ? 'public-source-seed' : 'manual-entry'),
    dataAuthority:assignment.dataAuthority || professional.dataAuthority || (professional.sourceSeeded ? 'source-supported' : 'professional-supplied'),
    claimState:professional.claimStatus || 'not claimed',
    credentialState:professional.verificationStatus || 'not started',
    ownerApprovalState:professional.ownerApprovalStatus || 'pending',
    membershipState:professional.membership?.status || 'none',
    portalPublicationState:assignment.portalPublicationState || professional.portalPublicationState || 'not distributed',
    publicationEligible:Boolean(assignment.publicationEligible),
    publicListingDestination:assignment.portalId,
    smarterJusticePublicProfile:false,
    paymentCreatesPublication:false,
    distributionAction:assignment.publicationEligible?'UPSERT_PUBLIC':'UPSERT_PRIVATE',
    suppressionState:professional.profileStatus==='archived'||professional.ownerApprovalStatus==='suspended'?'SUPPRESS':'NONE',
    recordFingerprint:'',
    generatedAt:owner.generatedAt || now()
  };
}
function finalizePortalRecord(record){record.recordFingerprint=digest({...record,recordFingerprint:'',generatedAt:null});return record;}
function portalSafeFirmRecord(firm,portalId) {
  const sourceRevision=Math.max(1,Number(firm.profileRevision||1));
  const portalSpecific=portalPresence.approvedProjection('firm',firm.id,portalId,sourceRevision);
  return {
    recordVersion:PORTAL_PROFESSIONAL_CONTRACT_VERSION,
    firmId:firm.id,
    sourceRevision,
    submittedRevision:Math.max(0,Number(firm.submittedRevision||0)),
    reviewStatus:firm.reviewStatus||'draft',
    name:firm.name || '',
    website:firm.website || '',
    phone:firm.phone || '',
    locations:[...(firm.locations || [])],
    jurisdictions:[...(firm.jurisdictions || [])],
    practiceAreas:[...(firm.practiceAreas || [])],
    languages:[...(firm.languages || [])],
    serviceRegions:[...(firm.serviceRegions || [])],
    portalSpecificProfileState:portalSpecific.state,
    portalSpecificProfileRevision:Number(portalSpecific.portalProfileRevision||0),
    portalSpecificProfile:portalSpecific.profile,
    sourceOrigin:firm.sourceOrigin || (firm.sourceSeeded ? 'public-source-seed' : 'manual-entry'),
    dataAuthority:firm.dataAuthority || (firm.sourceSeeded ? 'source-supported' : 'professional-supplied'),
    claimState:firm.claimStatus || 'not claimed',
    verificationState:firm.verificationStatus || 'not started',
    ownerApprovalState:firm.ownerApprovalStatus || 'pending',
    membershipState:firm.membership?.status || 'none',
    portalPublicationState:firm.portalPublicationState || 'not distributed',
    publicListingDestination:portalId,
    smarterJusticePublicProfile:false,
    paymentCreatesPublication:false,
    distributionAction:'UPSERT_PRIVATE',
    suppressionState:firm.profileStatus==='archived'||firm.ownerApprovalStatus==='suspended'?'SUPPRESS':'NONE',
    recordFingerprint:'',
    generatedAt:firm.updatedAt || now()
  };
}
function portalHandoff(portalId) {
  const view=buildView();
  const owner=marketplace.getOwnerData();
  const contract=view.portalContracts.find((row)=>row.portalId===portalId);
  if(!contract)return null;
  const assignmentRows=portalId==='general-smarter-justice-start' ? [] : view.portalAssignments.filter((row)=>row.portalId===portalId);
  const assignments=assignmentRows.map((row)=>{ const professional=(owner.professionals||[]).find(item=>item.id===row.professionalId); const sourceRevision=Math.max(1,Number(professional?.profileRevision||1)); const base={contractVersion:PORTAL_PROFESSIONAL_CONTRACT_VERSION,assignmentId:row.id,sourceRevision,approvedSourceRevision:Math.max(0,Number(row.approvedSourceRevision||0)),recordFingerprint:'',distributionAction:row.publicationEligible?'UPSERT_PUBLIC':'UPSERT_PRIVATE',suppressionState:professional?.profileStatus==='archived'||professional?.ownerApprovalStatus==='suspended'?'SUPPRESS':'NONE',portalId:row.portalId,sourcePortalIds:[...(row.sourcePortalIds||[])],mappingState:row.mappingState,professionalId:row.professionalId,organizationId:row.organizationId,seatId:row.seatId,officeIds:[...(row.officeIds||[])],practiceAssignments:[...(row.practiceAssignmentIds||[])],jurisdictions:[...(row.jurisdictions||[])],languages:[...(row.languages||[])],serviceMethods:[...(row.serviceMethods||[])],publicProfileState:row.publicProfileState,claimState:row.claimState,credentialState:row.credentialState,sourceFreshness:row.sourceFreshness,participationState:row.participationState,availabilityState:row.availabilityState,inquiryEligibility:row.inquiryEligibility,appointmentEligibility:false,membershipCoverageState:row.membershipCoverageState,sponsorshipState:row.sponsorshipState,evidenceState:row.evidenceState,sourceOrigin:row.sourceOrigin,dataAuthority:row.dataAuthority,portalPublicationState:row.portalPublicationState,publicationEligible:Boolean(row.publicationEligible),generatedAt:view.generatedAt}; base.recordFingerprint=digest({...base,recordFingerprint:'',generatedAt:null}); return base; });
  const profiles=assignmentRows.map((assignment)=>{
    const professional=(owner.professionals || []).find((row)=>row.id===assignment.professionalId);
    return professional ? finalizePortalRecord(portalSafeProfessionalRecord(professional,assignment,owner)) : null;
  }).filter(Boolean);
  const firmIds=new Set(profiles.map((row)=>row.firmId).filter(Boolean));
  const firms=(owner.firms || []).filter((firm)=>firmIds.has(firm.id)).map((firm)=>finalizePortalRecord(portalSafeFirmRecord(firm,portalId)));
  const handoff={handoffVersion:PORTAL_PROFESSIONAL_CONTRACT_VERSION,handoffDigest:'',sourceSystem:'smarter-justice',destinationPortalId:portalId,contract,portalBuildStandard:{standardId:'legal-micro-portal-integrated',standardVersion:'1.0.0',standardPath:'LEGAL_MICRO_PORTAL_INTEGRATED_STANDARD_V1.0.0.md',conformanceState:'REQUIRED_AT_PORTAL_RELEASE',exactArtifactAuthority:true,dualMissionRequired:true,profileMetricsRequired:true,completeSurfaceAuditRequired:true,exactArtifactTestingRequired:true,ownerActivationRequired:true},publicationPolicy:{accountAndBillingSystem:'Smarter Justice',publicProfileSystem:'destination micro-portal',smarterJusticePublicDirectory:false,claimOrCreateEntryPointsAllowed:true,professionalSelfEntryAllowed:true,ownerAssistedEntryAllowed:true,publicationRequiresOwnerApprovedAssignment:true,publicationRequiresCredentialVerification:true,paymentAloneNeverPublishes:true,automaticWrites:false},assignments,profiles,firms,containsUserMatterData:false,containsCredentials:false,containsPaymentData:false,containsConfidentialData:false,automaticWrites:false,liveConnection:false,generatedAt:view.generatedAt}; handoff.handoffDigest=digest(withoutGeneratedAt({...handoff,handoffDigest:''})); return handoff;
}
function exportBundle() { const view=buildView(); return {exportVersion:PROFESSIONAL_NETWORK_SCHEMA_VERSION,...view,portalHandoffs:view.portalContracts.map((contract)=>portalHandoff(contract.portalId))}; }
function featureStatus() { const view=buildView(); return {standardVersion:view.standardVersion,contractVersion:view.contractVersion,centralProfessionalIdentityFoundation:true,professionalSelfEntryFoundation:true,ownerAssistedProfileEntryFoundation:true,portalProfileDistributionPayloadFoundation:true,smarterJusticePublicDirectory:false,firmOrganizationAccountFoundation:true,multipleOfficeFoundation:true,perProfessionalSeatFoundation:true,volumeDiscountFoundation:true,evidenceBasedPracticeAssignmentFoundation:true,portalAssignmentFoundation:true,portalCoordinationContracts:view.summary.portalContracts,portalContractsAtD2:view.portalContracts.every((row)=>['D2_SCHEMAS_FIXTURES_AND_TESTS_PASS','D3_ADAPTER_TESTS_PASS','D4_STAGING_VERIFIED','D5_PRODUCTION_VERIFIED'].includes(row.contractState)),liveBilling:false,publicCheckout:false,publicInquiries:false,appointmentBooking:false,automaticPortalWrites:false,livePortalConnections:0}; }

module.exports={ ownerView, professionalView, synchronize, updateOffice, updateSeat, updatePracticeAssignment, updatePortalAssignment, portalHandoff, exportBundle, featureStatus, PROFESSIONAL_NETWORK_STANDARD_VERSION, PROFESSIONAL_NETWORK_SCHEMA_VERSION, PORTAL_PROFESSIONAL_CONTRACT_VERSION };
