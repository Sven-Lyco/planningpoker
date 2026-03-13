import type { Room } from "@planning-poker/shared";

/**
 * In-memory store for all active rooms.
 * Rooms are never persisted – they exist only for the lifetime of the server process.
 */
const rooms = new Map<string, Room>();

/**
 * Retrieves a room by its ID.
 * @param roomId - The unique room identifier.
 * @returns The room, or `undefined` if not found.
 */
export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

/**
 * Persists a room to the store, creating or overwriting the entry.
 * @param room - The room to save.
 */
export function saveRoom(room: Room): void {
  rooms.set(room.id, room);
}

/**
 * Removes a room from the store.
 * @param roomId - The unique room identifier.
 */
export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

/**
 * Returns all currently active rooms.
 */
export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}
