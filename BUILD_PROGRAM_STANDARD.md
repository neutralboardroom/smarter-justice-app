# Smarter Justice Build Program Standard

Version: 1.1.0  
Effective: July 27, 2026

## Purpose

Every Smarter Justice platform and focused micro-portal must preserve a visible, versioned record of what was proposed, approved, planned, started, code-complete, tested, exact-artifact-tested, staged, deployed, live-verified, operationally accepted, pilot-approved, broad-launch-approved, blocked, paused, deferred, rejected, superseded, rolled back, deprecated, or determined not applicable.

## Required linked lists

1. Cross-Portal Master Build Library.
2. Portal-Specific Build List.
3. Current Release Build Plan.
4. Launch Readiness and Evidence Register.
5. Bugs, Risks, Blockers, and Technical Debt Register.
6. Decisions, Deferrals, Supersessions, and No-Change Register.
7. Live Operations and Release History.

## Required item fields

Each material item should have a stable ID, portal, type, title, description, priority, category, target release, lifecycle status, user types benefited, problem, expected benefit, dependencies, external dependencies, privacy/security/legal implications, acceptance criteria, required tests, test results, evidence, blockers, owner decision, Git commit, ZIP, checksum, deployment evidence, rollback, creation date, and update date.

## Status separation

Do not collapse these states:

- Code complete.
- Automated tests passed.
- Exact artifact tested.
- Staged.
- Deployed.
- Live verified.
- Operationally accepted.
- Pilot approved.
- Broad launch approved.

A release may be live while confidential traffic, payment, professional participation, or broad launch remains unapproved.

## Portal-specific responsibility

Every focused portal must maintain its unique backlog in addition to inherited shared ideas. It must evaluate shared capabilities for specialty fit and record required adaptations or reasons an item is not applicable. Shared consistency never overrides safer specialty-specific design.

## Continuation prompts

Every complete next-chat prompt must include or append the current shared list, portal-specific backlog, active release, carried-forward work, bugs, risks, evidence, decisions, versions, artifacts, deployment state, live state, launch blockers, and exact next actions. The prompt must identify the newest code package as the code source of truth and must not describe something merely as “complete” when its actual state is narrower.

## Owner visibility

The owner dashboard and prompt exports should use the same structured records. Owner edits, decisions, evidence, and status changes must remain auditable and must not expose secrets or confidential user facts.

## Required learning record per build — v1.7.28
Each build program record must state which cross-portal capabilities were reviewed, adopted or adapted, rejected, deferred, or found not applicable; the source portal/version; actual target-artifact evidence; tests; and any required owner or specialist review.



## Integrated legal-portal release discipline

Every legal-portal build program must reference `LEGAL_MICRO_PORTAL_INTEGRATED_STANDARD_V1.0.0.md`, keep the dual profile-growth and complete-product-quality mission visible, carry exact profile/evidence metrics, record complete-surface and device/accessibility acceptance, and distinguish plans from implemented exact-artifact evidence. A build item may not be silently removed from the complete Next Version Improvement List; removal requires verified completion, explicit owner rejection, or evidence-backed supersession.
