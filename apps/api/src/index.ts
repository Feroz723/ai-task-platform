import "dotenv/config";
import { createApp } from "./app";
import { validateEnv, connectDatabase, disconnectDatabase } from "./config";
import { connectRedis, disconnectRedis } from "./config/redis";
import { logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  const env = validateEnv();

  await connectDatabase();
  await connectRedis();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`API server listening on port ${env.PORT}`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close();
    await disconnectDatabase();
    await disconnectRedis();
    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

bootstrap().catch((error) => {
  logger.error("Failed to bootstrap application", error);
  process.exit(1);
});
