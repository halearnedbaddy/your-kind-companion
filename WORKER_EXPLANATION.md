# Worker Service Explanation

## What is the Worker?

The **Worker** (`apps/worker`) is **NOT a frontend application**. It is a **backend service** that runs in the background to process background jobs and scheduled tasks.

## Purpose

The worker service handles asynchronous tasks that don't need to be processed immediately when a user makes a request. This includes:

1. **Auto-refund jobs**: Automatically refund buyers if sellers don't accept orders within 48 hours
2. **Auto-release jobs**: Automatically release funds to sellers if buyers don't confirm receipt within 7 days
3. **Reminder jobs**: Send SMS/email reminders to buyers about confirming receipt
4. **Notification jobs**: Send SMS/email notifications for various events
5. **Reconciliation jobs**: Daily reconciliation of payments with M-Pesa statements

## How It Works

The worker uses **BullMQ** (a job queue library) and **Redis** (as the queue backend):

```
┌─────────┐         ┌─────────┐         ┌──────────┐
│   API   │────────▶│  Redis  │────────▶│  Worker  │
│ Service │  Enqueue│  Queue  │  Process│  Service │
└─────────┘  Jobs   └─────────┘  Jobs   └──────────┘
```

### Flow Example:

1. **API receives request**: Buyer confirms receipt
2. **API enqueues job**: Schedules auto-release job for 7 days later
3. **Worker picks up job**: After 7 days, worker processes the job
4. **Worker calls API**: Worker makes HTTP request to API to process payout
5. **API processes payout**: Updates database and initiates M-Pesa payout

## Current Implementation

The worker is located at: `apps/worker/src/index.ts`

### Current Job Types:

1. **`auto-refund-transaction`**: Refunds buyer if seller doesn't accept
2. **`auto-release-transaction`**: Releases funds if buyer doesn't confirm
3. **`buyer-confirm-reminder`**: Sends reminder to buyer

### How to Run:

```bash
# From project root
npm run dev:worker
```

Or directly:
```bash
cd apps/worker
npx ts-node-dev src/index.ts
```

## Why No Frontend?

The worker doesn't need a frontend because:
- It runs as a background service (like a daemon)
- It doesn't interact with users directly
- It processes jobs automatically based on schedules
- Admins can monitor it through logs and metrics (not a UI)

## Monitoring the Worker

You can monitor the worker through:

1. **Console Logs**: The worker logs all job processing
2. **Redis Queue**: Check queue depth in Redis
3. **API Logs**: See when worker calls API endpoints
4. **Database**: Check job results in the database
5. **Metrics**: (Future) Prometheus metrics endpoint

## Example Worker Logs

```
Processing job auto-release-transaction abc123 { transactionId: 'tx_123' }
Job completed abc123
Processing job buyer-confirm-reminder def456 { transactionId: 'tx_123', reminderDay: 5 }
Job completed def456
```

## Frontend vs Backend Services

| Service | Type | Has Frontend? | Purpose |
|---------|------|---------------|---------|
| `apps/web` | Frontend | ✅ Yes | Buyer/seller interface |
| `apps/admin` | Frontend | ✅ Yes | Admin dashboard |
| `apps/api` | Backend | ❌ No | REST API server |
| `apps/worker` | Backend | ❌ No | Background job processor |

## Summary

- **Worker = Backend Service** (not a frontend)
- Runs in the background to process scheduled jobs
- Uses BullMQ + Redis for job queuing
- No UI needed - monitored through logs and metrics
- Essential for automated operations (auto-refund, auto-release, reminders)

