import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useStore } from "react-redux";

import { saveChats, snapshotOf } from "@/utils/savedChats";

const SAVE_AFTER_MS = 1500;

const isSameChats = (one, other) =>
  one.conversations === other.conversations && one.cache === other.cache && one.messages === other.messages && one.albumReactions === other.albumReactions;

// saved once the chats settle after a change, and at once when the app is left, since the phone may end it in the background
const useSavedChats = (userId) => {
  const store = useStore();

  useEffect(() => {
    if (!userId) return undefined;
    let timer = null;
    let seen = store.getState().chat;

    const save = () => {
      clearTimeout(timer);
      timer = null;
      const { chat, encryption } = store.getState();
      // only chats this device can read are worth keeping
      if (chat.hasLoadedConversations && encryption.status === "ready") saveChats(userId, snapshotOf(chat)).catch(() => {});
    };

    const unsubscribe = store.subscribe(() => {
      const { chat } = store.getState();
      if (isSameChats(chat, seen)) return;
      seen = chat;
      clearTimeout(timer);
      timer = setTimeout(save, SAVE_AFTER_MS);
    });
    const leaving = App.addListener("pause", () => {
      if (timer) save();
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
      leaving.then((listener) => listener.remove());
    };
  }, [store, userId]);
};

export default useSavedChats;
