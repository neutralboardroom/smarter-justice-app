from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json, os, subprocess, tempfile, threading

repo = Path(__file__).resolve().parents[2]
script = repo / 'scripts' / 'render-trigger-deploy-pre55.js'
target = 'a' * 40
state = {'body': None, 'authorization': None}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def do_POST(self):
        state['authorization'] = self.headers.get('Authorization')
        state['body'] = json.loads(self.rfile.read(int(self.headers.get('content-length', '0'))) or b'{}')
        if self.path != '/v1/services/srv-test/deploys':
            self.send_response(404); self.end_headers(); return
        body = json.dumps({'id':'dep-created','status':'created','commit':{'id':target}}).encode()
        self.send_response(201); self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with tempfile.TemporaryDirectory(prefix='sj-pre55-provider-api-') as temp:
        evidence = Path(temp) / 'provider.jsonl'; github_env = Path(temp) / 'github-env'
        env = {**os.environ, 'NODE_ENV':'test', 'RENDER_API_KEY':'provider-api-redaction-secret',
            'RENDER_SERVICE_ID':'srv-test', 'TARGET_SHA':target,
            'RENDER_API_BASE_URL':f'http://127.0.0.1:{server.server_port}/v1',
            'RENDER_DEPLOY_EVIDENCE_PATH':str(evidence), 'GITHUB_ENV':str(github_env)}
        result = subprocess.run(['node', str(script)], cwd=repo, env=env, text=True, capture_output=True)
        assert result.returncode == 0, result.stdout + result.stderr
        assert state['authorization'] == 'Bearer provider-api-redaction-secret'
        assert state['body'] == {'clearCache':'do_not_clear','commitId':target}
        assert 'provider-api-redaction-secret' not in result.stdout + result.stderr + evidence.read_text()
        row = json.loads(evidence.read_text())
        assert row['deployId'] == 'dep-created' and row['commitId'] == target
        assert row['credentialMaterialPresent'] is False and row['deployHookUsed'] is False
        assert github_env.read_text() == 'RENDER_DEPLOY_ID=dep-created\n'
finally:
    server.shutdown(); server.server_close()

workflow = (repo/'.github'/'workflows'/'deploy-current-pre55.yml').read_text()
assert 'RENDER_DEPLOY_HOOK_URL' not in workflow and 'render-trigger-deploy-pre55.js' in workflow
print('PASS PRE55 exact-commit provider API deployment, no deploy-hook dependency, redacted evidence and deploy-id handoff')
