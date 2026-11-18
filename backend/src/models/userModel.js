import mongoose from "mongoose";
import validator from "validator";

import { GENDERS } from "#src/utils/accountRules.js";
import { COVER_PALETTES, COVER_PATTERNS } from "#src/utils/coverStyles.js";

// the owner is not stored: it is whichever account OWNER_EMAIL names
const ROLES = ["user", "admin"];
export const PERMISSIONS = ["overview", "people", "reports", "requests", "suspend", "ban", "audit", "announce"];
const TAGS = ["owner", "admin", "official"];

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

const knownDeviceSchema = mongoose.Schema(
  {
    hash: { type: String, required: true },
    seenAt: { type: Date, required: true },
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

const journeySchema = mongoose.Schema(
  {
    startedAt: { type: Date, required: true },
    via: { type: String, enum: ["email", "google", "github", "linkedin"], required: true },
    verifiedAt: { type: Date },
    birthdayAt: { type: Date },
    usernameAt: { type: Date },
    recoveryKeyAt: { type: Date },
    firstFriendAt: { type: Date },
    firstMessageAt: { type: Date },
  },
  { _id: false }
);

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

export const HIDDEN_PROFILE_FIELDS = ["name", "username", "avatar", "cover", "activityStatus"];

const profileSchema = mongoose.Schema({ name: String, username: String, avatar: String, cover: String, activityStatus: String }, { _id: false });

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"] },
    username: { type: String, unique: true, sparse: true },
    usernameChangedAt: { type: Date },
    usernameConfirmedAt: { type: Date },
    inviteCode: { type: String, unique: true, sparse: true, select: false },
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
    birthdayChangedAt: { type: Date },
    // set once by its owner, and changed after that only by support
    gender: { type: String, enum: GENDERS },
    showBirthdayToFriends: { type: Boolean, default: true },
    onlineStatus: {
      type: String,
      default: "offline",
      enum: ["online", "offline"],
    },

    // only older accounts hold a hash here, kept in the schema so deleting an account can clear it
    password: { type: String, select: false },

    verified: { type: Boolean, default: false },
    role: { type: String, enum: ROLES, default: "user" },
    permissions: { type: [String], enum: PERMISSIONS, default: undefined },
    // shown beside the name: owner and admin follow the team, official marks Whisprl's own account
    tag: { type: String, enum: TAGS },
    // the old name for tag, written beside it until every deployment and app reads tag
    badge: { type: String, enum: TAGS },
    whisprlWelcomedAt: { type: Date },
    // the year Whisprl last wished them a happy birthday, so it never does twice in one
    birthdayGreetedIn: { type: Number },
    // set once the app's tour is finished or skipped, so it shows once an account rather than once a device
    touredAt: { type: Date },
    // whoever's invite link this account was made through, kept once so the inviter hears of it once
    invitedBy: { type: mongoose.Schema.ObjectId, ref: "User" },

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

    // nothing sets it now, but the schema keeps it so deleting an account still clears it from older ones
    notificationsAllowedAt: { type: Date },

    // End-to-end encryption: every public key the account has had, newest last
    publicKeys: [publicKeySchema],
    keyBackup: { type: keyBackupSchema, select: false },
    recoveryKeySavedAt: { type: Date },

    // the browsers and apps this account has used, so a login from any other is mailed to its owner
    knownDevices: { type: [knownDeviceSchema], select: false, default: undefined },

    // when a new account first reached each step of signing up, read only as counts and lists in the admin overview
    journey: { type: journeySchema },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ "deletion.dueAt": 1 }, { sparse: true });
userSchema.index({ "journey.startedAt": 1 }, { sparse: true });

userSchema.pre("save", function () {
  // everyone is their own friend, which is what lets them message themselves
  if (this.friends.length === 0) this.friends.push(this._id);
});

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
