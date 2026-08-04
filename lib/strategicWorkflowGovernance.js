'use strict';

const governance = require('../STRUCTURED_WORKFLOW_GOVERNANCE_V1.7.75.json');
const decisions = require('../STRATEGIC_CAPABILITY_DECISION_REGISTER_V1.7.75.json');
const maturity = require('../CAPABILITY_MATURITY_DASHBOARD_V1.7.75.json');
const consentContract = require('../CONSENT_BASED_JOURNEY_ORCHESTRATION_CONTRACT_V1.7.75.json');
const architectureReceipt = require('../SMARTER_NETWORK_ARCHITECTURE_AND_CONSENT_COMPATIBILITY_RECEIPT_V1.7.75.json');
const recovery = require('../RECOVERY_LINEAGE_RECEIPT_V1.7.75.json');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function text(value) { return String(value ?? '').trim(); }
function isoMs(value) { const parsed = Date.parse(text(value)); return Number.isFinite(parsed) ? parsed : null; }
function unique(values) { return Array.isArray(values) && new Set(values).size === values.length; }

function validateConsentReceipt(receipt = {}) {
  const errors = [];
  for (const field of consentContract.required_fields) {
    if (receipt[field] === undefined || receipt[field] === null || receipt[field] === '') errors.push(`required:${field}`);
  }
  if (receipt.explicit_user_choice !== true) errors.push('explicit-user-choice');
  if (receipt.automatic_sync !== false) errors.push('automatic-sync-prohibited');
  if (receipt.source_product === receipt.destination_product) errors.push('source-destination-distinct');
  if (!Array.isArray(receipt.data_categories) || receipt.data_categories.length === 0 || !unique(receipt.data_categories)) errors.push('data-categories');
  const prohibited = new Set(consentContract.prohibited_data_categories);
  for (const category of receipt.data_categories || []) if (prohibited.has(category)) errors.push(`prohibited-data:${category}`);
  const created = isoMs(receipt.created_at); const expires = isoMs(receipt.expires_at);
  if (!created) errors.push('created-at');
  if (!expires) errors.push('expires-at');
  if (created && expires && expires <= created) errors.push('expiry-order');
  if (!text(receipt.purpose)) errors.push('purpose');
  for (const field of ['revocation_path','correction_path','deletion_path']) if (!text(receipt[field]).startsWith('/')) errors.push(`path:${field}`);
  const serialized = JSON.stringify(receipt);
  if (/(?:password|secret|token|private[_ -]?key|client[_ -]?confidential|medical record|bank account)/i.test(serialized)) errors.push('sensitive-material');
  return { ok: errors.length === 0, errors, runtimeEnabled: false, automaticSync: false };
}

function validateGovernance(value = governance) {
  const errors = [];
  if (value.schema_id !== 'SJP-STRUCTURED-WORKFLOW-GOVERNANCE-2026-08-03-V1') errors.push('schema');
  if (value.releaseVersion !== '1.7.75') errors.push('release-version');
  if (value.source?.artifact_sha256 !== '5ed64a1c13de1a536303b07a2277e234a822b9bc316b7ea97cf2547e90811898') errors.push('source');
  if (value.governing_packet?.sha256 !== '5fc583752204994082de559b0b240aa78272ef2d92d6b5ebcba11f9ff38c15cc') errors.push('packet');
  if (value.public_experience_rule?.structured_workflows_prioritized_over_generic_chat !== true || value.public_experience_rule?.generic_public_ai_chat_is_primary_default !== false) errors.push('structured-workflow-priority');
  if (!Array.isArray(value.workflow_registry) || value.workflow_registry.length < 5) errors.push('workflow-registry');
  if (value.workflow_registry?.filter(row => row.primary_default).some(row => row.generic_chat_primary !== false)) errors.push('generic-chat-default');
  const ids = new Set((value.strategic_capabilities || []).map(row => row.candidate_id));
  for (const required of ['PROFESSIONAL_OPERATIONS_CENTER','SOURCE_INTELLIGENCE_SYSTEM','ECOSYSTEM_GOVERNANCE_CENTER','CAPABILITY_MATURITY_DASHBOARD','CONSENT_BASED_JOURNEY_ORCHESTRATOR']) if (!ids.has(required)) errors.push(`capability:${required}`);
  const selected = (value.strategic_capabilities || []).filter(row => row.decision === 'SELECTED');
  if (selected.length !== 5) errors.push('selected-count');
  if (value.architecture_invariants?.smarter_justice_federated !== true || value.architecture_invariants?.universal_sensitive_user_database_absent !== true || value.architecture_invariants?.automatic_sensitive_cross_platform_sync_absent !== true) errors.push('architecture-invariants');
  if (value.runtime_effect?.new_cross_product_transfer_enabled !== false || value.runtime_effect?.new_sensitive_storage !== false || value.runtime_effect?.deployment_authorized !== false || value.runtime_effect?.production_request_sent !== false) errors.push('runtime-boundary');
  if (recovery.unavailable_intermediate?.byte_exact_recovery_claimed !== false) errors.push('recovery-truth');
  const consentValidation = validateConsentReceipt(consentContract.sample_valid_non_sensitive_receipt);
  if (!consentValidation.ok) errors.push(...consentValidation.errors.map(error => `consent:${error}`));
  return { ok: errors.length === 0, errors, releaseVersion: '1.7.75', workflowCount: value.workflow_registry?.length || 0, selectedCapabilityCount: selected.length, runtimeTransferEnabled: false, deploymentAuthorized: false, productionRequestSent: false };
}

function ownerView() {
  return {
    governance: clone(governance),
    strategicCapabilityDecisions: clone(decisions),
    capabilityMaturity: clone(maturity),
    consentContract: clone(consentContract),
    architectureCompatibility: clone(architectureReceipt),
    recoveryLineage: clone(recovery),
    validation: validateGovernance(),
    sampleConsentValidation: validateConsentReceipt(consentContract.sample_valid_non_sensitive_receipt),
    deploymentAuthorized: false,
    productionRequestSent: false
  };
}

module.exports = { validateConsentReceipt, validateGovernance, ownerView };
