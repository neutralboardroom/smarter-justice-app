# Baseline Record — v1.7.51

Authoritative source: exact `smarter-justice-v1.7.50.zip`, SHA-256 `72d7b71cedd169cc6d42bdbb49ae1ba5083ef4acc90b196f21474087faee8eef`, 3,089,886 bytes.

Two clean extractions validated the 1,192-record embedded inventory and passed all 104 dependency-independent baseline tests. The one PostgreSQL-dependent test remained separate and blocked because the configured registry could not retrieve `xtend-4.0.2.tgz`. Vulnerability auditing remained blocked by a 404 audit endpoint. No shim, lockfile manipulation, weakened test, or fabricated acceptance was used.
