# Production qualification modernization

Smarter Justice production now uses a sealed runtime bootstrap package rather than the earlier direct-source v1.7.83 repository shape.

The production qualification workflow therefore qualifies the repository in two layers:

1. Export the exact Git commit to a clean temporary source tree and require the root `package.json` and `package-lock.json` versions to agree.
2. Install the root bootstrap with lifecycle scripts disabled, then execute its explicit `postinstall` contract. That contract verifies the sealed release archive, installs the sealed runtime dependencies, runs the inherited runtime test suite, and applies/qualifies the current public UI and AI overlays.
3. Resolve `.runtime/smarter-justice-v<root-version>` and require the extracted runtime package version to equal the root bootstrap version.
4. Generate the runtime SBOM and validate the runtime deployment kit using the extracted runtime package scripts.
5. Upload the runtime SBOM as qualification evidence.

The workflow intentionally does not hard-code `1.7.83` or call `test`, `sbom`, or `deployment:validate` on the root bootstrap package. Those scripts belong to the extracted runtime. Future bootstrap versions remain fail-closed because root/lock/runtime versions must agree and the bootstrap itself pins and verifies the sealed source artifact.
