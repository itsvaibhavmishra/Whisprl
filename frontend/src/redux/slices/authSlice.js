import { createSlice, isAnyOf } from "@reduxjs/toolkit";

import {
  EndSession,
  GithubLogin,
  GoogleLogin,
  LinkedinLogin,
  LoginUser,
  VerifyOTP,
} from "@/redux/slices/actions/authActions";

const initialState = {
  isLoggedIn: false,
  otpEmail: "",
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateOtpEmail(state, action) {
      state.otpEmail = action.payload.otpEmail;
    },
  },
  // the thunks import this slice too, so they are only read once the reducer is built
  extraReducers(builder) {
    const signIns = [LoginUser, GoogleLogin, GithubLogin, LinkedinLogin, VerifyOTP];

    builder
      .addCase(EndSession.fulfilled, (state) => {
        state.isLoggedIn = false;
      })
      .addMatcher(isAnyOf(...signIns.map((thunk) => thunk.fulfilled)), (state, action) => {
        state.isLoggedIn = Boolean(action.payload.user);
      });
  },
});

export const { updateOtpEmail } = slice.actions;

export default slice.reducer;
