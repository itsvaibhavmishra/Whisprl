import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import AuthHeader from "@/sections/auth/AuthHeader";
import AuthSocial from "@/sections/auth/AuthSocial";
import LoginForm from "@/sections/auth/LoginForm";
import { PATH_AUTH } from "@/routes/paths";

const Login = () => (
  <>
    <AuthHeader title="Log in to Whisprl">
      New here?{" "}
      <Link component={RouterLink} to={PATH_AUTH.general.register} underline="hover">
        Create an account
      </Link>
    </AuthHeader>
    <LoginForm />
    <AuthSocial />
  </>
);

export default Login;
