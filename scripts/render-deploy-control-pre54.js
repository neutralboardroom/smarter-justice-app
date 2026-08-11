'use strict';

const fs = require('fs');

const action = String(process.argv[2] || '').trim();
const token = String(process.env.RENDER_API_KEY || '').trim();
const serviceId = String(process.env.RENDER_SERVICE_ID || '').trim();
const overrideBase = String(process.env.RENDER_API_BASE_URL || '').trim();
const base = (overrideBase || 'https://api.render.com/v1').replace(/\/$/, '');
const evidencePath = String(process.env.RENDER_DEPLOY_EVIDENCE_PATH || '').trim();
const intervalMs = positiveInt('RENDER_OBSERVE_INTERVAL_MS', 10000);
const maxAttempts = positiveInt('RENDER_OBSERVE_MAX_ATTEMPTS', 96);
const terminalSuccess = new Set(['live']);
const terminalFailure = new Set(['deactivated', 'build_failed', 'update_failed', 'canceled', 'pre_deploy_failed']);
const nonterminal = new Set(['created', 'queued', 'build_in_progress', 'update_in_progress', 'pre_deploy_in_progress']);

function positiveInt(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}

function requireId(label, value, prefix) {
  if (!new RegExp(`^${prefix}-[a-z0-9]+$`, 'i').test(value)) throw new Error(`${label} is missing or invalid`);
  return value;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function safeRow(kind, value = {}) {
  const commit = value.commit && typeof value.commit === 'object' ? value.commit : {};
  return {
    at: new Date().toISOString(),
    kind,
    serviceId,
    deployId: value.id || value.deployId || null,
    status: value.status || null,
    commitId: commit.id || value.commitId || null,
    trigger: value.trigger || null,
    startedAt: value.startedAt || null,
    finishedAt: value.finishedAt || null,
    createdAt: value.createdAt || null,
    updatedAt: value.updatedAt || null
  };
}

function emit(kind, value) {
  const row = safeRow(kind, value);
  const line = JSON.stringify(row);
  console.log(line);
  if (evidencePath) fs.appendFileSync(evidencePath, `${line}\n`, {encoding: 'utf8', mode: 0o600});
}

function writeOutput(name, value) {
  const output = String(process.env.GITHUB_OUTPUT || '').trim();
  if (output) fs.appendFileSync(output, `${name}=${String(value)}\n`, 'utf8');
}

async function api(pathname, options = {}) {
  const url = `${base}${pathname}`;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.body ? {'Content-Type': 'application/json'} : {}),
          ...(options.headers || {})
        }
      });
    } catch (error) {
      if (attempt === 5) throw new Error(`Render API network failure for ${pathname}: ${error.message}`);
      await sleep(Math.min(1000 * attempt, 5000));
      continue;
    }
    if (response.ok) {
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 5) {
      const retryAfter = Math.min(Number(response.headers.get('retry-after') || 0) * 1000 || 1000 * attempt, 10000);
      await sleep(retryAfter);
      continue;
    }
    throw new Error(`Render API ${response.status} for ${pathname}`);
  }
  throw new Error(`Render API retry budget exhausted for ${pathname}`);
}

function unwrap(value, key) {
  return value && typeof value[key] === 'object' ? value[key] : value;
}

async function servicePreflight() {
  const raw = await api(`/services/${serviceId}`);
  const service = unwrap(raw, 'service');
  if (service.id !== serviceId) throw new Error('Render service identity mismatch');
  const configured = service.autoDeploy ?? service.serviceDetails?.autoDeploy ?? service.autoDeployTrigger;
  const normalized = String(configured).toLowerCase();
  if (!['no', 'off', 'false'].includes(normalized)) {
    throw new Error('Render Auto-Deploy must be off before protected deploy/rollback control');
  }
  emit('service_preflight', {id: null, status: 'ready'});
  return service;
}

async function observe(deployId, expectedCommit) {
  requireId('RENDER_DEPLOY_ID', deployId, 'dep');
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const raw = await api(`/services/${serviceId}/deploys/${deployId}`);
    const deploy = unwrap(raw, 'deploy');
    if (deploy.id !== deployId) throw new Error('Render deploy identity mismatch');
    const status = String(deploy.status || '').toLowerCase();
    if (!terminalSuccess.has(status) && !terminalFailure.has(status) && !nonterminal.has(status)) {
      throw new Error(`Unknown Render deploy status: ${status || 'missing'}`);
    }
    emit('deploy_status', deploy);
    if (terminalSuccess.has(status)) {
      const actualCommit = String(deploy.commit?.id || '').trim();
      if (expectedCommit && actualCommit !== expectedCommit) throw new Error('Live Render deploy commit does not match the exact target commit');
      writeOutput('deploy_id', deployId);
      writeOutput('deploy_status', status);
      writeOutput('deploy_commit', actualCommit);
      return deploy;
    }
    if (terminalFailure.has(status)) throw new Error(`Render deploy reached terminal failure status: ${status}`);
    if (attempt < maxAttempts) await sleep(intervalMs);
  }
  throw new Error('Render deploy did not reach a terminal status before the observation budget expired');
}

async function rollback() {
  const acceptedDeployId = requireId('RENDER_ACCEPTED_LIVE_DEPLOY_ID', String(process.env.RENDER_ACCEPTED_LIVE_DEPLOY_ID || '').trim(), 'dep');
  const acceptedSha = String(process.env.RENDER_ACCEPTED_LIVE_SHA || '').trim();
  if (!/^[0-9a-f]{40}$/i.test(acceptedSha)) throw new Error('RENDER_ACCEPTED_LIVE_SHA is missing or invalid');
  await servicePreflight();
  emit('rollback_requested', {deployId: acceptedDeployId, commitId: acceptedSha, status: 'requested'});
  const raw = await api(`/services/${serviceId}/rollback`, {
    method: 'POST',
    body: JSON.stringify({deployId: acceptedDeployId})
  });
  const created = unwrap(raw, 'deploy');
  const rollbackDeployId = requireId('rollback deploy id', String(created.id || '').trim(), 'dep');
  emit('rollback_created', created);
  return observe(rollbackDeployId, acceptedSha);
}

async function main() {
  if (overrideBase && process.env.NODE_ENV !== 'test') throw new Error('RENDER_API_BASE_URL override is test-only');
  if (!['service-preflight', 'observe', 'rollback'].includes(action)) throw new Error('action must be service-preflight, observe, or rollback');
  if (!token) throw new Error('RENDER_API_KEY is required');
  requireId('RENDER_SERVICE_ID', serviceId, 'srv');
  if (action === 'service-preflight') await servicePreflight();
  if (action === 'observe') {
    await servicePreflight();
    await observe(String(process.env.RENDER_DEPLOY_ID || '').trim(), String(process.env.TARGET_SHA || '').trim());
  }
  if (action === 'rollback') await rollback();
}

main().catch(error => {
  console.error(`PRE54_RENDER_CONTROL_FAILED: ${error.message}`);
  process.exit(1);
});
