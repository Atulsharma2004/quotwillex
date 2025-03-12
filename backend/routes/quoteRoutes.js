import express from "express";
import { createQuote, deleteQuote, updateQuote, likeQuote, dislikeQuote, commentQuote, loadQuotes } from "../controllers/quoteController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createQuote);
router.get("/", authMiddleware, loadQuotes);
router.put("/:id", authMiddleware, updateQuote);
router.delete("/:id", authMiddleware, deleteQuote);
router.put("/:id/like", authMiddleware, likeQuote);
router.put("/:id/dislike", authMiddleware, dislikeQuote);
router.put("/:id/comment", authMiddleware, commentQuote);

export default router;
