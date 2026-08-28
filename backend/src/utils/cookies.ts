import type { Response } from "express";
import { env } from "../config/env";

const authCookieName = "accessToken";
const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: oneWeekMs,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
}

export function getAuthCookieName(): string {
  return authCookieName;
}
