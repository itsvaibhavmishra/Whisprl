import { Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { PATH_DOCS } from "@/routes/paths";

// Google makes an account on first use, so every screen offering it says what continuing agrees to
const AgreeToTerms = ({ sx }) => (
  <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", textWrap: "balance", ...sx }}>
    By continuing, you agree to the{" "}
    <Link component={RouterLink} to={PATH_DOCS.general.tnc} underline="hover">
      terms
    </Link>{" "}
    and the{" "}
    <Link component={RouterLink} to={PATH_DOCS.general.privacy} underline="hover">
      privacy policy
    </Link>
    .
  </Typography>
);

export default AgreeToTerms;
