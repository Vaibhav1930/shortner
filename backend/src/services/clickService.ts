import { prisma } from "../lib/prisma";

interface RecordClickInput {
  linkId: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordClick(input: RecordClickInput): Promise<void> {
  await prisma.click.create({
    data: {
      linkId: input.linkId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
