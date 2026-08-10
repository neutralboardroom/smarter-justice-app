from __future__ import annotations
import json
import os
import pathlib
import sqlite3
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
CLI = ROOT / 'deployment' / 'pre43' / 'navigator_preview_cli.py'
RUNTIME = ROOT / '.runtime' / 'smarter-justice-v1.7.98'


def run_cli(payload, actor_db, expect=0):
    env = dict(os.environ)
    env.update({
        'NODE_ENV': 'test',
        'SJ_NAVIGATOR_TEST_MODE': '1',
        'SJ_NAVIGATOR_DB': str(actor_db),
        'OPENAI_API_KEY': 'qualification-not-a-live-secret',
        'OPENAI_API_MODEL': 'gpt-5-mini',
        'OPENAI_PROJECT_ID': 'proj_qualification',
    })
    p = subprocess.run(
        ['python3', str(CLI)],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        env=env,
        cwd=ROOT,
        timeout=20,
    )
    if p.returncode != expect:
        raise AssertionError(f'CLI exit {p.returncode}; expected {expect}; stdout={p.stdout!r}; stderr={p.stderr!r}')
    return json.loads(p.stdout)


def main():
    assert CLI.exists()
    assert RUNTIME.exists(), 'runtime must be reconstructed before pre43 tests'
    server = (RUNTIME / 'server.js').read_text()
    index = (RUNTIME / 'public' / 'index.html').read_text()
    nav_html = (RUNTIME / 'public' / 'navigator.html').read_text()
    nav_js = (RUNTIME / 'public' / 'navigator.js').read_text()

    assert 'SMARTER_JUSTICE_PRE43_PUBLIC_NAVIGATOR' in server
    assert "'/api/navigator/status'" in server
    assert "'/api/navigator/chat'" in server
    assert 'SMARTER_JUSTICE_PRE43_NAVIGATOR_HOME_CTA' in index
    assert 'Available to everyone' in nav_html
    assert 'PROFESSIONAL_WORKFLOW' in nav_html
    assert 'SpeechRecognition' in nav_js
    assert 'OPENAI_API_KEY' not in nav_html
    assert 'OPENAI_API_KEY' not in nav_js

    with tempfile.TemporaryDirectory() as td:
        db = pathlib.Path(td) / 'navigator.sqlite3'
        status = run_cli({'action':'status','actorRef':'public:a','actorClass':'PUBLIC_USER'}, db)
        assert status['ok'] is True
        assert status['publicAiEnabled'] is True
        assert status['externalActionsExecuted'] is False
        assert status['requestStorageRequested'] is False
        assert status['providerReadiness']['ready'] is True
        assert set(status['availableToolModes']) >= {'NAVIGATOR','STARTING_POINT','DRAFT','SUMMARIZE','CHECKLIST','PROFESSIONAL_WORKFLOW'}

        first = run_cli({'action':'chat','actorRef':'public:a','actorClass':'PUBLIC_USER','message':'Help me organize a question.','toolMode':'STARTING_POINT'}, db)
        assert first['ok'] is True
        assert first['answer'] == 'PRE43 NAVIGATOR TEST READY'
        assert first['toolMode'] == 'STARTING_POINT'
        assert first['usageLedgerRecorded'] is True
        assert first['storeRequested'] is False
        assert first['externalActionsExecuted'] is False
        assert first['automaticOverageBillingEnabled'] is False
        thread_id = first['threadId']

        second = run_cli({'action':'chat','actorRef':'professional:a','actorClass':'PROFESSIONAL','message':'Draft a short follow-up.','toolMode':'DRAFT'}, db)
        assert second['ok'] is True
        assert second['actorClass'] == 'PROFESSIONAL'
        assert second['toolMode'] == 'DRAFT'

        denied = run_cli({'action':'chat','actorRef':'public:b','actorClass':'PUBLIC_USER','threadId':thread_id,'message':'Open another user thread.','toolMode':'NAVIGATOR'}, db, expect=3)
        assert denied['ok'] is False
        assert denied['errorCode'] == 'THREAD_ACCESS_DENIED'

        conn = sqlite3.connect(db)
        try:
            usage = conn.execute('SELECT COUNT(*) FROM ai_usage_events').fetchone()[0]
            messages = conn.execute('SELECT COUNT(*) FROM navigator_messages').fetchone()[0]
            assert usage == 2
            assert messages == 4
        finally:
            conn.close()

    print('pre43 public Navigator qualification tests passed')


if __name__ == '__main__':
    main()
