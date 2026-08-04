# Smarter Justice v1.7.46 Change Map

## Backend

- `lib/launchActivation.js`: launch plan, deduplicated blockers, evidence, rehearsals, issues, and Markdown export.
- `lib/store.js`: persistent `launchActivation.json` state.
- `server.js`: protected owner launch-activation read, export, plan, evidence, rehearsal, and issue routes; v1.7.46 health identity.
- Current portfolio modules and release pointers reconciled to v1.7.46.

## Owner experience

- `public/launch-activation.html`
- `public/launch-activation.js`
- Control Center navigation to Initial Launch Activation.
- Workbench evidence is intentionally non-activating and cannot deploy or open gates.

## Attorney and firm experience

- `public/attorney-launch.html`
- `public/attorney-launch.js`
- Three initial portal choices, free profile-control explanation, campaign reference validation, central account path, and scope boundaries.

## Public experience

- Homepage and professional membership refocused on legal-only initial launch.
- Exact unapproved paid prices and discounts removed from active presentation.
- Legacy active Founding Profile Pilot claims removed from launch-facing pages.
- Canonical, brand, mobile, accessibility-preparation, sitemap, noindex, and private-page protections preserved.

## Tests and evidence

- Added `tests/launch-activation-v1746.test.js`.
- Official suite increased to 101 parts: 100 dependency-independent plus one PostgreSQL-dependent part.
- Current release, deployment, manifest, SBOM, registry, continuation, launch, and improvement records updated.

## Explicit non-changes

No micro-portal repository was changed. No live portal was connected. No automatic portal write, profile publication, payment, Sponsored placement, case opportunity, review, appointment, confidential upload, external AI, or deployment gate was opened.
