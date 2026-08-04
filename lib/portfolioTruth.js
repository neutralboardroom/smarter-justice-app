'use strict';

const truth = require('../PORTFOLIO_TRUTH_V1.7.75.json');
const contracts = require('../DASHBOARD_CONTRACTS_V1.7.50.json');
const conformance = require('../DASHBOARD_CONFORMANCE_V1.7.50.json');
const initialPortalCurrentness = require('./initialPortalCurrentness');
const initialPortalAuthority = require('./initialPortalAuthority');

const ALLOWED_EVIDENCE = new Set(Object.keys(truth.evidenceStates || {}));
const ALLOWED_HEALTH = new Set(truth.healthStates || []);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isDetachedSelfIdentity(row) {
  return row?.portalId === 'general-smarter-justice-start'
    && row?.artifactIdentityMode === 'DETACHED_AFTER_PACKAGING'
    && row?.sha256 === 'DETACHED_AFTER_PACKAGING'
    && Number(row?.sizeBytes || 0) === 0;
}

function validExactIdentity(row) {
  return (/^[a-f0-9]{64}$/.test(String(row.sha256 || '')) && Number(row.sizeBytes) > 0)
    || isDetachedSelfIdentity(row);
}

function identityCompleteness(row) {
  const fields = ['version', 'artifact', 'sha256', 'sizeBytes', 'reviewedAt', 'sourceOfTruth'];
  const present = fields.filter((field) => {
    if (field === 'sizeBytes') return Number(row[field]) > 0;
    if (field === 'sha256') return /^[a-f0-9]{64}$/.test(String(row[field] || ''));
    return Boolean(String(row[field] || '').trim());
  });
  if (isDetachedSelfIdentity(row)) {
    return {
      present: present.length,
      required: fields.length,
      state: 'DETACHED_SELF_IDENTITY',
      identityLocation: 'EXTERNAL_DELIVERY_REPORT'
    };
  }
  return {
    present: present.length,
    required: fields.length,
    state: present.length === fields.length ? 'COMPLETE' : present.length >= 3 ? 'PARTIAL' : 'INCOMPLETE'
  };
}

function recordAgeDays(reviewedAt, now = new Date()) {
  const reviewed = new Date(`${reviewedAt || ''}T00:00:00Z`);
  if (Number.isNaN(reviewed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - reviewed.getTime()) / 86400000));
}

function freshness(row, now = new Date()) {
  const ageDays = recordAgeDays(row.reviewedAt, now);
  if (ageDays == null) return { state: 'UNKNOWN', ageDays: null };
  if (ageDays > 60) return { state: 'STALE', ageDays };
  if (ageDays > 30) return { state: 'REVIEW_DUE', ageDays };
  return { state: 'CURRENT', ageDays };
}

function enrichedPortals(now = new Date()) {
  return (truth.portals || []).map((row) => ({
    ...clone(row),
    identityCompleteness: identityCompleteness(row),
    freshness: freshness(row, now),
    exactIdentityPresent: /^[a-f0-9]{64}$/.test(String(row.sha256 || '')) && Number(row.sizeBytes) > 0,
    exactEvidenceSupported: validExactIdentity(row),
    detachedSelfIdentity: isDetachedSelfIdentity(row)
  }));
}

function validate(input = truth) {
  const errors = [];
  const ids = new Set();
  for (const row of input.portals || []) {
    if (!row.portalId || ids.has(row.portalId)) errors.push(`duplicate-or-missing-portal-id:${row.portalId || 'missing'}`);
    ids.add(row.portalId);
    if (!ALLOWED_EVIDENCE.has(row.evidenceState)) errors.push(`invalid-evidence:${row.portalId}`);
    if (row.evidenceState === 'EXACT_VERIFIED' && !validExactIdentity(row)) errors.push(`exact-evidence-without-identity:${row.portalId}`);
    if (row.evidenceState !== 'EXACT_VERIFIED' && row.portalId !== 'general-smarter-justice-start' && row.sourceOfTruth === 'Uploaded exact Smarter Justice artifact') errors.push(`owner-recorded-presented-as-exact:${row.portalId}`);
    if (!ALLOWED_HEALTH.has(row.health)) errors.push(`invalid-health:${row.portalId}`);
    if (row.independentlyVerifiedInThisBuild === true && row.evidenceState !== 'EXACT_VERIFIED' && row.evidenceState !== 'PRODUCTION_VERIFIED') errors.push(`independent-verification-evidence-mismatch:${row.portalId}`);
  }
  return { ok: errors.length === 0, errors };
}

function attentionReason(row) {
  if (row.health === 'BLOCKED') return 'A current blocker prevents the next legal-network step.';
  if (row.evidenceState === 'CONFLICT') return 'Material portal records disagree and require owner resolution.';
  if (row.evidenceState === 'MISSING') return 'No dedicated implementation artifact is registered.';
  if (['OWNER_RECORDED','OWNER_RECORDED_VERSION_ONLY'].includes(row.evidenceState)) return 'The current artifact identity is owner-recorded and must be independently verified in the dedicated portal context.';
  if (row.freshness?.state === 'STALE') return 'This current-facing record is older than the legal-network freshness threshold.';
  if (row.evidenceState === 'CANDIDATE_PENDING_FINAL_EXACT_ACCEPTANCE') return 'The current build candidate awaits detached identity and two clean-extraction results.';
  if (row.evidenceState === 'OBSERVED_UNVERIFIED') return 'The observed candidate has not completed exact-artifact verification.';
  return 'Review the current evidence and next action.';
}

function attentionItems() {
  return enrichedPortals()
    .filter((row) => row.health !== 'HEALTHY' || !['EXACT_VERIFIED', 'PRODUCTION_VERIFIED'].includes(row.evidenceState) || row.freshness.state !== 'CURRENT')
    .map((row) => ({
      attentionId: `attention:${row.portalId}`,
      portalId: row.portalId,
      name: row.name,
      status: row.health,
      evidenceState: row.evidenceState,
      freshness: row.freshness,
      identityCompleteness: row.identityCompleteness,
      reason: attentionReason(row),
      nextAction: row.nextAction
    }));
}

function summary() {
  const rows = enrichedPortals();
  return {
    portalCount: rows.length,
    exactVerified: rows.filter((row) => row.evidenceState === 'EXACT_VERIFIED').length,
    candidatePendingExactAcceptance: rows.filter((row) => row.evidenceState === 'CANDIDATE_PENDING_FINAL_EXACT_ACCEPTANCE').length,
    finalPackageAcceptedDetachedIdentity: rows.filter((row) => row.evidenceState === 'FINAL_PACKAGE_ACCEPTED_DETACHED_IDENTITY').length,
    productionVerified: rows.filter((row) => row.evidenceState === 'PRODUCTION_VERIFIED').length,
    ownerRecorded: rows.filter((row) => ['OWNER_RECORDED','OWNER_RECORDED_VERSION_ONLY'].includes(row.evidenceState)).length,
    missing: rows.filter((row) => row.evidenceState === 'MISSING').length,
    conflicts: rows.filter((row) => row.evidenceState === 'CONFLICT').length,
    stale: rows.filter((row) => row.freshness.state === 'STALE').length,
    attentionNeeded: rows.filter((row) => row.health === 'ATTENTION_NEEDED').length,
    blocked: rows.filter((row) => row.health === 'BLOCKED').length,
    completeIdentities: rows.filter((row) => row.identityCompleteness.state === 'COMPLETE').length,
    detachedSelfIdentities: rows.filter((row) => row.identityCompleteness.state === 'DETACHED_SELF_IDENTITY').length,
    ownerDecisions: (truth.ownerDecisions || []).length,
    closedGates: (truth.closedGates || []).length,
    highestDashboardClaim: conformance.highestClaim,
    initialPortalCurrentnessConflicts: initialPortalCurrentness.validate().errors.length,
    initialPortalAuthorityConflicts: initialPortalAuthority.validate().errors.length
  };
}

function ownerView() {
  const checked = validate();
  return {
    ...clone(truth),
    portals: enrichedPortals(),
    validation: checked,
    summary: summary(),
    attentionItems: attentionItems(),
    dashboardContracts: clone(contracts),
    dashboardConformance: clone(conformance),
    initialPortalCurrentness: initialPortalCurrentness.ownerView(),
    initialPortalAuthority: initialPortalAuthority.ownerView()
  };
}

module.exports = {
  isDetachedSelfIdentity,
  validExactIdentity,
  identityCompleteness,
  recordAgeDays,
  freshness,
  enrichedPortals,
  validate,
  summary,
  attentionItems,
  ownerView
};
