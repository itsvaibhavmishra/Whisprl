import { useEffect, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import useIsLoading from "@/hooks/useIsLoading";
import { CloseConversation, CreateOpenConversation, OpenConversation } from "@/redux/slices/actions/chatActions";
import { PATH_DASHBOARD } from "@/routes/paths";
import { isDeleted } from "@/utils/chats";
import { notify } from "@/utils/notify";

export const DETAILS_BUTTON_ID = "chat-details-button";

// an opaque id rather than a username, so a friend's handle never sits in the browser's history
export const chatPath = (conversationId, isInfo = false) => {
  if (!conversationId) return PATH_DASHBOARD.general.chat;
  return `${PATH_DASHBOARD.general.chat}/${conversationId}${isInfo ? "/info" : ""}`;
};

export const useChatAddress = () => {
  const { "*": rest = "" } = useParams();
  const [chatId, section] = rest.split("/");
  return { chatId: chatId || null, isInfo: section === "info" };
};

// closing steps back through history when it can, or the phone's Back button would reopen what was just closed
const useStepBack = (flag, fallback) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  return () => (state?.[flag] ? navigate(-1) : navigate(fallback, { replace: true }));
};

export const useCloseChat = () => useStepBack("isFromList", chatPath(null));

export const useDetailsToggle = () => {
  const navigate = useNavigate();
  const { chatId, isInfo } = useChatAddress();
  const stepBack = useStepBack("isFromChat", chatPath(chatId));

  const close = () => {
    stepBack();
    requestAnimationFrame(() => document.getElementById(DETAILS_BUTTON_ID)?.focus());
  };
  const open = () => navigate(chatPath(chatId, true), { state: { isFromChat: true } });
  return { isInfo, open, close, toggle: () => (isInfo ? close() : open()) };
};

export const useChatRouteSync = () => {
  const dispatch = useDispatch();
  const store = useStore();
  const navigate = useNavigate();
  const { chatId } = useChatAddress();
  const hasLoadedConversations = useSelector((state) => state.chat.hasLoadedConversations);
  const hasConversationsFailed = useSelector((state) => state.chat.hasConversationsFailed);
  const activeId = useSelector((state) => state.chat.activeConversation?._id ?? null);
  // starting a chat closes the open one first, which is no reason to leave its address
  const isStartingChat = useIsLoading(CreateOpenConversation);
  // what each effect saw last, so it can tell a mount from an address or chat that just changed
  const previous = useRef({ chatId, activeId });

  useEffect(() => {
    const { conversations, activeConversation } = store.getState().chat;
    const openId = activeConversation?._id ?? null;
    const hadChatId = previous.current.chatId;
    previous.current.chatId = chatId;
    if (!chatId) {
      if (hadChatId && openId) dispatch(CloseConversation());
      return;
    }
    // a chat just opened from elsewhere is the effect below's to follow, not this one's to swap back
    if (chatId === openId || isStartingChat || openId !== previous.current.activeId) return;
    if (!hasLoadedConversations) {
      if (hasConversationsFailed) navigate(chatPath(null), { replace: true });
      return;
    }
    const conversation = conversations.find((candidate) => candidate._id === chatId && !isDeleted(candidate));
    if (conversation) {
      dispatch(OpenConversation(conversation));
      return;
    }
    notify({ severity: "info", message: "That chat isn't in your list any more" });
    navigate(chatPath(null), { replace: true });
  }, [chatId, hasLoadedConversations, hasConversationsFailed, isStartingChat, store, dispatch, navigate]);

  useEffect(() => {
    const wasOpen = previous.current.activeId;
    previous.current.activeId = activeId;
    const isMounting = wasOpen === activeId;
    if (activeId && activeId !== chatId) {
      // the address already asks for another chat, which the effect above is opening
      if (isMounting && chatId) return;
      navigate(chatPath(activeId), { replace: isMounting, state: { isFromList: !chatId && !isMounting } });
    } else if (!activeId && wasOpen && chatId === wasOpen && !isStartingChat) navigate(chatPath(null), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);
};
