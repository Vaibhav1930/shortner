import type { Request, Response } from "express";
import { recordClick } from "../services/clickService";
import { findLinkForRedirect } from "../services/linkService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { shortCodeParamsSchema } from "../validators/linkValidators";

export const redirectToOriginal = asyncHandler(async (req: Request, res: Response) => {
  const parsed = shortCodeParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError("Short link not found", 404);
  }

  const link = await findLinkForRedirect(parsed.data.shortCode);

  // Track click asynchronously without blocking the 302 redirect
  recordClick({
    linkId: link.id,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  }).catch((err) => {
    console.error("Failed to record click:", err);
  });

  res.redirect(302, link.originalUrl);
});
