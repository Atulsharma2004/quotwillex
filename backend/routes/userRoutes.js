import express from "express";
import { registerUser, loginUser, updateUser } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProfile } from "../controllers/userController.js";
import {followUser, unfollowUser} from "../controllers/userController.js"


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/profile", authMiddleware, updateUser);
router.put("/follow/:id", authMiddleware, followUser);
router.put("/unfollow/:id", authMiddleware, unfollowUser);
// router.get("/:id", authMiddleware, getUserProfile); // ✅ Fetch user profile with post count
router.get("/profile", authMiddleware, getProfile);

export default router;
