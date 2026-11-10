import { registerPlugin } from "@capacitor/core";

import { hasNative } from "@/utils/nativeFeatures";

const PlayUpdate = registerPlugin("PlayUpdate");

// only the app Play distributes is offered updates, never the side-by-side test build
export const PLAY_APP_ID = "com.vaibhaw.whisprl";
export const PLAY_LISTING = `https://play.google.com/store/apps/details?id=${PLAY_APP_ID}`;

// null when Play did not install this app, or the app is older than the plugin, so only the listing can help
export const askPlay = async () => {
  if (!hasNative("PlayUpdate")) return null;
  try {
    return await PlayUpdate.check();
  } catch {
    return null;
  }
};

export const startPlayUpdate = (flow) => PlayUpdate.start({ immediate: flow === "immediate" });

export const finishPlayUpdate = () => PlayUpdate.finish();

export const onPlayProgress = (listener) => PlayUpdate.addListener("progress", listener);

const levelFor = (build, { recommended, required }) => {
  if (required && build < required) return "required";
  return recommended && build < recommended ? "recommended" : null;
};

// Play's full-screen update for one that has to happen, its background download for one that can wait
const flowFor = (level, play) => {
  if (play.canImmediate && (level === "required" || !play.canFlexible)) return "immediate";
  return play.canFlexible ? "flexible" : null;
};

// what to offer this app, if anything: the versions come with the code, and staff decide when people start hearing about them
export const noticeFor = ({ build, versions, policy, play }) => {
  const level = policy.isShown ? levelFor(build, versions) : null;
  if (!level) return null;
  if (!play) return policy.isListed ? { level, via: "listing" } : null;
  // Play installed this app and has nothing newer for it yet, as during a staged rollout
  if (!play.isOffered) return null;
  const flow = flowFor(level, play);
  return flow ? { level, via: "play", flow } : { level, via: "listing" };
};
