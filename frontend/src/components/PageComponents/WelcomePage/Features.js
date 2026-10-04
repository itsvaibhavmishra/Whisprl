import { Box, Typography } from "@mui/material";

import { FEATURES } from "@/components/PageComponents/WelcomePage/content";
import { sectionHeading, sectionSpacing } from "@/components/PageComponents/WelcomePage/styles";

const Features = () => (
  <Box component="section" aria-labelledby="features-title" sx={sectionSpacing}>
    <Typography id="features-title" component="h2" sx={sectionHeading}>
      Everything a conversation needs
    </Typography>

    <Box
      component="ul"
      sx={{
        listStyle: "none",
        p: 0,
        m: 0,
        mt: { xs: 5, md: 7 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        columnGap: 6,
        rowGap: { xs: 5, md: 7 },
      }}
    >
      {FEATURES.map(({ Icon, title, body }) => (
        <Box component="li" key={title}>
          <Box sx={{ display: "flex", color: "primary.main" }}>
            <Icon size={32} weight="duotone" aria-hidden="true" />
          </Box>
          <Typography component="h3" sx={{ mt: 2, fontSize: 18, fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.6, maxWidth: "34ch" }}>
            {body}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

export default Features;
