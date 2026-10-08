import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATH_DASHBOARD } from "@/routes/paths";
import {
  useTheme,
  Box,
  Stack,
  Divider,
  Typography,
  Skeleton,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import Lottie from "react-lottie";

import { getSimpleData } from "@/utils/formatTime";
import RemoveFriendDialog from "@/sections/friend-drawer/RemoveFriendDialog";

// redux imports
import { useDispatch, useSelector } from "react-redux";
import { CreateOpenConversation } from "@/redux/slices/actions/chatActions";
import {
  RemoveFriend,
  SendRequest,
  UnsendRequest,
} from "@/redux/slices/actions/contactActions";

const getRandomAnimation = () => {
  const randomIndex = Math.floor(Math.random() * 5) + 1;
  return import(
    `@/assets/illustrations/animations/CatAnimation${randomIndex}.json`
  );
};

const UserDrawerMain = ({
  toggleDrawer,
  userData,
  isLoading,
  isFrom,
  isRequestSent,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // from redux
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const isCurrentUser = user?._id === userData?._id;

  const [catAnimation, setCatAnimation] = useState(null);
  const [rfDialog, setRFDialog] = useState(false);
  const [isActionsLoading, setIsActionsLoading] = useState(false);

  const handleButtonClick = async (type) => {
    // Send Msg / Remove Friend Handler
    if (type === "sendMsg") {
      dispatch(CreateOpenConversation(userData?._id));
      if (isFrom === "Contacts") navigate(PATH_DASHBOARD.general.chat);
      toggleDrawer();
    } else if (type === "removeFriend") {
      dispatch(RemoveFriend(userData?._id));
      toggleDrawer();
    }

    // Friend Request Handler
    else if (isFrom === "FriendRequests") {
      if (type === "accept") {
        // dispatch accept request
      } else if (type === "reject") {
        // dispatch reject request
      }
      toggleDrawer();
    }

    // Send/Unsend Request Handler
    else if (isFrom === "SearchUsers" || isFrom === "SentRequests") {
      if (isRequestSent) {
        // dispatch unsend request
        setIsActionsLoading(true);
        await dispatch(UnsendRequest(userData?._id));
        setIsActionsLoading(false);
      } else {
        // dispatch send request
        setIsActionsLoading(true);
        await dispatch(SendRequest(userData?._id));
        setIsActionsLoading(false);
      }
    }
  };

  const toggleRFDialog = () => {
    setRFDialog(!rfDialog);
  };

  useEffect(() => {
    getRandomAnimation().then((animation) => {
      setCatAnimation(animation);
    });
  }, []);

  return (
    <Box
      width={"100%"}
      mt={9}
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Stack spacing={3}>
        <Divider>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"center"}
            spacing={5}
          >
            {/* Action Buttons */}
            {isCurrentUser ? (
              <LoadingButton
                loading={isLoading}
                size="large"
                variant="outlined"
                onClick={() => handleButtonClick("sendMsg")}
              >
                Message Yourself
              </LoadingButton>
            ) : isFrom === "SearchUsers" || isFrom === "SentRequests" ? (
              <LoadingButton
                loading={isActionsLoading || isLoading}
                size="large"
                variant="outlined"
                color={isRequestSent ? "error" : "success"}
                onClick={() => handleButtonClick("send_unsend")}
              >
                {isRequestSent ? "Unsend Requset" : "Send Requset"}
              </LoadingButton>
            ) : isFrom === "FriendRequests" ? (
              <>
                <LoadingButton
                  loading={isLoading}
                  size="large"
                  variant="outlined"
                  color={"error"}
                  onClick={() => handleButtonClick("reject")}
                >
                  Reject Request
                </LoadingButton>
                <LoadingButton
                  loading={isLoading}
                  size="large"
                  variant="outlined"
                  color={"success"}
                  onClick={() => handleButtonClick("accept")}
                >
                  Accept Friend
                </LoadingButton>
              </>
            ) : (
              <>
                <LoadingButton
                  loading={isLoading}
                  size="large"
                  variant="outlined"
                  color={"error"}
                  onClick={toggleRFDialog}
                >
                  Remove Friend
                </LoadingButton>
                <LoadingButton
                  loading={isLoading}
                  size="large"
                  variant="outlined"
                  onClick={() => handleButtonClick("sendMsg")}
                >
                  Send Message
                </LoadingButton>
              </>
            )}
          </Stack>
        </Divider>

        <Stack alignItems={"center"} spacing={2}>
          <Typography variant="subtitle1">
            {isLoading ? (
              <Skeleton animation="wave" height={20} width="10em" />
            ) : (
              userData.username && `@${userData.username}`
            )}
          </Typography>
          <Typography variant="subtitle1">
            {isLoading ? (
              <Skeleton animation="wave" height={20} width="15em" />
            ) : (
              `User Joined On: ${getSimpleData(userData.createdAt)}`
            )}
          </Typography>
          <Box width={"12em"}>
            {catAnimation && (
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: catAnimation.default,
                  rendererSettings: {
                    preserveAspectRatio: "xMidYMid slice",
                  },
                }}
                isClickToPauseDisabled={true}
              />
            )}
          </Box>
        </Stack>
      </Stack>
      <RemoveFriendDialog
        open={rfDialog}
        onClose={toggleRFDialog}
        onConfirm={handleButtonClick}
        userData={userData}
      />
    </Box>
  );
};
export default UserDrawerMain;
