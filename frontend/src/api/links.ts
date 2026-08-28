import { apiRequest } from "./client";

export interface LinkSummary {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: string;
  clickCount: number;
}

export interface ClickRecord {
  id: string;
  timestamp: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface LinkStats {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: string;
  totalClicks: number;
  clicks: ClickRecord[];
}

export async function fetchLinks(): Promise<LinkSummary[]> {
  const response = await apiRequest<{ links: LinkSummary[] }>("/api/links");
  return response.links;
}

export async function createLink(originalUrl: string): Promise<LinkSummary> {
  const response = await apiRequest<{ link: LinkSummary }>("/api/links", {
    method: "POST",
    body: JSON.stringify({ originalUrl }),
  });

  return response.link;
}

export async function fetchLinkStats(id: string): Promise<LinkStats> {
  const response = await apiRequest<{ link: LinkStats }>(`/api/links/${id}/stats`);
  return response.link;
}
