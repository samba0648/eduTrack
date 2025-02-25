import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Schema.Types.ObjectId;
  message: string;
  status: "unread" | "read";
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["unread", "read"], default: "unread" },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
