from pathlib import Path
import json, os, selectors, subprocess, tempfile, time

repo = Path(__file__).resolve().parents[2]
runtime = repo / '.runtime' / 'smarter-justice-v1.7.98'
pkg = json.loads((repo / 'package.json').read_text())
start = pkg['scripts']['start']
pre56_start = 'node scripts/check-pre52-data-continuity.js && node scripts/check-pre56-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start'
pre57_start = 'node scripts/check-pre52-data-continuity.js && node scripts/check-pre57-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start'
assert start in [pre56_start, pre57_start]
for forbidden in ['run_pre42_acceptance.py', 'test_pre45_public_alignment.py', 'test_pre49_marketing_currentness.py', 'test_pre54_provider_deploy_control.py', 'test_pre55_credential_rotation_drill.py', 'test_pre56_private_measurement.py']:
    assert forbidden not in start, forbidden

auth = json.loads((repo / 'deployment' / 'pre56' / 'OWNER_DEPLOYMENT_AUTHORIZATION__PRE56.json').read_text())
assert auth['release'] == 'v2.0.0-pre56' and auth['authorized'] is False
live = json.loads((repo / 'deployment' / 'pre56' / 'LIVE_STATE_AND_DEPLOYMENT_BOUNDARY__PRE56.json').read_text())
assert live['buildState'] == 'QUALIFIED_SOURCE_NOT_LIVE'
assert live['acceptedLiveRollback']['release'] == 'v2.0.0-pre54'
assert live['acceptedLiveRollback']['gitCommit'] == 'a98c9adf8b34ed5acce188769d53be6f56d6587b'
assert live['acceptedLiveRollback']['renderDeployId'] == 'dep-d9tov2jncjis739p3s8g'
assert live['pre55PublishedSource']['completeAcceptedLiveProofPresent'] is False

assert (repo / '.github' / 'workflow-history' / 'deploy-current-pre55.yml').is_file()
disabled_pre55 = (repo / '.github' / 'workflows' / 'deploy-current-pre55.yml').read_text(errors='replace')
assert 'on: []' in disabled_pre55 and 'workflow_dispatch:' not in disabled_pre55
workflow = (repo / '.github' / 'workflows' / 'deploy-current-pre56.yml').read_text(errors='replace')
for required in ['workflow_dispatch:', 'DEPLOY_SMARTER_JUSTICE_PRE56', 'OWNER_DEPLOYMENT_AUTHORIZATION__PRE56.json', 'render-trigger-deploy-pre56.js', 'render-deploy-control-pre54.js service-preflight', 'render-deploy-control-pre54.js observe', 'render-deploy-control-pre54.js rollback', 'srv-d8ps9jgjs32c73918vvg', 'dep-d9tov2jncjis739p3s8g', 'SMARTER_JUSTICE_PRE56_PRIVACY_MINIMIZED_MEASUREMENT']:
    assert required in workflow, required
assert '\n  push:' not in workflow and 'RENDER_DEPLOY_HOOK_URL' not in workflow
trigger = (repo / 'scripts' / 'render-trigger-deploy-pre56.js').read_text(errors='replace')
assert "release:'v2.0.0-pre56'" in trigger and 'credentialMaterialPresent:false' in trigger and 'deployHookUsed:false' in trigger

server = (runtime / 'server.js').read_text(errors='replace')
release_markers = ["release:'v2.0.0-pre56'", "deploymentControlRelease:'v2.0.0-pre56'"] if start == pre56_start else ["release:'v2.0.0-pre57'", "deploymentControlRelease:'v2.0.0-pre57'"]
for marker in release_markers + ["demoPathRelease:'v2.0.0-pre52'", 'SMARTER_JUSTICE_PRE56_PRIVACY_MINIMIZED_MEASUREMENT', 'process.env.PORT', 'server.listen(port']:
    assert marker in server, marker

env = os.environ.copy()
for key in list(env):
    if key.startswith(('DATABASE_', 'REDIS_', 'OBJECT_STORAGE_', 'AWS_', 'S3_')) or key in ['RENDER', 'DATABASE_URL', 'RENDER_SERVICE_ID', 'RENDER_EXTERNAL_HOSTNAME', 'RENDER_DISK_MOUNT_PATH', 'APP_BASE_URL', 'OWNER_CONTROL_CENTER_TOKEN', 'ADMIN_TOKEN', 'PORTAL_RULES_API_TOKEN', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']:
        env.pop(key, None)
env['NODE_ENV'] = 'test'; env['PORT'] = '0'
with tempfile.TemporaryDirectory(prefix='sj-pre56-start-') as storage:
    env['SMARTER_JUSTICE_STORAGE_DIR'] = storage
    started = time.monotonic()
    command = ['npm', 'start'] if start == pre56_start else ['npm', '--prefix', '.runtime/smarter-justice-v1.7.98', 'start']
    proc = subprocess.Popen(command, cwd=repo, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    sel = selectors.DefaultSelector(); sel.register(proc.stdout, selectors.EVENT_READ)
    output, listening = [], False
    try:
        deadline = started + 15
        while time.monotonic() < deadline:
            if proc.poll() is not None: break
            for key, _ in sel.select(timeout=.25):
                line = key.fileobj.readline()
                if line:
                    output.append(line)
                    if 'Smarter Justice v1.7.98 listening on ' in line:
                        listening = True; break
            if listening: break
        elapsed = time.monotonic() - started
        assert listening, ''.join(output[-80:])
        assert elapsed < 15, elapsed
    finally:
        if proc.poll() is None:
            proc.terminate()
            try: proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill(); proc.wait(timeout=5)

blocked = env.copy(); blocked.update({'NODE_ENV': 'production', 'RENDER': 'true', 'PORT': '3000', 'SJ_PRIVACY_MINIMIZED_MEASUREMENT_ENABLED': 'true'})
blocked.pop('DATABASE_URL', None)
preflight = subprocess.run(['node', 'scripts/check-pre56-production-startup.js'], cwd=repo, env=blocked, text=True, capture_output=True)
assert preflight.returncode != 0 and 'MEASUREMENT_REQUIRES_DURABLE_DATABASE' in preflight.stdout
print(f'PASS PRE56 qualified-source/not-live boundary, exact pre54 rollback identity, deployment authorization false, fast startup and production measurement durability gate; local startup {elapsed:.2f}s')
