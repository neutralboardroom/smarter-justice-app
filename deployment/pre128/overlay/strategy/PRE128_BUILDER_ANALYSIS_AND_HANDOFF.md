# PRE128 Builder Analysis and Handoff

## What this release fixes

PRE127 established the hyperlocal community concept but represented several future benefits too strongly. Production reconciliation on September 3, 2026 found zero professional accounts, zero appointments, zero opportunities, zero professional-network seats or entitlements, no Stripe price IDs, and unavailable transactional email. A public provider endpoint exposed raw configuration flags, legacy endpoints exposed the retired micro-portal topology, public HTML depended on client-side copy scrubbers, and the community settings browser code always posted an empty participating-community list.

PRE128 fixes those problems without redesigning the established homepage or replacing the monolith.

## Implemented architecture

1. `legalCommunityProgramPre128` is the single public community and membership presentation layer. It normalizes PRE127 data into plain-language availability states and omits unpublished candidate communities.
2. `legalCommunityMembershipPre128` upgrades the shared durable preference record to v3. It updates only fields present in the request, rejects unpublished community IDs, and preserves unrelated values.
3. `community-experience.js` renders the free professional preview and no longer calls internal provider-readiness flags or clears a hidden participating-community field.
4. Server public endpoints return customer-appropriate status. Raw configuration, environment, commit, and control-plane reasons are reserved for protected administration and release evidence.
5. PRE128 production registration, applications, membership-interest collection, enrollment, checkout, confirmation, and paid professional activation are release-gated closed even if SMTP or Stripe variables appear later. The public registration page collects nothing while paused. Reopening requires a successor release and new acceptance evidence, not an environment-only change.
6. Public HTML is materialized at build time. Runtime copy mutation and MutationObserver scrubbers are removed.
7. Legacy public portal pages redirect one hop to an exact successor when one exists. Legacy topology APIs return a gone response with current links. Internal compatibility models remain available only where inherited operation still needs them.
8. Release-numbered public asset names and identifiers are deterministically aliased to neutral client assets during the build. The mapping is retained in release evidence.
9. Sitemap generation includes only canonical public pages selected by the route manifest and excludes protected, redirected, duplicate, obsolete, or unfinished routes.
10. Direct owner pages and authenticated professional dashboard, firm-operations, and currentness workspaces redirect to the correct sign-in boundary before static content is served. Their APIs retain independent authorization checks.
11. The exact inherited PRE120 carrier occasionally reports a transient file count while the workspace filesystem is still converging after extraction. PRE128 retries the full hash-pinned predecessor reconstruction up to six times, with increasing short waits, and never changes or bypasses the required count or archive hash.
12. Qualification performs a high-confidence static scan for private keys and common live-token formats. It excludes the public-source Profile Factory corpus, reports only redacted finding metadata, and fails the build if a match is found.
13. The reproducible candidate hash covers runtime and public product files. Eleven inherited PRE121–PRE127 build markers and completion receipts are retained for lineage but excluded from that hash because their only cross-build differences are regeneration timestamps; the build manifest names every exclusion and reason.

## Identity and field ownership

| Fact | Authority | Paid effect |
|---|---|---|
| Person or firm identity | source evidence plus authorized review | none |
| License or credential | licensing authority evidence | none |
| Office | public source or authorized professional confirmation | none |
| Home community | professional preference among published communities | none |
| Participating communities | separate professional choices among published communities | none |
| Service area | professional-supplied statement subject to law and engagement | none |
| Membership | accepted plan plus verified billing lifecycle | creates only stated entitlements |
| Organic ordering | neutral public-search rules | none |
| Sponsored placement | separate clearly labeled advertising state | may affect only labeled ad inventory |

## Price authority

The current owner-approved and database-supported planned amounts are $10/$100, $29/$290, and $49/$490. No Stripe Price IDs exist, so checkout remains closed. The older $12/$120 and $15 artifacts are not authoritative offers. The release never rewrites a live provider price and never converts the planned catalog into an active sale.

## Evidence interpretation

The 66-artifact evidence directory contains executed build/test facts and precise `NOT_APPLICABLE` or `BLOCKED` records. “Blocked” for paid commerce does not make the public truth cleanup unsafe; it means paid activation remains unavailable. No record names the builder as an independent reviewer.

## Re-entry conditions

Paid enrollment can be reconsidered only after:

- reliable transactional email, bounce handling, and recovery evidence;
- exact Stripe product/price mapping in the intended account and mode;
- webhook authenticity and idempotent entitlement lifecycle tests;
- plan/benefit/terms/invoice/renewal/cancellation/refund reconciliation;
- representative post-entitlement first-use and recurring-value proof;
- support and incident ownership;
- accessibility and bilingual purchase-path review;
- owner and any required legal/ethics acceptance.

Candidate communities can be published only after each has current primary/responsible sources, a clear non-governmental organizing boundary, operating capacity, recurring content, bilingual handling, corrections, and a no-fabrication acceptance review.

## Rollback

The exact rollback source is Git commit `a746c2d689c03ba713d9d31dd952bc9fd2137dbb`, tree `966152d3e62f4a4df45dcfb7241f3a444a90f97d`, Render deploy `dep-dabkqv2d0e5s739nr860`. The PRE128 build mutates no database schema, Stripe resource, environment variable, or external micro-portal. Rollback is application-only.

## Release-state discipline

Source qualification, Git publication, Render deployment, and live verification are separate facts. The source completion receipt intentionally says not deployed. A post-deployment receipt must name the exact Git commit, Render deployment ID, runtime version, artifact hash, tested canonical URLs, and rollback target. If any of those identities disagree, the candidate is not the live qualified successor.
