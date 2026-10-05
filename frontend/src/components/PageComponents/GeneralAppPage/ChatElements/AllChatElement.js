import {
  Badge,
  Box,
  Stack,
  Typography,
  Skeleton,
  useTheme,
} from "@mui/material";
import BeatLoader from "react-spinners/BeatLoader";

// redux imports
import { useDispatch, useSelector } from "react-redux";
import { CreateOpenConversation } from "../../../../redux/slices/actions/chatActions";

import StyledBadge from "../../../StyledBadge";
import getAvatar from "../../../../utils/createAvatar";
import formatTime from "../../../../utils/timeFormatter";
import truncateText from "../../../../utils/truncateText";
import { getOtherUser } from "../../../../utils/getOtherUser";

const previewOf = (message) => {
  if (message.undecryptable) return message.awaitingKey ? "Message on its way" : "Encrypted message";
  if (message.message) return message.message;
  return message.files?.length ? "Sent a file" : "";
};

const AllChatElement = ({
  _id,
  firstName,
  lastName,
  latestMessage,
  activityStatus,
  avatar,
  unread,
  onlineStatus,
  isLoading,
  convo_id,
  fromContact,
  toggleDrawer,
}) => {
  // using theme
  const theme = useTheme();

  // from redux
  const dispatch = useDispatch();
  const { user, onlineFriends } = useSelector((state) => state.user);
  const { activeConversation, typingConversation } = useSelector(
    (state) => state.chat
  );

  // ----------- inner functions -----------
  const getIsActiveConvo = () => {
    if (fromContact) {
      const otherUser = getOtherUser(
        activeConversation?.users,
        user._id,
        onlineFriends
      );

      return Boolean(otherUser && otherUser._id === _id);
    } else if (activeConversation && convo_id) {
      return activeConversation?._id === convo_id;
    } else return false;
  };

  const isActiveConvo = getIsActiveConvo();

  const handleConversation = () => {
    if (!isActiveConvo && !isLoading) {
      if (fromContact) {
        toggleDrawer(_id);
      } else {
        dispatch(CreateOpenConversation(_id));
      }
    }
  };

  const selectedChat = () => {
    if (!activeConversation) {
      return "none";
    } else if (theme.palette.mode === "dark") {
      return isActiveConvo ? theme.palette.primary.lighterFaded : "none";
    } else {
      return isActiveConvo ? theme.palette.primary.lighter : "none";
    }
  };

  const setTyping = () => {
    const typingObject = typingConversation?.find(
      (obj) => obj.conversation_id === convo_id
    );
    return typingObject ? typingObject.typing : false;
  };
  const override = {
    padding: "5px",
    backgroundColor: `${theme.palette.primary.main}15`,
    borderRadius: 20,
  };

  // ---------------------------------------
  const isTyping = setTyping();

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: 1,
        backgroundColor: selectedChat,
        cursor: !isActiveConvo && !isLoading ? "pointer" : "default",
        transition: "background-color 0.2s ease",
        "&:hover": {
          backgroundColor:
            !isActiveConvo && !isLoading && `${theme.palette.primary.main}20`,
        },
      }}
      p={1.5}
      onClick={handleConversation}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Stack direction={"row"} spacing={2} alignItems={"center"}>
          {/* Avatar and online status badge */}
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
              {getAvatar(avatar, firstName, theme)}
            </StyledBadge>
          ) : (
            getAvatar(avatar, firstName, theme)
          )}

          {/* Name and message */}
          <Stack spacing={0.3}>
            <Typography variant="subtitle2">
              {isLoading ? (
                <Skeleton animation="wave" height={20} width="7em" />
              ) : (
                `${firstName} ${lastName}${_id === user._id ? "(You)" : ""}`
              )}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, paddingTop: 0.8 }}
            >
              {isLoading ? (
                <Skeleton animation="wave" height={20} width="12em" />
              ) : isTyping ? (
                <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.primary.main,
                      animation: "fade 3s ease infinite",
                      "@keyframes fade": {
                        "0%": {
                          opacity: 0.5,
                        },
                        "50%": {
                          opacity: 1,
                        },
                        "100%": {
                          opacity: 0.5,
                        },
                      },
                    }}
                  >
                    Typing
                  </Typography>
                  <BeatLoader
                    size={5}
                    height={0.5}
                    width={1}
                    color={theme.palette.primary.main}
                    speedMultiplier={0.5}
                    margin={2}
                    cssOverride={override}
                  />
                </Stack>
              ) : (
                truncateText(
                  latestMessage
                    ? latestMessage?.sender?._id === user._id
                      ? `You: ${previewOf(latestMessage)}`
                      : previewOf(latestMessage)
                    : activityStatus,
                  20
                )
              )}
            </Typography>
          </Stack>
        </Stack>

        {/* Time and message badge */}
        <Stack spacing={2} alignItems={"center"}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.secondary,
              paddingBottom: 0.8,
              textWrap: "nowrap",
            }}
          >
            {isLoading ? (
              <Skeleton animation="wave" height={20} width="3em" />
            ) : (
              formatTime(latestMessage?.updatedAt)
            )}
          </Typography>
          {isLoading ? (
            <Skeleton
              animation="wave"
              variant="circular"
              width={15}
              height={15}
            />
          ) : (
            <Badge
              badgeContent={unread}
              max={9}
              sx={{
                paddingBottom: 1,
                "& .MuiBadge-badge": {
                  color: theme.palette.primary.main,
                  backgroundColor: `${theme.palette.primary.main}15`,
                },
              }}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default AllChatElement;
