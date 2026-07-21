import { Router } from "express";
import { healthRouter } from "../modules/health/routes";
import { authRouter } from "../modules/auth/routes";
import { authController } from "../modules/auth/controller";
import { taskRouter } from "../modules/task/routes";
import { authenticate } from "../middlewares/auth.middleware";

export const routes = Router();

routes.use("/health", healthRouter);
routes.use("/auth", authRouter);
routes.get("/me", authenticate, authController.getProfile);
routes.use("/tasks", taskRouter);
