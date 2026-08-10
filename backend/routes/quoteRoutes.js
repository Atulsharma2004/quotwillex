import express from "express";
import {
  createQuote,
  createPopularQuote,
  bulkCreatePopularQuotes,
  deleteQuote,
  updateQuote,
  likeQuote,
  dislikeQuote,
  commentQuote,
  loadQuotes,
  loadPopularQuotes,
  loadGuestQuotes,
  loadHomeShowcase,
  loadQuoteOfTheDay,
  editComment,
  deleteComment,
} from "../controllers/quoteController.js";
import { loadAwardsLeaderboard } from "../controllers/awardsController.js";
import authMiddleware, {
  requireAdmin,
} from "../middleware/authMiddleware.js";
import { searchLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/", authMiddleware, createQuote);
router.get("/", authMiddleware, loadQuotes);
router.get("/quote-of-the-day", loadQuoteOfTheDay);
router.get("/awards", loadAwardsLeaderboard);
router.get("/showcase", loadHomeShowcase);
router.get("/guest", searchLimiter, loadGuestQuotes);
router.post("/popular/bulk", authMiddleware, requireAdmin, bulkCreatePopularQuotes);
router.post("/popular", authMiddleware, requireAdmin, createPopularQuote);
router.get("/popular", authMiddleware, loadPopularQuotes);
router.put("/:id", authMiddleware, updateQuote);
router.delete("/:id", authMiddleware, deleteQuote);
router.put("/:id/like", authMiddleware, likeQuote);
router.put("/:id/dislike", authMiddleware, dislikeQuote);
router.put("/:id/comment", authMiddleware, commentQuote);
router.put("/:id/comment/:commentId", authMiddleware, editComment);
router.delete("/:id/comment/:commentId", authMiddleware, deleteComment);

export default router;
