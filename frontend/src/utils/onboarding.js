import { isApp } from "@/utils/platform";

// the app's web view has no passkeys, and the app asks about notifications once per phone instead
const NOT_IN_APP = ["passkey", "notifications"];

const isOfferedHere = (step) => !(isApp && NOT_IN_APP.includes(step.id));

export const pendingStepsOf = (onboarding) => onboarding?.steps.filter((step) => step.status === "none" && isOfferedHere(step)) ?? [];

export const isPaused = (onboarding) => Boolean(onboarding?.pausedUntil) && new Date(onboarding.pausedUntil) > new Date();

export const needsSetup = (onboarding) => isPaused(onboarding) || pendingStepsOf(onboarding).length > 0;
