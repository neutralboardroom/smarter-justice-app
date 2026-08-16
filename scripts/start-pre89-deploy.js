'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const target = path.join(root, '.runtime', 'pre89-live');
const markerPath = path.join(target, '.pre89-render-bootstrap.json');

function fail(message) {
  console.error(`[PRE89 START] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(markerPath)) fail('verified PRE89 bootstrap marker is missing');
const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
if (marker.release !== 'v2.0.0-pre89') fail(`unexpected release marker: ${marker.release}`);
if (marker.carrierSha256 !== '8b3c65882e8a2c880df45ca22c4f8c4f08182fe64fdbd73f1aa13753e38ccc10') fail('carrier identity mismatch at startup');
if (!marker.profileCounts || marker.profileCounts.total !== 12278) fail('PRE89 profile-count marker mismatch');
if (marker.preSealRuleLock !== 'PASS') fail('PRE89 pre-seal rule lock is not PASS');

const server = path.join(target, 'server.js');
if (!fs.existsSync(server)) fail('PRE89 server.js is missing');
const env = {
  ...process.env,
  SMARTER_JUSTICE_DEPLOYMENT_RELEASE: 'v2.0.0-pre89',
  SMARTER_JUSTICE_DEPLOYMENT_CARRIER_SHA256: marker.carrierSha256
};
console.log(`[PRE89 START] launching ${marker.release} with ${marker.profileCounts.total} qualified Factory identities`);
const child = spawn(process.execPath, [server], {
  cwd: target,
  env,
  stdio: 'inherit'
});
child.on('error', (error) => fail(`server process failed to start: ${error.message}`));
child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[PRE89 START] server exited via signal ${signal}`);
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code == null ? 1 : code);
});
