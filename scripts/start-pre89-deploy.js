'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const target = path.join(root, '.runtime', 'pre89-live');
const markerPath = path.join(target, '.pre89-render-bootstrap.json');
const port = Number(process.env.PORT || 10000);

function truthy(name, fallback=false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(raw));
}
function fail(message, child) {
  console.error(`[PRE89 START] ${message}`);
  if (child && !child.killed) child.kill('SIGTERM');
  process.exit(1);
}
function request(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: pathname, timeout: 5000, headers: { 'user-agent': 'smarter-justice-pre89-render-selftest/3' } }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('timeout', () => req.destroy(new Error(`timeout ${pathname}`)));
    req.on('error', reject);
  });
}
async function waitForServer() {
  let last;
  for (let i = 0; i < 40; i++) {
    try {
      const result = await request('/health');
      if (result.status === 200) return result;
      last = new Error(`health status ${result.status}`);
    } catch (error) { last = error; }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw last || new Error('server did not become healthy');
}
async function runSelfTest() {
  const matrix = [
    ['/health', [200], 'json'],
    ['/livez', [200], 'json'],
    ['/readyz?lane=free-professional-profiles', [200,503], 'json'],
    ['/api/ai-status', [200], 'json'],
    ['/', [200], 'html'],
    ['/help-options.html', [200], 'html'],
    ['/practice-areas.html', [200], 'html'],
    ['/professionals.html', [200], 'html'],
    ['/profile-review.html', [200], 'html'],
    ['/pricing.html', [200], 'html'],
    ['/firm-first-value.html', [200], 'html'],
    ['/free-tools.html', [200], 'html'],
    ['/navigator.html', [200], 'html'],
    ['/privacy.html', [200], 'html'],
    ['/contact.html', [200], 'html'],
    ['/es/', [200], 'html'],
    ['/es/precios.html', [200], 'html'],
    ['/es/profile-review.html', [200], 'html'],
    ['/es/firm-first-value.html', [200], 'html'],
    ['/styles.css', [200], 'asset'],
    ['/__smarter_justice_pre89_hard_404__', [404], 'status']
  ];
  const results = [];
  let aiStatus = null;
  for (const [pathname, statuses, kind] of matrix) {
    const result = await request(pathname);
    if (!statuses.includes(result.status)) throw new Error(`${pathname} status ${result.status}; expected ${statuses.join('/')}`);
    if (kind === 'html') {
      if (!/text\/html/i.test(String(result.headers['content-type'] || '')) || result.body.length < 300) throw new Error(`${pathname} did not return a substantive HTML document`);
    }
    if (kind === 'asset' && result.body.length < 1000) throw new Error(`${pathname} returned an undersized asset`);
    if (kind === 'json') {
      let parsed;
      try { parsed = JSON.parse(result.body); } catch { throw new Error(`${pathname} did not return valid JSON`); }
      if (pathname === '/api/ai-status') aiStatus = parsed;
    }
    results.push({ path: pathname, status: result.status, bytes: Buffer.byteLength(result.body) });
  }
  const home = results.find((r) => r.path === '/');
  const aiRuntime = {
    keyConfigured: Boolean(String(process.env.OPENAI_API_KEY || '').trim()),
    projectConfigured: Boolean(String(process.env.OPENAI_PROJECT_ID || '').trim()),
    aiEnabledEnv: truthy('OPENAI_AI_ENABLED', false),
    globalKillSwitch: truthy('AI_GLOBAL_KILL_SWITCH', true),
    startingPointToolEnabled: truthy('AI_TOOL_SJ_STARTING_POINT_ENABLED', false),
    selectedModel: String(process.env.OPENAI_MODEL || '').trim() || null,
    publicAvailable: Boolean(aiStatus && aiStatus.available),
    publicFeatureFlagState: aiStatus && aiStatus.featureFlagState || null,
    liveSmokeState: aiStatus && aiStatus.liveSmokeState || null,
    keyValueExposed: false
  };
  console.log(`[PRE89 LIVE SELFTEST] PASS routes=${results.length} homeBytes=${home ? home.bytes : 0} profiles=12278 release=v2.0.0-pre89`);
  console.log(`[PRE89 AI STATUS] ${JSON.stringify(aiRuntime)}`);
  console.log(`[PRE89 LIVE SELFTEST] ${JSON.stringify(results)}`);
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
const child = spawn(process.execPath, [server], { cwd: target, env, stdio: 'inherit' });
child.on('error', (error) => fail(`server process failed to start: ${error.message}`, child));
child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[PRE89 START] server exited via signal ${signal}`);
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code == null ? 1 : code);
});
(async () => {
  try {
    await waitForServer();
    await runSelfTest();
  } catch (error) {
    fail(`live self-test failed: ${error.message}`, child);
  }
})();
