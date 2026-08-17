# Smarter Justice PRE93 National Attorney Launch Support Runbook

Status: DRAFT FOR OWNER REVIEW — recording this file does not itself satisfy the owner-reviewed launch evidence gate.

## Scope

This runbook supports Smarter Justice as a national United States platform across all 50 states plus Washington, D.C. State- and jurisdiction-specific licensing, legal-source, advertising/compliance, eligibility, and correction rules remain applicable where required, but no support workflow may redefine Smarter Justice as a New York-, NYC-, or region-limited platform.

## Supported launch issues

1. Attorney cannot find a public profile or sees incomplete search results.
2. Attorney wants to claim, correct, suppress, or update a profile.
3. Attorney cannot create or access a professional account.
4. Attorney has an email-verification, password-reset, or MFA problem.
5. Firm administrator needs help with firm/team controls.
6. Attorney has a membership, billing, sponsorship-label, or paid-feature question.
7. Attorney reports incorrect public data, duplicate identities, stale source information, or an identity mismatch.
8. Attorney reports a privacy, security, accessibility, or account-safety concern.
9. Attorney reports a broken page, failed route, outage, or materially incorrect public behavior.

## Triage procedure

1. Identify the affected domain, route, account type, profile ID if known, and whether the problem is public search, account access, profile control, firm controls, billing, or site reliability.
2. Never request or record passwords, authenticator secrets, six-digit MFA codes, recovery codes, payment-card data, confidential legal matter facts, or other unnecessary sensitive information.
3. For profile-data issues, preserve the reported correction separately from source evidence. Do not treat payment, membership, or outreach status as verification evidence.
4. For claim/identity issues, require the normal claim/identity workflow; do not manually transfer profile control merely because a requester knows public information.
5. For licensing/currentness disputes, preserve the platform correction and recheck the appropriate official or otherwise qualified jurisdiction-specific source before featuring or asserting current status.
6. For payment questions, keep organic directory rank, verification, licensing/currentness, and profile factual accuracy independent of payment status.
7. For suspected privacy/security incidents, account compromise, data corruption, systemic authentication failure, or widespread outage, escalate to the Production Incident Runbook instead of treating the case as ordinary support.
8. Record the resolution, any source/evidence recheck performed, affected record IDs, and whether follow-up product work is required. Do not store secrets in the ticket or evidence record.

## Directory/search support

- Every public search field is optional.
- Partial name, firm, location, ZIP, and free-text searches should produce useful fact-bound results when qualified evidence exists.
- Broader/fallback matching must not invent a practice area, license, location, availability, endorsement, or paid preference that is not supported by admitted data.
- Payment must never buy organic ranking or verification.

## Claim and correction boundary

The qualified Attorney Profile Factory remains a read-only directory source. Smarter Justice materializes an individual record into transactional platform state only when a claim/correction or other platform-owned workflow requires it. Later Smarter Justice claims, corrections, suppressions, entitlements, and verification state remain authoritative over stale factory evidence.

## Incident escalation

Use `deployment/incident-runbook.md` for production incidents. Preserve logs and redacted evidence, keep the pause narrowly scoped where possible, and use only verified rollback targets.

## Launch-day operating notes

- Public directory and attorney tour/demo may remain available while a consequential account/payment/upload lane is fail-closed.
- Never bypass a launch readiness gate merely to complete a demonstration.
- If transactional email or owner-security prerequisites are unavailable, explain the affected workflow accurately rather than claiming completion.
- Keep national scope and jurisdiction-specific compliance distinct in all attorney communications.

## Owner review

Before setting `LAUNCH_SUPPORT_RUNBOOK_RECORDED=true`, the owner should review and accept this runbook and confirm the responsible support owner. Owner review is intentionally not asserted by this file.
