import { Box, Link, Typography } from "@mui/material";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";

import whisprlLogo from "@/assets/icons/logo/Whisprl.webp";
import { PATH_AUTH } from "@/routes/paths";

const CENTRED = { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" };

// a computer already shows the mascot large beside the form, so the logo above the title is for phones
const AuthHeader = ({ title, hasLogo = false, children }) => (
  <Box sx={{ mb: 4, ...(hasLogo && CENTRED) }}>
    {hasLogo && <Box component="img" src={whisprlLogo} alt="" width={112} height={121} sx={{ display: { xs: "block", md: "none" }, mb: 2.5 }} />}
    <Typography component="h1" sx={{ m: 0, fontSize: { xs: 28, md: 32 }, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
      {title}
    </Typography>
    {children && <Typography sx={{ mt: 1, color: "text.secondary", textWrap: "pretty" }}>{children}</Typography>}
  </Box>
);

export const BackToLogin = ({ sx }) => (
  <Link
    component={RouterLink}
    to={PATH_AUTH.general.login}
    state={{ withEmail: true }}
    color="text.secondary"
    variant="body2"
    underline="hover"
    sx={{ mt: 4, display: "inline-flex", alignItems: "center", gap: 0.5, ...sx }}
  >
    <CaretLeftIcon size={16} />
    Back to log in
  </Link>
);

export default AuthHeader;
