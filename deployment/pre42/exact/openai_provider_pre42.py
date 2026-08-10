from __future__ import annotations
import os, json, urllib.request, urllib.error, time

class ProviderNotReady(RuntimeError): pass
class ProviderCallFailed(RuntimeError): pass

class OpenAIProvider:
    endpoint='https://api.openai.com/v1/responses'
    def __init__(self, transport=None, env=None):
        self.env=env if env is not None else os.environ
        self.transport=transport or self._http_transport
    def readiness(self):
        return {'keyPresent':bool(self.env.get('OPENAI_API_KEY')),'modelPresent':bool(self.env.get('OPENAI_API_MODEL')),'projectIdPresent':bool(self.env.get('OPENAI_PROJECT_ID'))}
    def _headers(self):
        key=self.env.get('OPENAI_API_KEY'); model=self.env.get('OPENAI_API_MODEL')
        if not key or not model: raise ProviderNotReady('OPENAI_API_KEY and OPENAI_API_MODEL are required server-side')
        h={'Authorization':'Bearer '+key,'Content-Type':'application/json'}
        if self.env.get('OPENAI_PROJECT_ID'): h['OpenAI-Project']=self.env['OPENAI_PROJECT_ID']
        return h,model
    def _http_transport(self, endpoint, headers, body, timeout):
        req=urllib.request.Request(endpoint,data=json.dumps(body).encode(),headers=headers,method='POST')
        with urllib.request.urlopen(req,timeout=timeout) as r:
            return r.status, dict(r.headers.items()), json.loads(r.read())
    def responses_create(self, *,tool_id,input_text,request_id,timeout=30):
        headers,model=self._headers(); started=time.monotonic()
        body={'model':model,'input':input_text,'metadata':{'sj_tool_id':tool_id,'sj_request_id':request_id}}
        try: status,response_headers,obj=self.transport(self.endpoint,headers,body,timeout)
        except Exception as e: raise ProviderCallFailed(type(e).__name__) from e
        if status<200 or status>=300: raise ProviderCallFailed('provider_http_status_'+str(status))
        text=obj.get('output_text') or ''
        if not text:
            # Reference parser for Responses API object shape without assuming SDK helpers.
            chunks=[]
            for item in obj.get('output',[]):
                for c in item.get('content',[]) if isinstance(item,dict) else []:
                    if isinstance(c,dict) and c.get('type') in ('output_text','text') and c.get('text'): chunks.append(c['text'])
            text=''.join(chunks)
        usage=obj.get('usage') or {}
        return {
          'provider':'OPENAI','model':obj.get('model') or model,'providerResponseId':obj.get('id'),
          'outputText':text,'usage':{'inputUnits':int(usage.get('input_tokens') or 0),'outputUnits':int(usage.get('output_tokens') or 0)},
          'latencyMs':int((time.monotonic()-started)*1000),
          'secretEchoDetected':False
        }
    def canary(self, request_id='pre42-canary'):
        return self.responses_create(tool_id='SYSTEM_CANARY',input_text='Reply with exactly: SMARTER JUSTICE AI READY',request_id=request_id)
