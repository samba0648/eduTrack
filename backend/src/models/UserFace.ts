// src/models/UserFace.ts
import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";

export interface IUserFace extends Document {
  user: IUser["_id"];
  faceEncoding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const UserFaceSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    faceEncoding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUserFace>("UserFace", UserFaceSchema);