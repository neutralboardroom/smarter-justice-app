# Smarter Justice v1.7.72

Smarter Justice v1.7.72 is a material, non-deployed central-governance release built from exact source and rollback `smarter-justice-v1.7.71.zip` under coordinated pack `SJP-2026-08-02-C15-P37-D11-V13` and durable baseline `DRB-2026-08-02-DUR001-DUR086-V13`.

## Material improvement

- Adds a product-scoped provider-discovery authorization-request schema that binds read-only discovery to exact current artifact name, version, SHA-256, size, explicit least-privilege scopes, forbidden operations, and an eight-hour maximum authorization window.
- Adds a deterministic authorization plan for the exact five-product initial cutover. Smarter Justice central has one exact draft awaiting owner authorization; all four portal requests remain blocked until their exact current artifacts are freshly supplied and verified.
- Adds authorization-request digest and product-identity binding for returned discovery receipts. Tampered, stale, expired, mismatched, secret-bearing, write-bearing, or deployment-bearing receipts are rejected and invalidated.
- Keeps provider discovery, cohort freeze, canary recommendation, owner authorization, deployment authorization, production request, deployment, and live acceptance as separate states.
- Adds protected owner visibility at `/api/owner/provider-discovery-plan` and in the owner control center.
- Preserves all public pages, the free public core, commercial boundaries, portal-neutral readiness aggregation, historical evidence, and exact rollback.

## Acceptance boundary

The dependency-independent suite contains 126 commands. One PostgreSQL-dependent readiness part remains separate and unclaimed without an accepted PostgreSQL environment. No provider metadata was read, no authorization was inferred, four portal artifact identities remain currentness-blocked, the cohort is not frozen, no canary is selected, no deployment is authorized, production is not deployed, and launch remains `NO_GO`.
