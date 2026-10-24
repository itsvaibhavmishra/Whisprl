import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

import { COVER_PALETTES, COVER_PATTERNS } from "#src/utils/coverStyles.js";

const PASSWORD_COST = 12;

// the owner is not stored: it is whichever account OWNER_EMAIL names
const ROLES = ["user", "admin"];
export const PERMISSIONS = ["overview", "people", "reports", "requests", "suspend", "ban", "audit"];

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

const coverStyleSchema = mongoose.Schema(
  {
    pattern: { type: String, enum: COVER_PATTERNS, required: true },
    palette: { type: String, enum: COVER_PALETTES, required: true },
  },
  { _id: false }
);

const skippedStepSchema = mongoose.Schema({ version: { type: Number, required: true }, at: { type: Date, required: true } }, { _id: false });

const birthdaySchema = mongoose.Schema(
  {
    day: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  { _id: false }
);

export const DELETION_REASONS = ["not-using", "privacy", "unwanted-contact", "another-account", "not-working", "other"];

const deletionSchema = mongoose.Schema(
  {
    requestedAt: { type: Date, required: true },
    dueAt: { type: Date, required: true },
    reason: { type: String, enum: DELETION_REASONS, required: true },
    note: { type: String },
  },
  { _id: false }
);

export const HIDDEN_PROFILE_FIELDS = ["firstName", "lastName", "username", "avatar", "cover", "activityStatus"];

const profileSchema = mongoose.Schema(
  { firstName: String, lastName: String, username: String, avatar: String, cover: String, activityStatus: String },
  { _id: false }
);

const userSchema = mongoose.Schema(
  {
    firstName: { type: String, required: [true, "First Name is required"] },
    lastName: { type: String, required: [true, "Last Name is required"] },
    username: { type: String, unique: true, sparse: true },
    usernameChangedAt: { type: Date },
    usernameConfirmedAt: { type: Date },
    avatar: { type: String },
    cover: { type: String, default: "" },
    // the doodle drawn when there is no cover photo, or once it is removed
    coverStyle: { type: coverStyleSchema },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid Email"],
    },
    activityStatus: { type: String, default: "" },
    // friends see the day and month, and the year only proves someone is old enough for Whisprl
    birthday: { type: birthdaySchema },
    showBirthdayToFriends: { type: Boolean, default: true },
    onlineStatus: {
      type: String,
      default: "offline",
      enum: ["online", "offline"],
    },

    // accounts made through Google, GitHub or LinkedIn have none until they reset one
    password: { type: String, select: false },

    verified: { type: Boolean, default: false },
    role: { type: String, enum: ROLES, default: "user" },
    permissions: { type: [String], enum: PERMISSIONS, default: undefined },

    bannedAt: { type: Date },
    suspendedUntil: { type: Date },
    // what a ban or a pending deletion replaced, so staff can still tell who it is and showing it again puts it all back
    hiddenProfile: { type: profileSchema, select: false },
    verification: { type: verificationSchema, select: false },
    passwordReset: { type: passwordResetSchema, select: false },
    deletionCode: { type: verificationSchema, select: false },

    // kept once the account is gone, as the only record of why people leave
    deletion: { type: deletionSchema },
    deletedAt: { type: Date },

    friends: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    blocked: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    statusHiddenFrom: [{ type: mongoose.Schema.ObjectId, ref: "User" }],

    suggestToFriendsOfFriends: { type: Boolean, default: true },
    // hidden by hand, or ended with a decline or an unfriend, so they are never suggested again
    dismissedSuggestions: [{ type: mongoose.Schema.ObjectId, ref: "User" }],

    socialsConnected: {
      type: [String],
      enum: ["google", "github", "linkedin"],
    },

    quickReactions: { type: [String], default: undefined },

    // the sound and music levels each game was last set to, by game id
    gameAudio: { type: Map, of: mongoose.Schema.Types.Mixed },

    // set only when an account is made, so every account from before setup existed counts as returning
    isNewAccount: { type: Boolean, default: false },
    agePausedUntil: { type: Date },
    skippedSteps: { type: Map, of: skippedStepSchema, default: undefined },

    // the browser holds the permission itself, so this only records that the account has turned them on once
    notificationsAllowedAt: { type: Date },

    // End-to-end encryption: every public key the account has had, newest last
    publicKeys: [publicKeySchema],
    keyBackup: { type: keyBackupSchema, select: false },
    recoveryKeySavedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ "deletion.dueAt": 1 }, { sparse: true });

// every stored password was trimmed before hashing, so each one typed is trimmed the same way to match
userSchema.pre("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password.trim(), PASSWORD_COST);
  }

  // everyone is their own friend, which is what lets them message themselves
  if (this.friends.length === 0) this.friends.push(this._id);
});

userSchema.methods.correctPassword = async function (candidatePassword) {
  return Boolean(this.password) && bcrypt.compare(candidatePassword.trim(), this.password);
};

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
