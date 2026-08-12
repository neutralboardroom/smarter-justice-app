from pathlib import Path
import json, os, selectors, subprocess, tempfile, time

repo=Path(__file__).resolve().parents[2]
runtime=repo/'.runtime'/'smarter-justice-v1.7.98'
pkg=json.loads((repo/'package.json').read_text())
start=pkg['scripts']['start']
assert start in [
    'node scripts/check-pre52-data-continuity.js && node scripts/check-pre54-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start',
    'node scripts/check-pre52-data-continuity.js && node scripts/check-pre55-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start',
    'node scripts/check-pre52-data-continuity.js && node scripts/check-pre56-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start',
    'node scripts/check-pre52-data-continuity.js && node scripts/check-pre57-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start'
]
for forbidden in ['run_pre42_acceptance.py','test_pre45_public_alignment.py','test_pre49_marketing_currentness.py','test_pre52_attorney_value_clarity.py','test_pre53_render_startup.py','test_pre54_provider_deploy_control.py']:
    assert forbidden not in start, forbidden

server=(runtime/'server.js').read_text(errors='replace')
for marker in ["release:'v2.0.0-pre54'","demoPathRelease:'v2.0.0-pre52'","deploymentControlRelease:'v2.0.0-pre54'",'SMARTER_JUSTICE_PRE54_PROVIDER_NATIVE_DEPLOY_CONTROL','process.env.PORT','server.listen(port']:
    assert marker in server, marker

assert not (repo/'.github'/'workflows'/'deploy-current-pre53.yml').exists()
assert (repo/'.github'/'workflow-history'/'deploy-current-pre53.yml').is_file()
workflow=(repo/'.github'/'workflow-history'/'deploy-current-pre54.yml').read_text(errors='replace')
for required in [
    'workflow_dispatch:', 'DEPLOY_SMARTER_JUSTICE_PRE54',
    'OWNER_DEPLOYMENT_AUTHORIZATION__PRE54.json',
    'render-deploy-control-pre54.js service-preflight',
    'render-deploy-control-pre54.js observe',
    'render-deploy-control-pre54.js rollback',
    'srv-d8ps9jgjs32c73918vvg', 'dep-d9tnna2d0e5s739kogg0',
    '39337e204b974f85e4690a97ef85ad30932fee30',
    "id.release!=='v2.0.0-pre54'", "id.demoPathRelease!=='v2.0.0-pre52'",
    "id.deploymentControlRelease!=='v2.0.0-pre54'", 'SMARTER_JUSTICE_PRE54_PROVIDER_NATIVE_DEPLOY_CONTROL',
    'smarter-justice-pre54-live-evidence-${{ github.run_id }}-${{ github.run_attempt }}'
]:
    assert required in workflow, required
assert '\n  push:' not in workflow

auth=json.loads((repo/'deployment'/'pre54'/'OWNER_DEPLOYMENT_AUTHORIZATION__PRE54.json').read_text())
assert auth['release']=='v2.0.0-pre54' and auth['authorized'] is False
contract=json.loads((repo/'deployment'/'pre54'/'PROVIDER_NATIVE_DEPLOY_CONTROL__PRE54.json').read_text())
assert contract['builder']=='J43' and contract['acceptedLiveRollbackAuthority']['renderDeployId']=='dep-d9tnna2d0e5s739kogg0'

env=os.environ.copy()
for key in list(env):
    if key.startswith(('DATABASE_','REDIS_','OBJECT_STORAGE_','AWS_','S3_')) or key in ['RENDER','RENDER_SERVICE_ID','RENDER_EXTERNAL_HOSTNAME','RENDER_DISK_MOUNT_PATH','APP_BASE_URL','OWNER_CONTROL_CENTER_TOKEN','ADMIN_TOKEN','PORTAL_RULES_API_TOKEN','OPENAI_API_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET']:
        env.pop(key,None)
env['NODE_ENV']='test'; env['PORT']='0'
with tempfile.TemporaryDirectory(prefix='sj-pre54-start-') as storage:
    env['SMARTER_JUSTICE_STORAGE_DIR']=storage
    started=time.monotonic()
    proc=subprocess.Popen(['npm','--prefix',str(runtime),'start'],cwd=repo,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
    sel=selectors.DefaultSelector(); sel.register(proc.stdout,selectors.EVENT_READ)
    output=[]; listening=False
    try:
        deadline=started+15
        while time.monotonic()<deadline:
            if proc.poll() is not None: break
            for key,_ in sel.select(timeout=.25):
                line=key.fileobj.readline()
                if line:
                    output.append(line)
                    if 'Smarter Justice v1.7.98 listening on ' in line:
                        listening=True; break
            if listening: break
        elapsed=time.monotonic()-started
        assert listening, ''.join(output[-80:])
        assert elapsed < 15, elapsed
    finally:
        if proc.poll() is None:
            proc.terminate()
            try: proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill(); proc.wait(timeout=5)
print(f'PASS PRE54 provider-native deploy control, deployment hold, exact accepted-live rollback identity, and fast startup; local startup {elapsed:.2f}s')
