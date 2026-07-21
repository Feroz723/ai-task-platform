import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getEnv();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string): TokenPayload {
  const { JWT_SECRET } = getEnv();
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
