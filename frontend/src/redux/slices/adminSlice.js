import { createSlice } from "@reduxjs/toolkit";

import { GetAuditLog, GetGameRequests, GetOverview, GetPeople, GetReports, GetTeam } from "@/redux/slices/actions/adminActions";
import { logout } from "@/redux/slices/userSlice";

const initialState = {
  overview: null,
  latestOverviewFetch: null,
  people: { list: null, total: 0, hasMore: false },
  latestPeopleFetch: null,
  reports: { list: null, total: 0, hasMore: false },
  latestReportsFetch: null,
  gameRequests: { list: null, total: 0, hasMore: false, mostAsked: 0 },
  latestGameRequestsFetch: null,
  team: null,
  // entries stay null until the first page arrives, so an empty log is told apart from one not read yet
  audit: { entries: null, hasMore: false },
};

const slice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      // changing the range quickly starts overlapping fetches, and only the newest may land
      .addCase(GetOverview.pending, (state, action) => {
        state.latestOverviewFetch = action.meta.requestId;
      })
      .addCase(GetOverview.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestOverviewFetch) return;
        const { totals, active, range, daily } = action.payload;
        state.overview = { totals, active, range, daily };
      })
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
      .addCase(GetAuditLog.fulfilled, (state, action) => {
        const { entries, hasMore } = action.payload;
        // a page asked for without a starting point is the newest, so it replaces whatever was shown
        state.audit = { entries: action.meta.arg ? [...state.audit.entries, ...entries] : entries, hasMore };
      })
      .addCase(logout, () => initialState);
  },
});

export default slice.reducer;
