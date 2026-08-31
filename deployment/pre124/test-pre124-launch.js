'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const runtime = path.join(root, '.runtime', 'pre124-live');
const read = relative => fs.readFileSync(path.join(runtime, relative), 'utf8');
const json = relative => JSON.parse(read(relative));

assert(fs.existsSync(runtime), 'PRE124 runtime is missing');

const marker = json('.pre124-render-bootstrap.json');
assert.strictEqual(marker.release, 'v2.0.0-pre124');
assert.strictEqual(marker.productAuthority, 'SMARTER_JUSTICE_ONLY');
assert.strictEqual(marker.navigatorOrCommunityMutation, false);
assert.strictEqual(marker.stripeMutation, true);
assert.strictEqual(marker.paymentSetupDeferredByOwner, false);
assert.strictEqual(marker.paymentSetupAuthorizedByOwner, true);

const server = read('server.js');
const readiness = read('lib/operationalReadiness.js');
const environmentExample = read('.env.example');
assert(server.includes("'Stripe-Version': '2026-07-29.dahlia'"));
assert(server.includes("'line_items[0][price]':stripePriceId"));
assert(!server.includes("'line_items[0][price_data][product_data][name]':plan.name"));
for (const key of [
  'STRIPE_SMARTER_JUSTICE_PROFESSIONAL_MONTHLY_PRICE_ID',
  'STRIPE_SMARTER_JUSTICE_PROFESSIONAL_ANNUAL_PRICE_ID',
  'STRIPE_SMARTER_JUSTICE_TEAM_MONTHLY_PRICE_ID',
  'STRIPE_SMARTER_JUSTICE_TEAM_ANNUAL_PRICE_ID',
  'STRIPE_SMARTER_JUSTICE_OFFICE_MONTHLY_PRICE_ID',
  'STRIPE_SMARTER_JUSTICE_OFFICE_ANNUAL_PRICE_ID'
]) assert(readiness.includes(key) && environmentExample.includes(key), `membership price key is not enforced: ${key}`);
assert(server.includes("pathName === '/api/public/ai-smoke'"));

Object.assign(process.env,{
  OPENAI_AI_ENABLED:'true',
  AI_GLOBAL_KILL_SWITCH:'false',
  AI_COST_HARD_STOP:'false',
  AI_TOOL_SJ_STARTING_POINT_ENABLED:'true',
  AI_PORTAL_SMARTER_JUSTICE_CENTRAL_ENABLED:'true',
  OPENAI_API_KEY:'synthetic-test-key',
  OPENAI_MODEL:'gpt-5-mini'
});
const gateway = require(path.join(runtime, 'lib', 'centralAiGateway.js'));
assert.strictEqual(typeof gateway.runSyntheticSmoke, 'function');
const publicAi = gateway.publicStatus();
for (const internalKey of ['launchState', 'liveSmokeState', 'featureFlagState']) {
  assert(!Object.prototype.hasOwnProperty.call(publicAi, internalKey), `public AI status exposes ${internalKey}`);
}

const membership = read('public/professional-membership.html');
for (const price of ['$10', '$100', '$29', '$290', '$49', '$490']) assert(membership.includes(price), `missing price ${price}`);
const publicRoot=path.join(runtime,'public');
const htmlFiles=[];
const walk=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const absolute=path.join(directory,entry.name);if(entry.isDirectory())walk(absolute);else if(entry.isFile()&&entry.name.endsWith('.html'))htmlFiles.push(absolute);}};
walk(publicRoot);
for(const file of htmlFiles){const html=fs.readFileSync(file,'utf8');assert(!html.includes('$12/month')&&!html.includes('$120/year'),`stale individual price in ${path.relative(runtime,file)}`);}
const priceAuthority=read('lib/revenueAuthorityPre72.js');
assert(priceAuthority.includes('monthlyPriceCents:1000,annualPriceCents:10000'));
assert(!priceAuthority.includes('monthlyPriceCents:1200,annualPriceCents:12000'));
const terms = read('public/professional-membership-terms.html');
assert(!/owner gates?|paid enrollment remains unavailable|planning value until enrollment opens/i.test(terms));
const aiSummary = read('public/ai-summary.html');
assert(!/fail-closed|Control Center tracks|Version 1\.7|release|deployment/i.test(aiSummary));

const index = read('public/index.html');
assert(index.includes('Focused legal starting help, practical tools, and independent professional search in one connected platform.'));
const practiceAreas = read('data/practiceAreas.js');
assert(/car and vehicle accidents/i.test(practiceAreas));

const receipt = json('PRE124_COMPLETION_RECEIPT.json');
assert.strictEqual(receipt.predecessorUnchangedFilesHashVerified, true);
assert(Number(receipt.changes.publicPagesAudited) >= 100);

(async()=>{
  const syntheticOutput={
    plainLanguageSummary:'This is a preparation summary, not a legal conclusion.',
    likelyNextPath:'Review the organized information.',
    missingInformation:['Confirm the incident date.'],
    reviewRecommendation:'Review and correct the information before relying on it.',
    safetyNotes:['This is not legal advice and does not create an attorney-client relationship.']
  };
  const smoke=await gateway.runSyntheticSmoke({transport:async()=>({data:{id:'resp_synthetic',output_text:JSON.stringify(syntheticOutput),usage:{input_tokens:10,output_tokens:20,total_tokens:30}},headers:{'x-request-id':'req_synthetic'},statusCode:200})});
  assert.strictEqual(smoke.ok,true,'synthetic provider smoke did not pass');
  assert.strictEqual(gateway.publicStatus().providerVerified,true,'successful provider smoke was not reflected publicly');
  console.log(JSON.stringify({
    ok: true,
    release: marker.release,
    publicPagesAudited: receipt.changes.publicPagesAudited,
    stripeMutation: marker.stripeMutation,
    paymentSetupAuthorizedByOwner: marker.paymentSetupAuthorizedByOwner,
    syntheticAiSmoke:smoke.ok,
    publicAiKeys: Object.keys(publicAi).sort()
  }, null, 2));
})().catch(error=>{console.error(error);process.exitCode=1;});
