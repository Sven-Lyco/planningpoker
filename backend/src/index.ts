import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { attachWebSocketHandler } from "./websocket/handler";
import { getEmojis } from "./routes/emojis";
import logger from "./logger";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
app.use(express.json());

/** Health check endpoint. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/** Emoji groups for the reaction picker. */
app.get("/api/emojis", getEmojis);

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

attachWebSocketHandler(wss);

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, "HTTP server started");
  logger.info({ port: PORT, path: "/ws" }, "WebSocket server started");
});
