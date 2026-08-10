from __future__ import annotations
import sqlite3, uuid
from datetime import datetime, timezone

def now(): return datetime.now(timezone.utc).isoformat()
def new_id(prefix): return prefix+'-'+uuid.uuid4().hex

class NavigatorStore:
    def __init__(self, conn: sqlite3.Connection):
        self.conn=conn
        sql=(
          'CREATE TABLE IF NOT EXISTS navigator_threads(thread_id TEXT PRIMARY KEY, owner_scope TEXT NOT NULL, owner_ref TEXT NOT NULL, tenant_id TEXT, experience_mode TEXT NOT NULL, created_at TEXT NOT NULL);'
          'CREATE TABLE IF NOT EXISTS navigator_messages(message_id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, role TEXT NOT NULL, input_mode TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);'
          'CREATE TABLE IF NOT EXISTS navigator_action_receipts(receipt_id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, actor_ref TEXT NOT NULL, tenant_id TEXT, tool_id TEXT NOT NULL, risk_class TEXT NOT NULL, decision TEXT NOT NULL, confirmation_state TEXT NOT NULL, external_effect_state TEXT NOT NULL, created_at TEXT NOT NULL);'
        )
        conn.executescript(sql)
    def create_thread(self, *, owner_scope, owner_ref, tenant_id=None, experience_mode='SMARTER_JUSTICE'):
        if owner_scope.startswith('FIRM_') and not tenant_id: raise ValueError('firm scope requires tenant')
        tid=new_id('nav')
        self.conn.execute('INSERT INTO navigator_threads VALUES(?,?,?,?,?,?)',(tid,owner_scope,owner_ref,tenant_id,experience_mode,now())); self.conn.commit()
        return tid
    def assert_access(self, thread_id, *, owner_ref, tenant_id=None):
        r=self.conn.execute('SELECT owner_ref,tenant_id FROM navigator_threads WHERE thread_id=?',(thread_id,)).fetchone()
        if not r or r[0]!=owner_ref or (r[1] is not None and r[1]!=tenant_id): raise PermissionError('navigator thread access denied')
        return True
    def add_message(self, thread_id, *, owner_ref, tenant_id=None, role, input_mode, content):
        self.assert_access(thread_id,owner_ref=owner_ref,tenant_id=tenant_id)
        if input_mode not in ('TEXT','DICTATION_ADAPTER'): raise ValueError('input mode not accepted in pre42')
        mid=new_id('msg'); self.conn.execute('INSERT INTO navigator_messages VALUES(?,?,?,?,?,?)',(mid,thread_id,role,input_mode,content,now())); self.conn.commit(); return mid
    def receipt(self, *, thread_id, actor_ref, tenant_id, tool_id, risk_class, decision, confirmation_state='NOT_REQUIRED', external_effect_state='NONE'):
        rid=new_id('navrcpt'); self.conn.execute('INSERT INTO navigator_action_receipts VALUES(?,?,?,?,?,?,?,?,?,?)',(rid,thread_id,actor_ref,tenant_id,tool_id,risk_class,decision,confirmation_state,external_effect_state,now())); self.conn.commit()
        return {'receiptId':rid,'decision':decision,'externalEffectState':external_effect_state}

class Navigator:
    CONFIRM={'EXTERNAL_COMMUNICATION_OR_PUBLICATION','FINANCIAL_OR_BILLING_CHANGE','LEGAL_FILING_OR_RIGHTS_AFFECTING','DESTRUCTIVE_OR_IRREVERSIBLE'}
    def __init__(self, store: NavigatorStore, ai_gateway, tools: dict): self.store=store; self.ai_gateway=ai_gateway; self.tools=tools
    def act(self, *, thread_id, actor_ref, tenant_id, tool_id, risk_class, payload, confirmed=False):
        self.store.assert_access(thread_id,owner_ref=actor_ref,tenant_id=tenant_id)
        tool=self.tools.get(tool_id)
        if tool is None:
            return self.store.receipt(thread_id=thread_id,actor_ref=actor_ref,tenant_id=tenant_id,tool_id=tool_id,risk_class=risk_class,decision='BLOCK_TOOL_NOT_ENTITLED')
        if risk_class in self.CONFIRM and not confirmed:
            r=self.store.receipt(thread_id=thread_id,actor_ref=actor_ref,tenant_id=tenant_id,tool_id=tool_id,risk_class=risk_class,decision='PREPARE_ONLY_CONFIRMATION_REQUIRED',confirmation_state='REQUIRED')
            r['prepared']=tool(payload,execute=False); return r
        result=tool(payload,execute=True)
        r=self.store.receipt(thread_id=thread_id,actor_ref=actor_ref,tenant_id=tenant_id,tool_id=tool_id,risk_class=risk_class,decision='EXECUTED',confirmation_state='CONFIRMED' if confirmed else 'NOT_REQUIRED',external_effect_state=result.get('externalEffectState','INTERNAL_ONLY'))
        r['result']=result; return r
