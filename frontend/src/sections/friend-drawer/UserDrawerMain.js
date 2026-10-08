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
import { useDispatch } from "react-redux";
import { CreateOpenConversation } from "@/redux/slices/actions/chatActions";
import { AcceptRejectRequest, RemoveFriend } from "@/redux/slices/actions/contactActions";
import RequestButton from "@/components/profile/RequestButton";
import useRelationship from "@/hooks/useRelationship";

const getRandomAnimation = () => {
  const randomIndex = Math.floor(Math.random() * 5) + 1;
  return import(
    `@/assets/illustrations/animations/CatAnimation${randomIndex}.json`
  );
};

const UserDrawerMain = ({ toggleDrawer, userData, isLoading }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // from redux
  const dispatch = useDispatch();
  const { state } = useRelationship(userData?._id);

  const [catAnimation, setCatAnimation] = useState(null);
  const [rfDialog, setRFDialog] = useState(false);

  const handleButtonClick = async (type) => {
    if (type === "sendMsg") {
      dispatch(CreateOpenConversation(userData?._id));
      navigate(PATH_DASHBOARD.general.chat);
    } else if (type === "removeFriend") {
      dispatch(RemoveFriend(userData?._id));
    } else {
      await dispatch(AcceptRejectRequest({ sender_id: userData?._id, type }));
    }
    toggleDrawer();
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
            {isLoading ? (
              <LoadingButton loading size="large" variant="outlined">
                Loading
              </LoadingButton>
            ) : state === "self" ? (
              <LoadingButton size="large" variant="outlined" onClick={() => handleButtonClick("sendMsg")}>
                Message Yourself
              </LoadingButton>
            ) : state === "friend" ? (
              <>
                <LoadingButton size="large" variant="outlined" color="error" onClick={toggleRFDialog}>
                  Remove Friend
                </LoadingButton>
                <LoadingButton size="large" variant="outlined" onClick={() => handleButtonClick("sendMsg")}>
                  Send Message
                </LoadingButton>
              </>
            ) : state === "incoming" ? (
              <>
                <LoadingButton size="large" variant="outlined" color="error" onClick={() => handleButtonClick("reject")}>
                  Reject Request
                </LoadingButton>
                <LoadingButton size="large" variant="outlined" color="success" onClick={() => handleButtonClick("accept")}>
                  Accept Friend
                </LoadingButton>
              </>
            ) : (
              <RequestButton person={userData} size="large" variant="outlined" />
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
