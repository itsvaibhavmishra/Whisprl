export const pendingStepsOf = (onboarding) => onboarding?.steps.filter((step) => step.status === "none") ?? [];

export const isPaused = (onboarding) => Boolean(onboarding?.pausedUntil) && new Date(onboarding.pausedUntil) > new Date();

export const needsSetup = (onboarding) => isPaused(onboarding) || pendingStepsOf(onboarding).length > 0;
