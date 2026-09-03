'use strict';

const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { portForTest } = require('./test-port');

const root = path.resolve(__dirname, '..');
const port = portForTest(128);
const base = `http://127.0.0.1:${port}`;
const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'sj-http-contract-'));
const child = spawn(process.execPath, ['server.js'], {
  cwd:root,
  env:{
    ...process.env,
    NODE_ENV:'test',
    PORT:String(port),
    APP_BASE_URL:base,
    SMARTER_JUSTICE_STORAGE_DIR:storage,
    OWNER_ACCOUNT_EMAIL:'owner-http@example.test',
    OWNER_ACCOUNT_PASSWORD:'HttpOwnerPassword!128',
    SMTP_HOST:'', SMTP_USER:'', SMTP_PASS:'', SMTP_FROM:'',
    STRIPE_SECRET_KEY:'', STRIPE_WEBHOOK_SECRET:''
  },
  stdio:['ignore','pipe','pipe']
});
let output = '';
child.stdout.on('data', chunk => { output += String(chunk); });
child.stderr.on('data', chunk => { output += String(chunk); });
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function response(pathname, options = {}) {
  const result = await fetch(base + pathname, { redirect:'manual', ...options });
  const text = await result.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { result, text, data };
}

(async () => {
  try {
    for (let attempt = 0; attempt < 100 && !output.includes('listening'); attempt += 1) {
      if (child.exitCode !== null) throw new Error(`Server exited before readiness:\n${output}`);
      await wait(75);
    }
    assert(output.includes('listening'), output);

    let item = await response('/health');
    assert.equal(item.result.status, 200);
    assert.equal(item.data.ok, true);
    assert.equal(item.data.app, 'Smarter Justice');
    assert.equal(item.data.version, '2.0.0-pre128');
    assert.equal('portalCount' in item.data, false);
    assert.equal('sensitiveTrafficApproved' in item.data, false);

    item = await response('/api/release-identity');
    assert.equal(item.result.status, 200);
    assert.deepEqual(Object.keys(item.data).sort(), ['app','ok','version']);

    item = await response('/api/ai-status');
    assert.equal(item.result.status, 200);
    assert.equal(item.data.available, false);
    assert.equal(item.data.rulesBasedHelpAvailable, true);

    item = await response('/api/public-config');
    assert.equal(item.result.status, 200);
    assert.equal(item.data.assistance.aiAssistanceAvailable, false);

    item = await response('/api/public/provider-readiness');
    assert.equal(item.result.status, 200);
    assert.equal(item.data.professionalRegistration.available, false);
    assert.equal(item.data.membershipEnrollment.available, false);
    assert.equal(item.data.rulesBasedHelp.available, true);
    assert.equal(item.data.aiAssistance.available, false);
    for (const key of ['stripeSecretConfigured','stripeWebhookConfigured','openAiKeyConfigured','openAiModelConfigured','openAiGlobalKillSwitch','paymentCapability']) assert.equal(key in item.data, false, key);

    item = await response('/api/public/legal-community-membership');
    assert.equal(item.result.status, 200);
    assert.equal(item.data.membership.enrollmentAvailable, false);
    assert.equal(item.data.membership.checkoutAvailable, false);
    assert.equal(item.data.membership.plannedPlans[0].monthlyDollars, 10);

    item = await response('/api/public/legal-communities');
    assert.equal(item.result.status, 200);
    assert.equal(item.data.communities.length, 1);
    assert.equal('candidateCommunities' in item.data, false);
    assert.equal('networkModel' in item.data, false);

    item = await response('/api/public/legal-communities/downtown-brooklyn/professional-preview');
    assert.equal(item.result.status, 200);
    assert.equal(item.data.experience.preview, true);
    assert.equal(item.data.experience.paidBenefitsActive, false);

    item = await response('/api/initial-launch-pilots');
    assert.equal(item.result.status, 410);
    assert.equal(item.data.ok, false);
    assert(item.data.currentPaths.some(path => path === '/communities'));
    assert(!JSON.stringify(item.data).includes('micro-portal'));

    item = await response('/founding-portals.html');
    assert.equal(item.result.status, 301);
    assert.equal(item.result.headers.get('location'), '/communities');

    item = await response('/professional-signup.html');
    assert.equal(item.result.status, 200);
    assert(item.text.includes('New registration is temporarily paused.'));
    assert(!/\bPRE\d{2,4}\b/i.test(item.text));
    assert.equal(item.result.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');

    item = await response('/');
    assert.equal(item.result.status, 200);
    assert(item.text.includes('Tell us what happened.'));
    assert(item.text.includes('Not sent to lawyers'));
    assert(!/pre124-public-copy-guard|pre124-launch/i.test(item.text));
    assert(!/\bPRE\d{2,4}\b/i.test(item.text));

    console.log(JSON.stringify({
      ok:true,
      suite:'pre128-http-contract',
      healthSafe:true,
      publicProviderStatusSafe:true,
      communityPreviewTruthful:true,
      legacyTopologyRetired:true,
      signupPageFailClosed:true,
      homepageFirstEncounterPreserved:true
    }, null, 2));
  } catch (error) {
    console.error(error);
    console.error(output);
    process.exitCode = 1;
  } finally {
    child.kill('SIGTERM');
    fs.rmSync(storage, { recursive:true, force:true });
  }
})();
