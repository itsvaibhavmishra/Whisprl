import { useEffect, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { AcknowledgeMessages, GetMessages } from "@/redux/slices/actions/chatActions";
import { UnblockUser } from "@/redux/slices/actions/chatSettingsActions";
import { setUnlockOpen } from "@/redux/slices/encryptionSlice";
import FileUploadCont from "@/sections/chat/attachments/FileUploadCont";
import ChatSearchBar from "@/sections/chat/conversation/ChatSearchBar";
import Composer from "@/sections/chat/conversation/Composer";
import ConversationHeader from "@/sections/chat/conversation/ConversationHeader";
import ConversationMain from "@/sections/chat/conversation/ConversationMain";
import PinnedBar from "@/sections/chat/conversation/PinnedBar";
import { peerOf } from "@/utils/chats";

const ComposerNotice = ({ children, action }) => (
  <Stack
    alignItems="center"
    spacing={1}
    sx={{ px: 3, py: 2, textAlign: "center", bgcolor: "background.default", borderTop: 1, borderColor: "divider" }}
  >
    <Typography variant="body2">{children}</Typography>
    {action}
  </Stack>
);

const lockedReasonFor = (keyStatus) => {
  if (keyStatus === "checking") return "Getting encryption ready…";
  if (keyStatus === "failed") return "Encryption could not start. Reload Whisprl to try again.";
  if (keyStatus !== "ready") return "Unlock your messages to send one.";
  return null;
};

const Conversation = () => {
  const dispatch = useDispatch();
  const { activeConversation, activeConvoFriendship, files } = useSelector((state) => state.chat);
  const keyStatus = useSelector((state) => state.encryption.status);
  const { _id: meId, blocked = [] } = useSelector((state) => state.user.user);
  const friends = useSelector((state) => state.user.friends);
  const [isSearching, setIsSearching] = useState(false);

  const conversationId = activeConversation._id;
  const peer = activeConversation.isGroup ? null : peerOf(activeConversation, meId);
  const peerHasNoKey = peer && peer._id !== meId && !peer.publicKeys?.length;
  const hasBlockedPeer = Boolean(peer && blocked.includes(peer._id));
  const isFriend = Boolean(peer && friends.some((friend) => friend._id === peer._id));
  const lockedReason = lockedReasonFor(keyStatus);

  useEffect(() => {
    dispatch(GetMessages(conversationId));
  }, [dispatch, conversationId]);

  useEffect(() => {
    const markSeenOnReturn = () => {
      if (document.visibilityState === "visible") dispatch(AcknowledgeMessages(conversationId));
    };
    document.addEventListener("visibilitychange", markSeenOnReturn);
    return () => document.removeEventListener("visibilitychange", markSeenOnReturn);
  }, [conversationId, dispatch]);

  const composer = () => {
    if (hasBlockedPeer) {
      return (
        <ComposerNotice
          action={
            <Button size="small" variant="contained" onClick={() => dispatch(UnblockUser(peer._id))}>
              Unblock
            </Button>
          }
        >
          You blocked {peer.firstName}.
        </ComposerNotice>
      );
    }
    if (!activeConvoFriendship) {
      return (
        <ComposerNotice>
          {isFriend ? `You can't message ${peer.firstName} right now.` : "You are no longer friends, so you can't send messages here."}
        </ComposerNotice>
      );
    }
    if (lockedReason) {
      return (
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
      );
    }
    return (
      <>
        {peerHasNoKey && (
          <Typography variant="caption" sx={{ px: 3, pt: 1, color: "text.secondary", textAlign: "center", bgcolor: "background.default" }}>
            {peer.firstName} has not opened Whisprl since messages became end-to-end encrypted. Your messages arrive once they do.
          </Typography>
        )}
        <Composer key={conversationId} />
      </>
    );
  };

  return (
    <Stack sx={{ height: "100%", minWidth: 0 }}>
      <ConversationHeader isSearching={isSearching} onToggleSearch={() => setIsSearching((open) => !open)} />
      {isSearching && <ChatSearchBar onClose={() => setIsSearching(false)} />}
      <PinnedBar />
      {files.length ? (
        <FileUploadCont />
      ) : (
        <>
          <ConversationMain />
          {composer()}
        </>
      )}
    </Stack>
  );
};

export default Conversation;
