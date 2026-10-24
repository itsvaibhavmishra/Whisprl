import { Box, Button, Divider } from "@mui/material";
import { GithubLogoIcon, GoogleLogoIcon, LinkedinLogoIcon } from "@phosphor-icons/react";
import { useGoogleLogin } from "@react-oauth/google";

import { useDispatch } from "react-redux";
import { GithubLogin, GoogleLogin, LinkedinLogin } from "@/redux/slices/actions/authActions";

import { getOAuthCode } from "@/utils/socialLoginHelpers";
import { signInWithGoogle } from "@/utils/googleSignIn";
import { notify } from "@/utils/notify";
import { isApp } from "@/utils/platform";

const AuthSocial = () => {
  const dispatch = useDispatch();

  const baseURL = window.location.origin;

  const showSnackbar = (socialType) => notify({ severity: "error", message: `Unable to login using ${socialType}` });

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      dispatch(GoogleLogin(tokenResponse.access_token));
    },
    onError: (error) => {
      showSnackbar("google");
      console.log(error);
    },
  });

  const continueWithGoogle = async () => {
    if (!isApp) return googleLogin();

    const { outcome, idToken } = await signInWithGoogle();
    if (outcome === "signed-in") dispatch(GoogleLogin(idToken));
    else if (outcome === "failed") showSnackbar("google");
  };

  const githubLogin = async () => {
    try {
      const code = await getOAuthCode(`https://github.com/login/oauth/authorize?client_id=${import.meta.env.REACT_APP_GITHUB_AUTH_CLIENT_ID}&scope=user`);

      dispatch(GithubLogin(code));
    } catch (error) {
      showSnackbar("github");
      console.log("Github Error:", error.message);
    }
  };

  const linkedinLogin = async () => {
    try {
      const code = await getOAuthCode(
        `https://linkedin.com/oauth/v2/authorization?client_id=${import.meta.env.REACT_APP_LINKEDIN_AUTH_CLIENT_ID}&response_type=code&scope=email profile openid&redirect_uri=${baseURL}/auth/login`
      );

      dispatch(LinkedinLogin(code));
    } catch (error) {
      showSnackbar("linkedin");
      console.log("Linkedin Error:", error.message);
    }
  };

  // the app signs in with Google through Android itself, and GitHub and LinkedIn are for the website
  const providers = [
    { name: "Google", icon: <GoogleLogoIcon weight="bold" color="#DF3E30" />, onClick: continueWithGoogle, isInApp: true },
    { name: "GitHub", icon: <GithubLogoIcon weight="fill" />, onClick: githubLogin },
    { name: "LinkedIn", icon: <LinkedinLogoIcon weight="fill" color="#0A66C2" />, onClick: linkedinLogin },
  ].filter((provider) => provider.isInApp || !isApp);

  return (
    <>
      <Divider sx={{ my: 3, typography: "body2", color: "text.secondary" }}>or continue with</Divider>
      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${providers.length}, 1fr)`, gap: 1.5 }}>
        {providers.map(({ name, icon, onClick }) => (
          <Button
            key={name}
            variant="outlined"
            color="inherit"
            startIcon={icon}
            onClick={onClick}
            aria-label={`Continue with ${name}`}
            sx={{ borderColor: "divider" }}
          >
            {name}
          </Button>
        ))}
      </Box>
    </>
  );
};

export default AuthSocial;
