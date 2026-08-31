'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const target = path.join(root, '.runtime', 'pre124-live');
const markerPath = path.join(target, '.pre124-render-bootstrap.json');
if (!fs.existsSync(markerPath)) {
  console.error('[PRE124 DEPLOY] marker missing');
  process.exit(1);
}
const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
if (marker.release !== 'v2.0.0-pre124'
  || marker.baseRelease !== 'v2.0.0-pre123'
  || marker.productAuthority !== 'SMARTER_JUSTICE_ONLY'
  || marker.navigatorOrCommunityMutation !== false
  || marker.stripeMutation !== true
  || marker.paymentSetupDeferredByOwner !== false
  || marker.paymentSetupAuthorizedByOwner !== true
  || marker.productionDeploymentAuthorized !== true) {
  console.error('[PRE124 DEPLOY] marker mismatch');
  process.exit(1);
}
const env = {
  ...process.env,
  PYTHON_BIN: process.env.PYTHON_BIN || 'python3',
  PYTHONDONTWRITEBYTECODE: '1',
  PYTHONPYCACHEPREFIX: process.env.PYTHONPYCACHEPREFIX || '/tmp/sj-pre124-runtime-pycache'
};
env.PYTHONPATH = path.join(target, '.python-vendor') + (env.PYTHONPATH ? path.delimiter + env.PYTHONPATH : '');
const child = spawn(process.execPath, [path.join(target, 'server.js')], { cwd: target, env, stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { if (!child.killed) child.kill(signal); });
child.on('exit', (code, signal) => process.exit(signal ? 1 : (Number.isInteger(code) ? code : 1)));
