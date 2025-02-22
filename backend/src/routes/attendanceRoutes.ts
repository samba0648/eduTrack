
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
import { teacherOnly } from "../middlewares/authMiddleware";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Attendance routes
router.post("/getUsers", upload.single("faceImage"), teacherOnly, getUsersForAttendance);
router.post("/mark", upload.single("faceImage"), teacherOnly, markAttendance);
router.get("/history", getAttendanceHistory);
router.get("/report", getAttendanceReport);
router.get("/stats", getAttendanceStats);

export default router;
