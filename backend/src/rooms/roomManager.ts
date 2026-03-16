import { randomUUID } from "crypto";
import {
  VOTING_SYSTEMS,
  MAX_ISSUES,
  MAX_ISSUE_TITLE_LENGTH,
  MAX_PLAYER_NAME_LENGTH,
  MAX_PLAYERS,
  MAX_CUSTOM_DECK_SIZE,
  MAX_CARD_LENGTH,
  MAX_GAME_NAME_LENGTH,
  type AvatarConfig,
  type Card,
  type Player,
  type Room,
  type RoomSettings,
  type VotingSystem,
} from "@planning-poker/shared";
import { deleteRoom, getRoom, getRoomCount, saveRoom, MAX_ROOMS } from "./roomStore";

// --- Types ---

export interface CreateRoomResult {
  room: Room;
  playerId: string;
}

export interface JoinRoomResult {
  room: Room;
  playerId: string;
}

/** Maps playerId to their WebSocket connection identifier (used by handler). */
export type PlayerConnectionMap = Map<string, string>;

// --- Helpers ---

const VALID_VOTING_SYSTEMS: VotingSystem[] = [
  "fibonacci",
  "modified-fibonacci",
  "tshirts",
  "powers-of-2",
  "custom",
];

/**
 * Strips unknown keys and validates values in a settings patch.
 * Prevents injection of arbitrary fields or out-of-range values.
 * @param patch - Raw partial settings from the client.
 */
function sanitizeSettingsPatch(patch: Partial<RoomSettings>): Partial<RoomSettings> {
  const safe: Partial<RoomSettings> = {};

  if (patch.name !== undefined && typeof patch.name === "string") {
    safe.name = patch.name.trim().slice(0, MAX_GAME_NAME_LENGTH);
  }
  if (patch.votingSystem !== undefined && VALID_VOTING_SYSTEMS.includes(patch.votingSystem)) {
    safe.votingSystem = patch.votingSystem;
  }
  if (patch.whoCanReveal === "all" || patch.whoCanReveal === "host") {
    safe.whoCanReveal = patch.whoCanReveal;
  }
  if (patch.whoCanManageIssues === "all" || patch.whoCanManageIssues === "host") {
    safe.whoCanManageIssues = patch.whoCanManageIssues;
  }
  if (typeof patch.autoReveal === "boolean") safe.autoReveal = patch.autoReveal;
  if (typeof patch.funFeatures === "boolean") safe.funFeatures = patch.funFeatures;
  if (typeof patch.showAverage === "boolean") safe.showAverage = patch.showAverage;
  if (typeof patch.showCountdown === "boolean") safe.showCountdown = patch.showCountdown;
  if (Array.isArray(patch.customDeck)) {
    safe.customDeck = patch.customDeck
      .slice(0, MAX_CUSTOM_DECK_SIZE)
      .filter((c): c is string => typeof c === "string" && c.length > 0)
      .map((c) => c.slice(0, MAX_CARD_LENGTH));
  }

  return safe;
}

/**
 * Generates the default room settings for a newly created room.
 * @param facilitatorId - The player ID of the initial host/facilitator.
 */
function defaultSettings(facilitatorId: string): RoomSettings {
  return {
    facilitatorId,
    votingSystem: "fibonacci",
    whoCanReveal: "host",
    whoCanManageIssues: "all",
    autoReveal: false,
    funFeatures: true,
    showAverage: true,
    showCountdown: false,
  };
}

/**
 * Returns the active card deck for a room based on its voting system setting.
 * @param settings - The room's current settings.
 */
export function getActiveDeck(settings: RoomSettings): Card[] {
  if (settings.votingSystem === "custom") {
    return settings.customDeck ?? [];
  }
  return VOTING_SYSTEMS[settings.votingSystem];
}

// --- Room lifecycle ---

/**
 * Creates a new room with the given host player.
 * @param playerName - Display name of the host.
 * @param avatar - Avatar configuration chosen by the host.
 * @param initialSettings - Optional settings to apply on top of the defaults.
 * @returns The created room and the host's player ID.
 */
export function createRoom(
  playerName: string,
  avatar: AvatarConfig,
  initialSettings?: Partial<RoomSettings>
): CreateRoomResult | string {
  if (getRoomCount() >= MAX_ROOMS) return "Server is at capacity. Please try again later.";

  const playerId = randomUUID();
  const roomId = randomUUID().slice(0, 8).toUpperCase();

  const host: Player = {
    id: playerId,
    name: playerName.trim().slice(0, MAX_PLAYER_NAME_LENGTH),
    avatar,
    isHost: true,
    hasVoted: false,
  };

  const room: Room = {
    id: roomId,
    hostId: playerId,
    phase: "waiting",
    players: [host],
    currentVotes: {},
    timer: 0,
    issues: [],
    settings: {
      ...defaultSettings(playerId),
      ...(initialSettings ? sanitizeSettingsPatch(initialSettings) : {}),
    },
  };

  saveRoom(room);
  return { room, playerId };
}

/**
 * Adds a player to an existing room.
 * @param roomId - The room to join.
 * @param playerName - Display name of the joining player.
 * @param avatar - Avatar configuration chosen by the player.
 * @returns The updated room and the new player's ID, or an error string.
 */
export function joinRoom(
  roomId: string,
  playerName: string,
  avatar: AvatarConfig
): JoinRoomResult | string {
  const room = getRoom(roomId);
  if (!room) return "Room not found.";
  if (room.players.length >= MAX_PLAYERS) return "Room is full.";

  const playerId = randomUUID();
  const player: Player = {
    id: playerId,
    name: playerName.trim().slice(0, MAX_PLAYER_NAME_LENGTH),
    avatar,
    isHost: false,
    hasVoted: false,
  };

  const updated: Room = {
    ...room,
    players: [...room.players, player],
  };

  saveRoom(updated);
  return { room: updated, playerId };
}

/**
 * Removes a player from their room. Deletes the room if it becomes empty.
 * Transfers host role to the next player if the host leaves.
 * @param roomId - The room to leave.
 * @param playerId - The player leaving.
 * @returns The updated room, or `null` if the room was deleted.
 */
export function leaveRoom(roomId: string, playerId: string): Room | null {
  const room = getRoom(roomId);
  if (!room) return null;

  const remaining = room.players.filter((p) => p.id !== playerId);

  if (remaining.length === 0) {
    deleteRoom(roomId);
    return null;
  }

  // Transfer host if the host left
  let updatedPlayers = remaining;
  let newHostId = room.hostId;
  if (room.hostId === playerId) {
    newHostId = remaining[0].id;
    updatedPlayers = remaining.map((p, i) => ({
      ...p,
      isHost: i === 0,
    }));
  }

  const { [playerId]: _removed, ...remainingVotes } = room.currentVotes;

  const updated: Room = {
    ...room,
    hostId: newHostId,
    players: updatedPlayers,
    currentVotes: remainingVotes,
    settings: {
      ...room.settings,
      facilitatorId:
        room.settings.facilitatorId === playerId
          ? newHostId
          : room.settings.facilitatorId,
    },
  };

  saveRoom(updated);
  return updated;
}

// --- Voting ---

/**
 * Records a vote for a player. Only valid during the "voting" phase.
 * If autoReveal is enabled and all players have voted, cards are revealed automatically.
 * @param roomId - The room in which the vote is cast.
 * @param playerId - The voting player.
 * @param card - The selected card value.
 * @returns The updated room, or an error string.
 */
export function castVote(
  roomId: string,
  playerId: string,
  card: Card
): Room | string {
  const room = getRoom(roomId);
  if (!room) return "Room not found.";
  if (room.phase !== "voting") return "Voting is not active.";

  const activeDeck = getActiveDeck(room.settings);
  if (!activeDeck.includes(card)) return "Invalid card.";

  const updatedPlayers = room.players.map((p) =>
    p.id === playerId ? { ...p, hasVoted: true } : p
  );

  const updated: Room = {
    ...room,
    players: updatedPlayers,
    currentVotes: { ...room.currentVotes, [playerId]: card },
  };

  // Auto-reveal when all players have voted
  if (room.settings.autoReveal && updatedPlayers.every((p) => p.hasVoted)) {
    const revealed: Room = { ...updated, phase: "reveal" };
    saveRoom(revealed);
    return revealed;
  }

  saveRoom(updated);
  return updated;
}

/**
 * Reveals all cards, transitioning the room to the "reveal" phase.
 * @param roomId - The target room.
 * @param requestingPlayerId - The player requesting the reveal.
 * @returns The updated room, or an error string.
 */
export function revealCards(
  roomId: string,
  requestingPlayerId: string
): Room | string {
  const room = getRoom(roomId);
  if (!room) return "Room not found.";
  if (room.phase !== "voting") return "Cards can only be revealed during voting.";

  const canReveal =
    room.settings.whoCanReveal === "all" ||
    requestingPlayerId === room.settings.facilitatorId;

  if (!canReveal) return "Only the facilitator can reveal cards.";

  const updated: Room = { ...room, phase: "reveal" };
  saveRoom(updated);
  return updated;
}

/**
 * Starts a new voting round, resetting all votes and transitioning to "voting" phase.
 * @param roomId - The target room.
 * @param requestingPlayerId - The player requesting the new round.
 * @returns The updated room, or an error string.
 */
export function startNewVoting(
  roomId: string,
  requestingPlayerId: string
): Room | string {
  const room = getRoom(roomId);
  if (!room) return "Room not found.";

  if (requestingPlayerId !== room.settings.facilitatorId) {
    return "Only the facilitator can start a new voting round.";
  }

  const updated: Room = {
    ...room,
    phase: "voting",
    currentVotes: {},
    players: room.players.map((p) => ({ ...p, hasVoted: false })),
  };

  saveRoom(updated);
  return updated;
}

// --- Issues ---

/**
 * Adds a new issue to the room's issue list.
 * @param roomId - The target room.
 * @param requestingPlayerId - The player adding the issue.
 * @param title - The issue title.
 * @returns The updated room, or an error string.
 */
export function addIssue(
  roomId: string,
  requestingPlayerId: string,
  title: string
): Room | string {
  const room = getRoom(roomId);
  if (!room) return "Room not found.";

  const canManage =
    room.settings.whoCanManageIssues === "all" ||
    requestingPlayerId === room.settings.facilitatorId;

  if (!canManage) return "Only the facilitator can manage issues.";
  if (room.issues.length >= MAX_ISSUES) return "Issue limit reached.";

  const trimmedTitle = title.trim().slice(0, MAX_ISSUE_TITLE_LENGTH);
  if (!trimmedTitle) return "Issue title is required.";

  const updated: Room = {
    ...room,
    issues: [
      ...room.issues,
      { id: randomUUID(), title: trimmedTitle },
    ],
  };

  saveRoom(updated);
  return updated;
}

// --- Settings ---

/**
 * Updates room settings. Only the facilitator may change settings.
 * @param roomId - The target room.
 * @param requestingPlayerId - The player requesting the update.
 * @param patch - Partial settings to apply.
 * @returns The updated room, or an error string.
 */
export function updateSettings(
  roomId: string,
  requestingPlayerId: string,
  patch: Partial<RoomSettings>
): Room | string {
  const room = getRoom(roomId);
  if (!room) return "Room not found.";

  if (requestingPlayerId !== room.settings.facilitatorId) {
    return "Only the facilitator can change room settings.";
  }

  const updated: Room = {
    ...room,
    settings: { ...room.settings, ...sanitizeSettingsPatch(patch) },
  };

  saveRoom(updated);
  return updated;
}
