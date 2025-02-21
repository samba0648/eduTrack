import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User"; // Import existing User model

// Define attendance status
export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
}

// Define the Attendance interface
export interface IAttendance extends Document {
  user: IUser["_id"];  // Reference to User
  date: Date;
  time: string;
  status: AttendanceStatus;
  faceEncoding?: number[]; // Optional: Store facial features for validation
}

// Define Attendance Schema
const AttendanceSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      required: true,
    },
    faceEncoding: {
      type: [Number],
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAttendance>("Attendance", AttendanceSchema);
