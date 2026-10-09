import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import {
  GetFriends,
  GetMyProfile,
  GetOnlineFriends,
  SearchFriends,
  UpdateBirthdaySetting,
  UpdateProfile,
  UpdateQuickReactions,
  UpdateSuggestionSetting,
  UpdateUsername,
} from "@/redux/slices/actions/userActions";
import { AddPasskey, GetPasskeys, LinkPasskey, RemovePasskey } from "@/redux/slices/actions/passkeyActions";
import { BlockUser, GetBlocked, UnblockUser } from "@/redux/slices/actions/chatSettingsActions";
import { ConfirmRecoveryKeySaved, ConfirmUsername, GetOnboarding, MarkWhatsNewSeen, SaveBirthdayStep, SkipSetupStep } from "@/redux/slices/actions/onboardingActions";

const initialState = {
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
  latestProfileRead: null,
  latestOnboardingRead: null,
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
      .addCase(UpdateProfile.pending, (state) => {
        state.latestProfileRead = null;
      })
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
      .addCase(UpdateSuggestionSetting.pending, (state, action) => {
        state.user.suggestToFriendsOfFriends = action.meta.arg;
      })
      .addCase(UpdateSuggestionSetting.fulfilled, (state, action) => {
        state.user.suggestToFriendsOfFriends = action.payload.suggestToFriendsOfFriends;
      })
      .addCase(UpdateSuggestionSetting.rejected, (state, action) => {
        state.user.suggestToFriendsOfFriends = !action.meta.arg;
      })
      .addCase(UpdateBirthdaySetting.pending, (state, action) => {
        state.user.showBirthdayToFriends = action.meta.arg;
      })
      .addCase(UpdateBirthdaySetting.fulfilled, (state, action) => {
        state.user.showBirthdayToFriends = action.payload.showBirthdayToFriends;
      })
      .addCase(UpdateBirthdaySetting.rejected, (state, action) => {
        state.user.showBirthdayToFriends = !action.meta.arg;
      })
      .addCase(GetOnboarding.pending, (state, action) => {
        state.latestOnboardingRead = action.meta.requestId;
      })
      .addCase(GetOnboarding.fulfilled, (state, action) => {
        // a step saved while this was loading is newer than what it brought back
        if (action.meta.requestId !== state.latestOnboardingRead) return;
        state.user = { ...state.user, ...action.payload.user };
      })
      .addCase(GetMyProfile.pending, (state, action) => {
        state.latestProfileRead = action.meta.requestId;
      })
      .addCase(GetMyProfile.fulfilled, (state, action) => {
        const { firstName, lastName, username, usernameChangedAt, avatar, cover, coverStyle, email, activityStatus, ...summary } = action.payload.user;
        state.accountSummary = summary;
        // a save that landed while this was loading is newer than what it brought back
        if (action.meta.requestId !== state.latestProfileRead) return;
        state.user = { ...state.user, firstName, lastName, username, usernameChangedAt, avatar, cover, coverStyle, email, activityStatus };
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
        isAnyOf(SaveBirthdayStep.pending, ConfirmUsername.pending, ConfirmRecoveryKeySaved.pending, SkipSetupStep.pending, MarkWhatsNewSeen.pending),
        (state) => {
          state.latestOnboardingRead = null;
        }
      )
      .addMatcher(
        isAnyOf(SaveBirthdayStep.fulfilled, ConfirmUsername.fulfilled, ConfirmRecoveryKeySaved.fulfilled, SkipSetupStep.fulfilled, MarkWhatsNewSeen.fulfilled),
        (state, action) => {
          state.user = { ...state.user, ...action.payload.user };
        }
      )
      .addMatcher(
        isAnyOf(GetPasskeys.fulfilled, AddPasskey.fulfilled, LinkPasskey.fulfilled, RemovePasskey.fulfilled),
        (state, action) => {
          state.passkeys = action.payload.passkeys;
        }
      );
  },
});

export const { updateUser, updateOnlineUsers, removeFriend, clearSearch, logout } = slice.actions;

export default slice.reducer;
