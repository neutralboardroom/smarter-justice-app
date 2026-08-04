# Change Map — v1.7.54

- **Truth control:** current portfolio runtime now reads `PORTFOLIO_TRUTH_V1.7.54.json`; v1.7.53 is exact source and immediate rollback.
- **Portfolio:** Divorce 0.26.0, Estate 1.1.53, Personal Injury 0.45.0 and Domestic Violence 0.40.0 are owner-recorded current identities, not in-build verification.
- **Lifecycle:** added versioned field ownership, projection conflicts, correction packets, profile/firm/office/seat/roster/commercial states and closed gates.
- **Notifications:** added classification, redacted safe payloads, idempotency hashes, template versions and provider-result receipts; workflow state remains independent from delivery.
- **Owner operations:** added protected `/api/owner/professional-lifecycle-governance`.
- **Supply chain:** preserved lockfile and recorded exact registry/audit blockers without weakening PostgreSQL architecture.
- **Release:** version, manifests, evidence, rollback, continuation and regression tests advanced to v1.7.54.
