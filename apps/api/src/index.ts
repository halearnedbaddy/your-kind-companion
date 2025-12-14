import fastify from 'fastify';
import { z } from 'zod';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
import crypto from 'crypto';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
const { initiateC2BPayment, initiateB2CPayout } = require('../../../packages/payments/src/mpesaClient');

// Type for Prisma transaction client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaTransaction = any;

const app = fastify({ logger: true });
const prisma = new PrismaClient();

const redisConnection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');
const jobsQueue = new Queue('payingzee-jobs', { connection: redisConnection });

// Simple in-memory OTP store for early development.
// TODO: move to persistent storage (DB/Redis) and integrate notifications package.
const otpStore = new Map<string, { code: string; expiresAt: number }>();

app.get('/health', async () => ({ status: 'ok' }));

app.post('/api/v1/auth/otp', async (request, reply) => {
  const schema = z
    .object({
      phone: z.string().min(3).optional(),
      email: z.string().email().optional(),
    })
    .refine((data) => data.phone || data.email, {
      message: 'phone or email is required',
      path: ['phone'],
    });

  const { phone, email } = schema.parse(request.body);
  const key = phone ?? (email as string);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(key, { code, expiresAt });

  app.log.info({ phone, email, code }, 'Generated OTP (dev-only; do not log in prod)');

  // TODO: send SMS/email via notifications package

  return reply.send({ success: true });
});

app.post('/api/v1/auth/verify', async (request, reply) => {
  const schema = z
    .object({
      phone: z.string().min(3).optional(),
      email: z.string().email().optional(),
      otp: z.string().length(6),
    })
    .refine((data) => data.phone || data.email, {
      message: 'phone or email is required',
      path: ['phone'],
    });

  const { phone, email, otp } = schema.parse(request.body);
  const key = phone ?? (email as string);
  const entry = otpStore.get(key);

  if (!entry || entry.code !== otp || entry.expiresAt < Date.now()) {
    return reply.status(400).send({ error: 'Invalid or expired OTP' });
  }

  otpStore.delete(key);

  let user;
  if (phone) {
    user = await prisma.user.upsert({
      where: { phone },
      update: { verified: true },
      create: { phone, verified: true, role: 'BUYER' },
    });
  } else {
    const emailAddress = email as string;
    user = await prisma.user.upsert({
      where: { email: emailAddress },
      update: { verified: true },
      create: { email: emailAddress, verified: true, role: 'BUYER' },
    });
  }

  // TODO: replace with proper JWT + NextAuth integration.
  const token = crypto.randomBytes(24).toString('hex');

  return reply.send({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
  });
});

const createPaymentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().min(1),
  product_name: z.string().min(1),
  description: z.string().optional(),
  seller_contact: z.string().min(3),
  expiry_days: z.number().int().positive().max(90).optional().default(30),
});

app.post('/api/v1/payments', async (request, reply) => {
  const body = createPaymentSchema.parse(request.body);

  // TODO: replace with real auth middleware; for now allow optional buyer id header.
  const buyerId = request.headers['x-user-id'] as string | undefined;

  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (body.expiry_days ?? 30) * 24 * 60 * 60 * 1000,
  );

  const tx = await prisma.transaction.create({
    data: {
      transactionId,
      buyerId: buyerId ?? null,
      sellerContact: body.seller_contact,
      amount: body.amount,
      currency: body.currency,
      status: 'PENDING',
      productName: body.product_name,
      description: body.description ?? null,
      expiresAt,
      escrow: {
        create: {
          heldAmount: 0,
        },
      },
    },
    include: {
      escrow: true,
    },
  });

  const baseUrl = process.env.PAYMENT_LINK_BASE_URL ?? 'http://localhost:3000';
  const paymentLink = `${baseUrl}/pay/${tx.transactionId}`;

  return reply.send({
    payment_link: paymentLink,
    transaction_id: tx.transactionId,
    status: tx.status,
  });
});

app.get('/api/v1/payments/:transaction_id', async (request, reply) => {
  const schema = z.object({ transaction_id: z.string().min(1) });
  const { transaction_id } = schema.parse(request.params as any);

  const tx = await prisma.transaction.findUnique({
    where: { transactionId: transaction_id },
    include: {
      escrow: true,
      payouts: true,
      disputes: true,
    },
  });

  if (!tx) {
    return reply.status(404).send({ error: 'Transaction not found' });
  }

  return reply.send({
    transaction_id: tx.transactionId,
    status: tx.status,
    amount: tx.amount,
    currency: tx.currency,
    seller_contact: tx.sellerContact,
    seller_payout_contact: tx.sellerPayoutContact,
    product_name: tx.productName,
    description: tx.description,
    expires_at: tx.expiresAt,
    escrowed_amount: tx.escrow?.heldAmount ?? 0,
    delivered_at: tx.deliveredAt,
    delivery_proof_urls: tx.deliveryProofUrls ?? null,
  });
});

// Public endpoint: open a dispute
app.post('/api/v1/disputes', async (request, reply) => {
  const schema = z.object({
    transaction_id: z.string().min(1),
    opened_by: z.string().min(1),
    reason: z.string().min(3),
    evidence_urls: z.array(z.string().url()).optional(),
  });

  const { transaction_id, opened_by, reason, evidence_urls } = schema.parse(
    request.body ?? {},
  );

  const tx = await prisma.transaction.findUnique({ where: { transactionId: transaction_id } });

  if (!tx) {
    return reply.status(404).send({ error: 'Transaction not found' });
  }

  const dispute = await prisma.dispute.create({
    data: {
      transactionId: tx.id,
      openedBy: opened_by,
      reason,
      evidenceUrls: evidence_urls ? (evidence_urls as any) : undefined,
    },
  });

  // TODO: notify admins via notifications package.

  return reply.send({ id: dispute.id, status: dispute.status });
});

// Admin: list transactions with basic filters
app.get('/api/v1/admin/transactions', async (request, reply) => {
  const schema = z.object({
    status: z.string().optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  });

  const { status, q, limit } = schema.parse(request.query as any);

  const where: any = {};
  if (status) where.status = status as any;
  if (q) {
    where.OR = [
      { transactionId: { contains: q, mode: 'insensitive' } },
      { sellerContact: { contains: q, mode: 'insensitive' } },
    ];
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit ?? 50,
  });

  return reply.send({ items: transactions });
});

// Admin: get single transaction with related info
app.get('/api/v1/admin/transactions/:transaction_id', async (request, reply) => {
  const schema = z.object({ transaction_id: z.string().min(1) });
  const { transaction_id } = schema.parse(request.params as any);

  const tx = await prisma.transaction.findUnique({
    where: { transactionId: transaction_id },
    include: {
      escrow: true,
      payouts: true,
      disputes: true,
      ledgerEntries: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!tx) {
    return reply.status(404).send({ error: 'Transaction not found' });
  }

  return reply.send({ transaction: tx });
});

// Admin: list disputes
app.get('/api/v1/admin/disputes', async (request, reply) => {
  const schema = z.object({
    status: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  });

  const { status, limit } = schema.parse(request.query as any);

  const where: any = {};
  if (status) where.status = status as any;

  const disputes = await prisma.dispute.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit ?? 50,
    include: {
      transaction: true,
    },
  });

  return reply.send({ items: disputes });
});

// Admin: resolve a dispute
app.post('/api/v1/admin/disputes/:id/resolve', async (request, reply) => {
  const paramsSchema = z.object({ id: z.string().min(1) });
  const bodySchema = z.object({
    outcome: z.enum(['REFUND', 'RELEASE', 'PARTIAL']),
    notes: z.string().optional(),
    partial_amount: z.number().int().positive().optional(),
  });

  const { id } = paramsSchema.parse(request.params as any);
  const { outcome, notes, partial_amount } = bodySchema.parse(request.body ?? {});

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      transaction: { include: { escrow: true } },
    },
  });

  if (!dispute || !dispute.transaction) {
    return reply.status(404).send({ error: 'Dispute or transaction not found' });
  }

  // For MVP, we only record resolution and optional notes; money movement can be handled
  // via a separate admin refund endpoint.
  const updated = await prisma.dispute.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      resolution: `${outcome}${partial_amount ? `:${partial_amount}` : ''}`,
    },
  });

  // TODO: write audit log and potentially enqueue manual payout/refund jobs.

  return reply.send({ id: updated.id, status: updated.status, resolution: updated.resolution });
});

// Admin: manual refund or payout
app.post('/api/v1/admin/refund', async (request, reply) => {
  const schema = z.object({
    transaction_id: z.string().min(1),
    direction: z.enum(['BUYER', 'SELLER']),
    amount: z.number().int().positive(),
    reason: z.string().optional(),
  });

  const { transaction_id, direction, amount, reason } = schema.parse(request.body ?? {});

  const tx = await prisma.transaction.findUnique({
    where: { transactionId: transaction_id },
    include: { escrow: true },
  });

  if (!tx || !tx.escrow) {
    return reply.status(404).send({ error: 'Transaction or escrow not found' });
  }

  if (tx.escrow.heldAmount < amount) {
    return reply
      .status(400)
      .send({ error: 'Insufficient funds held in escrow for manual operation' });
  }

  const now = new Date();

  if (direction === 'BUYER') {
    // Manual refund to buyer: move funds from ESCROW to USER_BALANCE
    await prisma.$transaction(async (trx: PrismaTransaction) => {
      await trx.escrow.update({
        where: { id: tx.escrow!.id },
        data: {
          heldAmount: tx.escrow!.heldAmount - amount,
          releasedAt: tx.escrow!.heldAmount - amount === 0 ? now : tx.escrow!.releasedAt,
        },
      });

      await trx.ledgerEntry.create({
        data: {
          refType: 'TRANSACTION',
          refId: tx.id,
          entryType: 'DEBIT',
          account: 'ESCROW',
          amount,
          currency: tx.currency,
          transactionId: tx.id,
        },
      });

      await trx.ledgerEntry.create({
        data: {
          refType: 'TRANSACTION',
          refId: tx.id,
          entryType: 'CREDIT',
          account: 'USER_BALANCE',
          amount,
          currency: tx.currency,
          transactionId: tx.id,
        },
      });
    });

    // TODO: initiate actual refund via M-Pesa.
  } else {
    // Manual payout to seller: create payout and use B2C stub
    if (!tx.sellerPayoutContact) {
      return reply
        .status(400)
        .send({ error: 'Seller payout contact is not set; cannot process payout' });
    }

    const payout = await prisma.payout.create({
      data: {
        transactionId: tx.id,
        amount,
        status: 'PENDING',
      },
    });

    const mpesaResult = await initiateB2CPayout({
      transactionId: tx.transactionId,
      payoutId: payout.id,
      amount,
      currency: tx.currency,
      recipientPhone: tx.sellerPayoutContact,
    });

    await prisma.$transaction(async (trx: PrismaTransaction) => {
      await trx.escrow.update({
        where: { id: tx.escrow!.id },
        data: {
          heldAmount: tx.escrow!.heldAmount - amount,
          releasedAt: tx.escrow!.heldAmount - amount === 0 ? now : tx.escrow!.releasedAt,
        },
      });

      await trx.payout.update({
        where: { id: payout.id },
        data: {
          payoutRef: mpesaResult.providerRef,
          status: mpesaResult.status,
          processedAt: mpesaResult.status === 'SUCCESS' ? now : null,
        },
      });

      // Ledger: debit ESCROW, credit PROVIDER_SETTLEMENT for manual payout
      await trx.ledgerEntry.create({
        data: {
          refType: 'PAYOUT',
          refId: payout.id,
          entryType: 'DEBIT',
          account: 'ESCROW',
          amount,
          currency: tx.currency,
          transactionId: tx.id,
          payoutId: payout.id,
        },
      });

      await trx.ledgerEntry.create({
        data: {
          refType: 'PAYOUT',
          refId: payout.id,
          entryType: 'CREDIT',
          account: 'PROVIDER_SETTLEMENT',
          amount,
          currency: tx.currency,
          transactionId: tx.id,
          payoutId: payout.id,
        },
      });
    });
  }

  return reply.send({ ok: true, transaction_id, direction, amount });
});

// Seller marks order as delivered, with optional proof URLs
app.post('/api/v1/payments/:transaction_id/mark-delivered', async (request, reply) => {
  const paramsSchema = z.object({ transaction_id: z.string().min(1) });
  const bodySchema = z.object({
    evidence_urls: z.array(z.string().url()).optional(),
  });

  const { transaction_id } = paramsSchema.parse(request.params as any);
  const { evidence_urls } = bodySchema.parse(request.body ?? {});

  const tx = await prisma.transaction.findUnique({
    where: { transactionId: transaction_id },
  });

  if (!tx) {
    return reply.status(404).send({ error: 'Transaction not found' });
  }

  if (tx.status !== 'ACTIVE') {
    return reply.status(400).send({ error: 'Transaction is not in an active state' });
  }

  const now = new Date();

  const updated = await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      status: 'DELIVERED',
      deliveredAt: now,
      deliveryProofUrls: evidence_urls ? (evidence_urls as any) : tx.deliveryProofUrls,
    },
  });

  // Enqueue auto-release job (7 days) and buyer reminders (day 5 and 6)
  const delayDay = 24 * 60 * 60 * 1000;

  await jobsQueue.add(
    'auto-release-transaction',
    { transactionId: transaction_id },
    {
      delay: 7 * delayDay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 60_000 },
    },
  );

  await jobsQueue.add(
    'buyer-confirm-reminder',
    { transactionId: transaction_id, reminderDay: 5 },
    {
      delay: 5 * delayDay,
      attempts: 3,
      backoff: { type: 'fixed', delay: 60_000 },
    },
  );

  await jobsQueue.add(
    'buyer-confirm-reminder',
    { transactionId: transaction_id, reminderDay: 6 },
    {
      delay: 6 * delayDay,
      attempts: 3,
      backoff: { type: 'fixed', delay: 60_000 },
    },
  );

  return reply.send({
    transaction_id: updated.transactionId,
    status: updated.status,
    delivered_at: updated.deliveredAt,
  });
});

// Buyer confirms receipt, triggering payout to seller (stubbed B2C payout)
app.post('/api/v1/payments/:transaction_id/confirm', async (request, reply) => {
  const paramsSchema = z.object({ transaction_id: z.string().min(1) });
  const { transaction_id } = paramsSchema.parse(request.params as any);

  const tx = await prisma.transaction.findUnique({
    where: { transactionId: transaction_id },
    include: { escrow: true },
  });

  if (!tx) {
    return reply.status(404).send({ error: 'Transaction not found' });
  }

  if (tx.status !== 'DELIVERED') {
    return reply.status(400).send({ error: 'Transaction is not ready for payout' });
  }

  if (!tx.escrow || tx.escrow.heldAmount <= 0) {
    return reply.status(400).send({ error: 'No funds held in escrow' });
  }

  if (!tx.sellerPayoutContact) {
    return reply
      .status(400)
      .send({ error: 'Seller payout contact is not set; cannot process payout' });
  }

  const amount = tx.escrow.heldAmount;

  // Create initial payout record
  const payout = await prisma.payout.create({
    data: {
      transactionId: tx.id,
      amount,
      status: 'PENDING',
    },
  });

  // Call stubbed B2C payout helper
  const mpesaResult = await initiateB2CPayout({
    transactionId: tx.transactionId,
    payoutId: payout.id,
    amount,
    currency: tx.currency,
    recipientPhone: tx.sellerPayoutContact,
  });

  const now = new Date();

  await prisma.$transaction(async (trx: PrismaTransaction) => {
    await trx.payout.update({
      where: { id: payout.id },
      data: {
        payoutRef: mpesaResult.providerRef,
        status: mpesaResult.status,
        processedAt: mpesaResult.status === 'SUCCESS' ? now : null,
      },
    });

    await trx.transaction.update({
      where: { id: tx.id },
      data: {
        status: 'COMPLETED',
      },
    });

    if (tx.escrow) {
      await trx.escrow.update({
        where: { id: tx.escrow.id },
        data: { releasedAt: now },
      });
    }

    // Ledger: release funds from ESCROW and allocate insurance fund
    const insuranceAmount = Math.round(amount * 0.005);
    const netToSeller = amount - insuranceAmount;

    // Debit ESCROW full amount
    await trx.ledgerEntry.create({
      data: {
        refType: 'TRANSACTION',
        refId: tx.id,
        entryType: 'DEBIT',
        account: 'ESCROW',
        amount,
        currency: tx.currency,
        transactionId: tx.id,
        payoutId: payout.id,
      },
    });

    // Credit INSURANCE_FUND with 0.5%
    await trx.ledgerEntry.create({
      data: {
        refType: 'PAYOUT',
        refId: payout.id,
        entryType: 'CREDIT',
        account: 'INSURANCE_FUND',
        amount: insuranceAmount,
        currency: tx.currency,
        transactionId: tx.id,
        payoutId: payout.id,
      },
    });

    // Credit PROVIDER_SETTLEMENT with remaining amount
    await trx.ledgerEntry.create({
      data: {
        refType: 'PAYOUT',
        refId: payout.id,
        entryType: 'CREDIT',
        account: 'PROVIDER_SETTLEMENT',
        amount: netToSeller,
        currency: tx.currency,
        transactionId: tx.id,
        payoutId: payout.id,
      },
    });
  });

  return reply.send({
    transaction_id: tx.transactionId,
    status: 'COMPLETED',
    payout_ref: mpesaResult.providerRef,
    payout_status: mpesaResult.status,
  });
});

// Seller accepts order and (optionally) provides payout contact
app.post('/api/v1/payments/:transaction_id/accept', async (request, reply) => {
  const paramsSchema = z.object({ transaction_id: z.string().min(1) });
  const bodySchema = z.object({
    seller_payout_contact: z.string().min(3).optional(),
  });

  const { transaction_id } = paramsSchema.parse(request.params as any);
  const { seller_payout_contact } = bodySchema.parse(request.body ?? {});

  const tx = await prisma.transaction.findUnique({
    where: { transactionId: transaction_id },
  });

  if (!tx) {
    return reply.status(404).send({ error: 'Transaction not found' });
  }

  if (tx.status !== 'ESCROWED') {
    return reply.status(400).send({ error: 'Transaction is not ready to be accepted' });
  }

  const payoutContact = seller_payout_contact ?? tx.sellerContact;

  const updated = await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      status: 'ACTIVE',
      sellerPayoutContact: payoutContact,
    },
  });

  return reply.send({
    transaction_id: updated.transactionId,
    status: updated.status,
    seller_payout_contact: updated.sellerPayoutContact,
  });
});

// Initiate M-Pesa C2B deposit for a transaction
app.post('/api/v1/payments/:transaction_id/deposit', async (request, reply) => {
  const paramsSchema = z.object({ transaction_id: z.string().min(1) });
  const bodySchema = z.object({
    buyer_phone: z.string().min(3).optional(),
  });

  const { transaction_id } = paramsSchema.parse(request.params as any);
  const { buyer_phone } = bodySchema.parse(request.body ?? {});

  const tx = await prisma.transaction.findUnique({
    where: { transactionId: transaction_id },
  });

  if (!tx) {
    return reply.status(404).send({ error: 'Transaction not found' });
  }

  if (tx.status !== 'PENDING') {
    return reply.status(400).send({ error: 'Transaction is not in a payable state' });
  }

  const mpesaResult = await initiateC2BPayment({
    transactionId: tx.transactionId,
    amount: tx.amount,
    currency: tx.currency,
    ...(buyer_phone ? { buyerPhone: buyer_phone } : {}),
  });

  await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      paymentRef: mpesaResult.providerRef,
    },
  });

  return reply.send({
    transaction_id: tx.transactionId,
    provider_ref: mpesaResult.providerRef,
    instructions: mpesaResult.instructions,
  });
});

// Sandbox-friendly M-Pesa C2B webhook endpoint
// NOTE: Shape the body to match Safaricom sandbox once credentials are available.
app.post('/api/v1/webhooks/m-pesa', async (request, reply) => {
  const schema = z.object({
    transaction_id: z.string().min(1),
    amount: z.number().int().positive(),
    currency: z.string().min(1),
    provider_ref: z.string().min(1),
    status: z.enum(['SUCCESS', 'FAILED']),
  });

  const { transaction_id, amount, currency, provider_ref, status } = schema.parse(
    request.body,
  );

  app.log.info({ transaction_id, status, provider_ref }, 'Received M-Pesa webhook (stub)');

  if (status !== 'SUCCESS') {
    // For now, just log failures; later we can track them explicitly.
    return reply.send({ ok: true });
  }

  const tx = await prisma.transaction.findUnique({
    where: { transactionId: transaction_id },
    include: { escrow: true },
  });

  if (!tx) {
    return reply.status(404).send({ error: 'Transaction not found' });
  }

  if (tx.status !== 'PENDING') {
    // Idempotency / duplicate callback handling: do nothing.
    return reply.send({ ok: true, ignored: true });
  }

  if (tx.currency !== currency || tx.amount !== amount) {
    // In a real integration, we would log and potentially flag for manual review.
    app.log.warn({ transaction_id, amount, currency }, 'Amount/currency mismatch');
  }

  await prisma.$transaction(async (trx: PrismaTransaction) => {
    await trx.transaction.update({
      where: { id: tx.id },
      data: {
        status: 'ESCROWED',
        paymentRef: provider_ref,
      },
    });

    if (tx.escrow) {
      await trx.escrow.update({
        where: { id: tx.escrow.id },
        data: { heldAmount: amount },
      });
    }

    // Ledger: credit ESCROW account for deposit
    await trx.ledgerEntry.create({
      data: {
        refType: 'TRANSACTION',
        refId: tx.id,
        entryType: 'CREDIT',
        account: 'ESCROW',
        amount,
        currency,
        transactionId: tx.id,
      },
    });
  });

  return reply.send({ ok: true });
});

// Internal job endpoint: auto-refund if seller never accepted
app.post('/api/internal/jobs/auto-refund', async (request, reply) => {
  const schema = z.object({ transactionId: z.string().min(1) });
  const { transactionId } = schema.parse(request.body ?? {});

  const tx = await prisma.transaction.findUnique({
    where: { transactionId },
    include: { escrow: true },
  });

  if (!tx || !tx.escrow) {
    return reply.send({ ok: true, skipped: true });
  }

  if (tx.status !== 'ESCROWED' || tx.escrow.heldAmount <= 0) {
    // Seller may have accepted or funds already moved; nothing to do.
    return reply.send({ ok: true, skipped: true });
  }

  const amount = tx.escrow.heldAmount;
  const now = new Date();

  await prisma.$transaction(async (trx: PrismaTransaction) => {
    await trx.transaction.update({
      where: { id: tx.id },
      data: {
        status: 'REFUNDED',
      },
    });

    await trx.escrow.update({
      where: { id: tx.escrow!.id },
      data: { releasedAt: now, heldAmount: 0 },
    });

    // Ledger: reverse ESCROW into USER_BALANCE (representing buyer refund)
    await trx.ledgerEntry.create({
      data: {
        refType: 'TRANSACTION',
        refId: tx.id,
        entryType: 'DEBIT',
        account: 'ESCROW',
        amount,
        currency: tx.currency,
        transactionId: tx.id,
      },
    });

    await trx.ledgerEntry.create({
      data: {
        refType: 'TRANSACTION',
        refId: tx.id,
        entryType: 'CREDIT',
        account: 'USER_BALANCE',
        amount,
        currency: tx.currency,
        transactionId: tx.id,
      },
    });
  });

  // TODO: trigger actual refund to buyer via M-Pesa B2C or reversal.

  return reply.send({ ok: true, refunded: true, transactionId });
});

// Internal job endpoint: buyer confirmation reminder (stub)
app.post('/api/internal/jobs/buyer-reminder', async (request, reply) => {
  const schema = z.object({ transactionId: z.string().min(1), reminderDay: z.number() });
  const { transactionId, reminderDay } = schema.parse(request.body ?? {});

  app.log.info({ transactionId, reminderDay }, 'Buyer confirmation reminder (stub)');

  // TODO: send SMS/email reminder via notifications package.

  return reply.send({ ok: true });
});

app.listen({ port: 4000, host: '0.0.0.0' }).then(() => {
  app.log.info('API listening on http://localhost:4000');
}).catch((err) => {
  app.log.error(err, 'Error starting API');
  process.exit(1);
});

