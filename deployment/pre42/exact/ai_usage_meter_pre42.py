from __future__ import annotations
import sqlite3, json, uuid
from datetime import datetime, timezone

def now(): return datetime.now(timezone.utc).isoformat()
def new_id(prefix): return prefix+'-'+uuid.uuid4().hex

class AIUsageLedger:
    def __init__(self, conn: sqlite3.Connection):
        self.conn=conn
        conn.executescript('''
        CREATE TABLE IF NOT EXISTS ai_allowances(
          scope_type TEXT NOT NULL, scope_id TEXT NOT NULL, period_key TEXT NOT NULL,
          hard_units INTEGER NOT NULL, warn_units INTEGER NOT NULL, PRIMARY KEY(scope_type,scope_id,period_key));
        CREATE TABLE IF NOT EXISTS ai_usage_events(
          event_id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, tenant_id TEXT,
          actor_type TEXT NOT NULL, actor_ref TEXT NOT NULL, tool_id TEXT NOT NULL,
          provider TEXT NOT NULL, model TEXT NOT NULL, usage_class TEXT NOT NULL,
          input_units INTEGER NOT NULL, output_units INTEGER NOT NULL, total_units INTEGER NOT NULL,
          occurred_at TEXT NOT NULL);
        '''); conn.commit()
    def set_allowance(self, scope_type, scope_id, period_key, hard_units, warn_units=None):
        if hard_units < 0: raise ValueError('hard_units must be nonnegative')
        warn_units=hard_units if warn_units is None else warn_units
        if warn_units>hard_units: raise ValueError('warn_units cannot exceed hard_units')
        self.conn.execute('INSERT OR REPLACE INTO ai_allowances VALUES(?,?,?,?,?)',(scope_type,scope_id,period_key,hard_units,warn_units)); self.conn.commit()
    def used(self, scope_type, scope_id, period_key):
        # Reference implementation maps FIRM_TENANT to tenant_id and FIRM_MEMBER/PUBLIC_USER to actor_ref.
        if scope_type=='FIRM_TENANT':
            r=self.conn.execute("SELECT COALESCE(SUM(total_units),0) FROM ai_usage_events WHERE tenant_id=? AND substr(occurred_at,1,7)=?",(scope_id,period_key)).fetchone()
        else:
            r=self.conn.execute("SELECT COALESCE(SUM(total_units),0) FROM ai_usage_events WHERE actor_ref=? AND substr(occurred_at,1,7)=?",(scope_id,period_key)).fetchone()
        return int(r[0])
    def decision(self, scope_type, scope_id, period_key, projected_units):
        row=self.conn.execute('SELECT hard_units,warn_units FROM ai_allowances WHERE scope_type=? AND scope_id=? AND period_key=?',(scope_type,scope_id,period_key)).fetchone()
        if not row: return {'state':'BLOCK_ALLOWANCE_EXHAUSTED','reason':'allowance not configured'}
        hard,warn=row; future=self.used(scope_type,scope_id,period_key)+max(0,int(projected_units))
        if future>hard: return {'state':'BLOCK_ALLOWANCE_EXHAUSTED','projectedUnits':future,'hardUnits':hard}
        return {'state':'ALLOW_WARN' if future>warn else 'ALLOW','projectedUnits':future,'hardUnits':hard,'warnUnits':warn}
    def record(self, *,request_id,tenant_id,actor_type,actor_ref,tool_id,provider,model,usage_class,input_units,output_units):
        total=max(0,int(input_units))+max(0,int(output_units))
        try:
            self.conn.execute('INSERT INTO ai_usage_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(new_id('aiuse'),request_id,tenant_id,actor_type,actor_ref,tool_id,provider,model,usage_class,int(input_units),int(output_units),total,now())); self.conn.commit()
            return {'recorded':True,'idempotentReplay':False,'totalUnits':total}
        except sqlite3.IntegrityError:
            r=self.conn.execute('SELECT total_units FROM ai_usage_events WHERE request_id=?',(request_id,)).fetchone()
            return {'recorded':False,'idempotentReplay':True,'totalUnits':int(r[0])}
