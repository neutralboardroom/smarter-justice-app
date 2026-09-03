'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const target = path.join(root, '.runtime', 'pre128-live');
const markerPath = path.join(target, '.pre128-render-bootstrap.json');
if (!fs.existsSync(markerPath)) {
  console.error('[PRE128 DEPLOY] marker missing');
  process.exit(1);
}
const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
if (marker.release !== 'v2.0.0-pre128'
  || marker.baseRelease !== 'v2.0.0-pre127'
  || marker.sourceCommit !== 'a746c2d689c03ba713d9d31dd952bc9fd2137dbb'
  || marker.sourceTree !== '966152d3e62f4a4df45dcfb7241f3a444a90f97d'
  || marker.rollbackProductionCommit !== marker.sourceCommit
  || marker.productAuthority !== 'SMARTER_JUSTICE_ONLY'
  || marker.oneConnectedDomainAndBrand !== true
  || marker.homepageVisualSystemPreserved !== true
  || marker.homepageRedesign !== false
  || marker.newProfessionalRegistrationOpen !== false
  || marker.paidMembershipEnrollmentOpen !== false
  || marker.checkoutOpen !== false
  || marker.newStripeSetup !== false
  || marker.providerMutation !== false
  || marker.environmentVariableMutation !== false
  || marker.qualificationState !== 'QUALIFIED_SUCCESSOR'
  || marker.productionDeploymentAuthorized !== true) {
  console.error('[PRE128 DEPLOY] marker mismatch');
  process.exit(1);
}
const env = {
  ...process.env,
  PYTHON_BIN:process.env.PYTHON_BIN || 'python3',
  PYTHONDONTWRITEBYTECODE:'1',
  PYTHONPYCACHEPREFIX:process.env.PYTHONPYCACHEPREFIX || '/tmp/sj-pre128-runtime-pycache'
};
env.PYTHONPATH = path.join(target, '.python-vendor') + (env.PYTHONPATH ? path.delimiter + env.PYTHONPATH : '');
const child = spawn(process.execPath, [path.join(target, 'server.js')], { cwd:target, env, stdio:'inherit' });
for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => { if (!child.killed) child.kill(signal); });
child.on('exit', (code, signal) => process.exit(signal ? 1 : (Number.isInteger(code) ? code : 1)));
