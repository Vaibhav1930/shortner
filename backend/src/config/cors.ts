import type { CorsOptions } from "cors";
import { env } from "./env";

const localDevOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

function getAllowedOrigins(): string[] {
  const configuredOrigins = env.CLIENT_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (env.NODE_ENV === "development") {
    return Array.from(new Set([...configuredOrigins, ...localDevOrigins]));
  }

  return configuredOrigins;
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, getAllowedOrigins().includes(origin));
  },
  credentials: true,
};
