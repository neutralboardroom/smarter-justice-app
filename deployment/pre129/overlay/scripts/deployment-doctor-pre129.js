'use strict';

const gate = require('../lib/professionalLaunchGatePre129');
const validation = gate.validate();
const state = gate.state();
console.log(JSON.stringify({
  ok:validation.ok,
  release:state.release,
  professionalPreviewAvailable:state.professionalPreviewAvailable,
  prospectingLandingReady:state.prospectingLandingReady,
  prospectingLandingPath:state.prospectingLandingPath,
  professionalRegistrationOpen:state.professionalRegistrationOpen,
  paidEnrollmentOpen:state.paidEnrollmentOpen,
  checkoutOpen:state.checkoutOpen,
  sourceControlledAcceptanceRequired:state.sourceControlledAcceptanceRequired,
  environmentVariableCanOpen:state.environmentVariableCanOpen
}, null, 2));
if (!validation.ok) process.exit(1);
