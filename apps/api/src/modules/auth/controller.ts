import type { Request, Response, NextFunction } from "express";
import { authService } from "./service";
import { successResponse } from "../../utils/api-response";

export const authController = {
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register(name, email, password);
      successResponse(res, result, "Registration successful", 201);
    } catch (error) {
      next(error);
    }
  },

  async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      successResponse(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  },

  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.getProfile(req.user!.userId);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },
};
