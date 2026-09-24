# FAS ESSENTIALS

A React 19 / TypeScript / Vite storefront backed by an Express API and SQLite. The original typography, colors, cards, galleries, drawers and page layout are retained. Accounts and administration are added in the same visual style.

## Requirements and local setup

- Node.js **24 LTS** and npm.
- A writable local disk for the database.
- Razorpay merchant credentials for online checkout; COD works without payment credentials.
- Resend with a verified sender domain for email, newsletter signup and password recovery.

```bash
npm ci
cp .env.example .env
npm run db:seed
npm run admin:create
npm run dev
```

Before `admin:create`, set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters in `.env`. The command refuses to overwrite an existing account. Remove `ADMIN_PASSWORD` afterward. Open http://localhost:3000/admin directly and use the separate admin login. There is no admin link in the customer navigation. Customer credentials cannot sign in there; a customer session receives HTTP 403 for `/admin` and admin APIs. Sign out of the customer session first or use a separate browser profile for administration.

The seed imports the five original product descriptions, prices, image URLs and color definitions **as inactive products with zero stock**. It imports no dummy buyers, ratings, testimonials, orders or stock figures. Review each product, enter the actual available quantity for every color, and activate it in Admin. Re-running the seed does not overwrite business records. Original CDN image availability and product claims must be checked by the operator.

The storefront starts empty until products are activated. There is no hidden fallback catalog, successful-payment simulator, or default administrator password. Test fixtures are isolated under `tests/` and never run during normal startup or seeding.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development` locally; `production` for deployment. Production serves the built frontend and enables secure cookies. |
| `APP_URL` | Exact public origin, without a trailing slash/path. `http://localhost:3000` locally; HTTPS is mandatory in production. Used for CSRF origin checks and email links. |
| `PORT`, `HOST` | API listener; defaults `3001`, `0.0.0.0`. |
| `DATABASE_PATH` | Persistent SQLite file, default `./data/store.sqlite`. |
| `TRUST_PROXY` | `1` only when a single trusted proxy replaces forwarded headers; otherwise `0`. |
| `RAZORPAY_KEY_ID` | Merchant key ID. This public identifier is returned to signed-in checkout clients. |
| `RAZORPAY_KEY_SECRET` | Server-only payment API and checkout-signature secret. |
| `RAZORPAY_WEBHOOK_SECRET` | Independent secret configured on the Razorpay webhook endpoint. All three payment variables are required to enable online checkout. |
| `RESEND_API_KEY` | Server-only email API credential. |
| `MAIL_FROM` | Verified sender, e.g. `FAS ESSENTIALS <orders@your-domain.example>`. |
| `SUPPORT_EMAIL` | Optional recipient of contact-form notifications. Messages are saved in Admin regardless of email configuration. |
| `ADMIN_EMAIL` | Admin order notification recipient; also used by the admin bootstrap command. Keep configured at runtime. |
| `ADMIN_PASSWORD` | One-time bootstrap command only. Remove after account creation. |

Do not put secrets in `VITE_*` variables or commit `.env`. No API credentials are embedded in frontend bundles. Email jobs remain in the database outbox when delivery is unavailable; the UI does not falsely claim an email was delivered. Configure both `RESEND_API_KEY` and `MAIL_FROM` before offering newsletter/password-recovery service.

## Implemented flows

- Server-side catalog search, category filtering, sorting, product detail, per-color inventory and dynamic review statistics.
- Anonymous database-backed carts, merged into the account on sign-in. Cart quantities and color choices persist across reloads; prices and discounts come from the server.
- Registration, sign-in/out, password changes, email password recovery, revocable sessions, account order history and wishlist.
- INR checkout with authenticated accounts, validated Indian shipping details, saved order notes, immutable line-item snapshots and server-generated order IDs.
- Razorpay online checkout or cash on delivery; no client-supplied totals or payment-status claims are trusted.
- Admin product creation/editing/archiving, category creation/renaming, per-color inventory, users/roles, orders, tracking URLs, unshipped online refunds, support inbox and payment reconciliation.
- Customer reviews restricted to accounts with a delivered order; one review per customer/product. No fabricated verification badges.
- Contact messages saved to the support inbox; newsletter signup, welcome mail and unsubscribe flow.
- Database constraints, transactional stock reservations, authorization, input validation, CSRF and origin checks, HttpOnly/SameSite cookies, scrypt password hashes, request limits, CSP and security headers.

`FAS10` gives 10% off; `FAS15` gives 15% off with a ₹700 merchandise minimum. `FIRST10` and `WELCOME10` require an account without an earlier non-cancelled order. Free delivery applies at **₹499 or more before coupon discounts**; otherwise shipping is ₹49. Monetary database columns are integer **paise**, while storefront product/cart amounts are rupees. Original prices are treated as tax-inclusive; no separate tax is invented.

## Payments

1. Complete Razorpay merchant onboarding and enable the required payment methods. Availability of UPI/cards/netbanking depends on the merchant account.
2. Begin with test-mode key ID and key secret. Configure automatic capture in Razorpay. The application confirms only a **captured** payment, not just authorization.
3. Set the three Razorpay environment variables and restart the server.
4. In Razorpay, register `https://YOUR_DOMAIN/api/payments/webhook`, using the same `RAZORPAY_WEBHOOK_SECRET`, and subscribe to `payment.captured`, `order.paid`, and `refund.processed`.
5. Run real provider test-mode success/failure/cancellation/refund scenarios before switching to live keys and a live-mode webhook.

The API reserves stock and creates the local order before contacting Razorpay. The frontend opens Razorpay's hosted checkout. The server checks HMAC-SHA256 over its stored order ID and the returned payment ID, fetches the payment from Razorpay, and verifies order, capture status, INR currency and exact amount. Webhooks validate HMAC over the **raw body**, deduplicate events and apply idempotent state changes. No card or UPI credentials pass through this server.

Signed webhook tests exercise local state transitions; they are **not a substitute for provider test-mode certification**. No merchant keys were supplied during implementation, so actual gateway capture/refund and email delivery have not been verified against your accounts.

### Recovery and stock reservations

- Checkout retries with the same key return the same order, avoiding duplicate deductions. A customer can have one unfinished online checkout at a time.
- Closing the payment popup keeps an unpaid order in Account. Resume it or use **Check payment status**; do not create a second order to guess whether the first payment succeeded.
- Unpaid orders reserve stock until explicitly cancelled. Reservations do not silently expire because a Razorpay payment could arrive later. Review abandoned orders regularly in Admin.
- If gateway order creation times out, the saved order enters `payment_initialization_failed`. Look up its receipt (the local order UUID) in the Razorpay dashboard, enter the provider order ID in Admin, and choose **Reconcile payment / refund**. The server validates receipt, amount and currency before linking it. If there is no provider order, cancel the local unpaid order and start a new checkout.
- Cancelling an unpaid order releases stock exactly once. A later captured payment becomes `payment_review`, never automatic fulfillment; an administrator must refund it.
- Full refunds are supported for paid, unshipped online orders. A timeout leaves `refund_pending`; do not blindly retry. Reconcile with the provider dashboard and the Admin reconciliation button. A `refund.processed` webhook completes the local refund and releases reserved stock once.
- Shipped/delivered returns and COD refunds need an operator-controlled physical-return/refund process. This application does not infer returned inventory, execute COD bank transfers, or issue partial refunds. Inspect returned goods before manually adjusting stock.
- COD orders become paid only when the admin marks delivery/COD collection complete. Tracking links are entered by the operator; no courier dispatch, SMS or WhatsApp service is implied.

Official integration references: [Razorpay Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), [webhook validation](https://razorpay.com/docs/webhooks/validate-test/), [Resend email API](https://resend.com/docs/api-reference/emails/send-email).

## Database and operations

Migrations in `server/migrations/` run transactionally on startup and on CLI commands. SQLite uses foreign keys, WAL mode, a busy timeout and `synchronous=FULL`. Core tables cover users, sessions, reset tokens, categories, products, variants, carts, wishlist, coupons, orders/items, reviews, webhook events, support messages, subscribers, email outbox, request limits and an admin audit log.

Use **one application instance with a persistent local volume**. This is a suitable small-store architecture; do not use ephemeral/serverless disks, multiple container replicas with separate files, or a network filesystem for SQLite. A future multi-instance deployment should migrate the repository layer to a shared database before scaling out.

Stock updates and order creation occur in one `BEGIN IMMEDIATE` transaction. Product version checks reject stale admin edits, including edits opened before new stock reservations. Inventory quantities in Admin are **available-to-sell stock**, excluding already reserved orders.

Back up the database using SQLite's online backup API (or stop the application before copying all database files). Do not copy only a live `.sqlite` file while ignoring its WAL. Store encrypted backups off-host and test restoration. Restrict database file permissions, monitor disk space and `/api/health`, monitor email outbox backlog (`/api/admin/operations`), and inspect `payment_review`, `refund_pending` and failed-initialization orders. Sessions and expired reset/rate-limit entries are cleaned periodically.

Customer email delivery uses a persistent outbox, exponential retries and a provider idempotency key. Admin order notifications use the more conservative delivery policy below. Configure a verified sender and monitor failed deliveries. No secrets, password reset tokens, shipping addresses or raw provider payloads are written to application logs.

## Deployment

A VPS/container host with a persistent disk and an HTTPS reverse proxy is the supported deployment target. It is not deployed automatically by these changes.

```bash
npm ci
npm run check
# Configure .env with NODE_ENV=production, exact HTTPS APP_URL and persistent DATABASE_PATH
npm run db:seed
npm run admin:create
npm start
```

Or use the supplied Docker image and Compose volume:

```bash
# Set APP_URL=https://your-domain.example and secrets in .env first.
docker compose up -d --build
docker compose exec store npm run db:seed
docker compose exec store npm run admin:create
```

Terminate TLS at a trusted reverse proxy forwarding to `127.0.0.1:3001`. Set `TRUST_PROXY=1` only for that topology and replace, rather than append untrusted client forwarding headers. Keep a single replica. Mount `store-data` across upgrades. The image runs as an unprivileged user and includes a health check. Production serves the existing Vite build and API on one origin; never expose the Vite development server as production.

Before accepting real orders: verify catalog content/images, real inventory, support details, merchant policies, tax treatment and fulfillment promises; configure/test gateway and email credentials; test backups and the live HTTPS cookie/webhook path. Existing marketing statements are business content, not evidence of product certification or service coverage.

## Testing

```bash
npm run check                 # TypeScript, API/database integration tests, production build
npx playwright install --with-deps chromium
npm run test:e2e              # Desktop shopper/admin and mobile support journeys
```

API tests use isolated real SQLite databases and cover guest-to-account cart merge, variants, coupons, checkout idempotency, authorization/ownership, concurrent inventory contention, cancellation, review eligibility, CSRF, invalid input, absent payment configuration, signed webhook replay, wrong amounts, late capture, refunds and stale admin edits. Browser tests start the real frontend/API with an isolated test-only database; they do not intercept APIs with canned responses.

See `IMPLEMENTATION_AUDIT.md` for the original audit and validation status. CI runs the same checks and browser tests on GitHub Actions. Test-mode gateway and email checks require separate real credentials and are deliberately not simulated as passing.

## Applying this delivery to GitHub

The source package includes `full-stack-changes.patch`, based on commit `6f5cfc81610c179691450cc91951c6bd77c25cc6`. From a clean checkout of that base, create a branch and apply it with `git apply --index /path/to/full-stack-changes.patch`, then commit and push using an account with write permission. Alternatively, copy the `fas-essential/` source folder into a fresh checkout, review the diff, and commit. Do not copy a test database or `.env` into version control.

## Customer/admin separation and order email patch

Customer navigation contains Login/Signup when signed out and My Account/My Orders/Logout when signed in. Customer order lists and detail/actions are scoped to the session user; body/query IDs cannot select another account. Admin login is `/admin`, using `/api/auth/admin-login`; the ordinary login accepts customer accounts only. The existing `/api/admin` session and role checks remain mandatory. The development server also checks the API before serving the admin page; production checks it directly. Existing admin product, stock, customer and order controls are retained.

Set `ADMIN_EMAIL`, `RESEND_API_KEY`, and a domain-verified `MAIL_FROM` on the server, then restart. No new variables or database migrations are required. Never use `VITE_` prefixes. The existing 30-second mail worker sends an admin notification queued **after** a COD order commits or an online payment is verified as captured by the backend. Opening checkout, creating a Razorpay order and frontend success alone send nothing. Notifications snapshot the committed order/customer/shipping/items/amounts/payment/status/time data. Configure `ADMIN_EMAIL` before taking orders; this patch does not backfill historical orders.

The existing outbox primary key `admin-order:<order ID>` deduplicates notifications across verify/reconcile/webhook calls and different webhook event IDs. Resend receives the same key. A durable claim in the existing `next_attempt` field prevents concurrent or restarted workers from resending an admin notification. Successful jobs retain `sent_at`; keep these records to preserve deduplication.

**Delivery failure policy:** an admin send that fails, times out, or is interrupted is held with `next_attempt=9007199254740991`, not automatically retried. This prioritizes no duplicates: Resend only retains idempotency keys for [24 hours](https://resend.com/docs/dashboard/emails/idempotency-keys), so unlimited retries cannot guarantee that property. Inspect pending outbox jobs and the Resend dashboard. If delivery is confirmed, mark that job sent locally. Only after positively confirming that Resend did not accept it, release that exact job by setting `next_attempt=0`; do not delete its row or change its idempotency key. If delivery is uncertain, leave it held. Failed email never rolls back or changes the order/payment. Other existing customer mail retains its retry behavior. Missing mail credentials leave queued jobs pending without an attempt.

See `ACCESS_EMAIL_REPORT.md` for the patch scope, actual validation results, limitations and manual checks. The incremental `fas-essential-access-email.patch` applies to full-stack commit `2c6f978` using `git apply --index /path/to/fas-essential-access-email.patch`. It is separate from the original full-stack patch described above.
