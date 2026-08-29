import type { Request, Response } from "express";
import { createLink, deleteLink, getLinkStats, listLinks } from "../services/linkService";
import { requireUser } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { createLinkSchema, linkIdParamsSchema, listLinksQuerySchema } from "../validators/linkValidators";

export const createShortLink = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const input = createLinkSchema.parse(req.body);
  const link = await createLink(user.id, input);

  res.status(201).json({ link });
});

export const getLinks = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const query = listLinksQuerySchema.parse(req.query);
  const result = await listLinks(user.id, query);

  res.json(result);
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const params = linkIdParamsSchema.parse(req.params);
  const stats = await getLinkStats(user.id, params.id);

  res.json({ link: stats });
});

export const deleteShortLink = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const params = linkIdParamsSchema.parse(req.params);
  await deleteLink(user.id, params.id);

  res.status(204).send();
});
