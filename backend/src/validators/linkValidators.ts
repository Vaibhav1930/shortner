import { z } from "zod";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048, "URL is too long")
    .refine(isHttpUrl, "Enter a valid http(s) URL"),
});

export const linkIdParamsSchema = z.object({
  id: z.string().min(1, "Link id is required"),
});

export const shortCodeParamsSchema = z.object({
  shortCode: z.string().regex(/^[A-Za-z0-9]{6,12}$/, "Invalid short code"),
});

export const listLinksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type ListLinksQuery = z.infer<typeof listLinksQuerySchema>;
