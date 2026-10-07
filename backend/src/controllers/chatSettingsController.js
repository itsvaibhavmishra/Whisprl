import { clearChat, deleteChat, updatePreferences } from "#src/services/chatPreferenceService.js";
import { findMemberConversation, memberRooms } from "#src/services/conversationService.js";
import { setDisappearing } from "#src/services/disappearingService.js";

// only this person's other tabs hear about it, since nobody else's chat changes
const answerPreferences = (req, res, event, conversation_id, preferences) => {
  req.app.get("io").to(String(req.user._id)).emit(event, { conversation_id, ...preferences });
  res.status(200).json({ status: "success", preferences });
};

// -------------------------- Mute, Favourite, Archive --------------------------
export const updateChatPreferences = async (req, res, next) => {
  try {
    const conversation = await findMemberConversation(req.params.convo_id, req.user._id);
    answerPreferences(req, res, "chat_preferences", conversation._id, await updatePreferences(req.user._id, conversation._id, req.body));
  } catch (error) {
    next(error);
  }
};

// -------------------------- Clear Chat --------------------------
export const clearConversation = async (req, res, next) => {
  try {
    const conversation = await findMemberConversation(req.params.convo_id, req.user._id);
    answerPreferences(req, res, "chat_cleared", conversation._id, await clearChat(req.user._id, conversation._id));
  } catch (error) {
    next(error);
  }
};

// -------------------------- Delete Chat --------------------------
export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await findMemberConversation(req.params.convo_id, req.user._id);
    answerPreferences(req, res, "chat_cleared", conversation._id, await deleteChat(req.user._id, conversation));
  } catch (error) {
    next(error);
  }
};

// -------------------------- Disappearing Messages --------------------------
export const updateDisappearing = async (req, res, next) => {
  try {
    const { conversation, event } = await setDisappearing(req.params.convo_id, req.user._id, req.body.seconds ?? null);
    if (event) {
      const io = req.app.get("io");
      const rooms = memberRooms(conversation);
      io.to(rooms).emit("disappearing_changed", { conversation_id: conversation._id, disappearAfter: conversation.disappearAfter ?? null });
      io.to(rooms).emit("message_received", event);
    }
    res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};
