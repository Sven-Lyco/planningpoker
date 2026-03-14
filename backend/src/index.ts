import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { attachWebSocketHandler } from "./websocket/handler";
import { getEmojis } from "./routes/emojis";
import logger from "./logger";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Resolved from backend/dist/index.js → ../../frontend/dist in production Docker image.
// Override via STATIC_DIR env variable if needed.
const STATIC_DIR = process.env.STATIC_DIR ?? path.join(__dirname, "../../frontend/dist");

const app = express();

// Trust the first hop reverse proxy (Coolify / Traefik) so that express-rate-limit
// reads the real client IP from X-Forwarded-For instead of the proxy's IP.
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Allow DiceBear avatar SVGs from the external API.
        imgSrc: ["'self'", "data:", "https://api.dicebear.com"],
      },
    },
  })
);
app.use(express.json({ limit: "16kb" }));

/** 60 requests per minute per IP for API endpoints only (not static assets). */
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/** Health check endpoint. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/** Emoji groups for the reaction picker. */
app.get("/api/emojis", getEmojis);

/** Serve React SPA static files. */
app.use(express.static(STATIC_DIR));

/** SPA fallback – let React Router handle all non-API routes. */
app.get("*", (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

const httpServer = createServer(app);

/** 64 KB max payload per WebSocket frame to prevent memory exhaustion. */
const wss = new WebSocketServer({ server: httpServer, path: "/ws", maxPayload: 64 * 1024 });

attachWebSocketHandler(wss);

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, "HTTP server started");
  logger.info({ port: PORT, path: "/ws" }, "WebSocket server started");
});
