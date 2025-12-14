# Paying-zee MVP Implementation Plan
Problem: Build a production-ready escrow payment platform focused on social commerce in Kenya, integrating M-Pesa for deposits and payouts, with SMS-first notifications, a simple buyer/seller flow, and an admin dashboard for disputes and reconciliation.
## Goals and Constraints
Deliver an MVP in ~8–10 weeks with a responsive web app, secure escrow flows, and basic admin tooling.
Support at least 100 completed transactions with <5% dispute rate.
Prioritize correctness of money flows, auditability, and resilience of webhooks over cosmetic features.
## High-level Architecture
Use a monorepo with three main apps (`web`, `api`, `admin`) and shared packages (`db`, `payments`, `notifications`).
Frontend: Next.js (App Router) + React + TypeScript + Tailwind CSS. `web` for buyer/seller flows (payment pages, dashboards where applicable). `admin` as a separate Next.js app or a route group inside `web/admin`, sharing UI components and auth, but conceptually treated as a separate app in the monorepo.
Backend API: Node.js with Express or Fastify using TypeScript, exposing REST endpoints under `/api/v1`. Strong schema validation with Zod or similar, plus OpenAPI generation for Postman collection import.
ORM and DB: PostgreSQL with Prisma for schema management, migrations, and typed DB access. Encapsulate models and migrations in `/packages/db`.
Payments: Dedicated `/packages/payments` to wrap M-Pesa C2B and B2C APIs (sandbox + production). This package handles authentication, signature validation, idempotency keys, and provider-specific error handling.
Notifications: `/packages/notifications` with pluggable SMS gateway (Africa’s Talking primary, Twilio optional), plus basic email via a provider like SendGrid or SES. All templates centralized with short, parameterized versions for SMS.
Queues and Jobs: Redis-backed BullMQ worker inside the `api` app for background jobs (retrying callbacks, delayed auto-release, payout retries, reminder SMS, reconciliation jobs).
Storage: S3-compatible object storage (e.g. AWS S3 or DigitalOcean Spaces) for delivery proof images and dispute evidence. Accessed from the `api` app via signed URLs.
Auth: NextAuth.js for `web` and `admin`, supporting email/phone OTP via the notifications package. Backend REST API secured via JWTs issued by the auth layer, plus admin-specific roles and permissions.
Monitoring and Logging: Sentry SDK integrated into Next.js apps and API for error monitoring. Basic metrics (Prometheus format) from the API, scraped by Prometheus and visualized in Grafana or a hosted alternative. Structured JSON logging with log correlation IDs for transaction flows.
CI/CD: GitHub Actions for lint/test/build on PR, with separate workflows to deploy frontend (Vercel) and backend (Render/AWS ECS) from main branches. Dockerfiles for API and worker; Vercel used directly for Next.js apps or Docker-based deployment if self-hosted.
Infrastructure: Optional `/infra` folder with Terraform configs for managed PostgreSQL, Redis, S3 bucket, and basic networking (TLS termination, domains). HSTS and TLS 1.3 configured at the edge (e.g. Cloudflare or load balancer).
## Data Model Outline
Implement Prisma models for users, transactions, escrows, payouts, disputes, notifications, audit_logs, plus derived tables for ledgers and reconciliation if needed.
Model ledger as an append-only table (`ledger_entries`) with references to transactions and payouts, capturing debits, credits, balances, and metadata.
Use enum fields for transaction status and dispute status to keep business logic explicit and enforceable.
Encrypt sensitive columns (e.g. phone numbers, payout account details) using application-level encryption with a KMS-managed key (or at least a rotated symmetric key from environment variables in MVP).
## Core Flows
### Buyer Flow
1) Buyer visits the web app, requests OTP, signs in, and creates a payment link specifying amount, currency, product name, description, seller contact, and expiry.
2) API creates a `transactions` record in `pending` state, plus an associated `escrows` row with held_amount set to 0 and ledger initialized with an intent entry.
3) System generates a short payment link with a unique, non-guessable token mapped to the transaction.
4) Buyer follows the link, initiates deposit via M-Pesa C2B flow; API returns payment instructions or provider payload.
5) On successful provider callback, API validates signature, marks transaction `escrowed`, updates `escrows.held_amount`, and appends ledger entries (deposit credit to escrow, liability to user).
6) SMS notifications sent to buyer and seller (link to accept page for seller).
### Seller Flow
1) Seller opens the shared payment link (no account required initially), sees transaction details, and accepts the order.
2) On accept, API transitions transaction status from `escrowed` to `active`, records seller payout details (phone for M-Pesa B2C) either inline or by prompting seller.
3) SMS confirmation sent to both parties; ledger entry records the acceptance and holds remain unchanged.
4) When seller marks delivered and optionally uploads proof (images), API stores files in S3 and records delivery timestamp and URLs in transaction/dispute-related tables.
5) System schedules auto-release job in 7 days, with reminder jobs on days 5 and 6.
### Buyer Confirmation and Payout
1) Buyer receives SMS and/or email to confirm receipt via a secure link.
2) Buyer confirms, API transitions transaction to `completed`, enqueues a payout job to send funds via M-Pesa B2C to seller.
3) On successful B2C callback, API finalizes payout record, appends ledger entries (debit escrow, credit seller, insurance allocation), and updates `escrows.released_at`.
4) Buyer can still open a dispute within 14 days after release, flagged for admin with separate dispute state.
### Auto-refund and Timeouts
If seller does not accept within 48 hours after deposit, a scheduled job triggers auto-refund via M-Pesa B2C (or equivalent C2B reversal if supported by the provider), marking transaction as `cancelled` or `refunded` and recording ledger entries.
If buyer does not confirm within 7 days of seller marking delivered, system auto-releases funds and marks transaction `completed`, logging reminder notifications and providing a 14-day post-release dispute window.
Feature flags stored in config (DB or env) can toggle auto-release and insurance fund behavior per environment.
### Disputes and Admin
Any party can open a dispute via the web app, providing reason and evidence URLs. API sets dispute status to `open`, associates it with the transaction, and pauses auto-release if still pending.
Admin dashboard lets staff view disputes, evidence, and history, and choose an outcome: full refund, partial refund, or release; API updates ledger, payouts, and transaction status accordingly.
All admin actions create audit log entries capturing actor, action, and details (including previous and new values where needed).
Reconciliation endpoints and views allow admins to compare internal ledger totals against M-Pesa statements, highlighting mismatches.
## Security and Compliance
Use HTTPS everywhere with TLS 1.3 enforced at the edge and HSTS headers from all apps.
Store only necessary PII, encrypting sensitive fields at rest and avoiding storage of card data entirely.
Implement per-IP and per-phone rate limiting on auth and payment endpoints, and consider basic device fingerprinting through browser fingerprints or token-based correlation.
Ensure strong webhook secret validation and idempotency: each provider callback should be keyed by a unique reference and processed exactly once.
Maintain detailed audit logs for all money-related actions, including automated job executions and webhook processing decisions.
## Sprint Plan and Timeline
Assume 2-week sprints, with a goal to have a usable demo by the end of Sprint 3 and full MVP by Sprint 5, with Sprint 6 as a buffer.
### Sprint 0 (Setup and Foundations)
Establish the monorepo structure with `apps` and `packages` folders.
Integrate Next.js (App Router) for `web` and stub `admin` app.
Set up `api` backend with TypeScript, Express/Fastify, and initial REST skeleton.
Define Prisma schema for core tables and run initial migrations.
Set up basic auth with NextAuth.js OTP flow stubs and wire to user model.
Configure GitHub Actions for lint/test/build and basic Dockerfiles for API and worker.
### Sprint 1 (Payment Link Creation and M-Pesa Deposit)
Implement buyer sign-in and payment link creation UI and endpoints.
Finish core transaction and escrow models, including status transitions for `pending` to `escrowed`.
Implement M-Pesa C2B integration in sandbox: initiation endpoint and webhook handler.
Handle idempotent deposit callbacks, signature verification, and basic failure modes.
Emit SMS/email notifications for link creation and deposit receipt.
Add unit tests for API endpoints and webhook handlers for deposit flow.
### Sprint 2 (Seller Acceptance, Delivery, and Notifications)
Implement seller acceptance flow: accept page, payout detail capture, and status changes to `active`.
Implement seller mark-delivered endpoint and UI, including file upload to S3 for proof.
Add SMS notifications for seller notified, seller accepted, and seller marked delivered.
Introduce BullMQ-based job queue for background tasks (notifications, reminders, retries).
Wire initial auto-release scheduling jobs (without full logic for disputes yet).
Expand tests to cover seller acceptance and delivery flows.
### Sprint 3 (Buyer Confirmation, Payout, Ledger, and Reconciliation)
Implement buyer confirmation UI and endpoints, including secure links.
Integrate M-Pesa B2C payouts for seller, including callback handling and error retries.
Finalize ledger model and ensure all flows write append-only entries.
Implement daily reconciliation job and basic API endpoints to surface reconciliation summaries.
Include insurance fund allocation in ledger and reporting fields.
Add integration tests for full end-to-end flow from deposit to payout.
### Sprint 4 (Admin Dashboard, Disputes, and Manual Operations)
Build admin dashboard UI within `admin` app for viewing transactions, users, and disputes.
Implement endpoints for admin manual refund, manual payout triggers, and dispute resolution.
Add evidence view and comment threads for disputes.
Implement reconciliation views that compare ledger vs provider statements.
Ensure full audit logging of admin actions.
Increase test coverage around disputes and admin operations.
### Sprint 5 (Hardening, Monitoring, Performance, and Staging)
Integrate Sentry and basic metrics endpoints; set up dashboards for key SLOs.
Conduct security review against OWASP basics and fix identified issues.
Run load tests targeting 1k concurrent sessions and address bottlenecks.
Polish UI for mobile responsiveness and a11y.
Set up stable staging environment with representative data and complete runbooks.
### Sprint 6 (Buffer, Launch Preparation, and Production Deploy)
Use as buffer for missed work from earlier sprints and final bug fixes.
Finalize production infrastructure (Terraform or equivalent) and cutover plan.
Document deployment, rollback, and troubleshooting procedures for payments and webhooks.
Prepare admin SOPs for refunds, disputes, and reconciliation.
Validate all acceptance tests and sign off on launch readiness.
## Open Questions and Assumptions
Assume M-Pesa sandbox credentials and Africa’s Talking sandbox are available by Sprint 1.
Assume a single currency (KES) for MVP, with multi-currency support deferred.
Assume WhatsApp integration and in-app chat are post-MVP, to be toggled behind feature flags.
Clarify hosting preferences (Vercel vs self-hosted) and logging/monitoring stack (self-hosted vs SaaS) early in Sprint 0.
Clarify whether admins and support staff will use SSO or just email/OTP for launch.