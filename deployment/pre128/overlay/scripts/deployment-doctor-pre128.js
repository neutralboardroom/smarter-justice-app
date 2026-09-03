#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const errors = [];
const exists = relative => fs.existsSync(path.join(root, relative));
const json = relative => { try { return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8')); } catch { errors.push(`invalid-json:${relative}`); return {}; } };
const pkg = json('package.json');
const marker = json('.pre128-render-bootstrap.json');
const receipt = json('PRE128_COMPLETION_RECEIPT.json');
const render = exists('render.yaml') ? fs.readFileSync(path.join(root, 'render.yaml'), 'utf8') : '';

if (pkg.version !== '2.0.0-pre128') errors.push('package-version');
if (marker.release !== 'v2.0.0-pre128' || marker.baseRelease !== 'v2.0.0-pre127') errors.push('release-marker');
if (marker.productionDeploymentAuthorized !== true || marker.productAuthority !== 'SMARTER_JUSTICE_ONLY') errors.push('production-authority');
if (marker.sourceCommit !== 'a746c2d689c03ba713d9d31dd952bc9fd2137dbb' || marker.sourceTree !== '966152d3e62f4a4df45dcfb7241f3a444a90f97d') errors.push('source-lineage');
if (marker.rollbackProductionCommit !== marker.sourceCommit || receipt.noLossFromPredecessor !== true) errors.push('rollback-or-no-loss');
if (marker.paidMembershipEnrollmentOpen !== false || marker.checkoutOpen !== false || marker.providerMutation !== false) errors.push('commercial-boundary');
for (const needle of ['name: smarter-justice-app','healthCheckPath: /livez','branch: main','smarterjustice.com','autoDeployTrigger: off']) if (!render.includes(needle)) errors.push(`render-blueprint:${needle}`);
for (const relative of ['server.js','public/index.html','public/professional-community.html','scripts/validate-pre128-deployment-kit.js','SBOM.spdx.json']) if (!exists(relative)) errors.push(`missing:${relative}`);

const environment = {
  renderRuntime:Boolean(process.env.RENDER),
  databaseConfigured:Boolean(process.env.DATABASE_URL),
  durableStorageConfigured:Boolean(process.env.DATABASE_URL || process.env.SMARTER_JUSTICE_STORAGE_DIR || process.env.RENDER_DISK_MOUNT_PATH),
  transactionalEmailConfigured:Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM),
  externalUrlConfigured:Boolean(process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL),
  aiCredentialPresent:Boolean(process.env.OPENAI_API_KEY),
  paymentCredentialPresent:Boolean(process.env.STRIPE_SECRET_KEY),
  paymentWebhookCredentialPresent:Boolean(process.env.STRIPE_WEBHOOK_SECRET)
};
const result = {
  command:'deployment:doctor', release:'v2.0.0-pre128', ok:errors.length === 0, errors,
  structureReady:errors.length === 0, environment,
  environmentDisclosure:'These protected diagnostic booleans are not returned by a public endpoint and do not claim provider acceptance.',
  publicCommunityPreview:true, newProfessionalRegistrationOpen:false, paidMembershipEnrollmentOpen:false, checkoutOpen:false,
  providerMutation:false, rollbackProductionCommit:marker.rollbackProductionCommit || ''
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ok) process.exitCode = 1;
