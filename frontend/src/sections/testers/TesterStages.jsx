import { Box, Button, Link, Stack, Typography } from "@mui/material";
import { GooglePlayLogoIcon } from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";

import { PLAY_STORE_URL } from "@/config";
import AgreeToTerms from "@/sections/auth/AgreeToTerms";
import AuthHeader from "@/sections/auth/AuthHeader";
import ContinueWithGoogle from "@/sections/auth/ContinueWithGoogle";
import { badgeArtAt } from "@/utils/badges";
import { isAndroidBrowser } from "@/utils/platform";

const ART = 112;
const NEW_TAB = { target: "_blank", rel: "noopener" };

// the badge leads every stage, so what the steps are for stays in view the whole way
const Stage = ({ badge, step, title, text, children }) => (
  <>
    <Box component="img" src={badgeArtAt(badge.art, ART)} alt="" sx={{ display: "block", width: ART, height: ART, mb: 2.5, objectFit: "contain" }} />
    {step && <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 700, color: "primary.main" }}>{`Step ${step} of 2`}</Typography>}
    <AuthHeader title={title}>{text}</AuthHeader>
    {children}
  </>
);

export const SignIn = ({ badge }) => (
  <Stage
    badge={badge}
    title="Become a Whisprl tester"
    text={`Help test the Android app before it reaches everyone. Testers get the ${badge.name} badge on their profile.`}
  >
    <ContinueWithGoogle />
    <AgreeToTerms sx={{ mt: 3 }} />
  </Stage>
);

export const JoinGroup = ({ badge, onOpenGroup }) => (
  <Stage
    badge={badge}
    step={1}
    title="Join the testers group"
    text="Google Play shows the test app only to members of this group. Join with the Google account your phone's Play Store uses, then close that window."
  >
    <Button size="large" variant="contained" fullWidth onClick={onOpenGroup}>
      Join the group
    </Button>
  </Stage>
);

const ScanWithPhone = () => (
  <Stack direction="row" spacing={2} sx={{ alignItems: "center", mt: 3 }}>
    <Box sx={{ flexShrink: 0, width: 104, height: 104, p: 1, borderRadius: 2, bgcolor: "#fff", border: 1, borderColor: "divider" }}>
      <QRCodeSVG value={PLAY_STORE_URL} title="QR code that opens Whisprl on Google Play" style={{ display: "block", width: "100%", height: "100%" }} />
    </Box>
    <Typography variant="body2" sx={{ color: "text.secondary", textWrap: "pretty" }}>
      Not on your Android phone? Scan this with it to open Google Play there.
    </Typography>
  </Stack>
);

export const GetApp = ({ badge, onOpenPlay, onOpenGroup }) => (
  <Stage
    badge={badge}
    step={2}
    title="Get Whisprl on Google Play"
    text="Install it on your Android phone with the same Google account. Play can take a few minutes to let a new tester in."
  >
    <Button size="large" variant="contained" fullWidth href={PLAY_STORE_URL} {...NEW_TAB} onClick={onOpenPlay} startIcon={<GooglePlayLogoIcon weight="fill" />}>
      Get it on Google Play
    </Button>
    <Button size="large" color="inherit" fullWidth onClick={onOpenGroup} sx={{ mt: 1.5 }}>
      Not joined the group yet?
    </Button>
    {!isAndroidBrowser && <ScanWithPhone />}
  </Stage>
);

export const OpenApp = ({ badge, email }) => (
  <Stage badge={badge} title="Open Whisprl and claim your badge" text={`Log in to the app as ${email}. Your ${badge.name} badge is waiting there.`}>
    <Link href={PLAY_STORE_URL} {...NEW_TAB} underline="hover">
      Open Google Play again
    </Link>
  </Stage>
);

export const Claimed = ({ badge }) => (
  <Stage badge={badge} title="You're a Whisprl tester" text={`The ${badge.name} badge is on your profile. Thanks for helping test Whisprl.`} />
);
