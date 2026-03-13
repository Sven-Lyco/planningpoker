import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AvatarConfig } from "@planning-poker/shared";

interface PlayerState {
  playerId: string | null;
  playerName: string | null;
  avatar: AvatarConfig | null;
}

const initialState: PlayerState = {
  playerId: null,
  playerName: null,
  avatar: null,
};

/**
 * Manages the local player's identity (persisted across the session).
 */
const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    /**
     * Stores the local player's identity after joining or creating a room.
     */
    setPlayerIdentity(
      state,
      action: PayloadAction<{ playerId: string; playerName: string; avatar: AvatarConfig }>
    ) {
      state.playerId = action.payload.playerId;
      state.playerName = action.payload.playerName;
      state.avatar = action.payload.avatar;
    },

    /**
     * Clears player identity on disconnect.
     */
    clearPlayer(state) {
      state.playerId = null;
      state.playerName = null;
      state.avatar = null;
    },
  },
});

export const { setPlayerIdentity, clearPlayer } = playerSlice.actions;
export default playerSlice.reducer;
