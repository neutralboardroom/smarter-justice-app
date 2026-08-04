# Baseline and Portfolio Truth Reconciliation — v1.7.54

## Exact source and rollback

`smarter-justice-v1.7.53.zip` was accepted as the exact source and immediate rollback artifact.

- SHA-256: `f6c881faf1f72de44d062b15d3d7701574663a2b22a9d9273a6930580a359cac`
- Size: 4,570,546 bytes
- ZIP entries/files/directories: 1,306/1,288/18
- Inventory records/hash: 1,287 / `9c3c86944989026ebafe325d497a973e805e9e494f35418f9e3b3dab9dfcc31a`
- Two independent fresh extractions: identical
- Dependency-independent suite: 107 command parts passed twice

## Current truth corrected

Current-facing v1.7.54 records now preserve final v1.7.53 as exact verified source and rollback truth rather than candidate-era v1.7.52 truth. The four initial portals now use the newest owner-recorded exact identities available to this build, with independent inspection, staging, deployment and last-known-good states kept separate.

Historical candidate records remain historical and were not rewritten.

## Supply-chain truth

A legitimate `npm ci --ignore-scripts --omit=dev` remains blocked because the configured registry returns HTTP 404 for `xtend-4.0.2.tgz`. `npm audit --omit=dev --ignore-scripts` also remains blocked by an HTTP 404 audit endpoint. The lockfile still points to public-registry tarball URLs and retains integrity fields. No clean-install, PostgreSQL, vulnerability-audit or production-persistence acceptance is claimed.

## Self-artifact boundary

The final v1.7.54 ZIP cannot truthfully embed its own final SHA-256 because changing the embedded receipt would change the ZIP. The package therefore contains source-tree, deterministic-build and fresh-extraction evidence; the final archive SHA-256, size and counts are attached in the detached delivery receipt.
