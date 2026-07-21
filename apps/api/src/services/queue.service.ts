import { getRedis } from "../config/redis";
import { logger } from "../utils/logger";

const QUEUE_KEY = "ai-task-queue";

export async function enqueueTask(
  taskId: string,
  operationType: string,
  inputText: string
): Promise<void> {
  const redis = getRedis();
  const job = JSON.stringify({ taskId, operationType, inputText });
  await redis.rpush(QUEUE_KEY, job);
  logger.debug("Task enqueued", { taskId, operationType });
}

export function isQueueReady(): boolean {
  try {
    const redis = getRedis();
    return redis.status === "ready";
  } catch {
    return false;
  }
}
