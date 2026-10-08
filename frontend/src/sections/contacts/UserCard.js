import { useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";

import getAvatar from "@/utils/avatars";
import UserProfileDrawer from "@/sections/friend-drawer/UserProfileDrawer";
import RequestButton from "@/components/profile/RequestButton";
import useIsLoading from "@/hooks/useIsLoading";

// redux imports
import { useDispatch } from "react-redux";
import { AcceptRejectRequest } from "@/redux/slices/actions/contactActions";

const UserCard = ({ thisUser, fromSection, isLoading, note }) => {
  const theme = useTheme();

  const [openDrawer, setOpenDrawer] = useState(false);
  const isAnswering = useIsLoading(AcceptRejectRequest);

  const dispatch = useDispatch();

  const answer = (event, type) => {
    event.stopPropagation();
    dispatch(AcceptRejectRequest({ sender_id: thisUser?._id, type }));
  };

  const toggleDrawer = () => {
    if (!isLoading) {
      setOpenDrawer(!openDrawer);
    }
  };

  // breakpoint
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <Grid item xs={12} sm={12} md={6} lg={4}>
      <Card
        sx={{
          backgroundColor: theme.palette.background.default,
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: theme.palette.primary.lighterFaded,
            backdropFilter: "blur(10px)",
            cursor: !isLoading ? "pointer" : "default",
          },
        }}
        onClick={toggleDrawer}
      >
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction={"row"} spacing={2} alignItems={"center"}>
              {/* Avatar */}
              {isLoading ? (
                <Skeleton
                  animation="wave"
                  variant="circular"
                  width={isSmallScreen ? 60 : 80}
                  height={isSmallScreen ? 60 : 80}
                />
              ) : (
                getAvatar(thisUser?.avatar, thisUser?.firstName, isSmallScreen ? 60 : 80)
              )}

              {/* Name and Email */}
              <Stack>
                <Typography variant="h6">
                  {isLoading ? (
                    <Skeleton animation="wave" width={100} />
                  ) : (
                    `${thisUser?.firstName} ${thisUser?.lastName}`
                  )}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    wordBreak: "break-word",
                  }}
                >
                  {isLoading ? (
                    <Skeleton animation="wave" width={150} />
                  ) : (
                    thisUser?.username && `@${thisUser.username}`
                  )}
                </Typography>
              </Stack>
            </Stack>
            {note}
            {/* Request Options */}
            {isLoading ? (
              <LoadingButton loading variant="text">
                Loading
              </LoadingButton>
            ) : fromSection === "FriendRequests" ? (
              <Stack direction={"row"} justifyContent={"flex-end"} spacing={1}>
                <LoadingButton loading={isAnswering} variant="text" color="error" onClick={(e) => answer(e, "reject")}>
                  Reject
                </LoadingButton>
                <LoadingButton loading={isAnswering} variant="outlined" color="success" onClick={(e) => answer(e, "accept")}>
                  Accept
                </LoadingButton>
              </Stack>
            ) : (
              <RequestButton person={thisUser} variant="text" />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Drawer */}
      <UserProfileDrawer openDrawer={openDrawer} toggleDrawer={toggleDrawer} selectedUserData={thisUser} />
    </Grid>
  );
};
export default UserCard;
