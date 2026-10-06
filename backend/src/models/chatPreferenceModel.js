import mongoose from "mongoose";

// what one person chose for one chat, kept apart from the conversation so no other member ever receives it
const chatPreferenceSchema = mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  conversation: { type: mongoose.Schema.ObjectId, ref: "Conversation", required: true },
  mutedUntil: { type: Date },
  isFavourite: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  clearedAt: { type: Date },
});

chatPreferenceSchema.index({ user: 1, conversation: 1 }, { unique: true });

const ChatPreferenceModel = mongoose.model("ChatPreference", chatPreferenceSchema);

export default ChatPreferenceModel;
