import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import AgreeToTerms from "@/sections/auth/AgreeToTerms";
import AuthHeader from "@/sections/auth/AuthHeader";
import ContinueWithGoogle from "@/sections/auth/ContinueWithGoogle";
import { PATH_AUTH } from "@/routes/paths";
import { isApp } from "@/utils/platform";

// Google both signs people in and makes their account, so there is one screen for both
const Login = () => (
  <>
    <AuthHeader title="Chat and play with your friends" hasLogo>
      Continue with Google to sign in, or to make your account.
    </AuthHeader>
    <ContinueWithGoogle />
    <AgreeToTerms sx={{ mt: 3 }} />
    {isApp && (
      <Link
        component={RouterLink}
        to={PATH_AUTH.general.review}
        variant="caption"
        color="text.disabled"
        underline="hover"
        sx={{ display: "block", mt: 6, textAlign: "center" }}
      >
        App review sign in
      </Link>
    )}
  </>
);

export default Login;
