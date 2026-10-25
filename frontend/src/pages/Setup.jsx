import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

import { DEFAULT_PATH } from "@/config";
import { GetOnboarding } from "@/redux/slices/actions/onboardingActions";
import { PATH_AUTH } from "@/routes/paths";
import SetupFrame from "@/sections/setup/SetupFrame";
import SetupPaused from "@/sections/setup/SetupPaused";
import SetupSteps from "@/sections/setup/SetupSteps";
import { isPaused, needsSetup } from "@/utils/onboarding";

const Setup = () => {
  const dispatch = useDispatch();
  const from = useLocation().state?.from;
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const onboarding = useSelector((state) => state.user.user.onboarding);

  // the account kept in this browser can be out of date, and nothing else here asks the server
  useEffect(() => {
    if (isLoggedIn) dispatch(GetOnboarding());
  }, [dispatch, isLoggedIn]);

  if (!isLoggedIn) return <Navigate to={PATH_AUTH.general.login} replace />;
  if (!needsSetup(onboarding)) return <Navigate to={from ?? DEFAULT_PATH} replace />;

  return <SetupFrame>{isPaused(onboarding) ? <SetupPaused /> : <SetupSteps onboarding={onboarding} />}</SetupFrame>;
};

export default Setup;
