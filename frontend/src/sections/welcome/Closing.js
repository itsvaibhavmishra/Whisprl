import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import mascot from "@/assets/icons/logo/Whisprl.webp";
import { sectionHeading, sectionIntro } from "@/sections/welcome/styles";
import { PATH_AUTH } from "@/routes/paths";

const Closing = () => (
  <Box
    component="section"
    aria-labelledby="closing-title"
    sx={{
      display: "grid",
      gridTemplateColumns: { md: "1fr auto" },
      gap: { xs: 4, md: 6 },
      overflow: "hidden",
      bgcolor: "background.paper",
      borderRadius: "32px",
      px: { xs: 3, sm: 5, md: 8 },
      pt: { xs: 5, md: 6 },
    }}
  >
    <Box sx={{ alignSelf: "center", pb: { md: 6 } }}>
      <Typography id="closing-title" component="h2" sx={sectionHeading}>
        Your friends are one message away
      </Typography>
      <Typography sx={sectionIntro}>
        Create a free account, add your friends and say hello.
      </Typography>
      <Button
        component={RouterLink}
        to={PATH_AUTH.general.register}
        variant="contained"
        size="large"
        sx={{ mt: 4 }}
      >
        Create a free account
      </Button>
    </Box>
    <Box
      component="img"
      src={mascot}
      alt="The Whisprl mascot, a cat robot wearing a headset"
      loading="lazy"
      width={600}
      height={648}
      sx={{
        display: "block",
        alignSelf: "end",
        width: { xs: 220, md: 280 },
        height: "auto",
        justifySelf: { xs: "center", md: "end" },
      }}
    />
  </Box>
);

export default Closing;
