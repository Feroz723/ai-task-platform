import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { getEnv } from "./env";

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  const { MONGODB_URI } = getEnv();

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("Failed to connect to MongoDB", error);
    throw error;
  }

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", error);
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("MongoDB disconnected");
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
  logger.info("Disconnected from MongoDB");
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
