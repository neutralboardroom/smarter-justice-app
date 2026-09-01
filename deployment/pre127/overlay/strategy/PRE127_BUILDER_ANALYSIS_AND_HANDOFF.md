# PRE127 builder analysis and handoff

## Release identity

- Product: Smarter Justice only
- Release: v2.0.0-pre127
- Exact reconstructed predecessor release: v2.0.0-pre126
- Local predecessor commit: `c31b139fb5e08b08faf8074b96d0e9a723974045`
- Production predecessor commit: `55a7fd1c13353a5c045e72a20cf08a1ce54c208c`
- Shared predecessor Git tree: `8d62a223cdb8e1f61e37fbef467e3f38e9109159`
- Last-known-good PRE125 rollback commit: `2e4b90c083c469bc0e055747258fc9521eed06b2`
- Production domain: `https://smarterjustice.com`
- Render service: `srv-d8ps9jgjs32c73918vvg`
- Render deployment preceding PRE127: `dep-dabj73142hec73fq0sfg`

PRE127 must reconstruct PRE126, verify unchanged-file hashes, apply a hash-bound overlay, run targeted and inherited security/deployment tests, generate a deterministic SBOM, and only then become a release candidate.

## Why this release exists

PRE126 explained the hyperlocal legal-community concept. PRE127 answers the harder question: what does a lawyer actually use after joining?

The central implementation is a working professional community home for Downtown Brooklyn / Civic Center. It brings the current source-linked feed, a practice focus, durable preferences, local reference sources, first-value actions, and a manual LinkedIn share kit into one product surface.

## Implemented file map

| Area | Files | Responsibility |
|---|---|---|
| Program data | `data/legalCommunityProgramPre127.js` | Positioning, exact offer, practice taxonomy, edition, signals, resources, publishing policy |
| Public program API | `lib/legalCommunityProgramPre127.js` | Merge and filter signals, expose membership, build member preview and share kit |
| Signed-in preferences | `lib/legalCommunityMembershipPre127.js` | Schema-v2 geography/practice preferences using the existing durable store key |
| Member UI | `public/professional-community.html`, `public/es/comunidad-profesional.html` | Working English/Spanish community home shell |
| Browser behavior | `public/pre127-community.js` | Hydration, practice filters, signed-in preference save, source dates, manual sharing |
| Presentation | `public/pre127-community.css` | Extension of the existing visual system; no homepage redesign |
| Conversion surfaces | Professional tour and membership pages in English/Spanish | New pitch, unchanged prices, founding label, explicit boundaries |
| Public discovery | Community index, Downtown Brooklyn page, current brief | Clear path into member home and human-controlled LinkedIn sharing |
| Governance | Publishing standard, source-currentness evidence, decision log | Builder and editorial constraints |

## API contract

### Public

- `GET /api/public/legal-communities`
- `GET /api/public/legal-community-membership`
- `GET /api/public/legal-communities/:id`
- `GET /api/public/legal-communities/:id/today`
- `GET /api/public/legal-communities/:id/member-preview?practice=<id>`
- `GET /api/public/legal-communities/:id/share-kit`

Repeated `practice` parameters are supported. Unknown practice values are ignored. Expired signals fail closed.

### Signed-in professional

- `GET /api/professional/legal-community-preferences`
- `POST /api/professional/legal-community-preferences`

Schema v2 adds `practiceAreaIds` while preserving the PRE126 store key and older geography data. The POST continues to require professional authentication and the application's existing CSRF protection. It stores no private user matter.

## Data and trust boundaries

The member preview is intentionally public. It lets a prospective member inspect recurring value without pretending that an account or payment already exists. Saving preferences requires authentication.

The feed is not personalized from public-user behavior. The only inputs are explicit professional selections. The source-linked pages are informational summaries, not case instructions or legal advice.

Public directory counts come from the existing read-only professional snapshot. A postal-code match is not membership, current office proof, verification, availability, or recommendation.

## Commercial boundary

The release preserves the exact listed amounts from PRE126. It changes positioning and founding labels. It does not change Stripe products, price objects, coupons, payment links, API keys, webhook secrets, provider selection, environment variables, or live billing readiness.

Do not interpret a signup click, account creation, checkout creation, or membership selection as accepted payment. Existing server-side billing activation rules remain authoritative.

## Editorial boundary

Every current item must retain its direct responsible source and date controls. The edition's review boundary is September 8, 2026. Time-sensitive items also expire. The target cadence is weekly only when qualified content exists. A later builder must not silently extend dates or republish old copy merely to keep the page populated.

Manual LinkedIn sharing is implemented as copy/open controls. It does not use LinkedIn credentials, post automatically, enumerate contacts, or send messages.

## Founder-story boundary

Roger owns the hyperlocal community idea. The founder-supplied Justice Truck origin account may state the Downtown Brooklyn courthouse context, Rock and Hammer Tax Services, mobile tax-truck offices, and 26 Court Street. It may not infer a launch date, institutional relationship, court endorsement, or partnership.

## Known operational facts and limitations

1. PRE126 was produced through a layered deterministic reconstruction chain. Reusing an inherited `.runtime` directory first exposed an older marker inconsistency and later a workspace-synchronizer race that could create `.rsync-tmp` while a generated runtime was being deleted. The generated runtime was moved aside recoverably, PRE126 was reconstructed fresh, and the direct PRE126 bootstrap passed. PRE126 and PRE127 reconstruction now build in an off-workspace staging directory and atomically swap the generated target, so a synchronizer cannot populate a half-built release directory. Qualification still treats `.runtime` as disposable output rather than source authority.
2. The local PRE126 commit and remote production PRE126 commit differ because the remote commit was created through the connected repository workflow; their Git tree is identical. PRE127 receipts track both identities and the shared tree.
3. The production readiness endpoint can remain non-ready for protected owner, durable-storage, email, or legal-approval blockers even when the public web service is live and healthy. Do not falsify those blockers.
4. A prior production OpenAI synthetic check received a provider-rate response while the deterministic fallback remained available. PRE127 does not change OpenAI provider or environment configuration.
5. Candidate communities are research items only. No second community is launched or promised here.

## Required qualification

Before promotion, require all of the following:

1. Overlay inventory and SHA-256 match.
2. Exact PRE126 predecessor marker and identity checks.
3. Hash equality for every unchanged PRE126 file.
4. PRE127 program and preference tests.
5. Retained security regression suites.
6. Deployment-kit validation and deployment doctor.
7. Deterministic SPDX SBOM.
8. Public-copy guard for internal release/control language.
9. Homepage preservation assertions.
10. Price and no-Stripe-mutation assertions.
11. Local HTTP checks for both member pages, community page, brief, APIs, authentication boundary, and sitemap.
12. Clean-clone reconstruction and qualification from the exact candidate commit.
13. Repository production-qualification gates.
14. Artifact integrity, duplicate-entry, and reconstruction verification.
15. Exact-commit Render deployment followed by live, route, API, source-link, sitemap, and critical-page checks.

## Rollback

PRE127 should roll back first to the exact PRE126 production commit. PRE125 remains the independently documented last-known-good point below PRE126. Rollback must not mutate Stripe or provider configuration. Confirm the Render deployment points at the intended Git commit before calling rollback complete.

## Builder analysis prompts

- Is the community home useful with zero client opportunities in the period?
- Are practice filters improving relevance, or merely hiding broadly useful items?
- Which editorial sources can be monitored sustainably by humans?
- Are the first-value steps observable without recording sensitive data?
- Does founding language create expectations that checkout and terms do not yet support?
- Is the next proposed geography a real legal ecosystem or just a marketing boundary?
- Can every published source relationship be described without implying endorsement?
- Are stale content and unavailable-source states visible, testable, and fail-closed?
