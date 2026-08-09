import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { searchLimiter } from "../middleware/rateLimiters.js";
import { moderateText } from "../utils/contentModeration.js";

const router = express.Router();

router.post("/check", authMiddleware, searchLimiter, async (req, res) => {
  try {
    const text = String(req.body?.text || "").slice(0, 4000);
    const language = req.body?.language || "english";
    const result = await moderateText(text, language);
    res.json(result);
  } catch {
    res.status(500).json({ message: "Moderation check failed" });
  }
});

export default router;
