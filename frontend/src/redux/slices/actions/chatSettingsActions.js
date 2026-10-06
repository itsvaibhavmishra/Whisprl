import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import { GetConversations } from "@/redux/slices/actions/chatActions";
import { chatCleared, disappearingChanged, preferencesChanged } from "@/redux/slices/chatSlice";
import axios from "@/utils/axios";

// ------------- Mute, Favourite, Archive -------------
export const UpdateChatPreferences = createApiThunk(
  "chat/preferences",
  async ({ conversationId, ...changes }, { dispatch }) => {
    const { data } = await axios.patch(`/conversation/${conversationId}/preferences`, changes);
    dispatch(preferencesChanged({ conversation_id: conversationId, ...data.preferences }));
  }
);

// ------------- Clear Chat -------------
export const ClearChat = createApiThunk("chat/clear", async (conversationId, { dispatch }) => {
  const { data } = await axios.post(`/conversation/${conversationId}/clear`);
  dispatch(chatCleared({ conversation_id: conversationId, ...data.preferences }));
});

// ------------- Disappearing Messages -------------
export const SetDisappearing = createApiThunk("chat/disappearing", async ({ conversationId, seconds }, { dispatch }) => {
  await axios.put(`/conversation/${conversationId}/disappearing`, { seconds });
  dispatch(disappearingChanged({ conversation_id: conversationId, disappearAfter: seconds }));
});

// ------------- Block -------------
// the chat list works out again who can still be messaged
export const BlockUser = createApiThunk("user/block", async (person, { dispatch }) => {
  const { data } = await axios.put(`/user/blocked/${person._id}`);
  dispatch(GetConversations());
  return data.blocked;
});

export const UnblockUser = createApiThunk("user/unblock", async (userId, { dispatch }) => {
  await axios.delete(`/user/blocked/${userId}`);
  dispatch(GetConversations());
  return userId;
});

export const GetBlocked = createApiThunk("user/blocked", async () => (await axios.get("/user/blocked")).data.blocked);

// ------------- Report -------------
export const ReportChat = createApiThunk("user/report", async ({ conversationId, userId, reason, note }) => {
  await axios.post("/user/report", { conversation_id: conversationId, user_id: userId, reason, note });
});
