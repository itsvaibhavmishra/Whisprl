// setup holds only what Whisprl needs, and anything optional is offered later where it fits
export const pendingStepsOf = (onboarding) => onboarding?.steps.filter((step) => step.isRequired && step.status === "none") ?? [];

export const isOfferedStep = (onboarding, stepId) => onboarding?.steps.some((step) => step.id === stepId && step.status === "none") ?? false;

export const isPaused = (onboarding) => Boolean(onboarding?.pausedUntil) && new Date(onboarding.pausedUntil) > new Date();

export const needsSetup = (onboarding) => isPaused(onboarding) || pendingStepsOf(onboarding).length > 0;
