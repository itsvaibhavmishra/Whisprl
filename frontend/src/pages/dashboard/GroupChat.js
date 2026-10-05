import { Stack, Typography } from "@mui/material";

import NoChat from "@/assets/illustrations/NoChat";

const GroupChat = () => {
  return (
    <Stack
      alignItems={"center"}
      justifyContent={"center"}
      sx={{ width: "100%", height: { xs: "calc(100vh - 65px)", md: "100vh" } }}
    >
      <NoChat />
      <Typography
        component={"h1"}
        variant="subtitle2"
        sx={{ mt: { xs: -5, md: -10 } }}
      >
        Group-Chat will be available soon.
      </Typography>
    </Stack>
  );
};
export default GroupChat;
