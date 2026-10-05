import { createAsyncThunk } from "@reduxjs/toolkit";

import { ShowSnackbar } from "@/redux/slices/userSlice";

import axios from "@/utils/axios";

const blobUrlToFile = async (blobUrl, fileName) => {
  const blob = await (await fetch(blobUrl)).blob();
  return new File([blob], fileName, { type: blob.type });
};

const showError = (dispatch, error) =>
  dispatch(
    ShowSnackbar({
      severity: error?.error?.status || "error",
      message: error?.error?.message || "Something went wrong, please try again",
    })
  );

// ------------- Update Profile Thunk -------------
export const UpdateProfile = createAsyncThunk(
  "user/update-profile",
  async ({ firstName, lastName, activityStatus, ...images }, { rejectWithValue, dispatch, getState }) => {
    try {
      const saved = getState().user.user;
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("activityStatus", activityStatus);
      for (const [kind, removeField] of [["avatar", "removeAvatar"], ["cover", "removeCover"]]) {
        if (images[kind].startsWith("blob:")) {
          formData.append(kind, await blobUrlToFile(images[kind], `${kind}.jpg`));
        } else if (!images[kind] && saved[kind]) {
          formData.append(removeField, "true");
        }
      }

      const { data } = await axios.post("/user/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(ShowSnackbar({ severity: data.status, message: data.message }));
      return data;
    } catch (error) {
      showError(dispatch, error);
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Get My Profile Thunk -------------
export const GetMyProfile = createAsyncThunk(
  "user/me",
  async (arg, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get("/user/me");
      return data;
    } catch (error) {
      showError(dispatch, error);
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Change Password Thunk -------------
export const ChangePassword = createAsyncThunk(
  "user/change-password",
  async (passwords, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post("/user/change-password", passwords);
      dispatch(ShowSnackbar({ severity: data.status, message: data.message }));
      return data;
    } catch (error) {
      showError(dispatch, error);
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Search Friends Thunk -------------
export const SearchFriends = createAsyncThunk(
  "friends/search",
  async (searchData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get(
        `/friends/search/?search=${searchData.keyword}&page=${
          searchData.page || 0
        }`
      );

      return data;
    } catch (error) {
      showError(dispatch, error);
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Get Friends Thunk -------------
export const GetFriends = createAsyncThunk(
  "friends/get-friends",
  async (arg, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get("/friends/get-friends");

      return data;
    } catch (error) {
      showError(dispatch, error);
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Get Online Friends Thunk -------------
export const GetOnlineFriends = createAsyncThunk(
  "friends/online-friends",
  async (arg, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get("/friends/online-friends");

      return data;
    } catch (error) {
      showError(dispatch, error);
      return rejectWithValue(error.error);
    }
  }
);
