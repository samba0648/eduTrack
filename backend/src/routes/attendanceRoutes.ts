
// src/routes/attendanceRoutes.ts
import express from "express";
import {
  getUsersForAttendance,
  getAttendanceHistory,
  getAttendanceReport,
  getAttendanceStats,
  markAttendance
} from "../controllers/attendanceController";
import multer from "multer";
import { protect, teacherOnly } from "../middlewares/authMiddleware";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Attendance routes
router.post("/getUsers", upload.single("faceImage"), teacherOnly, getUsersForAttendance);
router.post("/mark", teacherOnly, markAttendance);
router.get("/history", protect, getAttendanceHistory);
router.get("/report", protect, getAttendanceReport);
router.get("/stats", protect, getAttendanceStats);

export default router;
