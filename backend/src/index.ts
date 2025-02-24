import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import connectDB from "./config/db";
import userRoutes from "./routes/userRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.send("Express + TypeScript + MongoDB Server is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
