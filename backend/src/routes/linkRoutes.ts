import { Router } from "express";
import { createShortLink, deleteShortLink, getLinks, getStats } from "../controllers/linkController";
import { requireAuth } from "../middleware/auth";

export const linkRouter = Router();

linkRouter.use(requireAuth);
linkRouter.post("/", createShortLink);
linkRouter.get("/", getLinks);
linkRouter.get("/:id/stats", getStats);
linkRouter.delete("/:id", deleteShortLink);
