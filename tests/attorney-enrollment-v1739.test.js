'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const pkg=require('../package.json');
const manifest=require('../portal-manifest.json');
const signup=fs.readFileSync(path.join(root,'public','professional-signup.html'),'utf8');
const professionalJs=fs.readFileSync(path.join(root,'public','professional.js'),'utf8');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const accounts=fs.readFileSync(path.join(root,'lib','professionalAccounts.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public','styles.css'),'utf8');

assert.equal(pkg.version,'1.7.83');
assert.equal(pkg.scripts.test.split(' && ').length,145);
assert.equal(require('../server-version-helper').version,'1.7.83');
assert.equal(manifest.currentDevelopmentVersion,'1.7.83');
assert.equal(manifest.lastExactArtifactTestVersion,'1.7.82');
assert.equal(manifest.testSuiteParts,146);
for(const capability of ['streamlinedAttorneySignupV1739','twelveCharacterSignupPasswordParityV1739','authoritativeFirmSeatCheckoutV1739','approvedApplicationCheckoutMatchV1739','membershipCheckoutAcknowledgmentsV1739','stripeCheckoutIdempotencyV1739','professionalProfileCompletenessV1739','professionalProfileUnsavedStateV1739','firmIdentityProtectionV1739','attorneyEnrollmentRegressionV1739'])assert.equal(manifest.capabilities[capability],true,capability);

assert(/Create your account now\. Complete your profile at your pace\./.test(signup));
assert((signup.match(/minlength="12"/g)||[]).length===2,'signup password and confirmation must match the 12-character server minimum');
assert(/id="signupProfileDetails"/.test(signup),'optional profile preparation must be separately expandable');
assert(/No client information belongs here/.test(signup));
assert(/name="firmName"/.test(signup));
assert(/max="500"[^>]*name="seatCount"|name="seatCount"[^>]*max="500"/.test(signup));
assert(/name="startMembership" type="checkbox">/.test(signup),'future membership preference must not be preselected');
assert(!/name="startMembership"[^>]*checked/.test(signup),'account creation must not default a user into a membership preference');

for(const phrase of ['profileCompleteness','Unsaved changes.','membershipPriceSummary','Renews every','acceptCancellationPolicy','Opening Stripe Checkout','Idempotency-Key','Your membership is active','Billing and Cancellation Support'])assert(professionalJs.includes(phrase),phrase);
assert(professionalJs.includes("requestedType==='firm'"),'firm signup must reveal the required firm fields');
assert(/activeTargets=targets\.filter/.test(professionalJs),'active memberships must use a management state rather than another checkout');

for(const phrase of ['authoritativeSeatCount','The firm seat count changed','approved application does not match','approved seat count does not match','selected billing frequency differs','acceptCancellationPolicy','idempotencyKeyHash','already active'])assert(server.includes(phrase),phrase);
assert(/stripeRequest\('POST','\/v1\/checkout\/sessions',form,\{idempotencyKey\}\)/.test(server),'Stripe checkout must use idempotency');
assert(/schemaVersion:'1\.7\.0'/.test(accounts));
assert(/Add the firm name before creating a firm account/.test(accounts));
assert(/Add the professional’s public display name/.test(accounts));
assert(/Add the firm name\./.test(accounts));
assert(/Math\.min\(500/.test(accounts),'firm seat counts must be bounded');
assert(css.includes('v1.7.41 attorney enrollment, checkout, and profile-management refinements'));
assert(css.includes('.profile-completeness'));
assert(css.includes('.membership-price-summary'));
assert(css.includes('.active-membership-list'));

for(const file of ['AUDIT_REPORT_V1.7.41.md','CHANGE_MAP_V1.7.41.md','CONTINUATION_PROMPT_V1.7.41.md','RELEASE_EVIDENCE_V1.7.41.json','CURRENT_ENVIRONMENT_REVIEW_V1.7.41.json','ATTORNEY_ENROLLMENT_ACCEPTANCE_V1.7.41.md','LAUNCH_RUNBOOK_48_HOUR_V1.7.41.md'])assert(fs.existsSync(path.join(root,file)),file);
const evidence=require('../RELEASE_EVIDENCE_V1.7.41.json');
assert.equal(evidence.release,'1.7.41');
assert.equal(evidence.activationGatesChanged,false);
assert.equal(evidence.deployment.deployed,false);
console.log('attorney-enrollment-v1739.test.js passed');
