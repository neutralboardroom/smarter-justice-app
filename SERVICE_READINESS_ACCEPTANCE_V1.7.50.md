# Smarter Justice v1.7.50 Service Readiness Acceptance

## Purpose

Provide truthful, fail-closed service signals for a near-term launch without allowing a health endpoint, dashboard entry, or monitoring system to authorize deployment or open a product gate.

## Accepted local behavior

- `/health` preserves the minimal legacy process-health contract.
- `/livez` proves only that the Node process can answer.
- `/readyz` evaluates an allowlisted launch lane and returns HTTP 503 with `Retry-After: 60` while blocked.
- `/api/public/service-status` gives a privacy-minimized public status summary.
- `/api/owner/service-readiness` provides private lane-specific blockers to an authorized owner.
- Readiness output excludes secrets, raw configuration, storage paths, database errors, legal narratives, professional email addresses, IP addresses, and device identifiers.
- No readiness endpoint can change a gate, create evidence, approve a professional, publish a profile, activate payment, connect a portal, or deploy.

## Still externally required

Production-like PostgreSQL and restart persistence; SMTP; owner/staff MFA; monitoring and alert delivery; backup and restore; exact rollback approval; browser, phone, tablet, keyboard, zoom, and screen-reader acceptance; exact three-portal D4 staging; support and incident ownership; applicable legal acceptance; and explicit owner deployment approval.

## Current result

Local acceptance is complete. Production acceptance is not complete. Launch preflight remains `NO_GO`.
