import { createSlice } from "@reduxjs/toolkit";
import { AcceptRejectRequest, CancelRequest, GetRequests, GetUserData, SearchForUsers } from "@/redux/slices/actions/contactActions";

const initialState = {
  searchedUsersList: [],
  searchedUsersCount: null,

  showFriendsMenu: false,

  // notes stay sealed here and are opened only where they are shown
  incoming: [],
  outgoing: [],
  cooldowns: [],
  latestRequestsFetch: null,

  userData: {},
};

const slice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    // toggle friends menu
    setShowFriendsMenu(state) {
      state.showFriendsMenu = !state.showFriendsMenu;
    },

    clearSearchUsers: (state) => {
      state.searchedUsersList = [];
      state.searchedUsersCount = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(GetUserData.fulfilled, (state, action) => {
        state.userData = action.payload.userData;
      })
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
      });
  },
});

export const { setShowFriendsMenu, clearSearchUsers } = slice.actions;

export default slice.reducer;
