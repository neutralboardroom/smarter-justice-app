# Smarter Justice v1.7.44 Change Map

## Runtime

- Added `lib/professionalPromotionProgram.js`.
- Updated `lib/professionalMarketplace.js` to enforce paid-growth eligibility and Sponsored labeling without changing organic ordering.
- Updated `lib/launchCommandCenter.js` with separate free-profile, paid-membership, and paid-growth gates.
- Updated `lib/legalPortfolioOperatingSystem.js` with current owner decisions and gates.
- Removed active `lib/foundingProfilePilot.js` and its runtime storage.
- Updated `server.js` with public, professional, and owner professional-growth APIs.

## User experience

- Updated professional public profile disclosures.
- Updated the professional dashboard to state that basic profile control is free and paid growth is optional.
- Replaced the owner Founding Profile Pilot workspace with legal/commercial paid-growth controls.

## Evidence and tests

- Added `LEGAL_COMPLIANCE_STANDARD_V1.7.44.md` and `LEGAL_COMPLIANCE_REGISTER_V1.7.44.json`.
- Replaced the v1.7.43 pilot test with `tests/free-profile-paid-growth-v1744.test.js`.
- Updated current release, environment, registry, launch, dashboard, continuation, and improvement records.
