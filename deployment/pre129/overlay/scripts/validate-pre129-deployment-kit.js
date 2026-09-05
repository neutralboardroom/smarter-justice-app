'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const marker = JSON.parse(fs.readFileSync(path.join(root, '.pre129-render-bootstrap.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const gate = require('../lib/professionalLaunchGatePre129');

assert.equal(marker.release, 'v2.0.0-pre129');
assert.equal(marker.baseRelease, 'v2.0.0-pre128');
assert.equal(marker.productAuthority, 'SMARTER_JUSTICE_ONLY');
assert.equal(marker.professionalRegistrationOpen, false);
assert.equal(marker.paidMembershipEnrollmentOpen, false);
assert.equal(marker.checkoutOpen, false);
assert.equal(marker.environmentVariableCanOpen, false);
assert.equal(pkg.version, '2.0.0-pre129');
assert.equal(gate.validate().ok, true);
assert.equal(gate.state().paidEnrollmentOpen, false);

const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
assert(server.includes("require('./lib/professionalLaunchGatePre129')"));
assert(server.includes('professionalLaunchGatePre129.publicStatus()'));
assert(server.includes("SJ_PRE129_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED"));
assert(!server.includes("envFlag('SJ_PRE128_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED')"));

for (const relative of [
  'public/index.html',
  'public/attorney-partner-tour.html',
  'public/professional-membership.html',
  'public/find-my-profile.html',
  'public/es/para-abogados.html',
  'public/es/membresia-profesional.html',
  'release-evidence/PRE129_LAUNCH_PROVIDER_RECONCILIATION.md',
  'NEXT_VERSION_IMPROVEMENT_LIST.md'
]) assert(fs.existsSync(path.join(root, relative)), relative);

console.log(JSON.stringify({
  ok:true,
  release:marker.release,
  professionalPreviewAvailable:true,
  linkedinProspectingLandingReady:true,
  professionalRegistrationOpen:false,
  paidMembershipEnrollmentOpen:false,
  checkoutOpen:false
}, null, 2));
