# PRE127 implementation notes

## Outcome

PRE127 makes the Downtown Brooklyn / Civic Center legal community a working professional experience while preserving the existing public homepage and visual system.

## User-visible work

- Added `/professional-community.html` and `/es/comunidad-profesional.html`.
- Added current source-linked professional signals and local reference links.
- Added professional-selected practice filters and signed-in saved preferences.
- Added a five-step first-value path.
- Added copy-ready LinkedIn text and manual share controls to the brief and member home.
- Updated professional tour, membership, community index, Downtown Brooklyn, and brief surfaces.
- Updated English and Spanish pricing presentation to founding launch labels without changing amounts.
- Added an explicit statement that price protection exists only if the exact checkout and terms say so.

## Intentionally unchanged

- Public homepage first viewport and primary task flow.
- Existing Smarter Justice logo, core styling, and visual system.
- Free factual profile and correction access.
- Existing professional account and billing activation authority.
- Stripe catalog, prices, coupons, payment links, keys, webhooks, and environment configuration.
- Provider configuration and protected readiness blockers.
- Profile evidence, credential, verification, organic relevance, and professional-responsibility boundaries.

## Not implemented

- Automatic LinkedIn posting or direct messaging.
- Contact scraping or use of a network connection as marketing consent.
- Private-matter or individual-demand personalization.
- Aggregate demand intelligence.
- A second active legal community.
- Guaranteed clients, referrals, rankings, or results.
- Binding grandfathered pricing.
- A new Stripe product or checkout configuration.

## Source-review snapshot

The September 1 edition uses ten unique responsible-source pages. The working summaries intentionally avoid case-specific advice and tell lawyers to confirm complete current rules, source pages, and case-specific direction.

The edition review boundary is September 8, 2026. Builders must review or expire items; they must not change a date merely to keep content looking current.

## Release engineering note

An inherited generated `.runtime` directory initially produced a predecessor unchanged-file mismatch. It was moved aside recoverably and PRE126 was reconstructed fresh. A later repeat exposed a workspace-synchronizer race: a temporary `.rsync-tmp` directory could appear while a generated runtime was being replaced. The builders therefore copy into a private staging directory and atomically swap the target directory.

The first PRE127 Render promotion attempt then exposed a second filesystem boundary: Render mounts `/tmp` separately from the checked-out repository, so a rename from `/tmp` into `.runtime` failed with `EXDEV`. PRE126 remained live. The PRE126 and PRE127 builders now place both staging and retired directories beside their `.runtime` targets. This preserves the atomic swap while guaranteeing that the rename stays on one filesystem. See `release-evidence/PRE127_RENDER_DEPLOYMENT_INCIDENT.md` for the exact incident and prevention record.

PRE127 treats `.runtime` as generated output and relies on tracked predecessor scripts, overlay hashes, receipts, repeat reconstruction, clean-clone qualification, production-style omit-development-dependency reconstruction, and exact-commit Render verification for authority.
