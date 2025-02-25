// src/controllers/AttendanceController.ts
import { Request, Response } from "express";
import Attendance, { AttendanceStatus } from "../models/Attendance";
import UserFace from "../models/UserFace";
import User from "../models/User";
import FaceRecognitionService from "./FaceRecognitionService";
import { sendNotification } from "./NotificationController";

interface IUserFace {
  user: string; // or mongoose.Schema.Types.ObjectId
  faceEncoding: number[];
}

interface RecognizedUser {
  userId: string;
  name: string;
  email: string;
}
interface IUser {
  _id: string;
  name: string;
  email: string;
}

interface UsersForAttendance {
  id: string;
  isPresent: string;
}

/**
 * @desc Mark attendance using facial recognition
 * @route POST /api/attendance/mark
 */
export const getUsersForAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req?.file) {
      res.status(400).json({ message: "No face image provided" });
      return;
    }

    // Extract face encodings from the uploaded image
    const faceEncodings =
      await FaceRecognitionService.extractMultipleFaceEncodings(
        req.file.buffer
      );

    if (!faceEncodings || faceEncodings.length === 0) {
      res.status(400).json({ message: "No faces detected in the image" });
      return;
    }

    // Fetch all stored face encodings
    const allUserFaces = (await UserFace.find()) as IUserFace[];

    if (allUserFaces.length === 0) {
      res
        .status(400)
        .json({ message: "No enrolled users found. Please enroll first." });
      return;
    }

    let recognizedUsers: RecognizedUser[] = [];
    let recognizedUserIds = new Set<string>(); // To track recognized user IDs

    // Compare each detected face with stored encodings
    for (const faceEncoding of faceEncodings) {
      for (const userFace of allUserFaces) {
        const isMatch = await FaceRecognitionService.verifyFace(
          userFace.faceEncoding,
          faceEncoding
        );

        if (isMatch && !recognizedUserIds.has(userFace.user.toString())) {
          const user = (await User.findById(userFace.user)) as IUser;
          if (user) {
            recognizedUsers.push({
              userId: user._id.toString(),
              name: user?.name,
              email: user?.email,
            });
            recognizedUserIds.add(user._id.toString()); // Prevent duplicate entries
          }
        }
      }
    }

    if (recognizedUsers.length === 0) {
      res
        .status(401)
        .json({ message: "No recognized faces found. Please try again." });
      return;
    }

    res.status(200).json({
      message: "Users recognized successfully",
      recognizedUsers,
    });
  } catch (error) {
    console.error("Attendance marking error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const markAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users: UsersForAttendance[] = req?.body?.users ?? [];

    // Compare each detected face with stored encodings

    if (users.length === 0) {
      res.status(401).json({ message: "User list empty. Please try again." });
      return;
    }

    //Get current date and time
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    // Define today’s date range for attendance checking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let attendanceResults: any[] = [];
    let alreadyMarkedUsers: string[] = [];

    for (const user of users) {
      const existingAttendance = await Attendance.findOne({
        user: user.id,
        date: { $gte: today, $lt: tomorrow },
      });
      const status =
        user.isPresent === "true"
          ? AttendanceStatus.PRESENT
          : AttendanceStatus.ABSENT;
      if (!existingAttendance) {
        // Create and save attendance record
        const attendance = new Attendance({
          user: user.id,
          date: today,
          time: timeString,
          status,
        });

        await attendance.save();
        attendanceResults.push({
          user: user.id,
          status,
          time: timeString,
          date: today,
        });
      } else {
        alreadyMarkedUsers.push(user.id);
      }
      await sendNotification(user.id, status);
    }

    if (attendanceResults.length === 0) {
      res.status(400).json({
        message: "Attendance already marked for all recognized users today.",
        alreadyMarkedUsers,
      });
      return;
    }
    
    res.status(200).json({
      message: "Attendance marked successfully for recognized users",
      attendance: attendanceResults,
      alreadyMarkedUsers,
    });
  } catch (error) {
    console.error("Attendance marking error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @desc Get user's attendance history
 * @route GET /api/attendance/history
 */
export const getAttendanceHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.body.userId;
    const { startDate, endDate } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let query: any = { date: { $gte: today } };
    if (userId) {
      query = { user: userId };
    }

    if (startDate && endDate) {
      let _startDate = new Date(startDate as string);
      _startDate.setHours(0, 0, 0, 0);
      let _endDate = new Date(endDate as string);
      _endDate.setHours(23, 59, 59, 999);
      query.date = {
        $gte: _startDate,
        $lte: _endDate,
      };
    } else if (startDate) {
      let _startDate = new Date(startDate as string);
      _startDate.setHours(0, 0, 0, 0);
      query.date = {
        $gte: _startDate,
      };
    } else if (endDate) {
      let _endDate = new Date(endDate as string);
      _endDate.setHours(23, 59, 59, 999);
      query.date = {
        $lte: _endDate,
      };
    }

    const attendanceRecords = await Attendance.find(query).sort({ date: -1 });

    res.json(attendanceRecords);
  } catch (error) {
    console.error("Attendance history fetch error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @desc Get attendance report (Admin only)
 * @route GET /api/attendance/report
 */
export const getAttendanceReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date, status, userId } = req.query;

    let query: any = {};

    if (date) {
      const queryDate = new Date(date as string);
      query.date = {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999)),
      };
    }

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.user = userId;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate("user", "name email role")
      .sort({ date: -1 });

    res.json(attendanceRecords);
  } catch (error) {
    console.error("Attendance report fetch error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @desc Get attendance statistics (Admin only)
 * @route GET /api/attendance/stats
 */
export const getAttendanceStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};

    if (startDate && endDate) {
      dateQuery = {
        date: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    }

    // Get total attendance count by status
    const statusStats = await Attendance.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get daily attendance counts
    const dailyStats = await Attendance.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      statusStats,
      dailyStats,
    });
  } catch (error) {
    console.error("Attendance stats fetch error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
