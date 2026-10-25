import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import LoadingScreen from "@/components/LoadingScreen";
import { DEFAULT_AUTH } from "@/config";
import { GetOnboarding } from "@/redux/slices/actions/onboardingActions";
import { isStaff } from "@/utils/roles";

// anyone else gets what an unknown address gives them, and the admin code is never downloaded for them
const StaffOnly = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const role = useSelector((state) => state.user.user.role);
  const [hasAsked, setHasAsked] = useState(false);

  // this device's role can be older than the server's, so a no is only taken after asking
  useEffect(() => {
    if (isLoggedIn) dispatch(GetOnboarding()).finally(() => setHasAsked(true));
  }, [dispatch, isLoggedIn]);

  if (!isLoggedIn) return <Navigate to={DEFAULT_AUTH} replace />;
  if (isStaff(role)) return <Outlet />;
  return hasAsked ? <Navigate to="/404" replace /> : <LoadingScreen />;
};

export default StaffOnly;
