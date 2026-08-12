from pathlib import Path
import json, os, selectors, subprocess, tempfile, time

repo = Path(__file__).resolve().parents[2]
runtime = repo / '.runtime' / 'smarter-justice-v1.7.98'
pkg = json.loads((repo / 'package.json').read_text())
start = pkg['scripts']['start']
pre55_start = 'node scripts/check-pre52-data-continuity.js && node scripts/check-pre55-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start'
pre56_start = 'node scripts/check-pre52-data-continuity.js && node scripts/check-pre56-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start'
pre57_start = 'node scripts/check-pre52-data-continuity.js && node scripts/check-pre57-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start'
pre58_start = 'node scripts/check-pre52-data-continuity.js && node scripts/check-pre58-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start'
assert start in [pre55_start, pre56_start, pre57_start, pre58_start]
for forbidden in ['run_pre42_acceptance.py', 'test_pre45_public_alignment.py', 'test_pre49_marketing_currentness.py', 'test_pre54_provider_deploy_control.py', 'test_pre55_credential_rotation_drill.py']:
    assert forbidden not in start, forbidden

server = (runtime / 'server.js').read_text(errors='replace')
for marker in ["release:'v2.0.0-pre55'", "demoPathRelease:'v2.0.0-pre52'", "deploymentControlRelease:'v2.0.0-pre55'", 'SMARTER_JUSTICE_PRE55_PROTECTED_CREDENTIAL_ROTATION_DRILL', 'process.env.PORT', 'server.listen(port']:
    assert marker in server, marker

assert not (repo / '.github' / 'workflows' / 'deploy-current-pre54.yml').exists()
assert (repo / '.github' / 'workflow-history' / 'deploy-current-pre54.yml').is_file()
current_pre55 = repo / '.github' / 'workflows' / 'deploy-current-pre55.yml'
archived_pre55 = repo / '.github' / 'workflow-history' / 'deploy-current-pre55.yml'
deploy = current_pre55.read_text(errors='replace')
if 'workflow_dispatch:' not in deploy:
    assert archived_pre55.is_file()
    deploy = archived_pre55.read_text(errors='replace')
for required in [
    'workflow_dispatch:', 'DEPLOY_SMARTER_JUSTICE_PRE55',
    'OWNER_DEPLOYMENT_AUTHORIZATION__PRE55.json',
    'render-trigger-deploy-pre55.js',
    'render-deploy-control-pre54.js service-preflight',
    'render-deploy-control-pre54.js observe',
    'render-deploy-control-pre54.js rollback',
    'srv-d8ps9jgjs32c73918vvg', 'dep-d9tov2jncjis739p3s8g',
    'a98c9adf8b34ed5acce188769d53be6f56d6587b',
    "id.release!=='v2.0.0-pre55'", "id.demoPathRelease!=='v2.0.0-pre52'",
    "id.deploymentControlRelease!=='v2.0.0-pre55'", 'SMARTER_JUSTICE_PRE55_PROTECTED_CREDENTIAL_ROTATION_DRILL',
    'smarter-justice-pre55-live-evidence-'
]:
    assert required in deploy, required
assert '\n  push:' not in deploy
assert 'RENDER_DEPLOY_HOOK_URL' not in deploy
assert (repo / 'deployment' / 'pre55' / 'SECRET_INCIDENT_REMEDIATION__PRE55.json').is_file()

rotation = (repo / '.github' / 'workflows' / 'render-credential-rotation-drill-pre55.yml').read_text(errors='replace')
for required in ['workflow_dispatch:', 'ROTATE_RENDER_CREDENTIAL_PRE55', 'candidate-access', 'retired-denied', 'active-access', 'RENDER_API_KEY_CANDIDATE', 'RENDER_API_KEY_RETIRED', 'RENDER_ROTATION_EVIDENCE_PATH']:
    assert required in rotation, required
assert '\n  push:' not in rotation and '\n  pull_request:' not in rotation

auth = json.loads((repo / 'deployment' / 'pre55' / 'OWNER_DEPLOYMENT_AUTHORIZATION__PRE55.json').read_text())
assert auth['release'] == 'v2.0.0-pre55' and auth['authorized'] is True
last = json.loads((repo / 'deployment' / 'pre55' / 'LAST_KNOWN_GOOD_PRODUCTION__PRE55.json').read_text())
assert last['lastKnownGood']['release'] == 'v2.0.0-pre54'
assert last['lastKnownGood']['gitCommit'] == 'a98c9adf8b34ed5acce188769d53be6f56d6587b'
assert last['lastKnownGood']['renderDeployId'] == 'dep-d9tov2jncjis739p3s8g'

env = os.environ.copy()
for key in list(env):
    if key.startswith(('DATABASE_', 'REDIS_', 'OBJECT_STORAGE_', 'AWS_', 'S3_')) or key in ['RENDER', 'RENDER_SERVICE_ID', 'RENDER_EXTERNAL_HOSTNAME', 'RENDER_DISK_MOUNT_PATH', 'APP_BASE_URL', 'OWNER_CONTROL_CENTER_TOKEN', 'ADMIN_TOKEN', 'PORTAL_RULES_API_TOKEN', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']:
        env.pop(key, None)
env['NODE_ENV'] = 'test'
env['PORT'] = '0'
with tempfile.TemporaryDirectory(prefix='sj-pre55-start-') as storage:
    env['SMARTER_JUSTICE_STORAGE_DIR'] = storage
    started = time.monotonic()
    if start in [pre56_start, pre57_start, pre58_start]:
        precheck = subprocess.run(['node', 'scripts/check-pre55-production-startup.js'], cwd=repo, env=env, text=True, capture_output=True)
        assert precheck.returncode == 0, precheck.stdout + precheck.stderr
        command = ['npm', '--prefix', '.runtime/smarter-justice-v1.7.98', 'start']
    else:
        command = ['npm', 'start']
    proc = subprocess.Popen(command, cwd=repo, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    sel = selectors.DefaultSelector()
    sel.register(proc.stdout, selectors.EVENT_READ)
    output = []
    listening = False
    try:
        deadline = started + 15
        while time.monotonic() < deadline:
            if proc.poll() is not None:
                break
            for key, _ in sel.select(timeout=.25):
                line = key.fileobj.readline()
                if line:
                    output.append(line)
                    if 'Smarter Justice v1.7.98 listening on ' in line:
                        listening = True
                        break
            if listening:
                break
        elapsed = time.monotonic() - started
        assert listening, ''.join(output[-80:])
        assert elapsed < 15, elapsed
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)
print(f'PASS PRE55 protected credential drill, exact accepted-live pre54 rollback identity, manual-only workflows and fast startup; local startup {elapsed:.2f}s')
