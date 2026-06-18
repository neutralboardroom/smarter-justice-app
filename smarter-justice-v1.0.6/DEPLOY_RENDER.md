# Deploy Smarter Justice v1.0.6 on Render

Use GitHub → Render web service. This build is designed for a paid pilot foundation, but you should configure storage, Stripe, SMTP, and admin security before handling real sensitive paid uploads.

## 1. Create GitHub repo

Upload the unzipped contents of this ZIP to a new Smarter Justice repository. Do not merge it into Immigration Oasis.

## 2. Create Render web service

- Runtime: Node
- Build command: `npm install --omit=dev`
- Start command: `npm start`
- Health check path: `/health`
- Node version: 22+

## 3. Environment variables

Set:

- `APP_BASE_URL`
- `OWNER_NOTIFICATION_EMAIL=reachrgnow@gmail.com`
- `ADMIN_TOKEN`
- `SESSION_SECRET`
- `DATABASE_URL` for managed Postgres persistence
- `SMARTER_JUSTICE_STORAGE_DIR` or `RENDER_DISK_MOUNT_PATH` for persistent upload storage
- SMTP variables if sending emails
- Stripe variables if charging users
- tawk.to variables if using live chat

## 4. Storage

For real paid traffic, do not rely on default local files. Configure Render Postgres and a persistent upload storage path. v1.0.6 creates the key/value and event tables automatically when `DATABASE_URL` is set; `migrations/postgres.sql` is included for inspection/manual setup.

## 5. Stripe

Configure `STRIPE_SECRET_KEY`, Price IDs, and `STRIPE_WEBHOOK_SECRET`. In Stripe, add a webhook endpoint pointing to:

`https://YOUR-LIVE-DOMAIN/webhooks/stripe`

Listen for Checkout session events such as `checkout.session.completed` and `checkout.session.expired`.

## 6. SMTP

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optional `SMTP_FROM`. If SMTP is missing, notifications are spooled locally and shown in the admin queue.

## 7. Check launch readiness

Open `/launch-readiness.html` and enter the admin token. Fix every missing item before paid traffic.

## 8. Current boundaries

- No attorney/professional profile pages.
- No claimable profiles.
- No Nolo/4LegalLeads ping-post.
- No external lead-sale integrations.
- No claim that all official forms are fully automated.
- Completed forms should only be added one verified path at a time after source, field, review, and delivery checks.
