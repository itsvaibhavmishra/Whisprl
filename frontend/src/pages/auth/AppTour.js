import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import Wordmark from "@/components/Wordmark";
import { PATH_AUTH } from "@/routes/paths";
import { TOUR } from "@/sections/tour/content";

const TourDots = ({ shown }) => (
  <Stack direction="row" spacing={1} justifyContent="center" aria-hidden sx={{ py: 2.5 }}>
    {TOUR.map(({ title }, stop) => (
      <Box
        key={title}
        sx={{
          width: stop === shown ? 22 : 8,
          height: 8,
          borderRadius: 99,
          bgcolor: stop === shown ? "primary.main" : "text.disabled",
          transition: "width 240ms ease, background-color 240ms ease",
        }}
      />
    ))}
  </Stack>
);

// both ways in stay below every slide, so someone signing back in never has to swipe through the tour
const AppTour = () => {
  const [shown, setShown] = useState(0);

  // the scroll offset is negative right to left, so its size is what counts
  const followSwipe = ({ currentTarget }) => setShown(Math.round(Math.abs(currentTarget.scrollLeft) / currentTarget.clientWidth));

  return (
    <Stack
      sx={{
        height: "100dvh",
        pt: "calc(20px + env(safe-area-inset-top))",
        pb: "calc(16px + env(safe-area-inset-bottom))",
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Wordmark name="Whisprl" fontSize="2.25rem" />
      </Box>

      <Box
        component="ol"
        aria-label="What you can do on Whisprl"
        onScroll={followSwipe}
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          m: 0,
          p: 0,
          listStyle: "none",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {TOUR.map(({ title, body, Art }) => (
          <Stack component="li" key={title} sx={{ flex: "0 0 100%", scrollSnapAlign: "center", px: 3, textAlign: "center" }}>
            {/* art taller than a short phone starts at the top and fades out, rather than being cut through */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                mb: 2,
                display: "grid",
                placeItems: "safe center",
                overflow: "hidden",
                maskImage: "linear-gradient(to bottom, #000 82%, transparent)",
              }}
            >
              <Art />
            </Box>
            <Typography component="h2" sx={{ m: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography sx={{ mt: 1.25, mx: "auto", maxWidth: "34ch", fontSize: 16, lineHeight: 1.55, color: "text.secondary" }}>{body}</Typography>
          </Stack>
        ))}
      </Box>

      <TourDots shown={shown} />

      <Stack spacing={1} sx={{ px: 3 }}>
        <Button component={RouterLink} to={PATH_AUTH.general.register} variant="contained" size="large" fullWidth>
          Create account
        </Button>
        <Button component={RouterLink} to={PATH_AUTH.general.login} size="large" color="inherit" fullWidth>
          Log in
        </Button>
      </Stack>
    </Stack>
  );
};

export default AppTour;
