from pathlib import Path
import json, os, selectors, subprocess, tempfile, time, urllib.error, urllib.request

repo = Path(__file__).resolve().parents[2]
runtime = repo / '.runtime' / 'smarter-justice-v1.7.98'

server_source = (runtime / 'server.js').read_text(errors='replace')
module_source = (runtime / 'lib' / 'privateAcquisitionMeasurementPre56.js').read_text(errors='replace')
client_source = (runtime / 'public' / 'private-measurement-pre56.js').read_text(errors='replace')
privacy_page = (runtime / 'public' / 'measurement-privacy.html').read_text(errors='replace')
assert (
    "release:'v2.0.0-pre56'" in server_source and "deploymentControlRelease:'v2.0.0-pre56'" in server_source
) or (
    "release:'v2.0.0-pre57'" in server_source and "deploymentControlRelease:'v2.0.0-pre57'" in server_source
) or (
    "release:'v2.0.0-pre58'" in server_source and "deploymentControlRelease:'v2.0.0-pre58'" in server_source
)
for marker in [
    'SMARTER_JUSTICE_PRE56_PRIVACY_MINIMIZED_MEASUREMENT',
    '/api/public/private-measurement/status',
    '/api/public/private-measurement',
    '/api/owner/private-acquisition-measurement'
]:
    assert marker in server_source, marker
for marker in [
    'RETENTION_DAYS=30',
    'MINIMUM_RATIO_DENOMINATOR=20',
    'thirdPartyTrackers:false',
    'storesLegalNarratives:false',
    'storesIpAddressInMeasurementRows:false',
    'storesSessionIdentifier:false'
]:
    assert marker in module_source, marker
for marker in [
    "localStorage.getItem(CONSENT_KEY)==='granted'",
    'measurementConsent:true',
    '/measurement-privacy.html',
    'sessionStorage'
]:
    assert marker in client_source, marker
for marker in ['The default is off.', '30-day window', 'Do not allow', 'third-party analytics tracker']:
    assert marker in privacy_page, marker

node_program = r"""
const path=require('path');
const root=process.argv[1];
const store=require(path.join(root,'lib','store'));
const measurement=require(path.join(root,'lib','privateAcquisitionMeasurementPre56'));
(async()=>{
  await store.init();
  const denied=await measurement.record({measurementConsent:false,consentVersion:'1.0.0',eventType:'landing-view',pagePath:'/',channel:'direct'});
  const stale=await measurement.record({measurementConsent:true,consentVersion:'0.9.0',eventType:'landing-view',pagePath:'/',channel:'direct'});
  const unknown=await measurement.record({measurementConsent:true,consentVersion:'1.0.0',eventType:'legal-story-submitted',pagePath:'/secret',channel:'fingerprint'});
  const accepted=[];
  for(let i=0;i<20;i++)accepted.push(await measurement.record({measurementConsent:true,consentVersion:'1.0.0',eventType:'landing-view',pagePath:'/',channel:'direct',legalNarrative:'must not persist',email:'must-not-persist@example.com',queryString:'?private=true'}));
  accepted.push(await measurement.record({measurementConsent:true,consentVersion:'1.0.0',eventType:'navigator-opened',pagePath:'/',channel:'direct'}));
  const owner=measurement.ownerView();
  const stored=store.readJson(measurement.STORE_KEY,{});
  console.log(JSON.stringify({denied,stale,unknown,accepted,owner,stored}));
})().catch(error=>{console.error(error);process.exit(1)});
"""

with tempfile.TemporaryDirectory(prefix='sj-pre56-measurement-') as storage:
    env = os.environ.copy()
    env.update({
        'NODE_ENV': 'test',
        'SMARTER_JUSTICE_STORAGE_DIR': storage,
        'SJ_PRIVACY_MINIMIZED_MEASUREMENT_ENABLED': 'true'
    })
    result = subprocess.run(['node', '-e', node_program, str(runtime)], cwd=repo, env=env, text=True, capture_output=True)
    assert result.returncode == 0, result.stdout + result.stderr
    payload = json.loads(result.stdout.strip().splitlines()[-1])
    assert payload['denied']['ignored'] is True
    assert payload['stale']['ignored'] is True
    assert payload['unknown']['ignored'] is True
    assert all(row.get('recorded') is True for row in payload['accepted'])
    assert len(payload['stored']['rows']) == 2
    assert set(payload['stored']['rows'][0]) == {'day', 'eventType', 'pagePath', 'channel', 'count'}
    assert 'must not persist' not in json.dumps(payload['stored'])
    assert 'must-not-persist@example.com' not in json.dumps(payload['stored'])
    home_ratio = next(row for row in payload['owner']['ratios'] if row['denominatorEvent'] == 'landing-view')
    assert home_ratio['denominator'] == 20 and home_ratio['numerator'] == 1
    assert home_ratio['claimable'] is True and home_ratio['value'] == 0.05
    membership_ratio = next(row for row in payload['owner']['ratios'] if row['denominatorEvent'] == 'membership-view')
    assert membership_ratio['claimable'] is False and membership_ratio['value'] is None

def request_json(url, method='GET', body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())

with tempfile.TemporaryDirectory(prefix='sj-pre56-http-') as storage:
    env = os.environ.copy()
    for key in list(env):
        if key.startswith(('DATABASE_', 'REDIS_', 'OBJECT_STORAGE_', 'AWS_', 'S3_')) or key in ['RENDER', 'DATABASE_URL', 'OWNER_CONTROL_CENTER_TOKEN', 'ADMIN_TOKEN', 'PORTAL_RULES_API_TOKEN']:
            env.pop(key, None)
    env.update({'NODE_ENV': 'test', 'PORT': '0', 'SMARTER_JUSTICE_STORAGE_DIR': storage, 'SJ_PRIVACY_MINIMIZED_MEASUREMENT_ENABLED': 'true'})
    proc = subprocess.Popen(['npm', 'start'], cwd=repo, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    sel = selectors.DefaultSelector(); sel.register(proc.stdout, selectors.EVENT_READ)
    output, port = [], None
    try:
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline and port is None:
            if proc.poll() is not None:
                break
            for key, _ in sel.select(timeout=.25):
                line = key.fileobj.readline()
                if line:
                    output.append(line)
                    if 'Smarter Justice v1.7.98 listening on ' in line:
                        port = int(line.rsplit(' ', 1)[-1])
                        break
        assert port, ''.join(output[-100:])
        base = f'http://127.0.0.1:{port}'
        status_code, status = request_json(base + '/api/public/private-measurement/status')
        assert status_code == 200 and status['enabled'] is True and status['consentRequired'] is True
        denied_code, denied = request_json(base + '/api/public/private-measurement', 'POST', {'measurementConsent': False, 'consentVersion': '1.0.0', 'eventType': 'landing-view', 'pagePath': '/', 'channel': 'direct'})
        assert denied_code == 200 and denied['ignored'] is True
        accepted_code, accepted = request_json(base + '/api/public/private-measurement', 'POST', {'measurementConsent': True, 'consentVersion': '1.0.0', 'eventType': 'landing-view', 'pagePath': '/', 'channel': 'direct', 'legalNarrative': 'discard'})
        assert accepted_code == 200 and accepted['recorded'] is True
        owner_code, owner = request_json(base + '/api/owner/private-acquisition-measurement')
        assert owner_code == 403 and owner['ok'] is False
        identity_code, identity = request_json(base + '/api/release-identity')
        assert identity_code == 200 and identity['release'] in ['v2.0.0-pre56', 'v2.0.0-pre57', 'v2.0.0-pre58'] and identity['demoPathRelease'] == 'v2.0.0-pre52'
        with urllib.request.urlopen(base + '/measurement-privacy.html', timeout=10) as response:
            page = response.read().decode()
        assert 'SMARTER_JUSTICE_PRE56_PRIVACY_MINIMIZED_MEASUREMENT' in page
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill(); proc.wait(timeout=5)

for followup in ['test_pre56_release.py', 'test_pre56_ux_profile_continuity.py']:
    checked = subprocess.run(['python3', str(Path(__file__).with_name(followup))], cwd=repo, text=True, capture_output=True)
    assert checked.returncode == 0, checked.stdout + checked.stderr
    print(checked.stdout.strip())

print('PASS PRE56 explicit consent, default-off activation, allowlisted aggregate dimensions, 30-day contract, truthful ratio threshold, owner protection and no sensitive measurement rows')
