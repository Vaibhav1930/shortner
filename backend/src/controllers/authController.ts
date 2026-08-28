import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies";
import { loginSchema, registerSchema } from "../validators/authValidators";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);

  setAuthCookie(res, result.token);
  res.status(201).json({ user: result.user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);

  setAuthCookie(res, result.token);
  res.json({ user: result.user });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: req.user });
});
