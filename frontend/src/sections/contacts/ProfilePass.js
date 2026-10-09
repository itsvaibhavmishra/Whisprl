import { Box, Button, Stack, Typography } from "@mui/material";
import { CopySimple, ShareNetwork } from "phosphor-react";
import { QRCodeSVG } from "qrcode.react";

import WhisprlMark from "@/assets/icons/logo/WhisprlMark.webp";
import ProfileCover from "@/components/ProfileCover";
import { SOFT } from "@/components/profile/RelationshipActions";
import Wordmark from "@/components/Wordmark";
import { canShareNatively, copyProfileLink, profileLinkOf, shareProfile } from "@/sections/contacts/contactsRoute";

const CARD = "chat.list";
const BAND = { xs: 64, md: 84 };
const TILE = { xs: 112, md: 136 };
const RING = 4;
// a camera reads dark on light whatever the theme, so the code keeps its own ink and paper
const INK = "#0F1A2B";
const PAPER = "#FFFFFF";
const MARK = { src: WhisprlMark, width: 26, height: 26, excavate: true };

const halfOf = (sizes) => Object.fromEntries(Object.entries(sizes).map(([breakpoint, size]) => [breakpoint, `-${size / 2}px`]));

const ProfilePass = ({ person }) => {
  const fullName = `${person.firstName} ${person.lastName}`;
  const canShare = canShareNatively();

  return (
    <Box component="section" aria-label="Your profile link" sx={{ overflow: "hidden", borderRadius: { xs: "20px", md: "24px" }, border: 1, borderColor: "chat.edge", bgcolor: CARD }}>
      <ProfileCover profile={person} sx={{ height: BAND }} />
      <Box sx={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", columnGap: { xs: 2, md: 3 }, px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            width: TILE,
            height: TILE,
            mt: halfOf(TILE),
            // the ring is cut from the cover, so the white edge, not the ring, lines up with the text below
            ml: `-${RING}px`,
            p: 0.75,
            borderRadius: "18px",
            border: RING,
            borderColor: CARD,
            bgcolor: PAPER,
            position: "relative",
            zIndex: 1,
          }}
        >
          <QRCodeSVG
            value={profileLinkOf(person)}
            level="Q"
            marginSize={2}
            fgColor={INK}
            bgColor={PAPER}
            imageSettings={MARK}
            title={`QR code that opens ${fullName}'s profile`}
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </Box>
        <Box sx={{ minWidth: 0, pt: { xs: 1.5, md: 2 } }}>
          <Typography component="h3" sx={{ m: 0, overflowWrap: "anywhere" }}>
            <Wordmark name={fullName} fontSize={{ xs: "1.5rem", md: "1.75rem" }} />
          </Typography>
          {person.username && <Typography sx={{ mt: 0.75, fontSize: 14, fontWeight: 600, color: "text.secondary" }}>@{person.username}</Typography>}
        </Box>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ md: "center" }}
          justifyContent="space-between"
          spacing={{ xs: 1.5, md: 3 }}
          sx={{ gridColumn: "1 / -1", mt: 2 }}
        >
          <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "text.secondary" }}>
            Anyone with this code or link can see your profile and send you a request.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            {canShare && (
              <Button variant="contained" startIcon={<ShareNetwork weight="bold" />} onClick={() => shareProfile(person)}>
                Share
              </Button>
            )}
            <Button
              variant={canShare ? "text" : "contained"}
              startIcon={<CopySimple weight="bold" />}
              onClick={() => copyProfileLink(person)}
              sx={canShare ? SOFT : undefined}
            >
              Copy link
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default ProfilePass;
