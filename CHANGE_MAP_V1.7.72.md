# Smarter Justice v1.7.72 Change Map

## Material implementation
- Added `PROVIDER_DISCOVERY_AUTHORIZATION_REQUEST_SCHEMA_V1.7.72.json`.
- Added `PROVIDER_DISCOVERY_INTAKE_POLICY_V1.7.72.json`.
- Added `PROVIDER_DISCOVERY_PLAN_V1.7.72.json`.
- Added `lib/providerDiscoveryPlan.js`, validator CLI, protected owner endpoint, and focused tests.
- Bound any accepted discovery receipt to the exact request ID, deterministic request digest, product identity, artifact filename, SHA-256, size, and authorization window.
- Preserved read-only, no-secret, no-write, no-deploy, no-production boundaries.

## Preserved
- Existing public experience and legal-micro-portal boundaries.
- Exact five-product initial cutover scope.
- Independent portfolio readiness without cross-blocking or missing-state inference.
- v1.7.71 as exact source and immediate rollback.
- Launch state `NO_GO`.
