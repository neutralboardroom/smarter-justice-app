# Smarter Justice — PRE129 next-version improvement list

## 1. SJ-NEXT-129-001 — verify Smarter Justice transactional email

- **Problem:** New professional registration cannot safely verify or recover accounts.
- **Evidence:** `smarterjustice.com` is provisioned in the email provider but DNS verification and delivery acceptance are incomplete.
- **Desired outcome:** Verify the domain, use a Smarter Justice-restricted sending credential, configure production delivery, and pass verification, resend, expiry, recovery, bounce, complaint, enumeration, and abuse tests.
- **State:** `QUALIFIED_AFTER_DEPENDENCY`
- **Re-entry condition:** Required DNS records resolve and provider verification succeeds.

## 2. SJ-NEXT-129-002 — connect Smarter Justice Stripe authority

- **Problem:** The only currently connected live Stripe context is an unrelated Franklin Navigator account.
- **Desired outcome:** Connect the Smarter Justice-authorized live/test Stripe context without modifying Franklin products.
- **State:** `EXTERNAL_CREDENTIAL_REQUIRED`
- **Re-entry condition:** Correct Stripe account is connected and identified as Smarter Justice authority.

## 3. SJ-NEXT-129-003 — map and prove the paid membership catalog

- **Problem:** Planned dues have no accepted Smarter Justice provider price IDs.
- **Desired outcome:** Create or reconcile Professional, Team, and Office monthly/annual price IDs in the correct account, then prove checkout, signed webhook, entitlement, seats, invoices, renewal, failed payment, cancellation, refund, dispute, reactivation, and annual cadence.
- **State:** `QUALIFIED_AFTER_DEPENDENCY`
- **Re-entry condition:** SJ-NEXT-129-002 and transactional email acceptance pass.

## 4. SJ-NEXT-129-004 — paid first-value and member-care acceptance

- **Problem:** Payment is not first value and there is no paid cohort proof yet.
- **Desired outcome:** After payment, an eligible member reaches a current local brief, completes one meaningful action, can control communication preferences, gets support, and can cancel/reactivate without losing free profile rights.
- **State:** `QUALIFIED_AFTER_DEPENDENCY`
- **Re-entry condition:** Paid entitlement lifecycle is qualified.

## 5. SJ-NEXT-129-005 — launch-go and LinkedIn paid-membership prospecting

- **Problem:** Manual LinkedIn prospecting can truthfully promote the free preview now, but must not promote active paid enrollment while checkout is closed.
- **Desired outcome:** After payment/email/first-value gates pass, publish one exact current prospect landing, approved outreach copy, price/cadence/cancellation disclosure, and a measured manual LinkedIn pilot with no scraping, spam, guaranteed-client claim, or sensitive targeting.
- **State:** `QUALIFIED_AFTER_DEPENDENCY`
- **Re-entry condition:** All PRE129 launch acceptance fields pass and an owner GO is recorded.
