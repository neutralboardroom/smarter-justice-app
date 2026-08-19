# ROGER RULE — Adaptive Deployment Innovation and Owner-Minimal Execution

**Authority:** Permanent Roger Rule / owner-level authority  
**Applies to:** Smarter Justice and every future Smarter Justice build, builder, successor version, deployment workflow, release packet, deployment handoff, hosting transition, source-control transition, staging/production cutover, rollback, and recovery operation.  
**Effective:** 2026-08-18  

## Permanent rule

Deployment methods are allowed and expected to evolve. No successful deployment procedure becomes a frozen permanent recipe merely because it worked once.

Every current and future Smarter Justice builder must continually **inspect, learn, adapt, create, innovate, and improve the deployment method** appropriate to the tools, provider capabilities, permissions, source-control state, artifact architecture, CI/CD options, hosting environment, security requirements, and operational risks that actually exist at the time of that deployment.

The objective is the **safest, most reliable, lowest-friction, least owner-burdensome deployment path reasonably available at that time**, while preserving exact-artifact integrity, security, evidence, reversibility, no-loss/no-drift, and explicit production authorization.

## Owner-minimal deployment requirement

Builders must do the maximum reasonable deployment work themselves through authorized connected tools and qualified deployment mechanisms. Roger should be asked to perform only the smallest genuinely unavoidable human/account action, such as an account-level confirmation, credential entry that must remain private, or a provider UI action that connected tools cannot perform.

Do not turn deployment into a long owner-operated technical procedure when the builder can safely do the work. Do not ask Roger to repeatedly move files, edit code, copy secrets, perform shell commands, or navigate multiple provider screens merely because an older builder did so.

When a manual owner step is unavoidable:

1. Prepare everything possible before asking Roger to act.
2. Give one clear step at a time.
3. Minimize the amount Roger must type, upload, select, or change.
4. Never request passwords, MFA secrets/codes, recovery codes, API keys, payment secrets, or other protected credentials in chat.
5. Resume builder-led execution and verification immediately after the owner completes the unavoidable step.

## Adaptation and innovation requirement

Before each material deployment, builders must assess the current environment rather than assuming the prior workflow is still best. Consider, where qualified and authorized, improvements such as:

- direct connected GitHub/source-control writes;
- protected release or deployment branches;
- exact carrier/artifact deployment;
- provider-native deployment APIs or connected deployment tools;
- GitHub Actions or other CI/CD release automation;
- staging/preview qualification before production cutover;
- checksum-locked artifact handoff;
- automated post-deploy health, route, link, auth, API, and visual checks;
- safer rollback and database-preservation mechanisms;
- deployment receipts that identify exact source commit, artifact SHA-256, provider deployment, and rollback predecessor.

These are examples, not a fixed required stack. If better tools or methods become available, future builders must use their judgment to improve the deployment process rather than preserve obsolete friction.

## Current successful pattern is evidence, not a permanent recipe

The PRE96/PRE97-era deployment demonstrated that Smarter Justice can be deployed with very little owner work: the builder performed nearly all preparation, qualification, source/deployment coordination, and verification, while Roger only needed a very small GitHub file-add/upload assist that the connected tools could not complete at that moment.

Future builders should treat that as strong evidence in favor of a **builder-led, owner-minimal GitHub + hosting-provider deployment approach** when the current environment still supports it. However, they must not blindly reproduce that exact manual step if tooling changes. If a connected tool can later perform the GitHub action directly, the builder should eliminate the owner step. If the hosting/source architecture changes, adapt the process accordingly.

## Non-negotiable deployment safeguards

Innovation does not authorize unsafe shortcuts. Every material deployment must still preserve:

- explicit Roger authorization before production mutation/cutover;
- exact predecessor and successor identity, hashes, and source-control provenance;
- preservation of working product functionality and data;
- protected secrets and credential boundaries;
- database safety and migration/recovery awareness;
- qualification before cutover and post-deploy verification after cutover;
- reliable rollback to the last accepted working release;
- evidence receipts for what was deployed, where, when, and from what exact artifact/source state;
- no fabrication of deployment success or live status.

## Continuous-learning requirement

After a materially new or improved deployment method succeeds or fails, the builder must preserve the useful lesson in the next release/builder handoff. Time-sensitive deployment instructions should be clearly dated and separated from permanent Roger Rules so later builders can distinguish **durable principles** from a **current method that may become obsolete**.

Only Roger may explicitly weaken, revoke, or replace this Roger Rule.
