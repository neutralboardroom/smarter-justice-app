from pathlib import Path
import json, os, selectors, subprocess, tempfile, time, urllib.error, urllib.request

repo = Path(__file__).resolve().parents[2]
runtime = Path(os.environ.get('RUNTIME', repo / '.runtime' / 'smarter-justice-v1.7.98'))
receipt = json.loads((repo / 'deployment' / 'pre58' / 'NY_OFFICIAL_CREDENTIAL_RECONCILIATION__PRE58.json').read_text())
assert receipt['release'] == 'v2.0.0-pre58'
assert receipt['marker'] == 'SMARTER_JUSTICE_PRE58_NY_OFFICIAL_CREDENTIAL_RECONCILIATION'
assert receipt['state'] == 'NY_OFFICIAL_RECONCILIATION_COMPLETE_NJ_OPERATOR_REVIEW_PENDING_GATES_CLOSED'
assert receipt['summary'] == {
    'protectedProfessionalRecords': 25,
    'newYorkRecordsAttempted': 18,
    'newYorkOfficialMatchesCompleted': 18,
    'newYorkUnresolved': 0,
    'newJerseyRecordsPendingOperatorReview': 7,
    'rejectedNameOnlyCandidates': 252,
    'newAcceptedProfessionalProfiles': 0,
    'newAcceptedFirmProfiles': 0,
    'ordinaryPublicExposureChanged': False,
}
matches = receipt['newYorkMatches']
assert len(matches) == 18 and len({row['id'] for row in matches}) == 18
assert all(row['officialFirm'] for row in matches)
assert all(row['registrationNumber'].isdigit() for row in matches)
assert all(row['officialStatus'] != 'Deceased' for row in matches)
assert all('FIRM_ALIGNED' in row['matchClass'] for row in matches)
assert all(row['result'] == 'NY_OFFICIAL_MATCH_COMPLETE_PROFILE_ACCEPTANCE_NOT_RUN' for row in matches)
assert len(receipt['pendingNewJerseyProfessionalIds']) == 7
assert not set(receipt['pendingNewJerseyProfessionalIds']) & {row['id'] for row in matches}
assert receipt['matchingPolicy']['nameOnlyMatchAllowed'] is False
assert all(value is False for value in receipt['consequentialActionGates'].values() if isinstance(value, bool))
assert receipt['noLoss'] is True and receipt['noGrowthReason']

server = (runtime / 'server.js').read_text(errors='replace')
for marker in ["release:'v2.0.0-pre58'", "deploymentControlRelease:'v2.0.0-pre58'", 'SMARTER_JUSTICE_PRE58_NY_OFFICIAL_CREDENTIAL_RECONCILIATION', '/api/owner/credential-reconciliation-pre58']:
    assert marker in server, marker
owner_line = next(line for line in server.splitlines() if '/api/owner/credential-reconciliation-pre58' in line)
assert "if(!requireOwner(req))return json(res,403" in owner_line
module = runtime / 'lib' / 'credentialReconciliationPre58.js'
assert module.is_file()
checked = subprocess.run(['node', '--check', str(module)], cwd=repo, text=True, capture_output=True)
assert checked.returncode == 0, checked.stdout + checked.stderr

overlay = (repo / 'scripts' / 'apply-pre58-ny-credential-reconciliation.js').read_text()
assert "path.join(root,'public'" not in overlay and 'publicDir' not in overlay
sitemap = (runtime / 'public' / 'sitemap.xml').read_text(errors='replace')
for held in ['/growth-operations-compliance.html', '/portals.html']:
    assert f'<loc>https://smarterjustice.com{held}</loc>' not in sitemap
assert "new Set(['/growth-operations-compliance.html','/portals.html']).has(p)" in server
review = json.loads((repo / 'deployment' / 'pre58' / 'UNIQUE_UX_UI_REVIEW__PRE58.json').read_text())
assert review['reviewState'] == 'PASS_NO_ORDINARY_PUBLIC_UI_CHANGE'
assert review['ordinaryPublicFilesWrittenByPre58Overlay'] == 0
assert review['noLoss'] is True

env = os.environ.copy()
for key in list(env):
    if key.startswith(('DATABASE_', 'REDIS_', 'OBJECT_STORAGE_', 'AWS_', 'S3_')) or key in ['RENDER', 'DATABASE_URL', 'OWNER_CONTROL_CENTER_TOKEN', 'ADMIN_TOKEN', 'PORTAL_RULES_API_TOKEN', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']:
        env.pop(key, None)
env['NODE_ENV'] = 'test'
env['PORT'] = '0'
with tempfile.TemporaryDirectory(prefix='sj-pre58-http-') as storage:
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
        assert identity['release'] == 'v2.0.0-pre58'
        for route, expected in [('/api/owner/credential-reconciliation-pre58', 403), ('/growth-operations-compliance.html', 404), ('/portals.html', 404)]:
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
print('PASS PRE58 18 collision-reviewed NY official matches, 7 NJ records pending operator review, owner-only receipt, gates closed and no public UX/UI drift')
