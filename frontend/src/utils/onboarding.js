import { isApp } from "@/utils/platform";

// the app's web view has no passkeys, and a step that can only say so is one step too many
const isOfferedHere = (step) => !(isApp && step.id === "passkey");

export const pendingStepsOf = (onboarding) => onboarding?.steps.filter((step) => step.status === "none" && isOfferedHere(step)) ?? [];

export const isPaused = (onboarding) => Boolean(onboarding?.pausedUntil) && new Date(onboarding.pausedUntil) > new Date();

export const needsSetup = (onboarding) => isPaused(onboarding) || pendingStepsOf(onboarding).length > 0;
