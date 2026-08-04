# Smarter Justice v1.7.71 Change Map

- **Source and rollback:** exact `smarter-justice-v1.7.70.zip`, SHA-256 `3a9f3c1bd554608225a2b152e3c3c4d089fd0a6a56c9242f2e49adf3027a606e`.
- **Controlling authority:** `SJP-2026-08-02-C15-P37-D11-V13`; durable baseline `DRB-2026-08-02-DUR001-DUR086-V13`.
- **New provider schema:** `PROVIDER_DISCOVERY_RECEIPT_SCHEMA_V1.7.71.json`.
- **Truthful source receipt:** `PROVIDER_DISCOVERY_RECEIPT_SMARTER_JUSTICE_SOURCE_V1.7.70.json`.
- **Freeze/canary policy:** `COHORT_FREEZE_AND_CANARY_POLICY_V1.7.71.json`.
- **Static aggregate:** `PROVIDER_PREFLIGHT_AGGREGATE_V1.7.71.json`.
- **Runtime module:** `lib/providerPreflight.js`.
- **Validators:** `scripts/provider-preflight-validate-v1771.js` and `scripts/launch-cohort-preflight-v1771.js`.
- **Regression coverage:** `tests/provider-preflight-v1771.test.js`.
- **Protected owner route:** `GET /api/owner/provider-preflight`; status also appears in the protected owner control center.
- **Preserved boundaries:** exact five-product first cutover, independent product readiness, no missing-state inference, no cross-blocking, no secret values, no deployment authorization.
