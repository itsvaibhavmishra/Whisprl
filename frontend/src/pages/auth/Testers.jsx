import { useEffect, useState } from "react";
import { Box, CircularProgress, Link, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { TESTERS_GROUP_URL } from "@/config";
import { LogoutUser } from "@/redux/slices/actions/authActions";
import { CountPromotionVisit, GetPromotion, JoinPromotion, MarkPromotionStep } from "@/redux/slices/actions/badgeActions";
import AuthHeader from "@/sections/auth/AuthHeader";
import { Claimed, GetApp, JoinGroup, OpenApp, SignIn } from "@/sections/testers/TesterStages";
import { openThenReturn } from "@/utils/openThenReturn";
import { isAndroidBrowser } from "@/utils/platform";
import { forgetTesterLink } from "@/utils/testerLink";

// the room of the tallest stage, which has a QR code off Android, so the badge stays put between steps
const TALLEST_STAGE = isAndroidBrowser ? 500 : 610;

const Testers = () => {
  const dispatch = useDispatch();
  const { code } = useParams();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const email = useSelector((state) => state.user.user.email);
  const promotion = useSelector((state) => state.badge.promotion);
  const [failure, setFailure] = useState(null);
  // steps taken on this visit, ahead of what the server last said
  const [reached, setReached] = useState(null);

  useEffect(() => {
    dispatch(CountPromotionVisit(code));
  }, [dispatch, code]);

  useEffect(() => {
    if (isLoggedIn) forgetTesterLink();
    const open = isLoggedIn ? JoinPromotion : GetPromotion;
    dispatch(open(code)).then((result) => setFailure(open.rejected.match(result) ? result.payload : null));
  }, [dispatch, code, isLoggedIn]);

  if (failure) return <AuthHeader title="Tester link unavailable">{failure}</AuthHeader>;

  const stage = isLoggedIn ? (reached ?? promotion?.stage) : "sign-in";
  if (!promotion || !stage) return <CircularProgress size={28} aria-label="Opening the link" sx={{ display: "block", mx: "auto" }} />;

  const { badge } = promotion;
  const markStep = (step) => dispatch(MarkPromotionStep({ code, step }));

  const openGroup = () => {
    markStep("group");
    openThenReturn(TESTERS_GROUP_URL, () => setReached("play"));
  };

  const openPlay = () => {
    markStep("play");
    setReached("app");
  };

  const switchAccount = () => {
    setReached(null);
    dispatch(LogoutUser());
  };

  return (
    <Box sx={{ minHeight: TALLEST_STAGE }}>
      {stage === "sign-in" && <SignIn badge={badge} code={code} />}
      {stage === "group" && <JoinGroup badge={badge} onOpenGroup={openGroup} />}
      {stage === "play" && <GetApp badge={badge} onOpenPlay={openPlay} onOpenGroup={openGroup} />}
      {stage === "app" && <OpenApp badge={badge} email={email} />}
      {stage === "claimed" && <Claimed badge={badge} />}
      {isLoggedIn && (
        <Typography variant="body2" sx={{ mt: 4, color: "text.secondary" }}>
          Signed in as {email}.{" "}
          <Link component="button" type="button" underline="hover" onClick={switchAccount} sx={{ verticalAlign: "baseline" }}>
            Use another account
          </Link>
        </Typography>
      )}
    </Box>
  );
};

export default Testers;
