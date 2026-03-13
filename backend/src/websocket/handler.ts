import { WebSocket, WebSocketServer } from "ws";
import type { ClientMessage, ServerMessage } from "@planning-poker/shared";
import {
  addIssue,
  castVote,
  createRoom,
  joinRoom,
  leaveRoom,
  revealCards,
  startNewVoting,
  updateSettings,
} from "../rooms/roomManager";
import { getRoom } from "../rooms/roomStore";

// --- Connection registry ---

/** Maps playerId → WebSocket instance for targeted messaging. */
const playerSockets = new Map<string, WebSocket>();

/** Maps WebSocket instance → { roomId, playerId } for disconnect handling. */
const socketMeta = new Map<WebSocket, { roomId: string; playerId: string }>();

// --- Helpers ---

/**
 * Sends a typed message to a single WebSocket client.
 * @param ws - The target WebSocket connection.
 * @param message - The server message to send.
 */
function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcasts a message to all players currently in a room.
 * @param playerIds - Array of player IDs to broadcast to.
 * @param message - The server message to broadcast.
 */
function broadcast(playerIds: string[], message: ServerMessage): void {
  for (const id of playerIds) {
    const ws = playerSockets.get(id);
    if (ws) send(ws, message);
  }
}

/**
 * Parses and validates an incoming WebSocket message.
 * @param raw - The raw string received from the client.
 * @returns The parsed ClientMessage, or `null` if parsing fails.
 */
function parseMessage(raw: string): ClientMessage | null {
  try {
    return JSON.parse(raw) as ClientMessage;
  } catch {
    return null;
  }
}

// --- Message handlers ---

/**
 * Handles all incoming WebSocket messages from a single client connection.
 * @param ws - The client's WebSocket connection.
 * @param raw - The raw message string received.
 */
function handleMessage(ws: WebSocket, raw: string): void {
  const message = parseMessage(raw);
  if (!message) {
    send(ws, { type: "ERROR", message: "Invalid message format." });
    return;
  }

  const meta = socketMeta.get(ws);

  switch (message.type) {
    case "CREATE_ROOM": {
      const { playerName, avatar } = message;
      if (!playerName?.trim()) {
        send(ws, { type: "ERROR", message: "Player name is required." });
        return;
      }

      const result = createRoom(playerName, avatar);

      playerSockets.set(result.playerId, ws);
      socketMeta.set(ws, { roomId: result.room.id, playerId: result.playerId });

      send(ws, { type: "ROOM_CREATED", roomId: result.room.id, playerId: result.playerId });
      send(ws, { type: "ROOM_UPDATED", room: result.room });
      break;
    }

    case "JOIN_ROOM": {
      const { roomId, playerName, avatar } = message;
      if (!playerName?.trim()) {
        send(ws, { type: "ERROR", message: "Player name is required." });
        return;
      }

      const result = joinRoom(roomId, playerName, avatar);

      if (typeof result === "string") {
        send(ws, { type: "ERROR", message: result });
        return;
      }

      playerSockets.set(result.playerId, ws);
      socketMeta.set(ws, { roomId: result.room.id, playerId: result.playerId });

      send(ws, { type: "ROOM_CREATED", roomId: result.room.id, playerId: result.playerId });
      broadcast(result.room.players.map((p) => p.id), { type: "ROOM_UPDATED", room: result.room });
      break;
    }

    case "VOTE": {
      if (!meta) return;
      const result = castVote(meta.roomId, meta.playerId, message.card);
      if (typeof result === "string") {
        send(ws, { type: "ERROR", message: result });
        return;
      }
      broadcast(result.players.map((p) => p.id), { type: "ROOM_UPDATED", room: result });

      // If auto-reveal transitioned to "reveal", also send CARDS_REVEALED
      if (result.phase === "reveal") {
        const votes = Object.fromEntries(
          Object.entries(result.currentVotes).filter(([, v]) => v !== null)
        ) as Record<string, string>;
        broadcast(result.players.map((p) => p.id), { type: "CARDS_REVEALED", votes });
      }
      break;
    }

    case "REVEAL_CARDS": {
      if (!meta) return;
      const result = revealCards(meta.roomId, meta.playerId);
      if (typeof result === "string") {
        send(ws, { type: "ERROR", message: result });
        return;
      }
      const votes = Object.fromEntries(
        Object.entries(result.currentVotes).filter(([, v]) => v !== null)
      ) as Record<string, string>;
      broadcast(result.players.map((p) => p.id), { type: "ROOM_UPDATED", room: result });
      broadcast(result.players.map((p) => p.id), { type: "CARDS_REVEALED", votes });
      break;
    }

    case "NEW_VOTING": {
      if (!meta) return;
      const result = startNewVoting(meta.roomId, meta.playerId);
      if (typeof result === "string") {
        send(ws, { type: "ERROR", message: result });
        return;
      }
      broadcast(result.players.map((p) => p.id), { type: "ROOM_UPDATED", room: result });
      break;
    }

    case "SEND_REACTION": {
      if (!meta) return;
      const { emoji, targetPlayerId } = message;

      const room = getRoom(meta.roomId);
      if (!room) return;
      broadcast(room.players.map((p) => p.id), {
        type: "REACTION",
        playerId: meta.playerId,
        emoji,
        targetPlayerId,
      });
      break;
    }

    case "ADD_ISSUE": {
      if (!meta) return;
      const result = addIssue(meta.roomId, meta.playerId, message.title);
      if (typeof result === "string") {
        send(ws, { type: "ERROR", message: result });
        return;
      }
      broadcast(result.players.map((p) => p.id), { type: "ROOM_UPDATED", room: result });
      break;
    }

    case "UPDATE_SETTINGS": {
      if (!meta) return;
      const result = updateSettings(meta.roomId, meta.playerId, message.settings);
      if (typeof result === "string") {
        send(ws, { type: "ERROR", message: result });
        return;
      }
      broadcast(result.players.map((p) => p.id), { type: "ROOM_UPDATED", room: result });
      break;
    }
  }
}

/**
 * Handles a client disconnecting, removing them from their room.
 * @param ws - The disconnected WebSocket connection.
 */
function handleDisconnect(ws: WebSocket): void {
  const meta = socketMeta.get(ws);
  if (!meta) return;

  const { roomId, playerId } = meta;
  socketMeta.delete(ws);
  playerSockets.delete(playerId);

  const updated = leaveRoom(roomId, playerId);
  if (updated) {
    broadcast(updated.players.map((p) => p.id), { type: "ROOM_UPDATED", room: updated });
  }
}

// --- Server setup ---

/**
 * Attaches the WebSocket message/disconnect handlers to the given server.
 * @param wss - The WebSocketServer instance to attach to.
 */
export function attachWebSocketHandler(wss: WebSocketServer): void {
  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (data) => handleMessage(ws, data.toString()));
    ws.on("close", () => handleDisconnect(ws));
    ws.on("error", () => handleDisconnect(ws));
  });
}
