import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express, { Request, Response, NextFunction } from "express";
import { Server } from "socket.io";
import helmet from "helmet";
import cors from "cors";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@impostor/shared";
import { config } from "./config.js";
import { WordDataLoader } from "./store/data-loader.js";
import { initSocketServer } from "./socket/index.js";
import { apiRouter } from "./routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.resolve(__dirname, "../../web/dist");

const app = express();
const server = http.createServer(app);

// Pre-load word datasets
WordDataLoader.loadAll();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible client dev/prod integrations
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl) or matching origins
      if (!origin || config.NODE_ENV === "development" || origin.includes("localhost") || origin.includes("127.0.0.1") || origin === config.CORS_ORIGIN) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in initial deployment while allowing credentials
    },
    credentials: true,
  })
);

app.use(express.json());

// API routes
app.use(apiRouter);

// Serve static frontend build in production if available
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      return next();
    }
    res.sendFile(path.join(webDistPath, "index.html"));
  });
}

// Initialize Socket.IO
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  server,
  {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    maxHttpBufferSize: 1e6, // 1MB payload limit for OWASP safety
  }
);

initSocketServer(io);

// Start server
server.listen(config.PORT, config.HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🕵️‍♂️ IMPOSTOR Server running at http://${config.HOST}:${config.PORT}`);
  console.log(`🌐 Environment: ${config.NODE_ENV}`);
  console.log(`🔌 Socket.IO endpoint active`);
  console.log(`======================================================\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing HTTP server...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

export { app, server, io };
