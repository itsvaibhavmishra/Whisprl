import { App } from "@capacitor/app";

import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";
import { PLAY_APP_ID, askPlay, finishPlayUpdate, noticeFor, startPlayUpdate } from "@/utils/playUpdate";

const VERSIONS = { recommended: import.meta.env.REACT_APP_RECOMMENDED_VERSION_CODE, required: import.meta.env.REACT_APP_REQUIRED_VERSION_CODE };

const PLAY_REFUSED = { error: { message: "Google Play couldn't update Whisprl. Try again from the Play Store." } };

export const CheckForAppUpdate = createApiThunk(
  "appUpdate/check",
  async () => {
    const { id, build } = await App.getInfo();
    if (id !== PLAY_APP_ID) return { notice: null, status: null };
    const [{ data }, play] = await Promise.all([axios.get("/app/update-policy"), askPlay()]);
    return { notice: noticeFor({ build: Number(build), versions: VERSIONS, policy: data.policy, play }), status: play?.status ?? null };
  },
  { notifyErrors: false }
);

export const StartAppUpdate = createApiThunk("appUpdate/start", async (flow) => {
  try {
    return (await startPlayUpdate(flow)).isAccepted;
  } catch {
    throw PLAY_REFUSED;
  }
});

export const FinishAppUpdate = createApiThunk("appUpdate/finish", async () => {
  try {
    await finishPlayUpdate();
  } catch {
    throw PLAY_REFUSED;
  }
});
