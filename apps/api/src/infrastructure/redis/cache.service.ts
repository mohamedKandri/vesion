import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class CacheService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) await this.redis.del(...keys);
  }

  async delByPrefix(prefix: string): Promise<void> {
    const stream = this.redis.scanStream({ match: `${prefix}*`, count: 100 });
    const pipeline = this.redis.pipeline();
    for await (const keys of stream) {
      for (const key of keys as string[]) pipeline.del(key);
    }
    await pipeline.exec();
  }

  /**
   * Cache-aside helper: returns cached value or computes, stores, and returns it.
   */
  async remember<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await compute();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
