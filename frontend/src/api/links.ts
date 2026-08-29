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

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedLinksResponse {
  links: LinkSummary[];
  pagination: PaginationMetadata;
}

export async function fetchLinks(page = 1, limit = 10): Promise<PaginatedLinksResponse> {
  return apiRequest<PaginatedLinksResponse>(`/api/links?page=${page}&limit=${limit}`);
}

export async function createLink(originalUrl: string): Promise<LinkSummary> {
  const response = await apiRequest<{ link: LinkSummary }>("/api/links", {
    method: "POST",
    body: JSON.stringify({ originalUrl }),
  });

  return response.link;
}

export async function deleteLink(id: string): Promise<void> {
  await apiRequest<void>(`/api/links/${id}`, {
    method: "DELETE",
  });
}

export async function fetchLinkStats(id: string): Promise<LinkStats> {
  const response = await apiRequest<{ link: LinkStats }>(`/api/links/${id}/stats`);
  return response.link;
}
