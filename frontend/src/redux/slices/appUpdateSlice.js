import { createSlice } from "@reduxjs/toolkit";

import { CheckForAppUpdate, StartAppUpdate } from "@/redux/slices/actions/appUpdateActions";

// Play's states while it fetches and installs an update; anything else means there is no download to show
export const DOWNLOADING = ["pending", "downloading", "installing"];
const UNDER_WAY = [...DOWNLOADING, "downloaded"];

const initialState = { notice: null, download: null, isDismissed: false };

const slice = createSlice({
  name: "appUpdate",
  initialState,
  reducers: {
    dismissAppUpdate(state) {
      state.isDismissed = true;
    },
    playProgressed(state, action) {
      state.download = UNDER_WAY.includes(action.payload.status) ? action.payload : null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(CheckForAppUpdate.fulfilled, (state, action) => {
        const { notice, status } = action.payload;
        state.notice = notice;
        // a download Play finished while the app was closed still needs its restart
        if (!UNDER_WAY.includes(status)) state.download = null;
        else if (state.download?.status !== status) state.download = { status };
      })
      .addCase(StartAppUpdate.fulfilled, (state, action) => {
        if (action.payload && action.meta.arg === "flexible") state.download = { status: "pending" };
      });
  },
});

export const { dismissAppUpdate, playProgressed } = slice.actions;

export default slice.reducer;
