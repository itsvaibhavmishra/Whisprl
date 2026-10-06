import mongoose from "mongoose";

const conversationSchema = mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },

    picture: { type: String },

    isGroup: { type: Boolean, required: true, default: false },

    users: [{ type: mongoose.Schema.ObjectId, ref: "User" }],

    latestMessage: { type: mongoose.Schema.ObjectId, ref: "Message" },

    owner: { type: mongoose.Schema.ObjectId, ref: "User" },
    admins: [{ type: mongoose.Schema.ObjectId, ref: "User" }],

    // people who left, kept so their keys still open the messages they sent while they were in
    formerUsers: [{ type: mongoose.Schema.ObjectId, ref: "User" }],

    joinedAt: { type: Map, of: Date },

    lastSeen: { type: Map, of: mongoose.Schema.ObjectId },

    // seconds a new message lives for, set by either person in a direct chat or a manager in a group
    disappearAfter: { type: Number },

    pins: [
      {
        _id: false,
        message: { type: mongoose.Schema.ObjectId, ref: "Message", required: true },
        by: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ users: 1, updatedAt: -1 });

// creating model for schema
const ConversationModel = mongoose.model("Conversation", conversationSchema);

export default ConversationModel;
