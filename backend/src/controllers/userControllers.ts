import { Request, Response } from "express";
import User, { IUser, UserRole } from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import UserFace from "../models/UserFace";
import FaceRecognitionService from "./FaceRecognitionService";

// Secret Key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * @desc Register a new user
 * @route POST /api/users/register
 */

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req?.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({ message: "User already exists" }); // ✅ Added return
    }

    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);

      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const newUser: IUser = new User({
        name,
        email,
        password: hashedPassword,
        role: role || UserRole.STUDENT,
      });

      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
    } catch (bcryptError) {
      console.error("Bcrypt Error:", bcryptError);
      res.status(500).json({ message: "Password hashing failed", error: bcryptError });
    }
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


/**
 * @desc Login user & get token
 * @route POST /api/users/login
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user?.password ?? "");
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user?._id, role: user?.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: { id: user?._id, name: user?.name, email: user?.email, role: user?.role } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @desc Get user profile (requires authentication)
 * @route GET /api/users/profile
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req?.body?.userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @desc Get all users (Admin only)
 * @route GET /api/users
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @desc Enroll user's face
 * @route POST /api/users/enroll-face/:id
 */
export const enrollUserFace = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req?.file) {
      res.status(400).json({ message: "No image provided" });
      return;
    }

    const userId = req.body.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    // Extract face encoding
    const faceEncoding = await FaceRecognitionService.extractFaceEncoding(req?.file?.buffer);
    
    if (!faceEncoding) {
      res.status(400).json({ message: "No face detected in the image" });
      return;
    }

    // Check if user already has face enrollment
    let userFace = await UserFace.findOne({ user: userId });
    
    if (userFace) {
      // Update existing face encoding
      userFace.faceEncoding = faceEncoding;
      await userFace.save();
    } else {
      // Create new face enrollment
      userFace = new UserFace({
        user: userId,
        faceEncoding
      });
      await userFace.save();
    }

    res.status(200).json({ message: "Face enrolled successfully" });
  } catch (error) {
    console.error("Face enrollment error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};