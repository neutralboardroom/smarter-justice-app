'use strict';

const assert = require('assert');
const gate = require('../lib/professionalLaunchGatePre129');

const validation = gate.validate();
assert.equal(validation.ok, true, validation.errors.join(', '));
assert.equal(validation.state.professionalPreviewAvailable, true);
assert.equal(validation.state.prospectingLandingReady, true);
assert.equal(validation.state.prospectingLandingPath, '/attorney-partner-tour.html');
assert.equal(validation.state.professionalRegistrationOpen, false);
assert.equal(validation.state.paidEnrollmentOpen, false);
assert.equal(validation.state.checkoutOpen, false);
assert.equal(validation.state.paidEntitlementsMayActivate, false);
assert.equal(validation.state.environmentVariableCanOpen, false);

const safe = gate.publicStatus();
assert.equal(safe.linkedinProspecting.available, true);
assert.equal(safe.professionalRegistration.available, false);
assert.equal(safe.membershipEnrollment.available, false);
assert.equal(safe.payments.available, false);
const safeText = JSON.stringify(safe);
for (const forbidden of ['Franklin Navigator','acct_','price_','prod_','resend','DKIM','SPF','secret','webhook']) {
  assert.equal(safeText.includes(forbidden), false, forbidden);
}

const allTrue = JSON.parse(JSON.stringify(gate.acceptance));
allTrue.professionalRegistration.requestedOpen = true;
allTrue.professionalRegistration.emailProviderDomainVerified = true;
allTrue.professionalRegistration.verificationAndRecoveryE2EPassed = true;
allTrue.professionalRegistration.abuseAndEnumerationTestsPassed = true;
allTrue.professionalRegistration.open = true;
for (const key of Object.keys(allTrue.paidMembership)) {
  if (typeof allTrue.paidMembership[key] === 'boolean') allTrue.paidMembership[key] = true;
}
allTrue.paidMembership.open = true;
const future = gate.validate(allTrue);
assert.equal(future.ok, true, future.errors.join(', '));
assert.equal(future.state.professionalRegistrationOpen, true);
assert.equal(future.state.paidEnrollmentOpen, true);

const missingStripeAuthority = JSON.parse(JSON.stringify(allTrue));
missingStripeAuthority.paidMembership.smarterJusticeStripeAccountAuthorityVerified = false;
missingStripeAuthority.paidMembership.open = false;
assert.equal(gate.validate(missingStripeAuthority).state.paidEnrollmentOpen, false);

const providerOnly = JSON.parse(JSON.stringify(gate.acceptance));
providerOnly.professionalRegistration.emailProviderDomainVerified = true;
providerOnly.paidMembership.stripeProductsAndPricesMapped = true;
assert.equal(gate.state(providerOnly).professionalRegistrationOpen, false);
assert.equal(gate.state(providerOnly).paidEnrollmentOpen, false);

console.log(JSON.stringify({
  ok:true,
  suite:'pre129-launch-readiness',
  professionalPreviewAvailable:true,
  linkedinProspectingLandingReady:true,
  professionalRegistrationOpen:false,
  paidEnrollmentOpen:false,
  crossProductProviderReuse:false,
  environmentVariableCanOpen:false
}, null, 2));
