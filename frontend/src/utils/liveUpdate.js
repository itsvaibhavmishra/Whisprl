import { App } from "@capacitor/app";
import { CapacitorHttp } from "@capacitor/core";
import { LiveUpdate } from "@capawesome/capacitor-live-update";

import { isApp } from "@/utils/platform";

// set only in builds people install, so a development build never swaps itself for production code
const MANIFEST_URL = process.env.REACT_APP_UPDATE_URL;
const RUNNING_VERSION = process.env.REACT_APP_VERSION;

let checking = null;

const isNewer = (candidate, current) => {
  const [next, now] = [candidate, current].map((version) => version.split(".").map(Number));
  const differing = next.findIndex((part, position) => part !== now[position]);
  return differing !== -1 && next[differing] > now[differing];
};

// a native request follows GitHub's redirect to its file storage, which the web view's cross-origin rules could refuse
const latestUpdate = async () => {
  const { status, data } = await CapacitorHttp.get({ url: MANIFEST_URL, responseType: "json" });
  if (status !== 200) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
};

const stageUpdate = async () => {
  const update = await latestUpdate();
  // only newer, so a stale or replayed file can never take an app back to an older version
  if (!update || !isNewer(update.version, RUNNING_VERSION)) return;

  const [{ build }, { bundleIds: blocked }, { bundleIds: downloaded }] = await Promise.all([
    App.getInfo(),
    LiveUpdate.getBlockedBundles(),
    LiveUpdate.getBundles(),
  ]);
  // an update built against newer native code waits for the APK that has it, and one that already failed to start is never retried
  if (Number(build) < update.minNativeVersion || blocked.includes(update.version)) return;

  if (!downloaded.includes(update.version)) {
    await LiveUpdate.downloadBundle({ bundleId: update.version, url: update.url, signature: update.signature });
  }
  await LiveUpdate.setNextBundle({ bundleId: update.version });
};

const checkForUpdate = () => {
  checking ??= stageUpdate()
    .catch(() => {})
    .finally(() => {
      checking = null;
    });
  return checking;
};

// telling the plugin this version started is what stops it rolling back, so it comes first and runs in every app build
export const startLiveUpdates = async () => {
  if (!isApp) return;
  await LiveUpdate.ready();
  if (!MANIFEST_URL) return;

  checkForUpdate();
  App.addListener("resume", checkForUpdate);
};
