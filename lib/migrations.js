const crypto = require('crypto');

const MIGRATION_STANDARD_VERSION = '1.0.0';
const MIGRATIONS = [
  {
    version: '001-core-store-events',
    description: 'Create the durable JSON state store and immutable event ledger.',
    statements: [
      `CREATE TABLE IF NOT EXISTS smarter_justice_store (
        key text PRIMARY KEY,
        value jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE IF NOT EXISTS smarter_justice_events (
        id text PRIMARY KEY,
        event_type text NOT NULL,
        case_id text,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`,
      'CREATE INDEX IF NOT EXISTS smarter_justice_events_case_id_idx ON smarter_justice_events(case_id)',
      'CREATE INDEX IF NOT EXISTS smarter_justice_events_created_at_idx ON smarter_justice_events(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS smarter_justice_events_event_type_idx ON smarter_justice_events(event_type)'
    ]
  },
  {
    version: '002-paid-pilot-idempotency-readiness',
    description: 'Create durable idempotency and operating-evidence foundations for controlled paid-pilot workflows.',
    statements: [
      `CREATE TABLE IF NOT EXISTS smarter_justice_idempotency (
        scope text NOT NULL,
        idempotency_key text NOT NULL,
        request_hash text NOT NULL DEFAULT '',
        response_status integer,
        response_payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz,
        PRIMARY KEY (scope, idempotency_key)
      )`,
      'CREATE INDEX IF NOT EXISTS smarter_justice_idempotency_expires_at_idx ON smarter_justice_idempotency(expires_at)',
      `CREATE TABLE IF NOT EXISTS smarter_justice_readiness_evidence (
        id text PRIMARY KEY,
        evidence_key text NOT NULL,
        environment text NOT NULL DEFAULT 'unknown',
        status text NOT NULL,
        summary text NOT NULL DEFAULT '',
        payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        recorded_by text NOT NULL DEFAULT '',
        recorded_at timestamptz NOT NULL DEFAULT now()
      )`,
      'CREATE INDEX IF NOT EXISTS smarter_justice_readiness_evidence_key_idx ON smarter_justice_readiness_evidence(evidence_key, recorded_at DESC)'
    ]
  }
];

function checksum(migration) {
  return crypto.createHash('sha256').update(JSON.stringify({
    version: migration.version,
    description: migration.description,
    statements: migration.statements
  })).digest('hex');
}

let lastStatus = {
  standardVersion: MIGRATION_STANDARD_VERSION,
  currentVersion: MIGRATIONS[MIGRATIONS.length - 1].version,
  appliedVersions: [],
  pendingVersions: MIGRATIONS.map(item => item.version),
  current: false,
  lastRunAt: '',
  error: ''
};

async function runMigrations(db) {
  if (!db || typeof db.connect !== 'function') throw new Error('A PostgreSQL pool with connect() is required to run migrations.');
  const client = await db.connect();
  const appliedVersions = [];
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('smarter-justice-schema-migrations'))");
    await client.query(`CREATE TABLE IF NOT EXISTS smarter_justice_schema_migrations (
      version text PRIMARY KEY,
      checksum text NOT NULL,
      description text NOT NULL DEFAULT '',
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const rows = await client.query('SELECT version, checksum FROM smarter_justice_schema_migrations ORDER BY applied_at, version');
    const existing = new Map((rows.rows || []).map(row => [row.version, row.checksum]));
    for (const migration of MIGRATIONS) {
      const expectedChecksum = checksum(migration);
      if (existing.has(migration.version)) {
        if (existing.get(migration.version) !== expectedChecksum) {
          throw new Error(`Migration checksum mismatch for ${migration.version}. Refusing to continue.`);
        }
        appliedVersions.push(migration.version);
        continue;
      }
      for (const statement of migration.statements) await client.query(statement);
      await client.query(
        'INSERT INTO smarter_justice_schema_migrations(version,checksum,description,applied_at) VALUES($1,$2,$3,now())',
        [migration.version, expectedChecksum, migration.description]
      );
      appliedVersions.push(migration.version);
    }
    await client.query('COMMIT');
    lastStatus = {
      standardVersion: MIGRATION_STANDARD_VERSION,
      currentVersion: MIGRATIONS[MIGRATIONS.length - 1].version,
      appliedVersions,
      pendingVersions: MIGRATIONS.filter(item => !appliedVersions.includes(item.version)).map(item => item.version),
      current: appliedVersions.length === MIGRATIONS.length,
      lastRunAt: new Date().toISOString(),
      error: ''
    };
    return { ...lastStatus };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    lastStatus = {
      ...lastStatus,
      appliedVersions,
      pendingVersions: MIGRATIONS.filter(item => !appliedVersions.includes(item.version)).map(item => item.version),
      current: false,
      lastRunAt: new Date().toISOString(),
      error: error.message || 'Database migration failed.'
    };
    throw error;
  } finally {
    client.release();
  }
}

function status() {
  return JSON.parse(JSON.stringify(lastStatus));
}

function manifest() {
  return {
    standardVersion: MIGRATION_STANDARD_VERSION,
    migrations: MIGRATIONS.map(item => ({
      version: item.version,
      description: item.description,
      checksum: checksum(item),
      statementCount: item.statements.length
    }))
  };
}

module.exports = { MIGRATION_STANDARD_VERSION, MIGRATIONS, runMigrations, status, manifest, checksum };
