import { Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import AuthHeader from "@/sections/auth/AuthHeader";
import AuthSocial from "@/sections/auth/AuthSocial";
import RegisterForm from "@/sections/auth/RegisterForm";
import { PATH_AUTH, PATH_DOCS } from "@/routes/paths";

const Register = () => (
  <>
    <AuthHeader title="Create your account">
      Already have one?{" "}
      <Link component={RouterLink} to={PATH_AUTH.general.login} underline="hover">
        Log in
      </Link>
    </AuthHeader>
    <RegisterForm />
    <Typography variant="body2" sx={{ mt: 2, color: "text.secondary", textAlign: "center", textWrap: "balance" }}>
      By creating an account, you agree to the{" "}
      <Link component={RouterLink} to={PATH_DOCS.general.tnc} underline="hover">
        terms and conditions
      </Link>
      .
    </Typography>
    <AuthSocial />
  </>
);

export default Register;
