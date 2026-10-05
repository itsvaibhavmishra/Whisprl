import mongoose from "mongoose";

const conversationSchema = mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },

    picture: { type: String },

    isGroup: { type: Boolean, required: true, default: false },

    users: [{ type: mongoose.Schema.ObjectId, ref: "User" }],

    latestMessage: { type: mongoose.Schema.ObjectId, ref: "Message" },

    admin: { type: mongoose.Schema.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ users: 1, updatedAt: -1 });

// creating model for schema
const ConversationModel = mongoose.model("Conversation", conversationSchema);

export default ConversationModel;
