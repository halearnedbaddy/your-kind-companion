# Paying-zee MVP – Project Status

This document tracks what has been completed so far and what remains until the MVP is fully built, tested, and deployed.

## 1. Completed so far

### 1.1 Repository & structure
- Monorepo initialized with `apps` and `packages` folders.
- Next.js (App Router, TypeScript, Tailwind) apps scaffolded:
  - `apps/web` – main user-facing app (buyers/sellers).
  - `apps/admin` – admin dashboard shell.
- Backend and worker apps scaffolded:
  - `apps/api` – Fastify + TypeScript server with basic health check.
  - `apps/worker` – BullMQ worker skeleton for background jobs.
- Shared packages created:
  - `packages/db` – Prisma schema, config, and generated client.
  - `packages/payments` – placeholder for M-Pesa client wrapper.
  - `packages/notifications` – placeholder for SMS/email wrappers.
  - `packages/shared` – placeholder for shared types/utilities.

### 1.2 Database & models
- Prisma initialized in `packages/db`.
- Core schema defined (and validated) for:
  - `User` (buyers, sellers, admins, KYC level, verification).
  - `Transaction` (amount, currency, buyer, seller contact, status, expiry, provider refs).
  - `Escrow` (held amount, provider account, release timestamp).
  - `Payout` (transaction, seller, amount, payout ref, status).
  - `Dispute` (transaction, reason, evidence URLs, status, resolution).
  - `Notification` (user/phone/email, channel, template, payload, status).
  - `AuditLog` (actor, action, details JSON, timestamp).
  - `LedgerEntry` (append-only ledger: account, amount, type, references).
- Prisma client generation wired and working.

### 1.3 API – first endpoints
- Fastify API with logging plus `/health` endpoint.
- Auth (temporary, for MVP bootstrap):
  - `POST /api/v1/auth/otp` – generate OTP for phone/email (in-memory store for now).
  - `POST /api/v1/auth/verify` – validate OTP, upsert `User`, return a temporary token.
- Payments:
  - `POST /api/v1/payments` – create payment link:
    - Creates `Transaction` in `PENDING` state.
    - Creates associated `Escrow` with `heldAmount = 0`.
    - Returns `{ payment_link, transaction_id, status }`.

### 1.4 Tooling & CI
- Root `package.json` configured as a workspace for `apps/*` and `packages/*`.
- Dev scripts available:
  - `npm run dev:web` – start `apps/web`.
  - `npm run dev:admin` – start `apps/admin`.
  - `npm run dev:api` – start `apps/api` with ts-node-dev.
  - `npm run dev:worker` – start `apps/worker` with ts-node-dev.
- Basic GitHub Actions workflow:
  - Installs dependencies.
  - Builds and (optionally) lints/tests the `web` and `admin` apps.

## 2. Remaining work (high-level roadmap)

### 2.1 Core buyer/seller flows
- Web UI in `apps/web`:
  - "Create payment link" page for buyers (hooked to `POST /api/v1/payments`).
  - Public payment page `/pay/[transactionId]` for buyers/sellers.
  - Seller acceptance UI (accept order, provide payout details).
  - Seller "mark delivered" flow with file upload (proof images).
  - Buyer confirmation page for marking as received.
- Backend endpoints:
  - `GET /api/v1/payments/:transaction_id` – fetch transaction status + metadata.
  - `POST /api/v1/payments/:transaction_id/deposit` – initiate M-Pesa C2B deposit.
  - `POST /api/v1/payments/:transaction_id/accept` – seller accepts.
  - `POST /api/v1/payments/:transaction_id/mark-delivered` – seller marks delivered + proof.
  - `POST /api/v1/payments/:transaction_id/confirm` – buyer confirms receipt.

### 2.2 M-Pesa integration & money movement
- Implement `/api/v1/webhooks/m-pesa` for C2B callbacks (sandbox first):
  - Validate signatures and handle idempotency.
  - Update `Transaction` → `ESCROWED` and adjust `Escrow` + `LedgerEntry`.
- Implement B2C payouts:
  - Service in `packages/payments` to initiate payouts.
  - Webhook handler for payout callbacks.
  - Status transitions on `Payout` and related ledger updates.
- Implement auto-refund & auto-release rules via BullMQ jobs:
  - Auto-refund if seller does not accept in 48 hours after deposit.
  - Auto-release if buyer does not confirm within 7 days of delivery (with reminders on day 5 and 6).

### 2.3 Notifications (SMS & email)
- Implement `packages/notifications`:
  - Africas Talking SMS client.
  - Email provider (SendGrid/SES) wrapper.
- Wire notification jobs into `apps/worker`:
  - Link created.
  - Deposit received.
  - Seller notified / accepted / marked delivered.
  - Buyer confirmation reminder(s).
  - Payout complete.
  - Dispute opened/resolved.

### 2.4 Disputes & admin dashboard
- Backend:
  - `POST /api/v1/disputes`  open dispute.
  - `GET /api/v1/admin/transactions`  filter/search.
  - `GET /api/v1/admin/disputes`  list disputes.
  - `POST /api/v1/admin/disputes/:id/resolve`  resolution outcomes.
  - `POST /api/v1/admin/refund`  manual refunds/payouts.
  - Reconciliation endpoints (ledger vs provider statements).
- Admin UI in `apps/admin`:
  - Transaction list + detail view.
  - User list with KYC indicators.
  - Dispute list/detail with evidence and comments.
  - Reconciliation dashboards and manual operations.

### 2.5 Auth, security, and compliance
- Replace temporary OTP logic with proper flow:
  - Integrate NextAuth.js in `apps/web` and `apps/admin`.
  - Move OTP storage to DB/Redis; integrate notifications.
  - Issue JWTs for API auth and protect endpoints.
- Security layers:
  - Rate limiting, input validation, and CSRF/XSS hardening.
  - Webhook secret validation and idempotency keys.
  - Encrypt sensitive fields at rest (phone numbers, payout details).
  - Audit logging for all money movement and admin actions.

### 2.6 Observability & operations
- Integrate Sentry in all apps (web, admin, api, worker).
- Expose metrics endpoints and configure basic dashboards (transactions, disputes, errors, queue health).
- Daily reconciliation job for M-Pesa statements.
- Database backups and point-in-time recovery configuration.

### 2.7 Testing & QA
- Unit tests (Jest) for core business logic and endpoints.
- E2E tests (Playwright/Cypress) for main flows:
  - Create link > deposit > accept > delivered > confirm > payout.
  - Auto-refund for non-accepted orders.
  - Dispute lifecycle.
- Load testing plan and execution for ~1k concurrent sessions.
- Basic security scan (OWASP-focused).

### 2.8 Deployment & docs
- Containerization: Dockerfiles for `apps/api` and `apps/worker`.
- Deploy targets:
  - Frontend: Vercel (or similar) for `apps/web` + `apps/admin`.
  - Backend: Render/AWS (or similar) for `apps/api` and `apps/worker`.
- Infrastructure as code (optional but recommended) for DB, Redis, S3, networking.
- Final documentation and runbooks (deployment, rollback, troubleshooting, admin SOPs).

## 3. Near-term next steps

Immediately upcoming tasks:
- Add `GET /api/v1/payments/:transaction_id` in `apps/api`.
- Add a "Create payment link" form in `apps/web` that calls the API.
- Create the public payment page shell (`/pay/[transactionId]`) in `apps/web`.
- Define initial environment variable list and sample `.env` files.
