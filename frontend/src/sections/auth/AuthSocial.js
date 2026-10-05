import { Box, Button, Divider } from "@mui/material";
import { GithubLogo, GoogleLogo, LinkedinLogo } from "phosphor-react";
import { useGoogleLogin } from "@react-oauth/google";

import { useDispatch } from "react-redux";
import {
  GithubLogin,
  GoogleLogin,
  LinkedinLogin,
} from "@/redux/slices/actions/authActions";

import { getOAuthCode } from "@/utils/socialLoginHelpers";
import { notify } from "@/utils/notify";

const AuthSocial = () => {
  const dispatch = useDispatch();

  const baseURL = window.location.origin;

  const showSnackbar = (socialType) => notify({ severity: "error", message: `Unable to login using ${socialType}` });

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      dispatch(GoogleLogin(tokenResponse));
    },
    onError: (error) => {
      showSnackbar("google");
      console.log(error);
    },
  });

  const githubLogin = async () => {
    try {
      const code = await getOAuthCode(
        `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_GITHUB_AUTH_CLIENT_ID}&scope=user`
      );

      dispatch(GithubLogin(code));
    } catch (error) {
      showSnackbar("github");
      console.log("Github Error:", error.message);
    }
  };

  const linkedinLogin = async () => {
    try {
      const code = await getOAuthCode(
        `https://linkedin.com/oauth/v2/authorization?client_id=${process.env.REACT_APP_LINKEDIN_AUTH_CLIENT_ID}&response_type=code&scope=email profile openid&redirect_uri=${baseURL}/auth/login`
      );

      dispatch(LinkedinLogin(code));
    } catch (error) {
      showSnackbar("linkedin");
      console.log("Linkedin Error:", error.message);
    }
  };

  const providers = [
    { name: "Google", icon: <GoogleLogo weight="bold" color="#DF3E30" />, onClick: () => googleLogin() },
    { name: "GitHub", icon: <GithubLogo weight="fill" />, onClick: githubLogin },
    { name: "LinkedIn", icon: <LinkedinLogo weight="fill" color="#0A66C2" />, onClick: linkedinLogin },
  ];

  return (
    <>
      <Divider sx={{ my: 3, typography: "body2", color: "text.secondary" }}>
        or continue with
      </Divider>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
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
