import { Box, Button, Stack } from "@mui/material";
import { SignOut } from "phosphor-react";
import { useDispatch } from "react-redux";

import whisprlMark from "@/assets/icons/logo/WhisprlMark.webp";
import AppearanceMenu from "@/components/AppearanceMenu";
import BrandPanel from "@/layouts/auth/BrandPanel";
import { LogoutUser } from "@/redux/slices/actions/authActions";

// the same frame as signing up, with Log out as the only way off the page
const SetupFrame = ({ children }) => {
  const dispatch = useDispatch();

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { md: "5fr 7fr" }, minHeight: "100dvh" }}>
      <BrandPanel />
      <Stack sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, md: 6 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box component="img" src={whisprlMark} alt="Whisprl" width={48} height={52} sx={{ display: { md: "none" } }} />
          <Box sx={{ flex: 1 }} />
          <AppearanceMenu />
          <Button color="inherit" startIcon={<SignOut />} onClick={() => dispatch(LogoutUser())}>
            Log out
          </Button>
        </Stack>
        <Box component="main" sx={{ width: "100%", maxWidth: 420, mx: "auto", my: "auto", py: 4 }}>
          {children}
        </Box>
      </Stack>
    </Box>
  );
};

export default SetupFrame;
