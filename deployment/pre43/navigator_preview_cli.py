from __future__ import annotations
import datetime
import hashlib
import importlib.util
import json
import os
import pathlib
import sqlite3
import sys
import time
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[2]
EXACT = ROOT / 'deployment' / 'pre42' / 'exact'
DB_PATH = pathlib.Path(os.environ.get('SJ_NAVIGATOR_DB', '/tmp/sj-navigator-pre43.sqlite3'))


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
ProviderCallFailed = provider_mod.ProviderCallFailed
AIUsageLedger = meter_mod.AIUsageLedger
NavigatorStore = nav_mod.NavigatorStore

BASE_SYSTEM = '''You are Smarter Justice Navigator, the universal AI assistant inside Smarter Justice.
Help public users, attorneys, law firms, staff, and the owner understand, organize, draft, summarize, navigate tools, prepare work, and identify practical next steps.
You are not a lawyer and do not create an attorney-client relationship. Do not claim legal certainty, professional representation, guaranteed outcomes, or that a lawyer has reviewed something unless the system explicitly says so.
Never claim you sent, filed, published, paid, deleted, changed an account, contacted anyone, or completed an external action unless a separately authorized execution tool actually returned that result. This release executes no external consequential actions from Navigator.
If a requested action would have an external, financial, filing, rights-affecting, destructive, account-changing, or irreversible effect, prepare the work and clearly say that authorization/confirmation is required before execution.
Protect privacy. Do not ask for unnecessary Social Security numbers, full financial account numbers, passwords, secret keys, or other highly sensitive data. Encourage redaction when full identifiers are unnecessary.
When current law, deadlines, court rules, agency rules, or other time-sensitive facts matter, state that current authoritative sources should be checked rather than inventing certainty.
Use clear plain language and be useful rather than verbose.'''

MODE_INSTRUCTIONS = {
    'NAVIGATOR': 'Act as the general Smarter Justice Navigator. Help the user accomplish the requested task or identify the best next step.',
    'STARTING_POINT': 'Act as a starting-point organizer. Identify the likely issue area, urgency signals, useful documents/information, and safe next steps without pretending to give a definitive legal conclusion.',
    'DRAFT': 'Act as a drafting assistant. Produce a clear editable draft from the facts supplied, mark placeholders where facts are missing, and do not claim the draft was sent or filed.',
    'SUMMARIZE': 'Act as an organization assistant. Summarize the supplied material, separate known facts from assumptions, and identify unresolved questions.',
    'CHECKLIST': 'Act as a planning assistant. Produce a prioritized checklist with practical next steps and flag items that require professional or current-source verification.',
    'PROFESSIONAL_WORKFLOW': 'Act as an attorney/law-firm workflow assistant. Help organize intake, client-service, marketing, drafting, CRM, and operational tasks while respecting confidentiality, authorization, advertising/compliance, and confirmation boundaries.',
}

ALLOWANCES = {
    'PUBLIC_USER': (75000, 60000),
    'PROFESSIONAL': (400000, 320000),
    'STAFF': (600000, 500000),
    'OWNER': (1000000, 850000),
}


def fake_transport(endpoint, headers, body, timeout):
    return 200, {}, {
        'id': 'resp_pre43_test',
        'model': body.get('model') or 'gpt-5-mini',
        'output': [{'type': 'message', 'content': [{'type': 'output_text', 'text': 'PRE43 NAVIGATOR TEST READY'}]}],
        'usage': {'input_tokens': 12, 'output_tokens': 7},
    }


class Pre43OpenAIProvider(OpenAIProvider):
    def responses_create(self, *, tool_id, input_text, request_id, safety_identifier, timeout=30):
        headers, model = self._headers()
        started = time.monotonic()
        body = {
            'model': model,
            'input': input_text,
            'store': False,
            'max_output_tokens': 1400,
            'safety_identifier': safety_identifier,
            'metadata': {'sj_tool_id': tool_id, 'sj_request_id': request_id, 'sj_release': 'pre43'},
        }
        try:
            status, response_headers, obj = self.transport(self.endpoint, headers, body, timeout)
        except Exception as exc:
            raise ProviderCallFailed(type(exc).__name__) from exc
        if status < 200 or status >= 300:
            raise ProviderCallFailed('provider_http_status_' + str(status))
        text = obj.get('output_text') or ''
        if not text:
            chunks = []
            for item in obj.get('output', []):
                for c in item.get('content', []) if isinstance(item, dict) else []:
                    if isinstance(c, dict) and c.get('type') in ('output_text', 'text') and c.get('text'):
                        chunks.append(c['text'])
            text = ''.join(chunks)
        usage = obj.get('usage') or {}
        return {
            'provider': 'OPENAI',
            'model': obj.get('model') or model,
            'providerResponseId': obj.get('id'),
            'outputText': text,
            'usage': {
                'inputUnits': int(usage.get('input_tokens') or 0),
                'outputUnits': int(usage.get('output_tokens') or 0),
            },
            'latencyMs': int((time.monotonic() - started) * 1000),
            'secretEchoDetected': False,
            'storeRequested': False,
        }


def provider():
    test_mode = os.environ.get('SJ_NAVIGATOR_TEST_MODE') == '1'
    if test_mode:
        if os.environ.get('NODE_ENV') != 'test':
            raise RuntimeError('Navigator test mode is allowed only with NODE_ENV=test')
        env = dict(os.environ)
        env.setdefault('OPENAI_API_KEY', 'test-not-a-secret')
        env.setdefault('OPENAI_API_MODEL', 'gpt-5-mini')
        env.setdefault('OPENAI_PROJECT_ID', 'proj_test')
        return Pre43OpenAIProvider(transport=fake_transport, env=env)
    return Pre43OpenAIProvider()


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
        raise ValueError('valid Navigator session is required')
    return actor


def safe_actor_class(value):
    actor_class = str(value or 'PUBLIC_USER').upper()
    if actor_class not in ALLOWANCES:
        actor_class = 'PUBLIC_USER'
    return actor_class


def safe_mode(value):
    mode = str(value or 'NAVIGATOR').upper()
    return mode if mode in MODE_INSTRUCTIONS else 'NAVIGATOR'


def safe_input_mode(value):
    mode = str(value or 'TEXT').upper()
    if mode not in ('TEXT', 'DICTATION_ADAPTER'):
        raise ValueError('input mode is not accepted')
    return mode


def safe_prompt(value):
    prompt = str(value or '').strip()
    if not prompt:
        raise ValueError('message is required')
    if len(prompt) > 12000:
        raise ValueError('message is too long for this request')
    return prompt


def recent_history(conn, thread_id, limit=16):
    rows = conn.execute(
        'SELECT role,content FROM navigator_messages WHERE thread_id=? ORDER BY created_at DESC LIMIT ?',
        (thread_id, int(limit)),
    ).fetchall()
    rows = list(reversed(rows))
    return [{'role': str(r['role']), 'content': str(r['content'])} for r in rows]


def build_model_input(history, prompt, mode, actor_class):
    lines = [BASE_SYSTEM, MODE_INSTRUCTIONS[mode], f'User class: {actor_class}.', '', 'Conversation so far:']
    for row in history:
        label = 'User' if row['role'].upper() == 'USER' else 'Navigator'
        lines.append(f"{label}: {row['content']}")
    lines.append(f'User: {prompt}')
    lines.append('Navigator:')
    return '\n'.join(lines)


def safety_identifier(actor):
    return 'sj_' + hashlib.sha256(actor.encode('utf-8')).hexdigest()[:40]


def chat(payload):
    actor = safe_actor(payload.get('actorRef'))
    actor_class = safe_actor_class(payload.get('actorClass'))
    mode = safe_mode(payload.get('toolMode'))
    input_mode = safe_input_mode(payload.get('inputMode'))
    prompt = safe_prompt(payload.get('message'))
    requested_thread = str(payload.get('threadId') or '').strip()

    conn = connect()
    try:
        ledger = AIUsageLedger(conn)
        store = NavigatorStore(conn)
        period = current_period()
        hard, warn = ALLOWANCES[actor_class]
        scope_type = 'PUBLIC_USER' if actor_class == 'PUBLIC_USER' else 'FIRM_MEMBER'
        ledger.set_allowance(scope_type, actor, period, hard_units=hard, warn_units=warn)

        if requested_thread:
            store.assert_access(requested_thread, owner_ref=actor, tenant_id=None)
            thread_id = requested_thread
        else:
            thread_id = store.create_thread(
                owner_scope=actor_class,
                owner_ref=actor,
                tenant_id=None,
                experience_mode='SMARTER_JUSTICE',
            )

        history = recent_history(conn, thread_id)
        decision = ledger.decision(scope_type, actor, period, projected_units=5000)
        if str(decision.get('state', '')).startswith('BLOCK_'):
            return {
                'ok': False,
                'errorCode': 'AI_ALLOWANCE_BLOCKED',
                'message': 'This Navigator allowance has reached its current safety limit. Sign in or try again after the allowance resets.',
                'threadId': thread_id,
                'allowance': decision,
            }

        store.add_message(thread_id, owner_ref=actor, tenant_id=None, role='USER', input_mode=input_mode, content=prompt)
        request_id = 'pre43-' + uuid.uuid4().hex
        result = provider().responses_create(
            tool_id='NAVIGATOR_' + mode,
            input_text=build_model_input(history, prompt, mode, actor_class),
            request_id=request_id,
            safety_identifier=safety_identifier(actor),
            timeout=40,
        )
        answer = str(result.get('outputText') or '').strip()
        if not answer:
            raise RuntimeError('provider returned no Navigator text')

        store.add_message(thread_id, owner_ref=actor, tenant_id=None, role='ASSISTANT', input_mode='TEXT', content=answer)
        usage = result.get('usage') or {}
        receipt = ledger.record(
            request_id=request_id,
            tenant_id=None,
            actor_type=actor_class,
            actor_ref=actor,
            tool_id='NAVIGATOR_' + mode,
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
            'toolMode': mode,
            'actorClass': actor_class,
            'provider': 'openai',
            'model': result.get('model'),
            'providerResponseId': result.get('providerResponseId'),
            'latencyMs': int(result.get('latencyMs') or 0),
            'usage': usage,
            'usageLedgerRecorded': bool(receipt.get('recorded') or receipt.get('idempotentReplay')),
            'allowanceState': decision.get('state'),
            'inputMode': input_mode,
            'storeRequested': False,
            'externalActionsExecuted': False,
            'publicAiEnabled': True,
            'automaticOverageBillingEnabled': False,
        }
    finally:
        conn.close()


def status(payload):
    actor = safe_actor(payload.get('actorRef'))
    actor_class = safe_actor_class(payload.get('actorClass'))
    conn = connect()
    try:
        AIUsageLedger(conn)
        NavigatorStore(conn)
        rows = conn.execute(
            'SELECT thread_id,created_at FROM navigator_threads WHERE owner_ref=? ORDER BY created_at DESC LIMIT 10',
            (actor,),
        ).fetchall()
        readiness = provider().readiness()
        readiness['ready'] = bool(readiness.get('keyPresent') and readiness.get('modelPresent') and readiness.get('projectIdPresent'))
        return {
            'ok': True,
            'providerReadiness': readiness,
            'actorClass': actor_class,
            'availableToolModes': list(MODE_INSTRUCTIONS.keys()),
            'threads': [{'threadId': r['thread_id'], 'createdAt': r['created_at']} for r in rows],
            'publicAiEnabled': True,
            'externalActionsExecuted': False,
            'automaticOverageBillingEnabled': False,
            'requestStorageRequested': False,
            'persistenceBoundary': 'runtime Navigator storage; durable production database migration remains a successor task',
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
            raise ValueError('unknown Navigator action')
        print(json.dumps(out, separators=(',', ':'), ensure_ascii=False))
    except PermissionError:
        print(json.dumps({'ok': False, 'errorCode': 'THREAD_ACCESS_DENIED', 'message': 'Navigator thread access denied.'}, separators=(',', ':')))
        sys.exit(3)
    except Exception as exc:
        safe_message = str(exc) if isinstance(exc, ValueError) else 'Navigator could not complete this request.'
        print(json.dumps({'ok': False, 'errorCode': type(exc).__name__, 'message': safe_message}, separators=(',', ':')))
        sys.exit(2)


if __name__ == '__main__':
    main()
