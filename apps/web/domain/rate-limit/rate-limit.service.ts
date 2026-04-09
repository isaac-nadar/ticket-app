import { redis } from "@/lib/redis";
import { rateLimitKeys } from "./rate-limit.keys";

const LIMIT = 10;
const WINDOW_SECONDS = 60;

export async function enforceRateLimit(
  userId: string
) {
  const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = rateLimitKeys.user(userId, window.toString());

  let count: number;

  try {
    count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }
  } catch {
    // Redis down → fail open (important)
    return;
  }

  if (count > LIMIT) {
    throw new Error("Rate limit exceeded");
  }
}
