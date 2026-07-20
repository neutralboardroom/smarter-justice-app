-- Smarter Justice v1.1.0 Postgres foundation
-- Run against a managed PostgreSQL database before production paid traffic.
-- The app stores current JSON records in a key/value table while uploads remain on secure disk/object storage.

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

-- Future normalized tables can be added after the paid pilot validates workflow volume.
-- Do not store raw SMTP, Stripe, AI, attorney-directory, or lead-ping credentials in this database.
