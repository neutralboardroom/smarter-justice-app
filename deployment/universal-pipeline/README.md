# Smarter Justice Universal Deployment Pipeline

This directory defines the central deployment standard for Smarter Justice and all approved legal micro-portals.

## Owner operating model

Roger Gillman gives deployment instructions in the Smarter Justice master builder chat. The master chat coordinates the exact product release. GitHub Actions and Render perform the technical deployment.

A chat statement that a build is complete is never by itself a production trigger. Production deployment requires an exact qualified Git commit, successful staging evidence for that exact commit and version, a product-scoped authorization, successful mandatory gates, a portal-local protected GitHub environment, and that portal's protected Render deploy hook.

## Permanent owner rules

1. Persistent user data must survive every release, migration, rollback, and recovery.
2. English and Spanish experiences must remain complete and equivalent across all public and authenticated journeys, emails, outreach, documents, controls, accessibility labels, and operational messages.
3. Staging and production releases fail closed when qualification, migration safety, data continuity, bilingual parity, backup readiness, rollback readiness, staging promotion evidence, or live verification is not proven.
4. Full card numbers and CVC values must never be stored by Smarter Justice or any portal. Payment providers retain sensitive card data; applications store only approved references and display-safe metadata.
5. No workflow, builder, outside AI, or later packet may weaken these rules unless Roger Gillman explicitly supersedes them.

## Architecture

Each product repository contains:

- `deployment/product-deployment.json`
- a qualification caller workflow
- a portal-local staging workflow targeting that repository's protected `staging` environment
- a portal-local production workflow targeting that repository's protected `production` environment

Qualification uses a version-pinned reusable workflow maintained here. Staging and production use a version-pinned exact-deployment composite action maintained here, so each caller repository's own environment, approvals, variables, and secrets remain authoritative. Production also downloads and verifies the successful GitHub staging evidence artifact for the exact same commit and version, then binds the staging and production receipts into a promotion-chain artifact.

Each product keeps its own repository, release history, Render services, domains, database, storage, secrets, rollback records, and exact ZIP lineage.

## Safe rollout

The first implementation is on branch `ops/universal-safe-deployment-v1`. It does not modify or deploy the currently live Smarter Justice service. Automation remains disabled until the workflows, product configuration, environment protections, Render hooks, migration policy, backup evidence, full English/Spanish implementation, and live checks are independently accepted.
