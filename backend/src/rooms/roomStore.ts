import type { Room } from "@planning-poker/shared";
import { MAX_ROOMS, ROOM_TTL_MS } from "@planning-poker/shared";

/**
 * In-memory store for all active rooms.
 * Rooms are never persisted – they exist only for the lifetime of the server process.
 */
const rooms = new Map<string, Room>();

/** Tracks the last activity timestamp per room for TTL-based cleanup. */
const roomActivity = new Map<string, number>();

/**
 * Retrieves a room by its ID.
 * @param roomId - The unique room identifier.
 * @returns The room, or `undefined` if not found.
 */
export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

/**
 * Returns the current number of active rooms.
 */
export function getRoomCount(): number {
  return rooms.size;
}

/**
 * Persists a room to the store, creating or overwriting the entry.
 * @param room - The room to save.
 */
export function saveRoom(room: Room): void {
  rooms.set(room.id, room);
  roomActivity.set(room.id, Date.now());
}

/**
 * Removes a room from the store.
 * @param roomId - The unique room identifier.
 */
export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
  roomActivity.delete(roomId);
}

/**
 * Returns all currently active rooms.
 */
export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}

/**
 * Removes rooms that have been inactive for longer than ROOM_TTL_MS.
 * @returns The number of rooms that were removed.
 */
export function cleanupExpiredRooms(): number {
  const now = Date.now();
  let count = 0;
  for (const [roomId, lastActivity] of roomActivity) {
    if (now - lastActivity > ROOM_TTL_MS) {
      deleteRoom(roomId);
      count++;
    }
  }
  return count;
}

// Run cleanup every 15 minutes; unref() ensures this timer won't keep the process alive in tests.
setInterval(cleanupExpiredRooms, 15 * 60 * 1000).unref();

export { MAX_ROOMS };
