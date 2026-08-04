# Smarter Justice v1.7.64 Source Acceptance

- Exact source and immediate rollback: `smarter-justice-v1.7.63.zip`, SHA-256 `54e22e82f78c09cebff0343080d3fc46841117ec4faa0739fc31d72b3d34d408`, 5,682,101 bytes.
- Two independent frozen v1.7.64 source trees each passed all 118 dependency-independent commands concurrently.
- Output was byte-identical; log SHA-256 `541a63c6191ddf9a339d0069a355ca2fd6e0297f484d1f7c7e9cf39274a9e2ba`.
- The deterministic SPDX SBOM regenerated twice byte-identically; SHA-256 `ef4fa5d7fa61123ad5c09d73db85e506abb0f45d8d4d4e4173462afe3cbce7b0`.
- The self-excluding inventory is regenerated after this record and controls source/package equality; this record intentionally does not embed its own inventory hash.
- Exact-tested runtime: Node v22.16.0 and npm 10.9.2.
- Configured-registry installation and audit each reproduced HTTP 404 blockers; PostgreSQL acceptance is not claimed.
- Launch remains `NO_GO`; deployment is not authorized.
