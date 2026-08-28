const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const defaultApiBaseUrl = `${window.location.protocol}//${window.location.hostname}:4000`;

export const API_BASE_URL = configuredApiBaseUrl?.replace(/\/$/, "") ?? defaultApiBaseUrl;

interface ApiErrorBody {
  message?: string;
  details?: unknown;
}

export class ApiError extends Error {
  public readonly status: number;

  public readonly details?: unknown;

  public constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = (isJson ? await response.json() : undefined) as ApiErrorBody | undefined;

  if (!response.ok) {
    throw new ApiError(body?.message ?? "Request failed", response.status, body?.details);
  }

  return body as T;
}
