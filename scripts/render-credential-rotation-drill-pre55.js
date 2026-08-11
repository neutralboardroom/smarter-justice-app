'use strict';

const fs = require('fs');

const action = String(process.argv[2] || '').trim();
const token = String(process.env.RENDER_API_KEY || '').trim();
const serviceId = String(process.env.RENDER_SERVICE_ID || '').trim();
const startedAt = String(process.env.RENDER_ROTATION_STARTED_AT || '').trim();
const changeRef = String(process.env.RENDER_ROTATION_CHANGE_REF || '').trim();
const evidencePath = String(process.env.RENDER_ROTATION_EVIDENCE_PATH || '').trim();
const overrideBase = String(process.env.RENDER_API_BASE_URL || '').trim();
const base = (overrideBase || 'https://api.render.com/v1').replace(/\/$/, '');
const maxMinutes = positiveInt('RENDER_ROTATION_MAX_MINUTES', 60);

function positiveInt(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > 60) {
    throw new Error(`${name} must be an integer from 1 through 60`);
  }
  return value;
}

function requireId(label, value, prefix) {
  if (!new RegExp(`^${prefix}-[a-z0-9]+$`, 'i').test(value)) {
    throw new Error(`${label} is missing or invalid`);
  }
  return value;
}

function requireChangeRef() {
  if (!/^[A-Za-z0-9._:-]{1,80}$/.test(changeRef)) {
    throw new Error('RENDER_ROTATION_CHANGE_REF is missing or invalid');
  }
}

function requireActiveWindow() {
  const epoch = Date.parse(startedAt);
  if (!Number.isFinite(epoch)) throw new Error('RENDER_ROTATION_STARTED_AT must be a valid ISO timestamp');
  const ageMs = Date.now() - epoch;
  if (ageMs < -5 * 60 * 1000) throw new Error('Credential rotation start time is too far in the future');
  if (ageMs > maxMinutes * 60 * 1000) throw new Error('Credential rotation drill window expired');
  return Math.max(0, Math.round(ageMs / 1000));
}

function autoDeployOff(service) {
  const configured = service.autoDeploy ?? service.serviceDetails?.autoDeploy ?? service.autoDeployTrigger;
  return ['no', 'off', 'false'].includes(String(configured).toLowerCase());
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function probe() {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    let response;
    try {
      response = await fetch(`${base}/services/${serviceId}`, {
        headers: {Accept: 'application/json', Authorization: `Bearer ${token}`},
        signal: AbortSignal.timeout(10000)
      });
    } catch (error) {
      if (attempt === 4) throw new Error(`Render API network failure: ${error.message}`);
      await sleep(Math.min(attempt * 500, 2000));
      continue;
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await sleep(Math.min(attempt * 500, 2000));
      continue;
    }
    let service = null;
    if (response.ok) {
      const raw = await response.text();
      const parsed = raw ? JSON.parse(raw) : {};
      service = parsed && typeof parsed.service === 'object' ? parsed.service : parsed;
    }
    return {status: response.status, service};
  }
  throw new Error('Render API retry budget exhausted');
}

function emit(phase, secondsElapsed, result) {
  const serviceVerified = Boolean(result.service && result.service.id === serviceId);
  const row = {
    schemaVersion: '1.0.0',
    at: new Date().toISOString(),
    kind: 'render_credential_rotation_drill',
    release: 'v2.0.0-pre55',
    phase,
    changeRef,
    startedAt,
    maxMinutes,
    secondsElapsed,
    serviceId,
    providerHttpStatus: result.status,
    providerAccess: result.status >= 200 && result.status < 300 ? 'AUTHORIZED' : 'DENIED',
    providerServiceVerified: serviceVerified,
    autoDeployOff: serviceVerified ? autoDeployOff(result.service) : null,
    credentialMaterialPresent: false,
    passed: true
  };
  const line = JSON.stringify(row);
  if (token && line.includes(token)) throw new Error('Credential material reached the evidence serializer');
  console.log(line);
  if (evidencePath) fs.appendFileSync(evidencePath, `${line}\n`, {encoding: 'utf8', mode: 0o600});
}

async function main() {
  if (overrideBase && process.env.NODE_ENV !== 'test') throw new Error('RENDER_API_BASE_URL override is test-only');
  if (!['candidate-access', 'retired-denied', 'active-access'].includes(action)) {
    throw new Error('action must be candidate-access, retired-denied, or active-access');
  }
  if (!token) throw new Error('RENDER_API_KEY is required');
  requireId('RENDER_SERVICE_ID', serviceId, 'srv');
  requireChangeRef();
  const secondsElapsed = requireActiveWindow();
  const result = await probe();

  if (action === 'retired-denied') {
    if (![401, 403].includes(result.status)) {
      throw new Error(`Retired credential was not denied; provider returned HTTP ${result.status}`);
    }
  } else {
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Credential access probe failed with HTTP ${result.status}`);
    }
    if (!result.service || result.service.id !== serviceId) throw new Error('Render service identity mismatch');
    if (!autoDeployOff(result.service)) throw new Error('Render Auto-Deploy must remain off during credential rotation');
  }
  emit(action, secondsElapsed, result);
}

main().catch(error => {
  console.error(`PRE55_RENDER_CREDENTIAL_ROTATION_FAILED: ${error.message}`);
  process.exit(1);
});
