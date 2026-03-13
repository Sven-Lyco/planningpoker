import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ActiveReaction {
  /** Unique ID for this animation instance. */
  id: string;
  emoji: string;
  /** ID of the player who sent the reaction. */
  playerId: string;
  /** ID of the player this reaction is aimed at. */
  targetPlayerId: string;
}

interface ReactionsState {
  active: ActiveReaction[];
}

const initialState: ReactionsState = {
  active: [],
};

/**
 * Manages the list of currently animating emoji reactions on the table.
 */
const reactionsSlice = createSlice({
  name: "reactions",
  initialState,
  reducers: {
    /**
     * Adds a new reaction to the animation queue.
     */
    addReaction(state, action: PayloadAction<ActiveReaction>) {
      state.active.push(action.payload);
    },

    /**
     * Removes a reaction once its animation has completed.
     */
    removeReaction(state, action: PayloadAction<string>) {
      state.active = state.active.filter((r) => r.id !== action.payload);
    },
  },
});

export const { addReaction, removeReaction } = reactionsSlice.actions;
export default reactionsSlice.reducer;
