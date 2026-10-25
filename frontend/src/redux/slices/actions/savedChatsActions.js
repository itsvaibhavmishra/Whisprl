import { savedChatsDropped, savedChatsRestored } from "@/redux/slices/chatSlice";
import { takeArrivedMessages } from "@/utils/arrivedMessages";
import { forgetChats, readSavedChats, restoredFrom, withArrivals } from "@/utils/savedChats";

export const RestoreSavedChats = () => async (dispatch, getState) => {
  const userId = getState().user.user._id;
  const [snapshot, arrivals] = await Promise.all([readSavedChats(userId).catch(() => null), takeArrivedMessages(userId).catch(() => [])]);
  if (snapshot) dispatch(savedChatsRestored(restoredFrom(withArrivals(snapshot, arrivals))));
};

// chats saved under keys this device no longer holds are neither shown nor kept
export const DropSavedChats = () => async (dispatch, getState) => {
  dispatch(savedChatsDropped());
  await forgetChats(getState().user.user._id).catch(() => {});
};
