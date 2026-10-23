import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, GlobalStyles, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import { shallowEqual, useDispatch, useSelector } from "react-redux";

import { AcknowledgeMessages, GetMessages } from "@/redux/slices/actions/chatActions";
import { UnblockUser } from "@/redux/slices/actions/chatSettingsActions";
import { LookAtGame, OpenGame, UnwatchGame, WatchGame } from "@/redux/slices/actions/gameActions";
import { selectActiveOutbox } from "@/redux/slices/chatSlice";
import { setUnlockOpen } from "@/redux/slices/encryptionSlice";
import { selectGameSession } from "@/redux/slices/gameSlice";
import { selectIsLoading } from "@/redux/slices/requestSlice";
import ChatCanvas from "@/sections/chat/ChatCanvas";
import FileUploadCont from "@/sections/chat/attachments/FileUploadCont";
import ChatNote from "@/sections/chat/conversation/ChatNote";
import ChatSearchBar from "@/sections/chat/conversation/ChatSearchBar";
import ChatSheetGrip from "@/sections/chat/conversation/ChatSheetGrip";
import Composer, { COLUMN_WIDTH, COMPOSER_GUTTER } from "@/sections/chat/conversation/Composer";
import ConversationHeader from "@/sections/chat/conversation/ConversationHeader";
import ConversationMain from "@/sections/chat/conversation/ConversationMain";
import PinnedBar from "@/sections/chat/conversation/PinnedBar";
import { GAME_IDS, GAMES } from "@/sections/chat/game/catalog";
import GamePanel, { CHAT_MIN_WIDTH } from "@/sections/chat/game/GamePanel";
import { openingSessionOf } from "@/sections/chat/game/gameStatus";
import GamePill from "@/sections/chat/game/GamePill";
import RoomBar from "@/sections/chat/game/RoomBar";
import SeatSwitchDialog from "@/sections/chat/game/SeatSwitchDialog";
import useGameSounds from "@/sections/chat/game/useGameSounds";
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

const SHEET_HEIGHT = "62vh";
const SHEET_EASE = "340ms cubic-bezier(0.32, 0.72, 0, 1)";

// registered so the browser can animate them, which is what moves the sheet's edge rather than its layout
const EDGE_PROPERTIES = {
  "@property --chat-top": { syntax: "'<length-percentage>'", inherits: "true", initialValue: "0px" },
  "@property --chat-fade": { syntax: "'<length>'", inherits: "true", initialValue: "0px" },
  "@property --chat-round": { syntax: "'<length>'", inherits: "true", initialValue: "0px" },
};

// under a game the chat keeps out of sight, since what is said shows at the table itself, and opens as a sheet
const EDGE_OF = {
  behind: { top: "100%", fade: "0px", round: "0px" },
  sheet: { top: `calc(100% - ${SHEET_HEIGHT})`, fade: "0px", round: "20px" },
  full: { top: "0px", fade: "0px", round: "0px" },
};

// on a phone the chat always lies over whatever is behind it, so the only thing a game changes is how much shows
const chatColumnOf = (isOverGame) => ({
  position: { xs: "absolute", lg: "relative" },
  inset: { xs: 0, lg: "auto" },
  zIndex: 3,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  minWidth: { lg: CHAT_MIN_WIDTH },
  flex: { lg: 1 },
  // it covers the whole game, so only what it draws takes taps and the rest reach the board
  ...(isOverGame && { pointerEvents: { xs: "none", lg: "auto" }, "& > *": { pointerEvents: "auto" } }),
});

// the list stays full height and scrolled to its newest message, so moving the edge only shows more or less of it
const messagesOf = (layer, dragY) => {
  const edge = EDGE_OF[layer];
  return {
    position: "relative",
    display: "flex",
    // a column, so the list stretches across rather than being sized by its widest message
    flexDirection: "column",
    minHeight: 0,
    flex: 1,
    "--chat-top": { xs: edge.top, lg: "0px" },
    "--chat-fade": { xs: edge.fade, lg: "0px" },
    "--chat-round": { xs: edge.round, lg: "0px" },
    clipPath: { xs: "inset(var(--chat-top) 0 0 0 round var(--chat-round) var(--chat-round) 0 0)", lg: "none" },
    maskImage: { xs: "linear-gradient(to bottom, transparent var(--chat-top), #000 calc(var(--chat-top) + var(--chat-fade)))", lg: "none" },
    bgcolor: { xs: layer === "sheet" ? "rgba(14, 20, 32, 0.86)" : "transparent", lg: "transparent" },
    backdropFilter: { xs: layer === "sheet" ? "blur(14px)" : "blur(0px)", lg: "none" },
    transform: dragY ? `translateY(${dragY}px)` : "none",
    transition: [
      `--chat-top ${SHEET_EASE}`,
      `--chat-fade ${SHEET_EASE}`,
      `--chat-round ${SHEET_EASE}`,
      "background-color 240ms ease",
      "backdrop-filter 240ms ease",
      dragY ? "transform 0ms" : "transform 240ms ease",
    ].join(", "),
  };
};

// hidden rather than unmounted so it can fade, and invisible so a screen reader or Tab never lands on it
const shownWhen = (isShown) => ({
  opacity: isShown ? 1 : 0,
  visibility: isShown ? "visible" : "hidden",
  transition: isShown ? "opacity 200ms ease" : "opacity 200ms ease, visibility 0s linear 200ms",
});

const lockedReasonFor = (keyStatus) => {
  if (keyStatus === "checking") return "Getting encryption ready…";
  if (keyStatus === "failed") return "Encryption could not start. Reload Whisprl to try again.";
  if (keyStatus !== "ready") return "Unlock your messages to send one.";
  return null;
};

const Conversation = () => {
  const dispatch = useDispatch();
  const { activeConversation, activeConvoFriendship, files } = useSelector(
    ({ chat }) => ({ activeConversation: chat.activeConversation, activeConvoFriendship: chat.activeConvoFriendship, files: chat.files }),
    shallowEqual
  );
  const keyStatus = useSelector((state) => state.encryption.status);
  const { _id: meId, blocked = [] } = useSelector((state) => state.user.user);
  const friends = useSelector((state) => state.user.friends);
  const [isSearching, setIsSearching] = useState(false);
  const toggleSearch = useCallback(() => setIsSearching((open) => !open), []);
  const gameSession = useSelector(selectGameSession);
  const isGameHidden = useSelector((state) => state.game.collapsed);
  const openingGame = useSelector((state) => GAME_IDS.find((game) => selectIsLoading(state, OpenGame, game)));
  const shownSession = gameSession ?? (openingGame && openingSessionOf(openingGame));
  const isGameShown = Boolean(shownSession) && !isGameHidden;
  const isWide = useMediaQuery(useTheme().breakpoints.up("lg"));
  const watchCount = useSelector((state) => state.game.watchCount);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sheetDrag, setSheetDrag] = useState(0);
  const composerRef = useRef(null);
  const [composerHeight, setComposerHeight] = useState(0);
  useGameSounds(gameSession, meId);

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

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return undefined;
    const observer = new ResizeObserver(([entry]) => setComposerHeight(Math.round(entry.contentRect.height)));
    observer.observe(composer);
    return () => observer.disconnect();
  }, [files.length]);

  useEffect(() => {
    dispatch(WatchGame(conversationId));
    return () => dispatch(UnwatchGame());
  }, [dispatch, conversationId]);

  // a new watch starts out not looking, so the server is told again after every one it confirms
  const isLookingAtGame = Boolean(gameSession) && !isGameHidden;
  useEffect(() => {
    if (watchCount) dispatch(LookAtGame(isLookingAtGame));
  }, [dispatch, isLookingAtGame, watchCount]);

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

  const noticeOf = () => {
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
    return null;
  };

  const composer = () =>
    noticeOf() ?? (
      <>
        {peerHasNoKey && (
          <ChatNote sx={{ mb: 0.5, mt: 0 }}>
            {peer.firstName} has not opened Whisprl since messages became end-to-end encrypted. Your messages arrive once they do.
          </ChatNote>
        )}
        <Composer key={conversationId} />
      </>
    );

  const closeChat = () => {
    setSheetDrag(0);
    setIsChatOpen(false);
  };

  const layer = isGameShown ? (isChatOpen ? "sheet" : "behind") : "full";

  const chat = () =>
    files.length ? (
      <FileUploadCont />
    ) : (
      <>
        <Box sx={messagesOf(layer, sheetDrag)}>
          {isGameShown && (
            <Box sx={{ position: "absolute", top: "var(--chat-top)", left: 0, right: 0, zIndex: 1, display: { lg: "none" }, ...shownWhen(layer === "sheet") }}>
              <ChatSheetGrip onClose={closeChat} onDrag={setSheetDrag} />
            </Box>
          )}
          <ConversationMain />
        </Box>
        <Box ref={composerRef} sx={{ position: "relative" }}>
          {layer === "behind" && !isWide
            ? (noticeOf() ?? <RoomBar theme={GAMES[shownSession.game].theme} onOpenChat={() => setIsChatOpen(true)} />)
            : composer()}
        </Box>
      </>
    );

  return (
    <ChatCanvas conversationId={conversationId} step={sends} sx={{ height: "100%", minWidth: 0, display: "flex", flexDirection: "column" }}>
      {/* a game on a phone takes the whole screen, and going back hides it to bring all of this back */}
      <Box sx={{ flexShrink: 0, ...(isGameShown && { display: { xs: "none", lg: "block" } }) }}>
        <ConversationHeader isSearching={isSearching} onToggleSearch={toggleSearch} />
        {isSearching && <ChatSearchBar onClose={() => setIsSearching(false)} />}
        {!isSearching && <PinnedBar />}
      </Box>
      <GlobalStyles styles={EDGE_PROPERTIES} />
      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: { xs: "column", lg: "row-reverse" },
          // how much of a phone's foot the chat covers, read by the game so its controls stay clear of it
          "--chat-overlay": `${composerHeight}px`,
        }}
      >
        {/* over the chat rather than above it, so hiding the game moves nothing the reader is looking at */}
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 4, display: "flex", justifyContent: "center", pointerEvents: "none", "& > *": { pointerEvents: "auto" } }}>
          <AnimatePresence>{gameSession && isGameHidden && <GamePill key="pill" session={gameSession} meId={meId} />}</AnimatePresence>
        </Box>
        <AnimatePresence initial={false}>
          {isGameShown && <GamePanel key={shownSession.game} conversation={activeConversation} session={shownSession} />}
        </AnimatePresence>
        {isGameShown && isChatOpen && (
          <Box
            aria-hidden
            onClick={closeChat}
            sx={{ position: "absolute", inset: 0, zIndex: 2, display: { lg: "none" }, bgcolor: "rgba(6, 10, 18, 0.45)" }}
          />
        )}
        <Box sx={chatColumnOf(isGameShown)}>{chat()}</Box>
      </Box>
      <SeatSwitchDialog />
    </ChatCanvas>
  );
};

export default Conversation;
