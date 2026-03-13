import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    room: null,
    roomId: null,
};
/**
 * Manages the current room state received from the server.
 */
const roomSlice = createSlice({
    name: "room",
    initialState,
    reducers: {
        /**
         * Sets the active room ID after creating or joining a room.
         */
        setRoomId(state, action) {
            state.roomId = action.payload;
        },
        /**
         * Replaces the full room state with the latest server snapshot.
         */
        updateRoom(state, action) {
            state.room = action.payload;
            state.roomId = action.payload.id;
        },
        /**
         * Clears room state on disconnect or leave.
         */
        clearRoom(state) {
            state.room = null;
            state.roomId = null;
        },
    },
});
export const { setRoomId, updateRoom, clearRoom } = roomSlice.actions;
export default roomSlice.reducer;
