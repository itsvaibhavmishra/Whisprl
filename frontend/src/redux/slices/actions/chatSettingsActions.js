import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import { GetConversations, conversationById } from "@/redux/slices/actions/chatActions";
import { chatCleared, disappearingChanged, preferencesChanged } from "@/redux/slices/chatSlice";
import axios from "@/utils/axios";

const HOUR_MS = 60 * 60 * 1000;
const MUTE_LENGTHS = { "8h": 8 * HOUR_MS, "1w": 7 * 24 * HOUR_MS };
const MUTED_FOREVER = "9999-12-31T00:00:00.000Z";

const mutedUntilFor = (mute) => {
  if (mute === "off") return null;
  return mute === "always" ? MUTED_FOREVER : new Date(Date.now() + MUTE_LENGTHS[mute]).toISOString();
};

// what the screen shows until the server answers with the real values, mute sent as a choice and kept as a time
const shownAs = ({ mute, ...changes }) => (mute === undefined ? changes : { ...changes, mutedUntil: mutedUntilFor(mute) });

// shown at once and put back if the server refuses, so a tap never waits on the network
export const UpdateChatPreferences = createApiThunk("chat/preferences", async ({ conversationId, ...changes }, { dispatch, getState }) => {
  const shown = shownAs(changes);
  const conversation = conversationById(getState(), conversationId);
  const before = Object.fromEntries(Object.keys(shown).map((key) => [key, conversation?.[key] ?? null]));
  dispatch(preferencesChanged({ conversation_id: conversationId, ...shown }));
  try {
    const { data } = await axios.patch(`/conversation/${conversationId}/preferences`, changes);
    dispatch(preferencesChanged({ conversation_id: conversationId, ...data.preferences }));
  } catch (error) {
    dispatch(preferencesChanged({ conversation_id: conversationId, ...before }));
    throw error;
  }
});

export const ClearChat = createApiThunk("chat/clear", async (conversationId, { dispatch }) => {
  const { data } = await axios.post(`/conversation/${conversationId}/clear`);
  dispatch(chatCleared({ conversation_id: conversationId, ...data.preferences }));
});

export const DeleteChat = createApiThunk("chat/delete", async (conversationId, { dispatch }) => {
  const { data } = await axios.post(`/conversation/${conversationId}/delete`);
  dispatch(chatCleared({ conversation_id: conversationId, ...data.preferences }));
});

export const SetDisappearing = createApiThunk("chat/disappearing", async ({ conversationId, seconds }, { dispatch }) => {
  await axios.put(`/conversation/${conversationId}/disappearing`, { seconds });
  dispatch(disappearingChanged({ conversation_id: conversationId, disappearAfter: seconds }));
});

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

export const GetBlocked = createApiThunk("user/blocked", async () => (await axios.get("/user/blocked")).data.blocked, { notifyErrors: false });

export const ReportChat = createApiThunk("user/report", async ({ conversationId, userId, reason, note, evidence }) => {
  await axios.post("/user/report", { conversation_id: conversationId, user_id: userId, reason, note, evidence });
});
