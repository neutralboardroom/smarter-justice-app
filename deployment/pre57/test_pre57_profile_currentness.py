from pathlib import Path
import json, os, selectors, subprocess, tempfile, time, urllib.error, urllib.request

repo = Path(__file__).resolve().parents[2]
runtime = Path(os.environ.get('RUNTIME', repo / '.runtime' / 'smarter-justice-v1.7.98'))
receipt = json.loads((repo / 'deployment' / 'pre57' / 'PROFILE_CURRENTNESS_EXECUTION__PRE57.json').read_text())
assert receipt['release'] == 'v2.0.0-pre57'
assert receipt['marker'] == 'SMARTER_JUSTICE_PRE57_PROTECTED_PROFILE_CURRENTNESS_EXECUTION'
assert receipt['state'] == 'SOURCE_CURRENTNESS_EXECUTED_CREDENTIAL_AUTHORITY_REVIEW_PENDING'
assert receipt['summary'] == {
    'protectedRecordsAttempted': 30,
    'professionalSourceObservations': 25,
    'professionalSourcePresenceConfirmed': 25,
    'firmSourceObservations': 5,
    'firmSourcePresenceConfirmed': 5,
    'officialCredentialMatchesCompleted': 0,
    'newAcceptedProfessionalProfiles': 0,
    'newAcceptedFirmProfiles': 0,
    'ordinaryPublicExposureChanged': False,
}
professionals = receipt['professionalObservations']
firms = receipt['firmObservations']
assert len(professionals) == 25 and len(firms) == 5
assert len({row['id'] for row in professionals}) == 25
assert len({row['id'] for row in firms}) == 5
assert all(row['sourceUrl'].startswith('https://') for row in professionals + firms)
assert all(row['sourceResult'].endswith('PRESENT') for row in professionals + firms)
assert all(row['credentialResult'] == 'NOT_INDEPENDENTLY_VERIFIED' for row in professionals)
assert all(value is False for value in receipt['consequentialActionGates'].values() if isinstance(value, bool))
assert receipt['qualifiedPublicDirectoryBaseline'] == {'professionals': 25, 'firms': 5}
assert receipt['centralGraphContinuity'] == {'canonicalIdentities': 9484, 'professionalExtensions': 1299, 'firmRelationships': 7033}
assert receipt['noLoss'] is True and receipt['noGrowthReason']

server = (runtime / 'server.js').read_text(errors='replace')
for marker in ["release:'v2.0.0-pre57'", "deploymentControlRelease:'v2.0.0-pre57'", 'SMARTER_JUSTICE_PRE57_PROTECTED_PROFILE_CURRENTNESS_EXECUTION', '/api/owner/profile-currentness-pre57']:
    assert marker in server, marker
route = "if(!requireOwner(req))return json(res,403"
owner_line = next(line for line in server.splitlines() if '/api/owner/profile-currentness-pre57' in line)
assert route in owner_line
module = runtime / 'lib' / 'profileCurrentnessPre57.js'
assert module.is_file()
checked = subprocess.run(['node', '--check', str(module)], cwd=repo, text=True, capture_output=True)
assert checked.returncode == 0, checked.stdout + checked.stderr

overlay = (repo / 'scripts' / 'apply-pre57-profile-currentness-execution.js').read_text()
assert "path.join(root,'public'" not in overlay and 'publicDir' not in overlay
sitemap = (runtime / 'public' / 'sitemap.xml').read_text(errors='replace')
for held in ['/growth-operations-compliance.html', '/portals.html']:
    assert f'<loc>https://smarterjustice.com{held}</loc>' not in sitemap
assert "new Set(['/growth-operations-compliance.html','/portals.html']).has(p)" in server
assert 'SMARTER_JUSTICE_PRE52_PUBLICATION_GATE' in server
review = json.loads((repo / 'deployment' / 'pre57' / 'UNIQUE_UX_UI_REVIEW__PRE57.json').read_text())
assert review['reviewState'] == 'PASS_NO_ORDINARY_PUBLIC_UI_CHANGE'
assert review['ordinaryPublicFilesWrittenByPre57Overlay'] == 0
assert review['noLoss'] is True

env = os.environ.copy()
for key in list(env):
    if key.startswith(('DATABASE_', 'REDIS_', 'OBJECT_STORAGE_', 'AWS_', 'S3_')) or key in ['RENDER', 'DATABASE_URL', 'OWNER_CONTROL_CENTER_TOKEN', 'ADMIN_TOKEN', 'PORTAL_RULES_API_TOKEN', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']:
        env.pop(key, None)
env['NODE_ENV'] = 'test'
env['PORT'] = '0'
with tempfile.TemporaryDirectory(prefix='sj-pre57-http-') as storage:
    env['SMARTER_JUSTICE_STORAGE_DIR'] = storage
    proc = subprocess.Popen(['npm', 'start'], cwd=repo, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    sel = selectors.DefaultSelector(); sel.register(proc.stdout, selectors.EVENT_READ)
    output, port = [], None
    try:
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline and port is None:
            if proc.poll() is not None: break
            for key, _ in sel.select(timeout=.25):
                line = key.fileobj.readline()
                if line:
                    output.append(line)
                    if 'Smarter Justice v1.7.98 listening on ' in line:
                        port = int(line.rsplit(' ', 1)[-1]); break
        assert port, ''.join(output[-100:])
        base = f'http://127.0.0.1:{port}'
        with urllib.request.urlopen(base + '/api/release-identity', timeout=10) as response:
            identity = json.loads(response.read())
        assert identity['release'] == 'v2.0.0-pre57'
        for route, expected in [('/api/owner/profile-currentness-pre57', 403), ('/growth-operations-compliance.html', 404), ('/portals.html', 404)]:
            try:
                urllib.request.urlopen(base + route, timeout=10)
                raise AssertionError(f'{route} unexpectedly returned success')
            except urllib.error.HTTPError as error:
                assert error.code == expected, (route, error.code)
    finally:
        if proc.poll() is None:
            proc.terminate()
            try: proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill(); proc.wait(timeout=5)
print('PASS PRE57 25-professional/5-firm source-currentness execution, zero credential overclaim, all consequential gates closed, owner-only receipt and no public UX/UI drift')
