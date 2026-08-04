'use strict';

const crypto = require('crypto');
const schema = require('../PROVIDER_DISCOVERY_AUTHORIZATION_LIFECYCLE_SCHEMA_V1.7.75.json');
const staticLifecycle = require('../PROVIDER_DISCOVERY_AUTHORIZATION_LIFECYCLE_V1.7.75.json');
const plan = require('../PROVIDER_DISCOVERY_PLAN_V1.7.75.json');
const authorization = require('./providerDiscoveryAuthorization');
const discovery = require('./providerDiscoveryPlan');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
function digest(value) { return crypto.createHash('sha256').update(stable(value)).digest('hex'); }
function hasSecretMaterial(value) {
  return /(?:sk_live_|rk_live_|ghp_|github_pat_|postgres(?:ql)?:\/\/[^"\s]+:[^"\s]+@|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|smtp_pass\s*[:=]\s*["'][^"']{6,})/i.test(JSON.stringify(value));
}
function eventBody(event) { const copy = clone(event); delete copy.event_hash; return copy; }
function appendEvent(events, event) {
  const list = clone(events || []);
  const previous = list.length ? list[list.length - 1].event_hash : null;
  const body = { ...clone(event), sequence: list.length + 1, previous_event_hash: previous };
  body.event_hash = digest(eventBody(body));
  list.push(body);
  return list;
}

function deriveState(events = []) {
  let state = 'UNREGISTERED';
  let envelope = null;
  let receipt = null;
  for (const event of events) {
    if (event.event_type === 'REQUEST_REGISTERED') state = 'OWNER_DECISION_REQUIRED';
    if (event.event_type === 'AUTHORIZED_READ_ONLY') state = 'AUTHORIZED_READ_ONLY';
    if (event.event_type === 'DECLINED') state = 'DECLINED';
    if (event.event_type === 'EXPIRED') state = 'EXPIRED';
    if (event.event_type === 'REVOKED') state = 'REVOKED';
    if (event.event_type === 'EXECUTION_ENVELOPE_ISSUED') { state = 'ENVELOPE_ISSUED'; envelope = event; }
    if (event.event_type === 'EXECUTION_RECEIPT_ACCEPTED') { state = 'COMPLETED'; receipt = event; }
  }
  return {
    state,
    envelopeIssued: Boolean(envelope),
    receiptAccepted: Boolean(receipt),
    terminal: schema.terminal_states.includes(state),
    envelope,
    receipt
  };
}

function validateChain(events = []) {
  const errors = [];
  let previous = null;
  let state = 'UNREGISTERED';
  let requestId = null;
  let requestDigest = null;
  let envelopeDigest = null;
  let executionNonce = null;

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const number = index + 1;
    if (event.sequence !== number) errors.push(`sequence:${number}`);
    if (event.previous_event_hash !== previous) errors.push(`previous-hash:${number}`);
    if (!schema.allowed_event_types.includes(event.event_type)) errors.push(`event-type:${number}`);
    if (event.event_hash !== digest(eventBody(event))) errors.push(`event-hash:${number}`);
    if (hasSecretMaterial(event)) errors.push(`secret-material:${number}`);
    if (event.deployment_authorized !== false || event.production_request_sent !== false) errors.push(`authority-boundary:${number}`);

    if (event.event_type === 'REQUEST_REGISTERED') {
      if (index !== 0 || state !== 'UNREGISTERED') errors.push(`request-order:${number}`);
      requestId = event.request_id;
      requestDigest = event.request_digest;
      state = 'OWNER_DECISION_REQUIRED';
    } else {
      if (state === 'UNREGISTERED') errors.push(`request-missing:${number}`);
      if (event.request_id !== requestId || event.request_digest !== requestDigest) errors.push(`request-binding:${number}`);
    }

    if (event.event_type === 'AUTHORIZED_READ_ONLY') {
      if (state !== 'OWNER_DECISION_REQUIRED') errors.push(`authorization-order:${number}`);
      state = 'AUTHORIZED_READ_ONLY';
    } else if (event.event_type === 'DECLINED') {
      if (state !== 'OWNER_DECISION_REQUIRED') errors.push(`decline-order:${number}`);
      state = 'DECLINED';
    } else if (event.event_type === 'EXPIRED') {
      if (!['OWNER_DECISION_REQUIRED', 'AUTHORIZED_READ_ONLY'].includes(state)) errors.push(`expiry-order:${number}`);
      state = 'EXPIRED';
    } else if (event.event_type === 'REVOKED') {
      if (!['AUTHORIZED_READ_ONLY', 'ENVELOPE_ISSUED'].includes(state)) errors.push(`revocation-order:${number}`);
      state = 'REVOKED';
    } else if (event.event_type === 'EXECUTION_ENVELOPE_ISSUED') {
      if (state !== 'AUTHORIZED_READ_ONLY') errors.push(`envelope-order:${number}`);
      if (!event.execution_nonce || !event.execution_envelope_digest) errors.push(`envelope-binding:${number}`);
      if (envelopeDigest) errors.push(`envelope-replay:${number}`);
      envelopeDigest = event.execution_envelope_digest;
      executionNonce = event.execution_nonce;
      state = 'ENVELOPE_ISSUED';
    } else if (event.event_type === 'EXECUTION_RECEIPT_ACCEPTED') {
      if (state !== 'ENVELOPE_ISSUED') errors.push(`receipt-order:${number}`);
      if (event.execution_envelope_digest !== envelopeDigest || event.execution_nonce !== executionNonce) errors.push(`receipt-binding:${number}`);
      state = 'COMPLETED';
    }
    previous = event.event_hash;
  }
  return { ok: errors.length === 0, errors, headHash: previous, eventCount: events.length, state };
}

function registerRequest(request = plan.products[0].request, at = request.created_at) {
  return appendEvent([], {
    event_type: 'REQUEST_REGISTERED',
    occurred_at: at,
    request_id: request.request_id,
    request_digest: discovery.digestRequest(request),
    product: clone(request.product),
    read_only: true,
    secret_values_forbidden: true,
    write_operations_forbidden: true,
    deployment_authorized: false,
    production_request_sent: false
  });
}

function recordDecision(events, request, decision, options = {}) {
  const current = deriveState(events);
  if (current.state !== 'OWNER_DECISION_REQUIRED') return { ok: false, errors: ['owner-decision-not-pending'], events: clone(events) };
  const validation = authorization.validateDecision(request, decision, options);
  if (!validation.ok) return { ok: false, errors: validation.errors, events: clone(events) };
  const eventType = decision.decision_state;
  const next = appendEvent(events, {
    event_type: eventType,
    occurred_at: decision.issued_at,
    request_id: request.request_id,
    request_digest: validation.requestDigest,
    decision_id: decision.decision_id,
    decision_digest: validation.decisionDigest,
    read_only: true,
    secret_values_forbidden: true,
    write_operations_forbidden: true,
    deployment_authorized: false,
    production_request_sent: false
  });
  return { ok: true, errors: [], events: next, validation };
}

function recordExpiry(events, request, at) {
  const current = deriveState(events);
  if (!['OWNER_DECISION_REQUIRED', 'AUTHORIZED_READ_ONLY'].includes(current.state)) return { ok: false, errors: ['request-not-expirable'], events: clone(events) };
  return { ok: true, errors: [], events: appendEvent(events, {
    event_type: 'EXPIRED', occurred_at: at, request_id: request.request_id,
    request_digest: discovery.digestRequest(request), read_only: true,
    secret_values_forbidden: true, write_operations_forbidden: true,
    deployment_authorized: false, production_request_sent: false
  }) };
}

function recordRevocation(events, request, decision, at) {
  const current = deriveState(events);
  if (!['AUTHORIZED_READ_ONLY', 'ENVELOPE_ISSUED'].includes(current.state)) return { ok: false, errors: ['authorization-not-revocable'], events: clone(events) };
  return { ok: true, errors: [], events: appendEvent(events, {
    event_type: 'REVOKED', occurred_at: at, request_id: request.request_id,
    request_digest: discovery.digestRequest(request), decision_id: decision.decision_id,
    decision_digest: authorization.digest(decision), read_only: true,
    secret_values_forbidden: true, write_operations_forbidden: true,
    deployment_authorized: false, production_request_sent: false
  }) };
}

function issueEnvelope(events, request, decision, options = {}) {
  const current = deriveState(events);
  if (current.state !== 'AUTHORIZED_READ_ONLY') return { ok: false, errors: ['authorization-not-active'], events: clone(events) };
  if (events.some(event => event.event_type === 'EXECUTION_ENVELOPE_ISSUED')) return { ok: false, errors: ['execution-envelope-replayed'], events: clone(events) };
  const built = authorization.buildExecutionEnvelope(request, decision, { ...options, usedNonces: new Set() });
  if (!built.ok) return { ok: false, errors: built.errors, events: clone(events) };
  const next = appendEvent(events, {
    event_type: 'EXECUTION_ENVELOPE_ISSUED', occurred_at: options.now || decision.issued_at,
    request_id: request.request_id, request_digest: built.validation.requestDigest,
    decision_id: decision.decision_id, decision_digest: built.validation.decisionDigest,
    execution_nonce: decision.execution_nonce,
    execution_envelope_digest: built.envelopeDigest,
    read_only: true, secret_values_forbidden: true, write_operations_forbidden: true,
    deployment_authorized: false, production_request_sent: false
  });
  return { ok: true, errors: [], events: next, executionEnvelope: built.executionEnvelope, envelopeDigest: built.envelopeDigest };
}

function acceptReceipt(events, envelope, receipt) {
  const errors = [];
  const current = deriveState(events);
  const envelopeDigest = digest(envelope);
  if (current.state !== 'ENVELOPE_ISSUED') errors.push('execution-envelope-not-issued');
  if (events.some(event => event.event_type === 'EXECUTION_RECEIPT_ACCEPTED')) errors.push('execution-receipt-replayed');
  if (!current.envelope || current.envelope.execution_envelope_digest !== envelopeDigest) errors.push('issued-envelope-digest');
  if (receipt.execution_envelope_digest !== envelopeDigest) errors.push('execution-envelope-digest');
  if (receipt.authorization_request_id !== envelope.authorization_request_id) errors.push('authorization-request-id');
  if (receipt.authorization_request_digest !== envelope.authorization_request_digest) errors.push('authorization-request-digest');
  if (receipt.owner_decision_id !== envelope.owner_decision_id) errors.push('owner-decision-id');
  if (receipt.owner_decision_digest !== envelope.owner_decision_digest) errors.push('owner-decision-digest');
  if (receipt.execution_nonce !== envelope.execution_nonce) errors.push('execution-nonce');
  if (receipt.read_only !== true || receipt.secret_values_read !== false || receipt.writes_performed !== false || receipt.deployment_authorized !== false || receipt.production_request_sent !== false) errors.push('protected-boundary');
  if (hasSecretMaterial(receipt)) errors.push('secret-material');
  if (errors.length) return { ok: false, errors, events: clone(events) };
  const receiptDigest = digest(receipt);
  const next = appendEvent(events, {
    event_type: 'EXECUTION_RECEIPT_ACCEPTED', occurred_at: receipt.observed_at,
    request_id: receipt.authorization_request_id, request_digest: receipt.authorization_request_digest,
    decision_id: receipt.owner_decision_id, decision_digest: receipt.owner_decision_digest,
    execution_nonce: receipt.execution_nonce, execution_envelope_digest: receipt.execution_envelope_digest,
    receipt_digest: receiptDigest, read_only: true, secret_values_read: false, writes_performed: false,
    deployment_authorized: false, production_request_sent: false
  });
  return { ok: true, errors: [], events: next, receiptDigest };
}

function validateStatic(value = staticLifecycle) {
  const errors = [];
  const request = plan.products[0].request;
  const reference = value.request_reference || {};
  if (value.schema !== 'smarter-justice-provider-discovery-authorization-lifecycle') errors.push('schema');
  if (value.releaseVersion !== '1.7.75') errors.push('release-version');
  if (reference.request_id !== request.request_id || reference.artifact_sha256 !== request.product.artifact_sha256) errors.push('request-binding');
  if (!Array.isArray(value.events) || value.events.length !== 0) errors.push('static-events-must-remain-empty');
  if (value.current_state !== 'OWNER_DECISION_REQUIRED') errors.push('current-state');
  for (const key of ['execution_envelope_issued','execution_receipt_accepted','provider_metadata_read','secret_values_read','writes_performed','deployment_authorized','production_request_sent','cohort_frozen','canary_selected']) {
    if (value[key] !== false) errors.push(`protected:${key}`);
  }
  if (hasSecretMaterial(value)) errors.push('secret-material');
  return { ok: errors.length === 0, errors, releaseVersion: '1.7.75', currentState: value.current_state, eventCount: 0, deploymentAuthorized: false, productionRequestSent: false };
}
function ownerView() {
  return { schema: clone(schema), lifecycle: clone(staticLifecycle), validation: validateStatic(), request: clone(plan.products[0].request), deploymentAuthorized: false, productionRequestSent: false };
}

module.exports = { digest, appendEvent, validateChain, deriveState, registerRequest, recordDecision, recordExpiry, recordRevocation, issueEnvelope, acceptReceipt, validateStatic, ownerView };
