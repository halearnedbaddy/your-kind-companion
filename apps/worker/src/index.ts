import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');
const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:4000';

async function callApi(path: string, body?: unknown) {
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${path} failed with ${res.status}: ${text}`);
  }

  return res.json().catch(() => ({}));
}

const worker = new Worker(
  'payingzee-jobs',
  async (job) => {
    console.log('Processing job', job.name, job.id, job.data);

    switch (job.name) {
      case 'auto-refund-transaction': {
        const { transactionId } = job.data as { transactionId: string };
        await callApi('/api/internal/jobs/auto-refund', { transactionId });
        break;
      }
      case 'auto-release-transaction': {
        const { transactionId } = job.data as { transactionId: string };
        // Reuse public confirm endpoint for auto-release
        await callApi(`/api/v1/payments/${transactionId}/confirm`);
        break;
      }
      case 'buyer-confirm-reminder': {
        const { transactionId, reminderDay } = job.data as {
          transactionId: string;
          reminderDay: number;
        };
        await callApi('/api/internal/jobs/buyer-reminder', {
          transactionId,
          reminderDay,
        });
        break;
      }
      default:
        console.warn('Unknown job name', job.name);
    }
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log('Job completed', job.id);
});

worker.on('failed', (job, err) => {
  console.error('Job failed', job?.id, err);
});

