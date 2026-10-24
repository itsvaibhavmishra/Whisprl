import { Box, ButtonBase, Stack, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { PlusIcon } from "@phosphor-icons/react";

import MascotHalo from "@/components/MascotHalo";

// the slot after the last game is an empty board, dotted like a game of Dots and Boxes not yet played
const RequestGameCard = ({ onClick }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  return (
    <ButtonBase
      onClick={onClick}
      aria-label="Request a game. Ask for one you know, or pitch your own"
      sx={{
        width: "100%",
        aspectRatio: { xs: "16 / 10", sm: "4 / 5" },
        display: "flex",
        flexDirection: { xs: "row", sm: "column" },
        alignItems: "center",
        justifyContent: "center",
        gap: { xs: 2, sm: 1.25 },
        px: { xs: 2.5, sm: 3 },
        borderRadius: 4,
        border: 2,
        borderStyle: "dashed",
        borderColor: (theme) => alpha(theme.palette.primary.glow, 0.4),
        bgcolor: (theme) => alpha(theme.palette.primary.glow, 0.04),
        backgroundImage: (theme) => `radial-gradient(${alpha(theme.palette.primary.glow, 0.28)} 1.5px, transparent 1.75px)`,
        backgroundSize: "20px 20px",
        backgroundPosition: "center",
        textAlign: { xs: "left", sm: "center" },
        transition: "border-color 160ms ease",
        "&:hover": { borderColor: "primary.glow" },
        "&:hover .request-pill": { bgcolor: "primary.glow", color: "background.default" },
        "&.Mui-focusVisible": { outline: 3, outlineColor: "primary.glow", outlineOffset: 2 },
      }}
    >
      <MascotHalo size={isPhone ? 88 : 112} />
      <Stack component="span" spacing={{ xs: 0.75, sm: 1.25 }} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
        <Typography component="span" sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Missing a game?
        </Typography>
        <Typography component="span" sx={{ maxWidth: 220, fontSize: 13.5, lineHeight: 1.4, color: "text.secondary" }}>
          Ask for one you love, or pitch one of your own.
        </Typography>
        <Stack
          aria-hidden
          className="request-pill"
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
            mt: { xs: 0.5, sm: 1 },
            px: 2,
            py: 0.8,
            borderRadius: 99,
            border: 1.5,
            borderColor: "primary.glow",
            color: "primary.glow",
            fontSize: 13,
            fontWeight: 800,
            transition: "background-color 160ms ease, color 160ms ease",
          }}
        >
          <PlusIcon size={15} weight="bold" />
          <Box component="span">Request a game</Box>
        </Stack>
      </Stack>
    </ButtonBase>
  );
};

export default RequestGameCard;
