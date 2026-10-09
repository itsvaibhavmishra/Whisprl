import { createAsyncThunk } from "@reduxjs/toolkit";

import { createApiThunk, notifyResult } from "@/redux/slices/actions/apiThunk";
import { ForgetDeviceKeys, keepKeyFromPasskey } from "@/redux/slices/actions/encryptionActions";
import { DisconnectSocket } from "@/redux/slices/actions/socketActions";
import { updateOtpEmail } from "@/redux/slices/authSlice";
import { clearChat } from "@/redux/slices/chatSlice";
import { logout, updateUser } from "@/redux/slices/userSlice";
import { releaseAllAttachments } from "@/utils/attachments";
import axios from "@/utils/axios";
import { createSessionKeys } from "@/utils/crypto/sessionKeys";
import { notify } from "@/utils/notify";
import { authenticateWithPasskey } from "@/utils/passkeys";
import { forgetSession, startSession } from "@/utils/session";

const withRecaptcha = async (recaptchaRef, values) => {
  recaptchaRef.current.reset();
  return { ...values, recaptchaToken: await recaptchaRef.current.executeAsync() };
};

// every way in sends the public half of a new key only this browser holds, which is what renews the session later
const logIn = async (path, body) => {
  const { privateKey, encodedPublicKey } = await createSessionKeys();
  const { data } = await axios.post(path, { ...body, sessionKey: encodedPublicKey });
  if (data.user) await startSession(data, privateKey);
  return data;
};

const signedIn = (dispatch, data) => {
  dispatch(updateUser(data.user));
  return { user: data.user };
};

// ------------- Login Thunk -------------
export const LoginUser = createApiThunk("auth/login", async ({ recaptchaRef, ...values }, { dispatch }) => {
  const data = await logIn("/auth/login", await withRecaptcha(recaptchaRef, values));
  notifyResult(data);

  if (data.user) return signedIn(dispatch, data);

  dispatch(updateOtpEmail({ otpEmail: values.identifier }));
  return { user: null };
});

// ------------- Passkey Login Thunk -------------
// a passkey that can unlock messages does it here, before the chats load, so this browser never asks for the recovery key
export const PasskeyLogin = createApiThunk("auth/passkey", async (_, { dispatch }) => {
  const { data: challenge } = await axios.post("/auth/passkeys/options");
  const { response, prfSecret } = await authenticateWithPasskey(challenge.options);
  const data = await logIn("/auth/passkeys/login", { response });

  if (prfSecret && data.keyBackup) await keepKeyFromPasskey(data.user._id, data.keyBackup, prfSecret).catch(() => {});
  notifyResult(data);
  return signedIn(dispatch, data);
});

// ------------- Social Login Thunks -------------
const socialLogin = (provider) =>
  createApiThunk(`auth/${provider}`, async (code, { dispatch }) => {
    const data = await logIn(`/auth/${provider}`, { code });
    notifyResult(data);
    return signedIn(dispatch, data);
  });

export const GoogleLogin = socialLogin("google");
export const GithubLogin = socialLogin("github");
export const LinkedinLogin = socialLogin("linkedin");

// ------------- End Session Thunk -------------
export const EndSession = createAsyncThunk("auth/end-session", async ({ keepDeviceKeys = false, sessionId } = {}, { dispatch, getState }) => {
  const userId = getState().user.user._id;
  await forgetSession(userId, sessionId);
  dispatch(DisconnectSocket());
  releaseAllAttachments();
  if (!keepDeviceKeys) await dispatch(ForgetDeviceKeys(userId));
  dispatch(clearChat());
  dispatch(logout());
});

// ------------- Logout Thunk -------------
// the socket closes first, so it does not try to reconnect to the session being ended
export const LogoutUser = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  dispatch(DisconnectSocket());
  const { data } = await axios.post("/auth/logout", null, { endsSession: true }).catch(() => ({ data: null }));
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
  const data = await logIn("/auth/verify-otp", await withRecaptcha(recaptchaRef, values));
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
