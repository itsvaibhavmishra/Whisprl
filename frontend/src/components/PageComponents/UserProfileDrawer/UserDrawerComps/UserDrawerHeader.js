import {
  Box,
  Stack,
  useTheme,
  Typography,
  IconButton,
  Skeleton,
} from "@mui/material";
import { XCircle } from "phosphor-react";

import catDoodle from "@/assets/backgrounds/catDoodle.webp";
import getAvatar from "../../../../utils/createAvatar";

const UserDrawerHeader = ({ toggleDrawer, userData, isLoading }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        backgroundImage: `url(${catDoodle})`,
        objectFit: "cover",
        backgroundSize: "300px",
        backgroundColor: theme.palette.primary.lighterFaded,
      }}
    >
      <IconButton
        onClick={toggleDrawer}
        sx={{
          position: "absolute",
          right: "10px",
          top: "10px",
          zIndex: "10",
          backgroundColor: theme.palette.background.default,
          "&:hover": {
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <XCircle />
      </IconButton>
      <Stack
        direction={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        height={"15em"}
        spacing={0.2}
        sx={{ position: "relative" }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            backgroundColor:
              !isLoading && `${theme.palette.background.default}80`,
            borderRadius: 2,
            p: 1,
          }}
        >
          {isLoading ? (
            <Stack alignItems={"center"} justifyContent={"center"}>
              <Skeleton animation="wave" height={100} width="5em" />
              <Skeleton animation="wave" height={30} width="3em" />
            </Stack>
          ) : (
            `${userData?.firstName} ${userData?.lastName}`
          )}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 900,
            backgroundColor:
              !isLoading && `${theme.palette.background.default}80`,
            borderRadius: 2,
            p: 1,
          }}
        >
          {!isLoading && `${userData?.activityStatus}`}
        </Typography>
        <Box sx={{ position: "absolute", bottom: "-50px" }}>
          {isLoading ? (
            <Skeleton
              animation="wave"
              variant="circular"
              width={100}
              height={100}
            />
          ) : (
            getAvatar(userData?.avatar, userData?.firstName, theme, 100)
          )}
        </Box>
      </Stack>
    </Box>
  );
};
export default UserDrawerHeader;
