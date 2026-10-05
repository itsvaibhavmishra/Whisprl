import { createSlice } from "@reduxjs/toolkit";

import {
  AddOtpEmail,
  ForgotPassword,
  GithubLogin,
  GoogleLogin,
  LinkedinLogin,
  LoginUser,
  LogoutUser,
  RefreshToken,
  RegisterUser,
  ResetPassword,
  SendOTP,
  StartServer,
  VerifyOTP,
} from "@/redux/slices/actions/authActions";

// initial state for logged in status
const initialState = {
  isLoggedIn: false,

  isLoading: false,
  error: false,

  otpEmail: "",
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // updating otp email state
    updateOtpEmail(state, action) {
      state.otpEmail = action.payload.otpEmail;
    },
  },
  extraReducers(builder) {
    builder
      // --------- Start Server Builder ---------
      .addCase(StartServer.pending, (state, action) => {
        state.isLoading = false;
        state.error = false;
      })
      .addCase(StartServer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = false;
      })
      .addCase(StartServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = true;
      })

      // --------- Login Builder ---------
      .addCase(LoginUser.pending, handlePending)
      .addCase(LoginUser.fulfilled, handleLoginSuccess)
      .addCase(LoginUser.rejected, handleRejected)

      // --------- Google Login Builder ---------
      .addCase(GoogleLogin.pending, handlePending)
      .addCase(GoogleLogin.fulfilled, handleLoginSuccess)
      .addCase(GoogleLogin.rejected, handleRejected)

      // --------- GitHub Login Builder ---------
      .addCase(GithubLogin.pending, handlePending)
      .addCase(GithubLogin.fulfilled, handleLoginSuccess)
      .addCase(GithubLogin.rejected, handleRejected)

      // --------- LinkedIn Login Builder ---------
      .addCase(LinkedinLogin.pending, handlePending)
      .addCase(LinkedinLogin.fulfilled, handleLoginSuccess)
      .addCase(LinkedinLogin.rejected, handleRejected)

      // --------- Logout Builder ---------
      .addCase(LogoutUser.pending, handlePending)
      .addCase(LogoutUser.fulfilled, (state, action) => {
        state.isLoggedIn = false;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(LogoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = true;
      })

      // --------- Register Builder ---------
      .addCase(RegisterUser.pending, handlePending)
      .addCase(RegisterUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = false;
      })
      .addCase(RegisterUser.rejected, handleRejected)

      // --------- Verify OTP Builder ---------
      .addCase(VerifyOTP.pending, handlePending)
      .addCase(VerifyOTP.fulfilled, (state, action) => {
        // check if user is verified
        if (action.payload.user) {
          state.isLoggedIn = true;
          // redirect user to profile
          setTimeout(() => {
            window.location.href = "/profile";
          });
        } else {
          state.isLoggedIn = false;
        }
        state.isLoading = false;
        state.error = false;
      })
      .addCase(VerifyOTP.rejected, handleRejected)

      // --------- Send OTP Builder ---------
      .addCase(SendOTP.pending, handlePending)
      .addCase(SendOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = false;
      })
      .addCase(SendOTP.rejected, handleRejected)

      // --------- Add Email Builder ---------
      .addCase(AddOtpEmail.pending, handlePending)
      .addCase(AddOtpEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = false;
      })
      .addCase(AddOtpEmail.rejected, handleRejected)

      // --------- Forgot Password Builder ---------
      .addCase(ForgotPassword.pending, handlePending)
      .addCase(ForgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = false;
      })
      .addCase(ForgotPassword.rejected, handleRejected)

      // --------- Reset Password Builder ---------
      .addCase(ResetPassword.pending, handlePending)
      .addCase(ResetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = false;
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      })
      .addCase(ResetPassword.rejected, handleRejected)

      // --------- Refresh Token Builder ---------
      .addCase(RefreshToken.pending, handlePending)
      .addCase(RefreshToken.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(RefreshToken.rejected, handleRejected);
  },
});

function handlePending(state, action) {
  state.isLoading = true;
  state.error = false;
}
function handleRejected(state, action) {
  state.isLoading = false;
  state.error = true;
}
function handleLoginSuccess(state, action) {
  // check if user is verified
  if (action.payload.user) {
    state.isLoggedIn = true;
  } else {
    state.isLoggedIn = false;
  }
  state.isLoading = false;
  state.error = false;
}

export const { updateOtpEmail } = slice.actions;

export default slice.reducer;
