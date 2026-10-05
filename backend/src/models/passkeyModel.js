import mongoose from "mongoose";

const keyBackupSchema = mongoose.Schema(
  {
    keyId: { type: String, required: true },
    iv: { type: String, required: true },
    data: { type: String, required: true },
  },
  { _id: false }
);

const passkeySchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },

    credentialId: { type: String, required: true, unique: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    transports: [String],
    backedUp: { type: Boolean, default: false },
    lastUsedAt: { type: Date },

    // the account's private key, locked with a secret only this passkey can produce
    keyBackup: { type: keyBackupSchema, select: false },
  },
  {
    timestamps: true,
  }
);

const PasskeyModel = mongoose.model("Passkey", passkeySchema);

export default PasskeyModel;
