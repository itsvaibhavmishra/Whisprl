import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box, IconButton, Popover, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowBendUpLeft, PaperPlaneTilt, PencilSimple, Smiley, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import EmojiPicker from "@/components/EmojiPicker";
import { ChooseAttachments } from "@/redux/slices/actions/attachmentActions";
import { SendTextMessage } from "@/redux/slices/actions/chatActions";
import { EditMessage } from "@/redux/slices/actions/messageActions";
import { setDraft, setEditing, setReplyingTo } from "@/redux/slices/chatSlice";
import AttachMenu from "@/sections/chat/conversation/AttachMenu";
import MentionSuggestions from "@/sections/chat/conversation/MentionSuggestions";
import ShareContactDialog from "@/sections/chat/conversation/ShareContactDialog";
import { useTyping } from "@/sections/chat/conversation/useTyping";
import getAvatar from "@/utils/createAvatar";
import { summaryOf } from "@/utils/messageSummary";

const MAX_SUGGESTIONS = 6;

const mentionQueryBefore = (text, caret) => text.slice(0, caret).match(/(?:^|\s)@([^\s@]*)$/)?.[1] ?? null;

const Banner = ({ icon: Icon, leading, title, text, onClose }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.5}
    sx={{
      mb: 1,
      px: 1.5,
      py: 0.75,
      borderLeft: 3,
      borderColor: "primary.main",
      borderRadius: 1.5,
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
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
    <IconButton size="small" aria-label={`Cancel ${title.toLowerCase()}`} onClick={onClose}>
      <X size={16} />
    </IconButton>
  </Stack>
);

const Composer = () => {
  const dispatch = useDispatch();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const theme = useTheme();
  const user = useSelector((state) => state.user.user);
  const meId = user._id;
  const { activeConversation: conversation, replyingTo, editing, drafts } = useSelector((state) => state.chat);
  const [value, setValue] = useState(drafts[conversation._id] ?? "");
  const [mentionIds, setMentionIds] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [isSharingContact, setIsSharingContact] = useState(false);
  const inputRef = useRef(null);
  const fieldRef = useRef(null);
  const pendingCaret = useRef(null);
  const { noteDraft, stopTyping } = useTyping(conversation._id);

  const suggestions =
    conversation.isGroup && mentionQuery !== null
      ? conversation.users
          .filter((member) => member._id !== meId)
          .filter((member) => `${member.firstName} ${member.lastName}`.toLowerCase().startsWith(mentionQuery.toLowerCase()))
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
    noteDraft(text);
    if (!editing) dispatch(setDraft({ conversationId: conversation._id, text }));
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
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [value]);

  const pickMention = (person) => {
    insertAtCaret(`@${person.firstName} `, mentionQuery.length + 1);
    setMentionIds((ids) => [...new Set([...ids, person._id])]);
    setMentionQuery(null);
  };

  const cancelEdit = () => {
    dispatch(setEditing(null));
    setValue(drafts[conversation._id] ?? "");
  };

  const submit = (event) => {
    event?.preventDefault();
    const text = value.trim();
    if (!text) return;

    // a mention counts only while its name is still in the text
    const mentions = conversation.users
      .filter((member) => mentionIds.includes(member._id) && text.includes(`@${member.firstName}`))
      .map((member) => member._id);

    if (editing) dispatch(EditMessage({ message: editing, text, mentions }));
    else dispatch(SendTextMessage({ text, mentions }));

    stopTyping();
    setValue("");
    setMentionIds([]);
    dispatch(setDraft({ conversationId: conversation._id, text: "" }));
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
  const replyAuthor = isReplyToSelf ? "yourself" : replyingTo?.sender?.firstName ?? "message";
  const replyPerson = isReplyToSelf ? user : replyingTo?.sender;

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{ px: { xs: 1, md: 2 }, py: 1.25, bgcolor: "background.default", borderTop: 1, borderColor: "divider" }}
    >
      {editing && <Banner icon={PencilSimple} title="Editing" text={summaryOf(editing)} onClose={cancelEdit} />}
      {replyingTo && (
        <Banner
          icon={ArrowBendUpLeft}
          leading={conversation.isGroup && replyPerson && getAvatar(replyPerson.avatar, replyPerson.firstName, theme, 24)}
          title={`Replying to ${replyAuthor}`}
          text={summaryOf(replyingTo)}
          onClose={() => dispatch(setReplyingTo(null))}
        />
      )}

      <Stack direction="row" alignItems="flex-end" spacing={{ xs: 0.5, md: 1 }}>
        {!editing && (
          <Box sx={{ pb: 0.5 }}>
            <AttachMenu
              onMedia={() => dispatch(ChooseAttachments("media"))}
              onDocument={() => dispatch(ChooseAttachments("doc"))}
              onContact={() => setIsSharingContact(true)}
            />
          </Box>
        )}

        <TextField
          ref={fieldRef}
          inputRef={inputRef}
          value={value}
          onChange={(event) => changeText(event.target.value, event.target.selectionStart)}
          onKeyDown={handleKeyDown}
          onBlur={() => setMentionQuery(null)}
          placeholder={isSmallScreen ? "Message" : "Write a message"}
          inputProps={{ "aria-label": editing ? "Edit message" : "Message" }}
          multiline
          maxRows={5}
          fullWidth
          autoFocus={!isSmallScreen}
          autoComplete="off"
          InputProps={{
            sx: { borderRadius: 3, bgcolor: "background.paper", py: 1.1, "& fieldset": { borderColor: "divider" } },
            endAdornment: (
              <Tooltip title="Emoji">
                <IconButton
                  aria-label="Emoji"
                  size="small"
                  onClick={(event) => setEmojiAnchor(event.currentTarget)}
                  sx={{ alignSelf: "flex-end", mb: -0.25 }}
                >
                  <Smiley size={22} />
                </IconButton>
              </Tooltip>
            ),
          }}
        />

        <Tooltip title={editing ? "Save" : "Send"}>
          <span>
            <IconButton
              type="submit"
              aria-label={editing ? "Save edit" : "Send"}
              disabled={!value.trim()}
              sx={{
                width: 46,
                height: 46,
                mb: 0.25,
                color: "common.white",
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
                "&.Mui-disabled": { color: "common.white", bgcolor: "primary.main", opacity: 0.45 },
              }}
            >
              <PaperPlaneTilt size={20} weight="fill" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <MentionSuggestions anchorEl={fieldRef.current} people={suggestions} activeIndex={activeSuggestion} onPick={pickMention} />

      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <EmojiPicker onSelect={(emoji) => insertAtCaret(emoji)} />
      </Popover>

      {isSharingContact && <ShareContactDialog open onClose={() => setIsSharingContact(false)} />}
    </Box>
  );
};

export default Composer;
