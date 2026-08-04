# Smarter Justice v1.7.73

Smarter Justice v1.7.73 is a material, non-deployed central-governance release built from exact source and immediate rollback `smarter-justice-v1.7.72.zip`, SHA-256 `db2b08c866c826abfc5d2a4b920419bacacbe6185f6f3d883cdec7c4af31c678`, under coordinated pack `SJP-2026-08-02-C15-P37-D11-V13` and durable baseline `DRB-2026-08-02-DUR001-DUR086-V13`.

## Material improvement

- Adds a detached owner-authorization decision schema bound to the exact immutable provider-discovery request ID, request digest, product artifact identity, requested read-only scopes, and short authorization window.
- Adds deterministic single-use execution-envelope construction with explicit nonce replay rejection.
- Rejects silent request mutation, scope escalation, stale or expired consent, secret-value access, writes, configuration changes, deployment authority, production authority, cohort-freeze authority, and canary authority.
- Adds protected owner visibility at `/api/owner/provider-discovery-authorization` and preserves the existing provider-discovery plan and preflight views.
- Keeps the embedded request deliberately unapproved. No detached owner decision exists and no execution envelope is packaged.
- Preserves the exact five-product initial cutover scope, independent product readiness without cross-blocking, public free core, commercial boundaries, historical evidence, and exact rollback.

## Acceptance boundary

The dependency-independent suite contains 127 commands. One PostgreSQL-dependent readiness part remains separate and unclaimed without an accepted PostgreSQL environment. No provider metadata or secret values were read, no request was authorized, the cohort is not frozen, no canary is selected, deployment is not authorized, production is not deployed, and launch remains `NO_GO`.
