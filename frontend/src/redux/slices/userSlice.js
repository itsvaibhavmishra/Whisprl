import { createSlice } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

import {
  GetFriends,
  GetOnlineFriends,
  SearchFriends,
  UpdateProfile,
} from "./actions/userActions";
import { toast } from "sonner";

// initial state for contacts menu
const initialState = {
  isLoading: false,
  error: false,

  showFriendsMenu: false,

  user: {
    _id: "",
    firstName: "",
    lastName: "",
    avatar: "",
    email: "",
    activityStatus: "",
    token: "",
  },

  friends: [],
  onlineFriends: [],

  searchResults: [],
  searchCount: null,
};

const slice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // toggle snackbar
    openSnackbar(state, action) {
      const { severity, message, description } = action.payload;
      toast[severity](message, {
        description,
      });
    },
    closeSnackbar(state, action) {
      state.snackbar.open = false;
    },

    setShowFriendsMenu(state, action) {
      state.showFriendsMenu = !state.showFriendsMenu;
    },

    // update user information
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      axios.defaults.headers.common.Authorization = `Bearer ${action.payload.token}`;
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

    // update user information
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // update user information
    clearSearch: (state, action) => {
      state.searchResults = [];
      state.searchCount = null;
    },

    // logout reducer | being handled from auth
    logout: (state) => {
      state.isLoading = false;
      state.error = false;
      state.user = {
        _id: "",
        firstName: "",
        lastName: "",
        avatar: "",
        email: "",
        activityStatus: "",
        token: "",
      };
      state.friends = [];
      state.onlineFriends = [];
    },
  },
  extraReducers(builder) {
    builder
      // --------- Profile Builder ---------
      .addCase(UpdateProfile.pending, handlePending)
      .addCase(UpdateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload.user };
        state.isLoading = false;
        state.error = false;
      })
      .addCase(UpdateProfile.rejected, handleRejected)

      // --------- Search Friends Builder ---------
      .addCase(SearchFriends.pending, handlePending)
      .addCase(SearchFriends.fulfilled, (state, action) => {
        if (action.payload.usersFound === 0) {
          state.searchResults = null;
          state.searchCount = null;
        } else {
          state.searchResults = action.payload.friends;
          state.searchCount = action.payload.usersFound;
        }
        state.isLoading = false;
        state.error = false;
      })
      .addCase(SearchFriends.rejected, handleRejected)

      // --------- Get Friends Builder ---------
      .addCase(GetFriends.pending, handlePending)
      .addCase(GetFriends.fulfilled, (state, action) => {
        state.friends = action.payload.friends;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(GetFriends.rejected, handleRejected)

      // --------- Get Online Friends Builder ---------
      .addCase(GetOnlineFriends.pending, handlePending)
      .addCase(GetOnlineFriends.fulfilled, (state, action) => {
        state.onlineFriends = action.payload.onlineFriends;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(GetOnlineFriends.rejected, handleRejected);
  },
});

// function for pending and rejected handling
function handlePending(state, action) {
  state.isLoading = true;
  state.error = false;
}

function handleRejected(state, action) {
  state.isLoading = false;
  state.error = true;
}

// snackbar functions
export function ShowSnackbar({ severity, message, description }) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.openSnackbar({ severity, message, description }));
  };
}

// snackbar functions
export function HideSnackbar() {
  return async (dispatch, getState) => {
    dispatch(slice.actions.closeSnackbar());
  };
}

// set loading functions
export function SetLoading(value) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setLoading(value));
  };
}

// clear search functions
export function ClearSearch() {
  return async (dispatch, getState) => {
    dispatch(slice.actions.clearSearch());
  };
}

export const {
  setShowFriendsMenu,
  updateUser,
  updateOnlineUsers,
  removeFriend,
  logout,
  user,
} = slice.actions;

export default slice.reducer;
