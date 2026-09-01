#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];
const exists = relative => fs.existsSync(path.join(root, relative));
const json = relative => { try { return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8')); } catch { errors.push(`json:${relative}`); return {}; } };
const pkg = json('package.json');
const marker = json('.pre126-render-bootstrap.json');
const receipt = json('PRE126_COMPLETION_RECEIPT.json');
const render = exists('render.yaml') ? fs.readFileSync(path.join(root, 'render.yaml'), 'utf8') : '';

if (pkg.version !== '2.0.0-pre126') errors.push('package-version');
if (marker.release !== 'v2.0.0-pre126' || marker.baseRelease !== 'v2.0.0-pre125') errors.push('release-marker');
if (marker.productionDeploymentAuthorized !== true || marker.productAuthority !== 'SMARTER_JUSTICE_ONLY') errors.push('production-authority');
if (marker.newStripeSetup !== false || marker.newStripeProviderMutation !== false || marker.environmentVariableMutation !== false) errors.push('provider-boundary');
if (receipt.rollbackCommit !== '2e4b90c083c469bc0e055747258fc9521eed06b2' || receipt.noLossFromPredecessor !== true) errors.push('rollback-boundary');
for (const needle of ['name: smarter-justice-app', 'healthCheckPath: /livez', 'branch: main', 'smarterjustice.com', 'autoDeployTrigger: off']) if (!render.includes(needle)) errors.push(`render:${needle}`);
for (const relative of ['server.js', 'public/index.html', 'public/communities/downtown-brooklyn.html', 'scripts/validate-pre126-deployment-kit.js', 'SBOM.spdx.json']) if (!exists(relative)) errors.push(`missing:${relative}`);

const environment = {
  renderRuntime: Boolean(process.env.RENDER),
  databaseConfigured: Boolean(process.env.DATABASE_URL),
  storageConfigured: Boolean(process.env.SMARTER_JUSTICE_STORAGE_DIR || process.env.RENDER_DISK_MOUNT_PATH),
  smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  stripeSecretConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  openAiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
  externalUrlConfigured: Boolean(process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL)
};
const result = {
  command: 'deployment:doctor',
  release: 'v2.0.0-pre126',
  ok: errors.length === 0,
  errors,
  structureReady: errors.length === 0,
  environment,
  environmentDisclosure: 'Configuration booleans do not expose secret values and do not by themselves claim live provider acceptance.',
  newStripeSetup: false,
  rollbackCommit: receipt.rollbackCommit || ''
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ok) process.exitCode = 1;
