import { configureStore } from "@reduxjs/toolkit";
import roomReducer from "./roomSlice";
import playerReducer from "./playerSlice";
import reactionsReducer from "./reactionsSlice";

export const store = configureStore({
  reducer: {
    room: roomReducer,
    player: playerReducer,
    reactions: reactionsReducer,
  },
});

/** Inferred root state type from the store. */
export type RootState = ReturnType<typeof store.getState>;

/** Inferred dispatch type from the store. */
export type AppDispatch = typeof store.dispatch;
