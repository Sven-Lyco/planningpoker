import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    playerId: null,
    playerName: null,
    avatar: null,
};
/**
 * Manages the local player's identity (name, avatar, server-assigned ID).
 */
const playerSlice = createSlice({
    name: "player",
    initialState,
    reducers: {
        /**
         * Stores name and avatar chosen in the lobby before the server assigns an ID.
         */
        setLocalIdentity(state, action) {
            state.playerName = action.payload.playerName;
            state.avatar = action.payload.avatar;
        },
        /**
         * Sets the server-assigned player ID received in ROOM_CREATED.
         */
        setPlayerId(state, action) {
            state.playerId = action.payload;
        },
        /**
         * Clears all player identity on disconnect or leave.
         */
        clearPlayer(state) {
            state.playerId = null;
            state.playerName = null;
            state.avatar = null;
        },
    },
});
export const { setLocalIdentity, setPlayerId, clearPlayer } = playerSlice.actions;
export default playerSlice.reducer;
