#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];
const requiredFiles = [
  '.github/workflows/reusable-portfolio-qualification.yml',
  '.github/workflows/portfolio-qualification.yml',
  '.github/workflows/portfolio-staging-deploy.yml',
  '.github/workflows/portfolio-production-deploy.yml',
  '.github/actions/portfolio-exact-deploy/action.yml',
  'deployment/product-deployment.json',
  'deployment/universal-pipeline/product-deployment.schema.json',
  'scripts/test-spanish-owner-rule.js',
  'scripts/test-data-continuity-owner-rule.js'
];

function fail(message) { errors.push(message); }
function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) { fail(`Missing ${rel}`); return ''; }
  return fs.readFileSync(full, 'utf8');
}

for (const file of requiredFiles) read(file);

const configText = read('deployment/product-deployment.json');
if (configText) {
  const config = JSON.parse(configText);
  if (config.schemaVersion !== 1) fail('Unsupported deployment configuration schema');
  if (config.repository !== 'neutralboardroom/smarter-justice-app') fail('Smarter Justice repository binding mismatch');
  if (JSON.stringify(config.localization?.requiredLocales) !== JSON.stringify(['en', 'es'])) fail('Required locales must be en and es');
  if (config.localization?.toggleRequired !== true || config.localization?.criticalJourneyReceiptRequired !== true) fail('English/Español owner rule is incomplete');
  for (const key of ['persistentStorageRequired','backupReceiptRequired','migrationClassRequired','rollbackMustPreserveNewData']) {
    if (config.dataContinuity?.[key] !== true) fail(`Persistent-user-data owner rule missing ${key}`);
  }
}

const yamlFiles = [
  '.github/workflows/reusable-portfolio-qualification.yml',
  '.github/workflows/portfolio-qualification.yml',
  '.github/workflows/portfolio-staging-deploy.yml',
  '.github/workflows/portfolio-production-deploy.yml',
  '.github/workflows/universal-pipeline-self-test.yml',
  '.github/actions/portfolio-exact-deploy/action.yml'
];
for (const rel of yamlFiles) {
  const text = read(rel);
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*uses:\s*([^#\s]+)(?:\s+#.*)?$/);
    if (!match) continue;
    const ref = match[1];
    if (ref.startsWith('./')) continue;
    if (!/@[0-9a-f]{40}$/.test(ref)) fail(`Unpinned action or workflow in ${rel}: ${ref}`);
  }
}

const reusable = read('.github/workflows/reusable-portfolio-qualification.yml');
if (!/workflow_call:/.test(reusable)) fail('Reusable qualification workflow lacks workflow_call');
if (!/qualification-gate:/.test(reusable)) fail('Reusable qualification workflow lacks fail-closed gate');
if (!/English and Spanish parity gate/.test(reusable)) fail('Reusable qualification workflow lacks bilingual gate');
if (!/persistent user data continuity gate/.test(reusable)) fail('Reusable qualification workflow lacks data-continuity gate');

const staging = read('.github/workflows/portfolio-staging-deploy.yml');
if (!/environment:\s*staging/.test(staging)) fail('Staging caller does not target the portal-local protected staging environment');
if (!/deployment-stage:\s*STAGING/.test(staging)) fail('Staging caller does not bind the shared action to STAGING');
if (!/STAGING_RENDER_DEPLOY_HOOK_URL/.test(staging) || !/STAGING_BASE_URL/.test(staging)) fail('Staging caller lacks protected endpoint contracts');

const production = read('.github/workflows/portfolio-production-deploy.yml');
if (!/environment:\s*production/.test(production)) fail('Production caller does not target the portal-local protected production environment');
if (!/deployment-stage:\s*PRODUCTION/.test(production)) fail('Production caller does not bind the shared action to PRODUCTION');
if (!/rollback_sha:/.test(production) || !/backup_receipt_id:/.test(production)) fail('Production caller lacks rollback or backup receipt inputs');
if (/https:\/\/api\.render\.com\/deploy\//.test(production) || /https:\/\/api\.render\.com\/deploy\//.test(staging)) fail('Caller workflows must not contain Render deploy hook URLs');

const action = read('.github/actions/portfolio-exact-deploy/action.yml');
for (const required of ['deployment-stage','target-sha','target-version','authorization-id','backup-receipt-id','rollback-sha','rollback-version']) {
  if (!action.includes(`${required}:`)) fail(`Deployment action lacks ${required}`);
}
if (!action.includes('qualification-gate')) fail('Deployment action does not verify exact-commit qualification');
if (!action.includes('Restore last-known-good application commit')) fail('Deployment action lacks application rollback');
if (!action.includes('deployment-receipt.json')) fail('Deployment action lacks deployment receipt');
if (!action.includes('api\\.render\\.com/deploy')) fail('Deployment action does not restrict the deploy hook host');

for (const rel of ['scripts/test-spanish-owner-rule.js','scripts/test-data-continuity-owner-rule.js']) {
  const text = read(rel);
  try { new Function(text.replace(/^#!.*\n/, '')); } catch (error) { fail(`${rel} syntax error: ${error.message}`); }
}

if (errors.length) {
  console.error('Universal pipeline self-test failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Universal pipeline self-test passed.');
console.log('This validates the pipeline foundation only; it does not authorize deployment or satisfy product release inventories.');
