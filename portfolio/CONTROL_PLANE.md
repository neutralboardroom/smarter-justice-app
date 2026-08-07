# Smarter Justice Portfolio Control Plane

## Purpose

Smarter Justice is the central portfolio coordinator for Smarter Justice itself and all legal micro-portals. Each product remains independently branded, versioned, deployable, and rollback-capable, while portfolio-wide authority, integration state, deployment evidence, live-audit findings, and shared-service boundaries are coordinated centrally.

## Owner-operating rule

The builder is the technical operator. Roger should not be required to perform routine repository, build, test, provider, DNS, configuration, migration, deployment, verification, retry, cache, promotion, rollback, or live-audit work when an authorized technical capability can perform it.

Escalate to Roger only for irreducible human actions such as MFA/passkey, granting missing account access, entering a missing secret directly into a trusted provider, billing/terms/purchase approval, ownership/identity verification, destructive/irreversible approval, or a genuine business/legal decision that cannot safely be inferred.

## Authority hierarchy

1. Current explicit owner direction.
2. Newest valid Universal Smarter Justice and All Legal Micro-Portals One-Step Builder packet.
3. Product-specific exact qualified artifact and release evidence.
4. Current verified provider/repository/domain/deployment evidence.
5. This control-plane registry and derived operational state.

The registry never overrides newer authoritative evidence. It must be corrected when stronger evidence is obtained.

## Product boundaries

Every product keeps its own:

- product ID and brand;
- canonical domain;
- repository when applicable;
- exact source artifact;
- semantic version/release history;
- qualification evidence;
- provider target;
- environment and data boundary;
- production identity;
- rollback state.

Do not mix artifacts, environments, secrets, domains, databases, repositories, or deployment evidence across products.

## Central shared capabilities

Where the architecture assigns them to Smarter Justice, coordinate centrally rather than duplicating them in each portal:

- portfolio registry and product discovery;
- shared account/authentication handoff;
- shared Stripe/payment architecture;
- professional claim/onboarding coordination;
- professional identity/source evidence and correction/suppression propagation;
- cross-portal routing/referrals;
- shared AI gateway/control boundaries where authorized;
- portfolio audit evidence;
- portfolio-wide UX/bilingual/nationwide/plain-language standards;
- deployment-state and rollback visibility;
- owner control/status reporting.

A portal may maintain local UX and portal-specific workflows while consuming or handing off to shared services.

## Current V43 public-product standards

### Nationwide

Every applicable public legal product must provide a meaningful usable entry path for all 50 states plus the District of Columbia now. New York State and New York City remain the deepest first-completion priority, while every ordinary material release should measurably advance non-New-York jurisdiction depth. Never fabricate state law, forms, deadlines, resources, or professional availability.

### English / Espanol

For products supporting English and Spanish, the language control belongs on every applicable public human-facing route, not only the homepage. Preserve route context, locale choice, mobile access and keyboard access where practical. Do not claim full parity until the audited routes support it.

### Plain language

Customer-facing UI should use language ordinary people can understand. Internal release, governance, deployment, migration, adapter, gate, evidence-tier, engineering, or control-plane terminology must not leak onto public pages unless the user genuinely needs it and it is explained plainly.

### UX learning

Estate Law Aid is the current proven portfolio UX baseline, not a permanent template or ceiling. Continuously compare live products. Adopt and propagate a pattern only when it produces a concrete user benefit, while preserving each product's branding, subject matter, safety requirements and stronger existing functionality.

## Release state machine

For one product at a time:

1. Resolve exact current product artifact and authority.
2. Resolve repository/provider/domain/live identity.
3. Audit live product and compare with source.
4. Build only justified improvements.
5. Run exact qualification and deterministic packaging when source changes.
6. Perform provider-equivalent preflight.
7. Freeze the exact deployable commit/artifact.
8. Capture current live identity and rollback target.
9. Deploy through an authorized provider path.
10. Verify uncached production independently.
11. Record exact deployed version/commit/artifact and critical-path evidence.
12. Update the central registry.
13. Recheck cross-portal integration and transferable portfolio findings.

Provider acceptance alone is not deployment verification.

## Integration acceptance

A portal is not `FULLY_INTEGRATED` merely because its domain responds. Verify applicable:

- canonical domain and HTTPS;
- correct current product identity/version;
- public navigation and core tasks;
- nationwide entry path;
- English/Espanol behavior and truthful parity state;
- plain-language customer copy;
- professional directory/profile behavior;
- claim/onboarding handoff;
- authentication/account handoff;
- Stripe/payment boundary;
- central routing/cross-portal referrals;
- correction/suppression propagation;
- privacy/safety/legal disclaimers;
- closed-by-design capabilities remaining closed;
- mobile/accessibility basics;
- live error/404 behavior;
- rollback path.

Unsupported or unverified integrations must remain visibly `PARTIAL`, `CLOSED`, or `UNKNOWN` rather than being inferred complete.

## Deployment policy

Prefer exact qualified artifact deployment. If production requires a carrier/bootstrap layer, that carrier must verify the exact artifact hash/version before extraction and must not silently mutate application behavior after qualification. Existing runtime overlays should be migrated into the authoritative product source or explicitly qualified against the exact target so deployed runtime and qualified source do not drift.

No blind retry loops. Diagnose the failure class, correct the cause, re-preflight, refreeze if required, and then retry.

Rollback a material production regression when it cannot be corrected safely and quickly. Do not sacrifice newer user/data activity during rollback.

## Central reporting

The control plane should be able to answer, for each product:

- What is the newest qualified version?
- What version/commit is actually live?
- What domain and provider serve it?
- Is the source-to-live identity proven?
- What integrations are verified?
- Is nationwide availability real?
- Is bilingual control global and parity complete/partial?
- Are customer-facing language defects known?
- What profile counts and verification state are current?
- What live UX defects remain?
- What is the last known-good rollback target?
- What owner-only action, if any, is currently required?

## No-drift principle

Central coordination must make the portfolio easier to operate without forcing products to become identical. Preserve independent brands and superior product-specific behavior. Standardize evidence, integration contracts, deployment safety, public quality expectations and owner-action minimization—not superficial sameness.
