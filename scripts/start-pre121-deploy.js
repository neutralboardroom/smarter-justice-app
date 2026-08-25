'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const target = path.join(root, '.runtime', 'pre121-live');
const marker = path.join(target, '.pre121-render-bootstrap.json');
if (!fs.existsSync(marker)) {
  console.error('[PRE121 DEPLOY] marker missing');
  process.exit(1);
}
const metadata = JSON.parse(fs.readFileSync(marker, 'utf8'));
if (metadata.release !== 'v2.0.0-pre121' || metadata.baseRelease !== 'v2.0.0-pre120' || metadata.productAuthority !== 'SMARTER_JUSTICE_ONLY' || metadata.navigatorOrCommunityMutation !== false || metadata.productionDeploymentAuthorized !== true || metadata.pre121OverlaySha256 !== '22bf8ae95d5957f4ec1f8a3298b6f71a576df2c265c74a11c9b1301e7c2366a3') {
  console.error('[PRE121 DEPLOY] marker mismatch');
  process.exit(1);
}
const env = {
  ...process.env,
  PYTHON_BIN: process.env.PYTHON_BIN || 'python3',
  PYTHONDONTWRITEBYTECODE: '1',
  PYTHONPYCACHEPREFIX: process.env.PYTHONPYCACHEPREFIX || '/tmp/sj-pre121-runtime-pycache'
};
env.PYTHONPATH = path.join(target, '.python-vendor') + (env.PYTHONPATH ? path.delimiter + env.PYTHONPATH : '');
const child = spawn(process.execPath, [path.join(target, 'server.js')], { cwd: target, env, stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { if (!child.killed) child.kill(signal); });
child.on('exit', (code, signal) => process.exit(signal ? 1 : (Number.isInteger(code) ? code : 1)));
