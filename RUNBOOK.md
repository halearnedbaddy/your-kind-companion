# Paying-zee – Runbook & How It Works

This document explains how the Paying-zee escrow platform behaves end-to-end after deployment and how to run and test it in development.

## 1. High-level architecture

Paying-zee is structured as a TypeScript monorepo with four main runtime components:

- `apps/web` – Next.js frontend for buyers and sellers.
- `apps/admin` – Next.js admin dashboard for operations.
- `apps/api` – Fastify-based REST API that exposes all core endpoints.
- `apps/worker` – BullMQ worker that runs background jobs (notifications, retries, auto-release, auto-refund, reconciliation).

Shared packages:

- `packages/db` – Prisma schema, migrations, and generated DB client for PostgreSQL.
- `packages/payments` – M-Pesa C2B/B2C integration wrapper.
- `packages/notifications` – SMS (Africas Talking) and email client.
- `packages/shared` – common types, validation schemas, and utilities.

External dependencies:

- PostgreSQL – primary relational database.
- Redis – job queue backend for BullMQ.
- S3-compatible storage – file uploads (proof of delivery, dispute evidence).
- SMS/email providers – Africas Talking and an email provider.
- Safaricom M-Pesa – C2B deposits and B2C payouts.

## 2. How the app works end-to-end (after deployment)

### 2.1 Buyer flow – creating a payment link and paying

1. **Sign-in / verification**
   - Buyer visits the web app and requests an OTP (phone or email).
   - The system sends an OTP via SMS/email and verifies it.
   - A `User` record is created or updated and a session/JWT is issued.

2. **Create payment link**
   - Buyer opens the "Create payment link" screen.
   - They enter: amount, currency, product name, description, seller contact, and (optionally) expiry.
   - The frontend calls `POST /api/v1/payments`.
   - Backend creates a `Transaction` in `PENDING` state and an associated `Escrow` with `heldAmount = 0`.
   - Backend returns `payment_link`, `transaction_id`, and `status`.

3. **Share link & initiate payment**
   - Buyer shares the generated link with the seller (via DM/chat/etc.).
   - Buyer follows the payment link and chooses to "Pay with M-Pesa".
   - The frontend calls `POST /api/v1/payments/:id/deposit`.
   - Backend interacts with M-Pesa C2B to initiate a payment (e.g., STK push or paybill flow).

4. **M-Pesa C2B callback & escrow update**
   - Safaricom sends a C2B webhook to `/api/v1/webhooks/m-pesa`.
   - Backend validates the callback signature and ensures idempotency.
   - On success, it:
     - Marks the `Transaction` as `ESCROWED`.
     - Updates `Escrow.heldAmount` to the paid amount.
     - Writes `LedgerEntry` records for the deposit.
   - Notifications are enqueued: buyer and seller receive confirmation that funds are now in escrow.

### 2.2 Seller flow – accepting and marking delivered

1. **Seller views the payment link**
   - Seller opens the shared link (no account required).
   - They see the product, amount, and buyer info.

2. **Accept and provide payout details**
   - Seller accepts the order and provides payout details (e.g., M-Pesa phone).
   - Frontend calls `POST /api/v1/payments/:transaction_id/accept`.
   - Backend sets `Transaction.status` to `ACTIVE` and stores payout details.
   - A 48-hour auto-refund timer is scheduled.

3. **Mark as delivered**
   - Once the seller delivers the product/service, they open the same link and choose "Mark delivered".
   - Optionally uploads proof of delivery (images) which go to S3.
   - Frontend calls `POST /api/v1/payments/:transaction_id/mark-delivered`.
   - Backend sets status to `DELIVERED` and schedules an auto-release job for 7 days later, plus reminder jobs (day 5 and 6).
   - Notifications go to the buyer to confirm receipt.

### 2.3 Buyer confirmation and payouts

1. **Buyer confirms receipt**
   - Buyer follows the confirmation link from SMS/email or logs into the app and opens their transaction.
   - They click "Confirm received".
   - Frontend calls `POST /api/v1/payments/:transaction_id/confirm`.
   - Backend sets status to `COMPLETED` and creates a `Payout` record in `PENDING` status.

2. **Payout processing via M-Pesa B2C**
   - Worker picks up a payout job and calls the M-Pesa B2C API to send money to the sellers M-Pesa account.
   - Safaricom sends B2C callback(s) to a payout-specific webhook.
   - Backend validates callbacks, updates `Payout.status`, and writes corresponding `LedgerEntry` records:
     - Debit ESCROW account; credit seller account.
     - Allocate 0.5% of the transaction to the INSURANCE_FUND account.
   - Notifications go out to buyer and seller indicating payout completion.

3. **Auto-release & auto-refund**
   - Auto-refund: if the seller never accepts within 48 hours after funds reach escrow, a job automatically:
     - Initiates a refund via B2C/reversal.
     - Updates `Transaction.status` to `REFUNDED`/`CANCELLED`.
     - Writes ledger entries and sends notifications.
   - Auto-release: if buyer does not confirm within 7 days after delivery, a job automatically:
     - Marks `Transaction.status` as `COMPLETED`.
     - Processes the payout as above.
     - Sends notifications, while preserving the dispute window.

### 2.4 Disputes & admin operations

1. **Opening a dispute**
   - Either party can open a dispute when there is a problem.
   - Frontend calls `POST /api/v1/disputes` with `transaction_id`, `reason`, and evidence URLs.
   - Backend creates a `Dispute` in `OPEN` status and may pause auto-release if still pending.

2. **Admin review & resolution**
   - Admin logs into `apps/admin` and views open disputes.
   - They inspect evidence, transaction history, and ledger.
   - They choose an outcome:
     - Release funds to seller.
     - Refund buyer fully or partially.
   - Admin actions go through dedicated endpoints (e.g., `POST /api/v1/admin/disputes/:id/resolve`, `POST /api/v1/admin/refund`).
   - The system writes the necessary ledger entries and updates `Transaction`, `Payout`, and `Dispute` statuses.
   - All actions are logged in `AuditLog`.

3. **Reconciliation & reporting**
   - A daily job fetches or ingests M-Pesa statements.
   - Backend compares statement totals with internal `LedgerEntry` aggregates.
   - Admin dashboard surfaces mismatches for manual investigation.
   - Dashboard shows key metrics: daily volume, dispute rate, total escrowed, insurance fund balance, etc.

## 3. How to run the app in development

### 3.1 Prerequisites

- Node.js (LTS, e.g., 18+ or 20+).
- npm.
- PostgreSQL (local or remote) with a connection URL.
- Redis (for BullMQ worker).

### 3.2 Environment variables

At minimum, you will need:

- In `packages/db/.env`:
  - `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"`

- In a root-level `.env` or per-app environment configuration (exact wiring TBD as we integrate NextAuth and providers), variables like:
  - `PAYMENT_LINK_BASE_URL` – base URL for public payment links (e.g., `https://payingzee.example.com`).
  - M-Pesa credentials: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, etc.
  - Africas Talking: `AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME`.
  - Email provider: `SENDGRID_API_KEY` or equivalent.
  - Redis URL: `REDIS_URL`.

For development, placeholder/staging values are sufficient.

### 3.3 Initial setup

From the repo root:

1. **Install dependencies**

```bash
npm install
```

2. **Apply database migrations**

```bash
cd packages/db
npx prisma migrate dev --name init
cd ../..
```

This will apply the Prisma schema and create all required tables.

3. **(Optional) Seed development data**

Later we will add a seed script to insert test users, transactions, and disputes. For now, the DB will be empty after migration.

### 3.4 Running the services

From the repo root, in separate terminals:

```bash
npm run dev:web      # Start Next.js web app (buyers/sellers)
npm run dev:admin    # Start Next.js admin app
npm run dev:api      # Start Fastify API server
npm run dev:worker   # Start BullMQ worker
```

Typical local URLs:

- Web app: `http://localhost:3000`
- Admin app: `http://localhost:3001` (or another free port assigned by Next.js)
- API health: `http://localhost:4000/health`

### 3.5 Basic manual test flow in development

1. **Check API health**

```bash
curl http://localhost:4000/health
```

You should see `{ "status": "ok" }`.

2. **Test auth OTP (temporary)**

- Request an OTP:

```bash
curl -X POST http://localhost:4000/api/v1/auth/otp \
  -H "Content-Type: application/json" \
  -d '{ "phone": "+254700000000" }'
```

- Check the API logs for the generated OTP.
- Verify OTP:

```bash
curl -X POST http://localhost:4000/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{ "phone": "+254700000000", "otp": "<CODE_FROM_LOG>" }'
```

3. **Create a payment link**

```bash
curl -X POST http://localhost:4000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 14000,
    "currency": "KES",
    "product_name": "Sneakers",
    "description": "White size 42",
    "seller_contact": "+254711111111",
    "expiry_days": 30
  }'
```

You should receive a response with `payment_link`, `transaction_id`, and `status`.

4. **Front-end testing**

- Go to the web app URL and, once wired, use the UI to:
  - Log in with OTP.
  - Create payment links.
  - Navigate to shared payment pages.

As more endpoints and UI components are wired up, you will be able to walk through the full acceptance and delivery flows in the browser.

## 4. Running in staging/production

### 4.1 High-level deployment plan

A typical deployment setup:

- Frontend (`apps/web`, `apps/admin`):
  - Deployed to Vercel or a similar platform (build from `main` or a release branch).
- Backend (`apps/api`, `apps/worker`):
  - Containerized with Docker.
  - Deployed to Render, AWS ECS/Fargate, or similar.
- Database & Redis:
  - Managed PostgreSQL and Redis instances (e.g., RDS/Cloud SQL + Redis Cloud).
- Storage:
  - S3 bucket or equivalent.
- Edge / networking:
  - HTTPS termination and WAF/Firewall (e.g., Cloudflare or AWS ALB) in front of web/API.

### 4.2 Typical production deployment steps

1. Build and push Docker images for `apps/api` and `apps/worker`.
2. Apply database migrations against the production database (`prisma migrate deploy`).
3. Update environment variables/secrets in the hosting environment.
4. Deploy new versions of frontend and backend services.
5. Run smoke tests:
   - Health checks (`/health`).
   - Simple auth + create payment link flow in sandbox mode.
6. Monitor logs, metrics, and error reporting (Sentry).

### 4.3 Health checks and monitoring

- `apps/api`:
  - Health endpoint: `GET /health`.
  - Additional readiness checks (DB/Redis connectivity) can be added.
- `apps/worker`:
  - Monitored via queue depth, job failure counts, and logs.
- Observability stack:
  - Sentry: captures uncaught exceptions and performance traces.
  - Metrics: exported in Prometheus format for key KPIs.

### 4.4 Troubleshooting common issues

- **Database connection errors**:
  - Verify `DATABASE_URL`.
  - Check DB network rules (VPC, firewall, security groups).
- **Redis/queue not processing jobs**:
  - Verify `REDIS_URL` and that Redis is reachable.
  - Check worker logs for connection or authentication issues.
- **Webhook failures from M-Pesa**:
  - Confirm public webhook URL is reachable and matches the configured URL at Safaricom.
  - Check API logs for signature validation or parsing errors.
- **Notification issues (SMS/email)**:
  - Check provider dashboards for rate limits or credential problems.
  - Ensure correct sender IDs and sandbox phone numbers in non-production.

## 5. Next updates to this runbook

As the project progresses, this runbook should be updated to include:

- Exact list of environment variables per service.
- Final deployment pipelines (GitHub Actions steps for staging and production).
- Detailed admin SOPs for:
  - Refunds and manual payouts.
  - Dispute handling.
  - Reconciliation and reporting.
- Links to monitoring dashboards and SLO definitions.
