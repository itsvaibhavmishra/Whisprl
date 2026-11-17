import { createSlice, isAnyOf } from "@reduxjs/toolkit";

import { EndSession, GoogleLogin, ReviewerLogin } from "@/redux/slices/actions/authActions";

const initialState = {
  isLoggedIn: false,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  // the thunks import this slice too, so they are only read once the reducer is built
  extraReducers(builder) {
    builder
      .addCase(EndSession.fulfilled, (state) => {
        state.isLoggedIn = false;
      })
      .addMatcher(isAnyOf(GoogleLogin.fulfilled, ReviewerLogin.fulfilled), (state, action) => {
        state.isLoggedIn = Boolean(action.payload.user);
      });
  },
});

export default slice.reducer;
