import mongoose from "mongoose";

const fileSchema = mongoose.Schema(
  {
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ["image", "document"], required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const cipherSchema = mongoose.Schema(
  {
    iv: { type: String, required: true },
    data: { type: String, required: true },
    keyIds: { type: [String], required: true },
  },
  { _id: false }
);

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.ObjectId, ref: "User" },

    message: { type: String, trim: true },

    cipher: { type: cipherSchema, default: undefined },

    // sealed to the sender alone until the recipient has a key, then re-encrypted by the sender's browser
    awaitingKey: { type: Boolean },

    deliveredAt: { type: Date },
    seenAt: { type: Date },

    conversation: { type: mongoose.Schema.ObjectId, ref: "Conversation" },

    files: [fileSchema],

    // batch fields — images sent together share a batchId for grouping
    batchId: { type: String },
    batchIndex: { type: Number },
    batchTotal: { type: Number },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ sender: 1 }, { partialFilterExpression: { awaitingKey: true } });

// creating model for schema
const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;
