# Smarter Justice v1.7.7 Corrective Audit Report

## Baseline

- Source: exact `smarter-justice-v1.7.6.zip`
- Baseline SHA-256: `6338ae752650f55ab90653858479c47cbc7a67e6d3e7613ad9dc1f599d23bb8a`
- Baseline preserved unchanged as rollback
- No baseline source changes before audit

## Findings corrected

| Finding | Correction | Regression evidence |
|---|---|---|
| Sensitive emergency pause did not consistently cover existing case tokens | Central route gate plus store-level upload assertion | `security-boundaries-v177.test.js` |
| Cookie-authenticated mutations lacked explicit CSRF protection | Double-submit token, origin and fetch-site validation, browser header integration | `security-boundaries-v177.test.js` |
| Private page shells were publicly retrievable | Server-side page authorization and separate sign-in shells | `security-boundaries-v177.test.js` |
| Public runtime returned internal terminology | Plain-language API responses | `security-boundaries-v177.test.js`, customer clarity suite |
| Stop Sign Project links were not uniformly fail closed | Verified-destination flag and dynamic activation only | public-service and security-boundary tests |
| Mutation success could precede persistent-write completion | Serialized mutation wrapper and deferred response commit | source review, full regression, optional PostgreSQL acceptance |
| Upload validation relied too heavily on metadata | Base64, decoded-size, extension, MIME, and signature checks | `security-boundaries-v177.test.js` |
| Continuation tokens lacked active lifecycle controls | Default expiration plus rotation/revocation | `security-boundaries-v177.test.js` |
| Render configuration could auto-deploy and drift from code | Auto-deploy off, pre-deploy migration, explicit gates, single instance | config audit |
| Dependency provenance lacked a release SBOM | SPDX 2.3 SBOM generator and artifact | `SBOM.spdx.json` |

## Remaining external evidence

The code package cannot prove and does not claim:

- production database backup and separate restore;
- target-environment PostgreSQL concurrency/reconnect acceptance;
- owner MFA custody and recovery operations;
- authenticated SMTP, SPF, DKIM, DMARC, delivery, bounce, and complaint handling;
- complete Stripe lifecycle acceptance;
- legal, professional-responsibility, consumer-protection, privacy, or advertising approval;
- named support coverage and incident operations;
- monitoring and alert acceptance;
- real-device and browser acceptance;
- named first professional cohort and owner activation approval.

All paid and sensitive gates remain closed.
