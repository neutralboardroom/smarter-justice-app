#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];
const exists = relative => fs.existsSync(path.join(root, relative));
const json = relative => { try { return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8')); } catch { errors.push(`json:${relative}`); return {}; } };
const pkg = json('package.json');
const marker = json('.pre127-render-bootstrap.json');
const receipt = json('PRE127_COMPLETION_RECEIPT.json');
const render = exists('render.yaml') ? fs.readFileSync(path.join(root, 'render.yaml'), 'utf8') : '';

if (pkg.version !== '2.0.0-pre127') errors.push('package-version');
if (marker.release !== 'v2.0.0-pre127' || marker.baseRelease !== 'v2.0.0-pre126') errors.push('release-marker');
if (marker.productionDeploymentAuthorized !== true || marker.productAuthority !== 'SMARTER_JUSTICE_ONLY') errors.push('production-authority');
if (marker.homepagePreserved !== true || marker.homepageRedesign !== false || marker.oneConnectedDomainAndBrand !== true) errors.push('product-boundary');
if (marker.newStripeSetup !== false || marker.newStripeProviderMutation !== false || marker.environmentVariableMutation !== false) errors.push('provider-boundary');
if (receipt.rollbackProductionCommit !== '55a7fd1c13353a5c045e72a20cf08a1ce54c208c' || receipt.noLossFromPredecessor !== true) errors.push('rollback-boundary');
for (const needle of ['name: smarter-justice-app', 'healthCheckPath: /livez', 'branch: main', 'smarterjustice.com', 'autoDeployTrigger: off']) if (!render.includes(needle)) errors.push(`render:${needle}`);
for (const relative of ['server.js', 'public/index.html', 'public/professional-community.html', 'scripts/validate-pre127-deployment-kit.js', 'SBOM.spdx.json']) if (!exists(relative)) errors.push(`missing:${relative}`);

const environment = {
  renderRuntime:Boolean(process.env.RENDER),
  databaseConfigured:Boolean(process.env.DATABASE_URL),
  storageConfigured:Boolean(process.env.SMARTER_JUSTICE_STORAGE_DIR || process.env.RENDER_DISK_MOUNT_PATH),
  smtpConfigured:Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  stripeSecretConfigured:Boolean(process.env.STRIPE_SECRET_KEY),
  stripeWebhookConfigured:Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  openAiKeyConfigured:Boolean(process.env.OPENAI_API_KEY),
  externalUrlConfigured:Boolean(process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL)
};
const result = {
  command:'deployment:doctor',
  release:'v2.0.0-pre127',
  ok:errors.length === 0,
  errors,
  structureReady:errors.length === 0,
  environment,
  environmentDisclosure:'Configuration booleans do not expose secret values and do not by themselves claim provider acceptance or protected readiness.',
  newStripeSetup:false,
  rollbackProductionCommit:receipt.rollbackProductionCommit || ''
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ok) process.exitCode = 1;
