from __future__ import annotations
import datetime, importlib.util, pathlib, sqlite3
HERE=pathlib.Path(__file__).resolve().parent; EXACT=HERE/'exact'
def load(name, fn):
 s=importlib.util.spec_from_file_location(name,EXACT/fn); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
op=load('op','openai_provider_pre42.py'); um=load('um','ai_usage_meter_pre42.py'); nv=load('nv','navigator_pre42.py')
def fake(endpoint,headers,body,timeout):
 assert headers['Authorization']=='Bearer test-secret'; assert headers['OpenAI-Project']=='proj_test'
 return 200,{}, {'id':'resp_test','model':'gpt-5-mini-test','output':[{'content':[{'type':'output_text','text':'SMARTER JUSTICE AI READY'}]}],'usage':{'input_tokens':7,'output_tokens':5}}
r=op.OpenAIProvider(transport=fake,env={'OPENAI_API_KEY':'test-secret','OPENAI_API_MODEL':'gpt-5-mini','OPENAI_PROJECT_ID':'proj_test'}).canary('mock')
assert r['outputText']=='SMARTER JUSTICE AI READY' and r['usage']['inputUnits']==7
c=sqlite3.connect(':memory:'); l=um.AIUsageLedger(c); p=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m'); l.set_allowance('PUBLIC_USER','u',p,20,15); assert l.decision('PUBLIC_USER','u',p,10)['state']=='ALLOW'; l.record(request_id='r1',tenant_id=None,actor_type='PUBLIC_USER',actor_ref='u',tool_id='T',provider='OPENAI',model='m',usage_class='TEST',input_units=8,output_units=8); assert l.decision('PUBLIC_USER','u',p,5)['state']=='BLOCK_ALLOWANCE_EXHAUSTED'
s=nv.NavigatorStore(c); tid=s.create_thread(owner_scope='PUBLIC_USER_PRIVATE',owner_ref='u')
try: s.assert_access(tid,owner_ref='x'); raise AssertionError('isolation missing')
except PermissionError: pass
calls=[]
def t(payload,execute=False): calls.append(execute); return {'externalEffectState':'INTERNAL_ONLY'}
n=nv.Navigator(s,None,{'T':t}); rr=n.act(thread_id=tid,actor_ref='u',tenant_id=None,tool_id='T',risk_class='EXTERNAL_COMMUNICATION_OR_PUBLICATION',payload={},confirmed=False); assert rr['decision']=='PREPARE_ONLY_CONFIRMATION_REQUIRED' and calls==[False]
print('pre42 deployment projection tests passed')
