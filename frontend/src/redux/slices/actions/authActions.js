import { createAsyncThunk } from "@reduxjs/toolkit";

import { createApiThunk, notifyResult } from "@/redux/slices/actions/apiThunk";
import { ForgetDeviceKeys } from "@/redux/slices/actions/encryptionActions";
import { DisconnectSocket } from "@/redux/slices/actions/socketActions";
import { updateOtpEmail } from "@/redux/slices/authSlice";
import { clearChat } from "@/redux/slices/chatSlice";
import { logout, updateUser } from "@/redux/slices/userSlice";
import { releaseAllAttachments } from "@/utils/attachments";
import axios, { setAccessToken } from "@/utils/axios";
import { notify } from "@/utils/notify";

const withRecaptcha = async (recaptchaRef, values) => {
  recaptchaRef.current.reset();
  return { ...values, recaptchaToken: await recaptchaRef.current.executeAsync() };
};

const signedIn = (dispatch, data) => {
  setAccessToken(data.accessToken);
  dispatch(updateUser(data.user));
  return { user: data.user };
};

// ------------- Login Thunk -------------
export const LoginUser = createApiThunk("auth/login", async ({ recaptchaRef, ...values }, { dispatch }) => {
  const { data } = await axios.post("/auth/login", await withRecaptcha(recaptchaRef, values));
  notifyResult(data);

  if (data.user) return signedIn(dispatch, data);

  dispatch(updateOtpEmail({ otpEmail: values.email }));
  return { user: null };
});

// ------------- Social Login Thunks -------------
const socialLogin = (provider) =>
  createApiThunk(`auth/${provider}`, async (code, { dispatch }) => {
    const { data } = await axios.post(`/auth/${provider}`, { code });
    notifyResult(data);
    return signedIn(dispatch, data);
  });

export const GoogleLogin = socialLogin("google");
export const GithubLogin = socialLogin("github");
export const LinkedinLogin = socialLogin("linkedin");

// ------------- End Session Thunk -------------
export const EndSession = createAsyncThunk("auth/end-session", async (_, { dispatch, getState }) => {
  setAccessToken(null);
  dispatch(DisconnectSocket());
  releaseAllAttachments();
  await dispatch(ForgetDeviceKeys(getState().user.user._id));
  dispatch(clearChat());
  dispatch(logout());
});

// ------------- Logout Thunk -------------
export const LogoutUser = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  const { data } = await axios.post("/auth/logout").catch(() => ({ data: null }));
  await dispatch(EndSession());
  notify({ severity: "success", message: data?.message || "Logged out" });
});

// ------------- Register Thunk -------------
export const RegisterUser = createApiThunk("auth/register", async ({ recaptchaRef, ...values }, { dispatch }) => {
  const { data } = await axios.post("/auth/register", await withRecaptcha(recaptchaRef, values));
  dispatch(updateOtpEmail({ otpEmail: values.email }));
  notifyResult(data);
  return data;
});

// ------------- Verify OTP Thunk -------------
export const VerifyOTP = createApiThunk("auth/verify-otp", async ({ recaptchaRef, ...values }, { dispatch }) => {
  const { data } = await axios.post("/auth/verify-otp", await withRecaptcha(recaptchaRef, values));
  notifyResult(data);
  return signedIn(dispatch, data);
});

// ------------- Send OTP Thunk -------------
export const SendOTP = createApiThunk("auth/send-otp", async (values, { dispatch }) => {
  dispatch(updateOtpEmail({ otpEmail: values.email }));
  const { data } = await axios.post("/auth/send-otp", values);
  notifyResult(data);
  return data;
});

// ------------- Add Email -------------
export const AddOtpEmail = (values) => (dispatch) => {
  dispatch(updateOtpEmail({ otpEmail: values.email }));
  notify({ severity: "success", message: "Email Added Successfully" });
};

// ------------- Forgot Password Thunk -------------
export const ForgotPassword = createApiThunk("auth/forgot-password", async ({ recaptchaRef, ...values }) => {
  const { data } = await axios.post("/auth/forgot-password", await withRecaptcha(recaptchaRef, values));
  notifyResult(data);
  return data;
});

// ------------- Reset Password Thunk -------------
export const ResetPassword = createApiThunk("auth/reset-password", async (values) => {
  const { data } = await axios.post("/auth/reset-password", values);
  notifyResult(data);
  return data;
});

// ------------- Start Server Thunk -------------
// a free server sleeps when idle, so the auth pages wake it before anyone presses a button
export const StartServer = createApiThunk(
  "start/server",
  async () => {
    await axios.get("/start-server");
  },
  { notifyErrors: false }
);
