import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import {
  AcceptRejectRequest,
  CancelRequest,
  FindEveryone,
  FindProfile,
  GetRequests,
  GetSuggestions,
  GetUserData,
  HideSuggestion,
  SearchForUsers,
} from "@/redux/slices/actions/contactActions";

const initialState = {
  searchedUsersList: [],
  searchedUsersCount: null,

  // the words these answer, so a search still being typed never shows the last one's results as its own
  everyone: { keyword: null, people: [], total: 0, pages: 0 },

  // notes stay sealed here and are opened only where they are shown
  incoming: [],
  outgoing: [],
  cooldowns: [],
  latestRequestsFetch: null,

  // each person's full profile once fetched, so opening it again shows at once while it refreshes
  profiles: {},

  suggestions: [],
};

const slice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    clearSearchUsers: (state) => {
      state.searchedUsersList = [];
      state.searchedUsersCount = null;
    },
  },
  extraReducers(builder) {
    builder
      // a burst of changes starts overlapping fetches, and only the newest may land
      .addCase(GetRequests.pending, (state, action) => {
        state.latestRequestsFetch = action.meta.requestId;
      })
      .addCase(GetRequests.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestRequestsFetch) return;
        const { incoming, outgoing, cooldowns } = action.payload;
        Object.assign(state, { incoming, outgoing, cooldowns });
      })
      .addCase(SearchForUsers.fulfilled, (state, action) => {
        const found = action.payload.usersFound > 0;
        state.searchedUsersList = found ? action.payload.users : null;
        state.searchedUsersCount = found ? action.payload.usersFound : null;
      })
      .addCase(AcceptRejectRequest.fulfilled, (state, action) => {
        state.incoming = state.incoming.filter((request) => request.person._id !== action.payload.sender_id);
      })
      .addCase(CancelRequest.fulfilled, (state, action) => {
        state.outgoing = state.outgoing.filter((request) => request.person._id !== action.payload.receiver_id);
      })
      .addCase(FindEveryone.fulfilled, (state, action) => {
        const { keyword, page = 0 } = action.meta.arg;
        const earlier = page > 0 && state.everyone.keyword === keyword ? state.everyone.people : [];
        state.everyone = { keyword, people: [...earlier, ...action.payload.users], total: action.payload.usersFound, pages: page + 1 };
      })
      .addCase(GetSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload.suggestions;
      })
      .addCase(HideSuggestion.pending, (state, action) => {
        state.suggestions = state.suggestions.filter((person) => person._id !== action.meta.arg);
      })
      .addMatcher(isAnyOf(GetUserData.fulfilled, FindProfile.fulfilled), (state, action) => {
        state.profiles[action.payload.userData._id] = action.payload.userData;
      });
  },
});

export const { clearSearchUsers } = slice.actions;

export default slice.reducer;
