import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "01842c56-03cc-4f98-b6d1-2f6e13fd3a65";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Helper function to verify the token
const verifyToken = (req: Request, res: Response): { id: string; role: string } | null => {
  const authHeader: string | undefined = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token, authorization denied" });
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    return decoded;
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
    return null;
  }
};

// Middleware to protect routes (Authenticated users only)
export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  req.userId = decoded.id;
  req.userRole = decoded.role;
  next();
};

// Middleware for Admin-only access
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  if (decoded.role !== "admin") {
    res.status(403).json({ message: "Access denied, Admins only" });
    return;
  }

  req.userId = decoded.id;
  req.userRole = decoded.role;
  next();
};

// Middleware for Teacher-only access (Admins also allowed)
export const teacherOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  if (decoded.role !== "teacher" && decoded.role !== "admin") {
    res.status(403).json({ message: "Access denied, Teachers only" });
    return;
  }

  req.userId = decoded.id;
  req.userRole = decoded.role;
  next();
};
