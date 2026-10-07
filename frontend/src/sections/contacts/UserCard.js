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

// redux imports
import { useDispatch, useSelector } from "react-redux";
import {
  AcceptRejectRequest,
  SendRequest,
  UnsendRequest,
} from "@/redux/slices/actions/contactActions";

const UserCard = ({ thisUser, fromSection, isLoading }) => {
  const theme = useTheme();

  const [openDrawer, setOpenDrawer] = useState(false);
  const [isActionsLoading, setIsActionsLoading] = useState(false);

  const dispatch = useDispatch();
  const { sentRequests } = useSelector((state) => state.contact);

  const sentRequest = sentRequests?.find(
    (request) => request.receiverId === thisUser?._id
  );
  const isRequestSent = sentRequest
    ? sentRequest.isSent
    : thisUser?.requestSent;

  const handleButtonClick = async (e, type) => {
    e.stopPropagation();

    // Friend Requests Handler
    if (fromSection === "FriendRequests") {
      setIsActionsLoading(true);
      await dispatch(AcceptRejectRequest({ sender_id: thisUser?._id, type }));
      setIsActionsLoading(false);
    }

    // Send Request Handler
    else if (type === "sendRequest" && !isRequestSent) {
      setIsActionsLoading(true);
      await dispatch(SendRequest(thisUser?._id));
      setIsActionsLoading(false);
    }

    // Unsend Request Handler
    else if (type === "unsendRequest" && isRequestSent) {
      setIsActionsLoading(true);
      await dispatch(UnsendRequest(thisUser?._id));
      setIsActionsLoading(false);
    }
  };

  const toggleDrawer = () => {
    if (!isLoading && !isActionsLoading) {
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
            cursor: !isLoading && !isActionsLoading ? "pointer" : "default",
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
                    thisUser?.email
                  )}
                </Typography>
              </Stack>
            </Stack>
            {/* Request Options */}
            {fromSection === "FriendRequests" ? (
              <Stack direction={"row"} justifyContent={"flex-end"} spacing={1}>
                <LoadingButton
                  loading={isLoading || isActionsLoading}
                  variant="text"
                  color="error"
                  onClick={(e) => handleButtonClick(e, "reject")}
                >
                  Reject
                </LoadingButton>
                <LoadingButton
                  loading={isLoading || isActionsLoading}
                  variant="outlined"
                  color="success"
                  onClick={(e) => handleButtonClick(e, "accept")}
                >
                  Accept
                </LoadingButton>
              </Stack>
            ) : fromSection === "SearchUsers" ||
              fromSection === "SentRequests" ? (
              <LoadingButton
                loading={isLoading || isActionsLoading}
                variant="text"
                color={!isRequestSent ? "success" : "error"}
                onClick={(e) =>
                  handleButtonClick(
                    e,
                    !isRequestSent ? "sendRequest" : "unsendRequest"
                  )
                }
              >
                {!isRequestSent ? "Send Request" : "Unsend Request"}
              </LoadingButton>
            ) : (
              <LoadingButton
                loading={isLoading}
                variant="text"
                color="primary"
                onClick={toggleDrawer}
              >
                View User
              </LoadingButton>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Drawer */}
      <UserProfileDrawer
        isFrom={fromSection}
        openDrawer={openDrawer}
        toggleDrawer={toggleDrawer}
        selectedUserData={thisUser}
        isRequestSent={isRequestSent}
      />
    </Grid>
  );
};
export default UserCard;
