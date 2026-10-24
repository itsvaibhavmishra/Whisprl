import { createSlice } from "@reduxjs/toolkit";

import { CloseGame, GetLeaderboard, UnwatchGame, WatchGame } from "@/redux/slices/actions/gameActions";
import { logout } from "@/redux/slices/userSlice";

// a socket watches the game of the one chat on screen, so there is one view at a time
const initialState = {
  watching: null,
  // counts the watches the server confirmed, since a new watch starts out not looking at the game
  watchCount: 0,
  view: null,
  // who has this game on screen rather than minimised, which decides whose messages float across it
  lookers: [],
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
    gameStateReceived: {
      reducer(state, { payload }) {
        if (payload.conversationId !== state.watching) return;
        // updates can overtake each other on the way, and an older one must not undo a newer one
        if (state.view && state.view.revision >= payload.revision) return;
        state.view = payload;
        state.lookers = payload.lookers ?? [];
      },
      // stamped on arrival, so a wait the server sends in milliseconds counts from here, whatever this phone's clock says
      prepare: (payload) => ({ payload: { ...payload, receivedAt: Date.now() } }),
    },
    lookersChanged(state, { payload }) {
      if (payload.conversationId === state.watching) state.lookers = payload.users;
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
        state.lookers = [];
        state.collapsed = false;
      })
      .addCase(WatchGame.fulfilled, (state) => {
        state.watchCount += 1;
      })
      .addCase(UnwatchGame.pending, (state) => {
        state.watching = null;
        state.view = null;
        state.lookers = [];
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

export const { gameStateReceived, lookersChanged, gameCollapsed, resultDismissed, seatSwitchOffered, seatSwitchClosed } = slice.actions;

export const selectGameSession = (state) => state.game.view?.session ?? null;

export const selectViewReceivedAt = (state) => state.game.view?.receivedAt ?? 0;

// the game of a chat, while that chat is open and its game is on screen rather than minimised
export const selectGameOnScreen = ({ game }, conversationId) =>
  game.watching === conversationId && game.view?.session && !game.collapsed ? game.view.session.game : null;

export default slice.reducer;
