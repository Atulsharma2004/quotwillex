/**
 * Admin access is gated by ADMIN_EMAILS in env — not by a client-writable DB flag.
 * Even if someone sets role:"admin" in MongoDB, they get no admin power unless
 * their email is allowlisted on the server.
 */
import User from "../models/User.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const getAdminEmailAllowlist = () => {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return new Set(
    raw
      .split(",")
      .map((e) => normalizeEmail(e))
      .filter(Boolean)
  );
};

export const isAdminEmail = (email) => {
  const allowlist = getAdminEmailAllowlist();
  if (!allowlist.size) return false;
  return allowlist.has(normalizeEmail(email));
};

/** Effective role for authorization — allowlist wins over DB. */
export const resolveEffectiveRole = (email) =>
  isAdminEmail(email) ? "admin" : "user";

/** Keep DB role in sync with allowlist (heals forged / stale role values). */
export const syncUserAdminRole = async (userDoc) => {
  if (!userDoc?._id) return "user";
  const role = resolveEffectiveRole(userDoc.email);
  if (userDoc.role !== role) {
    await User.updateOne({ _id: userDoc._id }, { $set: { role } });
  }
  return role;
};
