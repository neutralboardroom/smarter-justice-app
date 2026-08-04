# v1.7.29 Change Map

## Legal-only Control Center

- Added `data/legalPortalCommandCenterV1729.js` and `lib/legalPortalWorkspace.js`.
- Updated `lib/controlCenter.js`, `server.js`, `public/control-center.html`, and `public/app.js`.
- Converted `lib/ecosystemWorkspace.js` into a deprecated legal-only compatibility adapter.
- Added owner routes for legal-portal command, workspace, export, portal updates, registry controls, and safe import validation.

## Registry controls

- Added `lib/crossPortalRegistryControls.js`.
- Added portable `CROSS_PORTAL_REGISTRY_CONTROLS_V1.7.29.json` and `LEGAL_PORTAL_CONTROL_CENTER_V1.7.29.json`.
- Preserved historical v1.7.28 learning artifacts and deprecated the legacy multi-sector control-center record without deleting its identity.

## Professional profiles

- Added `data/sixRegionProfileSeedsV1729.js`.
- Updated `lib/professionalMarketplace.js` to seed 36 attorneys, one firm, source enrichments, and 36 links.
- Added `PROFILE_GROWTH_REPORT_V1.7.29.json`.

## Current release truth

- Updated package, lockfile, server version, README, release notes, SBOM, portal manifest, release snapshot, capability matrix, AI-readable summary, llms summary, environment example, Render deployment guide, active build queue, watchlist, and next-version list.

## Regression coverage

- Added five v1.7.29 regression parts and updated compatibility/current-governance checks for a 70-part suite.
