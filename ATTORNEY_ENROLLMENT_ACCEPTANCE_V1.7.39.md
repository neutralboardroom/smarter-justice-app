# Smarter Justice v1.7.39 Attorney Enrollment Acceptance

Date: July 28, 2026  
Status: DEVELOPMENT ARTIFACT — NOT DEPLOYED

## Required end-to-end staging rehearsal

1. Create an individual attorney account with a 12-or-more-character password.
2. Confirm no charge or membership application is created during signup.
3. Verify email and sign in from desktop and mobile widths.
4. Claim an existing profile and confirm it remains read-only until owner approval.
5. Edit an approved profile, verify completeness and unsaved-change feedback, and confirm a blank public name is rejected.
6. Create a firm account with an explicit firm name and verify authoritative covered-seat count.
7. Submit the founding membership application and confirm target, plan, seat count, and billing cadence.
8. Approve the application through the protected owner workflow.
9. Confirm the dashboard shows the exact recurring amount, discount, renewal cadence, cancellation/refund acknowledgment, and no-guarantee acknowledgment.
10. Attempt stale or mismatched seat, target, plan, and cadence checkout requests; each must fail closed.
11. Complete Stripe test checkout, verify webhook activation once, repeat the event, and confirm idempotent processing.
12. Exercise cancellation, refund, failed-payment, support, and incident procedures.

## Accessibility and device acceptance

Test keyboard-only operation, visible focus, error announcements, labels, password-manager/autofill behavior, 200% and 400% zoom, reduced motion, touch targets, mobile keyboards, screen readers, and print/email views where applicable.

## Go/no-go rule

Paid enrollment remains closed until database, SMTP, Stripe, webhook, backup/restore, monitoring, support, incident response, terms, privacy, refund/cancellation, accessibility, staging, rollback, and explicit owner approvals are all evidenced. Payment never creates verification, specialty evidence, ranking, endorsement, availability, inquiries, clients, revenue, or outcomes.
