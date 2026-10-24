import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box, IconButton, InputBase, Popover, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, m } from "framer-motion";
import { ArrowBendUpLeft, CaretRight, Keyboard, PaperPlaneTilt, PencilSimple, Smiley, X } from "phosphor-react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";

import EmojiPicker from "@/components/EmojiPicker";
import { ChooseAttachments } from "@/redux/slices/actions/attachmentActions";
import { SendTextMessage } from "@/redux/slices/actions/chatActions";
import { EditMessage } from "@/redux/slices/actions/messageActions";
import { setEditing, setReplyingTo } from "@/redux/slices/chatSlice";
import { gameCollapsed, selectGameSession } from "@/redux/slices/gameSlice";
import AttachMenu from "@/sections/chat/conversation/AttachMenu";
import EmojiPanel from "@/sections/chat/conversation/EmojiPanel";
import { MESSAGE_COLUMN_WIDTH } from "@/sections/chat/conversation/ConversationMain";
import MentionSuggestions from "@/sections/chat/conversation/MentionSuggestions";
import QuickEmojiButton from "@/sections/chat/conversation/QuickEmojiButton";
import ShareContactDialog from "@/sections/chat/conversation/ShareContactDialog";
import VoiceRecorder from "@/sections/chat/conversation/VoiceRecorder";
import { useDraft } from "@/sections/chat/conversation/useDraft";
import { useTyping } from "@/sections/chat/conversation/useTyping";
import GamesDialog from "@/sections/chat/game/GamesDialog";
import MediaTile from "@/sections/chat/messages/MediaTile";
import getAvatar from "@/utils/avatars";
import { quickEmojiOf } from "@/utils/emoji";
import { lastKeyboardHeight, useKeyboardHeight } from "@/utils/keyboard";
import { thumbnailFileOf } from "@/utils/messageFiles";
import { quoteSummaryOf, summaryOf } from "@/utils/messageSummary";
import { gradientOf } from "@/utils/gradients";
import { isApp } from "@/utils/platform";

const MAX_SUGGESTIONS = 6;

const mentionQueryBefore = (text, caret) => text.slice(0, caret).match(/(?:^|\s)@([^\s@]*)$/)?.[1] ?? null;

const isMentionMatch = (member, query) =>
  [`${member.firstName} ${member.lastName}`, member.username].some((name) => name?.toLowerCase().startsWith(query.toLowerCase()));

// 36 is the gutter the avatars sit in, so the composer lines up with both edges of the messages
export const COLUMN_WIDTH = MESSAGE_COLUMN_WIDTH + 36;

export const COMPOSER_GUTTER = { pl: 2.5, pr: { xs: 2.5, md: 4 }, pb: { xs: "max(10px, env(safe-area-inset-bottom))", md: 2 } };

export const FIELD_PILL = {
  flex: 1,
  minWidth: 0,
  borderRadius: "26px",
  bgcolor: "chat.raised",
  boxShadow: (theme) => `0 6px 24px -10px ${theme.palette.chat.shade}, 0 0 0 1px ${theme.palette.divider}`,
};

export const ROUND_BUTTON = {
  width: 48,
  height: 48,
  flexShrink: 0,
  color: "common.white",
  background: (theme) => gradientOf(theme.palette.primary.bubble),
  boxShadow: (theme) => theme.customShadows.primary,
  transition: "transform 160ms ease, filter 160ms ease",
  "&:hover": { filter: "brightness(1.08)" },
  "&:active": { transform: "scale(0.94)" },
  "&.Mui-disabled": { color: "common.white", opacity: 0.45 },
};

const ROW_PAD = 4;
const TOOL_SIZE = 40;
const TOOL_BUTTON = { width: TOOL_SIZE, height: TOOL_SIZE, color: "text.secondary" };

// the bar ends where the quick emoji was, and that spot takes the held microphone and then the send button
const RECORDING_BAR = { right: ROUND_BUTTON.width + 8 };
const MIC_TO_SEND_SPOT = ROUND_BUTTON.width / 2 + 8 + ROW_PAD + TOOL_SIZE / 2;

// the quick emoji stands on its own, so only sending gets a filled circle
const QUICK_EMOJI_BUTTON = {
  width: 48,
  height: 48,
  flexShrink: 0,
  fontSize: 30,
  transition: "transform 160ms ease",
  "&:active": { transform: "scale(0.94)" },
};

const SWAP = {
  initial: { scale: 0.4, rotate: -45, opacity: 0 },
  animate: { scale: 1, rotate: 0, opacity: 1 },
  exit: { scale: 0.4, rotate: 45, opacity: 0 },
  transition: { duration: 0.16 },
};

const Banner = ({ icon: Icon, leading, title, text, thumbnail, onClose }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.5}
    sx={{
      m: 0.75,
      mb: 0,
      px: 1.25,
      py: 0.75,
      borderLeft: 3,
      borderColor: "primary.main",
      borderRadius: 2.5,
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
    }}
  >
    {leading ?? <Icon size={18} aria-hidden />}
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="caption" component="p" sx={{ m: 0, fontWeight: 700, color: "primary.main" }}>
        {title}
      </Typography>
      <Typography variant="body2" noWrap>
        {text}
      </Typography>
    </Box>
    {thumbnail && (
      <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: 1.5, overflow: "hidden" }}>
        <MediaTile file={thumbnail} isSmall />
      </Box>
    )}
    <IconButton size="small" aria-label={`Cancel ${title.toLowerCase()}`} onClick={onClose}>
      <X size={16} />
    </IconButton>
  </Stack>
);

const Composer = () => {
  const dispatch = useDispatch();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const user = useSelector((state) => state.user.user);
  const meId = user._id;
  const {
    activeConversation: conversation,
    replyingTo,
    editing,
  } = useSelector(({ chat }) => ({ activeConversation: chat.activeConversation, replyingTo: chat.replyingTo, editing: chat.editing }), shallowEqual);
  const savedDraft = useSelector((state) => state.chat.drafts[conversation._id]);
  const [value, setValue] = useState(savedDraft ?? "");
  const [mentionIds, setMentionIds] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showsTools, setShowsTools] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  // a phone's panel waits for the keyboard to go before it shows, and goes once the keyboard is back, so the field never jumps
  const [isPanelWanted, setIsPanelWanted] = useState(false);
  const panelHeight = useRef(0);
  const keyboard = useKeyboardHeight();
  const isPanelShown = isSmallScreen && isPanelWanted && keyboard === 0;
  const keyboardBefore = useRef(keyboard);
  useEffect(() => {
    if (keyboard && !keyboardBefore.current) setIsPanelWanted(false);
    keyboardBefore.current = keyboard;
  }, [keyboard]);
  const [isSharingContact, setIsSharingContact] = useState(false);
  const [isPickingGame, setIsPickingGame] = useState(false);
  const gameSession = useSelector(selectGameSession);
  const inputRef = useRef(null);
  const fieldRef = useRef(null);
  const pendingCaret = useRef(null);
  const { noteTyping, stopTyping } = useTyping(conversation._id);
  const { noteDraft, clearDraft } = useDraft(conversation._id);

  const showsSend = Boolean(value.trim()) || Boolean(editing);
  // on a phone the tools fold away once you are writing, so the field takes the width instead
  const isCompact = isSmallScreen && (isFocused || Boolean(value)) && !showsTools;

  const suggestions =
    conversation.isGroup && mentionQuery !== null
      ? conversation.users
          .filter((member) => member._id !== meId)
          .filter((member) => isMentionMatch(member, mentionQuery))
          .slice(0, MAX_SUGGESTIONS)
      : [];

  useEffect(() => {
    if (!editing) return;
    setValue(editing.message);
    inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  const changeText = (text, caret = text.length) => {
    setValue(text);
    setMentionQuery(mentionQueryBefore(text, caret));
    setActiveSuggestion(0);
    noteTyping(text);
    if (!editing) noteDraft(text);
  };

  const insertAtCaret = (insert, replaceBefore = 0) => {
    const input = inputRef.current;
    const caret = input?.selectionStart ?? value.length;
    const text = value.slice(0, caret - replaceBefore) + insert + value.slice(input?.selectionEnd ?? caret);
    const nextCaret = caret - replaceBefore + insert.length;
    pendingCaret.current = nextCaret;
    changeText(text, nextCaret);
  };

  // the caret moves as soon as the new text is in, before another keystroke can land in the old spot
  useLayoutEffect(() => {
    if (pendingCaret.current === null) return;
    // an emoji picked from the phone's panel keeps the keyboard down
    if (!isPanelWanted) inputRef.current?.focus();
    inputRef.current?.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [value, isPanelWanted]);

  const pickMention = (person) => {
    insertAtCaret(`@${person.username} `, mentionQuery.length + 1);
    setMentionIds((ids) => [...new Set([...ids, person._id])]);
    setMentionQuery(null);
  };

  const cancelEdit = () => {
    dispatch(setEditing(null));
    setValue(savedDraft ?? "");
  };

  // holding the button grows the emoji, and it is sent at the size it reached
  const sendQuickEmoji = (emojiScale) => dispatch(SendTextMessage({ text: quickEmojiOf(conversation), emojiScale: emojiScale > 1 ? emojiScale : undefined }));

  const submit = (event) => {
    event?.preventDefault();
    const text = value.trim();
    if (!text) return;

    // a mention counts only while its name is still in the text
    const mentions = conversation.users.filter((member) => mentionIds.includes(member._id) && text.includes(`@${member.username}`)).map((member) => member._id);

    if (editing) dispatch(EditMessage({ message: editing, text, mentions }));
    else dispatch(SendTextMessage({ text, mentions }));

    stopTyping();
    setValue("");
    setMentionIds([]);
    clearDraft();
    // writing carries on where it left off, rather than the keyboard closing between messages
    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (suggestions.length) {
      const moves = { ArrowDown: 1, ArrowUp: -1 };
      if (moves[event.key]) {
        event.preventDefault();
        setActiveSuggestion((index) => (index + moves[event.key] + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        pickMention(suggestions[activeSuggestion]);
        return;
      }
    }
    if (event.key === "Escape") {
      if (mentionQuery !== null) setMentionQuery(null);
      else if (editing) cancelEdit();
      else if (replyingTo) dispatch(setReplyingTo(null));
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) submit(event);
  };

  const isReplyToSelf = replyingTo?.sender?._id === meId;
  const replyAuthor = isReplyToSelf ? "yourself" : (replyingTo?.sender?.firstName ?? "message");
  const replyPerson = isReplyToSelf ? user : replyingTo?.sender;

  const toggleEmoji = (event) => {
    if (!isSmallScreen) return setEmojiAnchor(event.currentTarget);
    if (isPanelShown) return inputRef.current?.focus();
    panelHeight.current = keyboard || lastKeyboardHeight();
    inputRef.current?.blur();
    return setIsPanelWanted(true);
  };

  const emojiButton = (
    <Tooltip title={isPanelShown ? "Keyboard" : "Emoji"}>
      <IconButton aria-label={isPanelShown ? "Keyboard" : "Emoji"} disabled={isRecording} onClick={toggleEmoji} sx={TOOL_BUTTON}>
        {isPanelShown ? <Keyboard size={22} /> : <Smiley size={22} />}
      </IconButton>
    </Tooltip>
  );

  // a chat has one game at a time, so with one open the menu brings it back into view
  const chooseGames = () => (gameSession ? dispatch(gameCollapsed(false)) : setIsPickingGame(true));

  return (
    <>
      {/* the panel stands where the keyboard was, over the gesture bar as the keyboard is, so the field keeps the gap it had above it */}
      <Box component="form" onSubmit={submit} sx={{ ...COMPOSER_GUTTER, pt: 0.5, ...(isPanelShown && { pb: "10px" }) }}>
        <Stack direction="row" alignItems="flex-end" sx={{ position: "relative", gap: 1, maxWidth: COLUMN_WIDTH, mx: "auto" }}>
          <Box sx={FIELD_PILL}>
            <Box inert={isRecording ? "" : undefined}>
              {editing && <Banner icon={PencilSimple} title="Editing" text={summaryOf(editing)} onClose={cancelEdit} />}
              {replyingTo && (
                <Banner
                  icon={ArrowBendUpLeft}
                  leading={conversation.isGroup && replyPerson ? getAvatar(replyPerson.avatar, replyPerson.firstName, 24) : undefined}
                  title={`Replying to ${replyAuthor}`}
                  text={quoteSummaryOf(replyingTo, meId)}
                  thumbnail={thumbnailFileOf(replyingTo)}
                  onClose={() => dispatch(setReplyingTo(null))}
                />
              )}
            </Box>
            <Stack direction="row" alignItems="flex-end" sx={{ minHeight: 48, px: `${ROW_PAD}px` }}>
              {!editing &&
                (isCompact ? (
                  <Tooltip title="More">
                    <IconButton aria-label="Show attach and voice" onClick={() => setShowsTools(true)} sx={{ ...TOOL_BUTTON, mb: "4px" }}>
                      <CaretRight size={22} weight="bold" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Stack direction="row" alignItems="center" sx={{ pb: "4px" }}>
                    <AttachMenu
                      disabled={isRecording}
                      buttonSx={TOOL_BUTTON}
                      onMedia={() => dispatch(ChooseAttachments("media"))}
                      onDocument={() => dispatch(ChooseAttachments("doc"))}
                      onContact={() => setIsSharingContact(true)}
                      onGames={chooseGames}
                    />
                    {!isSmallScreen && emojiButton}
                  </Stack>
                ))}
              <Box inert={isRecording ? "" : undefined} sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-end" }}>
                <InputBase
                  ref={fieldRef}
                  inputRef={inputRef}
                  value={value}
                  onChange={(event) => {
                    setShowsTools(false);
                    changeText(event.target.value, event.target.selectionStart);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    setIsFocused(true);
                    // a browser's keyboard lies over the page rather than shrinking it, so the panel goes as soon as typing starts
                    if (!isApp) setIsPanelWanted(false);
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    setShowsTools(false);
                    setMentionQuery(null);
                  }}
                  placeholder={isSmallScreen ? "Message" : "Write a message"}
                  inputProps={{ "aria-label": editing ? "Edit message" : "Message" }}
                  multiline
                  maxRows={6}
                  autoFocus={!isSmallScreen}
                  autoComplete="off"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    px: editing ? 1.5 : 0.75,
                    py: "12px",
                    fontSize: 15,
                    fontWeight: 500,
                    lineHeight: 1.45,
                    "& .MuiInputBase-input::placeholder": { color: "text.secondary", opacity: 1 },
                  }}
                />
              </Box>
              {/* a phone keeps it at the field's end whatever is typed, so the keyboard and the emoji swap in one tap */}
              {isSmallScreen && !editing && <Box sx={{ pb: "4px" }}>{emojiButton}</Box>}
              {!showsSend && (
                <VoiceRecorder
                  buttonSx={{ ...TOOL_BUTTON, mb: "4px" }}
                  sendSx={ROUND_BUTTON}
                  overlaySx={RECORDING_BAR}
                  sendSpotShift={MIC_TO_SEND_SPOT}
                  onRecordingChange={setIsRecording}
                />
              )}
            </Stack>
          </Box>

          <Box sx={{ width: 48, height: 48, flexShrink: 0 }}>
            {!isRecording && (
              <AnimatePresence mode="wait" initial={false}>
                {showsSend ? (
                  <m.div key="send" {...SWAP}>
                    <Tooltip title={editing ? "Save" : "Send"}>
                      <span>
                        <IconButton type="submit" aria-label={editing ? "Save edit" : "Send"} disabled={!value.trim()} sx={ROUND_BUTTON}>
                          <PaperPlaneTilt size={21} weight="fill" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </m.div>
                ) : (
                  <m.div key="emoji" {...SWAP}>
                    <QuickEmojiButton emoji={quickEmojiOf(conversation)} buttonSx={QUICK_EMOJI_BUTTON} onSend={sendQuickEmoji} />
                  </m.div>
                )}
              </AnimatePresence>
            )}
          </Box>
        </Stack>

        <MentionSuggestions anchorEl={fieldRef.current} people={suggestions} activeIndex={activeSuggestion} onPick={pickMention} />

        <Popover
          open={Boolean(emojiAnchor)}
          anchorEl={emojiAnchor}
          onClose={() => setEmojiAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <EmojiPicker onSelect={(emoji) => insertAtCaret(emoji)} />
        </Popover>

        {isSharingContact && <ShareContactDialog open onClose={() => setIsSharingContact(false)} />}
        {isPickingGame && <GamesDialog conversation={conversation} onClose={() => setIsPickingGame(false)} />}
      </Box>
      {isPanelShown && <EmojiPanel baseHeight={panelHeight.current} onSelect={(emoji) => insertAtCaret(emoji)} onClose={() => setIsPanelWanted(false)} />}
    </>
  );
};

export default Composer;
