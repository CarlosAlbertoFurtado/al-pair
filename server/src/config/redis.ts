import Redis from 'ioredis';
import { env } from './env.js';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redis.connect().catch(() => {
      redis = null;
    });
    return redis;
  } catch {
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client || client.status !== 'ready') return null;
  try {
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const client = getRedis();
  if (!client || client.status !== 'ready') return;
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    /* ignore cache failures */
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client || client.status !== 'ready') return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(...keys);
  } catch {
    /* ignore */
  }
}
