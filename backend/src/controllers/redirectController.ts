import type { Request, Response } from "express";
import { recordClick } from "../services/clickService";
import { findLinkForRedirect } from "../services/linkService";
import { asyncHandler } from "../utils/asyncHandler";
import { shortCodeParamsSchema } from "../validators/linkValidators";

export const redirectToOriginal = asyncHandler(async (req: Request, res: Response) => {
  const params = shortCodeParamsSchema.parse(req.params);
  const link = await findLinkForRedirect(params.shortCode);

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
