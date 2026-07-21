import { Router } from "express";
import { taskController } from "./controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { createTaskSchema } from "./validator";

export const taskRouter = Router();

taskRouter.use(authenticate);

taskRouter.post("/", validate(createTaskSchema), taskController.create);
taskRouter.get("/", taskController.findAll);
taskRouter.get("/:id", taskController.findById);
