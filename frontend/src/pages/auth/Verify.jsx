import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import AuthHeader from "@/sections/auth/AuthHeader";
import VerifyForm, { EmailForm } from "@/sections/auth/VerifyForm";
import { PATH_AUTH } from "@/routes/paths";

const Verify = () => (
  <>
    <AuthHeader title="Verify your email">
      We send a 6-digit code to your inbox. Already verified?{" "}
      <Link component={RouterLink} to={PATH_AUTH.general.login} underline="hover">
        Log in
      </Link>
    </AuthHeader>
    <EmailForm />
    <VerifyForm />
  </>
);

export default Verify;
