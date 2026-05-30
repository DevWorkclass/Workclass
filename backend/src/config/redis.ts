/**
 * Client Redis (ioredis) — cache + rate-limit distribué.
 * Import direct : `import { redis } from '../config/redis';`
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[redis]', err.message);
});

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
