import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const PASSWORD_COST = 12;

const publicKeySchema = mongoose.Schema(
  {
    keyId: { type: String, required: true },
    publicKey: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const keyBackupSchema = mongoose.Schema(
  {
    keyId: { type: String, required: true },
    iv: { type: String, required: true },
    data: { type: String, required: true },
  },
  { _id: false }
);

const verificationSchema = mongoose.Schema(
  {
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const passwordResetSchema = mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, required: true },
  },
  { _id: false }
);

const userSchema = mongoose.Schema(
  {
    firstName: { type: String, required: [true, "First Name is required"] },
    lastName: { type: String, required: [true, "Last Name is required"] },
    avatar: { type: String },
    cover: { type: String, default: "" },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid Email"],
    },
    activityStatus: {
      type: String,
      default: "Hey There! I ❤️ Using Whisprl 😸",
    },
    onlineStatus: {
      type: String,
      default: "offline",
      enum: ["online", "offline"],
    },

    // accounts made through Google, GitHub or LinkedIn have none until they reset one
    password: { type: String, select: false },
    passwordChangedAt: { type: Date },

    verified: { type: Boolean, default: false },
    verification: { type: verificationSchema, select: false },
    passwordReset: { type: passwordResetSchema, select: false },

    friends: [{ type: mongoose.Schema.ObjectId, ref: "User" }],

    socialsConnected: {
      type: [String],
      enum: ["google", "github", "linkedin"],
    },

    quickReactions: { type: [String], default: undefined },

    // End-to-end encryption: every public key the account has had, newest last
    publicKeys: [publicKeySchema],
    keyBackup: { type: keyBackupSchema, select: false },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, PASSWORD_COST);
    // a second early, so a token issued right after the change still counts as newer than it
    if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  }

  // everyone is their own friend, which is what lets them message themselves
  if (this.friends.length === 0) this.friends.push(this._id);
});

userSchema.methods.correctPassword = async function (candidatePassword) {
  return Boolean(this.password) && bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (tokenIssuedAt) {
  return Boolean(this.passwordChangedAt) && tokenIssuedAt < Math.floor(this.passwordChangedAt.getTime() / 1000);
};

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
