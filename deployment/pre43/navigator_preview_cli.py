from __future__ import annotations
import datetime
import importlib.util
import json
import os
import pathlib
import sqlite3
import sys
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[2]
EXACT = ROOT / 'deployment' / 'pre42' / 'exact'
DB_PATH = pathlib.Path(os.environ.get('SJ_NAVIGATOR_PREVIEW_DB', '/tmp/sj-navigator-preview.sqlite3'))


def load_module(name: str, file_name: str):
    spec = importlib.util.spec_from_file_location(name, EXACT / file_name)
    if not spec or not spec.loader:
        raise RuntimeError('exact pre42 component could not be loaded')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


provider_mod = load_module('sj_pre42_openai_provider', 'openai_provider_pre42.py')
meter_mod = load_module('sj_pre42_ai_usage_meter', 'ai_usage_meter_pre42.py')
nav_mod = load_module('sj_pre42_navigator', 'navigator_pre42.py')

OpenAIProvider = provider_mod.OpenAIProvider
AIUsageLedger = meter_mod.AIUsageLedger
NavigatorStore = nav_mod.NavigatorStore

SYSTEM_BOUNDARY = '''You are Smarter Justice Navigator in a protected owner preview.
Help the user think, organize, draft, summarize, navigate Smarter Justice tools and identify useful next steps.
You are not a lawyer and do not create an attorney-client relationship. Do not claim legal certainty or a professional relationship.
Do not say you sent, filed, published, paid, deleted, changed an account, contacted anyone, or took any external action. This preview executes no external actions.
If a requested action would have an external, financial, filing, rights-affecting, destructive, or irreversible effect, explain what can be prepared and that explicit confirmation and an authorized execution path would be required.
Protect privacy: do not ask for unnecessary highly sensitive information. Be concise, practical, and clear when facts or law may need verification.'''


def fake_transport(endpoint, headers, body, timeout):
    return 200, {}, {
        'id': 'resp_pre43_test',
        'model': body.get('model') or 'gpt-5-mini',
        'output': [{'type': 'message', 'content': [{'type': 'output_text', 'text': 'PRE43 NAVIGATOR TEST READY'}]}],
        'usage': {'input_tokens': 12, 'output_tokens': 7},
    }


def provider():
    test_mode = os.environ.get('SJ_NAVIGATOR_PREVIEW_TEST_MODE') == '1'
    if test_mode:
        if os.environ.get('NODE_ENV') != 'test':
            raise RuntimeError('preview test mode is allowed only with NODE_ENV=test')
        env = dict(os.environ)
        env.setdefault('OPENAI_API_KEY', 'test-not-a-secret')
        env.setdefault('OPENAI_API_MODEL', 'gpt-5-mini')
        return OpenAIProvider(transport=fake_transport, env=env)
    return OpenAIProvider()


def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def current_period():
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m')


def safe_actor(value):
    actor = str(value or '').strip()
    if not actor or len(actor) > 240:
        raise ValueError('valid owner actor reference is required')
    return actor


def safe_input_mode(value):
    mode = str(value or 'TEXT').upper()
    if mode not in ('TEXT', 'DICTATION_ADAPTER'):
        raise ValueError('input mode is not accepted')
    return mode


def safe_prompt(value):
    prompt = str(value or '').strip()
    if not prompt:
        raise ValueError('message is required')
    if len(prompt) > 8000:
        raise ValueError('message is too long for this preview')
    return prompt


def recent_history(conn, thread_id, limit=14):
    rows = conn.execute(
        'SELECT role,content FROM navigator_messages WHERE thread_id=? ORDER BY created_at DESC LIMIT ?',
        (thread_id, int(limit)),
    ).fetchall()
    rows = list(reversed(rows))
    return [{'role': str(r['role']), 'content': str(r['content'])} for r in rows]


def build_model_input(history, prompt):
    lines = [SYSTEM_BOUNDARY, '', 'Conversation so far:']
    for row in history:
        label = 'User' if row['role'].upper() == 'USER' else 'Navigator'
        lines.append(f"{label}: {row['content']}")
    lines.append(f'User: {prompt}')
    lines.append('Navigator:')
    return '\n'.join(lines)


def chat(payload):
    actor = safe_actor(payload.get('actorRef'))
    input_mode = safe_input_mode(payload.get('inputMode'))
    prompt = safe_prompt(payload.get('message'))
    requested_thread = str(payload.get('threadId') or '').strip()

    conn = connect()
    try:
        ledger = AIUsageLedger(conn)
        store = NavigatorStore(conn)
        period = current_period()
        ledger.set_allowance('PUBLIC_USER', actor, period, hard_units=100000, warn_units=80000)

        if requested_thread:
            store.assert_access(requested_thread, owner_ref=actor, tenant_id=None)
            thread_id = requested_thread
        else:
            thread_id = store.create_thread(
                owner_scope='OWNER_PREVIEW', owner_ref=actor, tenant_id=None, experience_mode='SMARTER_JUSTICE'
            )

        history = recent_history(conn, thread_id)
        decision = ledger.decision('PUBLIC_USER', actor, period, projected_units=5000)
        if str(decision.get('state', '')).startswith('BLOCK_'):
            return {
                'ok': False,
                'errorCode': 'AI_ALLOWANCE_BLOCKED',
                'message': 'The protected preview allowance is temporarily unavailable.',
                'threadId': thread_id,
                'allowance': decision,
            }

        store.add_message(
            thread_id, owner_ref=actor, tenant_id=None, role='USER', input_mode=input_mode, content=prompt
        )
        request_id = 'pre43-owner-' + uuid.uuid4().hex
        result = provider().responses_create(
            tool_id='NAVIGATOR_OWNER_PREVIEW',
            input_text=build_model_input(history, prompt),
            request_id=request_id,
            timeout=35,
        )
        answer = str(result.get('outputText') or '').strip()
        if not answer:
            raise RuntimeError('provider returned no Navigator text')

        store.add_message(
            thread_id, owner_ref=actor, tenant_id=None, role='ASSISTANT', input_mode='TEXT', content=answer
        )
        usage = result.get('usage') or {}
        receipt = ledger.record(
            request_id=request_id,
            tenant_id=None,
            actor_type='OWNER',
            actor_ref=actor,
            tool_id='NAVIGATOR_OWNER_PREVIEW',
            provider=str(result.get('provider') or 'OPENAI'),
            model=str(result.get('model') or os.environ.get('OPENAI_API_MODEL') or ''),
            usage_class='CORE_INCLUDED_AI',
            input_units=int(usage.get('inputUnits') or 0),
            output_units=int(usage.get('outputUnits') or 0),
        )
        return {
            'ok': True,
            'threadId': thread_id,
            'answer': answer,
            'provider': 'openai',
            'model': result.get('model'),
            'providerResponseId': result.get('providerResponseId'),
            'latencyMs': int(result.get('latencyMs') or 0),
            'usage': usage,
            'usageLedgerRecorded': bool(receipt.get('recorded') or receipt.get('idempotentReplay')),
            'allowanceState': decision.get('state'),
            'inputMode': input_mode,
            'externalActionsExecuted': False,
            'publicAiEnabledByPreview': False,
        }
    finally:
        conn.close()


def status(payload):
    actor = safe_actor(payload.get('actorRef'))
    conn = connect()
    try:
        AIUsageLedger(conn)
        NavigatorStore(conn)
        rows = conn.execute(
            'SELECT thread_id,created_at FROM navigator_threads WHERE owner_ref=? ORDER BY created_at DESC LIMIT 10',
            (actor,),
        ).fetchall()
        return {
            'ok': True,
            'providerReadiness': provider().readiness(),
            'threads': [{'threadId': r['thread_id'], 'createdAt': r['created_at']} for r in rows],
            'publicAiEnabledByPreview': False,
            'externalActionsExecuted': False,
            'persistenceBoundary': 'runtime preview storage; production durable persistence is not claimed',
        }
    finally:
        conn.close()


def main():
    try:
        payload = json.loads(sys.stdin.read() or '{}')
        action = str(payload.get('action') or 'chat')
        if action == 'chat':
            out = chat(payload)
        elif action == 'status':
            out = status(payload)
        else:
            raise ValueError('unknown preview action')
        print(json.dumps(out, separators=(',', ':'), ensure_ascii=False))
    except PermissionError:
        print(json.dumps({'ok': False, 'errorCode': 'THREAD_ACCESS_DENIED', 'message': 'Navigator thread access denied.'}, separators=(',', ':')))
        sys.exit(3)
    except Exception as exc:
        safe_message = str(exc) if isinstance(exc, ValueError) else 'Navigator preview could not complete this request.'
        print(json.dumps({'ok': False, 'errorCode': type(exc).__name__, 'message': safe_message}, separators=(',', ':')))
        sys.exit(2)


if __name__ == '__main__':
    main()
