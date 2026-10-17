import { createSlice } from "@reduxjs/toolkit";

import { CloseGame, GetLeaderboard, UnwatchGame, WatchGame } from "@/redux/slices/actions/gameActions";
import { logout } from "@/redux/slices/userSlice";

// a socket watches the game of the one chat on screen, so there is one view at a time
const initialState = {
  watching: null,
  view: null,
  collapsed: false,
  seatSwitch: null,
  leaderboard: null,
  // the result someone stepped back from, so closing and reopening the panel does not show it again
  dismissedResult: null,
};

const slice = createSlice({
  name: "game",
  initialState,
  reducers: {
    gameStateReceived(state, { payload }) {
      if (payload.conversationId !== state.watching) return;
      // updates can overtake each other on the way, and an older one must not undo a newer one
      if (state.view && state.view.revision >= payload.revision) return;
      state.view = payload;
    },
    gameCollapsed(state, { payload }) {
      state.collapsed = payload;
    },
    resultDismissed(state, { payload }) {
      state.dismissedResult = payload;
    },
    seatSwitchOffered(state, { payload }) {
      state.seatSwitch = payload;
    },
    seatSwitchClosed(state) {
      state.seatSwitch = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(WatchGame.pending, (state, { meta }) => {
        if (state.watching === meta.arg) return;
        state.watching = meta.arg;
        state.view = null;
        state.collapsed = false;
      })
      .addCase(UnwatchGame.pending, (state) => {
        state.watching = null;
        state.view = null;
      })
      .addCase(CloseGame.pending, (state, { meta }) => {
        if (state.view?.conversationId === meta.arg) state.view.session = null;
      })
      .addCase(GetLeaderboard.fulfilled, (state, { payload }) => {
        state.leaderboard = payload;
      })
      .addCase(logout, () => initialState);
  },
});

export const { gameStateReceived, gameCollapsed, resultDismissed, seatSwitchOffered, seatSwitchClosed } = slice.actions;

export const selectGameSession = (state) => state.game.view?.session ?? null;

export default slice.reducer;
