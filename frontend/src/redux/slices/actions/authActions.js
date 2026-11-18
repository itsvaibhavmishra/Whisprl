import { createAsyncThunk } from "@reduxjs/toolkit";

import { createApiThunk, notifyResult } from "@/redux/slices/actions/apiThunk";
import { ForgetDeviceKeys } from "@/redux/slices/actions/encryptionActions";
import { DisconnectSocket } from "@/redux/slices/actions/socketActions";
import { clearChat } from "@/redux/slices/chatSlice";
import { logout, updateUser } from "@/redux/slices/userSlice";
import { releaseAllAttachments } from "@/utils/attachments";
import axios from "@/utils/axios";
import { createSessionKeys } from "@/utils/crypto/sessionKeys";
import { notify } from "@/utils/notify";
import { isApp } from "@/utils/platform";
import { stopPush } from "@/utils/push";
import { forgetChats } from "@/utils/savedChats";
import { deviceIdOrNone, forgetSession, startSession } from "@/utils/session";

// every way in sends the public half of a new key only this browser holds, which is what renews the session later
const logIn = async (path, body) => {
  const [{ privateKey, encodedPublicKey }, deviceId] = await Promise.all([createSessionKeys(), deviceIdOrNone()]);
  const { data } = await axios.post(path, { ...body, sessionKey: encodedPublicKey, deviceId });
  if (data.user) await startSession(data, privateKey);
  return data;
};

const signedIn = (dispatch, data) => {
  dispatch(updateUser(data.user));
  return { user: data.user };
};

export const GoogleLogin = createApiThunk("auth/google", async (code, { dispatch }) => {
  const data = await logIn("/auth/google", { code });
  notifyResult(data);
  return signedIn(dispatch, data);
});

export const ReviewerLogin = createApiThunk("auth/review", async (values, { dispatch }) => {
  const data = await logIn("/auth/login", values);
  notifyResult(data);
  return signedIn(dispatch, data);
});

export const EndSession = createAsyncThunk("auth/end-session", async ({ keepDeviceKeys = false, sessionId } = {}, { dispatch, getState }) => {
  const userId = getState().user.user._id;
  await forgetSession(userId, sessionId);
  // the phone gives up its push token here too, since a logout that never reached the server leaves the session sending to it
  if (isApp) stopPush().catch(() => {});
  dispatch(DisconnectSocket());
  releaseAllAttachments();
  if (!keepDeviceKeys) await dispatch(ForgetDeviceKeys(userId));
  await forgetChats(userId).catch(() => {});
  dispatch(clearChat());
  dispatch(logout());
});

// the socket closes first, so it does not try to reconnect to the session being ended
export const LogoutUser = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  dispatch(DisconnectSocket());
  const { data } = await axios.post("/auth/logout", null, { endsSession: true }).catch(() => ({ data: null }));
  await dispatch(EndSession());
  notify({ severity: "success", message: data?.message || "Logged out" });
});

// a free server sleeps when idle, so the auth pages wake it before anyone presses a button
export const StartServer = createApiThunk(
  "start/server",
  async () => {
    await axios.get("/start-server");
  },
  { notifyErrors: false }
);
