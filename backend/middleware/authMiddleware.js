import {
  isAdminEmail,
  resolveEffectiveRole,
  syncUserAdminRole,
} from "../utils/adminAccess.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const attachUser = async (userId, tokenVersion) => {
  const dbUser = await User.findById(userId).select("role email tokenVersion");
  if (!dbUser) return null;

  const currentTv = dbUser.tokenVersion || 0;
  if (tokenVersion !== undefined && Number(tokenVersion) !== currentTv) {
    return null;
  }

  const role = resolveEffectiveRole(dbUser.email);
  if (dbUser.role !== role) {
    syncUserAdminRole(dbUser).catch(() => {});
  }

  return {
    id: dbUser._id.toString(),
    role,
    email: dbUser.email,
    tokenVersion: currentTv,
  };
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server auth misconfigured" });
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await attachUser(verified.id, verified.tv);
    if (!user) {
      return res.status(401).json({ message: "Invalid Token" });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    return res.status(401).json({ message: "Invalid Token" });
  }
};

/** Attach req.user when a valid token is present; never block the request. */
export const optionalAuth = async (req, _res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return next();

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    if (!process.env.JWT_SECRET) return next();
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await attachUser(verified.id, verified.tv);
    if (user) req.user = user;
  } catch {
    // ignore invalid token for public reads
  }
  next();
};

/** Must run after authMiddleware. Allowlist email required — DB role alone is never enough. */
export const requireAdmin = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "admin" || !isAdminEmail(req.user.email)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export default authMiddleware;
