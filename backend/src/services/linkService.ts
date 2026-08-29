import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { generateShortCode } from "../utils/shortCode";
import type { CreateLinkInput, ListLinksQuery } from "../validators/linkValidators";

interface LinkSummaryRecord {
  id: string;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  _count: {
    clicks: number;
  };
}

export interface PaginatedLinks {
  links: ReturnType<typeof toLinkSummary>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
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

export async function listLinks(
  userId: string,
  query: ListLinksQuery = { page: 1, limit: 10 },
): Promise<PaginatedLinks> {
  const page = Math.max(1, query.page);
  const limit = Math.min(100, Math.max(1, query.limit));
  const skip = (page - 1) * limit;

  const [total, links] = await prisma.$transaction([
    prisma.link.count({ where: { userId } }),
    prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: { clicks: true },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    links: links.map(toLinkSummary),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

export async function getLinkStats(userId: string, linkId: string) {
  const link = await prisma.link.findFirst({
    where: {
      id: linkId,
      userId,
    },
    select: {
      id: true,
      originalUrl: true,
      shortCode: true,
      createdAt: true,
      _count: {
        select: { clicks: true },
      },
      clicks: {
        orderBy: { timestamp: "desc" },
        take: 100,
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
    totalClicks: link._count.clicks,
    clicks: link.clicks,
  };
}

export async function deleteLink(userId: string, linkId: string): Promise<void> {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true, userId: true },
  });

  if (!link) {
    throw new AppError("Link not found", 404);
  }

  if (link.userId !== userId) {
    throw new AppError("Forbidden: You do not have permission to delete this link", 403);
  }

  await prisma.link.delete({
    where: { id: linkId },
  });
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
