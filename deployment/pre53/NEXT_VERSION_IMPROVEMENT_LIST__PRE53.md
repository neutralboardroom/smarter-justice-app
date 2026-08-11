# Smarter Justice pre53 — Next Version Improvement List

## Highest priority
1. After successful pre53 cutover, record exact Render/public release identity, mobile browser behavior, attorney-demo behavior, Navigator/OpenAI behavior, hidden unfinished-route status, and rollback readiness as immutable postdeployment evidence.
2. Add first-class Render deploy-status polling through the Render API or CLI when a protected API credential/service identifier is intentionally configured; never expose the credential in repository or release artifacts.
3. Continue production-grade PostgreSQL/RLS persistence qualification, backup/snapshot evidence, and tested restore-path work before enabling server-persistent sensitive customer data broadly.
4. Add continuity fingerprints/count checks around state-changing migrations without exporting private row contents into CI artifacts.
5. Continue official-source jurisdiction expansion for attorney marketing rules with fail-closed currentness and human review for stale, missing, conflicting, or uncertain rules.
6. Continue live phone/laptop accessibility, responsive, performance, security, attorney-value, public-language, competitor, and conversion audits; make changes only when they add measurable value.

## Deployment continuity
- Full regression qualification belongs in build/CI before deployment, not in the production start path before the web server binds.
- Production startup may run only fast fail-closed checks that are necessary to protect data/runtime identity before binding to `$PORT`.
- Provider-specific cutover windows and rollback checks must be based on current official deployment-provider behavior and actual accepted-live evidence.
- Never declare a release live from a deploy-hook response alone; require exact live release identity and full public acceptance.

## Preserved future work
All worthwhile pre52/J40 future work remains active unless explicitly superseded. No unfinished capability becomes public merely because deployment plumbing improves.
