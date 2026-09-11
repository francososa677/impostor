import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number.parseInt(process.env.PORT || "3001", 10),
  HOST: process.env.HOST || "0.0.0.0",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || "http://localhost:5173",
  SESSION_SECRET: process.env.SESSION_SECRET || "impostor-ephemeral-session-secret-key-12345",
  RATE_LIMIT_WINDOW_MS: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  RATE_LIMIT_MAX_REQUESTS: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "120", 10),
};
