# Smarter Justice Deployment Runbook — v1.7.73

State: **prepared locally; provider binding and exact production authorization pending**.

1. Run `npm run deployment:doctor` and resolve only the first protected action it reports.
2. Bind the exact GitHub repository, commit/tree, Render workspace/service, canonical domain, and secret **presence states** without recording values.
3. Run `npm ci`, `npm test`, `npm run sbom`, and `npm run deployment:validate` from the exact commit.
4. Classify migrations, disk state, last-known-good, and rollback eligibility before promotion.
5. After Roger's exact product-scoped deploy command, select the fastest eligible File 4 mode and capture the GitHub run and Render deploy IDs.
6. Wait through the provider health window, verify `/livez`, `/readyz`, canonical HTTPS, exact version/commit, bounded smoke routes, database/migrations, monitoring, support, and hard 404.
7. Review phone and desktop production screenshots. Record `PRODUCTION DEPLOYED — POST-DEPLOY VERIFIED` only after every required item passes.
8. Preserve the previous healthy service during pre-cutover failures. Roll back only to a distinct verified eligible target.

Never place secret values in repository files, logs, evidence, or chat.
