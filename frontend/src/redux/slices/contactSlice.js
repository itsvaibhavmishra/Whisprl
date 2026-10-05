import { createSlice } from "@reduxjs/toolkit";
import {
  AcceptRejectRequest,
  GetFriendRequests,
  GetSentRequests,
  GetUserData,
  SearchForUsers,
  SendRequest,
  UnsendRequest,
} from "@/redux/slices/actions/contactActions";

const initialState = {
  searchedUsersList: [],
  searchedUsersCount: null,

  showFriendsMenu: false,

  sentRequests: [],

  friendRequests: [],

  userData: {},
};

const markSent = (state, receiverId, isSent) => {
  const request = state.sentRequests.find((sent) => sent.receiverId === receiverId);
  if (request) request.isSent = isSent;
  else state.sentRequests.push({ receiverId, isSent });
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
      .addCase(GetFriendRequests.fulfilled, (state, action) => {
        state.friendRequests = action.payload.friendRequests;
      })
      .addCase(SearchForUsers.fulfilled, (state, action) => {
        const found = action.payload.usersFound > 0;
        state.searchedUsersList = found ? action.payload.users : null;
        state.searchedUsersCount = found ? action.payload.usersFound : null;
        state.sentRequests = [];
      })
      .addCase(SendRequest.fulfilled, (state, action) => {
        markSent(state, action.payload.receiver._id, true);
      })
      .addCase(UnsendRequest.fulfilled, (state, action) => {
        markSent(state, action.payload.receiver_id, false);
      })
      .addCase(AcceptRejectRequest.fulfilled, (state, action) => {
        state.friendRequests = state.friendRequests.filter(
          (request) => request?.sender?._id !== action.payload.sender_id
        );
      })
      .addCase(GetSentRequests.fulfilled, (state, action) => {
        state.sentRequests = action.payload.sentRequests;
      });
  },
});

export const { setShowFriendsMenu, clearSearchUsers } = slice.actions;

export default slice.reducer;
