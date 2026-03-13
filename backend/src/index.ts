import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { attachWebSocketHandler } from "./websocket/handler";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
app.use(express.json());

/** Health check endpoint. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

attachWebSocketHandler(wss);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket listening on ws://localhost:${PORT}/ws`);
});
