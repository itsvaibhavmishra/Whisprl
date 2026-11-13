import { createSlice } from "@reduxjs/toolkit";

import {
  ChangeAppUpdates,
  GetAnnouncedGames,
  GetAnnouncements,
  GetAppUpdates,
  GetAudienceSizes,
  GetGameRequests,
  GetPeople,
  GetReports,
  GetTeam,
} from "@/redux/slices/actions/adminActions";
import { logout } from "@/redux/slices/userSlice";

const initialState = {
  people: { list: null, total: 0, hasMore: false },
  latestPeopleFetch: null,
  reports: { list: null, total: 0, hasMore: false },
  latestReportsFetch: null,
  gameRequests: { list: null, total: 0, hasMore: false, mostAsked: 0 },
  latestGameRequestsFetch: null,
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
      // a quick change starts overlapping fetches, and only the newest may land
      .addCase(GetPeople.pending, (state, action) => {
        state.latestPeopleFetch = action.meta.requestId;
      })
      .addCase(GetPeople.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestPeopleFetch) return;
        const { people, total, hasMore } = action.payload;
        state.people = { list: action.meta.arg.page ? [...state.people.list, ...people] : people, total, hasMore };
      })
      .addCase(GetReports.pending, (state, action) => {
        state.latestReportsFetch = action.meta.requestId;
      })
      .addCase(GetReports.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestReportsFetch) return;
        const { reports, total, hasMore } = action.payload;
        state.reports = { list: action.meta.arg.page ? [...state.reports.list, ...reports] : reports, total, hasMore };
      })
      .addCase(GetGameRequests.pending, (state, action) => {
        state.latestGameRequestsFetch = action.meta.requestId;
      })
      .addCase(GetGameRequests.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestGameRequestsFetch) return;
        const { groups, total, hasMore, mostAsked } = action.payload;
        state.gameRequests = { list: action.meta.arg.page ? [...state.gameRequests.list, ...groups] : groups, total, hasMore, mostAsked };
      })
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
