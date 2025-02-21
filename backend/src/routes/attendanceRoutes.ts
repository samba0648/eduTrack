
// src/routes/attendanceRoutes.ts
import express from "express";
import {
  markAttendance,
  getAttendanceHistory,
  getAttendanceReport,
  getAttendanceStats
} from "../controllers/attendanceController";
import multer from "multer";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Attendance routes
router.post("/mark", upload.single("faceImage"), markAttendance);
router.get("/history/:userId", getAttendanceHistory);
router.get("/report", getAttendanceReport);
router.get("/stats", getAttendanceStats);

export default router;
