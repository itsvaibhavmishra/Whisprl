import { savedChatsDropped, savedChatsRestored } from "@/redux/slices/chatSlice";
import { forgetChats, readSavedChats, restoredFrom } from "@/utils/savedChats";

export const RestoreSavedChats = () => async (dispatch, getState) => {
  const snapshot = await readSavedChats(getState().user.user._id).catch(() => null);
  if (snapshot) dispatch(savedChatsRestored(restoredFrom(snapshot)));
};

// chats saved under keys this device no longer holds are neither shown nor kept
export const DropSavedChats = () => async (dispatch, getState) => {
  dispatch(savedChatsDropped());
  await forgetChats(getState().user.user._id).catch(() => {});
};
