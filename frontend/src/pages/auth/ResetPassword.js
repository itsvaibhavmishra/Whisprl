import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AuthHeader, { BackToLogin } from "@/sections/auth/AuthHeader";
import ResetPasswordForm from "@/sections/auth/ResetPasswordForm";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("code");
    if (!token) {
      navigate("/");
    }
  }, [location, navigate]);

  return (
    <>
      <AuthHeader title="Set a new password">
        Choose the password you will log in with from now on.
      </AuthHeader>
      <ResetPasswordForm />
      <BackToLogin />
    </>
  );
};

export default ResetPassword;
