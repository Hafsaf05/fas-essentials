# FAS Essentials — access and admin email patch

Base: `2c6f978` (existing full-stack delivery). Targeted inspection only; no broad re-audit.

## Files changed

| Files | Change |
| --- | --- |
| `server/app.ts` | Server gate for `/admin`, role-specific login endpoint using existing auth rate limit, post-commit COD notification hook. Existing customer order scope and blanket admin API guard retained. |
| `server/store.ts` | Post-commit notification hook after backend-validated captured payment; stock/payment transitions unchanged. |
| `server/mail.ts` (new), `server/index.ts` | Extract existing mail worker, add complete admin order payload, unique outbox key and durable send claim; safe failure logging. |
| `src/App.tsx`, `src/components/AdminEntry.tsx` (new) | Separate pathname-based admin entry/login; no customer header/footer/cart wrapper around administration. Existing Admin component loads only for an admin session. |
| `src/components/Header.tsx`, `src/components/Account.tsx` | Customer Login/Signup and My Account/My Orders/Logout navigation; remove admin management link. Existing visual classes preserved. |
| `vite.config.ts` | Development `/admin` page checks the API's session gate and fails closed when unavailable. |
| `tests/commerce.test.ts` | Existing tests use the separate admin login endpoint. |
| `tests/access-email.test.ts` (new) | Three focused integration tests for access isolation, notification content/failure and payment replay deduplication. |
| `tests/browser/store.spec.ts` | Existing three journeys updated for separate navigation/login; customer admin denial/logout and admin stock editing assertions. |
| `.env.example`, `README.md`, this report | Runtime admin recipient, setup, access, notification recovery and actual validation results. |

Untouched: database module/migrations/table and column names; `server/payments.ts`; security middleware, CSRF/origin checks, cookie flags and existing rate limits; password reset implementation; cart/stock/coupon/review/wishlist business logic; existing `Admin.tsx` management controls; styling/assets; Docker/deployment configuration; package manifest/lockfile and dependencies. No schema migrations or new environment variables.

## Access behavior

- Guest navigation: Login, Signup. Signed-in navigation: My Account, My Orders, Logout. Store search/cart and logo retain their existing behavior. No admin link in customer UI.
- Customer order APIs derive identity from the session and show only that user's orders. Foreign order detail/actions return 404 without order data. Extra checkout `userId` is rejected; list query/body identity values cannot expand scope.
- `/admin` is entered directly and presents its own admin login to guests. A customer session gets HTTP 403 for the page and every admin API. Guest admin data access returns 401. Ordinary login accepts customer accounts; admin login accepts administrators and rejects an existing customer session.
- Administrators retain all existing order/customer/product/stock management controls.

## Email and failure behavior

Set existing server-only `ADMIN_EMAIL`, `RESEND_API_KEY`, `MAIL_FROM`; placeholders remain empty in the example. COD notification queues after the validated order/stock transaction commits. Online notification queues only after backend-confirmed captured payment, including verified webhooks. Payment creation/frontend success alone does not queue it.

Content: order ID, UTC creation time, name/email/phone, shipping address, item title/variant/color/quantity/unit and line price, subtotal/discount/shipping/total, payment method/status and order status. No credentials or tokens are included or logged.

`admin-order:<order ID>` is unique in the existing outbox. Duplicate checkout/verify/webhook events cannot create another notification; the same ID goes to Resend. A durable claim prevents concurrent workers or restart from repeating a send. Failed or interrupted admin sends remain held for manual review, never rolled back into order/payment state. Unlike existing customer mail, they do not automatically retry: this avoids duplicates after Resend's 24-hour idempotency retention. Confirm acceptance/non-acceptance in Resend before resolving a held job; instructions are in README. This is an at-most-once automatic attempt policy, not a guarantee of inbox delivery during service failure. Configure the recipient before accepting orders; no historical backfill.

## Tests actually run

| Check | Actual result |
| --- | --- |
| Original six API/database tests | PASS, 6/6. Existing stock races, payment state/refunds, reset expiry/single use and admin edits remain covered. |
| New access/notification API tests | PASS, 3/3. Real Express/SQLite; signup/login/bad password/logout, own/foreign orders, user ID query/body tampering, all 14 existing admin method/routes denied to customer, admin page/login, all-order access, product/stock/status updates. |
| COD notification + email failure | PASS with injected HTTP transport. Correct full payload, one admin message, stock deducted once; simulated transport failure leaves committed order/payment unchanged and notification held. **Real Resend/inbox receipt NOT TESTED.** |
| Payment verification/webhook notification replay | PASS with injected gateway and locally signed webhook requests. No pre-capture notification; invalid signature rejected; duplicate verify and same/different event-ID replays produce one notification/send. **Real Razorpay test-mode checkout/capture/webhook/refund NOT TESTED.** |
| Existing browser journeys | PASS, 3/3 using real Chromium 153, real API/database, no API interception. Shopper search/cart/coupon/COD/own order history/logout and admin page/API denial; separate admin login/product/stock edit; mobile nav/contact submission. |
| Production page/cookies smoke check | PASS using built HTML and HTTPS-origin Express configuration: guest admin login HTML 200, customer 403, admin HTML 200; Secure/HttpOnly/SameSite=Lax cookie flags. Not a deployed TLS/proxy test. |
| TypeScript (`npm run lint`) | PASS. |
| Production build (`npm run build`) | PASS. |
| `git diff --check` | PASS. |

The initial browser attempt could not launch because the persisted Chromium binary was truncated. It was restored from its existing compressed distribution outside the repository; all three browser tests then executed and passed. No app dependency/configuration workaround was added.

External credentials were not supplied. Simulated transport results do not establish real provider acceptance or inbox delivery. Real Resend delivery, Razorpay provider scenarios and deployed HTTPS infrastructure remain NOT TESTED.

## Operator configuration

1. Set the existing email variables with a verified Resend sender; retain `ADMIN_EMAIL` at runtime. Remove bootstrap `ADMIN_PASSWORD` after account creation.
2. Restart the API. Enter `/admin` directly; use a separate browser profile or sign out of the customer session first.
3. Place a real COD test order and confirm the notification in the admin inbox. Test an email outage and inspect the held outbox job; follow the documented recovery procedure.
4. With real Razorpay test keys/webhook secret, run capture, verify, webhook replay and refund scenarios; check that the admin receives only one notification per order.
5. Apply the incremental Git patch to `2c6f978`, or use the updated source ZIP. No database migration, new package or Docker/deployment change is needed. Nothing was deployed or pushed remotely.
