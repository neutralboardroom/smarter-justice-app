'use strict';
const fs = require('node:fs');
const path = require('node:path');

const receiptPath = path.join(__dirname, '..', 'deployment', 'pre59', 'NONPRODUCTION_ROLLBACK_CREDENTIAL_ROTATION_REHEARSAL__PRE59.json');
const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
const failures = [];
if (receipt.release !== 'v2.0.0-pre59') failures.push('RELEASE_MISMATCH');
if (receipt.marker !== 'SMARTER_JUSTICE_PRE59_NONPRODUCTION_ROLLBACK_CREDENTIAL_ROTATION_REHEARSAL') failures.push('MARKER_MISMATCH');
if (receipt.state !== 'QUALIFIED_NONPRODUCTION_REHEARSAL_PROVIDER_UNCHANGED') failures.push('STATE_MISMATCH');
const scope = receipt.scope || {};
for (const key of ['providerMutationPerformed', 'credentialCreated', 'credentialRotated', 'credentialRevoked', 'credentialValuePresent', 'networkRequestPerformed']) {
  if (scope[key] !== false) failures.push(`UNSAFE_SCOPE:${key}`);
}
const steps = receipt.rehearsalSteps || [];
if (steps.length !== 6 || steps.some((step, index) => step.sequence !== index + 1)) failures.push('ORDERED_STEPS_INVALID');
if (!steps.some(step => step.result === 'PASS_EXPECTED_FAILURE_INJECTED')) failures.push('FAILURE_INJECTION_MISSING');
if (Object.values(receipt.consequentialActionGates || {}).some(Boolean)) failures.push('CONSEQUENTIAL_GATE_OPEN');
if (receipt.summary?.providerMutations !== 0 || receipt.summary?.credentialValues !== 0) failures.push('MUTATION_SUMMARY_UNSAFE');
if (receipt.summary?.ordinaryPublicExposureChanged !== false || receipt.noLoss !== true) failures.push('NO_LOSS_BOUNDARY_FAILED');
const result = {ok: failures.length === 0, release: receipt.release, marker: receipt.marker, mode: 'NONPRODUCTION_SIMULATION_ONLY', orderedSteps: steps.length, providerMutations: receipt.summary?.providerMutations, credentialValues: receipt.summary?.credentialValues, consequentialGates: 'CLOSED', failures};
console.log(JSON.stringify(result));
if (failures.length) process.exit(1);
