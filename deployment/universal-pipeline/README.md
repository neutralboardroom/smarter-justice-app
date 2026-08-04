# Smarter Justice Universal Deployment Pipeline

This directory defines the central deployment standard for Smarter Justice and all approved legal micro-portals.

## Owner operating model

Roger Gillman gives deployment instructions in the Smarter Justice master builder chat. The master chat coordinates the exact product release, while GitHub Actions and Render perform the technical deployment.

A chat statement that a build is complete is never by itself a production trigger. Production deployment requires an exact qualified Git commit, a product-scoped configuration, successful mandatory gates, and a protected Render deploy hook.

## Permanent owner rules

1. Persistent user data must survive every release, migration, rollback, and recovery.
2. English and Spanish experiences must remain complete and equivalent across all public and authenticated journeys, emails, outreach, documents, controls, accessibility labels, and operational messages.
3. Production releases fail closed when qualification, migration safety, data continuity, bilingual parity, backup readiness, or live verification is not proven.
4. Full card numbers and CVC values must never be stored by Smarter Justice or any portal. Payment providers retain sensitive card data; applications store only approved references and display-safe metadata.
5. No workflow, builder, outside AI, or later packet may weaken these rules unless Roger Gillman explicitly supersedes them.

## Architecture

Each product repository contains a small `deployment/product-deployment.json` file and two caller workflows:

- qualification caller
- production deployment caller

The caller workflows invoke version-pinned reusable workflows maintained in this repository. Each product keeps its own repository, release history, Render service, domain, database, storage, secrets, rollback record, and exact ZIP lineage.

## Safe rollout

The first implementation is created on branch `ops/universal-safe-deployment-v1`. It does not modify or deploy the currently live Smarter Justice service. Production automation remains disabled until the reusable workflows, product configuration, environment protection, Render hook, migration policy, backup evidence, and live checks are independently accepted.
