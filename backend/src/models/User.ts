import mongoose, { Schema, Document } from "mongoose";

// Define user roles
export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  PARENT = "parent",
  ADMIN = "admin",
}

// Define the User interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  section: string|null;
}

// Define the User Schema
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    section:{
      type: String,
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

export default mongoose.model<IUser>("User", UserSchema);
