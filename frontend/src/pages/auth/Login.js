import { Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import LoginForm from "../../sections/auth/LoginForm";
import AuthSocial from "../../sections/auth/AuthSocial";

const Login = () => {
  return (
    <Stack spacing={2} sx={{ my: 5, position: "realative" }}>
      {/* Head section */}
      <Stack justifyContent={"center"} alignItems={"center"} spacing={1}>
        <Typography component={"h1"} variant="h4">
          Login to Whisprl
        </Typography>
        <Stack direction={"row"} spacing={0.5}>
          <Typography variant="body2">New User?</Typography>
          <Link to="/auth/register" component={RouterLink} variant="subtitle2">
            Create an account
          </Link>
        </Stack>
      </Stack>

      {/* Form section */}
      <LoginForm />

      {/* Auth Social login */}
      <AuthSocial />
    </Stack>
  );
};

export default Login;
