import { useEffect, useRef, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { AcknowledgeMessages, GetMessages } from "@/redux/slices/actions/chatActions";
import { UnblockUser } from "@/redux/slices/actions/chatSettingsActions";
import { selectActiveOutbox } from "@/redux/slices/chatSlice";
import { setUnlockOpen } from "@/redux/slices/encryptionSlice";
import ChatCanvas from "@/sections/chat/ChatCanvas";
import FileUploadCont from "@/sections/chat/attachments/FileUploadCont";
import ChatNote from "@/sections/chat/conversation/ChatNote";
import ChatSearchBar from "@/sections/chat/conversation/ChatSearchBar";
import Composer, { COLUMN_WIDTH, COMPOSER_GUTTER } from "@/sections/chat/conversation/Composer";
import ConversationHeader from "@/sections/chat/conversation/ConversationHeader";
import ConversationMain from "@/sections/chat/conversation/ConversationMain";
import PinnedBar from "@/sections/chat/conversation/PinnedBar";
import { peerOf } from "@/utils/chats";

const ComposerNotice = ({ children, action }) => (
  <Box sx={{ ...COMPOSER_GUTTER, pt: 0.5 }}>
    <Stack
      alignItems="center"
      spacing={1.25}
      sx={{ maxWidth: COLUMN_WIDTH, mx: "auto", px: 3, py: 2, textAlign: "center", borderRadius: 6, bgcolor: "chat.raised", boxShadow: (theme) => `0 0 0 1px ${theme.palette.chat.edge}` }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{children}</Typography>
      {action}
    </Stack>
  </Box>
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
  const queuedHere = useSelector(selectActiveOutbox).length;
  const [sends, setSends] = useState(0);
  const queuedBefore = useRef(queuedHere);

  useEffect(() => {
    dispatch(GetMessages(conversationId));
  }, [dispatch, conversationId]);

  // the outbox only grows when a message is sent from here, so its growth counts sends
  useEffect(() => {
    if (queuedHere > queuedBefore.current) setSends((count) => count + 1);
    queuedBefore.current = queuedHere;
  }, [queuedHere]);

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
          <ChatNote sx={{ mb: 0.5, mt: 0 }}>
            {peer.firstName} has not opened Whisprl since messages became end-to-end encrypted. Your messages arrive once they do.
          </ChatNote>
        )}
        <Composer key={conversationId} />
      </>
    );
  };

  return (
    <ChatCanvas conversationId={conversationId} step={sends} sx={{ height: "100%", minWidth: 0, display: "flex", flexDirection: "column" }}>
      <ConversationHeader isSearching={isSearching} onToggleSearch={() => setIsSearching((open) => !open)} />
      {isSearching && <ChatSearchBar onClose={() => setIsSearching(false)} />}
      {!isSearching && <PinnedBar />}
      {files.length ? (
        <FileUploadCont />
      ) : (
        <>
          <ConversationMain />
          {composer()}
        </>
      )}
    </ChatCanvas>
  );
};

export default Conversation;
