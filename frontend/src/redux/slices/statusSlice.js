import { createSlice } from "@reduxjs/toolkit";

import { BlockUser } from "@/redux/slices/actions/chatSettingsActions";
import { GetDiscover, GetHiddenFrom, GetPublicStatusesOf, GetStatuses, SetHiddenFrom } from "@/redux/slices/actions/statusActions";
import { logout } from "@/redux/slices/userSlice";

const initialState = {
  // oldest first, each with its decrypted `content`
  statuses: [],
  // updates for everyone from people who are not friends, in the same order
  discover: [],
  // how far this tab's status has got through compressing and uploading, in percent, or null when nothing is posting
  posting: null,
  hiddenFrom: [],
};

const statusById = (state, statusId) => [...state.statuses, ...state.discover].find((status) => status._id === statusId);

const slice = createSlice({
  name: "status",
  initialState,
  reducers: {
    statusAdded: (state, action) => {
      state.statuses = [...state.statuses.filter((status) => status._id !== action.payload._id), action.payload];
    },
    statusRemoved: (state, action) => {
      state.statuses = state.statuses.filter((status) => status._id !== action.payload._id);
      state.discover = state.discover.filter((status) => status._id !== action.payload._id);
    },
    statusSeen: (state, action) => {
      const status = statusById(state, action.payload);
      if (status) status.isViewed = true;
    },
    // a later event about the same viewer, such as their reaction, is folded into their one view
    viewSaved: (state, action) => {
      const status = state.statuses.find((each) => each._id === action.payload.status_id);
      if (!status?.views) return;
      const earlier = status.views.find((view) => view.user._id === action.payload.view.user._id);
      if (earlier) Object.assign(earlier, action.payload.view, { viewedAt: earlier.viewedAt });
      else status.views.push(action.payload.view);
    },
    reactionChosen: (state, action) => {
      const status = statusById(state, action.payload.statusId);
      if (status) Object.assign(status, { myReaction: action.payload.emoji, isViewed: true });
    },
    postingProgress: (state, action) => {
      state.posting = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(GetStatuses.fulfilled, (state, action) => {
        state.statuses = action.payload;
      })
      .addCase(GetDiscover.fulfilled, (state, action) => {
        state.discover = action.payload;
      })
      .addCase(GetPublicStatusesOf.fulfilled, (state, action) => {
        const known = new Set(state.discover.map((status) => status._id));
        state.discover.push(...action.payload.filter((status) => !known.has(status._id)));
      })
      .addCase(GetHiddenFrom.fulfilled, (state, action) => {
        state.hiddenFrom = action.payload;
      })
      .addCase(SetHiddenFrom.fulfilled, (state, action) => {
        state.hiddenFrom = action.payload;
      })
      .addCase(BlockUser.fulfilled, (state, action) => {
        const isTheirs = (status) => status.owner._id === action.payload._id;
        state.statuses = state.statuses.filter((status) => !isTheirs(status));
        state.discover = state.discover.filter((status) => !isTheirs(status));
      })
      .addCase(logout, () => initialState);
  },
});

export default slice.reducer;

export const { statusAdded, statusRemoved, statusSeen, viewSaved, reactionChosen, postingProgress } = slice.actions;
