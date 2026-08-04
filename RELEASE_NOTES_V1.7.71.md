# Smarter Justice v1.7.71

Smarter Justice v1.7.71 is a material, non-deployed central-governance release built from exact source and rollback `smarter-justice-v1.7.70.zip` under coordinated pack `SJP-2026-08-02-C15-P37-D11-V13` and durable baseline `DRB-2026-08-02-DUR001-DUR086-V13`.

## Material improvement

- Adds a product-scoped, read-only provider-discovery receipt contract that records identifiers, verification states, and secret presence only—never secret values.
- Adds an exact five-product cohort-freeze eligibility gate. All five current, complete, blocker-free receipts are required before freeze can be requested.
- Adds deterministic canary recommendation based only on accepted receipt evidence and explicit risk scores; recommendation never authorizes deployment.
- Preserves the independent product launch-readiness aggregate, exact first-cutover scope, and truthful `LAUNCH_READY_NOT_SCHEDULED` status for separately approved non-initial portals.
- Adds protected owner visibility at `/api/owner/provider-preflight` and in the owner control center.
- Preserves all public pages, the free public core, current commercial boundaries, historical evidence, and rollback controls.

## Acceptance boundary

The dependency-independent suite contains 125 commands. One PostgreSQL-dependent readiness part remains separate and unclaimed without an accepted PostgreSQL environment. Provider discovery remains incomplete, the cohort is not frozen, no canary is selected, no deployment is authorized, production is not deployed, and launch remains `NO_GO`.
