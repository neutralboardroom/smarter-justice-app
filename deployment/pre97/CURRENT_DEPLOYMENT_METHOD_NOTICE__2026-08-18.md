# CURRENT DEPLOYMENT METHOD NOTICE — What Future Builders Should Try First *At This Time*

**Dated:** 2026-08-18  
**Status:** Time-sensitive operational guidance, not a frozen permanent recipe.  
**Permanent authority:** Read `governance/current/ROGER_RULE_ADAPTIVE_DEPLOYMENT_INNOVATION_AND_OWNER_MINIMAL_EXECUTION.md` first.

## What worked well recently

The recent Smarter Justice PRE96 production deployment was completed with **very little owner work**. The builder handled nearly all of the deployment preparation, qualification, source/deployment coordination, Render checks, and post-cutover verification. Roger only needed to help with a **small GitHub file-add/upload step** that could not be completed automatically with the connected tool available at that moment.

That low-friction division of labor worked well and should be the starting model for the next deployment **if the current GitHub/Render/tooling environment is still materially the same**.

## What the next builder should try first right now

1. Inspect the current exact accepted Smarter Justice artifact, GitHub repository/branch state, Render service state, database state, deployment settings, and available connected tools before asking Roger to do anything.
2. Do the maximum reasonable preparation and qualification yourself.
3. Prefer an exact-artifact/source-controlled deployment with checksum and predecessor identity preserved.
4. Use connected GitHub and Render capabilities directly wherever they can safely perform the needed action.
5. If the same narrow GitHub limitation still exists, prepare the exact file/content and ask Roger only for the **smallest required GitHub add/upload action**, one step at a time.
6. Immediately resume builder-led work after that action: verify source identity, trigger or control the deployment as authorized, watch provider status, inspect health/logs/metrics, and perform real-domain post-deploy checks.
7. Keep the previous accepted production release available for rollback until the new release is verified.

## Do not overfit to this notice

This notice is deliberately dated because deployment capabilities will change. A future builder should **improve on this method whenever a safer or easier path is available**. For example, if connected GitHub tools can directly perform the file/source action later, do not make Roger do it manually. If Render, GitHub Actions, artifact storage, or the deployment architecture changes, design the best current workflow instead.

The goal is not to reproduce PRE96 button-for-button. The goal is to reproduce and improve the successful principle: **builder-led, owner-minimal, exact, verified, reversible deployment.**

## Required deployment evidence

At minimum preserve the exact deployed source/artifact identity, SHA-256 where applicable, GitHub commit/branch or equivalent source reference, provider deployment ID/status, database safety state, qualification results, post-deploy health/route/auth checks, and rollback predecessor.

Never claim a deployment is live merely because files were prepared or CI passed. Verify the actual production service after cutover.
