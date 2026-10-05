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
    sender: { type: mongoose.Schema.ObjectId, ref: "User", required: true },

    // made by the sender's browser, so a resend after a lost acknowledgement finds the saved copy
    clientId: { type: String },

    message: { type: String, trim: true },

    cipher: { type: cipherSchema, default: undefined },

    // sealed to the sender alone until the recipient has a key, then re-encrypted by the sender's browser
    awaitingKey: { type: Boolean },

    deliveredAt: { type: Date },
    seenAt: { type: Date },

    conversation: { type: mongoose.Schema.ObjectId, ref: "Conversation", required: true },

    files: [fileSchema],

    // images sent together share a batchId, so they render as one group
    batchId: { type: String },
    batchIndex: { type: Number },
    batchTotal: { type: Number },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, _id: 1 });
messageSchema.index({ sender: 1, clientId: 1 }, { unique: true, partialFilterExpression: { clientId: { $type: "string" } } });
messageSchema.index({ sender: 1 }, { partialFilterExpression: { awaitingKey: true } });

// creating model for schema
const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;
