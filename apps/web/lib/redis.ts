import Redis from "ioredis";

const REDIS_HOST =
  process.env.REDIS_HOST ?? "localhost";

const REDIS_PORT = Number(
  process.env.REDIS_PORT ?? 6379
);

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

