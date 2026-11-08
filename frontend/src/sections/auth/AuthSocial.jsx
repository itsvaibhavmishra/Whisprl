import { Box, Button, Divider } from "@mui/material";
import { GithubLogoIcon, LinkedinLogoIcon } from "@phosphor-icons/react";

import { useDispatch } from "react-redux";
import { GithubLogin, LinkedinLogin } from "@/redux/slices/actions/authActions";

import { getOAuthCode } from "@/utils/socialLoginHelpers";
import { notify } from "@/utils/notify";
import { isApp } from "@/utils/platform";

// GitHub and LinkedIn sign in through a website popup, so the app leaves them out
const AuthSocial = () => {
  const dispatch = useDispatch();

  if (isApp) return null;

  const signInWith = (name, url, Login) => async () => {
    try {
      dispatch(Login(await getOAuthCode(url)));
    } catch {
      notify({ severity: "error", message: `Couldn't continue with ${name}. Try again.` });
    }
  };

  const providers = [
    {
      name: "GitHub",
      icon: <GithubLogoIcon weight="fill" />,
      onClick: signInWith(
        "GitHub",
        `https://github.com/login/oauth/authorize?client_id=${import.meta.env.REACT_APP_GITHUB_AUTH_CLIENT_ID}&scope=user`,
        GithubLogin
      ),
    },
    {
      name: "LinkedIn",
      icon: <LinkedinLogoIcon weight="fill" color="#0A66C2" />,
      onClick: signInWith(
        "LinkedIn",
        `https://linkedin.com/oauth/v2/authorization?client_id=${import.meta.env.REACT_APP_LINKEDIN_AUTH_CLIENT_ID}&response_type=code&scope=email profile openid&redirect_uri=${window.location.origin}/auth/login`,
        LinkedinLogin
      ),
    },
  ];

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
