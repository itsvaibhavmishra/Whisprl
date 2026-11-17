import { Box, Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

import HeroConversation from "@/sections/welcome/HeroConversation";
import Wordmark from "@/components/Wordmark";
import { PATH_AUTH } from "@/routes/paths";

const Hero = () => (
  <Box
    component="section"
    aria-labelledby="welcome-title"
    sx={{
      display: "grid",
      gridTemplateColumns: { md: "7fr 5fr" },
      alignItems: "center",
      gap: { xs: 6, md: 4 },
      py: { xs: 4, md: 8 },
    }}
  >
    <Box>
      <Typography id="welcome-title" component="h1" sx={{ m: 0 }}>
        <Wordmark name="Whisprl" />
        <Box
          component="span"
          sx={{
            display: "block",
            mt: { xs: 2, md: 3 },
            fontSize: { xs: 24, md: 32 },
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            maxWidth: "23ch",
          }}
        >
          Chat and play games with your friends, right where you talk.
        </Box>
      </Typography>

      <Typography
        sx={{
          mt: 3,
          fontSize: { xs: 17, md: 19 },
          lineHeight: 1.6,
          color: "text.secondary",
          maxWidth: "50ch",
        }}
      >
        Start a game of Jackaroo, Chain Reaction, Dots and Boxes or Tic‑tac‑toe inside any chat, and keep talking while you play. Every message is end-to-end
        encrypted. Free, open source, on Android and in your browser.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
        <Button component={Link} to={PATH_AUTH.general.register} variant="contained" size="large">
          Create a free account
        </Button>
        <Button component={Link} to={PATH_AUTH.general.login} variant="outlined" color="inherit" size="large">
          Log in
        </Button>
      </Stack>
    </Box>

    <HeroConversation />
  </Box>
);

export default Hero;
