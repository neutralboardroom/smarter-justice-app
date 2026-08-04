# Three-Portal Pilot Rollback Plan — v1.7.48

No live pilot import is authorized by this artifact. Before any staging or production activation, each portal must name one exact last-known-good portal artifact, its hash, size, database compatibility, adapter version, projection snapshot, and rollback operator.

For an import failure or material conflict:

1. Stop the affected portal import; do not affect the other portals or central accounts.
2. Preserve the rejected batch, digest, validation errors, receipt, and audit evidence.
3. Continue serving the portal’s last-known-good read-only projection.
4. Do not publish a private, stale, wrong-destination, unverified, or payment-only record.
5. Apply suppression immediately when required while preserving evidence.
6. Restore the exact last-known-good projection or exact portal artifact only after authorized review.
7. Reconcile central revision, approved revision, adapter version, and portal receipt before retry.
8. Record owner disposition and post-incident actions.

The Smarter Justice platform rollback artifact is separately unresolved and remains `OWNER_APPROVAL_REQUIRED`; this release does not guess it.
