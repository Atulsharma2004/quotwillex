import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      select: false,
    },
    googleId: { type: String, sparse: true, unique: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    profilePicture: { type: String, default: "/default-avatar.svg" },
    bio: { type: String, default: "", maxlength: 500 },
    /** Private account details — only returned on own profile. */
    mobileNumber: { type: String, default: "", trim: true },
    dateOfBirth: { type: Date, default: null },
    city: { type: String, default: "", trim: true, maxlength: 80 },
    state: { type: String, default: "", trim: true, maxlength: 80 },
    country: { type: String, default: "", trim: true, maxlength: 80 },
    instagram: { type: String, default: "", trim: true, maxlength: 60 },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      // Never trust client-supplied role; authorization uses ADMIN_EMAILS.
    },
    /** Denormalized counts — follow edges live in Follow collection. */
    followerCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    postCount: { type: Number, default: 0, min: 0 },
    /** +1 each time this user's quote is selected as Quote of the Day. */
    qotdStars: { type: Number, default: 0, min: 0 },

    /** Local accounts must verify email before login. Google accounts are trusted. */
    emailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    /** Blocked abusive post/comment attempts; alert at 10. */
    abuseStrikeCount: { type: Number, default: 0, min: 0 },
    abuseAlertSentAt: { type: Date, default: null },

    /** Bumped on password change/reset so older JWTs stop working. */
    tokenVersion: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ createdAt: -1 });
UserSchema.index({ qotdStars: -1, createdAt: -1 });
UserSchema.index({ name: "text", username: "text" });

// Force role from server allowlist whenever a user document is saved.
UserSchema.pre("validate", async function forceAdminRoleFromAllowlist(next) {
  try {
    const { resolveEffectiveRole } = await import("../utils/adminAccess.js");
    this.role = resolveEffectiveRole(this.email);
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("User", UserSchema);
