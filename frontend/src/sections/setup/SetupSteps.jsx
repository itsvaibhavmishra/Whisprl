import { useState } from "react";
import { Typography } from "@mui/material";

import AuthHeader from "@/sections/auth/AuthHeader";
import BirthdayStep from "@/sections/setup/BirthdayStep";
import ProfileStep from "@/sections/setup/ProfileStep";
import ProtectMessagesStep from "@/sections/setup/ProtectMessagesStep";
import { pendingStepsOf } from "@/utils/onboarding";

const STEP_VIEWS = {
  birthday: { View: BirthdayStep, ask: "Enter your birthday" },
  profile: { View: ProfileStep, ask: "Set up your profile" },
  messages: { View: ProtectMessagesStep, ask: "Save your recovery key" },
};

const SetupSteps = ({ onboarding }) => {
  const pending = pendingStepsOf(onboarding);
  // counted from what was left on arrival, so someone missing one thing never reads "step 2 of 2"
  const [visit, setVisit] = useState(() => pending.map((step) => step.id));
  // the account kept on the phone can say everything is done until the server says otherwise, so the count waits for real steps
  if (!visit.length && pending.length) setVisit(pending.map((step) => step.id));
  const [current] = pending;
  const { View, ask } = STEP_VIEWS[current.id];
  const position = visit.indexOf(current.id) + 1;
  const isFirst = current.id === "birthday";

  return (
    <>
      {visit.length > 1 && position > 0 && (
        <Typography
          variant="body2"
          sx={{ mb: 1.5, textAlign: "center", color: "primary.main", fontWeight: 700 }}
        >{`Step ${position} of ${visit.length}`}</Typography>
      )}
      {isFirst ? (
        <AuthHeader title={onboarding.isNewAccount ? "Welcome to Whisprl" : "A few things to finish"} isCentred>
          {ask}
        </AuthHeader>
      ) : (
        <AuthHeader title={ask} isCentred />
      )}
      <View key={current.id} />
    </>
  );
};

export default SetupSteps;
