import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import AuthChoices from "@/sections/auth/AuthChoices";
import AuthHeader from "@/sections/auth/AuthHeader";
import AuthSocial from "@/sections/auth/AuthSocial";
import LoginForm from "@/sections/auth/LoginForm";
import { PATH_AUTH } from "@/routes/paths";
import { isApp } from "@/utils/platform";

const Login = () => (
  <>
    <AuthHeader title="Log in to Whisprl" hasLogo>
      New here?{" "}
      <Link component={RouterLink} to={PATH_AUTH.general.register} underline="hover">
        Create an account
      </Link>
    </AuthHeader>
    <AuthChoices moreLabel={isApp ? "Log in with email" : "More ways to log in"}>
      <LoginForm />
      <AuthSocial />
    </AuthChoices>
  </>
);

export default Login;
