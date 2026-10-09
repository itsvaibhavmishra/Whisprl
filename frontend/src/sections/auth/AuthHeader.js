import { Box, Link, Typography } from "@mui/material";
import { CaretLeft } from "phosphor-react";
import { Link as RouterLink } from "react-router-dom";

import { PATH_AUTH } from "@/routes/paths";

const AuthHeader = ({ title, children }) => (
  <Box sx={{ mb: 4 }}>
    <Typography
      component="h1"
      sx={{ m: 0, fontSize: { xs: 28, md: 32 }, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}
    >
      {title}
    </Typography>
    {children && (
      <Typography sx={{ mt: 1, color: "text.secondary", textWrap: "pretty" }}>{children}</Typography>
    )}
  </Box>
);

export const BackToLogin = ({ sx }) => (
  <Link
    component={RouterLink}
    to={PATH_AUTH.general.login}
    color="text.secondary"
    variant="body2"
    underline="hover"
    sx={{ mt: 4, display: "inline-flex", alignItems: "center", gap: 0.5, ...sx }}
  >
    <CaretLeft size={16} />
    Back to log in
  </Link>
);

export default AuthHeader;
