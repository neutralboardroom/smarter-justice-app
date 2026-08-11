from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from datetime import datetime, timedelta, timezone
import json, os, subprocess, tempfile, threading

repo = Path(__file__).resolve().parents[2]
script = repo / 'scripts' / 'render-credential-rotation-drill-pre55.js'

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def send_json(self, status, value):
        body = json.dumps(value).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        token = self.headers.get('Authorization', '').removeprefix('Bearer ')
        if self.path not in ['/v1/services/srv-test', '/v1/services/srv-auto']:
            return self.send_json(404, {'error': 'missing'})
        if token == 'retired-redaction-test-secret':
            return self.send_json(401, {'error': 'denied'})
        if token not in ['candidate-redaction-test-secret', 'active-redaction-test-secret', 'still-live-redaction-test-secret']:
            return self.send_json(403, {'error': 'denied'})
        auto = 'yes' if self.path.endswith('/srv-auto') else 'no'
        service_id = 'srv-auto' if self.path.endswith('/srv-auto') else 'srv-test'
        return self.send_json(200, {'id': service_id, 'autoDeploy': auto})

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()

def iso(minutes_ago=0):
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)).isoformat().replace('+00:00', 'Z')

def run(action, token, *, service='srv-test', started=None, expected=0, evidence=None):
    env = os.environ.copy()
    env.update({
        'NODE_ENV': 'test',
        'RENDER_API_KEY': token,
        'RENDER_SERVICE_ID': service,
        'RENDER_API_BASE_URL': f'http://127.0.0.1:{server.server_port}/v1',
        'RENDER_ROTATION_STARTED_AT': started or iso(),
        'RENDER_ROTATION_MAX_MINUTES': '60',
        'RENDER_ROTATION_CHANGE_REF': 'PRE55-ROTATION-TEST'
    })
    if evidence:
        env['RENDER_ROTATION_EVIDENCE_PATH'] = str(evidence)
    result = subprocess.run(['node', str(script), action], cwd=repo, env=env, text=True, capture_output=True)
    assert (result.returncode == 0) == (expected == 0), result.stdout + result.stderr
    combined = result.stdout + result.stderr
    for secret in ['candidate-redaction-test-secret', 'active-redaction-test-secret', 'retired-redaction-test-secret', 'still-live-redaction-test-secret']:
        assert secret not in combined
    return result

try:
    with tempfile.TemporaryDirectory(prefix='sj-pre55-rotation-') as temp:
        evidence = Path(temp) / 'rotation.jsonl'
        run('candidate-access', 'candidate-redaction-test-secret', evidence=evidence)
        run('retired-denied', 'retired-redaction-test-secret', evidence=evidence)
        run('active-access', 'active-redaction-test-secret', evidence=evidence)
        rows = [json.loads(line) for line in evidence.read_text().splitlines()]
        assert [row['phase'] for row in rows] == ['candidate-access', 'retired-denied', 'active-access']
        assert [row['providerAccess'] for row in rows] == ['AUTHORIZED', 'DENIED', 'AUTHORIZED']
        assert all(row['credentialMaterialPresent'] is False and row['passed'] is True for row in rows)
        evidence_text = evidence.read_text()
        assert 'Authorization' not in evidence_text and 'Bearer ' not in evidence_text
        for secret in ['candidate-redaction-test-secret', 'active-redaction-test-secret', 'retired-redaction-test-secret']:
            assert secret not in evidence_text
        run('retired-denied', 'still-live-redaction-test-secret', expected=1)
        run('candidate-access', 'candidate-redaction-test-secret', service='srv-auto', expected=1)
        run('active-access', 'active-redaction-test-secret', started=iso(61), expected=1)
        env = os.environ.copy()
        env.update({
            'NODE_ENV': 'production',
            'RENDER_API_KEY': 'x',
            'RENDER_SERVICE_ID': 'srv-test',
            'RENDER_API_BASE_URL': 'http://127.0.0.1:1/v1',
            'RENDER_ROTATION_STARTED_AT': iso(),
            'RENDER_ROTATION_CHANGE_REF': 'PRE55-ROTATION-TEST'
        })
        denied = subprocess.run(['node', str(script), 'candidate-access'], cwd=repo, env=env, text=True, capture_output=True)
        assert denied.returncode != 0 and 'test-only' in denied.stderr
finally:
    server.shutdown()
    server.server_close()

for followup in ['test_pre55_provider_api_deploy.py', 'test_pre55_growth_profile_continuity.py', 'test_pre55_release.py']:
    checked = subprocess.run(['python3', str(Path(__file__).with_name(followup))], cwd=repo, text=True, capture_output=True)
    assert checked.returncode == 0, checked.stdout + checked.stderr
    print(checked.stdout.strip())

print('PASS PRE55 candidate access, retired denial, active access, 60-minute expiry, redaction, service binding and Auto-Deploy-off controls')
