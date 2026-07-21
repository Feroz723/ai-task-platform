import Redis from "ioredis";
import { logger } from "../utils/logger";
import { getEnv } from "./env";

let redis: Redis | null = null;

export async function connectRedis(): Promise<void> {
  const { REDIS_URL } = getEnv();

  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.error("Redis max retries reached");
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on("connect", () => {
    logger.info("Connected to Redis");
  });

  redis.on("ready", () => {
    logger.info("Redis client ready");
  });

  redis.on("error", (error) => {
    logger.error("Redis connection error", error);
  });

  redis.on("close", () => {
    logger.warn("Redis connection closed");
  });
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error("Redis not initialized. Call connectRedis() first.");
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info("Disconnected from Redis");
  }
}

export function isRedisConnected(): boolean {
  return redis?.status === "ready";
}
