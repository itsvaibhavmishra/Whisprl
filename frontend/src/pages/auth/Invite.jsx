import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Link } from "@mui/material";
import { GooglePlayLogoIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, useParams } from "react-router-dom";

import { PLAY_STORE_URL } from "@/config";
import useIsLoading from "@/hooks/useIsLoading";
import { GetInviter } from "@/redux/slices/actions/contactActions";
import { PATH_AUTH } from "@/routes/paths";
import AgreeToTerms from "@/sections/auth/AgreeToTerms";
import AuthHeader from "@/sections/auth/AuthHeader";
import ContinueWithGoogle from "@/sections/auth/ContinueWithGoogle";
import getAvatar from "@/utils/avatars";
import { isApp } from "@/utils/platform";

// the website can only tell an Android phone by its browser, and there the app is offered first
const isAndroidBrowser = !isApp && /android/i.test(navigator.userAgent);

const playLinkOf = (code) => `${PLAY_STORE_URL}&referrer=${encodeURIComponent(`invite=${code}`)}`;

const outcomeOf = (result) => {
  if (GetInviter.rejected.match(result)) return "failed";
  return result.payload ? "found" : "unknown";
};

const LogInInstead = () => (
  <>
    Already on Whisprl?{" "}
    <Link component={RouterLink} to={PATH_AUTH.general.login} underline="hover">
      Log in
    </Link>
  </>
);

const JoinChoices = ({ code }) => {
  const [isWebChosen, setIsWebChosen] = useState(!isAndroidBrowser);

  if (!isWebChosen) {
    return (
      <>
        <Button size="large" variant="contained" fullWidth href={playLinkOf(code)} startIcon={<GooglePlayLogoIcon weight="fill" />}>
          Get it on Google Play
        </Button>
        <Button size="large" color="inherit" fullWidth onClick={() => setIsWebChosen(true)} sx={{ mt: 1.5 }}>
          Continue on the web
        </Button>
      </>
    );
  }

  return (
    <>
      <ContinueWithGoogle />
      <Button size="large" color="inherit" fullWidth component={RouterLink} to={PATH_AUTH.general.register} state={{ withEmail: true }} sx={{ mt: 1.5 }}>
        Sign up with email
      </Button>
      <AgreeToTerms sx={{ mt: 3 }} />
    </>
  );
};

const Invite = () => {
  const dispatch = useDispatch();
  const { code } = useParams();
  const inviter = useSelector((state) => state.contact.inviter);
  const isLoading = useIsLoading(GetInviter);
  const [outcome, setOutcome] = useState("looking");

  const look = useCallback(() => dispatch(GetInviter(code)).then((result) => setOutcome(outcomeOf(result))), [dispatch, code]);

  useEffect(() => {
    look();
  }, [look]);

  if (outcome === "looking") return <CircularProgress size={28} aria-label="Opening the invite" sx={{ display: "block", mx: "auto" }} />;

  if (outcome === "failed") {
    return (
      <>
        <AuthHeader title="This invite didn't open">Check your connection and try again.</AuthHeader>
        <Button size="large" variant="contained" fullWidth loading={isLoading} onClick={look}>
          Try again
        </Button>
      </>
    );
  }

  if (outcome === "unknown") {
    return (
      <>
        <AuthHeader title="This invite link doesn't work">Ask your friend for a new one, or join Whisprl on your own.</AuthHeader>
        <Button size="large" variant="contained" fullWidth component={RouterLink} to={PATH_AUTH.general.register}>
          Sign up
        </Button>
      </>
    );
  }

  const name = `${inviter.firstName} ${inviter.lastName}`;
  return (
    <>
      <Box sx={{ mb: 2.5 }}>{getAvatar(inviter.avatar, name, 72)}</Box>
      <AuthHeader title={`${inviter.firstName} invited you to play on Whisprl`}>
        Jackaroo, Chain Reaction, Dots and Boxes and more, with private chats only the two of you can read. Once you join, you can send {inviter.firstName} a
        friend request in one tap. <LogInInstead />
      </AuthHeader>
      <JoinChoices code={code} />
    </>
  );
};

export default Invite;
