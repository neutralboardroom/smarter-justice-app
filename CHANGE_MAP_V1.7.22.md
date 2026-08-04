# Change Map — v1.7.22

## Cross-sector coordination
- `data/ecosystemWorkspaceSeedV1722.js`: four-sector artifact, priority, staffing, action, and gate seed records.
- `lib/ecosystemWorkspace.js`: protected owner/staff workspace read, constrained update, migration bundle, and markdown export logic.
- `lib/store.js`: adds `ecosystemWorkspace.json` as a governed storage collection.
- `lib/controlCenter.js`: exposes the operating workspace and v1.7.22 command-center specification.
- `server.js`: adds protected workspace read, update, and export routes and advances the server version.
- `public/control-center.html`, `public/app.js`, `public/styles.css`: private cross-sector operating panel and export controls.
- `SMARTER_ECOSYSTEM_CONTROL_CENTER_MIGRATION_BUNDLE_V0.1.0.json`: portable metadata-only migration contract.
- `SMARTER_ECOSYSTEM_CONTROL_CENTER_HANDOFF_V0.1.0.json`: exact standalone artifact handoff record.

## Standalone command center
- Created and exact-tested the separate `smarter-ecosystem-control-center-v0.1.0.zip` repository outside the Smarter Justice package.
- The starter includes owner/staff token authentication, least-privilege update rules, four seeded sectors, immutable artifact identity, activation-gate tracking, audit history, and JSON export.

## Professional directory
- `data/threeMarketProfileSeedsV1722.js`: Northern Metro New Jersey-led 12-professional, 2-firm, 12-link batch.
- `lib/professionalMarketplace.js`: merges v1.7.22 seed records and exposes current batch accountability.
- `PROFILE_GROWTH_REPORT_V1.7.22.json`: batch and cumulative metrics.
- Reconciled cumulative directory regression expectations to 89 public records and 86 strict qualifying profiles.

## Release governance
- Added four v1.7.22 regression parts, bringing the complete suite to 42 parts.
- Updated package, lockfile, server, manifest, SBOM, release, audit, change, no-change, continuation, README, release notes, and active queue records.
