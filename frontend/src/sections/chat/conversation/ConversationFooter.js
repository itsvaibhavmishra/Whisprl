import { useRef, useState, useEffect } from "react";
import { Box, Stack, IconButton, useTheme, Grow } from "@mui/material";
import { PaperPlaneTilt } from "phosphor-react";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// redux imports
import { useDispatch } from "react-redux";
import { SendTextMessage } from "@/redux/slices/actions/chatActions";

import ChatInput from "@/sections/chat/conversation/ChatInput";

const ConversationFooter = ({ convo_id }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [value, setValue] = useState("");
  const [openPicker, setOpenPicker] = useState(false);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  const handleEmojiClick = (emoji) => {
    const input = inputRef.current;

    if (input) {
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;

      setValue(
        value.substring(0, selectionStart) +
          emoji +
          value.substring(selectionEnd)
      );

      // Move the cursor to the end of the inserted emoji with a slight delay
      setTimeout(() => {
        const newPosition = selectionStart + emoji.length;
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const handleClickOutsidePicker = (event) => {
    if (pickerRef.current && !pickerRef.current.contains(event.target)) {
      setOpenPicker(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!value.trim()) return;

    const text = value;
    setValue("");
    const result = await dispatch(SendTextMessage(text));
    if (SendTextMessage.rejected.match(result)) setValue((typed) => typed || text);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutsidePicker);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsidePicker);
    };
  }, []);

  return (
    <Box
      py={2}
      px={3}
      width={"100%"}
      sx={{
        position: "sticky",
        backgroundColor: theme.palette.background.default,
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack direction="row" alignItems={"center"} spacing={2}>
          <Stack sx={{ width: "100%" }}>
            <Grow in={openPicker}>
              <Box
                ref={pickerRef}
                sx={{
                  zIndex: 10,
                  position: "fixed",
                  bottom: { xs: 80, md: 65 },
                  right: { xs: 15, sm: 80, md: 100 },
                }}
              >
                <Picker
                  perLine={8}
                  autoFocus={true}
                  theme={theme.palette.mode}
                  data={data}
                  onEmojiSelect={(emoji) => {
                    handleEmojiClick(emoji.native);
                  }}
                />
              </Box>
            </Grow>
            {/* Chat Input */}
            <ChatInput
              openPicker={openPicker}
              setOpenPicker={setOpenPicker}
              inputRef={inputRef}
              value={value}
              setValue={setValue}
              handleSubmit={handleSubmit}
              theme={theme}
              convo_id={convo_id}
            />
          </Stack>

          <IconButton
            type="submit"
            sx={{
              height: 40,
              width: 40,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 20,
            }}
          >
            <PaperPlaneTilt color="#ffffff" size={20} />
          </IconButton>
        </Stack>
      </form>
    </Box>
  );
};

export default ConversationFooter;
