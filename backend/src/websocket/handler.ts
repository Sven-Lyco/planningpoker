import { WebSocket, WebSocketServer } from "ws";
import type { ClientMessage, ServerMessage } from "@planning-poker/shared";
import {
  MAX_AVATAR_SEED_LENGTH,
  WS_MAX_MESSAGES_PER_MINUTE,
} from "@planning-poker/shared";
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
import type { AvatarConfig } from "@planning-poker/shared";

// --- Per-connection state ---

interface ConnectionState {
  /** Set by CREATE_ROOM / JOIN_ROOM after the player enters a room. */
  roomId?: string;
  playerId?: string;
  /** Heartbeat: set to false on ping, back to true on pong. */
  isAlive: boolean;
  /** Rate limiting: message count in the current window. */
  msgCount: number;
  /** Rate limiting: start of the current 1-minute window. */
  msgWindowStart: number;
}

/** Maps WebSocket instance → per-connection state. */
const connState = new Map<WebSocket, ConnectionState>();

/** Maps playerId → WebSocket instance for targeted messaging. */
const playerSockets = new Map<string, WebSocket>();

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

const VALID_AVATAR_STYLES: AvatarConfig["style"][] = [
  "adventurer",
  "bottts",
  "pixel-art",
  "lorelei",
];

/**
 * Validates that a value is a well-formed AvatarConfig.
 * @param avatar - The value to check.
 */
function isValidAvatarConfig(avatar: unknown): avatar is AvatarConfig {
  return (
    typeof avatar === "object" &&
    avatar !== null &&
    typeof (avatar as AvatarConfig).seed === "string" &&
    (avatar as AvatarConfig).seed.length > 0 &&
    (avatar as AvatarConfig).seed.length <= MAX_AVATAR_SEED_LENGTH &&
    VALID_AVATAR_STYLES.includes((avatar as AvatarConfig).style)
  );
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

  const state = connState.get(ws);
  const meta = state?.roomId && state.playerId
    ? { roomId: state.roomId, playerId: state.playerId }
    : null;

  switch (message.type) {
    case "CREATE_ROOM": {
      const { playerName, avatar } = message;
      if (!playerName?.trim()) {
        send(ws, { type: "ERROR", message: "Player name is required." });
        return;
      }
      if (!isValidAvatarConfig(avatar)) {
        send(ws, { type: "ERROR", message: "Invalid avatar configuration." });
        return;
      }

      const result = createRoom(playerName, avatar, message.settings);
      if (typeof result === "string") {
        send(ws, { type: "ERROR", message: result });
        return;
      }

      playerSockets.set(result.playerId, ws);
      if (state) {
        state.roomId = result.room.id;
        state.playerId = result.playerId;
      }

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
      if (!isValidAvatarConfig(avatar)) {
        send(ws, { type: "ERROR", message: "Invalid avatar configuration." });
        return;
      }

      const result = joinRoom(roomId, playerName, avatar);

      if (typeof result === "string") {
        send(ws, { type: "ERROR", message: result });
        return;
      }

      playerSockets.set(result.playerId, ws);
      if (state) {
        state.roomId = result.room.id;
        state.playerId = result.playerId;
      }

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

      // Sanity-check emoji length to prevent oversized payloads being relayed
      if (typeof emoji !== "string" || emoji.length > 10) return;

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
  const state = connState.get(ws);
  connState.delete(ws);

  if (!state?.roomId || !state.playerId) return;

  playerSockets.delete(state.playerId);

  const updated = leaveRoom(state.roomId, state.playerId);
  if (updated) {
    broadcast(updated.players.map((p) => p.id), { type: "ROOM_UPDATED", room: updated });
  }
}

// --- Server setup ---

/** Heartbeat interval: ping all connected clients every 30 seconds. */
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Attaches the WebSocket message/disconnect handlers to the given server.
 * @param wss - The WebSocketServer instance to attach to.
 */
export function attachWebSocketHandler(wss: WebSocketServer): void {
  // Ping all clients periodically; terminate unresponsive ones
  const heartbeatTimer = setInterval(() => {
    wss.clients.forEach((ws) => {
      const state = connState.get(ws);
      if (!state) return;
      if (!state.isAlive) {
        ws.terminate();
        return;
      }
      state.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => clearInterval(heartbeatTimer));

  wss.on("connection", (ws: WebSocket) => {
    connState.set(ws, {
      isAlive: true,
      msgCount: 0,
      msgWindowStart: Date.now(),
    });

    ws.on("pong", () => {
      const state = connState.get(ws);
      if (state) state.isAlive = true;
    });

    ws.on("message", (data) => {
      const state = connState.get(ws);
      if (state) {
        // Sliding-window rate limit: reset counter every minute
        const now = Date.now();
        if (now - state.msgWindowStart > 60_000) {
          state.msgCount = 0;
          state.msgWindowStart = now;
        }
        state.msgCount++;
        if (state.msgCount > WS_MAX_MESSAGES_PER_MINUTE) {
          send(ws, { type: "ERROR", message: "Rate limit exceeded. Please slow down." });
          return;
        }
      }
      handleMessage(ws, data.toString());
    });

    ws.on("close", () => handleDisconnect(ws));
    ws.on("error", () => handleDisconnect(ws));
  });
}
