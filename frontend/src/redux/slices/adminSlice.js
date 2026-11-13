import { createSlice } from "@reduxjs/toolkit";

import { ChangeAppUpdates, GetAnnouncedGames, GetAnnouncements, GetAppUpdates, GetAudienceSizes, GetTeam } from "@/redux/slices/actions/adminActions";
import { logout } from "@/redux/slices/userSlice";

const initialState = {
  team: null,
  appUpdates: null,
  announcements: { list: null, hasMore: false },
  audienceSizes: null,
  announcedGames: null,
};

const slice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(GetTeam.fulfilled, (state, action) => {
        state.team = action.payload.members;
      })
      .addCase(GetAppUpdates.fulfilled, (state, action) => {
        state.appUpdates = action.payload;
      })
      .addCase(ChangeAppUpdates.fulfilled, (state, action) => {
        state.appUpdates = action.payload.policy;
      })
      .addCase(GetAnnouncements.fulfilled, (state, action) => {
        const { announcements, hasMore } = action.payload;
        state.announcements = { list: action.meta.arg ? [...state.announcements.list, ...announcements] : announcements, hasMore };
      })
      .addCase(GetAnnouncedGames.fulfilled, (state, action) => {
        state.announcedGames = action.payload;
      })
      .addCase(GetAudienceSizes.fulfilled, (state, action) => {
        state.audienceSizes = action.payload;
      })
      .addCase(logout, () => initialState);
  },
});

export default slice.reducer;
