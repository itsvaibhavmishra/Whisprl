import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { StartTyping, StopTyping } from "@/redux/slices/actions/chatActions";

const TYPING_PAUSE = 5000;

// typing starts on the first keystroke, lasts through a short pause, and ends at once on sending or leaving the chat
export const useTyping = (conversationId) => {
  const dispatch = useDispatch();
  const isTyping = useRef(false);
  const timer = useRef(null);

  const stopTyping = () => {
    clearTimeout(timer.current);
    if (!isTyping.current) return;
    isTyping.current = false;
    dispatch(StopTyping(conversationId));
  };

  const noteDraft = (text) => {
    if (!text.trim()) return stopTyping();
    if (!isTyping.current) {
      isTyping.current = true;
      dispatch(StartTyping(conversationId));
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(stopTyping, TYPING_PAUSE);
  };

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (isTyping.current) dispatch(StopTyping(conversationId));
    },
    [conversationId, dispatch]
  );

  return { noteDraft, stopTyping };
};
