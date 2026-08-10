from pathlib import Path
import json, os, subprocess, sys, tempfile
ROOT=Path(__file__).resolve().parents[2]
CLI=ROOT/'deployment/pre44/navigator_cli.py'

def call(payload, env):
    p=subprocess.run([sys.executable,str(CLI)],input=json.dumps(payload),text=True,capture_output=True,env=env,check=False)
    if p.returncode: raise AssertionError((p.returncode,p.stdout,p.stderr))
    return json.loads(p.stdout)

with tempfile.TemporaryDirectory() as td:
    env=dict(os.environ)
    env.update({'NODE_ENV':'test','SJ_NAVIGATOR_TEST_MODE':'1','OPENAI_API_KEY':'qualification-not-secret','OPENAI_API_MODEL':'gpt-5-mini','OPENAI_PROJECT_ID':'proj_qualification','SJ_NAVIGATOR_DATA_DIR':td,'SJ_NAVIGATOR_DURABLE_STORAGE':'true'})
    s=call({'action':'status','actorRef':'user-a','actorClass':'PUBLIC_USER'},env)
    assert s['ok'] and s['providerReadiness']['ready'] is True
    assert s['persistenceMode']=='DURABLE_SQLITE' and s['durablePersistenceAccepted'] is True
    c=call({'action':'chat','actorRef':'user-a','actorClass':'PUBLIC_USER','message':'hello','toolMode':'NAVIGATOR','pageContext':'Divorce Law Aid'},env)
    assert c['answer']=='PRE44 NAVIGATOR TEST READY' and c['usageLedgerRecorded'] is True
    assert c['storeRequested'] is False and c['externalActionsExecuted'] is False
    tid=c['threadId']
    s2=call({'action':'status','actorRef':'user-a','actorClass':'PUBLIC_USER'},env)
    assert any(x['threadId']==tid for x in s2['threads'])
    denied=subprocess.run([sys.executable,str(CLI)],input=json.dumps({'action':'chat','actorRef':'user-b','actorClass':'PUBLIC_USER','threadId':tid,'message':'wrong user'}),text=True,capture_output=True,env=env)
    assert denied.returncode==3 and json.loads(denied.stdout)['errorCode']=='THREAD_ACCESS_DENIED'
    db=Path(td)/'smarter-justice'/'navigator-pre44.sqlite3'
    assert db.exists()
print('pre44 Navigator persistence/sitewide contract tests passed')
