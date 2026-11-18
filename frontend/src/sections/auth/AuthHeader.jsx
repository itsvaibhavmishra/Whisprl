import { Box, Typography } from "@mui/material";

import whisprlLogo from "@/assets/icons/logo/Whisprl.webp";

const CENTRED = { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" };

// a computer already shows the mascot large beside the form, so the logo above the title is for phones
const AuthHeader = ({ title, hasLogo = false, isCentred = hasLogo, children }) => (
  <Box sx={{ mb: 4, ...(isCentred && CENTRED) }}>
    {hasLogo && <Box component="img" src={whisprlLogo} alt="" width={112} height={121} sx={{ display: { xs: "block", md: "none" }, mb: 2.5 }} />}
    <Typography component="h1" sx={{ m: 0, fontSize: { xs: 28, md: 32 }, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
      {title}
    </Typography>
    {children && <Typography sx={{ mt: 1, color: "text.secondary", textWrap: "pretty" }}>{children}</Typography>}
  </Box>
);

export default AuthHeader;
