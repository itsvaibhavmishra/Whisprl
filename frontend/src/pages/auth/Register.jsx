import { useState } from "react";
import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import AuthChoices from "@/sections/auth/AuthChoices";
import AuthHeader from "@/sections/auth/AuthHeader";
import AuthSocial from "@/sections/auth/AuthSocial";
import RegisterForm from "@/sections/auth/RegisterForm";
import SignUpPaused from "@/sections/auth/SignUpPaused";
import { PATH_AUTH } from "@/routes/paths";
import { isSignUpPaused, pauseSignUp } from "@/utils/signUpPause";
import { isApp } from "@/utils/platform";

const Register = () => {
  const [isPaused, setIsPaused] = useState(isSignUpPaused);

  const refuse = () => {
    pauseSignUp();
    setIsPaused(true);
  };

  if (isPaused) return <SignUpPaused />;

  return (
    <>
      <AuthHeader title="Create your account" hasLogo>
        Already have one?{" "}
        <Link component={RouterLink} to={PATH_AUTH.general.login} underline="hover">
          Log in
        </Link>
      </AuthHeader>
      <AuthChoices moreLabel={isApp ? "Sign up with email" : "More ways to sign up"}>
        <RegisterForm onTooYoung={refuse} />
        <AuthSocial />
      </AuthChoices>
    </>
  );
};

export default Register;
