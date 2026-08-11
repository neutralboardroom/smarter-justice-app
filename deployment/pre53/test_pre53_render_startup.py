from pathlib import Path
import json, os, selectors, subprocess, tempfile, time

repo=Path(__file__).resolve().parents[2]
runtime=repo/'.runtime'/'smarter-justice-v1.7.98'
pkg=json.loads((repo/'package.json').read_text())
start=pkg['scripts']['start']
assert start == 'node scripts/check-pre52-data-continuity.js && node scripts/check-pre53-production-startup.js && npm --prefix .runtime/smarter-justice-v1.7.98 start'
for forbidden in ['run_pre42_acceptance.py','test_pre45_public_alignment.py','test_pre46_growth_operations_compliance_story.py','test_pre47_professional_growth.py','test_pre48_marketing_compliance_expansion.py','test_pre49_marketing_currentness.py','test_pre50_attorney_demo_path.py','test_pre51_public_domain_release_identity.py','test_pre52_attorney_value_clarity.py','test_pre52_mobile_navigation.py']:
    assert forbidden not in start, forbidden
server=(runtime/'server.js').read_text(errors='replace')
for marker in ["release:'v2.0.0-pre53'","demoPathRelease:'v2.0.0-pre52'","deploymentControlRelease:'v2.0.0-pre53'",'SMARTER_JUSTICE_PRE53_RENDER_STARTUP_AND_LIVE_GATE','process.env.PORT','server.listen(port']:
    assert marker in server, marker
assert (repo/'scripts'/'check-pre53-production-startup.js').is_file()

workflow=(repo/'.github'/'workflows'/'deploy-current-pre53.yml').read_text(errors='replace')
assert not (repo/'.github'/'workflows'/'deploy-pre22-projection.yml').exists()
for required in [
    'Bind pre53 authority, owner authorization, rollback and continuity gate',
    'Wait for exact pre53 release cutover',
    'for attempt in $(seq 1 96)',
    "id.release!=='v2.0.0-pre53'",
    "id.demoPathRelease!=='v2.0.0-pre52'",
    "id.deploymentControlRelease!=='v2.0.0-pre53'",
    'SMARTER_JUSTICE_PRE53_RENDER_STARTUP_AND_LIVE_GATE',
    'SMARTER_JUSTICE_PRE49_SOURCE_CURRENTNESS_GATE',
    'smarter-justice-pre53-live-evidence-${{ github.run_id }}-${{ github.run_attempt }}',
    'Render deploy id'
]:
    assert required in workflow, required
assert 'SMARTER_JUSTICE_PRE49_RULE_SOURCE_CURRENTNESS' not in workflow

contract=json.loads((repo/'deployment'/'pre53'/'RENDER_STARTUP_AND_LIVE_CUTOVER__PRE53.json').read_text())
assert contract['release']=='v2.0.0-pre53'
assert contract['builder']=='J41'
assert contract['deploymentPolicy'].startswith('Do not merge/deploy pre53 until')

env=os.environ.copy()
for key in list(env):
    if key.startswith(('DATABASE_','REDIS_','OBJECT_STORAGE_','AWS_','S3_')) or key in ['RENDER','RENDER_SERVICE_ID','RENDER_EXTERNAL_HOSTNAME','RENDER_DISK_MOUNT_PATH','APP_BASE_URL','OWNER_CONTROL_CENTER_TOKEN','ADMIN_TOKEN','PORTAL_RULES_API_TOKEN','OPENAI_API_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET']:
        env.pop(key,None)
env['NODE_ENV']='test'
env['PORT']='0'
with tempfile.TemporaryDirectory(prefix='sj-pre53-start-') as storage:
    env['SMARTER_JUSTICE_STORAGE_DIR']=storage
    started=time.monotonic()
    proc=subprocess.Popen(['npm','start'],cwd=repo,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
    sel=selectors.DefaultSelector(); sel.register(proc.stdout,selectors.EVENT_READ)
    output=[]; listening=False
    try:
        deadline=started+15
        while time.monotonic()<deadline:
            if proc.poll() is not None:
                break
            for key,_ in sel.select(timeout=.25):
                line=key.fileobj.readline()
                if line:
                    output.append(line)
                    if 'Smarter Justice v1.7.98 listening on ' in line:
                        listening=True
                        break
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
print(f'PASS PRE53 fast startup, Render-aligned exact cutover gate, and corrected rollback marker; local startup {elapsed:.2f}s')
