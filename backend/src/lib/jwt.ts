import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export interface AccessTokenPayload {
  userId: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof payload === "string" ||
      typeof payload.userId !== "string" ||
      payload.userId.length === 0
    ) {
      throw new AppError("Invalid token payload", 401);
    }

    return { userId: payload.userId };
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
}
