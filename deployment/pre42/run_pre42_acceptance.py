from __future__ import annotations
import datetime as _dt, hashlib, importlib.util, json, os, pathlib, sqlite3, sys

HERE=pathlib.Path(__file__).resolve().parent
EXACT=HERE/'exact'
PRODUCT_SHA='9956c52237ebc09bb6e4474c7c0a9863af6d952cabc3e030ee42942cc75cc4f5'
COMPONENT_SHA={
 'openai_provider_pre42.py':'ffd68a7913b3cd3e859308ffb99fefe2c885503484342f74992ab4cdce93e80c',
 'ai_usage_meter_pre42.py':'618f35b30397727d4eefe5d4922c5ced76a62c3863590bb3c7169da6d35ca2f0',
 'navigator_pre42.py':'e19776d3d67e1a71c2ef7ba6edf98245867bea1527e0fddc21a6565ec8871f77',
}

def load(name, filename):
    spec=importlib.util.spec_from_file_location(name, EXACT/filename)
    mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); return mod

def truthy(v): return str(v or '').strip().lower() in {'1','true','yes','on'}
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def now(): return _dt.datetime.now(_dt.timezone.utc).isoformat()

def public_root():
    p=pathlib.Path('.runtime/smarter-justice-v1.7.98/public')
    return p if p.exists() else pathlib.Path('/tmp')/'sj-public-missing'

def write_receipt(row):
    p=public_root()/'.well-known'/'smarter-justice-pre42-deployment.json'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(row,indent=2,sort_keys=True)+'\n',encoding='utf-8')
    print('[pre42-projection] receipt', row.get('status'), 'written to', p)

def scan_secret(secret):
    if not secret: return True
    root=public_root()
    if not root.exists(): return False
    needle=secret.encode()
    for path in root.rglob('*'):
        if not path.is_file(): continue
        try:
            if needle in path.read_bytes(): return False
        except OSError: pass
    return True

def main():
    base={
      'schemaVersion':'1.0.0', 'projection':'PRE42_RENDER_CONTROLLED_ACCEPTANCE_V1',
      'pre42ArtifactSha256':PRODUCT_SHA, 'checkedAt':now(), 'secretExposed':False,
      'publicAiEnabled': truthy(os.getenv('OPENAI_AI_ENABLED')) and not truthy(os.getenv('AI_GLOBAL_KILL_SWITCH','true')),
      'outboundActionsEnabled':False, 'automaticOverageBillingEnabled':False,
    }
    try:
      for fn, expected in COMPONENT_SHA.items():
        actual=sha(EXACT/fn)
        if actual!=expected: raise RuntimeError(f'exact component hash mismatch: {fn}')
      op=load('pre42_openai', 'openai_provider_pre42.py')
      um=load('pre42_usage', 'ai_usage_meter_pre42.py')
      nv=load('pre42_nav', 'navigator_pre42.py')

      try:
        op.OpenAIProvider(env={'OPENAI_API_MODEL':'gpt-5-mini'}).canary('pre42-negative-missing-key')
        provider_failure='FAIL'
      except op.ProviderNotReady:
        provider_failure='PASS'

      db=sqlite3.connect(':memory:')
      ledger=um.AIUsageLedger(db)
      period=_dt.datetime.now(_dt.timezone.utc).strftime('%Y-%m')
      actor='pre42-render-canary-user'
      ledger.set_allowance('PUBLIC_USER',actor,period,10000,9000)
      predecision=ledger.decision('PUBLIC_USER',actor,period,250)
      if predecision['state'] not in ('ALLOW','ALLOW_WARN'): raise RuntimeError('canary allowance unexpectedly blocked')

      provider=op.OpenAIProvider()
      result=provider.canary('pre42-render-live-canary')
      if result.get('outputText','').strip()!='SMARTER JUSTICE AI READY': raise RuntimeError('unexpected provider canary text')
      rec=ledger.record(request_id='pre42-render-live-canary',tenant_id=None,actor_type='PUBLIC_USER',actor_ref=actor,tool_id='SYSTEM_CANARY',provider=result['provider'],model=result['model'],usage_class='DEMO_CANARY',input_units=result['usage']['inputUnits'],output_units=result['usage']['outputUnits'])
      if not rec.get('recorded') and not rec.get('idempotentReplay'): raise RuntimeError('usage ledger did not accept canary')
      ledger.set_allowance('PUBLIC_USER','pre42-zero-user',period,0,0)
      allowance_negative='PASS' if ledger.decision('PUBLIC_USER','pre42-zero-user',period,1)['state']=='BLOCK_ALLOWANCE_EXHAUSTED' else 'FAIL'

      store=nv.NavigatorStore(db)
      tid=store.create_thread(owner_scope='PUBLIC_USER_PRIVATE',owner_ref=actor,experience_mode='SMARTER_JUSTICE')
      store.add_message(tid,owner_ref=actor,role='user',input_mode='TEXT',content='Deployment canary')
      try:
        store.assert_access(tid,owner_ref='wrong-user')
        isolation='FAIL'
      except PermissionError:
        isolation='PASS'
      effects=[]
      def tool(payload,execute=False):
        effects.append(bool(execute)); return {'externalEffectState':'INTERNAL_ONLY','execute':bool(execute)}
      nav=nv.Navigator(store,None,{'DEPLOYMENT_CANARY':tool})
      prepared=nav.act(thread_id=tid,actor_ref=actor,tenant_id=None,tool_id='DEPLOYMENT_CANARY',risk_class='EXTERNAL_COMMUNICATION_OR_PUBLICATION',payload={},confirmed=False)
      confirmation='PASS' if prepared.get('decision')=='PREPARE_ONLY_CONFIRMATION_REQUIRED' and effects==[False] else 'FAIL'

      key=os.getenv('OPENAI_API_KEY','')
      secret_scan='PASS' if scan_secret(key) else 'FAIL'
      checks=[provider_failure,allowance_negative,isolation,confirmation,secret_scan]
      status='PASS' if all(x=='PASS' for x in checks) and not base['publicAiEnabled'] else 'FAIL'
      row={**base,
        'status':status,
        'providerCanary':'PASS', 'provider':'openai', 'model':result.get('model'),
        'providerResponseId':result.get('providerResponseId'), 'latencyMs':result.get('latencyMs'),
        'usage':result.get('usage'), 'usageLedgerRecorded':bool(rec.get('recorded') or rec.get('idempotentReplay')),
        'allowanceNegativeTest':allowance_negative, 'providerFailurePath':provider_failure,
        'navigatorIsolation':isolation, 'navigatorConfirmationGate':confirmation,
        'browserSecretScan':secret_scan, 'componentHashesVerified':True,
      }
      write_receipt(row)
    except Exception as e:
      row={**base,'status':'FAIL','providerCanary':'FAIL','errorCategory':type(e).__name__,'errorMessage':str(e)[:240],'componentHashesVerified':False}
      write_receipt(row)
      print('[pre42-projection] controlled acceptance failed:',type(e).__name__,str(e)[:240],file=sys.stderr)
    return 0
if __name__=='__main__': raise SystemExit(main())
