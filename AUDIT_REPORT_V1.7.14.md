# Smarter Justice v1.7.14 Audit Report

## Baseline

The authoritative v1.7.13 ZIP matched SHA-256 `a02adf1e92796af854ea56836e8cd805977ac35732a74313cf8da45f7733f42d`, exact size 2,373,183 bytes, and its recorded root-level inventory and archive-safety controls.

## Evidence-backed findings and corrections

1. Public search exposed only name, practice, and borough. v1.7.14 adds neutral multi-field search across exact ZIP, city, state, professional type, documented language, documented service method, profile status, and inquiry availability.
2. Plain-language problems did not map consistently to formal practice labels. A versioned conservative synonym taxonomy now maps approved terms only to documented practice fields.
3. Organic ordering previously prioritized inquiry eligibility, which can depend on paid membership. v1.7.14 removes paid or inquiry-state influence from organic ordering.
4. Firm cards derived practice areas only from attached individual profiles, losing sourced firm facts. Source-supported firm practices are now preserved and unioned with attached professionals.
5. Result cards lacked source freshness and release reporting lacked a strict complete-profile rule. v1.7.14 adds source-review dates and a non-inflated qualifying metric.
6. Zero-result recovery and filter context were weak. The directory now provides active filters, accessible loading states, shareable URLs, clear controls, and useful broader-search guidance.

## Profile inventory

- Added: 0.
- Public records: 27.
- Strict qualifying complete profiles: 23 — 10 individuals and 13 firms.
- Excluded from qualifying total: four incomplete or secondary-only records.
- No credential, claimed, verified, participating, availability, or inquiry status was invented or changed.

## Preserved closed gates

Paid professional enrollment/payment, public Human Review, supporter plans, confidential uploads, sensitive AI, inquiries, booking, reviews, unrestricted matching/routing, automatic filing, broad cross-portal sharing, and public paid launch remain closed.

## Deployment truth

v1.7.14 is not deployed or live verified. Last verified production remains v1.6.1.

## Dependency-install and advisory limitation

The package registry and npm advisory endpoint were unavailable in the final build environment. A clean registry-backed `npm ci` and a fresh vulnerability query therefore could not be completed. The 15 resolved lockfile dependency records are unchanged from the exact-tested v1.7.13 dependency set except for the root package version. All 28 regression parts were executed with temporary external test-only compatibility stubs for `pg` and `nodemailer`; those stubs are not included in the ZIP. No fresh v1.7.14 vulnerability count is claimed.
