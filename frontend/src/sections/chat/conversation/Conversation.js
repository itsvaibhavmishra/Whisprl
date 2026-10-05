import { useEffect } from "react";
import { Button, Stack, Typography, useTheme } from "@mui/material";

// redux imports
import { useSelector, useDispatch } from "react-redux";

import { getOtherUser } from "@/utils/getOtherUser";
import ConversationFooter from "@/sections/chat/conversation/ConversationFooter";
import ConversationHeader from "@/sections/chat/conversation/ConversationHeader";
import ConversationMain from "@/sections/chat/conversation/ConversationMain";
import { AcknowledgeMessages, GetMessages } from "@/redux/slices/actions/chatActions";
import FileUploadCont from "@/sections/chat/attachments/FileUploadCont";
import { setUnlockOpen } from "@/redux/slices/encryptionSlice";

const ComposerNotice = ({ children, action }) => {
  const theme = useTheme();

  return (
    <Stack
      py={2}
      px={3}
      width={"100%"}
      sx={{
        position: "sticky",
        backgroundColor: theme.palette.background.default,
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        textAlign: "center",
      }}
      alignItems={"center"}
      spacing={1}
    >
      <span>{children}</span>
      {action}
    </Stack>
  );
};

const lockedReasonFor = (keyStatus) => {
  if (keyStatus === "checking") return "Getting encryption ready…";
  if (keyStatus === "failed") return "Encryption could not start. Reload Whisprl to try again.";
  if (keyStatus !== "ready") return "Unlock your messages to send one.";
  return null;
};

const Conversation = () => {
  const { activeConversation, activeConvoFriendship, files } = useSelector((state) => state.chat);
  const keyStatus = useSelector((state) => state.encryption.status);
  const { user, onlineFriends } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const otherUser = activeConversation?.isGroup ? null : getOtherUser(activeConversation?.users, user._id, onlineFriends);

  const lockedReason = lockedReasonFor(keyStatus);
  const peerHasNoKey = otherUser && !otherUser.publicKeys?.length;

  useEffect(() => {
    dispatch(GetMessages(activeConversation?._id));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?._id]);

  const conversationId = activeConversation?._id;

  useEffect(() => {
    const markSeenOnReturn = () => {
      if (conversationId && document.visibilityState === "visible") dispatch(AcknowledgeMessages(conversationId));
    };
    document.addEventListener("visibilitychange", markSeenOnReturn);
    return () => document.removeEventListener("visibilitychange", markSeenOnReturn);
  }, [conversationId, dispatch]);

  return (
    <Stack height={"100%"} maxHeight={"100vh"} width={"auto"}>
      <ConversationHeader otherUser={otherUser} />

      {files.length === 0 ? (
        <>
          <ConversationMain />

          {!activeConvoFriendship ? (
            <ComposerNotice>You are no longer friends with this user!</ComposerNotice>
          ) : lockedReason ? (
            <ComposerNotice
              action={
                keyStatus === "locked" && (
                  <Button size="small" variant="contained" onClick={() => dispatch(setUnlockOpen(true))}>
                    Unlock
                  </Button>
                )
              }
            >
              {lockedReason}
            </ComposerNotice>
          ) : (
            <>
              {peerHasNoKey && (
                <Typography variant="caption" sx={{ px: 3, pt: 1, color: "text.secondary", textAlign: "center" }}>
                  {otherUser.firstName} has not opened Whisprl since messages became end-to-end encrypted. Your messages
                  arrive once they do.
                </Typography>
              )}
              <ConversationFooter convo_id={activeConversation._id} />
            </>
          )}
        </>
      ) : (
        <FileUploadCont />
      )}
    </Stack>
  );
};
export default Conversation;
