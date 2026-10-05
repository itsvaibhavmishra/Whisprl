import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, useTheme, Skeleton } from "@mui/material";

import StyledBadge from "@/components/StyledBadge";
import getAvatar from "@/utils/createAvatar";
import { getOtherUser } from "@/utils/getOtherUser";

import { useDispatch, useSelector } from "react-redux";
import { CreateOpenConversation } from "@/redux/slices/actions/chatActions";

const OnlineChatElement = ({
  _id,
  firstName,
  avatar,
  onlineStatus,
  isLoading,
  fromContact,
}) => {
  // using theme
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, onlineFriends } = useSelector((state) => state.user);
  const { activeConversation } = useSelector((state) => state.chat);

  const otherUser = getOtherUser(
    activeConversation?.users,
    user._id,
    onlineFriends
  );

  const isActiveConvo = Boolean(otherUser && otherUser._id === _id);

  // ----------- inner functions -----------
  const handleConversation = async () => {
    if (!isActiveConvo && !isLoading) {
      await dispatch(CreateOpenConversation(_id));
      if (fromContact) {
        navigate("/app");
      }
    }
  };
  // ---------------------------------------

  return (
    <Box
      sx={{
        minWidth: 70,
        maxWidth: 75,
        mt: 2,
        height: 50,
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
        cursor: isActiveConvo ? "default" : "pointer",
        position: "relative",
        transition: "background-color 0.2s ease",
        "&:hover": {
          backgroundColor:
            !isActiveConvo && !isLoading && `${theme.palette.primary.main}20`,
        },
      }}
      onClick={handleConversation}
    >
      <Stack
        direction={"column"}
        justifyContent={"center"}
        alignItems={"center"}
        spacing={0.8}
        sx={{
          position: "absolute",
          top: -15,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {isLoading ? (
          <Skeleton
            animation="wave"
            variant="circular"
            width={35}
            height={35}
          />
        ) : onlineStatus === "online" ? (
          <StyledBadge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
          >
            {getAvatar(avatar, firstName, theme, 35)}
          </StyledBadge>
        ) : (
          getAvatar(avatar, firstName, theme, 35)
        )}
        <Typography variant="caption" sx={{ userSelect: "none" }}>
          {isLoading ? (
            <Skeleton animation="wave" height={20} width="4em" />
          ) : (
            firstName
          )}
        </Typography>
      </Stack>
    </Box>
  );
};

export default OnlineChatElement;
