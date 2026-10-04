import { Box, Button, Typography } from "@mui/material";
import { GithubLogo } from "phosphor-react";

import { STACK } from "@/components/PageComponents/WelcomePage/content";
import { SOURCE_URL } from "@/config";
import {
  sectionHeading,
  sectionIntro,
  sectionSpacing,
} from "@/components/PageComponents/WelcomePage/styles";

const MernStack = () => (
  <Box component="section" aria-labelledby="stack-title" sx={sectionSpacing}>
    <Typography id="stack-title" component="h2" sx={sectionHeading}>
      A MERN chat app, end to end
    </Typography>
    <Typography sx={sectionIntro}>
      Whisprl is built on the MERN stack, with Socket.io carrying every message
      in real time. The code is open, so you can see exactly how it fits
      together.
    </Typography>

    <Box
      component="ul"
      sx={{
        listStyle: "none",
        p: 0,
        m: 0,
        mt: { xs: 5, md: 7 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        columnGap: 5,
        rowGap: 5,
      }}
    >
      {STACK.map(({ letter, name, role }) => (
        <Box component="li" key={name}>
          <Box
            aria-hidden="true"
            sx={{
              fontSize: { xs: 72, md: 96 },
              fontWeight: 200,
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            {letter}
          </Box>
          <Typography component="h3" sx={{ mt: 1.5, fontSize: 18, fontWeight: 700 }}>
            {name}
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.6, maxWidth: "30ch" }}>
            {role}
          </Typography>
        </Box>
      ))}
    </Box>

    <Button
      href={SOURCE_URL}
      target="_blank"
      rel="noopener"
      variant="outlined"
      color="inherit"
      size="large"
      startIcon={<GithubLogo weight="duotone" />}
      sx={{ mt: { xs: 5, md: 7 } }}
    >
      Read the source on GitHub
    </Button>
  </Box>
);

export default MernStack;
