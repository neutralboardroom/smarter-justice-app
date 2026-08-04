# Portfolio Installation Sequence

Install the universal pipeline without disrupting live products.

## Phase 1 — Central workflow qualification

1. Keep all work on `ops/universal-safe-deployment-v1`.
2. Validate reusable workflow syntax, permissions, exact-SHA pinning, and fail-closed behavior.
3. Keep existing production workflows unchanged until the replacement passes.
4. Do not add production secrets to source, ZIPs, logs, issues, or chats.

## Phase 2 — Smarter Justice pilot

1. Complete full English/Spanish implementation and evidence.
2. Confirm managed persistent database and durable document storage.
3. Prove backup restoration and migration rehearsal using non-production data.
4. Configure the GitHub `production` environment:
   - variable `PUBLIC_BASE_URL`
   - secret `RENDER_DEPLOY_HOOK_URL`
5. Run qualification on an exact candidate commit.
6. Deploy the exact same commit to a non-production Render service first.
7. Verify health, authentication, saved work, document access, case status, English/Spanish journeys, emails, and closed-sensitive defaults.
8. Promote only after independent acceptance.

## Phase 3 — Portal rollout

For each portal, in truthful readiness order:

1. Verify latest exact product ZIP and repository source match.
2. Add `deployment/product-deployment.json`.
3. Add version-pinned qualification and production caller workflows.
4. Implement missing Spanish and data-continuity tests.
5. Configure a separate GitHub production environment and Render deploy hook.
6. Qualify without deploying.
7. Deploy to staging and verify.
8. Enable production only after rollback and owner-rule evidence exists.
9. Update the central portfolio deployment register.

## Owner interaction

Roger Gillman requests deployment in the Smarter Justice master builder chat. The master chat resolves the exact qualified release and invokes the corresponding repository workflow. Ordinary deployment should not require Roger to copy source files, visit each worker chat, or press Render deployment buttons after the one-time secure service connection is complete.
