import { createAsyncThunk } from "@reduxjs/toolkit";

import { ShowSnackbar, removeFriend } from "@/redux/slices/userSlice";

import axios from "@/utils/axios";
import { GetFriends } from "@/redux/slices/actions/userActions";

// ------------- Get Conversation Thunk -------------
export const GetUserData = createAsyncThunk(
  "user/getUserData",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get(`/user/getUserData/?userId=${id}`);

      return data;
    } catch (error) {
      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Remove Friend Thunk -------------
export const RemoveFriend = createAsyncThunk(
  "friends/remove-friend",
  async (friend_id, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post("/friends/remove-friend", {
        friend_id,
      });

      // remove friend from friends list
      dispatch(removeFriend(data));

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      return data;
    } catch (error) {
      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Get Friend Requests Thunk -------------
export const GetFriendRequests = createAsyncThunk(
  "friends/get-requests",
  async (arg, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get("/friends/get-requests");

      return data;
    } catch (error) {
      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Get Sent Requests Thunk -------------
export const GetSentRequests = createAsyncThunk(
  "friends/get-sent-requests",
  async (arg, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get("/friends/get-sent-requests");

      return data;
    } catch (error) {
      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Search Users Thunk -------------
export const SearchForUsers = createAsyncThunk(
  "user/search",
  async (searchData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get(
        `/user/search/?search=${searchData.keyword}&page=${
          searchData.page || 0
        }`
      );

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Send Request Thunk -------------
export const SendRequest = createAsyncThunk(
  "friends/send-request",
  async (receiver_id, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post("/friends/send-request", {
        receiver_id,
      });

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Unsend Request Thunk -------------
export const UnsendRequest = createAsyncThunk(
  "friends/cancel-request",
  async (receiver_id, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post("/friends/cancel-request", {
        receiver_id,
      });

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Accept/Reject Request Thunk -------------
export const AcceptRejectRequest = createAsyncThunk(
  "friends/accept-reject-request",
  async (values, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post("/friends/accept-reject-request", {
        sender_id: values.sender_id,
        action_type: values.type,
      });

      if (values.type === "accept") {
        dispatch(GetFriends());
      }

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);
