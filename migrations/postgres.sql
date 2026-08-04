-- Smarter Justice v1.7.7 PostgreSQL schema reference snapshot.
-- DO NOT use this file as the migration authority.
-- Run `npm run migrate`; lib/migrations.js provides versioned, checksum-verified,
-- advisory-locked, transactional migrations and refuses checksum drift.

CREATE TABLE IF NOT EXISTS smarter_justice_schema_migrations (
  version text PRIMARY KEY,
  checksum text NOT NULL,
  description text NOT NULL DEFAULT '',
  applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smarter_justice_store (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS smarter_justice_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  case_id text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS smarter_justice_events_case_id_idx ON smarter_justice_events(case_id);
CREATE INDEX IF NOT EXISTS smarter_justice_events_created_at_idx ON smarter_justice_events(created_at DESC);
CREATE INDEX IF NOT EXISTS smarter_justice_events_event_type_idx ON smarter_justice_events(event_type);
CREATE TABLE IF NOT EXISTS smarter_justice_idempotency (
  scope text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL DEFAULT '',
  response_status integer,
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (scope, idempotency_key)
);
CREATE INDEX IF NOT EXISTS smarter_justice_idempotency_expires_at_idx ON smarter_justice_idempotency(expires_at);
CREATE TABLE IF NOT EXISTS smarter_justice_readiness_evidence (
  id text PRIMARY KEY,
  evidence_key text NOT NULL,
  environment text NOT NULL DEFAULT 'unknown',
  status text NOT NULL,
  summary text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_by text NOT NULL DEFAULT '',
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS smarter_justice_readiness_evidence_key_idx ON smarter_justice_readiness_evidence(evidence_key, recorded_at DESC);
