'use strict';

const acceptance = require('../governance/PROFESSIONAL_MEMBERSHIP_LAUNCH_ACCEPTANCE_PRE129.json');

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function registrationRequirements(row = acceptance) {
  const p = row.professionalRegistration || {};
  return {
    requestedOpen:p.requestedOpen === true,
    emailProviderDomainCreated:p.emailProviderDomainCreated === true,
    emailProviderDomainVerified:p.emailProviderDomainVerified === true,
    verificationAndRecoveryE2EPassed:p.verificationAndRecoveryE2EPassed === true,
    abuseAndEnumerationTestsPassed:p.abuseAndEnumerationTestsPassed === true
  };
}

function paymentRequirements(row = acceptance) {
  const p = row.paidMembership || {};
  return {
    requestedOpen:p.requestedOpen === true,
    smarterJusticeStripeAccountAuthorityVerified:p.smarterJusticeStripeAccountAuthorityVerified === true,
    stripeProductsAndPricesMapped:p.stripeProductsAndPricesMapped === true,
    signedWebhookLifecyclePassed:p.signedWebhookLifecyclePassed === true,
    entitlementGrantRevokePassed:p.entitlementGrantRevokePassed === true,
    monthlyAnnualCadencePassed:p.monthlyAnnualCadencePassed === true,
    seatLimitsPassed:p.seatLimitsPassed === true,
    invoiceRenewalCancellationRefundPassed:p.invoiceRenewalCancellationRefundPassed === true,
    firstValueAfterPaymentPassed:p.firstValueAfterPaymentPassed === true,
    memberSupportOwnerAccepted:p.memberSupportOwnerAccepted === true,
    bilingualPurchasePathAccepted:p.bilingualPurchasePathAccepted === true,
    professionalResponsibilityReviewAccepted:p.professionalResponsibilityReviewAccepted === true,
    ownerLaunchGoRecorded:p.ownerLaunchGoRecorded === true
  };
}

function allTrue(record) { return Object.values(record).every(Boolean); }

function state(row = acceptance) {
  const registration = registrationRequirements(row);
  const payment = paymentRequirements(row);
  const professionalRegistrationOpen = allTrue(registration);
  const paidEnrollmentOpen = professionalRegistrationOpen && allTrue(payment);
  return {
    release:row.release,
    professionalPreviewAvailable:row.publicProfessionalPreview?.available === true,
    prospectingLandingReady:row.publicProfessionalPreview?.prospectingLandingReady === true,
    prospectingLandingPath:row.publicProfessionalPreview?.landingPath || '/attorney-partner-tour.html',
    professionalRegistrationOpen,
    paidEnrollmentOpen,
    checkoutOpen:paidEnrollmentOpen,
    paidEntitlementsMayActivate:paidEnrollmentOpen,
    registrationRequirements:clone(registration),
    paymentRequirements:clone(payment),
    sourceControlledAcceptanceRequired:row.releasePolicy?.sourceControlledAcceptanceRequired === true,
    environmentVariableCanOpen:row.releasePolicy?.environmentVariableCanOpen === true
  };
}

function publicStatus(row = acceptance) {
  const current = state(row);
  return {
    professionalPreview:{available:current.professionalPreviewAvailable,label:current.professionalPreviewAvailable?'Available without payment':'Unavailable'},
    linkedinProspecting:{available:current.prospectingLandingReady,label:current.prospectingLandingReady?'Use the current professional overview and free preview':'Not ready'},
    professionalRegistration:{available:current.professionalRegistrationOpen,label:current.professionalRegistrationOpen?'Open':'Temporarily paused'},
    membershipEnrollment:{available:current.paidEnrollmentOpen,label:current.paidEnrollmentOpen?'Open':'Not open'},
    payments:{available:current.checkoutOpen,label:current.checkoutOpen?'Open':'Not open'},
    message:current.paidEnrollmentOpen
      ? 'Paid membership enrollment is open under the current accepted launch record.'
      : 'The professional overview, free profiles, and community preview are available. Paid membership remains closed until the launch requirements are accepted.'
  };
}

function validate(row = acceptance) {
  const errors = [];
  const current = state(row);
  if (current.environmentVariableCanOpen) errors.push('environment-variable-may-not-open');
  if (row.isolation?.franklinNavigatorStripeExcluded !== true) errors.push('franklin-stripe-isolation');
  if (row.isolation?.franklinNavigatorEmailDomainExcluded !== true) errors.push('franklin-email-isolation');
  if (row.releasePolicy?.providerConfigurationAloneCanOpen !== false) errors.push('provider-configuration-may-not-open-alone');
  if (row.releasePolicy?.newReleaseRequiredToChangeRequestedOpenToTrue !== true) errors.push('new-release-required');
  if (current.professionalRegistrationOpen !== Boolean(row.professionalRegistration?.open)) errors.push('registration-open-mismatch');
  if (current.paidEnrollmentOpen !== Boolean(row.paidMembership?.open)) errors.push('paid-open-mismatch');
  if (!current.prospectingLandingReady || current.prospectingLandingPath !== '/attorney-partner-tour.html') errors.push('prospecting-landing');
  return { ok:errors.length === 0, errors, state:current };
}

module.exports = { acceptance, registrationRequirements, paymentRequirements, state, publicStatus, validate };
