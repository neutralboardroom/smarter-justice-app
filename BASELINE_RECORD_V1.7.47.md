# Smarter Justice v1.7.47 Baseline Record

## Exact source artifact

- Filename: `smarter-justice-v1.7.46.zip`
- Version: 1.7.46
- SHA-256: `d6fa5cb4c7af8686d24081fa69ecb8c1cc1d6f355bb4258ec18af075cb1c5d0e`
- Exact size: 2,697,013 bytes
- ZIP entries: 966 total; 952 files; 14 explicit directories
- Self-excluding inventory: 951 records
- Inventory SHA-256: `e506ddf9813ca639d1dd8dbdbceaa5e7bbe0d3a163193ce5b2af8a1d2f4b78ea`
- Self-excluding tree digest: `eb76553feb4d6ec06585495b36ba15beed002308d8c32116f92bc9dbd95e06db`
- CRC, archive path safety, duplicate, traversal, absolute-path, backslash-path, encryption and symlink checks: passed
- Two independent clean extractions and inventory validation: passed

## Reproduced baseline behavior

- 100 of 100 dependency-independent v1.7.46 test parts passed.
- The PostgreSQL-dependent storage-readiness part remained blocked because legitimate dependency retrieval for `xtend-4.0.2.tgz` returned HTTP 404 and `pg` was unavailable.
- Fresh vulnerability audit remained blocked by the configured audit endpoint HTTP 404.
- Launch preflight reproduced `NO_GO`, 0 of 4 lanes ready, and 92 blocked checks.
- No deployment, live portal connection, automatic portal write, paid gate, public profile publication, review, appointment, confidential upload, or external AI was active.

## Material audit finding

The platform already had substantial launch architecture, but first-cohort operations still defaulted to historical paid founding-member concepts and lacked one safe way to convert lawful source data into reviewable private profile candidates. The selected v1.7.47 scope makes free basic profile control the operational first step, adds consented QR/campaign follow-up, and accelerates source-supported profile intake without granting trust, specialty, publication, payment, or live-portal status.
