# Smarter Justice v1.0.6

Smarter Justice is a separate multi-practice private support platform. It is not Immigration Oasis, not a law firm, not the government, and it does not guarantee legal, tax, benefits, immigration, settlement, timing, approval, refund, or case outcomes.

## What changed in v1.0.6

- Added a step-by-step guided homepage start flow.
- Simplified the public top navigation around Start Free, Upload Notice, Practice Areas, Pricing, How It Works, Dashboard, and Contact.
- Made Upload Notice a primary user path.
- Rebuilt the pricing page into a clearer paid-pilot structure: Free Start, Notice/Document Starter Review, Human Review Specialist Starter File, Completed Forms After Review, Tax Resolution, Tax Preparation, and separate professional review options.
- Added focused practice landing pages for high-value areas such as taxes, business formation, business law, real estate, divorce/family, housing, bankruptcy/debt, disability, estate planning, accidents, medical malpractice, public benefits, employment/wage claims, and nonprofit compliance.
- Added friendlier error summaries, validation copy, visible focus states, mobile spacing polish, and dashboard empty states.
- Improved staff/admin queue filtering and attention highlighting.
- Preserved optional Postgres-backed persistence, Render persistent-disk path support, SMTP scaffolding, secure continuation links, Stripe Checkout/webhook foundation, downloadable review packages, form-draft starter packages, and the verified-form-path registry.
- Kept attorney/professional profiles out.
- Kept Nolo/4LegalLeads ping-post and external lead-sale systems out.

## Run locally

```bash
npm install --omit=dev
npm test
npm start
```

Open `http://localhost:3000`.

## Required production settings before paid pilot traffic

Set these in Render environment variables:

- `APP_BASE_URL`
- `ADMIN_TOKEN`
- `OWNER_NOTIFICATION_EMAIL=reachrgnow@gmail.com`
- `SESSION_SECRET`
- Stripe keys and price IDs if charging users
- `STRIPE_WEBHOOK_SECRET`
- SMTP credentials if sending real emails
- `DATABASE_URL` for managed database persistence
- `SMARTER_JUSTICE_STORAGE_DIR` or `RENDER_DISK_MOUNT_PATH` for persistent upload storage

## Storage notes

v1.0.6 can run with local JSON for testing. For real paid users and sensitive uploads, configure a managed database and persistent/object upload storage. When `DATABASE_URL` is set and the optional `pg` dependency is installed by `npm install`, Smarter Justice creates and uses the `smarter_justice_store` and `smarter_justice_events` tables while still saving uploaded files to the configured storage directory.

## Email notes

Without SMTP, owner/user messages are saved in `storage/notifications.json`. With SMTP variables set and `nodemailer` installed, the app attempts to send notification emails while still preserving notification records.

## First verified-form paths

The registry includes review-first paths for IRS offer in compromise, IRS installment agreements, tax preparation organizers, bankruptcy debt schedules, Social Security disability appeals, business formation/EIN, trademarks, state divorce/family starting files, vehicle accidents, and medical malpractice record organization.

These are **not** fully autonomous official-form completion paths yet. They organize answers and documents, show missing information, generate review packages, and support Human Review Specialist/professional review before any future completed form delivery.
