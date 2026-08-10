'use strict';

const fs = require('node:fs');
const path = require('node:path');

const runtimeRoot = path.resolve('.runtime/smarter-justice-v1.7.98');
const evidencePath = path.join(runtimeRoot, 'AI_CONTROLLED_SMOKE_EVIDENCE.json');
const publicDir = path.join(runtimeRoot, 'public', '.well-known');
const publicPath = path.join(publicDir, 'smarter-justice-ai-smoke.json');

function clean(value) { return String(value || '').trim(); }
function safeModel(value) { return /^[A-Za-z0-9._:-]{1,120}$/.test(value) ? value : null; }
function writeEvidence(record) {
  fs.mkdirSync(runtimeRoot, { recursive: true });
  fs.writeFileSync(evidencePath, JSON.stringify(record, null, 2) + '\n', 'utf8');
  fs.mkdirSync(publicDir, { recursive: true });
  const publicRecord = {
    status: record.status,
    provider: 'openai',
    model: record.model || null,
    checkedAt: record.checkedAt,
    publicAiEnabled: false,
    secretExposed: false
  };
  fs.writeFileSync(publicPath, JSON.stringify(publicRecord, null, 2) + '\n', 'utf8');
}

(async () => {
  const key = clean(process.env.OPENAI_API_KEY);
  const project = clean(process.env.OPENAI_PROJECT_ID);
  const model = safeModel(clean(process.env.OPENAI_MODEL || process.env.OPENAI_API_MODEL));
  const checkedAt = new Date().toISOString();

  if (!key || !project || !model) {
    writeEvidence({
      schemaVersion: '1.0.0',
      status: 'SKIPPED',
      checkedAt,
      provider: 'openai',
      model,
      projectConfigured: Boolean(project),
      keyConfigured: Boolean(key),
      reason: 'REQUIRED_SERVER_CONFIGURATION_MISSING',
      publicAiEnabled: false,
      secretExposed: false
    });
    console.log('[sj-ai-smoke] SKIPPED: required server configuration missing; public AI remains closed');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let record;
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'OpenAI-Project': project
      },
      body: JSON.stringify({
        model,
        input: 'Reply with exactly: SMARTER JUSTICE AI READY',
        store: false,
        max_output_tokens: 32
      }),
      signal: controller.signal
    });
    const body = await response.json().catch(() => ({}));
    const outputText = Array.isArray(body.output)
      ? body.output.flatMap(item => Array.isArray(item.content) ? item.content : [])
          .filter(item => item && item.type === 'output_text')
          .map(item => String(item.text || ''))
          .join(' ')
      : '';
    const pass = response.ok && outputText.includes('SMARTER JUSTICE AI READY');
    record = {
      schemaVersion: '1.0.0',
      status: pass ? 'PASS' : 'FAIL',
      checkedAt,
      provider: 'openai',
      model,
      projectConfigured: true,
      keyConfigured: true,
      httpStatus: response.status,
      providerRequestId: typeof body.id === 'string' ? body.id : null,
      responseStored: false,
      expectedPhraseObserved: pass,
      publicAiEnabled: false,
      secretExposed: false,
      errorCategory: pass ? null : 'PROVIDER_RESPONSE_NOT_ACCEPTED'
    };
  } catch (error) {
    record = {
      schemaVersion: '1.0.0',
      status: 'FAIL',
      checkedAt,
      provider: 'openai',
      model,
      projectConfigured: true,
      keyConfigured: true,
      httpStatus: null,
      providerRequestId: null,
      responseStored: false,
      expectedPhraseObserved: false,
      publicAiEnabled: false,
      secretExposed: false,
      errorCategory: error && error.name === 'AbortError' ? 'PROVIDER_TIMEOUT' : 'PROVIDER_REQUEST_FAILED'
    };
  } finally {
    clearTimeout(timeout);
  }

  writeEvidence(record);
  console.log(`[sj-ai-smoke] ${record.status}: provider=${record.provider} model=${record.model || 'unknown'} publicAiEnabled=false`);
})().catch(() => {
  try {
    writeEvidence({
      schemaVersion: '1.0.0',
      status: 'FAIL',
      checkedAt: new Date().toISOString(),
      provider: 'openai',
      model: null,
      projectConfigured: false,
      keyConfigured: false,
      responseStored: false,
      expectedPhraseObserved: false,
      publicAiEnabled: false,
      secretExposed: false,
      errorCategory: 'SMOKE_RUNNER_FAILURE'
    });
  } catch {}
  console.log('[sj-ai-smoke] FAIL: smoke runner failure; public AI remains closed');
});
