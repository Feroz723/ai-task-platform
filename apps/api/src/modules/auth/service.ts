import bcrypt from "bcryptjs";
import { authRepository } from "./repository";
import { generateAccessToken } from "../../utils/jwt";
import { createAppError } from "../../middlewares/error-handler.middleware";

const SALT_ROUNDS = 12;

export const authService = {
  async register(name: string, email: string, password: string) {
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw createAppError("Email already in use", 409);
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await authRepository.create(name, email, hashedPassword);

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  },

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw createAppError("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw createAppError("Invalid email or password", 401);
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  },

  async getProfile(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw createAppError("User not found", 404);
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };
  },
};
