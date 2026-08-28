import { Router } from "express";
import { redirectToOriginal } from "../controllers/redirectController";

export const redirectRouter = Router();

redirectRouter.get("/:shortCode", redirectToOriginal);
