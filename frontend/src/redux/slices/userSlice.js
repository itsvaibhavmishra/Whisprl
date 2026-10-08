import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import {
  GetFriends,
  GetMyProfile,
  GetOnlineFriends,
  SearchFriends,
  UpdateProfile,
  UpdateQuickReactions,
  UpdateUsername,
} from "@/redux/slices/actions/userActions";
import { AddPasskey, GetPasskeys, LinkPasskey, RemovePasskey } from "@/redux/slices/actions/passkeyActions";
import { BlockUser, GetBlocked, UnblockUser } from "@/redux/slices/actions/chatSettingsActions";

// initial state for contacts menu
const initialState = {
  showFriendsMenu: false,

  user: {
    _id: "",
    firstName: "",
    lastName: "",
    avatar: "",
    cover: "",
    email: "",
    activityStatus: "",
  },
  accountSummary: null,
  passkeys: [],
  blockedPeople: [],

  friends: [],
  onlineFriends: [],

  searchResults: [],
  searchCount: null,
};

const slice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setShowFriendsMenu(state, action) {
      state.showFriendsMenu = !state.showFriendsMenu;
    },

    // update user information
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },

    // update online users
    updateOnlineUsers: (state, action) => {
      const { _id, firstName, lastName, avatar, onlineStatus } = action.payload;
      const index = state.onlineFriends.findIndex(
        (friend) => friend._id === _id
      );

      if (index !== -1) {
        // If user is already in onlineFriends array, update onlineStatus
        state.onlineFriends[index].onlineStatus = onlineStatus;
      } else {
        // If user is not in onlineFriends array, add the whole object to the array
        state.onlineFriends.push({
          _id,
          firstName,
          lastName,
          avatar,
          onlineStatus,
        });
      }
    },

    // remove friend based on friend's _id
    removeFriend: (state, action) => {
      const { friend_id } = action.payload;

      // Find index of friend to remove
      const index = state.friends.findIndex(
        (friend) => friend._id === friend_id
      );
      if (index !== -1) {
        // Remove friend from friends array
        state.friends.splice(index, 1);
      }
    },

    clearSearch: (state, action) => {
      state.searchResults = [];
      state.searchCount = null;
    },

    // logout reducer | being handled from auth
    logout: (state) => {
      state.user = {
        _id: "",
        firstName: "",
        lastName: "",
        avatar: "",
        cover: "",
        email: "",
        activityStatus: "",
      };
      state.accountSummary = null;
      state.passkeys = [];
      state.friends = [];
      state.onlineFriends = [];
    },
  },
  extraReducers(builder) {
    builder
      .addCase(UpdateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload.user };
      })
      .addCase(GetBlocked.fulfilled, (state, action) => {
        state.blockedPeople = action.payload;
      })
      .addCase(BlockUser.fulfilled, (state, action) => {
        state.user.blocked = [...(state.user.blocked ?? []), action.payload._id];
        state.onlineFriends = state.onlineFriends.filter((friend) => friend._id !== action.payload._id);
        state.blockedPeople = [...state.blockedPeople.filter((person) => person._id !== action.payload._id), action.payload];
      })
      .addCase(UnblockUser.fulfilled, (state, action) => {
        state.user.blocked = (state.user.blocked ?? []).filter((userId) => userId !== action.payload);
        state.blockedPeople = state.blockedPeople.filter((person) => person._id !== action.payload);
      })
      .addCase(UpdateUsername.fulfilled, (state, action) => {
        const { username, usernameChangedAt } = action.payload;
        state.user = { ...state.user, username, usernameChangedAt };
      })
      .addCase(UpdateQuickReactions.fulfilled, (state, action) => {
        state.user.quickReactions = action.payload.quickReactions;
      })
      .addCase(GetMyProfile.fulfilled, (state, action) => {
        const { firstName, lastName, username, usernameChangedAt, avatar, cover, coverStyle, email, activityStatus, ...summary } = action.payload.user;
        state.user = { ...state.user, firstName, lastName, username, usernameChangedAt, avatar, cover, coverStyle, email, activityStatus };
        state.accountSummary = summary;
      })
      .addCase(SearchFriends.fulfilled, (state, action) => {
        const found = action.payload.usersFound > 0;
        state.searchResults = found ? action.payload.friends : null;
        state.searchCount = found ? action.payload.usersFound : null;
      })
      .addCase(GetFriends.fulfilled, (state, action) => {
        state.friends = action.payload.friends;
      })
      .addCase(GetOnlineFriends.fulfilled, (state, action) => {
        state.onlineFriends = action.payload.onlineFriends;
      })
      .addMatcher(
        isAnyOf(GetPasskeys.fulfilled, AddPasskey.fulfilled, LinkPasskey.fulfilled, RemovePasskey.fulfilled),
        (state, action) => {
          state.passkeys = action.payload.passkeys;
        }
      );
  },
});

export const { setShowFriendsMenu, updateUser, updateOnlineUsers, removeFriend, clearSearch, logout } = slice.actions;

export default slice.reducer;
