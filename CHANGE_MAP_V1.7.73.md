# Smarter Justice v1.7.73 Change Map

## Material implementation

- Added `PROVIDER_DISCOVERY_OWNER_AUTHORIZATION_SCHEMA_V1.7.73.json`.
- Added `PROVIDER_DISCOVERY_OWNER_AUTHORIZATION_PACKET_V1.7.73.json`.
- Added `lib/providerDiscoveryAuthorization.js`.
- Added `scripts/provider-discovery-authorization-validate-v1773.js`.
- Added `tests/provider-discovery-authorization-v1773.test.js`.
- Added protected owner endpoint `/api/owner/provider-discovery-authorization` and control-center visibility.
- Bound a detached owner decision to the exact request ID, request digest, artifact identity, scopes, authorization window, confirmation, and single-use nonce.
- Added execution-envelope creation and deterministic replay, mutation, expiry, mismatch, secret, write, deployment, and production rejection.

## Preserved

- Existing public experience and legal-micro-portal boundaries.
- Exact five-product initial cutover scope.
- Independent portfolio readiness without cross-blocking or missing-state inference.
- `smarter-justice-v1.7.72.zip` as exact source and immediate rollback.
- Launch state `NO_GO`.
