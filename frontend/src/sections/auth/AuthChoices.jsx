import { useState } from "react";
import { Button, Divider } from "@mui/material";
import { useLocation } from "react-router-dom";

import AgreeToTerms from "@/sections/auth/AgreeToTerms";
import ContinueWithGoogle from "@/sections/auth/ContinueWithGoogle";

// Google is the one way in most people need, so the email form waits behind a tap unless email was already chosen
const AuthChoices = ({ moreLabel, children }) => {
  const location = useLocation();
  const [isMoreShown, setIsMoreShown] = useState(Boolean(location.state?.withEmail));

  return (
    <>
      <ContinueWithGoogle variant={isMoreShown ? "outlined" : "contained"} />
      {isMoreShown ? (
        <>
          <Divider sx={{ my: 3, typography: "body2", color: "text.secondary" }}>or use your email</Divider>
          {children}
        </>
      ) : (
        <Button size="large" color="inherit" fullWidth onClick={() => setIsMoreShown(true)} sx={{ mt: 1.5 }}>
          {moreLabel}
        </Button>
      )}
      <AgreeToTerms sx={{ mt: 3 }} />
    </>
  );
};

export default AuthChoices;
