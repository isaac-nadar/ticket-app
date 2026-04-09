import { redis } from "@/lib/redis";
import { idempotencyKeys } from "./idempotency.keys";

export const IdempotencyService = {
  async execute<T>(
    key: string,
    handler: () => Promise<T>
  ): Promise<T> {
    const cached = await redis.get(
      idempotencyKeys.request(key)
    );

    // 1️⃣ Return cached result
    if (cached) {
      return JSON.parse(cached) as T;
    }

    // 2️⃣ Acquire lock
    const lockKey = idempotencyKeys.lock(key);

    // 1️⃣ Try to acquire lock
    const acquired = await redis.setnx(lockKey, "1");

    if (!acquired) {
      throw new Error("Request already in progress");
    }

    // 2️⃣ Set TTL so lock auto-expires
    await redis.expire(lockKey, 10);

    try {
      const result = await handler();

      // 3️⃣ Cache result
      await redis.set(
        idempotencyKeys.request(key),
        JSON.stringify(result),
        "EX",
        60 * 5
      );

      return result;
    } finally {
      // 4️⃣ Release lock
      await redis.del(idempotencyKeys.lock(key));
    }
  },
};
