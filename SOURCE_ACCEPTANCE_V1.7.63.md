# Smarter Justice v1.7.63 Source Acceptance

- Exact source and immediate rollback: `smarter-justice-v1.7.62.zip`, SHA-256 `2dbc85180e6319eda0320361093501bfa1eb4fa973b1b4572595095f57662735`, 5,480,221 bytes.
- Two independent frozen v1.7.63 source trees each passed all 117 dependency-independent commands concurrently.
- Output was byte-identical; log SHA-256 `383eed1a10769c543acfdd963ee42042ccee16e2ebbddbe9882482443b09bb62`.
- The deterministic SPDX SBOM regenerated twice byte-identically; SHA-256 `047313cf14c96f58c9fbb5a90f14b28113fe7282f8c42146a5d864ee1afd8b9d`.
- The self-excluding inventory is regenerated after this record and controls source/package equality; this record intentionally does not embed its own inventory hash.
- Exact-tested runtime: Node v22.16.0 and npm 10.9.2.
- Configured-registry installation and audit returned HTTP 404; PostgreSQL acceptance is not claimed.
- Launch remains `NO_GO`; deployment is not authorized.
