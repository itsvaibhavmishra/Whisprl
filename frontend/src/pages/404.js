import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Lottie from "react-lottie";

import Cat404 from "@/assets/illustrations/animations/Cat404.json";

const Page404 = () => {
  return (
    <Stack
      sx={{
        height: {
          xs: "calc(100vh - 65px)",
          md: "100vh",
        },
        width: "100%",
      }}
      alignItems={"center"}
      justifyContent={"center"}
    >
      <Box sx={{ width: "auto" }}>
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: Cat404,
            rendererSettings: {
              preserveAspectRatio: "xMidYMid slice",
            },
          }}
          isClickToPauseDisabled={true}
        />
      </Box>
    </Stack>
  );
};

export default Page404;
