from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json, os, subprocess, tempfile, threading

repo = Path(__file__).resolve().parents[2]
script = repo / 'scripts' / 'render-deploy-control-pre54.js'
target = 'a' * 40
accepted = 'c' * 40
state = {'observe_calls': 0, 'rollback_body': None}

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
        if self.path == '/v1/services/srv-test':
            return self.send_json(200, {'id': 'srv-test', 'autoDeploy': 'no'})
        if self.path == '/v1/services/srv-auto':
            return self.send_json(200, {'id': 'srv-auto', 'autoDeploy': 'yes'})
        if self.path.endswith('/deploys/dep-observe'):
            state['observe_calls'] += 1
            status = 'queued' if state['observe_calls'] == 1 else 'live'
            return self.send_json(200, {'id': 'dep-observe', 'status': status, 'commit': {'id': target}, 'trigger': 'api'})
        if self.path.endswith('/deploys/dep-mismatch'):
            return self.send_json(200, {'id': 'dep-mismatch', 'status': 'live', 'commit': {'id': 'b' * 40}})
        if self.path.endswith('/deploys/dep-failed'):
            return self.send_json(200, {'id': 'dep-failed', 'status': 'build_failed', 'commit': {'id': target}})
        if self.path.endswith('/deploys/dep-rollback'):
            return self.send_json(200, {'id': 'dep-rollback', 'status': 'live', 'commit': {'id': accepted}, 'trigger': 'rollback'})
        self.send_json(404, {'error': 'missing'})

    def do_POST(self):
        length = int(self.headers.get('content-length', '0'))
        body = json.loads(self.rfile.read(length) or b'{}')
        if self.path == '/v1/services/srv-test/rollback':
            state['rollback_body'] = body
            return self.send_json(200, {'id': 'dep-rollback', 'status': 'created', 'commit': {'id': accepted}})
        self.send_json(404, {'error': 'missing'})

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()

def run(action, *, service='srv-test', extra=None, expected=0, evidence=None):
    env = os.environ.copy()
    env.update({
        'NODE_ENV': 'test',
        'RENDER_API_KEY': 'redaction-test-secret',
        'RENDER_SERVICE_ID': service,
        'RENDER_API_BASE_URL': f'http://127.0.0.1:{server.server_port}/v1',
        'RENDER_OBSERVE_INTERVAL_MS': '1',
        'RENDER_OBSERVE_MAX_ATTEMPTS': '5'
    })
    if evidence:
        env['RENDER_DEPLOY_EVIDENCE_PATH'] = str(evidence)
    if extra:
        env.update(extra)
    result = subprocess.run(['node', str(script), action], cwd=repo, env=env, text=True, capture_output=True)
    assert (result.returncode == 0) == (expected == 0), result.stdout + result.stderr
    assert 'redaction-test-secret' not in result.stdout + result.stderr
    return result

try:
    with tempfile.TemporaryDirectory(prefix='sj-pre54-render-') as temp:
        evidence = Path(temp) / 'provider.jsonl'
        run('observe', extra={'RENDER_DEPLOY_ID': 'dep-observe', 'TARGET_SHA': target}, evidence=evidence)
        rows = [json.loads(line) for line in evidence.read_text().splitlines()]
        assert [row['status'] for row in rows if row['kind'] == 'deploy_status'] == ['queued', 'live']
        assert 'redaction-test-secret' not in evidence.read_text()
        run('observe', extra={'RENDER_DEPLOY_ID': 'dep-mismatch', 'TARGET_SHA': target}, expected=1)
        run('observe', extra={'RENDER_DEPLOY_ID': 'dep-failed', 'TARGET_SHA': target}, expected=1)
        run('service-preflight', service='srv-auto', expected=1)
        run('rollback', extra={'RENDER_ACCEPTED_LIVE_DEPLOY_ID': 'dep-accepted', 'RENDER_ACCEPTED_LIVE_SHA': accepted})
        assert state['rollback_body'] == {'deployId': 'dep-accepted'}
        env = os.environ.copy()
        env.update({'NODE_ENV':'production','RENDER_API_KEY':'x','RENDER_SERVICE_ID':'srv-test','RENDER_API_BASE_URL':'http://127.0.0.1:1/v1'})
        denied = subprocess.run(['node', str(script), 'service-preflight'], cwd=repo, env=env, text=True, capture_output=True)
        assert denied.returncode != 0 and 'test-only' in denied.stderr
finally:
    server.shutdown()
    server.server_close()

for followup in ['test_pre54_unique_ux_ui.py', 'test_pre54_release.py']:
    checked = subprocess.run(['python3', str(Path(__file__).with_name(followup))], cwd=repo, text=True, capture_output=True)
    assert checked.returncode == 0, checked.stdout + checked.stderr
    print(checked.stdout.strip())

print('PASS PRE54 provider-native terminal status, exact commit, auto-deploy hold, redaction, and accepted-live deploy rollback controls')
