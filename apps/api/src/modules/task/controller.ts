import type { Request, Response, NextFunction } from "express";
import { taskService } from "./service";
import { successResponse } from "../../utils/api-response";

export const taskController = {
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { title, inputText, operationType } = req.body;
      const result = await taskService.create({
        title,
        inputText,
        operationType,
        userId: req.user!.userId,
      });
      successResponse(res, result, "Task created", 201);
    } catch (error) {
      next(error);
    }
  },

  async findAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

      const result = await taskService.findAll(req.user!.userId, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await taskService.findById(
        req.params.id,
        req.user!.userId
      );
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },
};
