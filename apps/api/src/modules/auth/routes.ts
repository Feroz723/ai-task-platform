import { Router } from "express";
import { authController } from "./controller";
import { validate } from "../../middlewares/validate.middleware";
import { registerSchema, loginSchema } from "./validator";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
