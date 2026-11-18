import AgreeToTerms from "@/sections/auth/AgreeToTerms";
import AuthHeader from "@/sections/auth/AuthHeader";
import ContinueWithGoogle from "@/sections/auth/ContinueWithGoogle";

// Google both signs people in and makes their account, so there is one screen for both
const Login = () => (
  <>
    <AuthHeader title="Chat and play with your friends" hasLogo>
      Continue with Google to sign in, or to make your account.
    </AuthHeader>
    <ContinueWithGoogle />
    <AgreeToTerms sx={{ mt: 3 }} />
  </>
);

export default Login;
