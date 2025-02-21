import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Middleware to protect routes
export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader: string | undefined = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token, authorization denied" });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Invalid token format" });
      return;
    }

    // Verify Token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
    };
    req.body.userId = decoded.id;
    req.body.userRole = decoded.role;

    if (authHeader && token) {
      next();
    } // ✅ Only call next() if authentication succeeds
  } catch (error) {
    if (!res.headersSent) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  }
};

// Middleware for Admin-only access
export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== "admin") {
    res.status(403).json({ message: "Access denied, Admins only" });
  }
  next();
};
