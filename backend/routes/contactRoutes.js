import express from "express";
import {
  getContactStatus,
  submitContact,
} from "../controllers/contactController.js";
import { contactLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/status", getContactStatus);
router.post("/", contactLimiter, submitContact);

export default router;
