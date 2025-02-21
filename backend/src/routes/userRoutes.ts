import express from "express";
import multer from "multer";
import { registerUser, loginUser, getUserProfile, getAllUsers, enrollUserFace } from "../controllers/userControllers";
import { protect, adminOnly } from "../middlewares/authMiddleware";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.get("/", protect, adminOnly, getAllUsers); // Admin-only route
router.post("/enroll-face", upload.single("faceImage"), enrollUserFace);

export default router;
