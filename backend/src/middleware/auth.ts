import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { getAuthCookieName } from "../utils/cookies";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

function getBearerToken(req: Request): string | undefined {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice("Bearer ".length);
}

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const cookieToken = req.cookies[getAuthCookieName()] as string | undefined;
    const token = cookieToken ?? getBearerToken(req);

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new AppError("Authentication required", 401);
    }

    req.user = user;
    next();
  },
);

export function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  return req.user;
}
