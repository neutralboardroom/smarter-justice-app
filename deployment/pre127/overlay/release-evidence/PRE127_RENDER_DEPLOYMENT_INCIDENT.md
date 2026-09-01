# PRE127 Render deployment incident and prevention record

## Incident

- Attempted at: 2026-09-01 22:02 UTC
- Render service: `srv-d8ps9jgjs32c73918vvg`
- Failed deployment: `dep-dabkmre10ojc73dtm6jg`
- Exact GitHub commit: `72bfe6ec865ada1a771f8249d59ff165fc04839f`
- Live release during the attempt: v2.0.0-pre126
- Customer-facing replacement: none; the build failed before promotion and PRE126 stayed live

Render checked out the intended commit and ran the unchanged production build command, `npm ci --omit=dev`. The PRE127 bootstrap reconstructed its predecessor chain. During PRE126 target replacement, Node attempted to rename a staging directory from `/tmp` into the repository's `.runtime` directory. Render uses different filesystems for those locations, and Linux returned `EXDEV: cross-device link not permitted`.

## Root cause

The first atomic-swap hardening correctly avoided writing into a generated runtime while it was visible to the workspace synchronizer, but it placed staging and retirement under the operating-system temporary directory. Atomic rename is only valid within one filesystem. Local and GitHub qualification environments did not expose the separate-mount topology that Render uses.

This was a release-builder portability defect. It was not caused by application logic, Stripe, payment configuration, environment secrets, databases, DNS, TLS, or the live PRE126 runtime.

## Correction

Both `scripts/bootstrap-pre126-release.js` and `scripts/bootstrap-pre127-release.js` now:

1. create private randomly named staging and retired directories beside the intended `.runtime` target;
2. copy the predecessor into the sibling staging directory;
3. rename any prior target to the sibling retired directory;
4. atomically rename the staged runtime into the target; and
5. remove the retired directory only after the swap.

Because every rename is now within the target's parent directory, the source and destination necessarily share a filesystem. The random private names continue to keep partially constructed output out of the authoritative target path.

## Required regression checks

- Both builders must remain free of `os.tmpdir()` staging.
- Both staging and retired paths must derive from `path.dirname(target)`.
- PRE127 must reconstruct twice with identical release output.
- A clean Git archive must pass `npm ci --omit=dev` with lifecycle scripts enabled.
- All retained PRE124, PRE125, PRE126, PRE127, and production qualification gates must pass on the exact final commit.
- Render must report the exact final commit as `live` before production verification begins.
- A failed build must never be described as a live deployment.

## Rollback and operational boundary

No rollback was necessary because Render did not replace PRE126. If a later PRE127 deployment reaches live state and fails production verification, the primary rollback target remains exact PRE126 production commit `55a7fd1c13353a5c045e72a20cf08a1ce54c208c`. No deployment-debugging action in this incident authorized Stripe, provider, environment-variable, database, domain, or TLS changes.
