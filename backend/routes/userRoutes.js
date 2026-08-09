import express from "express";
import {
  registerUser,
  loginUser,
  googleAuthStart,
  googleAuthCallback,
  exchangeOAuthCode,
  updateUser,
  getProfile,
  getUserById,
  followUser,
  unfollowUser,
  checkUsername,
  searchUsers,
  listFollowers,
  listFollowing,
} from "../controllers/userController.js";
import {
  verifyEmail,
  resendVerification,
  forgotPassword,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from "../controllers/authEmailController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  authLimiter,
  loginLimiter,
  searchLimiter,
} from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/oauth/exchange", authLimiter, exchangeOAuthCode);
router.get("/google", authLimiter, googleAuthStart);
router.get("/google/callback", authLimiter, googleAuthCallback);

router.post("/verify-email", authLimiter, verifyEmail);
router.get("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post(
  "/request-password-reset",
  authMiddleware,
  authLimiter,
  requestPasswordReset
);
router.post("/reset-password", authLimiter, resetPassword);
router.put("/change-password", authMiddleware, loginLimiter, changePassword);

router.get("/check-username", authMiddleware, checkUsername);
router.get("/search", authMiddleware, searchLimiter, searchUsers);
router.put("/profile", authMiddleware, updateUser);
router.get("/profile", authMiddleware, getProfile);
router.get("/profile/followers", authMiddleware, listFollowers);
router.get("/profile/following", authMiddleware, listFollowing);
router.put("/follow/:id", authMiddleware, followUser);
router.put("/unfollow/:id", authMiddleware, unfollowUser);
router.get("/:id/followers", authMiddleware, listFollowers);
router.get("/:id/following", authMiddleware, listFollowing);
router.get("/:id", authMiddleware, getUserById);

export default router;
