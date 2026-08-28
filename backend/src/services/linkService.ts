import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { generateShortCode } from "../utils/shortCode";
import type { CreateLinkInput } from "../validators/linkValidators";

interface LinkSummaryRecord {
  id: string;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  _count: {
    clicks: number;
  };
}

function buildShortUrl(shortCode: string): string {
  return new URL(`/${shortCode}`, env.APP_BASE_URL).toString();
}

function toLinkSummary(link: LinkSummaryRecord) {
  return {
    id: link.id,
    originalUrl: link.originalUrl,
    shortCode: link.shortCode,
    shortUrl: buildShortUrl(link.shortCode),
    createdAt: link.createdAt,
    clickCount: link._count.clicks,
  };
}

export async function createLink(userId: string, input: CreateLinkInput) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const link = await prisma.link.create({
        data: {
          userId,
          originalUrl: input.originalUrl,
          shortCode: generateShortCode(),
        },
        include: {
          _count: {
            select: { clicks: true },
          },
        },
      });

      return toLinkSummary(link);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError("Could not generate a unique short code", 500);
}

export async function listLinks(userId: string) {
  const links = await prisma.link.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { clicks: true },
      },
    },
  });

  return links.map(toLinkSummary);
}

export async function getLinkStats(userId: string, linkId: string) {
  const link = await prisma.link.findFirst({
    where: {
      id: linkId,
      userId,
    },
    include: {
      clicks: {
        orderBy: { timestamp: "desc" },
        select: {
          id: true,
          timestamp: true,
          ipAddress: true,
          userAgent: true,
        },
      },
    },
  });

  if (!link) {
    throw new AppError("Link not found", 404);
  }

  return {
    id: link.id,
    originalUrl: link.originalUrl,
    shortCode: link.shortCode,
    shortUrl: buildShortUrl(link.shortCode),
    createdAt: link.createdAt,
    totalClicks: link.clicks.length,
    clicks: link.clicks,
  };
}

export async function findLinkForRedirect(shortCode: string) {
  const link = await prisma.link.findUnique({
    where: { shortCode },
    select: {
      id: true,
      originalUrl: true,
    },
  });

  if (!link) {
    throw new AppError("Short link not found", 404);
  }

  return link;
}
