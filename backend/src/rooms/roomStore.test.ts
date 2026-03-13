import { describe, it, expect, beforeEach } from "vitest";
import { deleteRoom, getAllRooms, getRoom, saveRoom } from "./roomStore";
import type { Room } from "@planning-poker/shared";

const mockRoom: Room = {
  id: "ROOM01",
  hostId: "player-1",
  phase: "waiting",
  players: [
    {
      id: "player-1",
      name: "Alice",
      avatar: { style: "bottts", seed: "abc" },
      isHost: true,
      hasVoted: false,
    },
  ],
  currentVotes: {},
  timer: 0,
  issues: [],
  settings: {
    facilitatorId: "player-1",
    votingSystem: "fibonacci",
    whoCanReveal: "all",
    whoCanManageIssues: "all",
    autoReveal: false,
    funFeatures: true,
    showAverage: true,
    showCountdown: true,
  },
};

// Reset store state between tests by deleting known rooms
beforeEach(() => {
  deleteRoom("ROOM01");
  deleteRoom("ROOM02");
});

describe("roomStore", () => {
  it("returns undefined for unknown room", () => {
    expect(getRoom("UNKNOWN")).toBeUndefined();
  });

  it("saves and retrieves a room", () => {
    saveRoom(mockRoom);
    expect(getRoom("ROOM01")).toEqual(mockRoom);
  });

  it("overwrites an existing room on save", () => {
    saveRoom(mockRoom);
    const updated = { ...mockRoom, phase: "voting" as const };
    saveRoom(updated);
    expect(getRoom("ROOM01")?.phase).toBe("voting");
  });

  it("deletes a room", () => {
    saveRoom(mockRoom);
    deleteRoom("ROOM01");
    expect(getRoom("ROOM01")).toBeUndefined();
  });

  it("getAllRooms includes saved room", () => {
    saveRoom(mockRoom);
    expect(getAllRooms().some((r) => r.id === "ROOM01")).toBe(true);
  });
});
