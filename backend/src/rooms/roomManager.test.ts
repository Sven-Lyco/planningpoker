import { describe, it, expect } from "vitest";
import {
  addIssue,
  castVote,
  createRoom,
  joinRoom,
  leaveRoom,
  revealCards,
  startNewVoting,
  updateSettings,
  type CreateRoomResult,
} from "./roomManager";
import { deleteRoom, getRoom, saveRoom } from "./roomStore";

const avatar = { style: "bottts" as const, seed: "seed-1" };

/** Asserts that createRoom returned a result (not a capacity error string). */
function created(result: CreateRoomResult | string): CreateRoomResult {
  if (typeof result === "string") throw new Error(`createRoom failed: ${result}`);
  return result;
}

describe("createRoom", () => {
  it("creates a room with the host player", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    expect(room.players).toHaveLength(1);
    expect(room.players[0].name).toBe("Alice");
    expect(room.players[0].isHost).toBe(true);
    expect(room.hostId).toBe(playerId);
    expect(room.phase).toBe("waiting");
    deleteRoom(room.id);
  });

  it("trims and enforces player name length", () => {
    const longName = "A".repeat(100);
    const { room } = created(createRoom(longName, avatar));
    expect(room.players[0].name.length).toBeLessThanOrEqual(30);
    deleteRoom(room.id);
  });
});

describe("joinRoom", () => {
  it("adds a player to an existing room", () => {
    const { room } = created(createRoom("Alice", avatar));
    const result = joinRoom(room.id, "Bob", avatar);
    expect(typeof result).not.toBe("string");
    const joined = result as { room: typeof room; playerId: string };
    expect(joined.room.players).toHaveLength(2);
    deleteRoom(room.id);
  });

  it("returns an error for unknown room", () => {
    const result = joinRoom("INVALID", "Bob", avatar);
    expect(result).toBe("Room not found.");
  });
});

describe("leaveRoom", () => {
  it("removes player from room", () => {
    const { room } = created(createRoom("Alice", avatar));
    const joined = joinRoom(room.id, "Bob", avatar) as { room: typeof room; playerId: string };
    const updated = leaveRoom(room.id, joined.playerId);
    expect(updated?.players).toHaveLength(1);
    deleteRoom(room.id);
  });

  it("deletes room when last player leaves", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    const result = leaveRoom(room.id, playerId);
    expect(result).toBeNull();
    expect(getRoom(room.id)).toBeUndefined();
  });

  it("transfers host when host leaves", () => {
    const { room, playerId: hostId } = created(createRoom("Alice", avatar));
    const joined = joinRoom(room.id, "Bob", avatar) as { room: typeof room; playerId: string };
    const updated = leaveRoom(room.id, hostId);
    expect(updated?.players[0].isHost).toBe(true);
    expect(updated?.hostId).toBe(joined.playerId);
    deleteRoom(room.id);
  });
});

describe("castVote", () => {
  it("records a vote during voting phase", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    saveRoom({ ...room, phase: "voting" });

    const result = castVote(room.id, playerId, "5");
    expect(typeof result).not.toBe("string");
    const updated = result as typeof room;
    expect(updated.currentVotes[playerId]).toBe("5");
    expect(updated.players[0].hasVoted).toBe(true);
    deleteRoom(room.id);
  });

  it("rejects vote outside voting phase", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    const result = castVote(room.id, playerId, "5");
    expect(result).toBe("Voting is not active.");
    deleteRoom(room.id);
  });

  it("rejects invalid card", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    saveRoom({ ...room, phase: "voting" });

    const result = castVote(room.id, playerId, "999");
    expect(result).toBe("Invalid card.");
    deleteRoom(room.id);
  });
});

describe("revealCards", () => {
  it("transitions room to reveal phase", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    saveRoom({ ...room, phase: "voting" });

    const result = revealCards(room.id, playerId);
    expect(typeof result).not.toBe("string");
    expect((result as typeof room).phase).toBe("reveal");
    deleteRoom(room.id);
  });

  it("returns error if not in voting phase", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    const result = revealCards(room.id, playerId);
    expect(result).toBe("Cards can only be revealed during voting.");
    deleteRoom(room.id);
  });
});

describe("startNewVoting", () => {
  it("resets votes and starts new round", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    saveRoom({ ...room, phase: "reveal", currentVotes: { [playerId]: "5" } });

    const result = startNewVoting(room.id, playerId);
    expect(typeof result).not.toBe("string");
    const updated = result as typeof room;
    expect(updated.phase).toBe("voting");
    expect(updated.currentVotes).toEqual({});
    deleteRoom(room.id);
  });

  it("rejects non-facilitator", () => {
    const { room } = created(createRoom("Alice", avatar));
    const result = startNewVoting(room.id, "someone-else");
    expect(result).toBe("Only the facilitator can start a new voting round.");
    deleteRoom(room.id);
  });
});

describe("addIssue", () => {
  it("adds an issue to the room", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    const result = addIssue(room.id, playerId, "Fix login bug");
    expect(typeof result).not.toBe("string");
    expect((result as typeof room).issues).toHaveLength(1);
    expect((result as typeof room).issues[0].title).toBe("Fix login bug");
    deleteRoom(room.id);
  });
});

describe("updateSettings", () => {
  it("updates settings when requested by facilitator", () => {
    const { room, playerId } = created(createRoom("Alice", avatar));
    const result = updateSettings(room.id, playerId, { votingSystem: "tshirts" });
    expect(typeof result).not.toBe("string");
    expect((result as typeof room).settings.votingSystem).toBe("tshirts");
    deleteRoom(room.id);
  });

  it("rejects settings change from non-facilitator", () => {
    const { room } = created(createRoom("Alice", avatar));
    const result = updateSettings(room.id, "intruder", { votingSystem: "tshirts" });
    expect(result).toBe("Only the facilitator can change room settings.");
    deleteRoom(room.id);
  });
});
