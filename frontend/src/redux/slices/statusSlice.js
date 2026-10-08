import { createSlice } from "@reduxjs/toolkit";

import { GetHiddenFrom, GetStatuses, SetHiddenFrom } from "@/redux/slices/actions/statusActions";
import { logout } from "@/redux/slices/userSlice";

const initialState = {
  // oldest first, each with its decrypted `content`
  statuses: [],
  // how far this tab's status has got through compressing and uploading, in percent, or null when nothing is posting
  posting: null,
  hiddenFrom: [],
};

const slice = createSlice({
  name: "status",
  initialState,
  reducers: {
    statusAdded: (state, action) => {
      state.statuses = [...state.statuses.filter((status) => status._id !== action.payload._id), action.payload];
    },
    statusRemoved: (state, action) => {
      state.statuses = state.statuses.filter((status) => status._id !== action.payload._id);
    },
    statusSeen: (state, action) => {
      const status = state.statuses.find((each) => each._id === action.payload);
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
      const status = state.statuses.find((each) => each._id === action.payload.statusId);
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
      .addCase(GetHiddenFrom.fulfilled, (state, action) => {
        state.hiddenFrom = action.payload;
      })
      .addCase(SetHiddenFrom.fulfilled, (state, action) => {
        state.hiddenFrom = action.payload;
      })
      .addCase(logout, () => initialState);
  },
});

export default slice.reducer;

export const { statusAdded, statusRemoved, statusSeen, viewSaved, reactionChosen, postingProgress } = slice.actions;
