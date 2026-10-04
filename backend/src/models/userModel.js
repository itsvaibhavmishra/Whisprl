import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = mongoose.Schema(
  {
    firstName: { type: String, required: [true, "First Name is required"] },
    lastName: { type: String, required: [true, "Last Name is required"] },
    avatar: { type: String },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
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

    // Passwords schema
    password: { type: String, required: [true, "Password is required"] },
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    passwordResetLastSent: { type: Date },

    // createdAt: { type: Date, default: Date.now() },
    // updatedAt: { type: Date },

    verified: { type: Boolean, default: false },

    // OTP schema
    otp: { type: String },
    otp_expiry_time: { type: Date },
    otp_last_sent_time: { type: Date },
    otp_verify_attempts: { type: Number },

    // Users friends
    friends: [{ type: mongoose.Schema.ObjectId, ref: "User" }],

    // Socials Added
    socialsConnected: {
      type: [String],
      enum: ["google", "github", "linkedin"],
    },
  },
  {
    timestamps: true,
  }
);

// hook for password
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password") || !this.password) return next();
    // hasing password
    this.password = await bcrypt.hash(this.password, 14);

    next();
  } catch (error) {
    next(error);
  }
});

// hook for otp
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("otp") || !this.otp) return next();
    // hasing otp
    this.otp = await bcrypt.hash(this.otp.toString(), 14);

    next();
  } catch (error) {
    next(error);
  }
});

// hook for default friend
userSchema.pre("save", async function (next) {
  try {
    // If friends array is empty, add the user's own _id
    if (this.friends.length === 0) {
      this.friends.push(this._id);
    }

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre("save", function (next) {
  try {
    if (!this.isModified("password") || this.isNew || !this.password)
      return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
  } catch (error) {
    next(error);
  }
});

// method for password decrypt
userSchema.methods.correctPassword = async function (
  canditatePassword, // provided by user
  userPassword, // from db
  next
) {
  try {
    return await bcrypt.compare(canditatePassword, userPassword);
  } catch (error) {
    next(error);
  }
};

// method for otp decrypt
userSchema.methods.correctOTP = async function (
  canditateOTP, // provided by user
  userOTP, // from db
  next
) {
  try {
    return await bcrypt.compare(canditateOTP, userOTP);
  } catch (error) {
    next(error);
  }
};

// method for changed password
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp, next) {
  try {
    if (this.passwordChangedAt) {
      const changedTimeStamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
      return JWTTimeStamp < changedTimeStamp;
    }

    // FALSE MEANS NOT CHANGED
    return false;
  } catch (error) {
    next(error);
  }
};

// method for reset password decrypt
userSchema.methods.createPasswordResetToken = async function (next) {
  try {
    const resetToken = crypto.randomBytes(32).toString("hex");

    // hashing passwordResetToken
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
  } catch (error) {
    next(error);
  }
};

// creating model for schema
const UserModel = mongoose.model("User", userSchema);

export default UserModel;
