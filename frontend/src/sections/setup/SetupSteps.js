import { useState } from "react";
import { Typography } from "@mui/material";

import AuthHeader from "@/sections/auth/AuthHeader";
import BirthdayStep from "@/sections/setup/BirthdayStep";
import PasskeyStep from "@/sections/setup/PasskeyStep";
import ProfileStep from "@/sections/setup/ProfileStep";
import ProtectMessagesStep from "@/sections/setup/ProtectMessagesStep";
import UsernameStep from "@/sections/setup/UsernameStep";
import { pendingStepsOf } from "@/utils/onboarding";

const STEP_VIEWS = { birthday: BirthdayStep, username: UsernameStep, messages: ProtectMessagesStep, passkey: PasskeyStep, profile: ProfileStep };

const SetupSteps = ({ onboarding }) => {
  // counted from what was left on arrival, so someone missing one thing never reads "step 2 of 2"
  const [visit] = useState(() => pendingStepsOf(onboarding).map((step) => step.id));
  const [current] = pendingStepsOf(onboarding);
  const StepView = STEP_VIEWS[current.id];
  const position = visit.indexOf(current.id) + 1;

  return (
    <>
      {onboarding.isNewAccount ? (
        <AuthHeader title="Welcome to Whisprl">A few things to set up, and you&apos;re in.</AuthHeader>
      ) : (
        <AuthHeader title="A few things to finish">Whisprl needs these before you carry on.</AuthHeader>
      )}
      {visit.length > 1 && position > 0 && (
        <Typography variant="body2" sx={{ mb: 1.5, color: "primary.main", fontWeight: 700 }}>{`Step ${position} of ${visit.length}`}</Typography>
      )}
      <StepView key={current.id} />
    </>
  );
};

export default SetupSteps;
