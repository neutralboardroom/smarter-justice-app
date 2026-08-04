# Smarter Justice Production Paid-Pilot Operational Readiness Standard

Version: 1.0.0
Adopted in development release: v1.7.6
Status: Code foundation exact-artifact tested; external evidence, deployment, and owner activation remain pending.

## 1. Purpose

This standard defines the minimum machine-verifiable and owner-approved conditions before Smarter Justice may activate professional membership payments, public Human Review Specialist charges, or sensitive production traffic.

Code completion does not prove production configuration, legal approval, staffing, delivery, support, or operating acceptance.

## 2. Fail-closed activation

Paid-pilot activation requires all of the following:

- the applicable manual readiness evidence is approved and current;
- machine-verifiable operational checks pass in the actual production environment;
- `PROFESSIONAL_PILOT_ACTIVATION_APPROVED=true` is explicitly configured by the owner after review;
- Stripe checkout and webhook signing are configured and tested;
- no applicable emergency pause is active.

Sensitive traffic separately requires:

- production-appropriate durable storage;
- durable owner identity with MFA;
- `SENSITIVE_TRAFFIC_APPROVED=true` explicitly configured after security, legal, privacy, storage, recovery, and real-device acceptance;
- the specific portal and workflow are approved for sensitive production data.

Infrastructure readiness alone must never open either gate.

## 3. Database requirements

Before paid activation, prove in the target environment:

- PostgreSQL is selected and reachable;
- versioned schema migrations run from a clean database and the supported prior state;
- migration identifiers and checksums are recorded;
- advisory migration locking prevents concurrent migration races;
- request mutations commit before success is reported;
- money- and status-sensitive changes use transactions and appropriate locking;
- duplicate checkout, event, refund, seat, invitation, claim, approval, and activation operations are idempotent;
- restart and redeploy preserve state;
- interruption and reconnect behavior are accepted;
- backup is created;
- restore into a separate environment is completed and verified;
- recovery and rollback evidence is recorded.

Local JSON storage is not production transactional durability for paid or sensitive state.

## 4. Owner security requirements

Before activation, prove:

- durable owner identity exists;
- production bootstrap credentials are removed;
- legacy owner-token access is disabled;
- password policy is enforced;
- authenticator MFA is enrolled;
- recovery codes are generated, stored safely, and tested;
- sessions expire and can be revoked;
- device/session visibility is available where appropriate;
- abuse controls and rate limits are active;
- owner actions are audited;
- emergency pause authority is documented and tested.

## 5. Professional security requirements

Before a professional may enter a paid cohort:

- email ownership is verified through a hashed, expiring, single-use token;
- password reset is tested;
- MFA is enrolled when required by the cohort standard;
- sessions, logout, expiration, and revocation work;
- account, firm, invitation, and seat roles are enforced;
- security and recovery communications are deliverable;
- unverified signups cannot create active marketplace, firm, claim, or billing records.

## 6. Authenticated transactional email

Prove:

- authenticated sending domain;
- SPF;
- DKIM;
- DMARC;
- explicit recognizable sender identity;
- professional verification and password reset delivery;
- invitations and account-security messages;
- payment, failure, cancellation, and refund communications;
- public Human Review order communications when that service activates;
- bounce and delivery-failure visibility;
- reply routing or clear no-reply behavior;
- safe message content without secrets or unnecessary sensitive facts;
- real-device acceptance.

Templates or local mocks alone are insufficient.

## 7. Stripe professional membership lifecycle

Test and reconcile:

- monthly and annual individual checkout;
- firm seats and approved quantity discounts;
- duplicate-checkout prevention;
- successful and failed payment;
- renewal and dunning;
- upgrade and downgrade;
- seat quantity change;
- cancellation now and at period end;
- reactivation;
- full and permitted partial refunds;
- duplicate-refund prevention;
- disputes and chargebacks;
- webhook replay;
- out-of-order events;
- event ledger and membership reconciliation;
- owner-visible billing exceptions and audit history.

Membership never guarantees leads, matters, clients, referrals, rankings, revenue, or outcomes.

## 8. Public Human Review lifecycle

Before any charge, prove:

- owner-approved service, price, scope, turnaround, revision, cancellation, refund, and terms version;
- staffing and capacity;
- service eligibility;
- duplicate-order protection;
- checkout and payment reconciliation;
- assignment, fulfillment, delivery, and revision;
- cancellation before and after work begins;
- full and permitted partial refund handling;
- duplicate-refund prevention;
- disputes;
- support and complaints;
- capacity pause and emergency shutdown;
- owner-visible order and financial status.

Human Review Specialist work remains operational organization and completeness support, not legal, tax, accounting, or professional advice.

## 9. Legal, support, and operating evidence

Before activation, record:

- current legal and professional-responsibility review;
- recurring billing, cancellation, refund, advertising, referral, sponsorship, fee-separation, Human Review, privacy, and consumer-protection review;
- named support owner;
- hours and response targets;
- refund authority;
- complaint and escalation procedure;
- fraud and dispute handling;
- incident classification, communication, and post-incident review;
- monitoring and alerts;
- rollback procedure;
- named first cohort;
- cohort size, categories, geography, portals, terms, support, capacity, success criteria, stop criteria, and pause authority;
- real-device acceptance;
- explicit owner approval.

## 10. Status language

Use separate statuses including:

- code complete;
- automated tests passed;
- exact artifact tested;
- staged;
- deployed;
- live verified;
- operationally accepted;
- pilot approved;
- broad launch approved;
- blocked;
- paused.

Never use one status as a substitute for another.

## 11. v1.7.6 truth

v1.7.6 provides code foundations for migrations, locking, database checks, operational readiness, explicit activation, professional email verification, and owner visibility.

It does not itself prove:

- production database durability;
- backup or restore;
- SMTP authentication or delivery;
- Stripe end-to-end acceptance;
- legal approval;
- support staffing;
- monitoring;
- real-device acceptance;
- named-cohort readiness;
- owner activation;
- deployment or live verification.

All paid and sensitive gates remain closed until those requirements are separately proven and approved.


## 12. v1.7.7 corrective controls

v1.7.7 strengthens the standard with full saved-route shutdown, CSRF, authenticated private page delivery, awaited mutation responses, controlled one-instance deployment, migration tooling, upload-content verification, continuation-link lifecycle controls, and an SBOM. These code controls do not replace external database, backup/restore, email, Stripe, support, legal, monitoring, device, cohort, or owner-approval evidence.
