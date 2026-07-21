import type { Request, Response, NextFunction } from "express";
import { isDatabaseConnected } from "../../config/database";
import { isRedisConnected } from "../../config/redis";
import { isQueueReady } from "../../services/queue.service";
import { successResponse } from "../../utils/api-response";

export const healthController = {
  check: (_req: Request, res: Response, _next: NextFunction): void => {
    const dbStatus = isDatabaseConnected() ? "connected" : "disconnected";
    const redisStatus = isRedisConnected() ? "connected" : "disconnected";
    const queueStatus = isQueueReady() ? "healthy" : "unhealthy";

    successResponse(
      res,
      {
        timestamp: new Date().toISOString(),
        services: {
          database: dbStatus,
          redis: redisStatus,
          queue: queueStatus,
        },
      },
      "API healthy"
    );
  },
};
