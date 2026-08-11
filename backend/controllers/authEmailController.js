import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  createEmailToken,
  hashEmailToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  isTransactionalMailConfigured,
} from "../utils/mail.js";
import { createAccessToken } from "../utils/accessToken.js";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

const signAccessToken = (user) => createAccessToken(user);

export const verifyEmail = async (req, res) => {
  try {
    const token = String(req.body?.token || req.query?.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const hash = hashEmailToken(token);
    const user = await User.findOne({
      emailVerifyTokenHash: hash,
      emailVerifyExpires: { $gt: new Date() },
    }).select("+emailVerifyTokenHash +emailVerifyExpires");

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification link" });
    }

    user.emailVerified = true;
    user.emailVerifyTokenHash = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully. You can log in now." });
  } catch (error) {
    console.error("[verify-email]", error.message);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    if (!isTransactionalMailConfigured()) {
      return res.status(503).json({
        message: "Email service is not configured yet. Please try again later.",
      });
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select(
      "+emailVerifyTokenHash +emailVerifyExpires +password"
    );

    // Same response whether or not the user exists (no enumeration).
    const okMessage =
      "If an unverified account exists for that email, a new link was sent.";

    if (
      !user ||
      user.emailVerified ||
      user.authProvider === "google"
    ) {
      return res.json({ message: okMessage });
    }

    const { raw, hash } = createEmailToken();
    user.emailVerifyTokenHash = hash;
    user.emailVerifyExpires = new Date(Date.now() + VERIFY_TTL_MS);
    await user.save();

    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: raw,
    });

    res.json({ message: okMessage });
  } catch (error) {
    console.error("[resend-verification]", error.message);
    res.status(500).json({ message: "Could not resend verification email" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    if (!isTransactionalMailConfigured()) {
      return res.status(503).json({
        message: "Email service is not configured yet. Please try again later.",
      });
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const okMessage =
      "If an account exists for that email, a password reset link was sent.";

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || user.authProvider === "google" || !user.password) {
      return res.json({ message: okMessage });
    }

    const { raw, hash } = createEmailToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: raw,
    });

    res.json({ message: okMessage });
  } catch (error) {
    console.error("[forgot-password]", error.message);
    res.status(500).json({ message: "Could not send reset email" });
  }
};

/** Logged-in user forgot current password — send reset link to their account email. */
export const requestPasswordReset = async (req, res) => {
  try {
    if (!isTransactionalMailConfigured()) {
      return res.status(503).json({
        message: "Email service is not configured yet. Please try again later.",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google Sign-In. Password reset is not available.",
      });
    }
    if (!user.password) {
      return res.status(400).json({
        message: "Password reset is not available for this account.",
      });
    }

    const { raw, hash } = createEmailToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: raw,
    });

    res.json({
      message:
        "Password reset link sent to your email. Open it to choose a new password.",
      email: user.email,
    });
  } catch (error) {
    console.error("[request-password-reset]", error.message);
    res.status(500).json({ message: "Could not send reset email" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const password = req.body?.password;

    if (!token || typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const hash = hashEmailToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: hash,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetTokenHash +passwordResetExpires");

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset link" });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.emailVerified = true;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    try {
      await sendPasswordChangedEmail({ to: user.email, name: user.name });
    } catch (err) {
      console.error("[password-changed-mail]", err.message);
    }

    res.json({ message: "Password updated. You can log in now." });
  } catch (error) {
    console.error("[reset-password]", error.message);
    res.status(500).json({ message: "Could not reset password" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google Sign-In. Password change is not available.",
      });
    }
    if (!user.password) {
      return res.status(400).json({ message: "Password change is not available" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    try {
      if (isTransactionalMailConfigured()) {
        await sendPasswordChangedEmail({ to: user.email, name: user.name });
      }
    } catch (err) {
      console.error("[password-changed-mail]", err.message);
    }

    res.json({
      message: "Password updated successfully",
      token: signAccessToken(user),
    });
  } catch (error) {
    console.error("[change-password]", error.message);
    res.status(500).json({ message: "Could not change password" });
  }
};
